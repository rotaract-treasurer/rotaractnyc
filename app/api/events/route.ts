import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const snapshot = await adminDb
      .collection('events')
      .where('isPublic', '==', true)
      .where('status', '==', 'published')
      .orderBy('date', 'asc')
      .limit(20)
      .get();

    const events = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    // Return default events as fallback
    const { defaultEvents } = await import('@/lib/defaults/data');
    return NextResponse.json(defaultEvents);
  }
}
