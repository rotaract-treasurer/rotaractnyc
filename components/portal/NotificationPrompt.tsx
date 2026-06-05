'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/components/ui/Toast';
import { isPushSupported, enablePushNotifications } from '@/lib/firebase/messaging';

/**
 * NotificationPrompt — a one-time, dismissible nudge to turn on push
 * notifications, so members don't have to dig into Settings → Notifications.
 *
 * It only appears when ALL of these hold:
 *  - The browser can actually do web push (`isPushSupported`).
 *  - The user hasn't decided yet (`Notification.permission === 'default'`) — we
 *    never re-ask people who already granted or explicitly blocked.
 *  - It hasn't been dismissed in the last 30 days.
 *  - On iOS, the app is installed to the Home Screen (Safari only allows web
 *    push from an installed PWA), otherwise enabling would silently fail.
 *
 * Clicking "Enable" triggers the native permission request and registers the
 * FCM token via the same path as the Settings toggle.
 */

const DISMISS_KEY = 'rotaract_push_prompt_dismissed_at';
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export default function NotificationPrompt() {
  const { toast } = useToast();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    (async () => {
      // Only ask when the user hasn't already granted or blocked.
      if (typeof Notification === 'undefined' || Notification.permission !== 'default') {
        return;
      }
      if (!(await isPushSupported())) return;

      // iOS Safari only delivers web push from an installed (standalone) PWA.
      const ua = window.navigator.userAgent.toLowerCase();
      const isIos = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      if (isIos && !isStandalone) return;

      // Respect a recent dismissal.
      const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
      if (dismissedAt && Date.now() - dismissedAt < DISMISS_TTL_MS) return;

      // Small delay so it doesn't slam in during first paint / navigation.
      timer = setTimeout(() => {
        if (!cancelled) setShow(true);
      }, 2500);
    })();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleEnable = useCallback(async () => {
    setBusy(true);
    try {
      const token = await enablePushNotifications();
      if (token) {
        toast("Notifications on — we'll keep you posted!", 'success');
        // Let PushManager start surfacing foreground toasts immediately.
        window.dispatchEvent(new Event('rotaract:push-enabled'));
        setShow(false);
      } else if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
        toast('Notifications blocked. You can re-enable them in browser settings.', 'error');
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
        setShow(false);
      } else {
        // User closed the native prompt without choosing — back off for now.
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
        setShow(false);
      }
    } catch {
      toast("Couldn't enable notifications. Please try again.", 'error');
    } finally {
      setBusy(false);
    }
  }, [toast]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShow(false);
  }, []);

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Enable notifications"
      className="fixed bottom-4 left-4 right-4 z-[9998] mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-cranberry-100 bg-white p-4 shadow-2xl animate-slide-up dark:border-gray-700 dark:bg-gray-900 sm:left-auto sm:right-6 sm:bottom-6"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cranberry-50 text-cranberry dark:bg-cranberry-950">
        <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          Turn on notifications
        </p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          Get alerts for new events, announcements, and club news — even when the app is closed.
        </p>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={handleEnable}
            disabled={busy}
            className="inline-flex items-center justify-center rounded-lg bg-cranberry px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-cranberry-700 disabled:opacity-60"
          >
            {busy ? 'Enabling…' : 'Enable'}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            disabled={busy}
            className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            Not now
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="shrink-0 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
      >
        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
