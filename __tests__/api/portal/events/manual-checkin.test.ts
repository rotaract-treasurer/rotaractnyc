/**
 * Tests for POST /api/portal/events/[id]/manual-checkin
 *
 * The staff-driven (door) counterpart to the QR scanner. Gated to board /
 * president / treasurer. Members are toggled on `rsvps/{memberId}_{eventId}`;
 * guests on `guest_rsvps` (by doc id, then email, else created). Passing
 * `checkedIn: false` undoes a check-in. Every check-in records `checkedInBy`
 * and `checkedInMethod: 'manual'` for auditing.
 */

const mockVerifyCookie = jest.fn();

const mockManagerGet = jest.fn();
const mockMembersDoc = jest.fn().mockReturnValue({ get: mockManagerGet });

const mockEventGet = jest.fn();
const mockEventsDoc = jest.fn().mockReturnValue({ get: mockEventGet });

const mockRsvpGet = jest.fn();
const mockRsvpUpdate = jest.fn().mockResolvedValue(undefined);
const mockRsvpSet = jest.fn().mockResolvedValue(undefined);
const mockRsvpDoc = jest
  .fn()
  .mockReturnValue({ get: mockRsvpGet, update: mockRsvpUpdate, set: mockRsvpSet });

const mockGuestCandidateGet = jest.fn();
const mockGuestCandidateUpdate = jest.fn().mockResolvedValue(undefined);
const mockGuestQueryGet = jest.fn();
const mockGuestRefUpdate = jest.fn().mockResolvedValue(undefined);
const mockGuestAdd = jest.fn().mockResolvedValue({ id: 'added-guest' });
const mockGuestDoc = jest
  .fn()
  .mockReturnValue({ get: mockGuestCandidateGet, update: mockGuestCandidateUpdate });
const mockGuestWhere = jest.fn().mockReturnValue({
  where: jest.fn().mockReturnValue({
    limit: jest.fn().mockReturnValue({ get: mockGuestQueryGet }),
  }),
});

const mockCollection = jest.fn().mockImplementation((name: string) => {
  if (name === 'members') return { doc: mockMembersDoc };
  if (name === 'events') return { doc: mockEventsDoc };
  if (name === 'rsvps') return { doc: mockRsvpDoc };
  if (name === 'guest_rsvps') return { doc: mockGuestDoc, where: mockGuestWhere, add: mockGuestAdd };
  return { doc: jest.fn() };
});

jest.mock('@/lib/firebase/admin', () => ({
  adminAuth: { verifySessionCookie: (...args: any[]) => mockVerifyCookie(...args) },
  adminDb: { collection: (...args: any[]) => mockCollection(...args) },
}));

jest.mock('next/headers', () => ({ cookies: jest.fn() }));

import { POST } from '@/app/api/portal/events/[id]/manual-checkin/route';
import { cookies } from 'next/headers';

const mockCookies = cookies as unknown as jest.Mock;

