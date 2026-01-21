# Member Onboarding & Dues Payment System

Complete implementation of a member onboarding system with secure invitation links, profile completion, and Stripe-powered dues payment for Rotaract NYC.

## Features

- **Admin Invitation System**: Admins can invite members via email
- **3-Step Onboarding**: Welcome → Profile → Payment
- **Secure Token-Based Invites**: 7-day expiring invitation links
- **Stripe Integration**: Secure $85 annual dues payment
- **Member Status Tracking**: PENDING_PROFILE → PENDING_PAYMENT → ACTIVE
- **Email Notifications**: Welcome emails and confirmation emails
- **Access Control**: Only ACTIVE members can access the portal

## Architecture

### Data Models (Firestore)

#### members/{memberId}
```typescript
{
  id: string
  email: string
  firstName: string
  lastName: string
  fullName?: string
  bio?: string
  photoURL?: string
  role?: string           // Job title
  company?: string
  status: MemberStatus    // INVITED | PENDING_PROFILE | PENDING_PAYMENT | ACTIVE | INACTIVE
  isAdmin: boolean
  dues: {
    amount: 8500         // $85 in cents
    currency: "USD"
    paid: boolean
    paidAt?: Timestamp
    stripePaymentId?: string
  }
  createdAt: Timestamp
  updatedAt: Timestamp
  invitedAt?: Timestamp
  profileCompletedAt?: Timestamp
}
```

#### invitations/{inviteId}
```typescript
{
  id: string
  email: string
  firstName?: string
  lastName?: string
  tokenHash: string      // SHA-256 hash of token
  status: InvitationStatus  // SENT | USED | EXPIRED
  memberId?: string      // Reference to member
  createdAt: Timestamp
  expiresAt: Timestamp
  usedAt?: Timestamp
  createdBy: string      // Admin UID
}
```

#### payments/{paymentId}
```typescript
{
  id: string
  memberId: string
  email: string
  stripeSessionId: string
  stripePaymentIntentId?: string
  amount: 8500          // Amount in cents
  currency: "USD"
  status: PaymentStatus  // PENDING | PAID | FAILED | REFUNDED
  type: "DUES" | "DONATION" | "EVENT"
  description?: string
  createdAt: Timestamp
  paidAt?: Timestamp
  updatedAt: Timestamp
}
```

## User Flow

### Admin Flow
1. Admin navigates to `/admin/members/invite`
2. Enters member email, first name, last name
3. System creates:
   - Member record (status: PENDING_PROFILE)
   - Invitation with secure token
   - Sends welcome email with onboarding link

### Member Onboarding Flow
1. **Step 1: Welcome**
   - Member clicks link in email: `/portal/onboarding?token=XYZ`
   - Token validation (checks expiry, usage)
   - Shows welcome message

2. **Step 2: Profile Completion**
   - Member fills out:
     - Full name (required)
     - Bio (required)
     - Photo URL (optional)
     - Role/Title (optional)
     - Company (optional)
   - Status changes: PENDING_PROFILE → PENDING_PAYMENT

3. **Step 3: Payment**
   - Shows $85 dues amount
   - Creates Stripe Checkout session
   - Redirects to Stripe-hosted checkout
   - After payment: redirects to success page

4. **Webhook Processing**
   - Stripe webhook: `checkout.session.completed`
   - Marks payment as PAID
   - Updates member: PENDING_PAYMENT → ACTIVE
   - Sends confirmation email

## Setup Instructions

### 1. Install Dependencies

```bash
npm install stripe
```

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and configure:

#### Required Variables
```env
# Firebase (already configured)
NEXT_PUBLIC_FIREBASE_API_KEY=...
FIREBASE_SERVICE_ACCOUNT_BASE64=...

# Resend (for emails)
RESEND_API_KEY=re_...
RESEND_FROM=Rotaract NYC <no-reply@rotaractnyc.org>

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Stripe Setup

#### Get API Keys
1. Go to https://dashboard.stripe.com/apikeys
2. Copy **Secret key** → `STRIPE_SECRET_KEY`
3. Copy **Publishable key** → `STRIPE_PUBLISHABLE_KEY` (if needed for client)

#### Setup Webhook (Development)

**Option A: Stripe CLI (Recommended for Local Testing)**

```bash
# Install Stripe CLI
# macOS
brew install stripe/stripe-cli/stripe

# Other platforms: https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will output a webhook signing secret like `whsec_...`. Add it to `.env.local`:
```env
STRIPE_WEBHOOK_SECRET=whsec_1234abcd...
```

**Option B: ngrok + Stripe Dashboard**

```bash
# Start ngrok
ngrok http 3000

# In Stripe Dashboard → Webhooks
# Add endpoint: https://YOUR_NGROK_URL/api/webhooks/stripe
# Select events: checkout.session.completed
# Copy the signing secret to STRIPE_WEBHOOK_SECRET
```

#### Setup Webhook (Production)

1. Deploy your app to production
2. Go to https://dashboard.stripe.com/webhooks
3. Click **Add endpoint**
4. Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
5. Select events to listen to:
   - `checkout.session.completed` (required)
   - `payment_intent.succeeded` (optional)
   - `payment_intent.payment_failed` (optional)
6. Copy the **Signing secret** and add to Vercel env vars

### 4. Resend Email Setup

1. Go to https://resend.com/api-keys
2. Create an API key
3. Add to `.env.local`: `RESEND_API_KEY=re_...`
4. Verify your sending domain or use the provided test email

### 5. Firestore Security Rules

Add to `firestore.rules`:

