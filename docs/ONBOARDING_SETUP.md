# Installation & Setup - Member Onboarding System

Quick setup guide for the member onboarding and dues payment feature.

## 1. Install Stripe Package

```bash
npm install stripe
```

This is the only additional dependency needed beyond what's already in the project.

## 2. Configure Environment Variables

Add to your `.env.local` file:

```env
# Stripe (for member dues payment)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Base URL (for email links)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Email settings (if not already configured)
RESEND_API_KEY=re_...
RESEND_FROM=Rotaract NYC <no-reply@rotaractnyc.org>
```

### Getting Stripe Keys

1. **Test Mode Keys** (for development)
   - Go to: https://dashboard.stripe.com/test/apikeys
   - Copy **Secret key** → `STRIPE_SECRET_KEY`

2. **Webhook Secret** (for local development)
   ```bash
   # Install Stripe CLI
   brew install stripe/stripe-cli/stripe  # macOS
   # or download from: https://stripe.com/docs/stripe-cli
   
   # Login
   stripe login
   
   # Start webhook forwarding
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   
   # Copy the webhook signing secret (starts with whsec_) to your .env.local
   ```

3. **Production Keys**
   - Go to: https://dashboard.stripe.com/apikeys
   - Use **Live** mode keys
   - Set up webhook endpoint in Stripe Dashboard

## 3. Update Firestore Security Rules

Add these rules to your `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null 
        && get(/databases/$(database)/documents/members/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Members collection
    match /members/{memberId} {
      // Anyone authenticated can read (for directory)
      allow read: if request.auth != null;
      
      // Members can update their own profile (but not status/dues/admin)
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
    
    // Payments collection
    match /payments/{paymentId} {
      // Members can read their own payments
      allow read: if request.auth != null 
        && resource.data.memberId == request.auth.uid;
      
      // No client writes (server-side only)
      allow write: if false;
    }
    
    // ... rest of your existing rules
  }
}
```

## 4. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

## 5. Test the System

### Start Development Environment

```bash
# Terminal 1: Start Next.js dev server
npm run dev

# Terminal 2: Start Stripe webhook listener
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Test Invitation Flow

1. Go to: http://localhost:3000/admin/members/invite
2. Enter test member details
3. Check email for invitation
4. Click link and complete onboarding
5. Use test card: `4242 4242 4242 4242`

### Verify Everything Works

- [ ] Email received with onboarding link
- [ ] Token validation works
- [ ] Profile saves correctly
- [ ] Stripe checkout opens
- [ ] Payment completes successfully
- [ ] Webhook fires (check Terminal 2)
- [ ] Member status changes to ACTIVE
- [ ] Confirmation email received

## 6. Production Deployment

### Vercel Deployment

Add these environment variables in Vercel project settings:

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...  # From Stripe Dashboard webhook
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
RESEND_API_KEY=re_...
RESEND_FROM=Rotaract NYC <no-reply@rotaractnyc.org>
```

### Configure Production Webhook

1. Go to: https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. URL: `https://yourdomain.com/api/webhooks/stripe`
4. Events: `checkout.session.completed`
5. Copy signing secret to Vercel env vars

## Common Issues

### Stripe package not found
```bash
npm install stripe
```

### Webhook signature verification failed
- Check `STRIPE_WEBHOOK_SECRET` matches CLI output
- Ensure you're using raw body (Next.js handles this automatically)

### Emails not sending
- Verify `RESEND_API_KEY` is set
- Check sender domain is verified in Resend

### Member stuck in PENDING_PAYMENT
- Check Stripe Dashboard → Payments for the transaction
- Check webhook was received (Stripe Dashboard → Webhooks)
- Manually trigger webhook from Stripe Dashboard if needed

## Quick Reference

| Environment Variable | Where to Get It | Required |
|---------------------|-----------------|----------|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → API Keys | ✅ Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe CLI or Dashboard | ✅ Yes |
| `RESEND_API_KEY` | Resend Dashboard | ✅ Yes |
| `RESEND_FROM` | Verified sender in Resend | ✅ Yes |
| `NEXT_PUBLIC_BASE_URL` | Your domain | ✅ Yes |

## Next Steps

- See [MEMBER_ONBOARDING.md](./MEMBER_ONBOARDING.md) for complete documentation
- Test with Stripe test cards: https://stripe.com/docs/testing
- Monitor webhooks in Stripe Dashboard
- Set up error monitoring (Sentry, etc.)