function makeRequest(body: Record<string, any>) {
  return new Request('http://localhost/api/portal/events/evt-1/manual-checkin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function ctx(id = 'evt-1') {
  return { params: Promise.resolve({ id }) };
}

describe('POST /api/portal/events/[id]/manual-checkin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyCookie.mockResolvedValue({ uid: 'board-1' });
    mockCookies.mockResolvedValue({
      get: (name: string) =>
        name === 'rotaract_portal_session' ? { name, value: 'valid' } : undefined,
    } as any);
    mockManagerGet.mockResolvedValue({ exists: true, data: () => ({ role: 'board' }) });
    mockEventGet.mockResolvedValue({ exists: true, data: () => ({ title: 'Gala' }) });
    mockRsvpGet.mockResolvedValue({ exists: true, data: () => ({}) });
    mockGuestCandidateGet.mockResolvedValue({ exists: true });
    mockGuestQueryGet.mockResolvedValue({ empty: true, docs: [] });
  });

  // ── Auth gating ─────────────────────────────────────────────────────────

  it('returns 403 without a session cookie', async () => {
    mockCookies.mockResolvedValue({ get: () => undefined } as any);
    const res = await POST(makeRequest({ kind: 'member', memberId: 'm1' }) as any, ctx());
    expect(res.status).toBe(403);
  });

  it('returns 403 when the caller is not board/president/treasurer', async () => {
    mockManagerGet.mockResolvedValue({ exists: true, data: () => ({ role: 'member' }) });
    const res = await POST(makeRequest({ kind: 'member', memberId: 'm1' }) as any, ctx());
    expect(res.status).toBe(403);
  });

  it('returns 404 when the event does not exist', async () => {
    mockEventGet.mockResolvedValue({ exists: false });
    const res = await POST(makeRequest({ kind: 'member', memberId: 'm1' }) as any, ctx());
    expect(res.status).toBe(404);
  });

  it('returns 400 when a member check-in is missing memberId', async () => {
    const res = await POST(makeRequest({ kind: 'member' }) as any, ctx());
    expect(res.status).toBe(400);
  });

  // ── Member ─────────────────────────────────────────────────────────────

  it('checks in a member on an existing RSVP and records audit fields', async () => {
    const res = await POST(
      makeRequest({ kind: 'member', memberId: 'm1', name: 'Mary' }) as any,
      ctx(),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(mockRsvpDoc).toHaveBeenCalledWith('m1_evt-1');
    expect(mockRsvpUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        checkedIn: true,
        checkedInBy: 'board-1',
        checkedInMethod: 'manual',
      }),
    );
  });

  it('creates an RSVP doc when the member never RSVPd', async () => {
    mockRsvpGet.mockResolvedValue({ exists: false });
    const res = await POST(makeRequest({ kind: 'member', memberId: 'm2' }) as any, ctx());
    expect(res.status).toBe(200);
    expect(mockRsvpSet).toHaveBeenCalledWith(
      expect.objectContaining({
        memberId: 'm2',
        eventId: 'evt-1',
        status: 'going',
        checkedIn: true,
      }),
    );
  });

  it('undoes a check-in when checkedIn=false', async () => {
    const res = await POST(
      makeRequest({ kind: 'member', memberId: 'm1', checkedIn: false }) as any,
      ctx(),
    );
    expect(res.status).toBe(200);
    expect(mockRsvpUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        checkedIn: false,
        checkedInAt: null,
        checkedInBy: null,
        checkedInMethod: null,
      }),
    );
  });

  // ── Guest ──────────────────────────────────────────────────────────────

  it('checks in a guest by rsvpId', async () => {
    mockGuestCandidateGet.mockResolvedValue({ exists: true });
    const res = await POST(makeRequest({ kind: 'guest', rsvpId: 'g-doc-1' }) as any, ctx());
    expect(res.status).toBe(200);
    expect(mockGuestDoc).toHaveBeenCalledWith('g-doc-1');
    expect(mockGuestCandidateUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ checkedIn: true }),
    );
  });

  it('checks in a guest by email lookup when no rsvpId is given', async () => {
    mockGuestQueryGet.mockResolvedValue({
      empty: false,
      docs: [{ ref: { update: mockGuestRefUpdate } }],
    });
    const res = await POST(
      makeRequest({ kind: 'guest', email: 'Gus@Example.com' }) as any,
      ctx(),
    );
    expect(res.status).toBe(200);
    expect(mockGuestRefUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ checkedIn: true }),
    );
  });

  it('creates a guest doc when none can be resolved', async () => {
    mockGuestQueryGet.mockResolvedValue({ empty: true, docs: [] });
    const res = await POST(
      makeRequest({ kind: 'guest', email: 'newguest@example.com', name: 'New Guest' }) as any,
      ctx(),
    );
    expect(res.status).toBe(200);
    expect(mockGuestAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'newguest@example.com',
        name: 'New Guest',
        checkedIn: true,
      }),
    );
  });

  it('returns 400 when a guest check-in has no identifying info', async () => {
    mockGuestQueryGet.mockResolvedValue({ empty: true, docs: [] });
    const res = await POST(makeRequest({ kind: 'guest' }) as any, ctx());
    expect(res.status).toBe(400);
  });
});
