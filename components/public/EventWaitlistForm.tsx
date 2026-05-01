'use client';

import { useState } from 'react';

interface Props {
  eventId: string;
}

/**
 * Waitlist signup form for sold-out public events.
 * Extracted from the (Server) event detail page so the inline `onSubmit`
 * handler is allowed (Next.js doesn't allow event handlers in Server
 * Component children).
 */
export default function EventWaitlistForm({ eventId }: Props) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/events/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, email: email.toLowerCase().trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to join waitlist');
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to join waitlist');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-red-300 dark:border-red-800">
      <p className="text-sm text-red-700 dark:text-red-300 font-medium">
        Want to join the waitlist? Enter your email below to be notified if a spot opens up.
      </p>
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2 max-w-sm mx-auto">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitted || submitting}
          placeholder="Enter your email"
          className="flex-1 px-3 py-2 rounded-lg border border-red-300 dark:border-red-700 bg-white dark:bg-gray-800 text-sm disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={submitted || submitting}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
        >
          {submitted ? '✓ Joined Waitlist' : submitting ? 'Joining…' : 'Join Waitlist'}
        </button>
      </form>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-300 mt-2">{error}</p>
      )}
    </div>
  );
}
