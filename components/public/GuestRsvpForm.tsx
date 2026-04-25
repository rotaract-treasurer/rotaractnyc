'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import Modal from '@/components/ui/Modal';
import type { TicketTier } from '@/types';

const STRIPE_CHECKOUT_PREFIX = 'https://checkout.stripe.com/';

interface GuestRsvpFormProps {
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  isPaid: boolean;
  guestPrice?: number; // in cents
  earlyBirdPrice?: number; // in cents
  earlyBirdDeadline?: string; // ISO date
  tiers?: TicketTier[]; // tier-based pricing
}

interface GuestCheckoutPayload {
  eventId: string;
  name: string;
  email: string;
  phone?: string;
  tierId?: string;
}

export default function GuestRsvpForm({
  eventId,
  eventSlug,
  eventTitle,
  isPaid,
  guestPrice,
  earlyBirdPrice,
  earlyBirdDeadline,
  tiers,
}: GuestRsvpFormProps) {
  const searchParams = useSearchParams();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutClientSecret, setCheckoutClientSecret] = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [pendingCheckoutPayload, setPendingCheckoutPayload] = useState<GuestCheckoutPayload | null>(null);

  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

  // Handle return from Stripe checkout
  useEffect(() => {
    if (searchParams.get('rsvp') === 'success') {
      setSuccess(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!showCheckoutModal || !checkoutClientSecret || !publishableKey) return;

    let active = true;
    let embeddedCheckout: { mount: (container: HTMLElement) => void; destroy: () => void } | null = null;

    (async () => {
      try {
        setCheckoutError('');
        const stripe = await loadStripe(publishableKey);
        if (!stripe || !active) return;

        const initEmbeddedCheckout = (stripe as any).initEmbeddedCheckout;
        if (typeof initEmbeddedCheckout !== 'function') {
          throw new Error('Embedded checkout is not available.');
        }

        embeddedCheckout = await initEmbeddedCheckout.call(stripe, {
          fetchClientSecret: async () => checkoutClientSecret,
        });

        if (!active || !embeddedCheckout) {
          if (embeddedCheckout) embeddedCheckout.destroy();
          return;
        }

        const container = document.getElementById('public-event-embedded-checkout');
        if (!container) throw new Error('Embedded checkout container not found.');

        embeddedCheckout.mount(container);
      } catch {
        if (!active) return;
        setCheckoutError('Unable to load in-page card form. Switching to secure popup checkout…');

        if (pendingCheckoutPayload) {
          fetch('/api/events/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...pendingCheckoutPayload,
              embedded: false,
            }),
          })
            .then(async (res) => {
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || 'Unable to start popup checkout.');
              return data;
            })
            .then((data) => {
              if (data.url && typeof data.url === 'string' && data.url.startsWith(STRIPE_CHECKOUT_PREFIX)) {
                setCheckoutUrl(data.url);
                openCheckoutPopup(data.url);
              } else {
                setCheckoutError('Unable to create popup checkout. Please try again.');
              }
            })
            .catch(() => {
              setCheckoutError('Unable to start popup checkout. Please try again.');
            });
        }
      }
    })();

    return () => {
      active = false;
      if (embeddedCheckout) embeddedCheckout.destroy();
    };
  }, [showCheckoutModal, checkoutClientSecret, publishableKey, pendingCheckoutPayload]);

  const openCheckoutPopup = (url: string) => {
    const width = 520;
    const height = 760;
    const dualScreenLeft = window.screenLeft ?? window.screenX ?? 0;
    const dualScreenTop = window.screenTop ?? window.screenY ?? 0;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || screen.width;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || screen.height;
    const left = Math.max(0, dualScreenLeft + (viewportWidth - width) / 2);
    const top = Math.max(0, dualScreenTop + (viewportHeight - height) / 2);

    const popup = window.open(
      url,
      'rotaract-public-event-checkout',
      `popup=yes,width=${width},height=${height},left=${Math.round(left)},top=${Math.round(top)},resizable=yes,scrollbars=yes`
    );

    if (popup) {
      popup.focus();
      return;
    }

    window.location.href = url;
  };

  const hasTierPricing = tiers && tiers.length > 0;
  const now = new Date();
  const availableTiers = hasTierPricing
    ? tiers.filter((t) => {
        if (t.deadline && new Date(t.deadline) < now) return false;
        if (t.capacity != null && (t.soldCount ?? 0) >= t.capacity) return false;
        return true;
      }).sort((a, b) => a.sortOrder - b.sortOrder)
    : [];

  const isEarlyBird =
    !hasTierPricing &&
    earlyBirdPrice != null &&
    earlyBirdDeadline &&
    new Date(earlyBirdDeadline) > now;

  const displayPrice = hasTierPricing
    ? (selectedTierId
      ? (tiers.find((t) => t.id === selectedTierId)?.guestPrice ?? null)
      : (availableTiers[0]?.guestPrice ?? null))
    : isEarlyBird
    ? earlyBirdPrice!
    : guestPrice;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const body = { eventId, name, email, phone: phone || undefined, tierId: selectedTierId || undefined };
      setPendingCheckoutPayload(body);

      const res = await fetch('/api/events/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      if (data.requiresPayment) {
        // Start Stripe checkout
        const checkoutRes = await fetch('/api/events/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...body,
            embedded: Boolean(publishableKey),
          }),
        });

        const checkoutData = await checkoutRes.json();

        if (!checkoutRes.ok) {
          throw new Error(checkoutData.error || 'Payment setup failed. Please try again.');
        }

        if (checkoutData.clientSecret && typeof checkoutData.clientSecret === 'string' && publishableKey) {
          setCheckoutClientSecret(checkoutData.clientSecret);
          setCheckoutUrl('');
          setShowCheckoutModal(true);
          return; // keep loading state while redirecting
        }

        if (checkoutData.url && typeof checkoutData.url === 'string' && checkoutData.url.startsWith(STRIPE_CHECKOUT_PREFIX)) {
          setCheckoutUrl(checkoutData.url);
          setCheckoutClientSecret('');
          setShowCheckoutModal(true);
          return;
        }

        if (checkoutData.free) {
          setSuccess(true);
          setLoading(false);
          return;
        }
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Success state ──────────────────────────────────────────────
  if (success) {
    return (
      <div className="mt-10 p-6 bg-cranberry-50 dark:bg-cranberry-900/10 rounded-2xl border border-cranberry-100 dark:border-cranberry-900/30 text-center">
        {/* Checkmark */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <svg
            className="h-7 w-7 text-green-600 dark:text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h3 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-2">
          You&rsquo;re registered!
        </h3>

        {email ? (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            A confirmation email has been sent to{' '}
            <span className="font-medium text-gray-900 dark:text-white">{email}</span>.
          </p>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Check your email for confirmation details.
          </p>
        )}

        <div className="p-4 bg-white/60 dark:bg-gray-900/40 rounded-xl">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            💡 <strong>Members get discounted tickets and exclusive events.</strong>
          </p>
          <Link
            href="/membership"
            className="mt-2 inline-block text-sm font-semibold text-cranberry hover:underline"
          >
            Learn about membership →
          </Link>
        </div>
      </div>
    );
  }

  // ── Form state ─────────────────────────────────────────────────
  return (
    <div className="mt-10 p-6 bg-cranberry-50 dark:bg-cranberry-900/10 rounded-2xl border border-cranberry-100 dark:border-cranberry-900/30">
      <h3 className="font-display font-bold text-gray-900 dark:text-white mb-1">
        Want to attend?
      </h3>

      {hasTierPricing ? (
        /* ── Tier selector for guests ── */
        <div className="mb-5 space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Select your ticket tier:
          </p>
          {availableTiers.length === 0 ? (
            <p className="text-sm text-red-500 font-medium">All ticket tiers are sold out or expired.</p>
          ) : (
            availableTiers.map((tier) => {
              const selected = selectedTierId === tier.id;
              const spots = tier.capacity != null ? Math.max(0, tier.capacity - (tier.soldCount ?? 0)) : null;
              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setSelectedTierId(tier.id)}
                  className={`w-full text-left rounded-xl p-3 border-2 transition-all ${
                    selected
                      ? 'border-cranberry bg-white dark:bg-gray-900 shadow-sm'
                      : 'border-cranberry-200/60 dark:border-cranberry-900/40 hover:border-cranberry/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`font-semibold text-sm ${selected ? 'text-cranberry' : 'text-gray-900 dark:text-white'}`}>{tier.label}</span>
                      {tier.description && <p className="text-xs text-gray-500 mt-0.5">{tier.description}</p>}
                      {tier.deadline && <p className="text-[10px] text-green-600 mt-0.5">Until {formatDate(tier.deadline)}</p>}
                      {spots !== null && <p className={`text-[10px] mt-0.5 ${spots <= 5 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>{spots} left</p>}
                    </div>
                    <p className="text-lg font-display font-bold text-gray-900 dark:text-white">{formatCurrency(tier.guestPrice)}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      ) : isPaid && displayPrice != null ? (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
          Guest ticket:{' '}
          <span className="font-semibold text-gray-900 dark:text-white">
            {formatCurrency(displayPrice)}
          </span>
          {isEarlyBird && (
            <span className="ml-2 text-green-700 dark:text-green-400 font-medium">
              🐦 Early bird
            </span>
          )}
        </p>
      ) : (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
          Register below to reserve your spot — it&rsquo;s free!
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="guest-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Name <span className="text-cranberry">*</span>
          </label>
          <input
            id="guest-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-cranberry focus:ring-2 focus:ring-cranberry/20 outline-none transition"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="guest-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email <span className="text-cranberry">*</span>
          </label>
          <input
            id="guest-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-cranberry focus:ring-2 focus:ring-cranberry/20 outline-none transition"
          />
        </div>

        {/* Phone (optional) */}
        <div>
          <label htmlFor="guest-phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Phone <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="guest-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-cranberry focus:ring-2 focus:ring-cranberry/20 outline-none transition"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-cranberry px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-cranberry-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cranberry disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing…
            </span>
          ) : isPaid ? (
            'Get Your Ticket'
          ) : (
            'Register as Guest'
          )}
        </button>
      </form>

      {/* Membership pitch */}
      <div className="mt-5 pt-4 border-t border-cranberry-100 dark:border-cranberry-900/30">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          💡 <strong>Members get discounted tickets and exclusive events.</strong>{' '}
          <Link href="/membership" className="text-cranberry hover:underline font-medium">
            Learn more →
          </Link>
        </p>
      </div>

      <Modal
        open={showCheckoutModal}
        onClose={() => {
          setShowCheckoutModal(false);
          setCheckoutClientSecret('');
          setCheckoutUrl('');
          setCheckoutError('');
          setPendingCheckoutPayload(null);
        }}
        title="Complete payment"
        size="xl"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Complete your secure card payment below without leaving this page.
          </p>

          {checkoutError && (
            <p role="alert" aria-live="assertive" className="text-sm text-red-600 dark:text-red-400">
              {checkoutError}
            </p>
          )}

          {!publishableKey && (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              In-page checkout key is missing. Use secure popup checkout below.
            </p>
          )}

          {checkoutClientSecret && publishableKey && (
            <div
              id="public-event-embedded-checkout"
              className="min-h-[520px] rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
            />
          )}

          {checkoutUrl && (
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => openCheckoutPopup(checkoutUrl)}
                className="rounded-lg bg-cranberry px-4 py-2 text-sm font-semibold text-white hover:bg-cranberry-800"
              >
                Open secure checkout
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
