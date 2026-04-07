/**
 * Tests for GET, POST, DELETE /api/portal/events
 *
 * Verifies session-cookie auth, role-based access, input validation,
 * and Firestore interactions for the portal events API.
 */

const mockGet = jest.fn();
const mockOrderBy = jest.fn().mockReturnValue({ limit: jest.fn().mockReturnValue({ get: mockGet }) });
const mockAdd = jest.fn().mockResolvedValue({ id: 'new-event-id' });
const mockDelete = jest.fn().mockResolvedValue(undefined);
const mockDocGet = jest.fn();
const mockDocData = jest.fn();
const mockDocDelete = jest.fn().mockResolvedValue(undefined);
const mockWhereGet = jest.fn().mockResolvedValue({ empty: true });
const mockWhereLimit = jest.fn().mockReturnValue({ get: mockWhereGet });
const mockWhere = jest.fn().mockReturnValue({ limit: mockWhereLimit });
const mockDocRef = jest.fn().mockImplementation(() => ({
  get: mockDocGet,
  delete: mockDocDelete,
}));
const mockCollection = jest.fn().mockImplementation(() => ({
  orderBy: mockOrderBy,
  where: mockWhere,
  doc: mockDocRef,
  add: mockAdd,
}));
const mockVerify = jest.fn();
const mockMemberData = jest.fn().mockReturnValue({ role: 'board', displayName: 'Admin User' });
const mockMemberGet = jest.fn().mockResolvedValue({ exists: true, data: mockMemberData });

jest.mock('@/lib/firebase/admin', () => ({
  adminAuth: { verifySessionCookie: (...args: any[]) => mockVerify(...args) },
  adminDb: {
    collection: (...args: any[]) => {
      const name = args[0];
      if (name === 'members') {
        return {
          doc: () => ({ get: mockMemberGet }),
        };
      }
      return mockCollection(...args);
    },
  },
  serializeDoc: (doc: any) => doc,
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

import { GET, POST, DELETE } from '@/app/api/portal/events/route';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const mockCookies = cookies as jest.MockedFunction<typeof cookies>;

function makeGetRequest(query = '') {
  return new NextRequest(`http://localhost/api/portal/events${query}`, { method: 'GET' });
}

function makePostRequest(body: Record<string, any>) {
  return new NextRequest('http://localhost/api/portal/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest(query = '') {
  return new NextRequest(`http://localhost/api/portal/events${query}`, { method: 'DELETE' });
}

describe('/api/portal/events', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerify.mockResolvedValue({ uid: 'user-123' });
    mockCookies.mockResolvedValue({
      get: (name: string) =>
        name === 'rotaract_portal_session'
          ? { name, value: 'valid-session' }
          : undefined,
    } as any);
    // Default: member is a board member (admin role)
    mockMemberData.mockReturnValue({ role: 'board', displayName: 'Admin User' });
    mockMemberGet.mockResolvedValue({ exists: true, data: mockMemberData });
  });

  // ── GET ──

  describe('GET', () => {
    it('returns 401 when session cookie is missing', async () => {
      mockCookies.mockResolvedValue({
        get: () => undefined,
      } as any);

      const res = await GET(makeGetRequest());
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toMatch(/unauthorized|sign in/i);
    });

    it('returns 403 when member profile does not exist', async () => {
      mockMemberGet.mockResolvedValue({ exists: false });

      const res = await GET(makeGetRequest());
      expect(res.status).toBe(403);
    });

    it('returns list of events for authenticated members', async () => {
      const events = [
        { id: 'evt-1', title: 'Event 1', date: '2026-05-01' },
        { id: 'evt-2', title: 'Event 2', date: '2026-04-15' },
      ];
      mockGet.mockResolvedValue({
        docs: events.map((e) => ({ id: e.id, data: () => e })),
      });

      const res = await GET(makeGetRequest());
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
    });

    it('returns single event by id', async () => {
      mockDocGet.mockResolvedValue({
        exists: true,
        id: 'evt-1',
        data: () => ({ title: 'Specific Event', date: '2026-05-01' }),
      });

      const res = await GET(makeGetRequest('?id=evt-1'));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.title).toBe('Specific Event');
    });

    it('returns 404 for non-existent event id', async () => {
      mockDocGet.mockResolvedValue({ exists: false });

      const res = await GET(makeGetRequest('?id=non-existent'));
      expect(res.status).toBe(404);
    });
  });

  // ── POST ──

  describe('POST', () => {
    it('returns 401 when session cookie is missing', async () => {
      mockCookies.mockResolvedValue({
        get: () => undefined,
      } as any);

      const res = await POST(makePostRequest({ title: 'Test' }));
      expect(res.status).toBe(401);
    });

    it('returns 403 when member is not an admin role', async () => {
      mockMemberData.mockReturnValue({ role: 'member', displayName: 'Regular Member' });

      const res = await POST(makePostRequest({
        title: 'Test Event',
        date: '2026-06-01',
        time: '7:00 PM',
        location: 'UN HQ',
      }));
      expect(res.status).toBe(403);
    });

    it('returns 400 when required fields are missing', async () => {
      const res = await POST(makePostRequest({ title: 'Test' }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/required/i);
    });

    it('creates event with valid data', async () => {
      mockWhereGet.mockResolvedValue({ empty: true }); // no slug collision
      mockAdd.mockResolvedValue({ id: 'new-evt' });

      const res = await POST(makePostRequest({
        title: 'Community Service Day',
        date: '2026-06-15',
        time: '9:00 AM',
        location: 'Central Park',
      }));
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.id).toBeTruthy();
    });
  });

  // ── DELETE ──

  describe('DELETE', () => {
    it('returns 401 when session cookie is missing', async () => {
      mockCookies.mockResolvedValue({
        get: () => undefined,
      } as any);

      const res = await DELETE(makeDeleteRequest('?id=evt-1'));
      expect(res.status).toBe(401);
    });

    it('returns 400 when event id is missing', async () => {
      const res = await DELETE(makeDeleteRequest());
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/required/i);
    });

    it('returns 404 when event does not exist', async () => {
      mockDocGet.mockResolvedValue({ exists: false });

      const res = await DELETE(makeDeleteRequest('?id=non-existent'));
      expect(res.status).toBe(404);
    });
  });
});
