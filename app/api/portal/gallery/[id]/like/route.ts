import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * POST /api/portal/gallery/[id]/like
 *
 * Toggles a like on a gallery photo for the authenticated member.
 * Uses a Firestore transaction to atomically update likes count + likedBy array.
 *
 * Returns: { liked: boolean, likes: number }
 *   liked=true  → the member has now liked the photo
 *   liked=false → the member has now un-liked the photo
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Auth check
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let uid: string;
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      uid = decoded.uid;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const photoId = params.id;
    const photoRef = adminDb.collection('gallery').doc(photoId);

    // Transactionally toggle like
    const result = await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(photoRef);
      if (!snap.exists) throw new Error('Photo not found');

      const data = snap.data()!;
      const likedBy: string[] = data.likedBy || [];
      const alreadyLiked = likedBy.includes(uid);

      if (alreadyLiked) {
        tx.update(photoRef, {
          likes: FieldValue.increment(-1),
          likedBy: FieldValue.arrayRemove(uid),
        });
        return { liked: false, likes: Math.max(0, (data.likes || 0) - 1) };
      } else {
        tx.update(photoRef, {
          likes: FieldValue.increment(1),
          likedBy: FieldValue.arrayUnion(uid),
        });
        return { liked: true, likes: (data.likes || 0) + 1 };
      }
    });

    return NextResponse.json(result);
  } catch (err: any) {
    if (err.message === 'Photo not found') {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }
    console.error('like route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
