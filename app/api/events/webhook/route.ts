import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent } from '@/lib/stripe/client'
import { getFirebaseAdminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    // Verify webhook signature
    const event = constructWebhookEvent(body, signature, webhookSecret)

    const db = getFirebaseAdminDb()

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const metadata = session.metadata

        if (!metadata) break

        const { eventId, userId, ticketType, quantity, guestCount, isMember, isEarlyBird } = metadata

        // Update checkout record
        const checkoutsSnapshot = await db
          .collection('eventCheckouts')
          .where('sessionId', '==', session.id)
          .limit(1)
          .get()

        if (!checkoutsSnapshot.empty) {
          const checkoutDoc = checkoutsSnapshot.docs[0]
          await checkoutDoc.ref.update({
            status: 'completed',
            paymentIntentId: session.payment_intent,
            completedAt: FieldValue.serverTimestamp(),
          })
        }

        // Create event registration
        await db.collection('eventRegistrations').add({
          eventId,
          userId,
          ticketType,
          quantity: parseInt(quantity),
          guestCount: parseInt(guestCount),
          isMember: isMember === 'true',
          isEarlyBird: isEarlyBird === 'true',
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent,
          amountPaid: session.amount_total,
          status: 'confirmed',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        })

        // Increment event attendee count
        const eventRef = db.collection('portalEvents').doc(eventId)
        await eventRef.update({
          attendeeCount: FieldValue.increment(parseInt(quantity) + parseInt(guestCount)),
        })

        console.log(`Event registration created for user ${userId} and event ${eventId}`)
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object

        // Update checkout record
        const checkoutsSnapshot = await db
          .collection('eventCheckouts')
          .where('sessionId', '==', session.id)
          .limit(1)
          .get()

        if (!checkoutsSnapshot.empty) {
          const checkoutDoc = checkoutsSnapshot.docs[0]
          await checkoutDoc.ref.update({
            status: 'expired',
            expiredAt: FieldValue.serverTimestamp(),
          })
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 400 }
    )
  }
}
