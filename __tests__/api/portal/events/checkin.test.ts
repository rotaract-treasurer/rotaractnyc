/**
 * Tests for POST /api/portal/events/[id]/checkin
 *
 * Focus: the unified ticket-holder resolution introduced so the QR scanner
 * accepts ANY ticket for the event. A holder id (`m`) that contains '@' is a
 * guest email → write to `guest_rsvps`; otherwise it's a Firebase member UID →
 * write to `rsvps`. Also covers per-ticket numbered codes, already-checked-in,
 * auth, signature, and not-found branches.
 *
 * Firebase admin, the HMAC verifier, and FieldValue are mocked so the tests
 * are deterministic and exercise only the route's branching logic.
 */

const mockVerifyCookie = jest.fn();
const mockGetUser = jest.fn();

const mockEventGet = jest.fn();
const mockEventsDoc = jest.fn().mockReturnValue({ get: mockEventGet });

const mockRsvpGet = jest.fn();
const mockRsvpUpdate = jest.fn().mockResolvedValue(undefined);
const mockRsvpSet = jest.fn().mockResolvedValue(undefined);
const mockRsvpDoc = jest
  .fn()
  .mockReturnValue({ get: mockRsvpGet, update: mockRsvpUpdate, set: mockRsvpSet, id: 'rsvp-id' });

const mockMemberProfileGet = jest.fn();
const mockMembersDoc = jest.fn().mockReturnValue({ get: mockMemberProfileGet });

const mockGuestQueryGet = jest.fn();
const mockGuestRefUpdate = jest.fn().mockResolvedValue(undefined);
const mockGuestNewSet = jest.fn().mockResolvedValue(undefined);
const mockGuestDoc = jest
  .fn()
  .mockReturnValue({ set: mockGuestNewSet, update: mockGuestRefUpdate, id: 'new-guest-id' });
const mockGuestWhere = jest.fn().mockReturnValue({
  where: jest.fn().mockReturnValue({
    limit: jest.fn().mockReturnValue({ get: mockGuestQueryGet }),
  }),
});

const mockCollection = jest.fn().mockImplementation((name: string) => {
  if (name === 'events') return { doc: mockEventsDoc };
  if (name === 'rsvps') return { doc: mockRsvpDoc };
  if (name === 'members') return { doc: mockMembersDoc };
  if (name === 'guest_rsvps') return { doc: mockGuestDoc, where: mockGuestWhere };
  return { doc: jest.fn() };
});

jest.mock('@/lib/firebase/admin', () => ({
  adminAuth: {
    verifySessionCookie: (...args: any[]) => mockVerifyCookie(...args),
    getUser: (...args: any[]) => mockGetUser(...args),
  },
  adminDb: { collection: (...args: any[]) => mockCollection(...args) },
}));

const mockVerifySig = jest.fn();
jest.mock('@/lib/utils/qrcode', () => ({
  verifyCheckInSignature: (...args: any[]) => mockVerifySig(...args),
}));

jest.mock('firebase-admin/firestore', () => ({
  FieldValue: { arrayUnion: (...vals: any[]) => ({ __arrayUnion: vals }) },
}));

jest.mock('next/headers', () => ({ cookies: jest.fn() }));

import { POST } from '@/app/api/portal/events/[id]/checkin/route';
import { cookies } from 'next/headers';

const mockCookies = cookies as unknown as jest.Mock;

