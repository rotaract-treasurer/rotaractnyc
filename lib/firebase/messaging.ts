'use client';

/**
 * Firebase Cloud Messaging (FCM) client helper.
 *
 * - Lazily initialises `firebase/messaging` (which depends on browser APIs and
 *   must therefore be imported only on the client).
 * - Registers `/firebase-messaging-sw.js` (FCM expects this exact filename).
 * - Requests notification permission, fetches the FCM token, and POSTs it to
 *   `/api/portal/push/subscribe` so the server can target the device.
 * - Foreground messages are surfaced via the `onMessage` callback so members
 *   still get an in-app toast when the app is open.
 *
 * Required env vars (already present for Firebase auth):
 *   NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_PROJECT_ID,
 *   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, NEXT_PUBLIC_FIREBASE_APP_ID
 *
 * Additional:
 *   NEXT_PUBLIC_FIREBASE_VAPID_KEY — the Web Push certificate "Key pair"
 *   from the Firebase console → Project Settings → Cloud Messaging tab.
 */

import { getApps, getApp, initializeApp } from 'firebase/app';
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
  type Messaging,
  type MessagePayload,
} from 'firebase/messaging';

let _messaging: Messaging | null = null;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

async function getMessagingInstance(): Promise<Messaging | null> {
  if (_messaging) return _messaging;
  if (typeof window === 'undefined') return null;
  if (!(await isSupported())) return null;

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  _messaging = getMessaging(app);
  return _messaging;
}

/**
 * Returns true if push notifications can theoretically work in this browser
 * (Notifications API + Service Worker + Firebase Messaging support).
 */
export async function isPushSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window)) return false;
  if (!('serviceWorker' in navigator)) return false;
  return isSupported();
}

/**
 * Requests notification permission, registers the dedicated FCM service worker,
 * fetches the FCM registration token, and POSTs it to the server.
 *
 * Returns the token on success, or null if the user denied permission or the
 * environment is unsupported (e.g. iOS Safari < 16.4 standalone).
 */
export async function enablePushNotifications(): Promise<string | null> {
  if (!(await isPushSupported())) return null;

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.warn('[push] NEXT_PUBLIC_FIREBASE_VAPID_KEY missing — cannot subscribe');
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  // FCM expects its own SW under /firebase-messaging-sw.js
  const swRegistration = await navigator.serviceWorker.register(
    '/firebase-messaging-sw.js',
    { scope: '/firebase-cloud-messaging-push-scope' },
  );

  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: swRegistration,
  });
  if (!token) return null;

  // Persist on the server (idempotent — safe to call on every page load)
  try {
    await fetch('/api/portal/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ token, userAgent: navigator.userAgent }),
    });
  } catch (err) {
    console.warn('[push] Failed to persist token:', err);
  }

  return token;
}

/**
 * Deletes the current FCM token from the server and revokes notification
 * permission tracking. Note: browsers don't expose a way to programmatically
 * revoke permission; the user must do that manually.
 */
export async function disablePushNotifications(token: string | null): Promise<void> {
  if (!token) return;
  try {
    await fetch(`/api/portal/push/subscribe?token=${encodeURIComponent(token)}`, {
      method: 'DELETE',
      credentials: 'include',
    });
  } catch {
    // Best-effort
  }
}

/**
 * Subscribe to foreground messages. The handler is fired when the app is in
 * the foreground (the FCM service worker handles background messages and
 * shows the system notification automatically).
 */
export async function onForegroundMessage(
  handler: (payload: MessagePayload) => void,
): Promise<() => void> {
  const messaging = await getMessagingInstance();
  if (!messaging) return () => {};
  return onMessage(messaging, handler);
}
