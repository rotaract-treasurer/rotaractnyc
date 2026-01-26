import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient, isStripeConfigured } from '@/lib/stripe/client';
import { getMemberById } from '@/lib/firebase/members';
import { createPayment } from '@/lib/firebase/payments';

/**
 * POST /api/stripe/checkout
 * Create a Stripe Checkout session for member dues payment
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
    const { memberId, email, successUrl, cancelUrl } = body;

    // Validate input
    if (!memberId || !email || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: memberId, email, successUrl, cancelUrl' },
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

    // Check if already paid
    if (member.dues.paid) {
      return NextResponse.json(
        { error: 'Dues already paid' },
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
            currency: 'usd',
            product_data: {
              name: 'Rotaract NYC Annual Membership Dues',
              description: 'One-year membership to Rotaract NYC',
              images: [], // Add club logo URL if available
            },
            unit_amount: 8500, // $85.00 in cents - Consider using DUES_CONFIG.PROFESSIONAL_AMOUNT_CENTS
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
        email,
        type: 'DUES',
        clubId: 'rotaract-nyc',
      },
      allow_promotion_codes: true, // Allow discount codes
      billing_address_collection: 'auto',
    });

    // Create payment record in Firestore
    await createPayment({
      memberId,
      email,
      stripeSessionId: session.id,
      amount: 8500,
      currency: 'USD',
      type: 'DUES',
      description: 'Annual Membership Dues',
    });

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error('Error creating Stripe checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