function makeRequest(body: Record<string, any>) {
  return new Request('http://localhost/api/portal/events/evt-1/checkin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function ctx(id = 'evt-1') {
  return { params: Promise.resolve({ id }) };
}

describe('POST /api/portal/events/[id]/checkin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyCookie.mockResolvedValue({ uid: 'scanner-board' });
    mockGetUser.mockResolvedValue({ uid: 'member-1' });
    mockCookies.mockResolvedValue({
      get: (name: string) =>
        name === 'rotaract_portal_session' ? { name, value: 'valid-session' } : undefined,
    } as any);
    mockEventGet.mockResolvedValue({ exists: true, data: () => ({ title: 'Spring Gala' }) });
    mockVerifySig.mockReturnValue(true);
    // Default: member has no RSVP doc yet.
    mockRsvpGet.mockResolvedValue({ exists: false, data: () => null });
    mockMemberProfileGet.mockResolvedValue({
      exists: true,
      data: () => ({ displayName: 'Jane Member' }),
    });
    // Default: no matching guest doc.
    mockGuestQueryGet.mockResolvedValue({ empty: true, docs: [] });
  });

  // ── Auth / validation / not-found ──────────────────────────────────────

  it('returns 401 without a session cookie', async () => {
    mockCookies.mockResolvedValue({ get: () => undefined } as any);
    const res = await POST(
      makeRequest({ memberId: 'member-1', timestamp: '1', signature: 'sig' }) as any,
      ctx(),
    );
    expect(res.status).toBe(401);
  });

  it('returns 400 when required params are missing', async () => {
    const res = await POST(makeRequest({ memberId: 'member-1' }) as any, ctx());
    expect(res.status).toBe(400);
  });

  it('returns 403 for an invalid signature', async () => {
    mockVerifySig.mockReturnValue(false);
    const res = await POST(
      makeRequest({ memberId: 'member-1', timestamp: '1', signature: 'bad' }) as any,
      ctx(),
    );
    expect(res.status).toBe(403);
  });

  it('returns 404 when the event does not exist', async () => {
    mockEventGet.mockResolvedValue({ exists: false, data: () => null });
    const res = await POST(
      makeRequest({ memberId: 'member-1', timestamp: '1', signature: 'sig' }) as any,
      ctx(),
    );
    expect(res.status).toBe(404);
  });

  // ── Member tickets ──────────────────────────────────────────────────────

  it('checks in a member and writes to rsvps (never guest_rsvps)', async () => {
    const res = await POST(
      makeRequest({ memberId: 'member-1', timestamp: '1', signature: 'sig' }) as any,
      ctx(),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.member).toEqual({ displayName: 'Jane Member' });
    expect(mockRsvpDoc).toHaveBeenCalledWith('member-1_evt-1');
    expect(mockRsvpSet).toHaveBeenCalledWith(
      expect.objectContaining({ checkedIn: true, memberId: 'member-1', eventId: 'evt-1' }),
    );
    expect(mockGuestDoc).not.toHaveBeenCalled();
  });

  it('reports alreadyCheckedIn for a member already checked in', async () => {
    mockRsvpGet.mockResolvedValue({
      exists: true,
      data: () => ({ checkedIn: true, checkedInAt: '2026-06-01T00:00:00.000Z' }),
    });
    const res = await POST(
      makeRequest({ memberId: 'member-1', timestamp: '1', signature: 'sig' }) as any,
      ctx(),
    );
    const data = await res.json();
    expect(data.alreadyCheckedIn).toBe(true);
    expect(mockRsvpUpdate).not.toHaveBeenCalled();
  });

  it('returns 404 when the member account does not exist', async () => {
    mockGetUser.mockRejectedValue(new Error('no such user'));
    const res = await POST(
      makeRequest({ memberId: 'ghost', timestamp: '1', signature: 'sig' }) as any,
      ctx(),
    );
    expect(res.status).toBe(404);
  });

  it('records a numbered ticket via arrayUnion on an existing member RSVP', async () => {
    mockRsvpGet.mockResolvedValue({ exists: true, data: () => ({ checkedInTickets: [1] }) });
    const res = await POST(
      makeRequest({ memberId: 'member-1', timestamp: '1', signature: 'sig', tk: 2 }) as any,
      ctx(),
    );
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.ticketNumber).toBe(2);
    expect(mockRsvpUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ checkedIn: true, checkedInTickets: { __arrayUnion: [2] } }),
    );
  });

  it('flags a numbered ticket already in checkedInTickets as alreadyCheckedIn', async () => {
    mockRsvpGet.mockResolvedValue({
      exists: true,
      data: () => ({ checkedInTickets: [2], checkedInAt: 'x' }),
    });
    const res = await POST(
      makeRequest({ memberId: 'member-1', timestamp: '1', signature: 'sig', tk: 2 }) as any,
      ctx(),
    );
    const data = await res.json();
    expect(data.alreadyCheckedIn).toBe(true);
    expect(mockRsvpUpdate).not.toHaveBeenCalled();
  });

  // ── Guest tickets (holder id contains '@') ──────────────────────────────

  it('checks in a guest by email, writing to guest_rsvps and skipping getUser/rsvps', async () => {
    mockGuestQueryGet.mockResolvedValue({
      empty: false,
      docs: [{ ref: { update: mockGuestRefUpdate }, data: () => ({ name: 'Guest Gus' }) }],
    });
    const res = await POST(
      makeRequest({ memberId: 'gus@example.com', timestamp: '1', signature: 'sig' }) as any,
      ctx(),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.member).toEqual({ displayName: 'Guest Gus' });
    expect(mockGetUser).not.toHaveBeenCalled();
    expect(mockRsvpDoc).not.toHaveBeenCalled();
    expect(mockGuestRefUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ checkedIn: true }),
    );
  });

  it('creates a guest_rsvps doc when no guest record exists yet', async () => {
    mockGuestQueryGet.mockResolvedValue({ empty: true, docs: [] });
    const res = await POST(
      makeRequest({ memberId: 'new@example.com', timestamp: '1', signature: 'sig' }) as any,
      ctx(),
    );
    expect(res.status).toBe(200);
    expect(mockGuestDoc).toHaveBeenCalled();
    expect(mockGuestNewSet).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'new@example.com',
        checkedIn: true,
        ticketType: 'guest',
      }),
    );
  });

  it('flags an already-scanned guest numbered ticket', async () => {
    mockGuestQueryGet.mockResolvedValue({
      empty: false,
      docs: [
        { ref: { update: mockGuestRefUpdate }, data: () => ({ checkedInTickets: [1], checkedInAt: 'x' }) },
      ],
    });
    const res = await POST(
      makeRequest({ memberId: 'gus@example.com', timestamp: '1', signature: 'sig', tk: 1 }) as any,
      ctx(),
    );
    const data = await res.json();
    expect(data.alreadyCheckedIn).toBe(true);
    expect(mockGuestRefUpdate).not.toHaveBeenCalled();
  });
});
