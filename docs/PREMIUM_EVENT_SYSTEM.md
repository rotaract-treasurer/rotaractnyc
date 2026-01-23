# Premium Event System with Pricing & Member Discounts

## Overview

The enhanced event creation system supports multiple event types with sophisticated pricing models, Stripe payment integration, and member discount capabilities.

## Event Types

### 1. Free Events
- **Use Case**: Social gatherings, general meetings, networking events
- **Features**:
  - Simple RSVP system
  - Capacity management
  - Guest allowance
  - No payment required
- **Member Benefits**: Same access as non-members

### 2. Paid Events
- **Use Case**: Galas, workshops, conferences, ticketed events
- **Features**:
  - Stripe payment integration
  - Member vs. guest pricing
  - Early bird discounts
  - Automatic member discount application
- **Member Benefits**: Discounted pricing (typically 20-40% off guest price)

### 3. Service/Volunteer Events
- **Use Case**: Community service projects, volunteer opportunities
- **Features**:
  - Service hours tracking
  - Volunteer capacity management
  - Service description
  - Members-only or open to non-members
- **Member Benefits**: Service hours automatically tracked and added to member profile

### 4. Hybrid Events (Future)
- Combination of paid + service or other variations

## Pricing Structure

### Standard Pricing
- **Member Price**: Discounted rate for active members
- **Guest Price**: Standard rate for non-members or member guests

### Early Bird Pricing
- **Member Early Bird**: Special discounted rate for members who register early
- **Guest Early Bird**: Discounted rate for non-members who register early
- **Deadline**: Configurable date/time when early bird pricing expires

### Pricing Example
```
Annual Gala 2024
├── Member Price: $35
├── Member Early Bird: $30 (until March 1)
├── Guest Price: $50
└── Guest Early Bird: $45 (until March 1)
```

## Event Creation Wizard (4 Steps)

### Step 1: Logistics
- Event title
- Venue type (physical/virtual/hybrid)
- Location or virtual link
- Date and time
- Time zone

### Step 2: Content
- Description
- Cover image
- Visibility (public/member/board)
- Category tags
- Admin notes

### Step 3: Pricing & Registration ⭐ NEW
- **Event Type Selection**:
  - Free event
  - Paid event
  - Service/volunteer event
  
- **Pricing Configuration** (for paid events):
  - Member pricing (standard + early bird)
  - Guest pricing (standard + early bird)
  - Early bird deadline
  - Currency (default: USD)
  
- **Registration Settings**:
  - Capacity limit
  - Registration deadline
  - Allow guests toggle
  - Guest count limits

- **Service Configuration** (for service events):
  - Service hours per volunteer
  - Service description
  - Volunteer capacity
  - Allow non-member volunteers

### Step 4: Review & Publish
- Summary of all event details
- Pricing preview
- Service information (if applicable)
- Publish or save as draft

## Stripe Integration

### Setup Requirements
1. **Environment Variables**:
   ```bash
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   NEXT_PUBLIC_BASE_URL=https://yourdomain.com
   ```

