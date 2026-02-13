/**
 * Stripe SDK wrapper.
 */
import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }

  _stripe = new Stripe(key, {
    apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion,
    typescript: true,
  });

  return _stripe;
}

/**
 * Create a Stripe Checkout Session for dues payment.
 */
export async function createDuesCheckoutSession(params: {
  memberId: string;
  memberEmail: string;
  memberType: 'professional' | 'student';
  amount: number; // in cents
  cycleName: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: params.memberEmail,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${params.cycleName} Annual Dues (${params.memberType})`,
            description: `Rotaract NYC membership dues for the ${params.cycleName} Rotary year`,
          },
          unit_amount: params.amount,
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: 'dues',
      memberId: params.memberId,
      memberType: params.memberType,
      cycleName: params.cycleName,
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });

  return session.url!;
}

/**
 * Create a Stripe Checkout Session for event tickets.
 */
export async function createEventCheckoutSession(params: {
  memberId: string;
  memberEmail: string;
  eventId: string;
  eventTitle: string;
  ticketType: 'member' | 'guest';
  amount: number; // in cents
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: params.memberEmail,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${params.eventTitle} — ${params.ticketType} ticket`,
          },
          unit_amount: params.amount,
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: 'event',
      eventId: params.eventId,
      memberId: params.memberId,
      ticketType: params.ticketType,
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });

  return session.url!;
}

/**
 * Verify and construct a Stripe webhook event.
 */
export function constructWebhookEvent(
  body: string | Buffer,
  signature: string,
): Stripe.Event {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET not set');
  return stripe.webhooks.constructEvent(body, signature, secret);
}
