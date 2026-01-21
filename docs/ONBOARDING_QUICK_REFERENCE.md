# Member Onboarding System - Quick Reference

## 🚀 One-Command Setup

```bash
# Run the setup script
./scripts/setup-onboarding.sh
```

Or manually:
```bash
npm install stripe
```

## 📋 Environment Variables Checklist

Copy these to `.env.local`:

```env
# ✅ Stripe (Required)
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...

# ✅ Email (Required)  
RESEND_API_KEY=re_...
RESEND_FROM=Rotaract NYC <no-reply@rotaractnyc.org>

# ✅ URLs (Required)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# ℹ️ Firebase (Already configured)
NEXT_PUBLIC_FIREBASE_API_KEY=...
FIREBASE_SERVICE_ACCOUNT_BASE64=...
```

## 🎯 User Flows

### Admin Flow (3 steps)
1. **Navigate**: `/admin/members/invite`
2. **Enter**: Email, first name, last name
3. **Send**: System creates member + invitation + sends email

### Member Flow (3 steps)
1. **Email**: Click link → `/portal/onboarding?token=xyz`
2. **Profile**: Fill name, bio, photo, role, company
3. **Payment**: Pay $85 → Stripe Checkout → Success

### System Flow (automatic)
1. **Webhook**: Stripe → `/api/webhooks/stripe`
2. **Update**: Payment PAID → Member ACTIVE
3. **Email**: Send confirmation → Member can access portal

## 🧪 Testing Commands

```bash
# Start dev server
npm run dev

# Start Stripe webhook forwarding (separate terminal)
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## 💳 Stripe Test Cards

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | ✅ Success |
| `4000 0000 0000 0002` | ❌ Decline |
| `4000 0027 6000 3184` | 🔐 3D Secure |

**Any future expiry date, any 3-digit CVC, any 5-digit ZIP**

## 📊 Member Status States

```
INVITED ──────────────→ (Admin sent invitation)
    │
    └→ PENDING_PROFILE ──→ (Token validated)
            │
            └→ PENDING_PAYMENT ──→ (Profile completed)
                    │
                    └→ ACTIVE ──→ (Payment confirmed)
                            │
                            └→ INACTIVE (Optional: Admin deactivated)
```

## 🗂️ Key Files Reference

| File | Purpose |
|------|---------|
| `app/admin/members/invite/page.tsx` | Admin invite UI |
| `app/portal/onboarding/page.tsx` | Member onboarding flow |
| `app/api/stripe/checkout/route.ts` | Create payment session |
| `app/api/webhooks/stripe/route.ts` | Handle payment webhook |
| `lib/firebase/members.ts` | Member CRUD operations |
| `lib/firebase/invitations.ts` | Invitation management |
| `lib/email/onboardingTemplates.ts` | Email templates |

## 🔍 Quick Debug

### Check if member exists
```javascript
// Firestore Console → members collection
// Look for email: member@example.com
```

### Check payment status
```javascript
// Firestore Console → payments collection
// Filter by memberId or stripeSessionId
```

### Check invitation
```javascript
// Firestore Console → invitations collection
// Look for email and status
```

### Check Stripe webhook
```
Stripe Dashboard → Webhooks → View logs
```

## ✅ Pre-Launch Checklist

### Development
- [ ] Stripe package installed (`npm install stripe`)
- [ ] `.env.local` configured
- [ ] Stripe CLI installed and logged in
- [ ] Webhook forwarding running
- [ ] Test invite sent successfully
- [ ] Test onboarding completed
- [ ] Test payment processed
- [ ] Member status changed to ACTIVE

### Production
- [ ] Switch to Stripe **live** keys
- [ ] Configure production webhook in Stripe Dashboard
- [ ] Add env vars to Vercel
- [ ] Verify sender domain in Resend
- [ ] Deploy Firestore security rules
- [ ] Test complete flow in production
- [ ] Monitor webhook delivery rate

## 📞 Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| "Stripe package not found" | Run: `npm install stripe` |
| Email not sending | Check `RESEND_API_KEY` and verify sender domain |
| Webhook signature failed | Verify `STRIPE_WEBHOOK_SECRET` matches CLI output |
| Member stuck in PENDING_PAYMENT | Check Stripe Dashboard → resend webhook |
| Token expired | Ask admin to resend invitation |

## 📚 Documentation Links

- **Full Documentation**: [`docs/MEMBER_ONBOARDING.md`](./MEMBER_ONBOARDING.md)
- **Setup Guide**: [`docs/ONBOARDING_SETUP.md`](./ONBOARDING_SETUP.md)
- **Implementation Summary**: [`docs/ONBOARDING_IMPLEMENTATION_SUMMARY.md`](./ONBOARDING_IMPLEMENTATION_SUMMARY.md)

## 💡 Pro Tips

1. **Always test webhooks locally** with Stripe CLI before deploying
2. **Use test mode** keys during development
3. **Check webhook logs** in Stripe Dashboard if payments don't update
4. **Monitor email delivery** in Resend Dashboard
5. **Keep invitation expiry at 7 days** (configurable in code)

## 🎉 Ready to Go!

```bash
# Install dependencies
npm install stripe

# Start development
npm run dev

# In another terminal, start webhook forwarding
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Test the flow
# 1. Go to: http://localhost:3000/admin/members/invite
# 2. Invite a test member
# 3. Complete onboarding
# 4. Use test card: 4242 4242 4242 4242
```

**Questions?** Check the full documentation in [`docs/MEMBER_ONBOARDING.md`](./MEMBER_ONBOARDING.md)
