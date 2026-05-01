/**
 * Self-serve member ticket cancellation.
 *
 * Behaviour:
 * - Member must be authenticated.
 * - Cancellation is only permitted when the event start date is at least
 *   `REFUND_CUTOFF_DAYS` (7) days in the future.
 * - For paid Stripe tickets a full refund is issued via Stripe's API.
 *   The `charge.refunded` webhook will then mark the RSVP as
 *   `paymentStatus: 'refunded'` and decrement counts. We optimistically
 *   mark the RSVP as `not_going` here so the member sees instant UI
 *   feedback and can't double-cancel.
 * - For offline / pending offline payments we mark the RSVP as cancelled
 *   and flip any associated `offlinePayments` record to `rejected` —
 *   the treasurer should refund manually.
 * - For free RSVPs we just flip status to `not_going`, decrement
 *   `attendeeCount`, and release any held tier spot.
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { getStripe } from '@/lib/stripe/client';
import { rateLimit, getRateLimitKey, rateLimitResponse } from '@/lib/rateLimit';
import { decrementTierSoldCount } from '@/lib/services/tierTracking';
import { logAuditEvent } from '@/lib/services/auditLog';

export const dynamic = 'force-dynamic';

const REFUND_CUTOFF_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rl = await rateLimit(getRateLimitKey(request, 'cancel-ticket'), {
    max: 5,
    windowSec: 60,
  });
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

  // Authenticate
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('rotaract_portal_session')?.value;
  if (!sessionCookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let uid: string;
  let actorName = 'Member';
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    uid = decoded.uid;
    if (decoded.name) actorName = String(decoded.name);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: eventId } = await params;
  if (!eventId) {
    return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
  }

  // Load event + RSVP
  const [eventSnap, rsvpSnap] = await Promise.all([
    adminDb.collection('events').doc(eventId).get(),
    adminDb.collection('rsvps').doc(`${uid}_${eventId}`).get(),
  ]);

  if (!eventSnap.exists) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }
  if (!rsvpSnap.exists) {
    return NextResponse.json(
      { error: "You don't have a ticket for this event." },
      { status: 404 },
    );
  }

  const event = eventSnap.data()!;
  const rsvp = rsvpSnap.data()!;

  if (rsvp.status !== 'going') {
    return NextResponse.json(
      { error: 'This ticket has already been cancelled or is not active.' },
      { status: 409 },
    );
  }

  // Enforce 7-day cutoff
  const eventDate = event.date ? new Date(event.date) : null;
  if (!eventDate || isNaN(eventDate.getTime())) {
    return NextResponse.json(
      { error: 'Event date is invalid; please contact us to cancel.' },
      { status: 422 },
    );
  }
  const daysUntilEvent = (eventDate.getTime() - Date.now()) / MS_PER_DAY;
  if (daysUntilEvent < REFUND_CUTOFF_DAYS) {
    return NextResponse.json(
      {
        error: `Self-serve cancellations close ${REFUND_CUTOFF_DAYS} days before the event. Please email us if you need help.`,
        cutoffDays: REFUND_CUTOFF_DAYS,
        daysUntilEvent: Math.max(0, Math.floor(daysUntilEvent)),
      },
      { status: 403 },
    );
  }

  const quantity = Number(rsvp.quantity) || 1;
  const tierId = typeof rsvp.tierId === 'string' ? rsvp.tierId : null;
  const stripeRef: string | null =
    typeof rsvp.stripeSessionId === 'string' ? rsvp.stripeSessionId : null;
  const paidAmount = Number(rsvp.paidAmount) || 0;
  const paymentStatus: string = rsvp.paymentStatus || (paidAmount > 0 ? 'paid' : 'free');

  // ── Issue Stripe refund (only for actually paid online tickets) ──
  let refundId: string | null = null;
  let refundError: string | null = null;
  const wasPaidOnline = paymentStatus === 'paid' && stripeRef && paidAmount > 0;

  if (wasPaidOnline) {
    try {
      const stripe = getStripe();

      // stripeSessionId may be either a Checkout Session id (cs_…) or a
      // PaymentIntent id (pi_…) depending on which checkout flow was used.
      let paymentIntentId: string | null = null;
      if (stripeRef!.startsWith('cs_')) {
        const session = await stripe.checkout.sessions.retrieve(stripeRef!);
        paymentIntentId =
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id ?? null;
      } else if (stripeRef!.startsWith('pi_')) {
        paymentIntentId = stripeRef!;
      }

      if (!paymentIntentId) {
        throw new Error('Could not locate Stripe payment intent for this ticket.');
      }

      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        reason: 'requested_by_customer',
        metadata: {
          source: 'self_serve_cancellation',
          eventId,
          memberId: uid,
        },
      });
      refundId = refund.id;
    } catch (err: any) {
      console.error('[CancelTicket] Stripe refund failed:', err);
      refundError = err?.message || 'Refund failed';
      return NextResponse.json(
        {
          error:
            'We could not process your refund automatically. Please contact the treasurer — your ticket has not been cancelled.',
        },
        { status: 502 },
      );
    }
  }

  // ── Update RSVP ──
  // For Stripe refunds the `charge.refunded` webhook will eventually flip
  // paymentStatus to 'refunded' and decrement counts. We still optimistically
  // set status to 'not_going' so the member can't immediately re-cancel and
  // the UI updates instantly.
  await adminDb.collection('rsvps').doc(`${uid}_${eventId}`).update({
    status: 'not_going',
    cancelledAt: new Date().toISOString(),
    cancelledBy: 'self',
    ...(refundId ? { stripeRefundId: refundId, paymentStatus: 'refund_pending' } : {}),
    ...(!wasPaidOnline ? { paymentStatus: 'cancelled' } : {}),
    updatedAt: new Date().toISOString(),
  });

  // For non-Stripe paths (free / offline) the webhook won't fire, so adjust
  // counts inline. For Stripe refunds we leave count adjustment to the webhook
  // (handleChargeRefunded) to keep a single source of truth.
  if (!wasPaidOnline) {
    if (tierId) {
      try {
        await decrementTierSoldCount(eventId, tierId, quantity);
      } catch (err) {
        console.error('[CancelTicket] Failed to release tier spot:', err);
      }
    }
    try {
      await adminDb.collection('events').doc(eventId).update({
        attendeeCount: FieldValue.increment(-quantity),
      });
    } catch (err) {
      console.error('[CancelTicket] Failed to decrement attendeeCount:', err);
    }

    // Cancel any pending offline payment record
    if (paymentStatus === 'pending_offline' && rsvp.offlinePaymentId) {
      try {
        await adminDb
          .collection('offlinePayments')
          .doc(rsvp.offlinePaymentId)
          .update({
            status: 'rejected',
            rejectedReason: 'Member self-cancelled before payment confirmation',
            confirmedAt: new Date().toISOString(),
            confirmedBy: 'self',
          });
      } catch (err) {
        console.error('[CancelTicket] Failed to update offline payment:', err);
      }
    }
  }

  // Audit log (fire-and-forget)
  logAuditEvent('event.ticket_cancelled', uid, actorName, {
    targetId: eventId,
    targetType: 'event',
    details: {
      eventTitle: event.title,
      paymentStatus,
      paidAmount,
      quantity,
      tierId,
      refundId,
      refundError,
      daysUntilEvent: Math.floor(daysUntilEvent),
    },
  });

  return NextResponse.json({
    success: true,
    refunded: !!refundId,
    refundId,
    message: refundId
      ? 'Your ticket has been cancelled and a refund has been issued. It may take 5–10 business days to appear on your statement.'
      : paymentStatus === 'pending_offline'
      ? 'Your ticket has been cancelled. The treasurer will void any pending payment.'
      : 'Your ticket has been cancelled.',
  });
}
