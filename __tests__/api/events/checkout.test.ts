const mockCreateSession = jest.fn();
const mockEventGet = jest.fn();

jest.mock('@/lib/stripe/client', () => ({
  getStripe: () => ({
    checkout: {
      sessions: {
        create: mockCreateSession,
      },
    },
  }),
}));

jest.mock('@/lib/rateLimit', () => ({
  rateLimit: jest.fn().mockResolvedValue({ allowed: true, resetAt: Date.now() + 60_000 }),
  getRateLimitKey: jest.fn().mockReturnValue('test-key'),
  rateLimitResponse: (resetAt: number) =>
    new Response(JSON.stringify({ error: 'Too many requests', resetAt }), { status: 429 }),
}));

jest.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: (name: string) => {
      if (name === 'events') {
        return {
          doc: () => ({ get: mockEventGet }),
        };
      }

      return {
        add: jest.fn(),
        doc: jest.fn(),
        where: jest.fn(),
      };
    },
  },
}));

jest.mock('@/lib/email/send', () => ({
  sendEmail: jest.fn(),
}));

jest.mock('@/lib/email/templates', () => ({
  guestTicketConfirmationEmail: jest.fn(),
}));

jest.mock('@/lib/services/tierTracking', () => ({
  incrementTierSoldCount: jest.fn(),
}));

import { POST } from '@/app/api/events/checkout/route';

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/events/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function mockPaidPublicEvent() {
  mockEventGet.mockResolvedValue({
    exists: true,
    data: () => ({
      title: 'Benefit Night',
      date: '2026-06-01',
      time: '7:00 PM',
      location: 'NYC',
      slug: 'benefit-night',
      status: 'published',
      isPublic: true,
      pricing: {
        guestPrice: 2500,
      },
    }),
  });
}

describe('POST /api/events/checkout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://rotaractnyc.org';
    mockCreateSession.mockResolvedValue({
      client_secret: 'cs_secret_embedded',
      url: 'https://checkout.stripe.com/test',
    });
    mockPaidPublicEvent();
  });

  afterAll(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  it('creates an embedded Checkout Session that can return to the event page', async () => {
    const res = await POST(makeRequest({
      eventId: 'evt-123',
      name: 'Guest Person',
      email: 'guest@example.com',
      embedded: true,
    }) as any);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ clientSecret: 'cs_secret_embedded' });

    expect(mockCreateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        ui_mode: 'embedded',
        redirect_on_completion: 'never',
        return_url: 'https://rotaractnyc.org/events/benefit-night?rsvp=success&session_id={CHECKOUT_SESSION_ID}',
      }),
    );
  });

  it('creates a hosted Checkout Session with a verifiable success URL', async () => {
    const res = await POST(makeRequest({
      eventId: 'evt-123',
      name: 'Guest Person',
      email: 'guest@example.com',
      embedded: false,
    }) as any);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ url: 'https://checkout.stripe.com/test' });

    expect(mockCreateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        success_url: 'https://rotaractnyc.org/events/benefit-night?rsvp=success&session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'https://rotaractnyc.org/events/benefit-night?rsvp=cancelled',
      }),
    );
  });
});
