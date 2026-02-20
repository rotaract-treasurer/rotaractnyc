import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, serializeDoc } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

// ─── helpers ───
async function verifySession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('rotaract_portal_session')?.value;
  if (!sessionCookie) throw new Error('Unauthorized');
  const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
  return decoded;
}

async function getMemberData(uid: string) {
  const snap = await adminDb.collection('members').doc(uid).get();
  return snap.exists ? { id: uid, role: '', ...snap.data() } as { id: string; role: string; [key: string]: any } : null;
}

type Params = { params: Promise<{ id: string }> };

// ─── GET /api/portal/committees/[id] ───
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await verifySession();
    const { id } = await params;

    const doc = await adminDb.collection('committees').doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Committee not found' }, { status: 404 });
    }

    return NextResponse.json(serializeDoc({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching committee:', error);
    return NextResponse.json({ error: 'Failed to fetch committee' }, { status: 500 });
  }
}

// ─── PATCH /api/portal/committees/[id] — edit (board, chair, or co-chair) ───
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const decoded = await verifySession();
    const { id } = await params;
    const member = await getMemberData(decoded.uid);

    const committeeDoc = await adminDb.collection('committees').doc(id).get();
    if (!committeeDoc.exists) {
      return NextResponse.json({ error: 'Committee not found' }, { status: 404 });
    }
    const committee = committeeDoc.data()!;

    const isBoard = member && ['president', 'board', 'treasurer'].includes(member.role as string);
    const isChair = committee.chairId === decoded.uid || committee.coChairId === decoded.uid;

    if (!isBoard && !isChair) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const allowed = [
      'name', 'description', 'capacity', 'driveURL', 'meetingCadence',
      'chairId', 'chairName', 'coChairId', 'coChairName',
    ];
    const updates: Record<string, any> = { updatedAt: FieldValue.serverTimestamp() };
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    // Board-only: capacity changes
    if ('capacity' in updates && !isBoard) {
      delete updates.capacity;
    }

    await adminDb.collection('committees').doc(id).update(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating committee:', error);
    return NextResponse.json({ error: 'Failed to update committee' }, { status: 500 });
  }
}

// ─── DELETE /api/portal/committees/[id] — president only ───
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const decoded = await verifySession();
    const { id } = await params;
    const member = await getMemberData(decoded.uid);

    if (!member || member.role !== 'president') {
      return NextResponse.json({ error: 'Forbidden — president only' }, { status: 403 });
    }

    const committeeDoc = await adminDb.collection('committees').doc(id).get();
    if (!committeeDoc.exists) {
      return NextResponse.json({ error: 'Committee not found' }, { status: 404 });
    }

    // Clear committeeId from all members in this committee
    const data = committeeDoc.data()!;
    const memberIds: string[] = data.memberIds || [];
    const waitlistIds: string[] = data.waitlistIds || [];
    const allIds = [...memberIds, ...waitlistIds];

    const batch = adminDb.batch();
    for (const mid of allIds) {
      batch.update(adminDb.collection('members').doc(mid), {
        committeeId: FieldValue.delete(),
        committee: FieldValue.delete(),
      });
    }
    batch.delete(adminDb.collection('committees').doc(id));
    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting committee:', error);
    return NextResponse.json({ error: 'Failed to delete committee' }, { status: 500 });
  }
}
