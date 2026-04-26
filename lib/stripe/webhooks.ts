/**
 * Stripe webhook event handlers.
 */
import type Stripe from 'stripe';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { recordDuesPayment } from '@/lib/services/dues';
import { upsertRSVP } from '@/lib/services/events';
import { createTransaction } from '@/lib/services/finance';
import { adjustTierSoldCount } from '@/lib/services/tierTracking';
import { sendEmail } from '@/lib/email/send';
import { guestTicketConfirmationEmail } from '@/lib/email/templates';

/**
 * 5.1 — Idempotency: check if we already processed this Stripe session.
 */
async function isAlreadyProcessed(sessionId: string): Promise<boolean> {
  const snap = await adminDb
    .collection('transactions')
    .where('stripeSessionId', '==', sessionId)
    .limit(1)
    .get();
  return !snap.empty;
}

/** Fetch event and send a ticket confirmation email. Silently no-ops on failure. */
async function sendTicketConfirmationEmail(
  name: string,
  email: string,
  eventId: string,
  amountCents: number,
): Promise<void> {
  try {
    if (!email) return;
    const eventDoc = await adminDb.collection('events').doc(eventId).get();
    if (!eventDoc.exists) return;
    const event = eventDoc.data()!;
    const content = guestTicketConfirmationEmail(
      name,
      {
        title: event.title || 'Event',
        date: event.date || '',
        time: event.time || '',
        location: event.location || '',
        slug: event.slug || eventId,
      },
      amountCents,
    );
    await sendEmail({ to: email, subject: content.subject, html: content.html, text: content.text });
  } catch (err) {
    console.error('Failed to send ticket confirmation email:', err);
  }
}

export async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  // 5.1 — Idempotency guard
  if (await isAlreadyProcessed(session.id)) {
    console.log('Webhook already processed for session:', session.id);
    return;
  }

  // 5.5 — Handle missing metadata
  if (!session.metadata) {
    console.error('Missing metadata on checkout session:', session.id);
    return;
  }

  const { type, memberId, memberType, cycleId, cycleName, eventId, ticketType, tierId } = session.metadata;
  const quantity = parseInt(session.metadata.quantity || '1', 10) || 1;

  if (type === 'dues' && memberId && memberType) {
    // cycleId is the canonical field; cycleName is kept for backward compat
    const resolvedCycleId = cycleId || cycleName || 'unknown';

    await recordDuesPayment({
      memberId,
      cycleId: resolvedCycleId,
      memberType: memberType as 'professional' | 'student',
      amount: session.amount_total || 0,
      status: 'PAID',
      stripePaymentId: session.payment_intent as string,
    });

    await createTransaction({
      type: 'income',
      category: 'Dues',
      amount: (session.amount_total || 0) / 100,
      description: `Dues payment — ${memberType} (${resolvedCycleId})`,
      date: new Date().toISOString(),
      createdBy: 'stripe',
      createdAt: new Date().toISOString(),
      paymentMethod: 'stripe',
      relatedMemberId: memberId,
      stripeSessionId: session.id,
    });
  }

  if ((type === 'event' || type === 'event_ticket') && eventId && memberId) {
    await upsertRSVP({
      eventId,
      memberId,
      memberName: session.customer_email || 'Member',
      status: 'going',
      tierId: tierId || undefined,
    });

    if (tierId) await adjustTierSoldCount(eventId, tierId, quantity);

    await createTransaction({
      type: 'income',
      category: 'Events',
      amount: (session.amount_total || 0) / 100,
      description: `Event ticket — ${ticketType || 'member'}`,
      date: new Date().toISOString(),
      createdBy: 'stripe',
      createdAt: new Date().toISOString(),
      paymentMethod: 'stripe',
      relatedMemberId: memberId,
      stripeSessionId: session.id,
      eventId,
      quantity,
    });

    // Send confirmation email to member
    try {
      const userRecord = await adminAuth.getUser(memberId);
      if (userRecord.email) {
        await sendTicketConfirmationEmail(
          userRecord.displayName || 'Member',
          userRecord.email,
          eventId,
          session.amount_total || 0,
        );
      }
    } catch (err) {
      console.error('Failed to send member ticket confirmation email:', err);
    }
  }

  // Guest event ticket purchase
  if (type === 'guest_event_ticket' && eventId) {
    const { guestName, guestEmail, guestPhone } = session.metadata;

    const existingSnap = await adminDb
      .collection('guest_rsvps')
      .where('eventId', '==', eventId)
      .where('email', '==', (guestEmail || '').toLowerCase())
      .limit(1)
      .get();

    if (existingSnap.empty) {
      await adminDb.collection('guest_rsvps').add({
        eventId,
        name: guestName || 'Guest',
        email: (guestEmail || '').toLowerCase(),
        phone: guestPhone || null,
        status: 'going',
        ticketType: 'guest',
        tierId: tierId || null,
        quantity,
        paidAmount: session.amount_total || 0,
        paymentStatus: 'paid',
        stripeSessionId: session.id,
        createdAt: new Date().toISOString(),
      });
    } else {
      await adminDb.collection('guest_rsvps').doc(existingSnap.docs[0].id).update({
        status: 'going',
        tierId: tierId || null,
        quantity,
        paidAmount: session.amount_total || 0,
        paymentStatus: 'paid',
        stripeSessionId: session.id,
      });
    }

    if (tierId) await adjustTierSoldCount(eventId, tierId, quantity);

    await createTransaction({
      type: 'income',
      category: 'Events',
      amount: (session.amount_total || 0) / 100,
      description: `Guest event ticket — ${guestName || 'Guest'}`,
      date: new Date().toISOString(),
      createdBy: 'stripe',
      createdAt: new Date().toISOString(),
      paymentMethod: 'stripe',
      stripeSessionId: session.id,
      email: guestEmail || undefined,
      eventId,
      quantity,
    });

    await sendTicketConfirmationEmail(
      guestName || 'Guest',
      guestEmail || '',
      eventId,
      session.amount_total || 0,
    );
  }

  // 5.6 — Track donations in Firestore
  if (type === 'donation') {
    await createTransaction({
      type: 'income',
      category: 'Donations',
      amount: (session.amount_total || 0) / 100,
      description: `Donation — $${((session.amount_total || 0) / 100).toFixed(2)}`,
      date: new Date().toISOString(),
      createdBy: 'stripe',
      createdAt: new Date().toISOString(),
      paymentMethod: 'stripe',
      stripeSessionId: session.id,
      email: session.customer_email || undefined,
      status: 'completed',
    });
  }
}

