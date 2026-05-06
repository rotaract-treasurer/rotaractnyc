import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/portal/events/[id]/donations
 *
 * Returns the list of donations recorded against a specific event, written by
 * the Stripe webhook into events/{id}/donations/{sessionId}. Restricted to
 * board, president, and treasurer.
 */

interface DonationRow {
  id: string;
  stripeSessionId: string;
  donorName: string;
  donorEmail: string | null;
  amountCents: number;
  message: string | null;
  createdAt: string;
}

async function getAuthenticatedManager(): Promise<{ uid: string; role: string } | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('rotaract_portal_session')?.value;
  if (!sessionCookie) return null;
  try {
    const { uid } = await adminAuth.verifySessionCookie(sessionCookie, true);
    const memberDoc = await adminDb.collection('members').doc(uid).get();
    if (!memberDoc.exists) return null;
    const data = memberDoc.data()!;
    if (!['board', 'president', 'treasurer'].includes(data.role)) return null;
    return { uid, role: data.role };
  } catch {
    return null;
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthenticatedManager();
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id: eventId } = await params;

  try {
    const eventRef = adminDb.collection('events').doc(eventId);
    const [eventSnap, donationsSnap] = await Promise.all([
      eventRef.get(),
      eventRef.collection('donations').orderBy('createdAt', 'desc').get(),
    ]);

    if (!eventSnap.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const event = eventSnap.data()!;
    const donations: DonationRow[] = donationsSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        stripeSessionId: d.stripeSessionId || doc.id,
        donorName: d.donorName || 'Donor',
        donorEmail: d.donorEmail || null,
        amountCents: typeof d.amountCents === 'number' ? d.amountCents : 0,
        message: d.message || null,
        createdAt: d.createdAt || '',
      };
    });

    const totalCents = donations.reduce((sum, d) => sum + d.amountCents, 0);

    return NextResponse.json({
      donations,
      summary: {
        count: donations.length,
        totalCents,
        // Prefer the live aggregate counters on the event doc (kept in sync
        // by the webhook transaction); fall back to computed totals if the
        // counters are missing.
        eventTotalCents:
          typeof event.donationsTotalCents === 'number' ? event.donationsTotalCents : totalCents,
        eventTotalCount:
          typeof event.donationsCount === 'number' ? event.donationsCount : donations.length,
        fundraisingGoalCents:
          typeof event.fundraisingGoalCents === 'number' ? event.fundraisingGoalCents : null,
      },
    });
  } catch (err: any) {
    console.error('[event donations] failed for event', eventId, err);
    return NextResponse.json(
      { error: err?.message || 'Failed to load donations' },
      { status: 500 },
    );
  }
}
