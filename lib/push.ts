/**
 * Server-side push notification helper using Firebase Cloud Messaging (FCM).
 *
 * The web client (lib/firebase/messaging.ts) registers a service worker and
 * obtains an FCM token, then POSTs it to /api/portal/push/subscribe which
 * stores it under members/{uid}/pushTokens/{token}.
 *
 * To send a push, callers invoke `sendPushToMember(uid, payload)` or
 * `sendPushToMembers(uids, payload)`. Tokens that come back as
 * "unregistered" / "invalid" are pruned automatically.
 */

import { getMessaging } from 'firebase-admin/messaging';
import { adminDb } from './firebase/admin';

export interface PushPayload {
  title: string;
  body: string;
  /** Optional deep-link path (e.g. `/portal/messages`). Opened on notification click. */
  url?: string;
  /** Tag used to coalesce notifications of the same kind on the device. */
  tag?: string;
  /** Optional icon URL — defaults to /icon-192x192.png. */
  icon?: string;
}

interface NotificationPreferences {
  duesReminders?: boolean;
  eventReminders?: boolean;
  welcomeSequence?: boolean;
  announcements?: boolean;
  weeklyDigest?: boolean;
  boardEventDigest?: boolean;
  /** Push channel — separate from email. Defaults to true if undefined. */
  pushEnabled?: boolean;
  pushMessages?: boolean;
  pushAnnouncements?: boolean;
  pushEvents?: boolean;
  pushDues?: boolean;
}

/**
 * Check whether a member has push enabled for a given category. Defaults to
 * true so we don't silently drop pushes for accounts that never opened the
 * preferences screen.
 */
export async function isPushAllowed(
  uid: string,
  category: 'messages' | 'announcements' | 'events' | 'dues',
): Promise<boolean> {
  try {
    const doc = await adminDb.collection('notification_preferences').doc(uid).get();
    if (!doc.exists) return true;
    const prefs = doc.data() as NotificationPreferences;
    if (prefs.pushEnabled === false) return false;
    const map: Record<typeof category, keyof NotificationPreferences> = {
      messages: 'pushMessages',
      announcements: 'pushAnnouncements',
      events: 'pushEvents',
      dues: 'pushDues',
    };
    const key = map[category];
    return prefs[key] !== false;
  } catch {
    return true;
  }
}

/**
 * Send a push notification to all of a member's registered FCM tokens.
 * Returns the count of tokens that were successfully delivered.
 */
export async function sendPushToMember(uid: string, payload: PushPayload): Promise<number> {
  const tokensSnap = await adminDb
    .collection('members')
    .doc(uid)
    .collection('pushTokens')
    .get();

  if (tokensSnap.empty) return 0;

  const tokens = tokensSnap.docs.map((d) => d.id);
  return sendPushToTokens(tokens, payload, async (badTokens) => {
    // Prune invalid tokens
    await Promise.all(
      badTokens.map((t) =>
        adminDb.collection('members').doc(uid).collection('pushTokens').doc(t).delete(),
      ),
    );
  });
}

/**
 * Fan-out helper for broadcasts (announcements, club-wide reminders).
 * Skips members who have opted out of the given category.
 */
export async function sendPushToMembers(
  uids: string[],
  payload: PushPayload,
  category: 'messages' | 'announcements' | 'events' | 'dues',
): Promise<number> {
  let sent = 0;
  // Limit concurrency so we don't blow the function timeout on large clubs
  const CHUNK = 25;
  for (let i = 0; i < uids.length; i += CHUNK) {
    const chunk = uids.slice(i, i + CHUNK);
    const results = await Promise.all(
      chunk.map(async (uid) => {
        if (!(await isPushAllowed(uid, category))) return 0;
        return sendPushToMember(uid, payload);
      }),
    );
    sent += results.reduce((a, b) => a + b, 0);
  }
  return sent;
}

/**
 * Lower-level: send to an explicit list of tokens. `onInvalid` is invoked
 * with the list of tokens that came back as unregistered / invalid so the
 * caller can prune them from Firestore.
 */
async function sendPushToTokens(
  tokens: string[],
  payload: PushPayload,
  onInvalid?: (tokens: string[]) => Promise<void>,
): Promise<number> {
  if (tokens.length === 0) return 0;

  const messaging = getMessaging();
  const message = {
    notification: {
      title: payload.title,
      body: payload.body,
    },
    webpush: {
      notification: {
        icon: payload.icon || '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: payload.tag,
      },
      fcmOptions: payload.url ? { link: payload.url } : undefined,
    },
    data: payload.url ? { url: payload.url } : ({} as { [key: string]: string }),
    tokens,
  };

  const response = await messaging.sendEachForMulticast(message);

  // Collect invalid tokens for pruning
  const invalid: string[] = [];
  response.responses.forEach((r, idx) => {
    if (!r.success) {
      const code = r.error?.code;
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token' ||
        code === 'messaging/invalid-argument'
      ) {
        invalid.push(tokens[idx]);
      }
    }
  });
  if (invalid.length && onInvalid) {
    await onInvalid(invalid);
  }
  return response.successCount;
}
