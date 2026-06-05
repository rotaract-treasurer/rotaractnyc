'use client';

import { useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/Toast';
import {
  isPushSupported,
  enablePushNotifications,
  onForegroundMessage,
} from '@/lib/firebase/messaging';

/**
 * Keeps a signed-in member's push subscription healthy and surfaces pushes that
 * arrive while the app is focused.
 *
 * - On load, if the member already granted notification permission, we silently
 *   re-register the FCM token. Tokens rotate and devices change, so refreshing
 *   on every portal load keeps the server's token list current — without this,
 *   pushes quietly stop arriving once a token rotates. It never prompts: if
 *   permission isn't already granted we do nothing (the opt-in lives in
 *   Settings → Notifications).
 * - While the tab is focused, FCM fires `onMessage` instead of showing a system
 *   notification, so we surface an in-app toast so the member doesn't miss it.
 *
 * Renders nothing.
 */
export default function PushManager() {
  const { toast } = useToast();
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Subscribe to foreground messages (app open & focused) and surface them as
    // an in-app toast. Guarded so we never register two listeners.
    const subscribeForeground = async () => {
      if (cancelled || unsubRef.current) return;
      unsubRef.current = await onForegroundMessage((payload) => {
        const title = payload.notification?.title || 'Rotaract NYC';
        const body = payload.notification?.body || '';
        toast(body ? `${title} — ${body}` : title, 'info');
      });
    };

    (async () => {
      try {
        if (!(await isPushSupported())) return;
        if (
          typeof Notification === 'undefined' ||
          Notification.permission !== 'granted'
        ) {
          return; // not opted in — don't prompt here
        }

        // Refresh the token so the server can always reach this device.
        await enablePushNotifications();
        await subscribeForeground();
      } catch (err) {
        console.warn('[push] PushManager init failed:', err);
      }
    })();

    // When the member opts in via NotificationPrompt, start surfacing
    // foreground toasts right away (without waiting for a reload).
    const onEnabled = () => {
      subscribeForeground().catch(() => {
        /* best-effort */
      });
    };
    window.addEventListener('rotaract:push-enabled', onEnabled);

    return () => {
      cancelled = true;
      window.removeEventListener('rotaract:push-enabled', onEnabled);
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [toast]);

  return null;
}
