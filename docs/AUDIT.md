# Stripe Integration Audit — Dues & Donation Flows

**Date:** 2026-04-27 (re-verified against current source)  
**Scope:** End-to-end review of the dues payment and donation processes, Stripe Checkout integration, webhook handling, and surrounding infrastructure.

---

## Table of Contents

1. [Dues Payment Flow](#1-dues-payment-flow)
2. [Donation Flow](#2-donation-flow)
3. [Shared Infrastructure](#3-shared-infrastructure)
4. [Summary of Issues Found](#4-summary-of-issues-found)
5. [Recommended Improvements](#5-recommended-improvements)

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

## 3. Shared Infrastructure

### 3.1 Finance Cache

- **File:** `lib/services/finance.ts`
- **Status:** In-memory TTL cache with stampede protection (caches the promise, not just the result). Both `cache` and `inflightCache` are cleared together on invalidation. Good design for serverless.

### 3.2 Webhook Handler

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

### 3.3 Email Service

- **File:** `lib/email/send.ts`
- **Status:** Solid — Uses Resend API with error handling and `[DEV]` prefix in non-production.
- **Templates** (`lib/email/templates.ts`):
  - ✅ `duesReminderEmail` — Used by cron
  - ✅ `duesNudgeEmail` — Used by onboarding sequence
  - ✅ `guestTicketConfirmationEmail` — Event tickets
  - ✅ `donationThankYouEmail` — Donation receipts (exists, lacks IRS language)

### 3.4 Constants / Configuration

- **File:** `lib/constants.ts`
- **Status:** Contains `SITE` object with URL, name, motto, address, meetingSchedule — used consistently across templates.
- **Missing:** No constant for Stripe-related config (e.g., max donation amount $10,000 is hardcoded in the donate route). No EIN constant for tax receipts.

### 3.5 Tests

- ✅ `__tests__/api/donate.test.ts` — Tests for donation API
- ✅ `__tests__/api/cron/dues-reminders.test.ts` — Tests for reminder cron
- ✅ `__tests__/api/webhooks/stripe.test.ts` — Webhook handler tests
- ✅ `e2e/donate-flow.spec.ts` — E2E test for donation flow
- ❌ **Missing: Webhook handler test for donation type** — Only tests dues and event types
- ❌ **Missing: Dues checkout route test** — `__tests__/api/portal/dues/`

---

## 4. Summary of Issues Found

| # | Severity | Area | Issue | Status |
|---|----------|------|-------|--------|
| 1 | 🔴 HIGH | Donation | No `donors` collection for tracking/history/CRM | ⚠️ Open |
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
| 12 | 🟢 LOW | Webhook | No audit log integration | ⚠️ Open |
| 13 | 🟢 LOW | Tests | No test for donation type in webhook handler | ⚠️ Open |

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

## 5. Recommended Improvements

### 5.1 High Priority (Should Fix Now)

#### 5.1.1 Add Donors Collection for CRM

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

### 5.2 Medium Priority

#### 5.2.1 Add Dues & Donation Handling to `handlePaymentIntentSucceeded`

Add cases for `type === 'dues'` and `type === 'donation'` in `handlePaymentIntentSucceeded()`, or extract common logic into a shared handler.

#### 5.2.2 Add IRS Tax Receipt Language

Update `donationThankYouEmail` in `lib/email/templates.ts`:
- Include the organization's EIN
- Add statement: "No goods or services were provided in exchange for this contribution."
- Note the donation amount for tax purposes

### 5.3 Low Priority (Nice to Have)

#### 5.3.1 Add Dues Session Verification
Add a `/api/portal/dues/verify` endpoint (mirroring `/api/donate/verify`) and client-side verification on the dues success page.

#### 5.3.2 Refactor Donate Route to Use Helper
Update `app/api/donate/route.ts` to use `createDonationCheckoutSession()` from `lib/stripe/client.ts`, or remove the unused helper.

#### 5.3.3 Add Anonymous Donation Option
Add an "I'd like to remain anonymous" checkbox to `DonateForm.tsx`.

#### 5.3.4 Add Recurring Donation Support
Add a monthly donation option using Stripe Subscriptions (mode: 'subscription').

#### 5.3.5 Use Firestore Transaction for Idempotency
Replace the get-then-set pattern in `markEventProcessed` with `adminDb.runTransaction()`.

#### 5.3.6 Add Audit Logging
Use `lib/services/auditLog.ts` in payment webhook handlers.

#### 5.3.7 Add Donation Webhook Test
Add test coverage for `type === 'donation'` in `__tests__/api/webhooks/stripe.test.ts`.

#### 5.3.8 Add Explicit `isNaN` Check
Add `isNaN(Number(customAmount))` check in `app/api/donate/route.ts`.

#### 5.3.9 Add Stripe Config Constants
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