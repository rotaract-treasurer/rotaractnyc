import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, serializeDoc } from '@/lib/firebase/admin';
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

// ─── POST /api/portal/committees/[id]/join ───
export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const decoded = await verifySession();
    const { id } = await params;
    const uid = decoded.uid;

    const [committeeDoc, memberDoc] = await Promise.all([
      adminDb.collection('committees').doc(id).get(),
      adminDb.collection('members').doc(uid).get(),
    ]);

    if (!committeeDoc.exists) {
      return NextResponse.json({ error: 'Committee not found' }, { status: 404 });
    }
    if (!memberDoc.exists || memberDoc.data()?.status !== 'active') {
      return NextResponse.json({ error: 'Active membership required' }, { status: 403 });
    }

    const committee = committeeDoc.data()!;
    const memberIds: string[] = committee.memberIds || [];
    const waitlistIds: string[] = committee.waitlistIds || [];
    const capacity: number = committee.capacity ?? 5;
    const memberName = memberDoc.data()!.displayName || '';
    const committeeName = committee.name || '';

    // Already a member
    if (memberIds.includes(uid)) {
      return NextResponse.json({ status: 'already_member' });
    }
    // Already on waitlist
    if (waitlistIds.includes(uid)) {
      return NextResponse.json({ status: 'already_waitlisted' });
    }

    // Check capacity (0 = unlimited)
    const atCapacity = capacity > 0 && memberIds.length >= capacity;
    const batch = adminDb.batch();
    const committeeRef = adminDb.collection('committees').doc(id);
    const memberRef = adminDb.collection('members').doc(uid);

    if (atCapacity) {
      // Add to waitlist
      batch.update(committeeRef, {
        waitlistIds: FieldValue.arrayUnion(uid),
        updatedAt: FieldValue.serverTimestamp(),
      });
      await batch.commit();
      return NextResponse.json({ status: 'waitlisted', message: `Added to the ${committeeName} waitlist.` });
    } else {
      // Add to committee
      batch.update(committeeRef, {
        memberIds: FieldValue.arrayUnion(uid),
        updatedAt: FieldValue.serverTimestamp(),
      });
      batch.update(memberRef, {
        committeeId: id,
        committee: committeeName,
        updatedAt: FieldValue.serverTimestamp(),
      });
      await batch.commit();
      return NextResponse.json({ status: 'joined', message: `You've joined ${committeeName}.` });
    }
  } catch (error) {
    console.error('Error joining committee:', error);
    return NextResponse.json({ error: 'Failed to join committee' }, { status: 500 });
  }
}
