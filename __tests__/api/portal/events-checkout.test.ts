const mockCreateSession = jest.fn();
const mockVerifySessionCookie = jest.fn();
const mockEventGet = jest.fn();

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: mockCreateSession,
      },
    },
  }));
});

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

jest.mock('@/lib/rateLimit', () => ({
  rateLimit: jest.fn().mockResolvedValue({ allowed: true, resetAt: Date.now() + 60_000 }),
  getRateLimitKey: jest.fn().mockReturnValue('test-key'),
  rateLimitResponse: (resetAt: number) =>
    new Response(JSON.stringify({ error: 'Too many requests', resetAt }), { status: 429 }),
}));

jest.mock('@/lib/firebase/admin', () => ({
  adminAuth: {
    verifySessionCookie: (...args: any[]) => mockVerifySessionCookie(...args),
  },
  adminDb: {
    collection: (name: string) => {
      if (name === 'events') {
        return {
          doc: () => ({ get: mockEventGet }),
        };
      }

      return {
        doc: jest.fn(),
        where: jest.fn(),
      };
    },
  },
}));

jest.mock('@/lib/services/tierTracking', () => ({
  incrementTierSoldCount: jest.fn(),
}));

import { POST } from '@/app/api/portal/events/checkout/route';
import { cookies } from 'next/headers';

const mockCookies = cookies as jest.MockedFunction<typeof cookies>;

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/portal/events/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function mockPaidPortalEvent() {
  mockEventGet.mockResolvedValue({
    exists: true,
    data: () => ({
      title: 'Member Benefit Night',
      date: '2026-06-01',
      location: 'NYC',
      pricing: {
        memberPrice: 1500,
        guestPrice: 2500,
      },
    }),
  });
}

describe('POST /api/portal/events/checkout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://rotaractnyc.org';
    mockVerifySessionCookie.mockResolvedValue({ uid: 'member-123' });
    mockCookies.mockResolvedValue({
      get: (name: string) =>
        name === 'rotaract_portal_session'
          ? { name, value: 'valid-session' }
          : undefined,
    } as any);
    mockCreateSession.mockResolvedValue({
      client_secret: 'cs_secret_embedded',
      url: 'https://checkout.stripe.com/test',
    });
    mockPaidPortalEvent();
  });

  afterAll(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  it('creates an embedded Checkout Session that returns to the portal events page', async () => {
    const res = await POST(makeRequest({
      eventId: 'evt-123',
      ticketType: 'member',
      embedded: true,
    }) as any);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ clientSecret: 'cs_secret_embedded' });

    expect(mockCreateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        ui_mode: 'embedded',
        redirect_on_completion: 'never',
      }),
    );
  });

  it('creates a hosted Checkout Session with a verifiable success URL', async () => {
    const res = await POST(makeRequest({
      eventId: 'evt-123',
      ticketType: 'member',
      embedded: false,
    }) as any);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ url: 'https://checkout.stripe.com/test' });

    expect(mockCreateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        success_url: 'https://rotaractnyc.org/portal/events?ticket=success&event=evt-123&session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'https://rotaractnyc.org/portal/events?ticket=cancelled',
      }),
    );
  });
});
