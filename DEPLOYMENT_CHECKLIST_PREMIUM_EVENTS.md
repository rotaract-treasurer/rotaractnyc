# ✅ Premium Event System - Deployment Checklist

## Pre-Deployment Setup

### 1. Environment Configuration

#### Required Environment Variables
```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...              # Get from Stripe Dashboard
STRIPE_WEBHOOK_SECRET=whsec_...            # Created after webhook setup
NEXT_PUBLIC_BASE_URL=https://your-domain.com

# Existing Firebase variables should already be set
```

#### Verification
- [ ] All Stripe keys are from the same environment (test or live)
- [ ] `NEXT_PUBLIC_BASE_URL` matches your deployment URL
- [ ] Firebase Admin SDK is configured

### 2. Install Dependencies

```bash
npm install stripe
```

- [ ] Stripe SDK installed
- [ ] No dependency conflicts
- [ ] Build passes without errors

### 3. Firestore Configuration

#### Deploy Indexes
Create `firestore.indexes.json` entries:
```json
{
  "indexes": [
    {
      "collectionGroup": "eventRegistrations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "eventId", "order": "ASCENDING" },
        { "fieldPath": "userId", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "eventCheckouts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "sessionId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    }
  ]
}
```

Deploy:
```bash
firebase deploy --only firestore:indexes
```

- [ ] Indexes created successfully
- [ ] No index conflicts

#### Update Security Rules
Add to `firestore.rules`:
```javascript
match /eventRegistrations/{registrationId} {
  allow read: if request.auth != null && (
    resource.data.userId == request.auth.uid ||
    get(/databases/$(database)/documents/portalUsers/$(request.auth.uid)).data.role in ['ADMIN', 'BOARD', 'TREASURER']
  );
  allow create, update: if request.auth != null;
}

match /eventCheckouts/{checkoutId} {
  allow read: if request.auth != null && (
    resource.data.userId == request.auth.uid ||
    get(/databases/$(database)/documents/portalUsers/$(request.auth.uid)).data.role in ['ADMIN', 'BOARD', 'TREASURER']
  );
  allow create: if request.auth != null;
}
```

Deploy:
```bash
firebase deploy --only firestore:rules
```

- [ ] Security rules updated
- [ ] Rules validated successfully

### 4. Stripe Configuration

#### Create Webhook Endpoint
1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Configure:
   - **Endpoint URL**: `https://your-domain.com/api/events/webhook`
   - **Events to send**:
     - `checkout.session.completed`
     - `checkout.session.expired`
4. Copy the **Signing secret** (starts with `whsec_`)
5. Add to `.env.local` as `STRIPE_WEBHOOK_SECRET`

- [ ] Webhook endpoint created
- [ ] Events configured correctly
- [ ] Signing secret saved

#### Test Webhook (Optional)
Using Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/events/webhook
```

- [ ] Webhook receives test events
- [ ] No signature verification errors

## Deployment Steps

### 1. Build & Test Locally

```bash
# Build the application
npm run build

# Start production server
npm run start
```

Test locally:
- [ ] Admin can create free event
- [ ] Admin can create paid event with pricing
- [ ] Admin can create service event
- [ ] No build errors
- [ ] No console errors

### 2. Deploy to Production

```bash
# Deploy to Vercel (or your platform)
vercel --prod

