import { NextResponse } from 'next/server'
import { getFirebaseAdminDb, isFirebaseAdminConfigured } from '@/lib/firebase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json(
      { error: 'Firebase Admin not configured' },
      { status: 500 }
    )
  }

  try {
    const db = getFirebaseAdminDb()
    
    // Collect events from both portalEvents and legacy events collection
    // portalEvents takes priority (if same ID exists in both)
    const eventMap = new Map<string, Record<string, unknown>>()
    
    // First, load legacy events (will be overwritten by portalEvents)
    const legacySnap = await db.collection('events').get()
    for (const d of legacySnap.docs) {
      const data = d.data()
      eventMap.set(d.id, {
        id: d.id,
        title: data.title,
        description: data.description,
        location: data.location,
        date: data.date,
        time: data.time,
        startDate: data.startDate,
        startTime: data.startTime,
        endTime: data.endTime,
        timezone: data.timezone,
        category: data.category,
        order: data.order || 0,
        imageUrl: data.imageUrl,
        eventType: data.eventType,
        venueType: data.venueType,
        virtualLink: data.virtualLink,
        memberPrice: data.memberPrice,
        guestPrice: data.guestPrice,
        requiresRegistration: data.requiresRegistration,
        capacity: data.capacity,
        status: data.status,
        source: 'legacy',
      })
    }
    
    // Then, load portalEvents with public visibility (overwrites legacy)
    const portalEventsSnap = await db.collection('portalEvents')
      .where('visibility', '==', 'public')
      .get()
    
    for (const d of portalEventsSnap.docs) {
      const data = d.data()
      eventMap.set(d.id, {
        id: d.id,
        title: data.title,
        description: data.description,
        location: data.location,
        date: data.date || data.startDate,
        time: data.time || (data.startTime && data.endTime ? `${data.startTime} - ${data.endTime}` : ''),
        startDate: data.startDate,
        startTime: data.startTime,
        endTime: data.endTime,
        timezone: data.timezone,
        category: data.category || (data.startAt?.toDate?.() > new Date() ? 'upcoming' : 'past'),
        order: data.order || 0,
        imageUrl: data.imageUrl,
        eventType: data.eventType,
        venueType: data.venueType,
        virtualLink: data.virtualLink,
        memberPrice: data.memberPrice,
        guestPrice: data.guestPrice,
        requiresRegistration: data.requiresRegistration,
        capacity: data.capacity,
        status: data.status,
        source: 'portalEvents',
      })
    }
    
    // Convert map to array
    const events = Array.from(eventMap.values())
    
    // Sort: upcoming first by order, then past by order
    events.sort((a, b) => {
      const cat = String((a as { category?: unknown }).category ?? '').localeCompare(
        String((b as { category?: unknown }).category ?? '')
      )
      if (cat !== 0) return cat
      const ao = Number.isFinite((a as { order?: unknown }).order as number)
        ? Number((a as { order?: unknown }).order)
        : 0
      const bo = Number.isFinite((b as { order?: unknown }).order as number)
        ? Number((b as { order?: unknown }).order)
        : 0
      return ao - bo
    })

    return NextResponse.json({ events })
  } catch (err) {
    const e = err as { message?: string; code?: string }
    return NextResponse.json(
      { error: 'Failed to load events', details: e?.message || String(err), code: e?.code },
      { status: 500 }
    )
  }
}
