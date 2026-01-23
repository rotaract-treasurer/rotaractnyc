import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseAdminDb } from '@/lib/firebase/admin'
import { getUserFromRequest } from '@/lib/firebase/auth-helpers'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(req: NextRequest) {
  try {
    // Get current user
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { eventId, guestCount = 0 } = body

    if (!eventId) {
      return NextResponse.json(
        { error: 'Missing required field: eventId' },
        { status: 400 }
      )
    }

    // Get event from Firestore
    const db = getFirebaseAdminDb()
    const eventDoc = await db.collection('portalEvents').doc(eventId).get()
    
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const event = { id: eventDoc.id, ...eventDoc.data() } as any

    // Verify this is a free or service event
    if (event.eventType === 'paid') {
      return NextResponse.json(
        { error: 'This is a paid event. Please use checkout instead.' },
        { status: 400 }
      )
    }

    // Check capacity
    const totalAttendees = 1 + guestCount
    if (event.capacity && event.attendeeCount) {
      const spotsLeft = event.capacity - event.attendeeCount
      if (totalAttendees > spotsLeft) {
        return NextResponse.json(
          { error: `Only ${spotsLeft} spot(s) remaining` },
          { status: 400 }
        )
      }
    }

    // Check if user already registered
    const existingRsvp = await db
      .collection('eventRegistrations')
      .where('eventId', '==', eventId)
      .where('userId', '==', user.uid)
      .limit(1)
      .get()

    if (!existingRsvp.empty) {
      return NextResponse.json(
        { error: 'You are already registered for this event' },
        { status: 400 }
      )
    }

    // Get user membership status
    const userDoc = await db.collection('portalUsers').doc(user.uid).get()
    const userData = userDoc.data()
    const isMember = userData?.status === 'active'

    // Create RSVP registration
    await db.collection('eventRegistrations').add({
      eventId,
      userId: user.uid,
      ticketType: isMember ? 'member' : 'guest',
      quantity: 1,
      guestCount,
      isMember,
      eventType: event.eventType,
      status: 'confirmed',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    // Increment event attendee count
    await db.collection('portalEvents').doc(eventId).update({
      attendeeCount: FieldValue.increment(totalAttendees),
    })

    return NextResponse.json({
      success: true,
      message: 'Successfully registered for event',
    })
  } catch (error: any) {
    console.error('Error creating RSVP:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to register for event' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Get current user
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json(
        { error: 'Missing required parameter: eventId' },
        { status: 400 }
      )
    }

    const db = getFirebaseAdminDb()

    // Find user's registration
    const registrationQuery = await db
      .collection('eventRegistrations')
      .where('eventId', '==', eventId)
      .where('userId', '==', user.uid)
      .limit(1)
      .get()

    if (registrationQuery.empty) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      )
    }

    const registrationDoc = registrationQuery.docs[0]
    const registration = registrationDoc.data()

    // Delete registration
    await registrationDoc.ref.delete()

    // Decrement event attendee count
    const totalAttendees = (registration.quantity || 1) + (registration.guestCount || 0)
    await db.collection('portalEvents').doc(eventId).update({
      attendeeCount: FieldValue.increment(-totalAttendees),
    })

    return NextResponse.json({
      success: true,
      message: 'Successfully cancelled registration',
    })
  } catch (error: any) {
    console.error('Error cancelling RSVP:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to cancel registration' },
      { status: 500 }
    )
  }
}
