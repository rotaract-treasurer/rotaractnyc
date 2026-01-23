import { NextRequest, NextResponse } from 'next/server'
import { getStripeClient } from '@/lib/stripe/client'
import { getFirebaseAdminDb } from '@/lib/firebase/admin'
import { getUserFromRequest } from '@/lib/firebase/auth-helpers'

export async function POST(req: NextRequest) {
  try {
    // Get current user
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { eventId, ticketType, quantity = 1, guestCount = 0 } = body

    if (!eventId || !ticketType) {
      return NextResponse.json(
        { error: 'Missing required fields: eventId, ticketType' },
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

    // Verify event requires payment
    if (event.pricing?.type === 'free' || event.pricing?.type === 'service') {
      return NextResponse.json(
        { error: 'This event does not require payment' },
        { status: 400 }
      )
    }

    // Get user membership status
    const userDoc = await db.collection('portalUsers').doc(user.uid).get()
    const userData = userDoc.data()
    const isMember = userData?.status === 'active'

    // Calculate pricing
    const now = new Date()
    const isEarlyBird = event.pricing.memberEarlyBirdDeadline && 
                        now < event.pricing.memberEarlyBirdDeadline.toDate()

    let unitPrice = 0
    let priceLabel = ''

    if (ticketType === 'member') {
      if (!isMember) {
        return NextResponse.json(
          { error: 'Member pricing is only available to active members' },
          { status: 403 }
        )
      }
      unitPrice = isEarlyBird && event.pricing.memberEarlyBirdPrice 
        ? event.pricing.memberEarlyBirdPrice 
        : event.pricing.memberPrice || 0
      priceLabel = isEarlyBird ? 'Member Early Bird' : 'Member'
    } else if (ticketType === 'guest') {
      unitPrice = isEarlyBird && event.pricing.guestEarlyBirdPrice
        ? event.pricing.guestEarlyBirdPrice
        : event.pricing.guestPrice || 0
      priceLabel = isEarlyBird ? 'Guest Early Bird' : 'Guest'
    }

    const totalAmount = unitPrice * (quantity + guestCount)

    if (totalAmount === 0) {
      return NextResponse.json(
        { error: 'Cannot create checkout for free tickets' },
        { status: 400 }
      )
    }

    // Create Stripe checkout session
    const stripe = getStripeClient()
    
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: event.pricing.currency || 'usd',
            unit_amount: Math.round(unitPrice * 100), // Convert to cents
            product_data: {
              name: event.title,
              description: `${priceLabel} Ticket`,
              images: event.imageUrl ? [event.imageUrl] : undefined,
            },
          },
          quantity: quantity + guestCount,
        },
      ],
      customer_email: user.email,
      client_reference_id: user.uid,
      metadata: {
        eventId,
        userId: user.uid,
        ticketType,
        quantity: quantity.toString(),
        guestCount: guestCount.toString(),
        isMember: isMember.toString(),
        isEarlyBird: isEarlyBird.toString(),
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/events/${eventId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/events/${eventId}?payment=cancelled`,
    })

    // Log the checkout attempt
    await db.collection('eventCheckouts').add({
      eventId,
      userId: user.uid,
      sessionId: session.id,
      ticketType,
      quantity,
      guestCount,
      totalAmount,
      status: 'pending',
      createdAt: new Date(),
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
