import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { FieldValue } from 'firebase-admin/firestore';
import { sendEmail } from '@/lib/email/send';

export const dynamic = 'force-dynamic';

async function verifySession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('rotaract_portal_session')?.value;
  if (!sessionCookie) throw new Error('Unauthorized');
  return adminAuth.verifySessionCookie(sessionCookie, true);
}

type Params = { params: Promise<{ id: string }> };

// ─── POST /api/portal/committees/[id]/leave ───
export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const decoded = await verifySession();
    const { id } = await params;
    const uid = decoded.uid;

    const committeeDoc = await adminDb.collection('committees').doc(id).get();
    if (!committeeDoc.exists) {
      return NextResponse.json({ error: 'Committee not found' }, { status: 404 });
    }

    const committee = committeeDoc.data()!;
    const memberIds: string[] = committee.memberIds || [];
    const waitlistIds: string[] = committee.waitlistIds || [];
    const committeeName: string = committee.name || 'the committee';
    const capacity: number = committee.capacity ?? 5;

    const inCommittee = memberIds.includes(uid);
    const onWaitlist = waitlistIds.includes(uid);

    if (!inCommittee && !onWaitlist) {
      return NextResponse.json({ error: 'You are not a member of this committee' }, { status: 400 });
    }

    const batch = adminDb.batch();
    const committeeRef = adminDb.collection('committees').doc(id);
    const memberRef = adminDb.collection('members').doc(uid);

    if (onWaitlist) {
      // Just remove from waitlist
      batch.update(committeeRef, {
        waitlistIds: FieldValue.arrayRemove(uid),
        updatedAt: FieldValue.serverTimestamp(),
      });
      await batch.commit();
      return NextResponse.json({ status: 'left_waitlist', message: `Removed from ${committeeName} waitlist.` });
    }

    // Remove from committee members
    batch.update(committeeRef, {
      memberIds: FieldValue.arrayRemove(uid),
      updatedAt: FieldValue.serverTimestamp(),
    });
    batch.update(memberRef, {
      committeeId: FieldValue.delete(),
      committee: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();

    // Auto-promote first person on waitlist if capacity not unlimited
    const remainingMembers = memberIds.filter((m) => m !== uid);
    const shouldPromote = (capacity === 0 || remainingMembers.length < capacity) && waitlistIds.length > 0;

    if (shouldPromote) {
      const promoteeId = waitlistIds[0];
      const promoteeDoc = await adminDb.collection('members').doc(promoteeId).get();

      if (promoteeDoc.exists) {
        const promoteeData = promoteeDoc.data()!;
        const promoteeBatch = adminDb.batch();

        promoteeBatch.update(committeeRef, {
          memberIds: FieldValue.arrayUnion(promoteeId),
          waitlistIds: FieldValue.arrayRemove(promoteeId),
          updatedAt: FieldValue.serverTimestamp(),
        });
        promoteeBatch.update(adminDb.collection('members').doc(promoteeId), {
          committeeId: id,
          committee: committeeName,
          updatedAt: FieldValue.serverTimestamp(),
        });
        await promoteeBatch.commit();

        // Send email + portal notification to promoted member
        if (promoteeData.email) {
          sendEmail({
            to: promoteeData.email,
            subject: `You've been added to ${committeeName} — Rotaract NYC`,
            html: `
              <p>Hi ${promoteeData.firstName || promoteeData.displayName},</p>
              <p>A spot opened up and you've been automatically moved from the waitlist into the <strong>${committeeName}</strong> committee!</p>
              <p>You can view your committee workspace in the <a href="https://rotaractnyc.org/portal/committees">member portal</a>.</p>
              <p>— Rotaract NYC</p>
            `,
          }).catch((err) => console.error('Waitlist promotion email failed:', err));
        }
      }
    }

    return NextResponse.json({ status: 'left', message: `You've left ${committeeName}.` });
  } catch (error) {
    console.error('Error leaving committee:', error);
    return NextResponse.json({ error: 'Failed to leave committee' }, { status: 500 });
  }
}
