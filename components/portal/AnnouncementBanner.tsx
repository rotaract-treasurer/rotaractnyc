'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Announcement {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  pinned?: boolean;
}

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function fetchPinned() {
      try {
        const res = await fetch('/api/portal/announcements');
        if (!res.ok) return;
        const data: Announcement[] = await res.json();
        const pinned = data.find((a) => a.pinned);
        if (!pinned) return;

        const dismissedId =
          typeof window !== 'undefined'
            ? localStorage.getItem('dismissed_announcement')
            : null;

        if (dismissedId === pinned.id) {
          setDismissed(true);
        }
        setAnnouncement(pinned);
      } catch {
        // silently fail — banner is non-critical
      }
    }
    fetchPinned();
  }, []);

  function dismiss() {
    if (!announcement) return;
    localStorage.setItem('dismissed_announcement', announcement.id);
    setDismissed(true);
  }

  if (!announcement || dismissed) return null;

  const truncatedBody =
    announcement.body.length > 120
      ? announcement.body.slice(0, 120).trimEnd() + '…'
      : announcement.body;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="mb-5 flex items-start gap-3 rounded-2xl bg-cranberry/10 dark:bg-cranberry/20 border border-cranberry/30 dark:border-cranberry/40 px-4 py-3 text-sm"
    >
      <span className="text-lg leading-none mt-0.5 select-none" aria-hidden="true">
        📌
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-cranberry dark:text-cranberry leading-snug">
          {announcement.title}
        </p>
        <p className="mt-0.5 text-gray-700 dark:text-gray-300 leading-snug">
          {truncatedBody}
          {announcement.body.length > 120 && (
            <>
              {' '}
              <Link
                href="/portal/announcements"
                className="font-medium text-cranberry hover:underline whitespace-nowrap"
              >
                Read more →
              </Link>
            </>
          )}
        </p>
        {announcement.body.length <= 120 && (
          <Link
            href="/portal/announcements"
            className="mt-1 inline-block text-xs font-medium text-cranberry hover:underline"
          >
            View all announcements →
          </Link>
        )}
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="flex-shrink-0 mt-0.5 text-cranberry/60 hover:text-cranberry dark:text-cranberry/50 dark:hover:text-cranberry transition-colors rounded p-0.5"
      >
        <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
