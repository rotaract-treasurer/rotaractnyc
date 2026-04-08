import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { createHash } from 'crypto';
import { rateLimit, getRateLimitKey, rateLimitResponse } from '@/lib/rateLimit';

function hashIP(ip: string): string {
  return createHash('sha256')
    .update(ip + (process.env.RATE_LIMIT_SALT || 'rotaract'))
    .digest('hex')
    .slice(0, 16);
}

function getIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || 'unknown';
}

/** GET — check whether the current visitor has already liked this article */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const ipHash = hashIP(getIP(request));

    const snap = await adminDb
      .collection('articles')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 },
      );
    }

    const data = snap.docs[0].data();
    const likedByIPs: string[] = data.likedByIPs || [];

    return NextResponse.json({
      liked: likedByIPs.includes(ipHash),
      likeCount: data.likeCount || 0,
    });
  } catch (error) {
    console.error('Error checking like status:', error);
    return NextResponse.json(
      { error: 'Failed to check like status' },
      { status: 500 },
    );
  }
}

/** POST — toggle like for the current visitor */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    // Rate limit: 20 toggles per IP per minute
    const rlKey = getRateLimitKey(request, `likes:${slug}`);
    const rl = await rateLimit(rlKey, { max: 20, windowSec: 60 });
    if (!rl.allowed) {
      return rateLimitResponse(rl.resetAt);
    }

    const ipHash = hashIP(getIP(request));

    const snap = await adminDb
      .collection('articles')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 },
      );
    }

    const articleDoc = snap.docs[0];
    const articleRef = adminDb.collection('articles').doc(articleDoc.id);

    // Use a transaction for atomic read-then-write
    const result = await adminDb.runTransaction(async (t) => {
      const doc = await t.get(articleRef);
      if (!doc.exists) throw new Error('Article not found');

      const data = doc.data()!;
      const likedByIPs: string[] = data.likedByIPs || [];
      const currentCount = data.likeCount || 0;

      if (likedByIPs.includes(ipHash)) {
        // Unlike
        t.update(articleRef, {
          likedByIPs: likedByIPs.filter((h) => h !== ipHash),
          likeCount: Math.max(0, currentCount - 1),
        });
        return { liked: false, likeCount: Math.max(0, currentCount - 1) };
      } else {
        // Like
        t.update(articleRef, {
          likedByIPs: [...likedByIPs, ipHash],
          likeCount: currentCount + 1,
        });
        return { liked: true, likeCount: currentCount + 1 };
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error toggling article like:', error);
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 },
    );
  }
}
