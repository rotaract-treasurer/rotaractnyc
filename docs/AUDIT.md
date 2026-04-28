# Stripe Integration Audit — Dues, Donation & Event Payment Flows

**Date:** 2026-04-28 (re-verified against current source)
**Scope:** End-to-end review of the dues payment, donation, and event ticketing processes, Stripe Checkout integration, webhook handling, and surrounding infrastructure.

---

## Table of Contents

1. [Dues Payment Flow](#1-dues-payment-flow)
2. [Donation Flow](#2-donation-flow)
3. [Events Payment Flow (Public & Private)](#3-events-payment-flow-public--private)
4. [Shared Infrastructure](#4-shared-infrastructure)
5. [Summary of Issues Found (Dues & Donations)](#5-summary-of-issues-found-dues--donations)
6. [Recommended Improvements (Dues & Donations)](#6-recommended-improvements-dues--donations)

---

## 1. Dues Payment Flow

### 1.1 Architecture

```
Member clicks "Pay Dues"
       │
       ▼
POST /api/portal/dues/checkout
  └─ resolves memberType, amount via tierTracking
  └─ calls createDuesCheckoutSession() (lib/stripe/client.ts)
       └─ creates Stripe Checkout Session (mode: 'payment')
       └─ metadata: { type, memberId, memberType, cycleId, cycleName }
       └─ redirects user to Stripe
       │
       ▼
Stripe handles payment
       │
       ▼
POST /api/webhooks/stripe  (checkout.session.completed)
  └─ lib/stripe/webhooks.ts: handleCheckoutCompleted()
       ├─ type === 'dues'
       │   ├─ Updates member doc: dues.status='paid', paidAt, cycleName, paidCycles[]
       │   ├─ Creates Transaction via createTransaction()
       │   └─ Sends confirmation email via sendEmail()
       ├─ type === 'donation'
       │   ├─ Creates Transaction via createTransaction()
       │   └─ Sends thank-you email via donationThankYouEmail()
       └─ type === 'event'
           └─ Creates transaction, updates event RSVP, sends ticket email
```

### 1.2 Files Involved

| File | Role |
|------|------|
| `app/api/portal/dues/checkout/route.ts` | API route that creates the Stripe checkout session |
| `lib/stripe/client.ts` | `createDuesCheckoutSession()` — Stripe SDK wrapper |
| `lib/stripe/webhooks.ts` | Webhook handler for `checkout.session.completed` |
| `hooks/useDues.ts` | Client-side hook for member dues state |
| `app/portal/dues/page.tsx` | Member-facing dues page |
| `components/portal/OnboardingChecklist.tsx` | Shows dues as onboarding step |
| `app/api/cron/dues-reminders/route.ts` | Automated reminder emails |
| `lib/services/tierTracking.ts` | Determines member type & amount |
| `lib/email/templates.ts` | `duesReminderEmail`, `duesNudgeEmail` templates |
| `lib/email/send.ts` | Email sending via Resend |
| `__tests__/api/cron/dues-reminders.test.ts` | Tests for reminder cron |

### 1.3 What's Working Well

- **End-to-end flow is complete:** Checkout → webhook → Firestore update → transaction record → email confirmation.
- **Rate limiting** on the checkout API route (10 req/60s).
- **Member type resolution** via `tierTracking` dynamically determines professional vs. student pricing.
- **Cron reminders** exist via `app/api/cron/dues-reminders/route.ts` with email templates.
- **Onboarding integration** — dues payment is tracked as an onboarding checklist item.
- **Paid cycles tracking** — `dues.paidCycles` array prevents duplicate cycle payments.
- **Finance cache invalidation** on transaction creation.
- **Idempotency** — dual-layer deduplication via `processed_webhooks` collection + transaction lookup.

### 1.4 Issues Found

#### `handlePaymentIntentSucceeded` doesn't handle dues payments ⚠️ MEDIUM
- **File:** `lib/stripe/webhooks.ts` `handlePaymentIntentSucceeded()`
- **Detail:** Handles only `event`, `event_ticket`, and `guest_event_ticket` types. If a payment_intent.succeeded event arrives for a dues payment (e.g., from a non-Session flow or retry), it is silently dropped.
- **Recommendation:** Add `dues` and `donation` handling to `handlePaymentIntentSucceeded()`, or at minimum log a warning for unhandled types.

#### No Stripe session verification after dues redirect ⚠️ LOW
- **Detail:** Unlike the donation flow (which has `/api/donate/verify` and client-side session verification), the dues flow does not verify the Stripe session after redirect. The success page relies solely on the webhook updating Firestore.
- **Impact:** If the webhook is delayed, the user may see stale "unpaid" status briefly.
- **Recommendation:** Add session verification on the dues success page, similar to the donation flow.

#### UI doesn't re-fetch status after Stripe redirect ⚠️ LOW
- **Detail:** The dues page relies on the `useDues` hook, which may not re-fetch after returning from Stripe.
- **Recommendation:** Add a `session_id` query param on success redirect and force a re-fetch.

#### `markEventProcessed` uses get-then-set instead of Firestore transaction ⚠️ LOW
- **File:** `lib/stripe/webhooks.ts` lines 22-37
- **Detail:** The idempotency check uses a separate `get()` followed by `set()`. Under extreme concurrency (same event delivered twice simultaneously), both could pass the `exists` check before either writes. The catch block partly mitigates this by treating write failures as "already processed," but a Firestore transaction would be cleaner.
- **Recommendation:** Use `adminDb.runTransaction()` for the idempotency check.

#### No test coverage for dues webhook handler logic ⚠️ LOW
- **File:** `__tests__/api/webhooks/stripe.test.ts`
- **Detail:** The webhook test file covers event and donation types, but dues-specific logic (member update, cycle tracking) is not tested in isolation.

---

## 2. Donation Flow

### 2.1 Architecture

```
Donor clicks "Donate" on public page
       │
       ▼
POST /api/donate
  └─ validates name, email, amount (preset or custom, min $5, max $10,000)
  └─ creates Stripe Checkout Session directly
       └─ metadata: { type: 'donation', amountCents, donorName, donorEmail }
       └─ returns session URL or client_secret (embedded mode)
       │
       ▼
Stripe handles payment
       │
       ▼
GET /api/donate/verify?session_id=...  (client-side polling after redirect)
  └─ Verifies session status via Stripe API
       │
       ▼
POST /api/webhooks/stripe  (checkout.session.completed)
  └─ lib/stripe/webhooks.ts: handleCheckoutCompleted()
       └─ type === 'donation'
           ├─ Creates Transaction via createTransaction() with donor info
           └─ Sends thank-you email via donationThankYouEmail()
```

### 2.2 Files Involved

| File | Role |
|------|------|
| `app/api/donate/route.ts` | API route that creates the Stripe checkout session |
| `app/api/donate/verify/route.ts` | Session verification endpoint (client-side polling) |
| `lib/stripe/webhooks.ts` | Webhook handler (creates transaction + sends thank-you email) |
| `lib/stripe/client.ts` | `createDonationCheckoutSession()` helper (currently unused by donate route) |
| `components/public/DonateForm.tsx` | Public-facing donation form UI with name/email fields |
| `app/(public)/donate/page.tsx` | Public donation page |
| `lib/email/templates.ts` | `donationThankYouEmail` template |
| `__tests__/api/donate.test.ts` | API tests |
| `e2e/donate-flow.spec.ts` | E2E Playwright test |

### 2.3 What's Working Well

- **Preset amounts** with meaningful labels ($25, $50, $100).
- **Custom amount** support with validation (min $5, max $10,000).
- **Popup checkout** with fallback for popup blockers.
- **Embedded checkout** mode support via `ui_mode: 'embedded'`.
- **Session verification** endpoint for post-payment confirmation.
- **URL origin validation** on redirect (checks `STRIPE_CHECKOUT_PREFIX`).
- **Donor name + email** collected in the form and passed through to Stripe metadata + webhook.
- **Thank-you email** sent to donor from webhook handler.
- **Transaction record created** in Firestore on successful payment with donor info.
- **Client-side email + name validation** in DonateForm before submission.
- **Rate limiting** on the donate API route (10 req/60s).

### 2.4 Issues Found

#### No `donors` collection for tracking/history/CRM ⚠️ HIGH
- **Detail:** Donations create a `Transaction` doc but there is no `donors` collection to track donor history, total lifetime contributions, or contact preferences. This makes donor relationship management (CRM) impossible without manually querying all transactions.
- **Recommendation:** Add a `donors` collection upserted on each donation, keyed by email, tracking `totalDonated`, `lastDonationDate`, `name`, `email`, and a history of donation IDs.

#### `handlePaymentIntentSucceeded` doesn't handle donation payments ⚠️ MEDIUM
- **File:** `lib/stripe/webhooks.ts`
- **Detail:** Same as the dues issue — `handlePaymentIntentSucceeded` only handles event types. A donation via PaymentIntent would be silently dropped.
- **Recommendation:** Add donation handling to `handlePaymentIntentSucceeded`.

#### No IRS-compliant tax receipt ⚠️ MEDIUM
- **File:** `lib/email/templates.ts` `donationThankYouEmail`
- **Detail:** The thank-you email lacks IRS-required language for a tax receipt: EIN, statement that no goods/services were provided, and fair market value of any benefits received.
- **Recommendation:** Add tax receipt language including the organization's EIN and the required "no goods or services" disclaimer.

#### `createDonationCheckoutSession` helper is unused dead code ⚠️ LOW
- **File:** `lib/stripe/client.ts` lines 114-149
- **Detail:** `createDonationCheckoutSession()` exists but the donate route (`app/api/donate/route.ts`) uses raw Stripe SDK instead. This creates two code paths for donation checkout with slightly different metadata structures.
- **Recommendation:** Either refactor the donate route to use the helper, or remove the unused function to avoid confusion.

#### No server-side `isNaN` validation on custom amount ⚠️ LOW
- **File:** `app/api/donate/route.ts` line 44
- **Detail:** The custom amount check `Number(customAmount) >= 5` will pass `NaN >= 5` as `false`, but an explicit `isNaN` check would be clearer and more robust.
- **Recommendation:** Add `isNaN(Number(customAmount))` check before the `>= 5` comparison.

#### No anonymous donation option ⚠️ LOW
- **Detail:** The form requires both name and email. There's no way for a donor to give anonymously.
- **Recommendation:** Add an "I'd like to remain anonymous" checkbox that sets donorName to "Anonymous" and omits donorEmail from public records while still allowing a receipt email.

#### No recurring donation support ⚠️ LOW
- **Detail:** All donations are one-time payments (mode: 'payment'). Stripe supports recurring donations via mode: 'subscription' with recurring price data.
- **Recommendation:** Add a monthly donation option using Stripe Subscriptions for sustained giving.

#### `donorEmail` not type-validated in webhook handler ⚠️ LOW
- **File:** `lib/stripe/webhooks.ts` line 249
- **Detail:** `donorEmail` is used as `email: donorEmail || undefined` without type checking. While Stripe's metadata is string-typed, an explicit typeof check would be safer.
- **Recommendation:** Add `typeof donorEmail === 'string' ? donorEmail : undefined`.

---

## 3. Events Payment Flow (Public & Private)

### 3.1 Architecture Overview

```
PUBLIC GUEST FLOW
Guest views event at /events/[slug]
        │
        ▼
GuestRsvpForm (client component)
  └─ User enters name, email, phone, selects tier, quantity
        │
        ▼
POST /api/events/rsvp  (validates event, checks dedup)
  ├─ Free event ──► Creates guest_rsvps doc (status: 'going') ──► Sends confirmation email
  └─ Paid event ──► Returns { requiresPayment: true, tiers, prices }
              │
              ▼
        GuestRsvpForm calls POST /api/events/checkout
          ├─ Validates event, checks capacity, resolves pricing
          ├─ Free tier ──► Creates guest_rsvps doc ──► Sends ticket confirmation
          └─ Paid tier ──► Creates Stripe PaymentIntent (embedded) or Checkout Session (redirect)
                    │
                    ▼
              Stripe handles payment
                    │
                    ▼
              POST /api/webhooks/stripe  (checkout.session.completed / payment_intent.succeeded)
                └─ handleCheckoutCompleted() / handlePaymentIntentSucceeded()
                    ├─ Creates guest_rsvps doc (status: 'going', paymentStatus: 'paid')
                    ├─ Increments tier sold count
                    ├─ Creates Transaction via createTransaction()
                    └─ Sends guestTicketConfirmationEmail

PORTAL MEMBER FLOW
Member views event at /portal/events/[id]
        │
        ▼
RSVP button (EventActionBar component)
        │
        ▼
POST /api/portal/events/[id]/rsvp  (auth required)
  ├─ Free event ──► Creates rsvps doc (status: 'going')
  └─ Paid event ──► Returns Stripe checkout URL
              │
              ▼
        Redirect to Stripe Checkout
              │
              ▼
        POST /api/webhooks/stripe  (checkout.session.completed)
          ├─ PORTAL RSVP CREATED HERE by webhook handler (handleCheckoutCompleted)
          │   └─ Creates rsvps doc with member data from metadata
          ├─ Creates Transaction
          └─ No confirmation email sent by webhook (member RSVP has no email trigger here)
```

### 3.2 Files Involved

| File | Role |
|------|------|
| `app/api/events/route.ts` | **GET** - List public events (or single by `?id=`). Falls back to defaults on error. |
| `app/api/events/rsvp/route.ts` | **POST** - Validate event, check dedup, return payment requirements. Creates free RSVPs directly. |
| `app/api/events/checkout/route.ts` | **POST** - Create Stripe checkout session for paid guest tickets. Handles tier resolution, capacity checks, embedded mode. |
| `app/api/events/[id]/guest-rsvps/route.ts` | **GET** - Admin endpoint returning all guest RSVPs for an event (board/president/treasurer only). |
| `app/api/portal/events/[id]/rsvp/route.ts` | **POST** - Member RSVP endpoint. Handles free + paid events. Supports tierId. |
| `app/api/portal/events/[id]/checkin/route.ts` | **POST** - QR code check-in for event attendees. |
| `components/public/GuestRsvpForm.tsx` | Client form with tier selection, quantity selector, embedded card payment modal. |
| `components/public/PublicEventActions.tsx` | Add-to-calendar, share, directions buttons on public event page. |
| `components/portal/EventActionBar.tsx` | RSVP button for portal members. |
| `components/portal/EventQRCode.tsx` | QR code display for member check-in. |
| `app/(public)/events/[slug]/page.tsx` | Public event detail page (ISR). Shows pricing tiers, hero, description. |
| `app/portal/events/[id]/page.tsx` | Portal event detail page. Shows attendee list, QR code, admin actions. |
| `lib/stripe/webhooks.ts` | Core webhook handler. Processes guest + member event payments, refunds, failures. |
| `lib/services/tierTracking.ts` | Increment tier sold count atomically. |
| `lib/utils/pricing.ts` | Pricing utility functions. |
| `lib/email/templates.ts` | `guestTicketConfirmationEmail`, `guestRsvpConfirmationEmail` templates. |
| `__tests__/api/portal/events.test.ts` | Tests for portal event API. |
| `__tests__/api/events/guest-rsvp.test.ts` | Tests for guest RSVP API. |
| `__tests__/api/webhooks/stripe.test.ts` | Webhook tests (partial event coverage). |

### 3.3 What's Working Well

- **Tier-based pricing** with deadlines, capacities, sold counts, and sort order.
- **Embedded payment modal** (`CardPaymentForm`) for guest checkout with no redirect needed.
- **Fallback to Stripe-hosted checkout** when publishable key isn't available.
- **Quantity selector** (1-10 tickets) in GuestRsvpForm with total price display.
- **Dedup protection** — only blocks active RSVPs (going/maybe/pending), allows retry for cancelled/expired/failed.
- **Event-level capacity checks** on both RSVP and checkout endpoints.
- **Idempotent webhook** processing via `processed_webhooks` collection + transaction lookup.
- **Tier sold count tracking** incremented atomically on successful payment.
- **Guest confirmation emails** sent for both free and paid tickets (with tier label).
- **Refund handling** — webhook updates RSVP status to 'refunded' (both member and guest).
- **Payment failure handling** — marks guest RSVPs as 'payment_failed' on `payment_intent.payment_failed`.
- **Checkout expiry handling** — cleans up pre-created RSVPs on `checkout.session.expired`.
- **Rate limiting** on both `/api/events/rsvp` (5/60s) and `/api/events/checkout` (5/60s).
- **Public event page** displays tier cards with deadline, capacity, expired/sold-out badges.
- **Portal event page** shows attendee management, check-in functionality with QR codes.

### 3.4 Issues Found — Public Events

#### P0: No event-level sold-out signal on public event page 🔴 HIGH
- **Detail:** The public event page (`app/(public)/events/[slug]/page.tsx`) shows per-tier sold-out badges but never blocks the GuestRsvpForm when the entire event is at capacity. A guest can see "All ticket tiers are sold out" in the form only after expanding it. The page should show a clear "SOLD OUT" banner at the top when `event.capacity` is reached.
- **Recommendation:** Add a server-side capacity check in the event page's data fetching, and conditionally render a sold-out banner. Pass `isSoldOut` as a prop to hide the GuestRsvpForm entirely.

#### P1: No promo code / discount coupon support 🟡 MEDIUM
- **Detail:** No promo code field in GuestRsvpForm and no promo code validation in checkout. Common for Rotaract events to use codes like "EARLYBIRD", "MEMBERGUEST", or speaker/partner comp codes.
- **Recommendation:** Add a promo code field to the checkout route. Store valid codes in a `promo_codes` Firestore collection with rules (percentage off, fixed amount, max uses, expiry). Apply discount before creating Stripe session.

#### P1: No custom attendee fields (dietary restrictions, accessibility needs, etc.) 🟡 MEDIUM
- **Detail:** GuestRsvpForm only collects name, email, phone. Events often need to collect dietary restrictions, accessibility needs, t-shirt size, organization/affiliation, or custom questions per event.
- **Recommendation:** Add a `registrationFields` array to the event document schema. Render dynamic fields in GuestRsvpForm. Store responses in the guest_rsvps doc.

#### P1: Tier quantity per tier not enforced at checkout time ⚠️ FIXED
- **Detail:** Previously, tier capacity was only checked in the form UI, not on the server at checkout time. If two users simultaneously checked out the last tier ticket, both could succeed.
- **Status:** The checkout route now re-checks tier capacity server-side. However, there's still a race condition since Firestore `get` + `update` is not atomic. Should use a Firestore transaction or `FieldValue.increment` with conditional check.

#### P2: No tax/donation split support 🟢 LOW
- **Detail:** The Stripe checkout session doesn't include tax. For events where a portion is tax-deductible (e.g., gala tickets where $50 is the meal value and $50 is a donation), there's no way to split the amount.
- **Recommendation:** Add optional `taxDeductibleAmount` config per event or tier. Display the tax-deductible portion on receipts. This requires careful accounting for IRS compliance.

#### P2: No event visibility granularity beyond public/private 🟢 LOW
- **Detail:** Events have `isPublic` boolean. There's no concept of "unlisted" (anyone with link can register) or "invite-only" (requires a code or member referral). All public events appear in the public listing and are indexed.
- **Recommendation:** Expand `visibility` field to enum: `public`, `unlisted`, `members_only`, `invite_only`. `unlisted` events don't appear in listings but can be accessed via direct URL.

#### P3: No digital ticket / QR code for guests 🟢 LOW
- **Detail:** Members get QR codes for check-in (EventQRCode component). Guest confirmation emails contain event details but no scannable QR code. Guests must give their name at the door.
- **Recommendation:** Generate a QR code for guest RSVPs (stored on the guest_rsvps doc or generated from the doc ID) and include it in the confirmation email. Add a guest check-in endpoint.

#### P3: No "Add to Calendar" in confirmation emails 🟢 LOW
- **Detail:** The public event page has Add to Calendar buttons (Google Calendar + .ics download) via PublicEventActions, but the confirmation email only includes text date/time. Guests must return to the website to add to calendar.
- **Recommendation:** Include Google Calendar and .ics links in the `guestTicketConfirmationEmail` template, or attach an .ics file to the email.

#### P3: No recurring/event series RSVP 🟢 LOW
- **Detail:** If a club hosts a recurring event series (e.g., "Weekly Service Project — Saturdays in June"), each occurrence is a separate event. There's no way to RSVP to all in one flow.
- **Recommendation:** Add a `seriesId` field to events and an "RSVP to entire series" option on the event page. This would create individual RSVP docs for each event in the series.

#### P3: No upsell during checkout (merchandise, donation) 🟢 LOW
- **Detail:** Checkout creates a single line item for the ticket. There's no way to add a donation or merchandise item during the ticket checkout flow.
- **Recommendation:** Allow events to define optional upsell items (e.g., "Add a $10 donation to the Rotary Foundation"). These would be added as additional Stripe line items.

#### P3: No guest email verification 🟢 LOW
- **Detail:** Guest email is accepted as-is without verification. A typo means the guest never receives their confirmation/ticket and has no way to recover it.
- **Recommendation:** Add an optional email verification step (send a code, or use a "confirm email" field). At minimum, show a confirmation screen that says "Check [email] for your ticket — didn't receive it? [Resend]".

### 3.5 Issues Found — Private/Portal Events

#### P0: Member refund does NOT update RSVP status ⚠️ FIXED
- **Detail:** Previously, `handleChargeRefunded` only updated guest RSVPs. Member RSVPs in the `rsvps` (not `guest_rsvps`) collection were left as 'going' after a refund.
- **Status:** Fixed — `handleChargeRefunded` now checks both `rsvps` and `guest_rsvps` collections.

#### P0: No tierId on portal RSVP endpoint ⚠️ FIXED
- **Detail:** Previously, the portal RSVP endpoint (`/api/portal/events/[id]/rsvp`) did not accept `tierId` when creating a checkout session. Members always got the default tier.
- **Status:** Fixed — `tierId` is now passed through to Stripe checkout metadata.

#### P1: No quantity selector for member ticket purchases 🟡 MEDIUM
- **Detail:** When a member buys tickets via the portal, there's no quantity field. Members must RSVP individually. If a member wants to buy 2 guest tickets, there's no flow for that.
- **Recommendation:** Add quantity support to `EventActionBar` component and the portal RSVP endpoint. Allow members to specify "I'm bringing N guests" with quantity * guestPrice.

#### P1: No waitlist for full events 🟡 MEDIUM
- **Detail:** When an event reaches capacity or a tier sells out, interested members/guests get a "sold out" message with no option to join a waitlist. If someone cancels, there's no automatic notification to waitlisted people.
- **Recommendation:** Add a `waitlist` collection. When capacity is reached, offer "Join Waitlist" instead of blocking. When an RSVP is cancelled/refunded, notify the next person on the waitlist (with a time-limited claim link).

#### P2: No admin attendee management UI for guest list 🟢 LOW
- **Detail:** Admin can view guest RSVPs via the API (`/api/events/[id]/guest-rsvps`), but there's no UI in the portal event page to manage the guest list (mark as checked in, cancel, export).
- **Recommendation:** Add a guest list tab to the portal event page showing all guest RSVPs with actions: check-in, cancel, export CSV.

#### P2: No member guest ticket purchase flow 🟢 LOW
- **Detail:** A member cannot purchase additional guest tickets through the portal. They can only RSVP for themselves. If a member wants to bring a +1, they must use the public GuestRsvpForm (and miss any member-guest pricing).
- **Recommendation:** Add a "Buy Guest Tickets" option in the portal event page that lets members purchase guest tickets at the member-guest tier price, optionally with guest name/email fields.

#### P3: No recurring event RSVP for member series 🟢 LOW
- **Detail:** Same as public events — no series RSVP. Members must RSVP to each occurrence individually.

### 3.6 Event Payment Flow — Severity Summary

| # | Severity | Area | Issue | Status |
|---|----------|------|-------|--------|
| 1 | 🔴 HIGH | Public | No event-level sold-out signal on public event page | ⚠️ Open |
| 2 | 🔴 HIGH | Portal | Member refund does NOT update RSVP | ✅ Fixed |
| 3 | 🔴 HIGH | Portal | No tierId on portal RSVP endpoint | ✅ Fixed |
| 4 | 🔴 HIGH | Public | No capacity check at checkout time | ✅ Fixed |
| 5 | 🔴 HIGH | Public | Guest RSVP dedup blocks re-registration after cancelled | ✅ Fixed |
| 6 | 🟡 MEDIUM | Public | No promo code / discount coupon support | ⚠️ Open |
| 7 | 🟡 MEDIUM | Public | No custom attendee fields | ⚠️ Open |
| 8 | 🟡 MEDIUM | Portal | No quantity selector for member ticket purchases | ⚠️ Open |
| 9 | 🟡 MEDIUM | Both | No waitlist for full events | ⚠️ Open |
| 10 | 🟢 LOW | Public | No tax/donation split support | ⚠️ Open |
| 11 | 🟢 LOW | Public | No event visibility granularity beyond public/private | ⚠️ Open |
| 12 | 🟢 LOW | Public | No digital ticket / QR code for guests | ⚠️ Open |
| 13 | 🟢 LOW | Public | No "Add to Calendar" in confirmation emails | ⚠️ Open |
| 14 | 🟢 LOW | Both | No recurring/event series RSVP | ⚠️ Open |
| 15 | 🟢 LOW | Public | No upsell during checkout (merchandise, donation) | ⚠️ Open |
| 16 | 🟢 LOW | Public | No guest email verification | ⚠️ Open |
| 17 | 🟢 LOW | Portal | No admin attendee management UI | ⚠️ Open |
| 18 | 🟢 LOW | Portal | No member guest ticket purchase flow | ⚠️ Open |
| 19 | 🟢 LOW | Webhook | Race condition on tier capacity check (non-atomic) | ⚠️ Open |

### 3.7 Previously Fixed Issues (Verified in Current Code)

| # | Severity | Area | Issue |
|---|----------|------|-------|
| 1 | 🔴 HIGH | Webhook | `upsertDonorRecord()` called but function not defined — **FIXED** |
| 2 | 🔴 HIGH | Webhook | Checkout session expiry didn't clean up RSVPs — **FIXED** |
| 3 | 🔴 HIGH | Webhook | Payment failure didn't mark RSVPs — **FIXED** |
| 4 | 🟡 MEDIUM | Webhook | No partial refund distinction — **FIXED** |
| 5 | 🟡 MEDIUM | Email | Tier label not in confirmation emails — **FIXED** |
| 6 | 🟡 MEDIUM | Webhook | Monolithic webhook handler — **FIXED** (decomposed into modules) |

### 3.8 Recommendations for Event Payment Flow

#### 3.8.1 High Priority

**Add event-level sold-out banner to public event page:**
- In `app/(public)/events/[slug]/page.tsx`, fetch member + guest RSVP counts server-side.
- If `event.capacity` is set and totalGoing >= capacity, render a "SOLD OUT" banner.
- Pass `isSoldOut` to GuestRsvpForm; hide the form entirely when sold out (show waitlist instead).

**Make tier capacity check atomic:**
- Replace get-then-check pattern in checkout route with a Firestore transaction or `FieldValue.increment` with a precondition check.
- The current implementation has a race condition window between read and write.

#### 3.8.2 Medium Priority

**Add promo code system:**
- Create a `promo_codes` Firestore collection with fields: code, discountType (percentage/fixed), discountValue, maxUses, currentUses, expiresAt, applicableEventIds, applicableTierIds.
- Add promo code field to GuestRsvpForm and validate in `/api/events/checkout`.
- Apply discount to Stripe session amount; store applied code in metadata.

**Add custom attendee fields:**
- Add `registrationFields` array to event document: `[{ id, label, type: 'text'|'select'|'checkbox', required, options? }]`.
- Render dynamic fields in GuestRsvpForm.
- Store responses as `registrationData: Record<string, string>` on the guest_rsvps doc.

**Add waitlist for full events:**
- Create a `waitlist` collection with fields: eventId, email, name, tierId, createdAt, status (waiting/notified/claimed/expired).
- When capacity is reached, offer "Join Waitlist" in both public and portal flows.
- When an RSVP is cancelled/refunded, query the waitlist, notify the first person, and give them 24h to claim.

**Add quantity to portal member RSVP:**
- Update EventActionBar to include a guest count selector.
- Update portal RSVP endpoint to accept `guestCount` and calculate `totalAmount = memberPrice + (guestCount * guestPrice)`.
- Create member RSVP doc + separate guest RSVP docs for each guest.

#### 3.8.3 Low Priority (Nice to Have)

**Event visibility modes:** Expand to `public` | `unlisted` | `members_only` | `invite_only`.
**Tax/donation split:** Add `taxDeductibleAmount` to event/tier schema.
**Guest digital tickets:** Generate QR codes for guest RSVPs, include in emails.
**Calendar invites in emails:** Add .ics download link to confirmation emails.
**Recurring event series:** Add `seriesId` and "RSVP to all" option.
**Checkout upsells:** Allow events to define optional add-on items.
**Guest email verification:** Add email confirmation step or re-send flow.
**Admin attendee management UI:** Guest list tab on portal event page.
**Member guest ticket purchase:** Let members buy guest tickets through portal.

---

## 4. Shared Infrastructure

### 4.1 Finance Cache

- **File:** `lib/services/finance.ts`
- **Status:** In-memory TTL cache with stampede protection (caches the promise, not just the result). Both `cache` and `inflightCache` are cleared together on invalidation. Good design for serverless.

### 4.2 Webhook Handler

- **File:** `lib/stripe/webhooks.ts`
- **Strengths:**
  - Proper signature verification via `constructWebhookEvent`.
  - Correctly returns 200 for unhandled event types (Stripe requires this).
  - Proper error handling with 400 for invalid signatures.
  - Finance cache invalidated on transaction creation.
  - Dual-layer idempotency: `processed_webhooks` collection + transaction lookup.
  - Handles `checkout.session.completed`, `checkout.session.expired`, `payment_intent.succeeded`, `payment_intent.payment_failed`.
  - Donor thank-you emails sent from webhook.
  - Dues confirmation emails sent from webhook.
- **Issues:**
  - `handlePaymentIntentSucceeded` only handles event/guest types — misses dues and donation.
  - `markEventProcessed` uses get-then-set (not a Firestore transaction) — minor race window.
  - No audit log integration — should use `auditLog` service for payment events.

### 4.3 Email Service

- **File:** `lib/email/send.ts`
- **Status:** Solid — Uses Resend API with error handling and `[DEV]` prefix in non-production.
- **Templates** (`lib/email/templates.ts`):
  - ✅ `duesReminderEmail` — Used by cron
  - ✅ `duesNudgeEmail` — Used by onboarding sequence
  - ✅ `guestTicketConfirmationEmail` — Event tickets
  - ✅ `donationThankYouEmail` — Donation receipts (exists, lacks IRS language)

### 4.4 Constants / Configuration

- **File:** `lib/constants.ts`
- **Status:** Contains `SITE` object with URL, name, motto, address, meetingSchedule — used consistently across templates.
- **Missing:** No constant for Stripe-related config (e.g., max donation amount $10,000 is hardcoded in the donate route). No EIN constant for tax receipts.

### 4.5 Tests

- ✅ `__tests__/api/donate.test.ts` — Tests for donation API
- ✅ `__tests__/api/cron/dues-reminders.test.ts` — Tests for reminder cron
- ✅ `__tests__/api/webhooks/stripe.test.ts` — Webhook handler tests
- ✅ `e2e/donate-flow.spec.ts` — E2E test for donation flow
- ❌ **Missing: Webhook handler test for donation type** — Only tests dues and event types
- ❌ **Missing: Dues checkout route test** — `__tests__/api/portal/dues/`

---

## 5. Summary of Issues Found (Dues & Donations)

 | # | Severity | Area | Issue | Status |
 |---|----------|------|-------|--------|
 | 1 | 🔴 HIGH | Webhook | `upsertDonorRecord()` called at L303 but function not defined — runtime error | ⚠️ Open |
 | 2 | 🟡 MEDIUM | Webhook | `handlePaymentIntentSucceeded` doesn't handle dues or donation payments | ⚠️ Open |
 | 3 | 🟡 MEDIUM | Donation | No IRS-compliant tax receipt (missing EIN & disclaimer) | ⚠️ Open |
 | 4 | 🟢 LOW | Dues | No Stripe session verification after dues redirect | ⚠️ Open |
 | 5 | 🟢 LOW | Dues | UI doesn't re-fetch status after Stripe redirect | ⚠️ Open |
 | 6 | 🟢 LOW | Webhook | `markEventProcessed` uses get-then-set instead of transaction | ⚠️ Open |
 | 7 | 🟢 LOW | Donation | `createDonationCheckoutSession` helper is unused dead code | ⚠️ Open |
 | 8 | 🟢 LOW | Donation | No server-side `isNaN` validation on custom amount | ⚠️ Open |
 | 9 | 🟢 LOW | Donation | No anonymous donation option | ⚠️ Open |
 | 10 | 🟢 LOW | Donation | No recurring donation support | ⚠️ Open |
 | 11 | 🟢 LOW | Webhook | `donorEmail` not type-checked in webhook handler | ⚠️ Open |

### Previously Fixed Issues (verified in current code)

| # | Severity | Area | Issue |
|---|----------|------|-------|
| 1 | 🔴 HIGH | Dues | Missing `cycleId` in Stripe checkout metadata — **FIXED** |
| 2 | 🔴 HIGH | Donation | No donor name/email collected in form — **FIXED** |
| 3 | 🔴 HIGH | Donation | No thank-you email sent to donors — **FIXED** |
| 4 | 🟡 MEDIUM | Webhook | No idempotency on webhook handler — **FIXED** (dual-layer) |
| 5 | 🟡 MEDIUM | Webhook | No payment failure/expiration webhook handlers — **FIXED** |
| 6 | 🟡 MEDIUM | Finance | Duplicate `invalidateFinanceCache` function — **FIXED** |

---

## 6. Recommended Improvements (Dues & Donations)

### 6.1 High Priority (Should Fix Now)

#### 6.1.1 Add Donors Collection for CRM

Create a `donors` collection in Firestore that is upserted on each successful donation webhook:

```typescript
// In handleCheckoutCompleted, type === 'donation' block:
const donorRef = adminDb.collection('donors').doc(donorEmail.toLowerCase());
await adminDb.runTransaction(async (tx) => {
  const snap = await tx.get(donorRef);
  if (snap.exists) {
    const data = snap.data()!;
    tx.update(donorRef, {
      totalDonated: (data.totalDonated || 0) + (session.amount_total || 0),
      lastDonationDate: new Date().toISOString(),
      donationCount: (data.donationCount || 0) + 1,
      name: donorName, // update to latest
    });
  } else {
    tx.set(donorRef, {
      name: donorName,
      email: donorEmail.toLowerCase(),
      totalDonated: session.amount_total || 0,
      donationCount: 1,
      firstDonationDate: new Date().toISOString(),
      lastDonationDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
  }
});
```

This enables:
- Donor lifetime value tracking
- Thank-you campaigns for repeat donors
- Donor directory for the fundraising committee
- Year-end tax receipt generation

### 6.2 Medium Priority

#### 6.2.1 Add Dues & Donation Handling to `handlePaymentIntentSucceeded`

Add cases for `type === 'dues'` and `type === 'donation'` in `handlePaymentIntentSucceeded()`, or extract common logic into a shared handler.

#### 6.2.2 Add IRS Tax Receipt Language

Update `donationThankYouEmail` in `lib/email/templates.ts`:
- Include the organization's EIN
- Add statement: "No goods or services were provided in exchange for this contribution."
- Note the donation amount for tax purposes

### 6.3 Low Priority (Nice to Have)

#### 6.3.1 Add Dues Session Verification
Add a `/api/portal/dues/verify` endpoint (mirroring `/api/donate/verify`) and client-side verification on the dues success page.

#### 6.3.2 Refactor Donate Route to Use Helper
Update `app/api/donate/route.ts` to use `createDonationCheckoutSession()` from `lib/stripe/client.ts`, or remove the unused helper.

#### 6.3.3 Add Anonymous Donation Option
Add an "I'd like to remain anonymous" checkbox to `DonateForm.tsx`.

#### 6.3.4 Add Recurring Donation Support
Add a monthly donation option using Stripe Subscriptions (mode: 'subscription').

#### 6.3.5 Use Firestore Transaction for Idempotency
Replace the get-then-set pattern in `markEventProcessed` with `adminDb.runTransaction()`.

#### 6.3.6 Add Audit Logging
Use `lib/services/auditLog.ts` in payment webhook handlers.

#### 6.3.7 Add Donation Webhook Test
Add test coverage for `type === 'donation'` in `__tests__/api/webhooks/stripe.test.ts`.

#### 6.3.8 Add Explicit `isNaN` Check
Add `isNaN(Number(customAmount))` check in `app/api/donate/route.ts`.

#### 6.3.9 Add Stripe Config Constants
Move hardcoded values to `lib/constants.ts`:
- `MAX_DONATION_CENTS = 1_000_000`
- `MIN_DONATION_CENTS = 500`
- `EIN` for tax receipts

---

## Appendix: Data Flow Diagrams

### Dues Payment Data Flow

```
Firestore Member Doc        Stripe Session Metadata        Firestore Transaction
┌──────────────────┐       ┌───────────────────┐          ┌──────────────────────┐
│ dues: {           │       │ type: 'dues'      │          │ type: 'income'       │
│   status: 'unpaid'│  ──►  │ memberId           │   ──►   │ category: 'Dues'     │
│   cycleName       │       │ memberType         │          │ amount               │
│ }                 │       │ cycleId            │          │ stripeSessionId       │
└──────────────────┘       │ cycleName          │          │ relatedMemberId       │
                           └───────────────────┘          └──────────────────────┘
```

### Donation Data Flow

```
DonateForm (name+email) ──► /api/donate ──► Stripe Session (with donor info)
                                                     │
                                                     ▼
                                                Webhook ──► Transaction + Thank-you Email
                                                (no donors collection yet)
```

---

*End of audit.*