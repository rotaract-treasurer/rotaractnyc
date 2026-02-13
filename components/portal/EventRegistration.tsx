'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils/format';
import type { RotaractEvent } from '@/types';

interface EventRegistrationProps {
  event: RotaractEvent;
  currentRSVP?: 'going' | 'maybe' | 'not' | null;
  onRSVP: (status: 'going' | 'maybe' | 'not') => Promise<void>;
  onPurchaseTicket?: (ticketType: 'member' | 'guest') => Promise<void>;
  attendeeCount?: number;
}

export default function EventRegistration({
  event,
  currentRSVP,
  onRSVP,
  onPurchaseTicket,
  attendeeCount = 0,
}: EventRegistrationProps) {
  const [loading, setLoading] = useState(false);
  const isPast = new Date(event.date) < new Date();
  const isPaid = (event.type === 'paid' || event.type === 'hybrid') && event.pricing;

  const handleAction = async (action: () => Promise<void>) => {
    setLoading(true);
    try {
      await action();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card padding="md">
      <h3 className="font-display font-bold text-gray-900 dark:text-white mb-4">Registration</h3>

      {isPast ? (
        <div className="text-center py-4">
          <Badge variant="gray" className="text-sm px-4 py-1">Event has ended</Badge>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Pricing info */}
          {isPaid && event.pricing && (
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-cranberry-50 dark:bg-cranberry-900/20 px-3 py-2 rounded-lg">
                <span className="text-sm font-semibold text-cranberry">
                  {event.pricing.memberPrice === 0 ? 'Free' : formatCurrency(event.pricing.memberPrice)}
                </span>
                <span className="text-xs text-gray-500">Member</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {formatCurrency(event.pricing.guestPrice)}
                </span>
                <span className="text-xs text-gray-500">Guest</span>
              </div>
            </div>
          )}

          {/* Current RSVP status */}
          {currentRSVP && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Your status:</span>
              <Badge variant={currentRSVP === 'going' ? 'green' : currentRSVP === 'maybe' ? 'gold' : 'gray'}>
                {currentRSVP}
              </Badge>
            </div>
          )}

          {/* Actions */}
          {isPaid && event.pricing && event.pricing.memberPrice > 0 ? (
            <div className="flex gap-2">
              <Button
                className="flex-1"
                loading={loading}
                onClick={() => handleAction(() => onPurchaseTicket?.('member') || Promise.resolve())}
              >
                Buy Ticket
              </Button>
              <Button variant="ghost" onClick={() => handleAction(() => onRSVP('maybe'))}>
                Maybe
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                className="flex-1"
                variant={currentRSVP === 'going' ? 'secondary' : 'primary'}
                loading={loading}
                onClick={() => handleAction(() => onRSVP(currentRSVP === 'going' ? 'not' : 'going'))}
              >
                {currentRSVP === 'going' ? '✓ Going' : "I'm Going"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleAction(() => onRSVP('maybe'))}
              >
                Maybe
              </Button>
            </div>
          )}

          {/* Attendees count */}
          <p className="text-xs text-gray-500 text-center">
            {attendeeCount} {attendeeCount === 1 ? 'person' : 'people'} going
            {event.capacity ? ` · ${event.capacity - attendeeCount} spots left` : ''}
          </p>
        </div>
      )}
    </Card>
  );
}
