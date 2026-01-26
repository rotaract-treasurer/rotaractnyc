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
    const { memberId, cycleId, email, memberType, successUrl, cancelUrl } = body;

    // Validate input
    if (!memberId || !cycleId || !email || !memberType || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: memberId, cycleId, email, memberType, successUrl, cancelUrl' },
        { status: 400 }
      );
    }

    // Validate member type and get amount
    // TODO: Consider centralizing to lib/config/dues.ts for single source of truth
    const DUES_AMOUNTS: { [key: string]: number } = {
      professional: 8500, // $85.00 in cents
      student: 6500, // $65.00 in cents
    };

    if (!DUES_AMOUNTS[memberType]) {
      return NextResponse.json(
        { error: 'Invalid member type. Must be "professional" or "student"' },
        { status: 400 }
      );
    }

    const duesAmount = DUES_AMOUNTS[memberType];
    const memberTypeLabel = memberType === 'professional' ? 'Professional' : 'Student';

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

    // Calculate Stripe processing fee to pass to customer
    // Stripe fee structure: 2.9% + $0.30 for US cards
    const stripeFeePercentage = 0.029; // 2.9%
    const stripeFeeFixed = 30; // $0.30 in cents
    
    // Calculate the fee on the dues amount
    const processingFee = Math.round(duesAmount * stripeFeePercentage + stripeFeeFixed);
    
    // Create Stripe Checkout Session with dues + processing fee
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: cycle.currency.toLowerCase(),
            product_data: {
              name: `${cycle.label} Annual Membership Dues (${memberTypeLabel})`,
              description: `Rotaract NYC ${memberTypeLabel.toLowerCase()} dues for ${cycle.label}`,
            },
            unit_amount: duesAmount, // Dues amount in cents
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: cycle.currency.toLowerCase(),
            product_data: {
              name: 'Payment Processing Fee',
              description: 'Credit card processing fee (2.9% + $0.30)',
            },
            unit_amount: processingFee, // Processing fee in cents
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
        memberType,
        duesAmount: duesAmount.toString(),
        processingFee: processingFee.toString(),
        type: 'ANNUAL_DUES',
        clubId: 'rotaract-nyc',
      },
      allow_promotion_codes: false, // Disable promo codes when passing fees
      billing_address_collection: 'auto',
      payment_intent_data: {
        metadata: {
          memberId,
          cycleId,
          memberType,
          duesAmount: duesAmount.toString(),
          processingFee: processingFee.toString(),
        },
      },
    });

    // Create payment record in Firestore
    await createDuesPayment({
      memberId,
      cycleId,
      email,
      stripeSessionId: session.id,
      amount: duesAmount,
      currency: cycle.currency,
      description: `${cycle.label} ${memberTypeLabel} Annual Dues`,
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
