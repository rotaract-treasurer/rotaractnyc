import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

/**
 * POST /api/portal/push/subscribe
 *
 * Stores a Firebase Cloud Messaging (FCM) registration token for the
 * authenticated member. Tokens are stored as documents under
 * members/{uid}/pushTokens/{token} so we can prune them individually when
 * FCM reports them as invalid.
 *
 * Body: { token: string, userAgent?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('rotaract_portal_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { uid } = await adminAuth.verifySessionCookie(sessionCookie, true);

    const { token, userAgent } = await request.json();
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'token required' }, { status: 400 });
    }

    await adminDb
      .collection('members')
      .doc(uid)
      .collection('pushTokens')
      .doc(token)
      .set(
        {
          userAgent: userAgent || null,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error subscribing to push:', error);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}

/**
 * DELETE /api/portal/push/subscribe?token=...
 *
 * Removes a single FCM token (called on sign-out or when the user disables
 * push in their preferences).
 */
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('rotaract_portal_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { uid } = await adminAuth.verifySessionCookie(sessionCookie, true);

    const token = new URL(request.url).searchParams.get('token');
    if (!token) {
      return NextResponse.json({ error: 'token required' }, { status: 400 });
    }

    await adminDb
      .collection('members')
      .doc(uid)
      .collection('pushTokens')
      .doc(token)
      .delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
  }
}