2. **Webhook Configuration**:
   - Endpoint: `/api/events/webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `checkout.session.expired`

### Payment Flow

1. **User Selects Event & Tickets**:
   - User views event details
   - System checks membership status
   - Pricing is calculated based on:
     - Member vs. guest status
     - Early bird deadline
     - Guest count

2. **Checkout Creation**:
   - API endpoint: `POST /api/events/checkout`
   - Creates Stripe checkout session
   - Stores checkout attempt in `eventCheckouts` collection
   - Redirects user to Stripe

3. **Payment Completion**:
   - Stripe webhook receives `checkout.session.completed`
   - System creates event registration
   - Increments event attendee count
   - Sends confirmation email (future)

4. **Success/Failure**:
   - Success: Redirect to `/events/{id}?payment=success`
   - Cancelled: Redirect to `/events/{id}?payment=cancelled`

## Database Schema

### Events Collection (`portalEvents`)
```typescript
{
  id: string
  title: string
  description: string
  startAt: Timestamp
  endAt: Timestamp
  location: string
  visibility: 'public' | 'member' | 'board'
  
  // Event Type & Registration
  eventType: 'free' | 'paid' | 'service' | 'hybrid'
  requiresRegistration: boolean
  capacity?: number
  attendeeCount?: number
  registrationDeadline?: Timestamp
  allowGuests: boolean
  
  // Pricing (for paid events)
  memberPrice?: number
  memberEarlyBirdPrice?: number
  earlyBirdDeadline?: Timestamp
  guestPrice?: number
  guestEarlyBirdPrice?: number
  
  // Service (for service events)
  serviceHours?: number
  serviceDescription?: string
  
  // Media & Display
  imageUrl?: string
  venueType: 'physical' | 'virtual' | 'hybrid'
  virtualLink?: string
  tags?: string[]
  
  // Admin
  adminNotes?: string
  status: 'draft' | 'published' | 'cancelled'
  createdBy: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### Event Registrations Collection (`eventRegistrations`)
```typescript
{
  id: string
  eventId: string
  userId: string
  
  // Ticket Info
  ticketType: 'member' | 'guest'
  quantity: number
  guestCount: number
  
  // Pricing Info
  isMember: boolean
  isEarlyBird: boolean
  amountPaid?: number
  
  // Payment Info (for paid events)
  stripeSessionId?: string
  stripePaymentIntentId?: string
  
  // Status
  status: 'confirmed' | 'cancelled' | 'pending'
  eventType: 'free' | 'paid' | 'service'
  
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### Event Checkouts Collection (`eventCheckouts`)
```typescript
{
  id: string
  eventId: string
  userId: string
  sessionId: string  // Stripe session ID
  
  // Purchase Details
  ticketType: 'member' | 'guest'
  quantity: number
  guestCount: number
  totalAmount: number
  
  // Status Tracking
  status: 'pending' | 'completed' | 'expired'
  paymentIntentId?: string
  completedAt?: Timestamp
  expiredAt?: Timestamp
  
  createdAt: Timestamp
}
```

## Member Benefits

### Automatic Member Discount
- System automatically checks user's membership status
- Active members (`status: 'active'`) get member pricing
- Inactive/alumni/pending users see guest pricing

### Member-Only Features
- Service hour tracking (only for active members)
- Access to member-only events
- Early access to event registration (future)

### Visual Indicators
- Member pricing highlighted in green/primary color
- Savings calculator shows discount amount
- "Become a Member" CTA for non-members on paid events

## Admin Features

### Event Management
- Create events with 4-step wizard
- Save drafts while working
- Auto-save every 30 seconds
- Preview before publishing

### Pricing Control
- Set member and guest prices independently
- Configure early bird pricing with deadlines
- Choose event type (free/paid/service)
- Set capacity and registration deadlines

### Registration Monitoring
- View attendee count in real-time
- Track member vs. guest registrations
- Monitor revenue (paid events)
- Export attendee lists (future)

### Service Hours Tracking
- Automatic service hours credited to members
- Service hour approval workflow
- Member service hour history

## User Experience

### Event Discovery
- Filter by event type
- See pricing at a glance
- Member discount badge on paid events
- Service hours displayed prominently

### Registration Flow

#### Free Events:
1. Click "RSVP Now"
2. Select guest count (if allowed)
3. Instant confirmation

#### Paid Events:
1. View pricing (member discount auto-applied)
2. Select guest count (if allowed)
3. See total price
4. Click "Proceed to Payment"
5. Complete Stripe checkout
6. Receive confirmation

#### Service Events:
1. View service hours earned
2. Read service description
3. Sign up to volunteer
4. Service hours auto-tracked upon completion

## API Endpoints

### Event Creation & Management
- `GET /api/admin/events` - List all events
- `POST /api/admin/events` - Create new event
- `PUT /api/admin/events` - Update existing event
- `DELETE /api/admin/events` - Delete event

### User Registration
- `POST /api/events/rsvp` - RSVP for free/service events
- `DELETE /api/events/rsvp?eventId={id}` - Cancel RSVP

### Payment Processing
- `POST /api/events/checkout` - Create Stripe checkout session
- `POST /api/events/webhook` - Stripe webhook handler

## Best Practices

### Pricing Strategy
1. **Member Discount**: Typically 20-40% off guest price
2. **Early Bird**: 10-20% off standard price
3. **Guest Pricing**: Cover costs + small margin
4. **Free Events**: Use for community building

### Event Types
- **Social Events**: Free (build community)
- **Professional Development**: Paid with member discount
- **Service Projects**: Service type (track impact)
- **Fundraisers**: Paid (higher guest prices acceptable)

### Member Benefits
- Highlight savings in event descriptions
- Show member discount prominently
- Use member-only events strategically
- Track and celebrate service hours

### Capacity Management
- Set realistic capacity limits
- Account for venue size
- Consider virtual attendance
- Plan for no-shows (10-15%)

## Testing Checklist

### Event Creation
- [ ] Create free event
- [ ] Create paid event with member/guest pricing
- [ ] Create service event with hour tracking
- [ ] Set early bird pricing with deadline
- [ ] Save draft and resume editing
- [ ] Publish event

### Registration Flow
- [ ] RSVP for free event as member
- [ ] RSVP for free event as non-member
- [ ] Register with guests
- [ ] Complete paid registration as member
- [ ] Complete paid registration as non-member
- [ ] Test early bird pricing (before/after deadline)
- [ ] Test capacity limits
- [ ] Cancel registration

### Stripe Integration
- [ ] Successful payment flow
- [ ] Cancelled payment
- [ ] Webhook processing
- [ ] Member discount application
- [ ] Early bird discount application

## Future Enhancements

### Planned Features
- [ ] Waitlist for sold-out events
- [ ] Recurring events
- [ ] Group discounts
- [ ] Promo codes
- [ ] Member guest passes
- [ ] Automatic confirmation emails
- [ ] Calendar integration (Google/Apple)
- [ ] QR code check-in
- [ ] Post-event survey

### Analytics
- [ ] Revenue tracking
- [ ] Attendance trends
- [ ] Member vs. guest ratio
- [ ] Service hours dashboard
- [ ] Early bird effectiveness

## Support & Documentation

### For Admins
- Event creation best practices guide
- Pricing strategy recommendations
- Stripe dashboard access
- Registration management tools

### For Members
- How to RSVP guide
- Payment instructions
- Service hours tracking
- Member benefits overview

## Troubleshooting

### Common Issues

**"Event Full" Error**:
- Check capacity settings
- Verify attendeeCount is accurate
- Consider increasing capacity

**Payment Not Processing**:
- Verify Stripe API keys
- Check webhook configuration
- Review Stripe dashboard for errors

**Member Discount Not Applied**:
- Verify user membership status (`status: 'active'`)
- Check memberPrice is set
- Ensure user is logged in

**Service Hours Not Tracking**:
- Confirm eventType is 'service'
- Verify user is active member
- Check serviceHours field is set

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Maintainer**: Tech Team
