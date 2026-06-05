/**
 * High-level notification triggers.
 *
 * These wrap the low-level FCM transport in `lib/push.ts` with the audience
 * resolution and copy for each product event (new event published, newsletter
 * sent, ticket sold, etc.). Every function is best-effort: it swallows and logs
 * errors so a push failure can never break the user-facing request that
 * triggered it. Call them fire-and-forget from API routes / webhooks.
 *
 * Server-only — these import the Firebase Admin SDK via `lib/push.ts`.
 */
import {
  sendPushToMembers,
  sendPushToAdmins,
  getActiveMemberUids,
} from './push';

/** Strip HTML tags and collapse whitespace for use in a notification body. */
function toPlainText(input: string, max = 140): string {
  return input
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/**
 * Notify all active members that a new event has been published.
 * Deep-links to the public event page so members can RSVP / buy tickets.
 */
export async function notifyNewEvent(event: {
  id: string;
  title: string;
  slug?: string;
  description?: string;
}): Promise<void> {
  try {
    const uids = await getActiveMemberUids();
    if (uids.length === 0) return;

    const body = event.description
      ? toPlainText(event.description)
      : 'A new event was just announced — tap to RSVP.';

    await sendPushToMembers(
      uids,
      {
        title: `📅 New event: ${event.title}`,
        body,
        url: event.slug ? `/events/${event.slug}` : '/events',
        tag: `event-${event.id}`,
      },
      'events',
    );
  } catch (err) {
    console.warn('[notify] notifyNewEvent failed:', err);
  }
}

/**
 * Notify all active members that a new article / newsletter post is live.
 * Deep-links to the public news article.
 */
export async function notifyNewArticle(article: {
  title: string;
  slug: string;
  excerpt?: string;
}): Promise<void> {
  try {
    const uids = await getActiveMemberUids();
    if (uids.length === 0) return;

    await sendPushToMembers(
      uids,
      {
        title: `📰 ${article.title}`,
        body: article.excerpt
          ? toPlainText(article.excerpt)
          : 'A new post is up on Rotaract NYC — tap to read.',
        url: `/news/${article.slug}`,
        tag: `article-${article.slug}`,
      },
      'announcements',
    );
  } catch (err) {
    console.warn('[notify] notifyNewArticle failed:', err);
  }
}

/**
 * Notify the recipients of an email broadcast/newsletter with a companion push
 * so members who skip email still see it. `recipientUids` should be the member
 * ids the broadcast was emailed to; per-member push opt-outs are still honoured.
 */
export async function notifyBroadcast(params: {
  subject: string;
  recipientUids: string[];
  broadcastId?: string;
}): Promise<void> {
  try {
    if (params.recipientUids.length === 0) return;

    await sendPushToMembers(
      params.recipientUids,
      {
        title: '📣 New from Rotaract NYC',
        body: toPlainText(params.subject),
        url: '/portal',
        tag: params.broadcastId ? `broadcast-${params.broadcastId}` : 'broadcast',
      },
      'announcements',
    );
  } catch (err) {
    console.warn('[notify] notifyBroadcast failed:', err);
  }
}

/**
 * Notify board/admins that a ticket was purchased. Fires for both member and
 * guest checkouts so admins get a live feed of sales.
 */
export async function notifyAdminsTicketPurchase(params: {
  buyerName: string;
  quantity: number;
  eventTitle: string;
  eventId: string;
  amountCents?: number;
}): Promise<void> {
  try {
    const qty = params.quantity > 0 ? params.quantity : 1;
    const ticketWord = qty === 1 ? 'ticket' : 'tickets';
    const amount =
      typeof params.amountCents === 'number' && params.amountCents > 0
        ? ` ($${(params.amountCents / 100).toFixed(2)})`
        : '';

    await sendPushToAdmins({
      title: '🎟️ New ticket sale',
      body: `${params.buyerName} bought ${qty} ${ticketWord} to ${params.eventTitle}${amount}.`,
      url: `/portal/events/${params.eventId}`,
      // Unique tag so each sale shows rather than coalescing into one.
      tag: `sale-${params.eventId}-${Date.now()}`,
    });
  } catch (err) {
    console.warn('[notify] notifyAdminsTicketPurchase failed:', err);
  }
}

/**
 * Notify board/admins that someone submitted interest in joining, so they can
 * follow up.
 */
export async function notifyAdminsMembershipInterest(params: {
  name: string;
  email: string;
}): Promise<void> {
  try {
    await sendPushToAdmins({
      title: '👋 New membership interest',
      body: `${params.name || params.email} is interested in joining Rotaract NYC.`,
      url: '/portal',
      tag: `interest-${Date.now()}`,
    });
  } catch (err) {
    console.warn('[notify] notifyAdminsMembershipInterest failed:', err);
  }
}
