import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

async function verifySession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('rotaract_portal_session')?.value;
  if (!sessionCookie) throw new Error('Unauthorized');
  return adminAuth.verifySessionCookie(sessionCookie, true);
}

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/portal/committees/[id]/close-year
 * Snapshots the current roster into termHistory and resets for the new year.
 * Body: { handoffNote?: string, year: string } — year e.g. "2025-2026"
 * Requires: board, chair, or co-chair.
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const decoded = await verifySession();
    const { id } = await params;

    const [committeeDoc, actorDoc] = await Promise.all([
      adminDb.collection('committees').doc(id).get(),
      adminDb.collection('members').doc(decoded.uid).get(),
    ]);

    if (!committeeDoc.exists) {
      return NextResponse.json({ error: 'Committee not found' }, { status: 404 });
    }

    const committee = committeeDoc.data()!;
    const actor = actorDoc.data();

    const isBoard = actor && ['president', 'board', 'treasurer'].includes(actor.role);
    const isChair =
      committee.chairId === decoded.uid || committee.coChairId === decoded.uid;

    if (!isBoard && !isChair) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { handoffNote, year } = body;

    if (!year?.trim()) {
      return NextResponse.json({ error: 'year is required (e.g. "2025-2026")' }, { status: 400 });
    }

    // Build member names snapshot
    const memberIds: string[] = committee.memberIds || [];
    const memberSnaps = await Promise.all(
      memberIds.map((mid) => adminDb.collection('members').doc(mid).get()),
    );
    const memberNames = memberSnaps
      .filter((s) => s.exists)
      .map((s) => s.data()!.displayName || '');

    const termEntry = {
      year: year.trim(),
      chairId: committee.chairId || decoded.uid,
      chairName: committee.chairName || actor?.displayName || '',
      memberIds,
      memberNames,
      memberCount: memberIds.length,
      handoffNote: handoffNote?.trim() || '',
      closedAt: new Date().toISOString(),
    };

    const currentYear = new Date().getFullYear();

    await adminDb.collection('committees').doc(id).update({
      termHistory: FieldValue.arrayUnion(termEntry),
      lastRefreshedYear: currentYear,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Mark actor as confirmed for this year
    await adminDb.collection('members').doc(decoded.uid).update({
      lastConfirmedYear: currentYear,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, termEntry });
  } catch (error) {
    console.error('Error closing out committee year:', error);
    return NextResponse.json({ error: 'Failed to close out year' }, { status: 500 });
  }
}
