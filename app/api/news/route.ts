import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const snapshot = await adminDb
      .collection('articles')
      .where('status', '==', 'published')
      .orderBy('publishedAt', 'desc')
      .limit(20)
      .get();

    const articles = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    const { defaultArticles } = await import('@/lib/defaults/data');
    return NextResponse.json(defaultArticles);
  }
}
