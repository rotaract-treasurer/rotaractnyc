# Event Payment Flow Audit

> Date: April 28, 2026  
> Scope: Public & private event payment, RSVP, checkout, webhooks, check-in  
> Files audited: 15+ API routes, 3 UI components, 2 service modules, 1 webhook handler

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                    PUBLIC EVENT FLOW (Guests)                      │
│                                                                    │
│  PublicEventActions.tsx → GuestRsvpForm.tsx → /api/events/rsvp    │
│       │                          │           (validates tier)      │
│       │                          ▼                                 │
│       │              /api/events/checkout → Stripe Session        │
│       │              (creates checkout session)                    │
│       │                          │                                 │
│       │                          ▼                                 │
│       │              Stripe Checkout Page                         │
│       │                          │                                 │
│       │                          ▼                                 │
│       │              Webhook: checkout.session.completed          │
│       │              → handleCheckoutCompleted()                  │
│       │              → upserts guest_rsvps doc                    │
│       │              → creates transaction                        │
│       │              → adjusts tier sold count                    │
│       │              → sends confirmation email                   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                 PUBLIC EVENT FLOW (Members)                        │
│                                                                    │
│  PublicEventActions.tsx → /api/events/checkout → Stripe           │
│       │                  (type: 'event'/'event_ticket')            │
│       │                          │                                 │
│       │                          ▼                                 │
│       │              Webhook: checkout.session.completed          │
│       │              → upserts rsvps doc (member)                 │
│       │              → creates transaction                        │
│       │              → adjusts tier sold count                    │
│       │              → sends confirmation email                   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                PORTAL EVENT FLOW (Members)                         │
│                                                                    │
│  EventActionBar.tsx → /api/portal/events/rsvp                     │
│       │              (free events: rsvp only)                     │
│       │              (paid events: → checkout)                     │
│       │                          │                                 │
│       │                          ▼                                 │
│       │              Webhook: checkout.session.completed          │
│       │              → upserts rsvps doc                          │
│       │              → creates transaction                        │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                     CHECK-IN FLOW                                  │
│                                                                    │
│  EventQRCode.tsx → Generates HMAC-signed URL                      │
│       │                                                           │
│       ▼                                                           │
│  /portal/events/[id]/checkin?m=uid&t=ts&sig=xxxx                 │
│       │                                                           │
│       ▼                                                           │
│  Verify signature → Mark rsvps.checkedIn=true                     │
└──────────────────────────────────────────────────────────────────┘
```

**Key collections**: `events`, `rsvps`, `guest_rsvps`, `transactions`, `processed_webhooks`, `donors`

---

## P0 — CRITICAL: Bugs & Missing Functionality

### 1. Member refund does NOT update RSVP or free tier capacity

- **File**: `lib/stripe/webhooks.ts` — `handleChargeRefunded()` (lines 545–595)
- **Problem**: When a charge is refunded, the handler only updates `guest_rsvps` (lines 568–580). If the ticket was purchased by a member (via `type: 'event'` or `type: 'event_ticket'` metadata), their RSVP in the `rsvps` collection remains `status: 'going'` and the `attendeeCount`/`soldCount` on the tier is never decremented.
- **Impact**: Refunded members still appear in attendee lists, still count toward capacity, and can still check in. Tier capacity can permanently leak.
- **Fix**: Also query `rsvps` by `stripeSessionId` or `memberId + eventId` and update status to `'not_going'`, then decrement the tier sold count.

### 2. Portal RSVP endpoint does NOT accept tier selection

- **File**: `app/api/portal/events/rsvp/route.ts` (lines 24–32)
- **Problem**: The endpoint only accepts `{ eventId, status }`. Members cannot select which `tierId` they want when RSVPing for a paid event with multiple tiers. The `tierId` is stored from a prior checkout or previous RSVP, but never set by this endpoint.
- **Impact**: Members cannot change their tier preference through the RSVP flow; tier tracking will be inaccurate for member-only paid events.
- **Fix**: Add optional `tierId` to the request body, validate it against the event's available tiers, and set it in the RSVP document.

### 3. Guest RSVP can create a duplicate after purchase

- **Files**: `lib/stripe/webhooks.ts` lines 226–232 AND `components/public/GuestRsvpForm.tsx`
- **Problem**: The guest RSVP form first calls `/api/events/rsvp` to validate and potentially pre-create a `guest_rsvps` record. Then the checkout flow starts. If the user abandons checkout and comes back with a different quantity/tier, the `/api/events/rsvp` route checks by `email+eventId` uniqueness but the webhook handler also does a similar dedup. These two can disagree.
- **Impact**: Potential for orphaned or duplicate `guest_rsvps` records.
- **Fix**: Remove the pre-creation step in `/api/events/rsvp` for guests; let the webhook be the sole creator. Validate at checkout time only.

### 4. No tier capacity check at checkout time (race condition)

- **File**: `app/api/events/checkout/route.ts`
- **Problem**: The checkout endpoint creates a Stripe session without checking if the requested tier has remaining capacity. The capacity check happens in the webhook after payment completes (`adjustTierSoldCount` uses `FieldValue.increment` which is atomic, but the check is done in the tier tracking service). If two users both check out the last ticket simultaneously, both Stripe sessions are created but only one should succeed.
- **Impact**: Overbooking — more tickets sold than available capacity.
- **Fix**: In the checkout route, read the current `soldCount` from the event's tier document before creating the Stripe session. If at capacity, return an error. Additionally, consider using Firestore transactions to atomically check-and-increment.

### 5. Checkout session expiry is not handled

- **File**: `lib/stripe/webhooks.ts` — `handleCheckoutExpired()` (line 604–610)
- **Problem**: When a checkout session expires, the function only logs it. No cleanup of any pre-created RSVP records or temporary holds is performed.
- **Impact**: If the guest RSVP flow pre-creates a record (see P0 #3), an expired checkout session leaves an orphaned guest RSVP.
- **Fix**: Query for any pre-created RSVP records and delete or mark them as expired.

---

## P1 — IMPORTANT: Missing Features

### 6. No guest waitlist / oversubscription handling

- **Files affected**: All public-facing event components, checkout flow, webhook handler
- **Problem**: When an event or tier is at capacity, there is no mechanism for guests to join a waitlist or receive notifications when spots open up.
- **Recommended**: Add a `waitlist` status to `guest_rsvps`. When capacity opens (refund, cancellation), automatically notify the next waitlisted guest. Limit waitlist to, e.g., 2× capacity.

### 7. No promo / discount codes

- **Files affected**: `app/api/events/checkout/route.ts`, `types/index.ts`
- **Problem**: No support for promotional codes, early-bird codes, member discounts, or partner discounts applied at checkout.
- **Recommended**: Add a `promoCodes` collection, a `promoCode` field to the checkout request, and validate/apply discounts before creating the Stripe session. Store the applied promo code in the transaction.

### 8. No custom attendee fields / preferences

- **Files affected**: `components/public/GuestRsvpForm.tsx`, webhook handler, types
- **Problem**: When guests purchase tickets, only `name`, `email`, and `phone` are collected. No support for dietary restrictions, accessibility needs, t-shirt size, plus-one name, or event-specific custom questions.
- **Recommended**: Add a `customFields?: Record<string, string>` field to the guest RSVP check-in form and store the values in `guest_rsvps`. Allow event administrators to define custom fields in the event creation form.

### 9. Webhook handler is monolithic and hard to extend

- **File**: `lib/stripe/webhooks.ts` — `handleCheckoutCompleted()` (137–353 lines)
- **Problem**: One massive function handles dues, member event tickets, guest event tickets, and donations with deeply nested if/else branches. Adding new metadata types requires modifying this function.
- **Recommended**: Decompose into separate handler functions: `handleDuesPayment()`, `handleEventTicket()`, `handleGuestEventTicket()`, `handleDonation()`. Use a strategy-pattern map keyed by `type`.

### 10. Confirmation emails do not include tier information

- **File**: `lib/stripe/webhooks.ts` — `sendTicketConfirmationEmail()` (lines 109–135)
- **Problem**: The `guestTicketConfirmationEmail` template receives the event details and amount, but not the tier name/label. VIP purchasers get the same email as General Admission.
- **Impact**: Confusion for purchasers; no clear receipt of what tier was purchased.
- **Fix**: Pass `tier.label` and `tier.description` to the email template.

### 11. No quantity selector for guest ticket purchases

- **File**: `components/public/GuestRsvpForm.tsx`
- **Problem**: The public guest RSVP form only allows selecting a tier. There is no quantity selector for purchasing multiple tickets in a single transaction.
- **Impact**: Groups must complete multiple separate checkout flows to buy multiple tickets.
- **Fix**: Add a quantity selector (1–10), pass `quantity` in the checkout metadata, and account for it in the webhook handler (the webhook already reads `quantity` from metadata).

---

## P2 — ENHANCEMENTS

### 12. Event visibility is binary (`isPublic: boolean`)

- **File**: `types/index.ts` line 99
- **Problem**: Events are either public or private. No support for unlisted/hidden events (link-only), invite-only events, or members-only events that also show in the portal.
- **Recommended**: Replace `isPublic: boolean` with `visibility: 'public' | 'members_only' | 'unlisted' | 'invite_only'`. Update the public events list query and the member portal events query to respect this field.

### 13. No tax support in checkout

- **Files**: `app/api/events/checkout/route.ts`, `lib/stripe/webhooks.ts`
- **Problem**: No tax calculation, tax rate configuration, or tax metadata in checkout sessions or transactions.
- **Recommended**: Add a `taxRatePercent` field to events (default 0). Use Stripe's tax rate API or manually calculate and include tax in the checkout session's `line_items`. Record tax amount separately in transactions.

### 14. No sold-out visual indicator on public pages

- **File**: `components/public/PublicEventActions.tsx`
- **Problem**: When a tier is at capacity, the UI does not visually indicate it's sold out before the user clicks through.
- **Fix**: Fetch tier capacity data and display "Sold Out" badges on full tiers. Disable the purchase button for sold-out tiers.

### 15. Partial refunds not fully supported

- **File**: `lib/stripe/webhooks.ts` — `handleChargeRefunded()`
- **Problem**: The refund handler records `refundAmount` but does not distinguish between partial and full refunds. A partial refund should not change the RSVP status.
- **Fix**: Compare `charge.amount_refunded` to `charge.amount` (the original charge amount). Only cancel the RSVP if fully refunded.

### 16. `payment_intent.payment_failed` does not update RSVP

- **File**: `lib/stripe/webhooks.ts` — `handlePaymentFailed()` (line 597–599)
- **Problem**: On payment failure, only a console.error is logged. If a pre-created RSVP exists, it remains orphaned.
- **Fix**: Look up any pre-created RSVP and mark it as `payment_failed` or delete it.

---

## P3 — NICE TO HAVE

### 17. No in-app digital ticket view

- Members and guests cannot view a scannable QR code or digital ticket for their purchased events. The check-in flow currently uses a separate QR code generated by admins.
- **Recommended**: Generate a unique ticket ID at purchase time. Allow attendees to view their ticket with a QR code in the portal.

### 18. No calendar invite (.ics) after RSVP or purchase

- After RSVPing or purchasing a ticket, the attendee does not receive a calendar invite file.
- **Recommended**: Generate an `.ics` attachment in confirmation emails using the event's date/time/location data.

### 19. No recurring event RSVP series support

- The type system has `RecurrenceRule` but the RSVP flow only handles single events. Members must RSVP individually to each occurrence.
- **Recommended**: Add a "RSVP to all occurrences" option when RSVPing to a recurring event.

### 20. No event-specific merchandise / donation upsell

- During checkout, there's no option to add a donation or purchase event merchandise.
- **Recommended**: Add optional donation amount or merchandise SKU to the checkout flow.

### 21. Guest email verification is not enforced

- **File**: `app/api/events/checkout/route.ts` and webhook handler
- **Problem**: Guest emails are accepted as-is without verification. A typo in the email means the confirmation is never received and the guest has no way to retrieve their ticket.
- **Recommended**: Send a verification code to the guest email before completing checkout, or use Stripe's built-in email collection with `customer_email`.

### 22. No admin ability to manually add/remove attendees

- No API endpoint for admins to manually add a guest (e.g., walk-in) or remove/cancel an RSVP.
- **Recommended**: Add admin CRUD endpoints for `guest_rsvps` and `rsvps`.

---

## Summary of Issues by Severity

| Priority | Count | Key Themes |
|----------|-------|------------|
| P0 (Critical) | 5 | Member refund bug, portal tier selection, guest RSVP dedup, race condition, expired session cleanup |
| P1 (Important) | 6 | Waitlist, promo codes, custom fields, webhook refactor, tier in emails, quantity selector |
| P2 (Enhancement) | 5 | Visibility, tax, sold-out UI, partial refunds, payment failed handling |
| P3 (Nice to Have) | 6 | Digital tickets, calendar invites, recurring RSVP, merchandise, email verification, admin management |

**Total: 22 actionable items identified**

---

## What's Working Well

1. **Idempotent webhook processing** via `processed_webhooks` collection with Firestore transactions — prevents duplicate Stripe event processing.
2. **Tier sold count uses `FieldValue.increment`** for atomic updates — base increment/decrement is race-condition-safe.
3. **HMAC-signed check-in URLs** with 24-hour expiry — secure, tamper-proof check-in flow.
4. **Dual-path processing** (`checkout.session.completed` + `payment_intent.succeeded` fallback) with crossover prevention (PI handler skips if a checkout session ID exists in metadata).
5. **Donor CRM** with cumulative tracking via `donors` collection — good foundation for fundraising analytics.
6. **Rate limiting** on RSVP and checkout endpoints.
7. **Session cookie auth** for all portal endpoints.

## Recommended Implementation Order

```
Phase 1 (Week 1): P0 fixes
  ├── Fix member refund RSVP update
  ├── Add tierId to portal RSVP endpoint
  ├── Add capacity check at checkout time
  └── Clean up guest RSVP dedup flow

Phase 2 (Week 2-3): P1 features
  ├── Guest quantity selector
  ├── Refactor webhook handler
  ├── Add tier info to confirmation emails
  └── Guest waitlist

Phase 3 (Week 4): P1 continued + P2
  ├── Promo codes
  ├── Custom attendee fields
  ├── Event visibility granularity
  ├── Sold-out UI
  └── Tax support

Phase 4 (Month 2): P3 polish
  ├── Digital tickets
  ├── Calendar invites
  ├── Recurring event RSVP
  └── Admin attendee management