import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, serializeDoc } from '@/lib/firebase/admin';
import { rateLimit, getRateLimitKey, rateLimitResponse } from '@/lib/rateLimit';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';
import { cookies } from 'next/headers';

/** Revalidate any public pages that depend on the members collection. */
function revalidateMemberPages() {
  try {
    revalidatePath('/leadership');
    revalidatePath('/');
  } catch {
    /* best-effort */
  }
}

const BOARD_ROLES = ['president', 'board', 'treasurer'] as const;

// ─── helpers ───
async function verifySession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('rotaract_portal_session')?.value;
  if (!sessionCookie) throw new Error('Unauthorized');
  const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
  return decoded;
}

async function getMemberRole(uid: string) {
  const snap = await adminDb.collection('members').doc(uid).get();
  return snap.exists ? (snap.data()?.role as string) : null;
}

// ─── GET members (portal-only) ───
export async function GET(request: NextRequest) {
  try {
    await verifySession();

    // Only return active members to protect the directory
    const snapshot = await adminDb
      .collection('members')
      .where('status', '==', 'active')
      .orderBy('displayName')
      .get();

    const members = snapshot.docs.map((doc) => serializeDoc({
      uid: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}

// ─── POST — create a new member (board / president only) ───
export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(getRateLimitKey(request, 'portal-members'), { max: 20, windowSec: 60 });
  if (!rateLimitResult.allowed) return rateLimitResponse(rateLimitResult.resetAt);

  try {
    const decoded = await verifySession();
    const role = await getMemberRole(decoded.uid);
    if (!role || !['president', 'board', 'treasurer'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      role: memberRole = 'member',
      status = 'active',
      memberType,
      committee,
      phone,
      birthday,
      occupation,
      employer,
      linkedIn,
      bio,
    } = body;

    // Validation
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
        { status: 400 },
      );
    }

    // Check for duplicate email
    const existing = await adminDb
      .collection('members')
      .where('email', '==', email.toLowerCase().trim())
      .limit(1)
      .get();
    if (!existing.empty) {
      return NextResponse.json(
        { error: 'A member with this email already exists' },
        { status: 409 },
      );
    }

    const displayName = `${firstName.trim()} ${lastName.trim()}`;
    const now = new Date().toISOString();

    const memberData: Record<string, any> = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      displayName,
      email: email.toLowerCase().trim(),
      role: memberRole,
      status: 'pending',
      onboardingComplete: false,
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
      invitedAt: now,
    };

    // Optional fields — only include if provided
    if (memberType) memberData.memberType = memberType;
    if (committee) memberData.committee = committee.trim();
    if (phone) memberData.phone = phone.trim();
    if (birthday) memberData.birthday = birthday;
    if (occupation) memberData.occupation = occupation.trim();
    if (employer) memberData.employer = employer.trim();
    if (linkedIn) memberData.linkedIn = linkedIn.trim();
    if (bio) memberData.bio = bio.trim();

    const docRef = await adminDb.collection('members').add(memberData);

    // Send invitation email
    try {
      const { sendEmail } = await import('@/lib/email/send');
      const { inviteEmail } = await import('@/lib/email/templates');
      const template = inviteEmail(firstName.trim());
      await sendEmail({
        to: email.toLowerCase().trim(),
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
    } catch (emailErr) {
      console.error('Invitation email failed (non-blocking):', emailErr);
    }

    // If the new member is a board officer, refresh the public Leadership page
    if (BOARD_ROLES.includes(memberRole as any)) revalidateMemberPages();

    return NextResponse.json(
      { id: docRef.id, ...memberData },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('Error creating member:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to create member' },
      { status: 500 },
    );
  }
}

// ─── PATCH — update member status / role / board title / order (board+ only) ───
export async function PATCH(request: NextRequest) {
  const rateLimitResult = await rateLimit(getRateLimitKey(request, 'portal-members'), { max: 20, windowSec: 60 });
  if (!rateLimitResult.allowed) return rateLimitResponse(rateLimitResult.resetAt);

  try {
    const decoded = await verifySession();
    const role = await getMemberRole(decoded.uid);
    if (!role || !['president', 'board', 'treasurer'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { memberId, status, role: newRole, boardTitle, boardOrder } = body;

    if (!memberId) {
      return NextResponse.json({ error: 'memberId required' }, { status: 400 });
    }

    const memberRef = adminDb.collection('members').doc(memberId);
    const memberDoc = await memberRef.get();
    if (!memberDoc.exists) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const updates: Record<string, any> = { updatedAt: new Date().toISOString() };

    if (status && ['pending', 'active', 'inactive', 'alumni'].includes(status)) {
      updates.status = status;
    }

    // Role-change permissions:
    //   - President can change roles freely.
    //   - Other board+ admins can ONLY promote a regular member to `board`
    //     (so they can add board members without needing the President), but
    //     cannot grant `president` / `treasurer` and cannot demote anyone.
    const currentMemberRole = memberDoc.data()?.role as string | undefined;
    if (newRole && ['member', 'board', 'treasurer', 'president'].includes(newRole)) {
      if (role === 'president') {
        updates.role = newRole;
      } else if (newRole === 'board' && currentMemberRole === 'member') {
        updates.role = 'board';
      }
      // else: silently ignore (insufficient permission for this transition)
    }

    // Board title (free-form, but only meaningful for board roles)
    if (typeof boardTitle === 'string') {
      updates.boardTitle = boardTitle.trim();
    }
    // Board display order on the public Leadership page
    if (typeof boardOrder === 'number' && Number.isFinite(boardOrder)) {
      updates.boardOrder = boardOrder;
    } else if (boardOrder === null) {
      const { FieldValue } = await import('firebase-admin/firestore');
      updates.boardOrder = FieldValue.delete();
    }

    await memberRef.update(updates);

    // Revalidate the public leadership page if anything that affects it changed
    const affectsLeadership =
      'role' in updates ||
      'status' in updates ||
      'boardTitle' in updates ||
      'boardOrder' in updates;
    if (affectsLeadership) revalidateMemberPages();

    // If approving a pending member, send welcome email
    if (status === 'active' && memberDoc.data()?.status === 'pending') {
      try {
        const { sendEmail } = await import('@/lib/email/send');
        const { welcomeEmail } = await import('@/lib/email/templates');
        const memberData = memberDoc.data();
        const template = welcomeEmail(memberData?.displayName || memberData?.firstName || 'Member');
        await sendEmail({
          to: memberData?.email,
          subject: template.subject,
          html: template.html,
          text: template.text,
        });
      } catch (emailErr) {
        console.error('Welcome email failed:', emailErr);
      }
    }

    // If a member was newly promoted to a board role, send the board-invite email
    const promotedToBoard =
      'role' in updates &&
      BOARD_ROLES.includes(updates.role as any) &&
      !BOARD_ROLES.includes((currentMemberRole || '') as any);
    if (promotedToBoard) {
      try {
        const { sendEmail } = await import('@/lib/email/send');
        const { boardInviteEmail } = await import('@/lib/email/templates');
        const memberData = memberDoc.data();
        const recipientEmail = memberData?.email;
        if (recipientEmail) {
          // Resolve inviter name from current session
          let inviterName: string | undefined;
          try {
            const inviterSnap = await adminDb.collection('members').doc(decoded.uid).get();
            inviterName = inviterSnap.data()?.displayName || inviterSnap.data()?.firstName;
          } catch {
            /* non-blocking */
          }
          const titleForEmail =
            (typeof boardTitle === 'string' && boardTitle.trim()) ||
            memberData?.boardTitle ||
            (updates.role === 'president'
              ? 'President'
              : updates.role === 'treasurer'
              ? 'Treasurer'
              : 'Board Member');
          const template = boardInviteEmail(
            memberData?.displayName || memberData?.firstName || 'there',
            titleForEmail,
            inviterName,
          );
          await sendEmail({
            to: recipientEmail,
            subject: template.subject,
            html: template.html,
            text: template.text,
          });
        }
      } catch (emailErr) {
        console.error('Board invite email failed:', emailErr);
      }
    }

    return NextResponse.json({ success: true, ...updates });
  } catch (error: any) {
    console.error('Error updating member:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

// ─── DELETE — remove a member (president only) ───
// Used to clean up duplicates (e.g. an orphaned invited doc whose UID-keyed
// counterpart has since been migrated) and to remove members entirely. Matches
// the Firestore rule `allow delete: if isPresident();`.
export async function DELETE(request: NextRequest) {
  const rateLimitResult = await rateLimit(getRateLimitKey(request, 'portal-members-delete'), { max: 20, windowSec: 60 });
  if (!rateLimitResult.allowed) return rateLimitResponse(rateLimitResult.resetAt);

  try {
    const decoded = await verifySession();
    const role = await getMemberRole(decoded.uid);
    if (role !== 'president') {
      return NextResponse.json({ error: 'Only the president can delete members' }, { status: 403 });
    }

    // Accept memberId from JSON body OR ?memberId= query param
    let memberId: string | undefined;
    try {
      const body = await request.json();
      memberId = body?.memberId;
    } catch {
      /* no body */
    }
    if (!memberId) {
      memberId = new URL(request.url).searchParams.get('memberId') || undefined;
    }
    if (!memberId) {
      return NextResponse.json({ error: 'memberId required' }, { status: 400 });
    }

    if (memberId === decoded.uid) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
    }

    const memberRef = adminDb.collection('members').doc(memberId);
    const memberDoc = await memberRef.get();
    if (!memberDoc.exists) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const wasBoardOrActive =
      memberDoc.data()?.status === 'active' ||
      BOARD_ROLES.includes((memberDoc.data()?.role || '') as any);

    await memberRef.delete();

    if (wasBoardOrActive) revalidateMemberPages();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting member:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 });
  }
}
