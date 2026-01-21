import { NextRequest, NextResponse } from 'next/server';
import { getActiveDuesCycle, getMemberDues } from '@/lib/firebase/duesCycles';

/**
 * GET /api/portal/dues-status
 * Returns active cycle and member dues status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json(
        { error: 'memberId required' },
        { status: 400 }
      );
    }

    // Get active cycle
    const cycle = await getActiveDuesCycle();
    if (!cycle) {
      return NextResponse.json({ cycle: null, memberDues: null });
    }

    // Get member dues for active cycle
    const memberDues = await getMemberDues(memberId, cycle.id);

    // Convert Firestore Timestamps to ISO strings for client
    const serializedCycle = {
      ...cycle,
      startDate: cycle.startDate instanceof Date 
        ? cycle.startDate.toISOString() 
        : cycle.startDate.toDate().toISOString(),
      endDate: cycle.endDate instanceof Date 
        ? cycle.endDate.toISOString() 
        : cycle.endDate.toDate().toISOString(),
      createdAt: cycle.createdAt instanceof Date 
        ? cycle.createdAt.toISOString() 
        : cycle.createdAt.toDate().toISOString(),
      updatedAt: cycle.updatedAt instanceof Date 
        ? cycle.updatedAt.toISOString() 
        : cycle.updatedAt.toDate().toISOString(),
    };

    return NextResponse.json({
      cycle: serializedCycle,
      memberDues,
    });
  } catch (error: any) {
    console.error('Error fetching dues status:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
