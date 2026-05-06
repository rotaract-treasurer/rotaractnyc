'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import Button from '@/components/ui/Button';

/* ── Lucide icons (inline to avoid pulling the whole lib) ─────────────── */

function HeartIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function ShieldCheckIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function CheckCircleIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  );
}

function AlertCircleIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx={12} cy={12} r={10} />
      <line x1={12} y1={8} x2={12} y2={12} />
      <line x1={12} y1={16} x2={12.01} y2={16} />
    </svg>
  );
}

function ArrowLeftIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1={19} y1={12} x2={5} y2={12} />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

/* ── Stripe singleton ──────────────────────────────────────────────────── */

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

/* ── Donation presets — copy + dollar amount only, no emoji ───────────── */

interface PresetTier {
  amount: number;
  label: string;
  description: string;
}

const defaultPresets: PresetTier[] = [
  { amount: 25, label: '$25', description: 'Funds supplies for a service day.' },
  { amount: 50, label: '$50', description: 'Provides meals for ten families.' },
  { amount: 100, label: '$100', description: 'Sponsors a full community project.' },
];

const MAX_MESSAGE_LENGTH = 500;

interface DonateFormProps {
  /** When set, the donation is attributed to this event in Stripe metadata + webhook. */
  eventId?: string;
  /** Used in the Stripe product name + thank-you copy. */
  eventTitle?: string;
  /** Used to redirect back to the event page after Stripe checkout. */
  eventSlug?: string;
  /** Optional override for preset donation tiers (in dollars). */
  presetAmounts?: number[];
  /** Hide the page-level wrapper / use tighter padding when embedded inside a card. */
  compact?: boolean;
}

