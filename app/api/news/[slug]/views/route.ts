import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { rateLimit, getRateLimitKey } from '@/lib/rateLimit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    // Find the article by slug
    const snap = await adminDb
      .collection('articles')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const articleDoc = snap.docs[0];
    const articleId = articleDoc.id;

    // Rate limit: 1 view per IP per article per hour
    const ipKey = getRateLimitKey(request, `views:${slug}`);
    const rl = await rateLimit(ipKey, { max: 1, windowSec: 3600 });

    if (!rl.allowed) {
      // Already counted this view recently — return current count
      return NextResponse.json({ viewCount: articleDoc.data().viewCount || 0 });
    }

    // Increment view count
    const ref = adminDb.collection('articles').doc(articleId);
    const currentCount = articleDoc.data().viewCount || 0;
    const newCount = currentCount + 1;
    await ref.update({ viewCount: newCount });

    return NextResponse.json({ viewCount: newCount });
  } catch (error) {
    console.error('Error tracking article view:', error);
    return NextResponse.json(
      { error: 'Failed to track view' },
      { status: 500 },
    );
  }
}