# Or push to your deployment branch
git push origin main
```

- [ ] Deployment successful
- [ ] Environment variables set in hosting platform
- [ ] Build completes without errors

### 3. Post-Deployment Verification

#### Test Free Event Flow
1. Create a free event as admin
2. View event as member
3. Complete RSVP
4. Verify registration in Firebase

- [ ] Free event creation works
- [ ] RSVP successful
- [ ] Registration stored correctly

#### Test Paid Event Flow (TEST MODE)
1. Create paid event with member/guest pricing
2. View event as active member
3. Verify member discount shows
4. Complete checkout with test card: `4242 4242 4242 4242`
5. Verify webhook received
6. Check registration created

- [ ] Paid event creation works
- [ ] Member discount applied
- [ ] Checkout redirects to Stripe
- [ ] Payment processes successfully
- [ ] Webhook processes event
- [ ] Registration created

#### Test Service Event Flow
1. Create service event with hours
2. View event as member
3. Sign up to volunteer
4. Verify registration created

- [ ] Service event creation works
- [ ] Registration successful
- [ ] Service hours visible

### 4. Switch to Live Mode (When Ready)

#### Update Stripe Keys
1. Get live keys from Stripe Dashboard
2. Update `.env.local` or hosting platform:
   ```bash
   STRIPE_SECRET_KEY=sk_live_...
   ```
3. Update webhook to use live mode endpoint
4. Update `STRIPE_WEBHOOK_SECRET` with live webhook secret

- [ ] Live keys configured
- [ ] Webhook updated for live mode
- [ ] Test with real payment

## Post-Launch Monitoring

### Week 1 Checks

#### Daily
- [ ] Monitor webhook delivery in Stripe Dashboard
- [ ] Check Firebase logs for errors
- [ ] Verify registrations are being created
- [ ] Test each event type at least once

#### End of Week
- [ ] Review payment success rate
- [ ] Check member vs. guest registration ratio
- [ ] Gather user feedback
- [ ] Document any issues

### Ongoing Monitoring

#### Monthly
- [ ] Review event revenue
- [ ] Analyze early bird effectiveness
- [ ] Check service hours tracking
- [ ] Update pricing strategy as needed

#### Quarterly
- [ ] Review member discount impact on renewals
- [ ] Analyze event attendance trends
- [ ] Optimize pricing based on data
- [ ] Update documentation

## Troubleshooting Checklist

### Webhook Issues
- [ ] Verify webhook URL is correct
- [ ] Check webhook signing secret matches
- [ ] Review Stripe Dashboard → Developers → Webhooks for errors
- [ ] Test with Stripe CLI

### Payment Issues
- [ ] Confirm using correct API keys (not mixed test/live)
- [ ] Verify webhook is processing events
- [ ] Check browser console for errors
- [ ] Review Stripe payment logs

### Member Discount Issues
- [ ] Verify user has `status: 'active'` in portalUsers
- [ ] Check memberPrice is set on event
- [ ] Confirm user is logged in
- [ ] Review auth session validity

### Registration Issues
- [ ] Check capacity hasn't been exceeded
- [ ] Verify event hasn't reached registration deadline
- [ ] Review Firebase security rules
- [ ] Check user authentication

## Admin Training Checklist

### Event Creation Training
- [ ] Walk through 4-step wizard
- [ ] Demonstrate each event type
- [ ] Explain pricing strategy
- [ ] Show draft saving

### Event Management Training
- [ ] How to view registrations
- [ ] Where to check revenue
- [ ] How to edit events
- [ ] How to cancel/refund

### Monitoring Training
- [ ] Firebase Console navigation
- [ ] Stripe Dashboard overview
- [ ] Registration tracking
- [ ] Revenue reporting

## Documentation Provided

- [ ] `/docs/PREMIUM_EVENT_SYSTEM.md` - Complete system documentation
- [ ] `/docs/PREMIUM_EVENT_SETUP.md` - Setup guide
- [ ] `/docs/PREMIUM_EVENT_COMPONENTS.md` - Component reference
- [ ] `/PREMIUM_EVENT_SYSTEM_README.md` - Quick start guide

## Support Resources

### For Admins
- **Event Creation**: Step-by-step wizard with contextual help
- **Documentation**: Comprehensive docs in `/docs` folder
- **Support**: Tech team contact

### For Developers
- **Code**: Well-commented components
- **TypeScript**: Full type safety
- **API Docs**: Inline documentation
- **Testing**: Test scenarios included

## Success Metrics

### Technical Metrics
- [ ] 99%+ webhook delivery rate
- [ ] < 1% payment failure rate
- [ ] Zero security incidents
- [ ] < 500ms page load times

### Business Metrics
- [ ] 30%+ member registration rate for paid events
- [ ] 50%+ early bird conversion rate
- [ ] 100+ service hours tracked per month
- [ ] Positive user feedback

## Rollback Plan

If issues arise:

1. **Disable New Event Creation**:
   - Temporarily hide "Create Event" button
   - Fix issues in development
   - Redeploy when ready

2. **Revert to Previous Version**:
   ```bash
   vercel rollback
   ```

3. **Emergency Contact**:
   - Tech team lead
   - Stripe support
   - Firebase support

## Sign-Off

### Technical Lead
- [ ] All tests passing
- [ ] Documentation complete
- [ ] No critical errors
- [ ] Ready for deployment

**Signed**: _________________ Date: _______

### Admin Lead
- [ ] Training completed
- [ ] Processes documented
- [ ] Support plan in place
- [ ] Ready to launch

**Signed**: _________________ Date: _______

### Board Approval
- [ ] Pricing strategy approved
- [ ] Member benefits communicated
- [ ] Launch timeline confirmed
- [ ] Budget allocated

**Signed**: _________________ Date: _______

---

## Launch Date
**Target**: __________________  
**Actual**: __________________

## Post-Launch Notes
_Use this space to document any issues, feedback, or improvements needed:_

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Next Review**: _________________
