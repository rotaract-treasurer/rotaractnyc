/**
 * POST /api/google/calendar/sync     — sync one or all events to Google Calendar
 * GET  /api/google/calendar/events   — list upcoming Google Calendar events
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { syncEventToCalendar, syncAllEvents, listCalendarEvents } from '@/lib/google/calendar';
import { getGoogleSettings } from '@/lib/google/client';
import { getEvent, getAllEvents, getUpcomingEvents } from '@/lib/services/events';

export const dynamic = 'force-dynamic';

// ─── GET: list calendar events ───

export async function GET() {
  try {
    const settings = await getGoogleSettings();
    if (!settings.enabled || !settings.calendarEnabled || !settings.calendarId) {
      return NextResponse.json({ events: [], enabled: false });
    }

    const events = await listCalendarEvents(30);
    return NextResponse.json({ events, enabled: true });
  } catch (error: any) {
    console.error('[GET /api/google/calendar/sync]', error);
    return NextResponse.json({ events: [], error: error.message }, { status: 500 });
  }
}

// ─── POST: sync events ───

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('rotaract_portal_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let uid: string;
    try {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
      uid = decoded.uid;
    } catch {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const memberSnap = await adminDb.collection('members').doc(uid).get();
    const member = memberSnap.exists ? (memberSnap.data() as any) : null;
    if (!member || !['board', 'president'].includes(member.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const settings = await getGoogleSettings();
    if (!settings.calendarId) {
      return NextResponse.json(
        { error: 'No Google Calendar ID configured.' },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { eventId, syncAll } = body;

    if (syncAll) {
      // Sync all published events
      const events = await getAllEvents();
      const published = events.filter((e) => e.status === 'published');
      const result = await syncAllEvents(published);

      // Record last sync
      await adminDb.collection('settings').doc('google-workspace').update({
        lastCalendarSync: new Date().toISOString(),
        lastCalendarSyncBy: uid,
      });

      return NextResponse.json({
        message: `Synced ${result.synced} events to Google Calendar.`,
        ...result,
      });
    }

    if (eventId) {
      const event = await getEvent(eventId);
      if (!event) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }

      const googleEventId = await syncEventToCalendar(event);
      return NextResponse.json({
        message: `Event "${event.title}" synced to Google Calendar.`,
        googleEventId,
      });
    }

    return NextResponse.json(
      { error: 'Provide eventId or set syncAll: true.' },
      { status: 400 },
    );
  } catch (error: any) {
    console.error('[POST /api/google/calendar/sync]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