export default function DonateForm({
  eventId,
  eventTitle,
  eventSlug,
  presetAmounts,
  compact = false,
}: DonateFormProps = {}) {
  const searchParams = useSearchParams();

  // Build presets — when caller supplies amounts we make minimal, label-only tiles.
  const presets: PresetTier[] = useMemo(() => {
    if (presetAmounts && presetAmounts.length > 0) {
      return presetAmounts.map((amount) => ({
        amount,
        label: `$${amount}`,
        description: 'Suggested contribution.',
      }));
    }
    return defaultPresets;
  }, [presetAmounts]);

  const [selected, setSelected] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState<boolean | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Embedded Stripe Checkout state
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');
  const cancelled = searchParams.get('cancelled') === 'true';

  // Verify session server-side after Stripe redirects back
  useEffect(() => {
    if (!sessionId) return;
    let active = true;
    setVerifying(true);
    fetch(`/api/donate/verify?session_id=${encodeURIComponent(sessionId)}`)
      .then((res) => res.json())
      .then((data) => { if (active) setVerified(data.verified === true); })
      .catch(() => { if (active) setVerified(false); })
      .finally(() => { if (active) setVerifying(false); });
    return () => { active = false; };
  }, [sessionId]);

  // Reset the form after a successful or cancelled return
  useEffect(() => {
    if (verified || cancelled) {
      setSelected(null);
      setCustomAmount('');
      setDonorName('');
      setDonorEmail('');
      setMessage('');
      setClientSecret(null);
    }
  }, [verified, cancelled]);

  const chosenAmount =
    selected ??
    (customAmount && Number(customAmount) >= 5 ? Number(customAmount) : null);

  const canSubmit =
    !!chosenAmount &&
    donorName.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorEmail.trim()) &&
    message.length <= MAX_MESSAGE_LENGTH;

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    setError('');
    const trimmedName = donorName.trim();
    const trimmedEmail = donorEmail.trim();

    const idempotencyKey = crypto.randomUUID();
    const body: Record<string, string | boolean> = {
      donorName: trimmedName,
      donorEmail: trimmedEmail,
      idempotencyKey,
      embedded: true,
    };
    if (eventId) body.eventId = eventId;
    if (eventTitle) body.eventTitle = eventTitle;
    if (eventSlug) body.eventSlug = eventSlug;
    if (selected) body.amount = String(selected);
    else if (customAmount) body.customAmount = customAmount;
    if (message.trim()) body.message = message.trim().slice(0, MAX_MESSAGE_LENGTH);

    const res = await fetch('/api/donate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok || !data.clientSecret) {
      throw new Error(data.error || 'Could not start checkout.');
    }
    return data.clientSecret as string;
  }, [donorName, donorEmail, selected, customAmount, message, eventId, eventTitle, eventSlug]);

  const handleProceed = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      const secret = await fetchClientSecret();
      setClientSecret(secret);
    } catch (e: any) {
      setError(e?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToForm = () => {
    setClientSecret(null);
  };

  /* ── Status banners ──────────────────────────────────────────────── */

  if (verifying) {
    return (
      <Wrapper compact={compact}>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-10 text-center">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <svg aria-hidden="true" className="animate-spin h-5 w-5 text-gray-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Verifying your donation…</p>
        </div>
      </Wrapper>
    );
  }

  if (verified === true) {
    return (
      <Wrapper compact={compact}>
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/30 p-10 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            <CheckCircleIcon className="h-7 w-7" />
          </div>
          <h2 className="mt-5 font-display text-2xl font-semibold text-gray-900 dark:text-white">
            Thank you for your generosity.
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Your donation has been received and a receipt is on its way to your inbox.
          </p>
        </div>
      </Wrapper>
    );
  }

  if (verified === false) {
    return (
      <Wrapper compact={compact}>
        <div className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/30 p-8 text-center">
          <AlertCircleIcon className="mx-auto h-6 w-6 text-red-600 dark:text-red-300" />
          <p className="mt-3 text-sm text-red-800 dark:text-red-200">
            We could not verify your donation. Please contact us if you believe this is an error.
          </p>
        </div>
      </Wrapper>
    );
  }

  /* ── Embedded Checkout view ──────────────────────────────────────── */

  if (clientSecret) {
    return (
      <Wrapper compact={compact}>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-5 py-3">
            <button
              type="button"
              onClick={handleBackToForm}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" />
              Edit details
            </button>
            <p className="inline-flex items-center gap-1.5 text-[11px] text-gray-400">
              <ShieldCheckIcon className="h-3.5 w-3.5" />
              Secured by Stripe
            </p>
          </div>
          <div id="checkout" className="min-h-[520px]">
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{ clientSecret }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        </div>
      </Wrapper>
    );
  }

  /* ── Default form view ───────────────────────────────────────────── */

  return (
    <Wrapper compact={compact}>
      {cancelled && (
        <div className="mb-6 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-900 dark:text-amber-200 flex items-start gap-2">
          <AlertCircleIcon className="h-4 w-4 mt-0.5 flex-none" />
          <span>Your last checkout was cancelled. No payment was taken — feel free to try again.</span>
        </div>
      )}

      <div
        className={`rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-950 ${compact ? 'p-6' : 'p-8 sm:p-10'} shadow-sm`}
      >
        <div className="flex items-start gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cranberry/10 text-cranberry">
            <HeartIcon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className={`font-display font-semibold text-gray-900 dark:text-white ${compact ? 'text-xl' : 'text-2xl'}`}>
              {eventTitle ? `Make a donation toward ${eventTitle}` : 'Support Rotaract NYC'}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              {eventTitle
                ? `Every contribution helps cover event costs and amplifies the community programs this event supports. 100% goes directly to the event and our service work.`
                : `Your gift powers food drives, park cleanups, education programs, and international service initiatives — locally and abroad. 100% goes directly to our project funds.`}
            </p>
          </div>
        </div>

        {/* Amount selection */}
        <fieldset className="mt-7">
          <legend className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
            Choose an amount
          </legend>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Donation amount presets">
            {presets.map((p) => {
              const active = selected === p.amount;
              return (
                <button
                  key={p.amount}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => { setSelected(p.amount); setCustomAmount(''); setError(''); }}
                  className={`group relative rounded-xl border text-left p-4 transition-all ${
                    active
                      ? 'border-cranberry ring-2 ring-cranberry/20 bg-cranberry/[0.03]'
                      : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-950'
                  }`}
                >
                  <p className={`font-display text-2xl font-semibold ${active ? 'text-cranberry' : 'text-gray-900 dark:text-white'}`}>
                    {p.label}
                  </p>
                  <p className="mt-1 text-xs leading-snug text-gray-500 dark:text-gray-400">
                    {p.description}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-4">
            <label htmlFor="custom-amount" className="block text-xs font-medium text-gray-600 dark:text-gray-400">
              Or enter a custom amount
            </label>
            <div className="relative mt-1.5 max-w-[200px]">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">$</span>
              <input
                id="custom-amount"
                type="number"
                min={5}
                step={1}
                inputMode="numeric"
                placeholder="Other"
                value={customAmount}
                onChange={(e) => { setCustomAmount(e.target.value); setSelected(null); setError(''); }}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 pl-7 pr-3 py-2.5 text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-cranberry focus:ring-2 focus:ring-cranberry/20"
              />
            </div>
            <p className="mt-1 text-[11px] text-gray-400">$5 minimum.</p>
          </div>
        </fieldset>

        {/* Donor details */}
        <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="donor-name" className="block text-xs font-medium text-gray-600 dark:text-gray-400">
              Full name <span className="text-cranberry">*</span>
            </label>
            <input
              id="donor-name"
              type="text"
              autoComplete="name"
              placeholder="Jane Doe"
              value={donorName}
              onChange={(e) => { setDonorName(e.target.value); setError(''); }}
              className="mt-1.5 w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-cranberry focus:ring-2 focus:ring-cranberry/20"
            />
          </div>
          <div>
            <label htmlFor="donor-email" className="block text-xs font-medium text-gray-600 dark:text-gray-400">
              Email for receipt <span className="text-cranberry">*</span>
            </label>
            <input
              id="donor-email"
              type="email"
              autoComplete="email"
              placeholder="jane@example.com"
              value={donorEmail}
              onChange={(e) => { setDonorEmail(e.target.value); setError(''); }}
              className="mt-1.5 w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-cranberry focus:ring-2 focus:ring-cranberry/20"
            />
          </div>
        </div>

        {/* Optional message */}
        <div className="mt-4">
          <div className="flex items-baseline justify-between">
            <label htmlFor="donor-message" className="block text-xs font-medium text-gray-600 dark:text-gray-400">
              {eventTitle ? `Add a note for the ${eventTitle} team` : 'Add a note (optional)'}
            </label>
            <span className="text-[11px] text-gray-400">{message.length}/{MAX_MESSAGE_LENGTH}</span>
          </div>
          <textarea
            id="donor-message"
            rows={3}
            maxLength={MAX_MESSAGE_LENGTH}
            placeholder={
              eventTitle
                ? `In honor of someone special, dedication, or a short note about why you’re supporting ${eventTitle}…`
                : 'Share what inspired your gift, or dedicate it in honor of someone…'
            }
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
            className="mt-1.5 w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-cranberry focus:ring-2 focus:ring-cranberry/20 resize-none"
          />
        </div>

        {error && (
          <p role="alert" aria-live="assertive" className="mt-4 inline-flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
            <AlertCircleIcon className="h-4 w-4" />
            {error}
          </p>
        )}

        <div className="mt-7 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="inline-flex items-center gap-1.5 text-[11px] text-gray-400">
            <ShieldCheckIcon className="h-3.5 w-3.5" />
            Secure payment powered by Stripe. Tax-deductible to the extent allowed by law.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={handleProceed}
            disabled={loading || !canSubmit}
            className="sm:min-w-[220px]"
          >
            {loading
              ? 'Preparing checkout…'
              : chosenAmount
                ? `Continue · $${chosenAmount}`
                : 'Continue'}
          </Button>
        </div>
      </div>
    </Wrapper>
  );
}

/* ── Layout wrapper — keeps consistent paddings across page + modal ──── */

function Wrapper({ children, compact }: { children: React.ReactNode; compact: boolean }) {
  return (
    <div className={compact ? '' : 'container-page max-w-2xl'}>
      {children}
    </div>
  );
}
