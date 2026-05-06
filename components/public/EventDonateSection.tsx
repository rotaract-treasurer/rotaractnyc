'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

const DonateForm = dynamic(() => import('@/components/public/DonateForm'), { ssr: false });

interface EventDonateSectionProps {
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  /** When set, renders a fundraising progress bar. */
  fundraisingGoalCents?: number;
  /** Total raised so far (cents). */
  donationsTotalCents?: number;
  /** Number of donations so far. */
  donationsCount?: number;
  /** Optional preset amounts (in cents) — falls back to default $25/$50/$100. */
  suggestedDonationCents?: number[];
  /** Visual variant — "card" for standalone block, "inline" for embedding alongside other CTAs. */
  variant?: 'card' | 'inline';
}

function formatUSD(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Math.round(cents / 100));
}

export default function EventDonateSection({
  eventId,
  eventTitle,
  eventSlug,
  fundraisingGoalCents,
  donationsTotalCents = 0,
  donationsCount = 0,
  suggestedDonationCents,
  variant = 'card',
}: EventDonateSectionProps) {
  const [open, setOpen] = useState(false);

  const goal = fundraisingGoalCents && fundraisingGoalCents > 0 ? fundraisingGoalCents : 0;
  const raised = Math.max(0, donationsTotalCents);
  const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;

  const presetDollars = suggestedDonationCents && suggestedDonationCents.length > 0
    ? suggestedDonationCents.map((c) => Math.round(c / 100))
    : undefined;

  const wrapperClass =
    variant === 'card'
      ? 'bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 p-5 sm:p-6 space-y-4'
      : 'space-y-3';

  return (
    <>
      <div className={wrapperClass}>
        <div className="flex items-start gap-3">
          <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cranberry/10 text-cranberry">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-gray-900 dark:text-white text-base sm:text-lg leading-tight">
              Support this event
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Make a tax-deductible donation in addition to (or instead of) buying a ticket.
            </p>
          </div>
        </div>

        {goal > 0 && (
          <div>
            <div className="flex items-baseline justify-between gap-2 mb-1.5">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatUSD(raised)}{' '}
                <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                  raised of {formatUSD(goal)} goal
                </span>
              </p>
              <p className="text-xs font-semibold text-cranberry">{pct}%</p>
            </div>
            <div
              className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Fundraising progress for ${eventTitle}`}
            >
              <div
                className="h-full bg-gradient-to-r from-cranberry to-cranberry-600 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            {donationsCount > 0 && (
              <p className="text-[11px] text-gray-400 mt-1.5">
                {donationsCount} {donationsCount === 1 ? 'donation' : 'donations'} so far — thank you!
              </p>
            )}
          </div>
        )}

        {goal === 0 && donationsCount > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatUSD(raised)} raised from {donationsCount}{' '}
            {donationsCount === 1 ? 'donor' : 'donors'} so far — thank you!
          </p>
        )}

        <Button
          variant="primary"
          size="md"
          onClick={() => setOpen(true)}
          className="w-full sm:w-auto"
        >
          Donate to this event
        </Button>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Donate to ${eventTitle}`}
        size="lg"
      >
        <DonateForm
          eventId={eventId}
          eventTitle={eventTitle}
          eventSlug={eventSlug}
          presetAmounts={presetDollars}
          compact
        />
      </Modal>
    </>
  );
}
