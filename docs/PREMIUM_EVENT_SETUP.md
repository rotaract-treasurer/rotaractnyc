# Premium Event System - Quick Setup Guide

## Overview
This guide will help you set up the new premium event creation system with Stripe integration, member discounts, and multi-event-type support.

## Prerequisites

1. **Stripe Account**: [Sign up at stripe.com](https://stripe.com)
2. **Firebase Project**: Already configured
3. **Environment Variables**: Access to `.env.local`

## Step-by-Step Setup

### 1. Install Stripe SDK (if not already installed)

```bash
npm install stripe
```

### 2. Configure Stripe API Keys

Add to your `.env.local`:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

**Where to find these keys:**
- **Secret Key**: Stripe Dashboard → Developers → API Keys
- **Webhook Secret**: Created in step 4 below

### 3. Create Firestore Indexes

Add to `firestore.indexes.json`:

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

Deploy indexes:
```bash
firebase deploy --only firestore:indexes
```

### 4. Configure Stripe Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter your endpoint URL:
   ```
   https://your-domain.com/api/events/webhook
   ```
4. Select events to listen for:
   - `checkout.session.completed`
   - `checkout.session.expired`
5. Copy the webhook signing secret
6. Add to `.env.local` as `STRIPE_WEBHOOK_SECRET`

### 5. Update Firestore Security Rules

Add to `firestore.rules`:

```javascript
match /eventRegistrations/{registrationId} {
  // Users can read their own registrations
  allow read: if request.auth != null && resource.data.userId == request.auth.uid;
  
  // System can create/update registrations
  allow create, update: if request.auth != null;
  
  // Admins can read all
  allow read: if get(/databases/$(database)/documents/portalUsers/$(request.auth.uid)).data.role in ['ADMIN', 'BOARD', 'TREASURER'];
}

match /eventCheckouts/{checkoutId} {
  // Users can read their own checkouts
  allow read: if request.auth != null && resource.data.userId == request.auth.uid;
  
  // System can create checkouts
  allow create: if request.auth != null;
  
  // Admins can read all
  allow read: if get(/databases/$(database)/documents/portalUsers/$(request.auth.uid)).data.role in ['ADMIN', 'BOARD', 'TREASURER'];
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

## Using the New Event Creation System

### Accessing the Admin Panel

1. Navigate to `/admin/events`
2. Click "Create New Event"
3. Follow the 4-step wizard

### Creating Different Event Types

#### Free Event Example
```
Step 1 (Logistics):
- Title: "Monthly Networking Mixer"
- Location: "Hudson Terrace"
- Date: March 15, 2025
- Time: 6:00 PM

Step 2 (Content):
- Description: "Join us for drinks and networking!"
- Upload cover image

Step 3 (Pricing):
- Event Type: Free Event
- Capacity: 50
- Allow Guests: Yes

Step 4 (Review):
- Review and publish
```

#### Paid Event Example
```
Step 1 (Logistics):
- Title: "Annual Gala 2025"
- Location: "The Plaza Hotel"
- Date: June 20, 2025
- Time: 7:00 PM

Step 2 (Content):
- Description: "Our premier fundraising event..."
- Upload cover image

Step 3 (Pricing):
- Event Type: Paid Event
- Member Price: $75
- Member Early Bird: $65 (until May 1)
- Guest Price: $100
- Guest Early Bird: $90 (until May 1)
- Capacity: 200
- Allow Guests: Yes

Step 4 (Review):
- Review and publish
```

#### Service Event Example
```
Step 1 (Logistics):
- Title: "Food Bank Volunteering"
- Location: "NYC Food Bank"
- Date: April 10, 2025
- Time: 9:00 AM

Step 2 (Content):
- Description: "Help sort and pack food for families..."
- Upload cover image

Step 3 (Pricing):
- Event Type: Service Event
- Service Hours: 4.0
- Service Description: "Food sorting and distribution"
- Volunteer Capacity: 20
- Allow Non-Members: No

Step 4 (Review):
- Review and publish
```

## Testing the System

### Test Mode (Recommended First)

1. Use Stripe test API keys (start with `sk_test_`)
2. Use test card numbers:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`

### Test Scenarios

#### Test 1: Free Event RSVP
1. Create a free event
2. Log in as a member
3. Navigate to event page
4. Click "RSVP Now"
5. Verify registration appears in Firebase

#### Test 2: Paid Event (Member Discount)
1. Create a paid event with member/guest pricing
2. Log in as an active member
3. See member price displayed
4. Complete checkout
5. Verify payment in Stripe dashboard

#### Test 3: Early Bird Pricing
1. Create event with early bird deadline in future
2. Verify early bird price is shown
3. Wait for deadline to pass (or change system time)
4. Verify standard price is shown

#### Test 4: Service Event
1. Create service event
2. Log in as active member
3. Sign up to volunteer
4. Admin marks attendance
5. Verify service hours added to member profile

## Monitoring & Maintenance

### Check Event Registrations
```javascript
// In Firebase Console
db.collection('eventRegistrations')
  .where('eventId', '==', 'YOUR_EVENT_ID')
  .get()
```

### View Payment History
```javascript
// In Firebase Console
db.collection('eventCheckouts')
  .where('status', '==', 'completed')
  .orderBy('createdAt', 'desc')
  .limit(50)
  .get()
```

### Monitor Stripe Dashboard
- Payments → View all transactions
- Webhooks → Check webhook delivery status
- Logs → Debug any issues

## Troubleshooting

### Webhook Not Receiving Events

**Solution**:
1. Check webhook URL is correct
2. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
3. Test webhook with Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/events/webhook
   ```

### Member Discount Not Showing

**Check**:
1. User has `status: 'active'` in `portalUsers` collection
2. Event has `memberPrice` set
3. User is logged in

### Payment Failing

**Debug**:
1. Check Stripe dashboard for error messages
2. Verify API keys are correct (not mixed test/live)
3. Check webhook is processing `checkout.session.completed`
4. Review Firebase logs for errors

## Going Live

### Pre-Launch Checklist

- [ ] Switch to Stripe live API keys
- [ ] Update webhook endpoint to production URL
- [ ] Test complete payment flow in production
- [ ] Verify email confirmations work (if implemented)
- [ ] Train admins on event creation
- [ ] Document pricing strategy

### Post-Launch Monitoring

Week 1:
- [ ] Monitor all registrations
- [ ] Check webhook delivery rate
- [ ] Review payment success rate
- [ ] Collect user feedback

Month 1:
- [ ] Analyze member vs. guest registration ratio
- [ ] Review early bird effectiveness
- [ ] Track service hours logged
- [ ] Calculate revenue by event type

## Support Resources

### Documentation
- Full system documentation: `/docs/PREMIUM_EVENT_SYSTEM.md`
- Stripe documentation: https://stripe.com/docs
- Firebase documentation: https://firebase.google.com/docs

### Common Admin Tasks

**Update Event Pricing**:
1. Go to `/admin/events`
2. Click edit on event
3. Navigate to Pricing step
4. Update prices
5. Save changes

**View Event Registrations**:
1. Firebase Console → Firestore
2. Navigate to `eventRegistrations`
3. Filter by `eventId`

**Refund a Ticket**:
1. Go to Stripe Dashboard
2. Find payment
3. Click "Refund"
4. Update registration status in Firebase

## Next Steps

After successful setup:

1. **Create Test Events**: Create one of each event type
2. **Train Admins**: Walk through event creation process
3. **Document Pricing**: Set organization pricing standards
4. **Member Communication**: Announce new event types and benefits
5. **Monitor Usage**: Track registrations and adjust as needed

## Need Help?

- **Technical Issues**: Check Firebase logs and Stripe dashboard
- **Stripe Support**: https://support.stripe.com
- **Feature Requests**: Add to project backlog

---

**Setup Time**: ~30 minutes  
**Difficulty**: Intermediate  
**Prerequisites**: Stripe account, Firebase access
