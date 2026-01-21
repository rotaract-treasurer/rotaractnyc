/**
 * Stripe helper for server-side operations
 * Note: Run `npm install stripe` to install the Stripe SDK
 */

// Import Stripe only if available
let Stripe: any;
try {
  Stripe = require('stripe');
} catch (e) {
  console.warn('Stripe package not installed. Run: npm install stripe');
}

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

/**
 * Get Stripe client instance
 */
export function getStripeClient() {
  if (!Stripe) {
    throw new Error('Stripe package not installed. Run: npm install stripe');
  }

  if (!STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable not set');
  }

  return new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia', // Use latest API version
  });
}

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return !!STRIPE_SECRET_KEY && !!Stripe;
}

/**
 * Verify Stripe webhook signature
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
) {
  const stripe = getStripeClient();
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
