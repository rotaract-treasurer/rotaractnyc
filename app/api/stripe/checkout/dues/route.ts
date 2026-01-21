import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient, isStripeConfigured } from '@/lib/stripe/client';
import { getMemberById } from '@/lib/firebase/members';
import { getDuesCycle, getMemberDues, createDuesPayment } from '@/lib/firebase/duesCycles';

/**
 * POST /api/stripe/checkout/dues
 * Create a Stripe Checkout session for annual dues payment
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { memberId, cycleId, email, successUrl, cancelUrl } = body;

    // Validate input
    if (!memberId || !cycleId || !email || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: memberId, cycleId, email, successUrl, cancelUrl' },
        { status: 400 }
      );
    }

    // Get member to verify they exist
    const member = await getMemberById(memberId);
    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Get dues cycle
    const cycle = await getDuesCycle(cycleId);
    if (!cycle) {
      return NextResponse.json(
        { error: 'Dues cycle not found' },
        { status: 404 }
      );
    }

    // Check if already paid for this cycle
    const memberDues = await getMemberDues(memberId, cycleId);
    if (memberDues && (memberDues.status === 'PAID' || memberDues.status === 'PAID_OFFLINE' || memberDues.status === 'WAIVED')) {
      return NextResponse.json(
        { error: `Dues already ${memberDues.status.toLowerCase()} for ${cycle.label}` },
        { status: 400 }
      );
    }

    const stripe = getStripeClient();

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: cycle.currency.toLowerCase(),
            product_data: {
              name: `${cycle.label} Annual Membership Dues`,
              description: `Rotaract NYC dues for ${cycle.label}`,
              images: [], // Add club logo URL if available
            },
            unit_amount: cycle.amount, // Amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: email,
      metadata: {
        memberId,
        cycleId,
        email,
        type: 'ANNUAL_DUES',
        clubId: 'rotaract-nyc',
      },
      allow_promotion_codes: true, // Allow discount codes
      billing_address_collection: 'auto',
    });

    // Create payment record in Firestore
    await createDuesPayment({
      memberId,
      cycleId,
      email,
      stripeSessionId: session.id,
      amount: cycle.amount,
      currency: cycle.currency,
      description: `${cycle.label} Annual Dues`,
    });

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error('Error creating Stripe checkout session for dues:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
