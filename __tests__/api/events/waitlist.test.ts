/**
 * Tests for POST /api/events/waitlist
 *
 * Key behaviours:
 *  - Valid new signup → 201, Firestore add called, confirmation email sent
 *  - Duplicate signup → 200 with "already on waitlist" message (idempotent)
 *  - Missing email → 400
 *  - Invalid email format → 400
 *  - Event not found → 404
 *  - Rate limited → 429
 *  - Email send failure → still returns 201 (fire-and-forget)
 */

const mockSendEmail = jest.fn();
const mockEventGet = jest.fn();
const mockWaitlistAdd = jest.fn();
const mockWaitlistDuplicateQuery = jest.fn();

jest.mock('@/lib/email/send', () => ({
  sendEmail: (...args: any[]) => mockSendEmail(...args),
}));

jest.mock('@/lib/email/templates', () => ({
  waitlistConfirmationEmail: jest.fn().mockReturnValue({
    subject: "You're on the waitlist",
    html: '<p>waitlist</p>',
    text: 'waitlist',
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
        return { doc: () => ({ get: mockEventGet }) };
      }
      if (name === 'event_waitlist') {
        return {
          add: mockWaitlistAdd,
          where: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  get: mockWaitlistDuplicateQuery,
                }),
              }),
            }),
          }),
        };
      }
      return {};
    },
  },
}));

import { POST } from '@/app/api/events/waitlist/route';

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/events/waitlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function mockExistingEvent() {
  mockEventGet.mockResolvedValue({
    exists: true,
    data: () => ({ title: 'Summer Gala', slug: 'summer-gala' }),
  });
}

function mockNoDuplicate() {
  mockWaitlistDuplicateQuery.mockResolvedValue({ empty: true, docs: [] });
}

function mockDuplicate() {
  mockWaitlistDuplicateQuery.mockResolvedValue({ empty: false, docs: [{ id: 'existing' }] });
}

describe('POST /api/events/waitlist', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSendEmail.mockResolvedValue({ success: true });
    mockWaitlistAdd.mockResolvedValue({ id: 'wl-entry-id' });
    mockExistingEvent();
    mockNoDuplicate();
  });

  // ── Validation ────────────────────────────────────────────────────────

  it('returns 400 when eventId is missing', async () => {
    const res = await POST(makeRequest({ email: 'a@b.com' }) as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/event id/i);
  });

  it('returns 400 when email is missing', async () => {
    const res = await POST(makeRequest({ eventId: 'evt-1' }) as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/email/i);
  });

  it('returns 400 for an invalid email address', async () => {
    const res = await POST(makeRequest({ eventId: 'evt-1', email: 'not-an-email' }) as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/valid email/i);
  });

  it('returns 404 when the event does not exist', async () => {
    mockEventGet.mockResolvedValue({ exists: false });
    const res = await POST(makeRequest({ eventId: 'missing', email: 'a@b.com' }) as any);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toMatch(/event not found/i);
  });

  // ── Happy path ────────────────────────────────────────────────────────

  it('returns 201 and writes to Firestore on a valid new signup', async () => {
    const res = await POST(makeRequest({ eventId: 'evt-1', email: 'alice@example.com' }) as any);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.message).toMatch(/waitlist/i);

    expect(mockWaitlistAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: 'evt-1',
        email: 'alice@example.com',
        status: 'waiting',
      }),
    );
  });

  it('lowercases the email before writing to Firestore', async () => {
    await POST(makeRequest({ eventId: 'evt-1', email: 'ALICE@EXAMPLE.COM' }) as any);
    expect(mockWaitlistAdd).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'alice@example.com' }),
    );
  });

  it('sends a waitlist confirmation email after Firestore write', async () => {
    await POST(makeRequest({ eventId: 'evt-1', email: 'alice@example.com' }) as any);
    // Give fire-and-forget a tick to resolve
    await new Promise((r) => setImmediate(r));
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'alice@example.com' }),
    );
  });

  // ── Idempotency ──────────────────────────────────────────────────────

  it('returns 200 with a friendly message when already on waitlist', async () => {
    mockDuplicate();
    const res = await POST(makeRequest({ eventId: 'evt-1', email: 'alice@example.com' }) as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toMatch(/already on the waitlist/i);
    // Should NOT write a new Firestore document
    expect(mockWaitlistAdd).not.toHaveBeenCalled();
    // Should NOT send a duplicate email
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  // ── Resilience ───────────────────────────────────────────────────────

  it('still returns 201 even when the confirmation email fails', async () => {
    mockSendEmail.mockRejectedValue(new Error('SMTP timeout'));
    const res = await POST(makeRequest({ eventId: 'evt-1', email: 'alice@example.com' }) as any);
    // Email is fire-and-forget — should not affect the response
    expect(res.status).toBe(201);
    expect(mockWaitlistAdd).toHaveBeenCalled();
  });
});
