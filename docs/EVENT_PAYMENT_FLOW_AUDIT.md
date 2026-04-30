# Event Payment Flow Audit

> **Date**: April 28, 2026  
> **Last verified**: April 28, 2026 (5 subagents re-verified ALL source files)  
> **Scope**: Public & private event payment, RSVP, checkout, webhooks, check-in  
> **Files audited**: 15+ API routes, 5 UI components, 3 service modules, 1 webhook handler

---

## Architecture Overview

### Collections
| Collection | Purpose |
|---|---|
| `events` | Event documents with embedded `pricing.tiers[]` |
| `rsvps` | Member RSVP records (portal/authenticated) |
| `guest_rsvps` | Public guest RSVP + payment records |
| `transactions` | All payment transactions (dues, tickets, donations) |
| `processed_webhooks` | Idempotency guard for Stripe webhooks |
| `donors` | Cumulative donor tracking |
| `promo_codes` | Promo/discount codes (active/validFrom/validUntil/maxUses/usedCount/discountPercent) |
| `waitlist` | Guest waitlist entries |

### Public Event Flow (Guests)

```
PublicEventActions.tsx          ← Calendar/Share/Directions only (utility)
       │
       ▼
  GuestRsvpForm.tsx             ← Tier selection, quantity (paid only), Name/Email/Phone
       │
       ├── /api/events/rsvp     ← Validates event, returns pricing info for paid events
       │                          (does NOT pre-create guest_rsvps for paid events — ✅ fixed)
       ▼
  /api/events/checkout          ← Creates Stripe Checkout Session
       │                          (calls tryReserveTierSpot() BEFORE Stripe — ✅ fixed P0-4)
       ▼
  Stripe Checkout Page          ← Redirect to Stripe-hosted checkout
       │
       ▼
  Webhook: checkout.session.completed
       │
       ├── handleCheckoutCompleted() dispatcher
       │     └── handleGuestEventTicket()
       │           ├── Upserts guest_rsvps (status: 'going')
       │           ├── Creates transaction
       │           ├── Calls adjustTierSoldCount (Firestore transaction)
       │           └── Sends confirmation email (WITH tierLabel — ✅ fixed P1-10)
       │
       └── handlePaymentIntentSucceeded()  ← Fallback for direct PaymentIntent flows
```

### Portal Event Flow (Members)

```
app/portal/events/[id]/page.tsx
       │
       ├── EventActionBar.tsx   ← Calendar/Share/Directions ONLY (utility bar)
       │
       ├── EventRegistration.tsx ← Shows RSVP buttons + Purchase buttons
       │     │
       │     ├── handleRSVP() → /api/portal/events/rsvp
       │     │                   (accepts optional tierId — ✅ fixed P0-2)
       │     │
       │     └── handlePurchaseTicket() → /api/portal/events/checkout
       │                                   (calls tryReserveTierSpot() — ✅ fixed P0-4)
       │
       └── /api/portal/events/checkout
             ├── Creates Stripe session or logs offline payment
             ├── Calls tryReserveTierSpot() for atomic tier reservation
             └── Releases tier spot on failure via releaseTierSpot()
```

### Check-in Flow

```
EventQRCode.tsx           ← Generates HMAC-signed URL
       │
       ▼
  /portal/events/[id]/checkin?m=uid&t=ts&sig=xxxx
       │
       ▼
  Verify signature → Mark rsvps.checkedIn=true
  (✅ member RSVPs supported; guest check-in supported via admin checkin page)
```

---

## VERIFIED FIXED — These Issues Were Resolved Since Initial Audit

| Issue | Original Finding | Fix Verified |
|---|---|---|
| **P0-1** | Member refund didn't update RSVP | `handleChargeRefunded` now queries BOTH `guest_rsvps` AND `rsvps` by `stripeSessionId`. Member RSVPs are updated to `not_going` with `paymentStatus: 'refunded'`. Tier capacity is decremented via `adjustTierSoldCount()`. ✅ |
| **P0-2** | Portal RSVP missing tierId | `/api/portal/events/rsvp` accepts optional `tierId`, validates against event's `pricing.tiers[]`, checks deadline and capacity. ✅ |
| **P0-3** | Guest RSVP pre-creation stale records | Public `/api/events/rsvp` does NOT pre-create `guest_rsvps` for paid events — it only returns pricing info. Free events create direct `going` records. No stale `pending` records. ✅ |
| **P0-4** | No capacity check at Stripe creation | BOTH checkout routes call `tryReserveTierSpot()` BEFORE creating Stripe sessions. Spots released on failure via `releaseTierSpot()`. ✅ |
| **P0-5** | Expired session cleanup | `handleCheckoutExpired` in webhook handler NOW queries for pre-created records and marks them expired. ✅ |
| **P1-7** | No promo codes | `promoCode` accepted in checkout body. Firestore `promo_codes` collection exists. Validation against eventId, date range, maxUses. Discount applied before Stripe session creation. ✅ |
| **P1-8** | No custom attendee fields | `customFields` accepted in checkout body. Stored in `guest_rsvps` documents. ✅ |
| **P1-9** | Webhook monolithic | Refactored into strategy-pattern dispatcher with sub-handlers. ✅ |
| **P1-10** | Tier info missing from emails | `tierLabel` resolved from event document and passed to `sendTicketConfirmationEmail()`. ✅ |
| **P2-11** | event visibility filter | `type: 'public'` AND `status: 'published'` checks in public routes. ✅ |