```javascript
// Members collection
match /members/{memberId} {
  // Anyone can read (for directory)
  allow read: if request.auth != null;
  
  // Only the member can update their own profile fields
  allow update: if request.auth != null 
    && request.auth.uid == memberId
    && !request.resource.data.diff(resource.data).affectedKeys()
      .hasAny(['status', 'dues', 'isAdmin']);
  
  // Only admins can create/delete
  allow create, delete: if isAdmin();
}

// Invitations collection (admin only)
match /invitations/{inviteId} {
  allow read, write: if isAdmin();
}

// Payments collection (read only for member)
match /payments/{paymentId} {
  allow read: if request.auth != null 
    && resource.data.memberId == request.auth.uid;
  allow write: if false; // Server-side only
}

function isAdmin() {
  return request.auth != null 
    && get(/databases/$(database)/documents/members/$(request.auth.uid)).data.isAdmin == true;
}
```

## Testing the System

### Test Invitation Flow

1. **Start dev server**
   ```bash
   npm run dev
   ```

2. **Start Stripe webhook listener** (in separate terminal)
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. **Invite a member**
   - Navigate to: http://localhost:3000/admin/members/invite
   - Fill in test email, name
   - Click "Send Invitation"

4. **Check email**
   - Check inbox for welcome email
   - Click onboarding link

5. **Complete onboarding**
   - Fill out profile
   - Click "Pay Dues"
   - Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: any future date
   - CVC: any 3 digits
   - ZIP: any 5 digits

6. **Verify webhook**
   - Check terminal running `stripe listen`
   - Should see `checkout.session.completed` event
   - Member status should change to ACTIVE
   - Confirmation email should be sent

### Stripe Test Cards

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0027 6000 3184
```

Full list: https://stripe.com/docs/testing

## File Structure

```
app/
├── admin/
│   └── members/
│       └── invite/
│           ├── page.tsx         # Invite member UI
│           └── actions.ts       # Server actions
├── portal/
│   └── onboarding/
│       ├── page.tsx            # 3-step onboarding flow
│       ├── actions.ts          # Token validation, profile update
│       └── success/
│           └── page.tsx        # Post-payment success page
└── api/
    ├── stripe/
    │   └── checkout/
    │       └── route.ts        # Create checkout session
    └── webhooks/
        └── stripe/
            └── route.ts        # Handle Stripe webhooks

lib/
├── firebase/
│   ├── members.ts              # Member CRUD operations
│   ├── invitations.ts          # Invitation management
│   ├── payments.ts             # Payment tracking
│   └── memberAccess.ts         # Access control helpers
├── email/
│   ├── onboardingTemplates.ts  # Email HTML templates
│   └── sendOnboarding.ts       # Email sending logic
└── stripe/
    └── client.ts               # Stripe SDK wrapper

types/
└── onboarding.ts               # TypeScript interfaces
```

## API Routes

### POST /api/stripe/checkout
Create Stripe checkout session

**Request:**
```json
{
  "memberId": "abc123",
  "email": "member@example.com",
  "successUrl": "https://domain.com/portal/onboarding/success",
  "cancelUrl": "https://domain.com/portal/onboarding?token=xyz"
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://checkout.stripe.com/...",
  "sessionId": "cs_test_..."
}
```

### POST /api/webhooks/stripe
Handle Stripe webhook events

**Headers:**
- `stripe-signature`: Webhook signature for verification

**Supported Events:**
- `checkout.session.completed`: Payment successful
- `payment_intent.succeeded`: Payment processed
- `payment_intent.payment_failed`: Payment failed

## Security Considerations

1. **Token Security**
   - Tokens are hashed (SHA-256) before storage
   - Tokens expire after 7 days
   - Single-use tokens (marked as USED)

2. **Webhook Verification**
   - All webhooks verify Stripe signature
   - Invalid signatures return 400
   - Idempotent webhook handling

3. **Access Control**
   - Only ACTIVE members access portal
   - Only admins can invite members
   - Server-side operations for sensitive data

4. **Payment Security**
   - No card data touches your server
   - Stripe handles PCI compliance
   - Payment status verified via webhook

## Troubleshooting

### Emails not sending
- Check `RESEND_API_KEY` is set
- Verify sender domain in Resend
- Check server logs for errors

### Webhook not firing
- Ensure `STRIPE_WEBHOOK_SECRET` is correct
- Check Stripe CLI is running (`stripe listen`)
- Verify webhook endpoint is accessible
- Check webhook logs in Stripe Dashboard

### Payment not updating member status
- Check webhook received (Stripe Dashboard → Webhooks)
- Verify webhook secret matches
- Check server logs for errors
- Ensure metadata (memberId) is in checkout session

### Member stuck in PENDING_PAYMENT
- Manually check payment in Stripe Dashboard
- Check Firestore `payments` collection
- Resend webhook from Stripe Dashboard
- Or manually update member status in Firestore

## Production Deployment

### Vercel Environment Variables

Add to Vercel project settings:

```env
FIREBASE_SERVICE_ACCOUNT_BASE64=...
RESEND_API_KEY=...
RESEND_FROM=...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
```

### Post-Deployment Checklist

- [ ] Add production webhook endpoint in Stripe Dashboard
- [ ] Test invite flow end-to-end
- [ ] Test payment with real card (small amount)
- [ ] Verify emails are received
- [ ] Check Firestore security rules
- [ ] Monitor webhook deliveries in Stripe
- [ ] Set up error monitoring (Sentry, etc.)

## Future Enhancements

- [ ] Bulk member import (CSV)
- [ ] Member renewal reminders
- [ ] Payment receipts (PDF)
- [ ] Proration for mid-year joins
- [ ] Installment payment plans
- [ ] Member referral tracking
- [ ] Admin dashboard for member stats

## Support

For issues or questions:
- Check Stripe Dashboard → Webhooks for delivery status
- Check Firestore collections for data consistency
- Review server logs for errors
- Contact: admin@rotaractnyc.org