export async function handlePaymentIntentSucceeded(pi: Stripe.PaymentIntent): Promise<void> {
  // Idempotency: reuse the same stripeSessionId field, keyed by payment intent ID
  if (await isAlreadyProcessed(pi.id)) {
    console.log('PaymentIntent already processed:', pi.id);
    return;
  }

  if (!pi.metadata) {
    console.error('Missing metadata on payment intent:', pi.id);
    return;
  }

  const { type, memberId, eventId, ticketType, tierId } = pi.metadata;
  const quantity = parseInt(pi.metadata.quantity || '1', 10) || 1;
  const amountCents = pi.amount;
  const receiptEmail = pi.receipt_email ?? undefined;

  if ((type === 'event' || type === 'event_ticket') && eventId && memberId) {
    await upsertRSVP({
      eventId,
      memberId,
      memberName: receiptEmail || 'Member',
      status: 'going',
      tierId: tierId || undefined,
    });

    if (tierId) await adjustTierSoldCount(eventId, tierId, quantity);

    await createTransaction({
      type: 'income',
      category: 'Events',
      amount: amountCents / 100,
      description: `Event ticket — ${ticketType || 'member'}`,
      date: new Date().toISOString(),
      createdBy: 'stripe',
      createdAt: new Date().toISOString(),
      paymentMethod: 'stripe',
      relatedMemberId: memberId,
      stripeSessionId: pi.id,
      eventId,
      quantity,
    });

    // Send confirmation email to member
    try {
      const userRecord = await adminAuth.getUser(memberId);
      if (userRecord.email) {
        await sendTicketConfirmationEmail(
          userRecord.displayName || 'Member',
          userRecord.email,
          eventId,
          amountCents,
        );
      }
    } catch (err) {
      console.error('Failed to send member ticket confirmation email:', err);
    }
  }

  if (type === 'guest_event_ticket' && eventId) {
    const { guestName, guestEmail, guestPhone } = pi.metadata;
    const normalizedEmail = (guestEmail || '').toLowerCase();

    const existingSnap = await adminDb
      .collection('guest_rsvps')
      .where('eventId', '==', eventId)
      .where('email', '==', normalizedEmail)
      .limit(1)
      .get();

    if (existingSnap.empty) {
      await adminDb.collection('guest_rsvps').add({
        eventId,
        name: guestName || 'Guest',
        email: normalizedEmail,
        phone: guestPhone || null,
        status: 'going',
        ticketType: 'guest',
        tierId: tierId || null,
        quantity,
        paidAmount: amountCents,
        paymentStatus: 'paid',
        stripeSessionId: pi.id,
        createdAt: new Date().toISOString(),
      });
    } else {
      await adminDb.collection('guest_rsvps').doc(existingSnap.docs[0].id).update({
        status: 'going',
        tierId: tierId || null,
        quantity,
        paidAmount: amountCents,
        paymentStatus: 'paid',
        stripeSessionId: pi.id,
      });
    }

    if (tierId) await adjustTierSoldCount(eventId, tierId, quantity);

    await createTransaction({
      type: 'income',
      category: 'Events',
      amount: amountCents / 100,
      description: `Guest event ticket — ${guestName || 'Guest'}`,
      date: new Date().toISOString(),
      createdBy: 'stripe',
      createdAt: new Date().toISOString(),
      paymentMethod: 'stripe',
      stripeSessionId: pi.id,
      email: guestEmail || undefined,
      eventId,
      quantity,
    });

    await sendTicketConfirmationEmail(
      guestName || 'Guest',
      guestEmail || '',
      eventId,
      amountCents,
    );
  }
}

export async function handlePaymentFailed(intent: Stripe.PaymentIntent): Promise<void> {
  console.error('Payment failed:', intent.id, intent.last_payment_error?.message);
}

/**
 * 5.7 — Handle expired checkout sessions for analytics.
 */
export async function handleCheckoutExpired(session: Stripe.Checkout.Session): Promise<void> {
  console.log('Checkout session expired:', session.id, {
    email: session.customer_email,
    metadata: session.metadata,
    amountTotal: session.amount_total,
  });
}

export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case 'checkout.session.expired':
      await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session);
      break;
    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
      break;
    default:
      break;
  }
}
