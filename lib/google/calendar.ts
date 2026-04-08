/**
 * Google Calendar integration.
 *
 * Syncs portal events to a shared Google Calendar so the whole club
 * can subscribe and see upcoming events automatically.
 */

import { google, type calendar_v3 } from 'googleapis';
import { getServiceAccountAuth, getAuthedOAuth2Client, getGoogleSettings, isServiceAccountConfigured } from './client';
import type { RotaractEvent } from '@/types';

// ─── Helpers ───

async function getCalendarClient(): Promise<calendar_v3.Calendar> {
  // Prefer service account; fall back to OAuth2
  if (isServiceAccountConfigured()) {
    const auth = getServiceAccountAuth();
    return google.calendar({ version: 'v3', auth: auth as any });
  }
  const oauth = await getAuthedOAuth2Client();
  return google.calendar({ version: 'v3', auth: oauth });
}

/** Convert a RotaractEvent into a Google Calendar event resource. */
function toGoogleEvent(event: RotaractEvent): calendar_v3.Schema$Event {
  const start = event.date; // ISO string

  // Build end date: use endDate if available, otherwise add 2 hours
  let end = event.endDate;
  if (!end) {
    const d = new Date(start);
    d.setHours(d.getHours() + 2);
    end = d.toISOString();
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rotaractnyc.org';

  return {
    summary: event.title,
    description: [
      event.description,
      '',
      `🔗 Details: ${appUrl}/events/${event.slug}`,
      event.type === 'paid' && event.pricing
        ? `💳 Member price: $${(event.pricing.memberPrice / 100).toFixed(2)}`
        : '',
    ]
      .filter(Boolean)
      .join('\n'),
    location: event.address || event.location,
    start: {
      dateTime: start,
      timeZone: 'America/New_York',
    },
    end: {
      dateTime: end,
      timeZone: 'America/New_York',
    },
    status: event.status === 'cancelled' ? 'cancelled' : 'confirmed',
    // Store portal event ID for sync tracking
    extendedProperties: {
      private: {
        rotaractEventId: event.id,
      },
    },
  };
}

// ─── Public API ───

/** List upcoming events from the shared Google Calendar. */
export async function listCalendarEvents(maxResults = 20) {
  const settings = await getGoogleSettings();
  if (!settings.calendarId) throw new Error('No calendar ID configured.');

  const calendar = await getCalendarClient();
  const res = await calendar.events.list({
    calendarId: settings.calendarId,
    timeMin: new Date().toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return res.data.items || [];
}

/** Push a single event to the Google Calendar. Returns the Google event ID. */
export async function syncEventToCalendar(event: RotaractEvent): Promise<string> {
  const settings = await getGoogleSettings();
  if (!settings.calendarId) throw new Error('No calendar ID configured.');

  const calendar = await getCalendarClient();
  const googleEvent = toGoogleEvent(event);

  // Check if event already exists (by extendedProperties)
  const existing = await findGoogleEventByPortalId(calendar, settings.calendarId, event.id);

  if (existing?.id) {
    // Update
    const res = await calendar.events.update({
      calendarId: settings.calendarId,
      eventId: existing.id,
      requestBody: googleEvent,
    });
    return res.data.id || existing.id;
  }

  // Create
  const res = await calendar.events.insert({
    calendarId: settings.calendarId,
    requestBody: googleEvent,
  });
  return res.data.id || '';
}

/** Delete a synced event from Google Calendar. */
export async function deleteCalendarEvent(portalEventId: string): Promise<void> {
  const settings = await getGoogleSettings();
  if (!settings.calendarId) return;

  const calendar = await getCalendarClient();
  const existing = await findGoogleEventByPortalId(calendar, settings.calendarId, portalEventId);

  if (existing?.id) {
    await calendar.events.delete({
      calendarId: settings.calendarId,
      eventId: existing.id,
    });
  }
}

/** Sync all published portal events to the Google Calendar. */
export async function syncAllEvents(events: RotaractEvent[]): Promise<{ synced: number; errors: string[] }> {
  const results = { synced: 0, errors: [] as string[] };

  for (const event of events) {
    try {
      await syncEventToCalendar(event);
      results.synced++;
    } catch (err: any) {
      results.errors.push(`${event.title}: ${err.message}`);
    }
  }

  return results;
}

/** Find a Google Calendar event by our portal event ID in extendedProperties. */
async function findGoogleEventByPortalId(
  calendar: calendar_v3.Calendar,
  calendarId: string,
  portalEventId: string,
): Promise<calendar_v3.Schema$Event | null> {
  try {
    const res = await calendar.events.list({
      calendarId,
      privateExtendedProperty: [`rotaractEventId=${portalEventId}`],
      maxResults: 1,
    });
    return (res as any).data?.items?.[0] || null;
  } catch {
    return null;
  }
}
