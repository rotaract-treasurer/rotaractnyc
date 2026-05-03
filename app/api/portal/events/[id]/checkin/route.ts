import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { verifyCheckInSignature } from '@/lib/utils/qrcode';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Require authenticated session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('rotaract_portal_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await adminAuth.verifySessionCookie(sessionCookie, true);

    const { id: eventId } = await params;

    // Support both POST body and query params for flexibility
    let memberId: string | null = null;
    let timestamp: string | null = null;
    let signature: string | null = null;
    let tkRaw: string | null = null;

    try {
      const body = await request.json();
      memberId = body.memberId || null;
      timestamp = body.timestamp || null;
      signature = body.signature || null;
      tkRaw = body.tk ?? body.ticketNumber ?? null;
    } catch {
      // Fallback to query params
      const { searchParams } = new URL(request.url);
      memberId = searchParams.get('m');
      timestamp = searchParams.get('t');
      signature = searchParams.get('sig');
      tkRaw = searchParams.get('tk');
    }

    if (!memberId || !timestamp || !signature) {
      return NextResponse.json({ error: 'Missing required parameters (memberId/m, timestamp/t, signature/sig)' }, { status: 400 });
    }

    // Parse the optional ticket number from the QR's `tk` param.
    const ticketNumber = tkRaw && /^\d+$/.test(tkRaw) ? parseInt(tkRaw, 10) : undefined;

    // Verify the per-ticket HMAC and 24-hour expiry.
    // When ticketNumber is present, verifyCheckInSignature uses the
    // ticket-specific payload (eventId:memberId:timestamp:ticketNumber),
    // ensuring each credential is cryptographically independent.
    if (!verifyCheckInSignature(eventId, memberId, timestamp, signature, ticketNumber)) {
      return NextResponse.json({ error: 'Invalid or expired check-in link' }, { status: 403 });
    }

    // Verify event exists
    const eventDoc = await adminDb.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Verify member exists
    try {
      await adminAuth.getUser(memberId);
    } catch {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const rsvpRef = adminDb.collection('rsvps').doc(`${memberId}_${eventId}`);
    const rsvpDoc = await rsvpRef.get();
    const now = new Date().toISOString();
    const eventName = eventDoc.data()?.title || 'Event';

    // Resolve a friendly display name for the scanner UI. Prefer the member's
    // own profile, fall back to whatever the RSVP captured at booking time.
    let memberDisplayName: string | undefined;
    try {
      const memberSnap = await adminDb.collection('members').doc(memberId).get();
      if (memberSnap.exists) {
        const md = memberSnap.data() as { displayName?: string; firstName?: string; lastName?: string };
        memberDisplayName =
          md.displayName ||
          [md.firstName, md.lastName].filter(Boolean).join(' ').trim() ||
          undefined;
      }
    } catch {
      // Non-fatal — the scanner just won't show a name.
    }
    if (!memberDisplayName && rsvpDoc.exists) {
      memberDisplayName = (rsvpDoc.data() as { memberName?: string }).memberName;
    }
    const memberPayload = memberDisplayName ? { displayName: memberDisplayName } : undefined;

    if (ticketNumber) {
      // ── Per-ticket check-in (numbered QR codes) ──────────────────────────
      // checkedInTickets is an array of ticket numbers that have already been
      // scanned. Each ticket number can only be used once.
      const existing = rsvpDoc.exists ? (rsvpDoc.data()?.checkedInTickets as number[] | undefined) ?? [] : [];

      if (existing.includes(ticketNumber)) {
        return NextResponse.json({
          success: true,
          alreadyCheckedIn: true,
          ticketNumber,
          eventName,
          member: memberPayload,
          checkedInAt: rsvpDoc.data()?.checkedInAt || now,
        });
      }

      // Mark this specific ticket as used.
      if (rsvpDoc.exists) {
        await rsvpRef.update({
          // FieldValue.arrayUnion is idempotent — safe against duplicate delivery.
          checkedInTickets: FieldValue.arrayUnion(ticketNumber),
          // Set the top-level flag on the first ever scan for admin-list compat.
          checkedIn: true,
          checkedInAt: rsvpDoc.data()?.checkedInAt || now,
        });
      } else {
        await rsvpRef.set({
          memberId,
          eventId,
          status: 'going',
          checkedIn: true,
          checkedInAt: now,
          checkedInTickets: [ticketNumber],
        });
      }

      return NextResponse.json({ success: true, ticketNumber, eventName, member: memberPayload, checkedInAt: now });
    } else {
      // ── Legacy single-ticket check-in (no ticket number) ─────────────────
      if (rsvpDoc.exists && rsvpDoc.data()?.checkedIn) {
        return NextResponse.json({
          success: true,
          alreadyCheckedIn: true,
          eventName,
          member: memberPayload,
          checkedInAt: rsvpDoc.data()?.checkedInAt || now,
        });
      }

      if (rsvpDoc.exists) {
        await rsvpRef.update({ checkedIn: true, checkedInAt: now });
      } else {
        await rsvpRef.set({ memberId, eventId, status: 'going', checkedIn: true, checkedInAt: now });
      }

      return NextResponse.json({ success: true, eventName, member: memberPayload, checkedInAt: now });
    }
  } catch (error) {
    console.error('Error processing check-in:', error);
    return NextResponse.json({ error: 'Failed to check in' }, { status: 500 });
  }
}
