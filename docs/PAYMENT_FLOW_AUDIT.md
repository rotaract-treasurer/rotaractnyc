# Event Payment Flow — Comprehensive Review & Roadmap

## Scope
Reviewed the end-to-end payment flow across 12 files spanning both public (guest) and private (member/portal) event paths.

## What Works Well
1. Tier-based pricing with atomic reservation (`tryReserveTierSpot`) on public path prevents overselling
2. Promo codes with validity windows, usage limits, event restrictions, and atomic counter increment
3. Multi-quantity ticket buying (up to 10) for public guests
4. Dual Stripe path: embedded PaymentIntents + hosted Checkout fallback
5. Offline payment methods (cash, Venmo, Zelle, etc.) with proof tracking for members
6. Idempotent webhook processing via `processed_webhooks` collection + Firestore transactions
7. Refund handling (full/partial) with RSVP status updates and tier capacity release
8. Expired checkout cleanup via `checkout.session.expired` webhook
9. Payment failed cleanup via `payment_intent.payment_failed` webhook
10. Dedup logic — public RSVP blocks only active RSVPs (going/maybe/pending), allows re-registration after cancellation

## Critical Bugs (P0 — Must Fix)

| # | Issue | File |
|---|---|---|
| P0-1 | Portal checkout has no capacity check | `app/api/portal/events/checkout/route.ts` |
| P0-2 | Portal checkout lacks tier atomic reservation | `app/api/portal/events/checkout/route.ts` |
| P0-3 | Public checkout free-tier path has race condition | `app/api/events/checkout/route.ts` |
| P0-4 | Free tier double-increments sold count | `app/api/events/checkout/route.ts` |
| P0-5 | Unauthenticated portal checkout silently loses money | `app/api/portal/events/checkout/route.ts` |

## Missing Features (P1 — Should Fix)

| # | Issue |
|---|---|
| P1-6 | No confirmation emails sent for member free RSVPs |
| P1-7 | Members cannot specify guest count when RSVPing |
| P1-8 | No waitlist mechanism for sold-out events |
| P1-9 | No cron job to auto-promote waitlisted users when spots free up |
| P1-10 | Custom attendee fields / registration questions not plumbed into frontend form |
| P1-11 | No capacity check on member RSVP route |

## Enhancements (P2 — Nice to Have)

| # | Gap |
|---|---|
| P2-12 | QR codes for guest ticket check-in |
| P2-13 | .ics calendar attachment in confirmation emails |
| P2-14 | Email verification for guest RSVPs |
| P2-15 | Guest list CSV export for admins |
| P2-16 | Tier upgrade/downgrade through portal |
| P2-17 | Cross-sell / upsell during Stripe checkout |
| P2-18 | Granular event visibility: `members_only`, `invite_only`, `unlisted`, `early_access` |
| P2-19 | Member early-access / presale windows |
| P2-20 | Cancellation deadline enforcement |
| P2-21 | Guest reminder emails from cron |
| P2-22 | Promo code support in member checkout |