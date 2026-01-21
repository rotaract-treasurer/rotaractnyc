# Stripe Setup Guide for Dues Payment

## Issue
The "Pay Dues" button on `/portal/dues` leads to a page but doesn't allow online payment.

## Root Cause
Stripe environment variables are not configured on Vercel (or locally).

## Solution

### Step 1: Get Your Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Sign in or create a Stripe account
3. Copy the following keys:
   - **Secret key** (starts with `sk_test_` for test mode or `sk_live_` for live mode)
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)

### Step 2: Set Up Webhook Endpoint

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL:
   - For production: `https://rotaractnyc-henna.vercel.app/api/webhooks/stripe`
   - For local testing: Use Stripe CLI (see below)
4. Select events to listen to:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
5. Copy the **Signing secret** (starts with `whsec_`)

### Step 3: Add Environment Variables to Vercel

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (`rotaractnyc`)
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

```
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

5. Set these for all environments (Production, Preview, Development)
6. Click **Save**

### Step 4: Redeploy

After adding the environment variables:
1. Go to **Deployments** in Vercel
2. Click on the latest deployment
3. Click **Redeploy**

Or simply push a new commit to trigger a deployment.

### Step 5: Verify

1. Go to `https://rotaractnyc-henna.vercel.app/portal/dues`
2. Click "Pay Now" button
3. You should be redirected to a Stripe Checkout page

## Local Development Setup

If you want to test locally:

### 1. Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Linux
# Download from https://github.com/stripe/stripe-cli/releases
```

### 2. Login to Stripe

```bash
stripe login
```

### 3. Forward webhooks to local server

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will output a webhook signing secret like `whsec_xxxxx`.

### 4. Create `.env.local` file

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # From stripe listen command

# Other environment variables (see docs/VERCEL_ENV.md)
NEXT_PUBLIC_FIREBASE_API_KEY=...
# ... etc
```

### 5. Run development server

```bash
npm run dev
```

## Testing Payment Flow

### Use Stripe Test Cards

When in test mode (`sk_test_`), use these test card numbers:

**Successful payment:**
- Card number: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

**Declined payment:**
- Card number: `4000 0000 0000 0002`

More test cards: https://stripe.com/docs/testing

## Troubleshooting

### Error: "Stripe is not configured"

**Cause:** `STRIPE_SECRET_KEY` environment variable is not set.

**Fix:** Follow Step 3 above to add the environment variable to Vercel.

### Error: "No checkout URL returned"

**Cause:** The API request to create a checkout session failed.

**Fix:** 
1. Check Vercel logs for the error message
2. Verify Stripe keys are correct
3. Ensure an active dues cycle exists (admin must create one at `/admin/finance/dues`)

### Error: "Failed to create checkout session"

**Cause:** Multiple possible reasons:
1. Invalid Stripe API key
2. No active dues cycle configured
3. Member already paid for this cycle

**Fix:**
1. Verify Stripe keys in Vercel environment variables
2. Admin should create and activate a dues cycle at `/admin/finance/dues`
3. Check if member has already paid (status should show "Paid")

### Payment succeeds but not recorded in Firestore

**Cause:** Webhook is not configured or `STRIPE_WEBHOOK_SECRET` is incorrect.

**Fix:**
1. Verify webhook endpoint is configured in Stripe Dashboard
2. Check webhook signing secret matches `STRIPE_WEBHOOK_SECRET`
3. Check Vercel function logs for webhook errors

## Admin: Creating a Dues Cycle

Before members can pay dues, an admin must:

1. Go to `/admin/finance/dues`
2. Click "Create New Cycle"
3. Select the Rotary year (e.g., RY-2026)
4. Set amount (e.g., $85.00)
5. Click "Create Cycle"
6. Click "Activate" to make it the active cycle

Only one cycle can be active at a time.

## Going Live

When ready to accept real payments:

1. Activate your Stripe account (complete onboarding in Stripe Dashboard)
2. Get your **live** API keys (starting with `sk_live_` and `pk_live_`)
3. Update environment variables in Vercel with live keys
4. Update webhook endpoint to use live endpoint
5. Test with a real card (small amount)
6. Monitor payments in Stripe Dashboard

## Security Notes

- Never commit API keys to Git
- Use test keys (`sk_test_`) for development
- Use live keys (`sk_live_`) only in production
- Keep webhook secrets secure
- Regularly rotate API keys

## Support

- **Stripe Documentation:** https://stripe.com/docs
- **Stripe Support:** https://support.stripe.com
- **Project Documentation:** See `docs/ANNUAL_DUES_GUIDE.md`
