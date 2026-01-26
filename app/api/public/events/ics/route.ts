import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_EVENTS } from '@/lib/content/events'
import { getFirebaseAdminDb, isFirebaseAdminConfigured } from '@/lib/firebase/admin'
import { getEventIcs } from '@/lib/calendar/eventCalendar'

export const dynamic = 'force-dynamic'

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

type AnyEvent = {
  id: string
  title: string
  description: string
  location?: string
  startDate?: string
  startTime?: string
  endTime?: string
  timezone?: string
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id') || ''
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  let event: AnyEvent | null = null

  // Prefer Firestore event if configured
  if (isFirebaseAdminConfigured()) {
    try {
      const db = getFirebaseAdminDb()
      
      // Try portalEvents first (new unified collection)
      let snap = await db.collection('portalEvents').doc(id).get()
      
      // Fall back to legacy events collection
      if (!snap.exists) {
        snap = await db.collection('events').doc(id).get()
      }
      
      if (snap.exists) {
        const data = snap.data() as Record<string, unknown>
        event = {
          id,
          title: String(data.title ?? ''),
          description: String(data.description ?? ''),
          location: data.location ? String(data.location) : '',
          startDate: data.startDate ? String(data.startDate) : undefined,
          startTime: data.startTime ? String(data.startTime) : undefined,
          endTime: data.endTime ? String(data.endTime) : undefined,
          timezone: data.timezone ? String(data.timezone) : undefined,
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return NextResponse.json(
        { error: 'Failed to load event for ICS', details: message, code: 'ICS_FETCH_FAILED' },
        { status: 500 }
      )
    }
  }

  if (!event) {
    const fallback = DEFAULT_EVENTS.find((e) => e.id === id)
    if (!fallback) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    event = {
      id: fallback.id,
      title: fallback.title,
      description: fallback.description,
      location: fallback.location,
      startDate: fallback.startDate,
      startTime: fallback.startTime,
      endTime: fallback.endTime,
      timezone: fallback.timezone,
    }
  }

  const ics = getEventIcs(event, { url: `https://rotaractnyc.org/events` })
  if (!ics) {
    return NextResponse.json(
      {
        error: 'This event is missing calendar date/time fields. Add startDate (and optionally startTime/endTime) in Admin → Events.',
        code: 'MISSING_CALENDAR_FIELDS',
      },
      { status: 400 }
    )
  }

  const filename = sanitizeFilename(`rotaract-event-${id}.ics`) || 'event.ics'

  return new NextResponse(ics, {
    status: 200,
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'no-store',
    },
  })
}
