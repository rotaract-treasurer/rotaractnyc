import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';
import { cookies } from 'next/headers';

// Get dues status for current member
export async function GET() {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('rotaract_portal_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { uid } = await adminAuth.verifySessionCookie(sessionCookie, true);

    // Get current dues cycle
    const cycleSnap = await adminDb
      .collection('duesCycles')
      .where('active', '==', true)
      .limit(1)
      .get();

    if (cycleSnap.empty) {
      return NextResponse.json({ cycle: null, status: null });
    }

    const cycle = { id: cycleSnap.docs[0].id, ...cycleSnap.docs[0].data() };

    // Get member's dues for this cycle
    const duesSnap = await adminDb
      .collection('memberDues')
      .where('memberId', '==', uid)
      .where('cycleId', '==', cycle.id)
      .limit(1)
      .get();

    const dues = duesSnap.empty ? null : { id: duesSnap.docs[0].id, ...duesSnap.docs[0].data() };

    return NextResponse.json({ cycle, dues });
  } catch (error) {
    console.error('Error fetching dues:', error);
    return NextResponse.json({ error: 'Failed to fetch dues' }, { status: 500 });
  }
}