---

## REMAINING ISSUES — Needs Work

### P1 — IMPORTANT: Missing Features

#### P1-6: Waitlist exists but needs UI integration
- **File**: `app/api/events/waitlist/route.ts` EXISTS
- **Status**: Backend endpoint created but needs frontend integration in `GuestRsvpForm.tsx` and `EventRegistration.tsx`
- **Action**: Wire up "Join Waitlist" button when event/tier is at capacity

#### P1-6b: Free events missing quantity selector in UI
- **File**: `components/public/GuestRsvpForm.tsx` lines 240-271
- **Status**: Quantity selector is gated behind `isPaid && unitPrice > 0` — free events cannot register multiple attendees
- **Action**: Allow quantity selection for free events (e.g., "I'm bringing 2 guests")

#### P1-6c: Custom fields not rendered in GuestRsvpForm
- **File**: `components/public/GuestRsvpForm.tsx`
- **Status**: `customFields` IS accepted by the API and stored, but the form does NOT render event-specific custom field inputs
- **Action**: Read event's `customFields` definition and render inputs dynamically

### P2 — ENHANCEMENT: UX Improvements

#### P2-12: No sold-out UI state differentiation
- **Files**: `GuestRsvpForm.tsx`, `PublicEventActions.tsx`, `EventRegistration.tsx`
- **Problem**: When an event is sold out, users see the same UI with a generic error. No visual differentiation between "sold out" vs "coming soon" vs "registration closed".
- **Fix**: Add `isSoldOut` computed state. Render "Sold Out" badge + waitlist CTA. Disable purchase buttons with clear messaging.

#### P2-13: No tax/surcharge support
- **Files**: `app/api/events/checkout/route.ts`, `app/api/portal/events/checkout/route.ts`
- **Problem**: No support for tax calculation, processing fees, or surcharges on ticket purchases.
- **Fix**: Add optional `taxRate` and `processingFeePercent` fields to event pricing. Apply in checkout before creating Stripe session.

#### P2-14: No partial refund admin UI
- **File**: `lib/stripe/webhooks.ts` `handleChargeRefunded` supports partial refunds
- **Status**: Backend code handles partial refunds (records `refundAmount`, `partialRefund: true`), but NO admin UI to initiate them
- **Action**: Add "Issue Partial Refund" button in admin event purchaser view

### P3 — NICE-TO-HAVE: Future Features

#### P3-15: Digital tickets / PDF
- After successful payment, generate a PDF ticket with QR code, event details, and attendee name
- Email as attachment or provide download link in confirmation

#### P3-16: Calendar invite with confirmation email
- Attach `.ics` file to confirmation email for one-click calendar add

#### P3-17: Recurring event RSVP
- Support for "RSVP to all 4 sessions" for recurring event series

#### P3-18: Group/table registration
- Allow one person to register multiple named attendees (not just quantity)

#### P3-19: Admin manual ticket creation
- Admin ability to create tickets/RSVPs for walk-ins or phone registrations

---

## Summary

| Priority | Total | Fixed | Remaining |
|---|---|---|---|
| P0 Critical | 5 | 5 ✅ | 0 |
| P1 Important | 6 | 4 ✅ | 2 |
| P2 Enhancement | 5 | 1 ✅ | 4 |
| P3 Nice-to-Have | 6 | 0 | 6 |

**Overall fix rate: 10/22 items resolved since initial audit.**

### Top 3 Actions for Next Sprint
1. **P1-6b**: Free event quantity selector (2-line guard removal in `GuestRsvpForm.tsx`)
2. **P2-12**: Sold-out UI states in all event components
3. **P1-6c**: Custom fields rendering in guest form