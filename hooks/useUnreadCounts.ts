'use client';

/**
 * useUnreadCounts — polls /api/portal/unread-counts on a 30s interval.
 *
 * Used by the mobile bottom-nav and the desktop sidebar to render unread
 * badges on Messages and Announcements. Also calls navigator.setAppBadge()
 * when supported, so the installed PWA shows a numeric badge on the icon.
 */

import { useEffect, useState } from 'react';

interface Counts {
  messages: number;
  announcements: number;
}

const POLL_MS = 30_000;

export function useUnreadCounts(enabled: boolean = true): Counts {
  const [counts, setCounts] = useState<Counts>({ messages: 0, announcements: 0 });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function fetchCounts() {
      try {
        const res = await fetch('/api/portal/unread-counts', { credentials: 'include' });
        if (!res.ok || cancelled) return;
        const data: Counts = await res.json();
        if (cancelled) return;
        setCounts(data);

        // App icon badge (Chromium / Edge / Safari 16.4+)
        const total = (data.messages || 0) + (data.announcements || 0);
        try {
          if ('setAppBadge' in navigator) {
            if (total > 0) {
              (navigator as any).setAppBadge(total).catch(() => {});
            } else {
              (navigator as any).clearAppBadge?.().catch(() => {});
            }
          }
        } catch {
          // Best-effort — silently ignore
        }
      } catch {
        // Offline or auth lapsed — leave existing counts as-is
      }
    }

    fetchCounts();
    timer = setInterval(fetchCounts, POLL_MS);

    // Refetch when tab regains focus
    const onFocus = () => fetchCounts();
    window.addEventListener('focus', onFocus);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [enabled]);

  return counts;
}
