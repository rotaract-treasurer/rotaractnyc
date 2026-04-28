import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { rateLimit, getRateLimitKey, rateLimitResponse } from '@/lib/rateLimit';
import { adminDb } from '@/lib/firebase/admin';
import { isValidEmail } from '@/lib/utils/sanitize';
import { sendEmail } from '@/lib/email/send';
import { guestTicketConfirmationEmail } from '@/lib/email/templates';
import { incrementTierSoldCount, tryReserveTierSpot, decrementTierSoldCount } from '@/lib/services/tierTracking';

export const dynamic = 'force-dynamic';

const SITE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  'https://rotaractnyc.org';

export async function POST(request: NextRequest) {
  // Rate limit: 5 checkout attempts per 60s per IP
  const rlKey = getRateLimitKey(request, 'guest-checkout');
  const rl = await rateLimit(rlKey, { max: 5, windowSec: 60 });
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

  try {
    const { eventId, name, email, phone, tierId, embedded = false, quantity: rawQuantity = 1 } = await request.json();
    const quantity = Math.max(1, Math.min(10, parseInt(String(rawQuantity), 10) || 1));

    // Validate required inputs
    if (!eventId || !name || !email) {
      return NextResponse.json(
        { error: 'Event ID, name, and email are required.' },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 },
      );
    }

    // Fetch event from Firestore
    const eventDoc = await adminDb.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    const event = eventDoc.data()!;

    const isPublished =
      typeof event.status === 'string'
        ? event.status === 'published'
        : Boolean(event.published);
    const isPublic =
      typeof event.isPublic === 'boolean'
        ? event.isPublic
        : event.visibility === 'public';

    // Verify event is published and public
    if (!isPublished || !isPublic) {
      return NextResponse.json(
        { error: 'This event is not available for public registration.' },
        { status: 403 },
      );
    }

    // P0 #4: Check event-level capacity before allowing checkout
    if (event.capacity) {
      const [memberRsvpSnap, guestRsvpSnap] = await Promise.all([
        adminDb.collection('rsvps').where('eventId', '==', eventId).where('status', '==', 'going').count().get(),
        adminDb.collection('guest_rsvps').where('eventId', '==', eventId).where('status', '==', 'going').count().get(),
      ]);
      const totalGoing = memberRsvpSnap.data().count + guestRsvpSnap.data().count;
      if (totalGoing >= event.capacity) {
        return NextResponse.json(
          { error: 'This event has reached full capacity. No tickets are available.' },
          { status: 409 },
        );
      }
    }

    // Support current pricing schema (`event.pricing`) plus legacy flat fields.
    const pricing =
      event.pricing ||
      ((event.memberPrice != null || event.guestPrice != null || event.earlyBirdPrice != null)
        ? {
            memberPrice: Number(event.memberPrice || 0),
            guestPrice: Number(event.guestPrice || 0),
            earlyBirdPrice: event.earlyBirdPrice != null ? Number(event.earlyBirdPrice) : undefined,
            earlyBirdDeadline: event.earlyBirdDeadline || undefined,
          }
        : null);

    if (!pricing) {
      return NextResponse.json(
        { error: 'This event is a free RSVP event. No payment is required.' },
        { status: 400 },
      );
    }

    // Determine price: check tiers first, then early bird, then guestPrice
    let priceCents: number;
    let resolvedTierId: string | undefined;
    let tierLabel = 'Guest';
    const now = new Date();

    if (pricing.tiers?.length) {
      // Find the best available tier (non-atomic pre-filter for UX, real
      // reservation happens atomically via tryReserveTierSpot below).
      let tier = tierId
        ? pricing.tiers.find((t: any) => t.id === tierId)
        : undefined;
      if (!tier) {
        tier = pricing.tiers
          .filter((t: any) => {
            if (t.deadline && new Date(t.deadline) < now) return false;
            if (t.capacity != null && (t.soldCount ?? 0) >= t.capacity) return false;
            return true;
          })
          .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0];
      }
      if (!tier) {
        return NextResponse.json({ error: 'All ticket tiers are sold out or expired.' }, { status: 409 });
      }
      if (tier.deadline && new Date(tier.deadline) < now) {
        return NextResponse.json({ error: `The "${tier.label}" tier has expired.` }, { status: 409 });
      }

      // 🔒 Atomic reservation — prevents oversell race condition
      if (tier.capacity != null) {
        const reserved = await tryReserveTierSpot(eventId, tier.id);
        if (!reserved) {
          return NextResponse.json(
            { error: `The "${tier.label}" tier sold out while you were checking out.` },
            { status: 409 },
          );
        }
      }

      priceCents = tier.guestPrice;
      tierLabel = tier.label;
      resolvedTierId = tier.id;
    } else if (
      pricing.earlyBirdPrice != null &&
      pricing.earlyBirdDeadline &&
      now < new Date(pricing.earlyBirdDeadline)
    ) {
      priceCents = Number(pricing.earlyBirdPrice);
    } else {
      priceCents = Number(pricing.guestPrice || 0);
    }

    // Free event: create RSVP directly
    if (priceCents === 0) {
      // For free events without tier capacity, atomically reserve the spot.
      // If the tier has no capacity set, skip (unlimited).
      if (resolvedTierId && pricing.tiers?.find((t: any) => t.id === resolvedTierId)?.capacity == null) {
        // No capacity set — skip atomic reservation, just track sold count
      }

      await adminDb.collection('guest_rsvps').add({
        eventId,
        name,
        email: email.toLowerCase(),
        phone: phone || null,
        status: 'going',
        ticketType: 'guest',
        tierId: resolvedTierId || null,
        paidAmount: 0,
        paymentStatus: 'free',
        createdAt: new Date().toISOString(),
      });

      // Track tier capacity (for free tiers without atomic reservation)
      if (resolvedTierId && !pricing.tiers?.find((t: any) => t.id === resolvedTierId)?.capacity) {
        await incrementTierSoldCount(eventId, resolvedTierId);
      }

      // Send confirmation email for free ticket
      try {
        const emailContent = guestTicketConfirmationEmail(name, {
          title: event.title || 'Event',
          date: event.date || '',
          time: event.time || '',
          location: event.location || '',
          slug: event.slug || eventId,
        }, 0);

        await sendEmail({
          to: email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });
      } catch (emailErr) {
        console.error('Failed to send guest confirmation email:', emailErr);
      }

      return NextResponse.json({ free: true });
    }

    // Create Stripe checkout session for paid event
    const stripe = getStripe();

    const lineItems = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${event.title} — ${tierLabel} Ticket`,
          },
          unit_amount: priceCents,
        },
        quantity,
      },
    ];

    // If the Stripe session creation fails, release the reserved spot
    let spotReserved = resolvedTierId != null;

    const metadata = {
      type: 'guest_event_ticket',
      eventId,
      guestName: name,
      guestEmail: email,
      guestPhone: phone || '',
      ticketType: 'guest',
      tierId: resolvedTierId || '',
      quantity: String(quantity),
      amountCents: String(priceCents * quantity),
    };

    try {
      if (embedded) {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: priceCents * quantity,
          currency: 'usd',
          receipt_email: email,
          metadata,
        });
        return NextResponse.json({ clientSecret: paymentIntent.client_secret });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: email,
        line_items: lineItems,
        success_url: `${SITE_URL}/events/${event.slug || eventId}?rsvp=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${SITE_URL}/events/${event.slug || eventId}?rsvp=cancelled`,
        metadata,
      });

      return NextResponse.json({ url: session.url });
    } catch (stripeError: any) {
      // Release the reserved spot if Stripe session creation fails
      if (spotReserved && resolvedTierId) {
        await decrementTierSoldCount(eventId, resolvedTierId).catch(() => {});
      }
      throw stripeError;
    }
  } catch (error: any) {
    console.error('Guest event checkout error:', error);
    return NextResponse.json(
      { error: 'Payment processing failed. Please try again later.' },
      { status: 500 },
    );
  }
}
