/**
 * Tests for GET /api/cron/weekly-event-digest
 *
 * Focus: route auth + happy-path orchestration. Service-level deltas have
 * their own unit test.
 */

const mockRunDigest = jest.fn();

jest.mock('@/lib/services/weeklyEventDigest', () => ({
  runWeeklyEventDigest: (...args: any[]) => mockRunDigest(...args),
}));

jest.mock('@/lib/firebase/admin', () => {
  const adminDb: any = {
    collection: jest.fn(() => ({ add: jest.fn() })),
  };
  return { adminDb, adminAuth: {} };
});

import { GET } from '@/app/api/cron/weekly-event-digest/route';

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/cron/weekly-event-digest', { headers });
}

describe('GET /api/cron/weekly-event-digest', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...ORIGINAL_ENV, CRON_SECRET: 'cron-test-secret' };
    mockRunDigest.mockResolvedValue({
      recipients: 3,
      sent: 3,
      failed: 0,
      upcomingEvents: 2,
      pastEvents: 1,
      pdfsRendered: 2,
      skipped: [],
    });
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('returns 401 without an Authorization header', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it('returns 401 with the wrong secret', async () => {
    const res = await GET(makeRequest({ authorization: 'Bearer wrong-secret' }));
    expect(res.status).toBe(401);
    expect(mockRunDigest).not.toHaveBeenCalled();
  });

  it('runs the digest and returns the result on valid auth', async () => {
    const res = await GET(
      makeRequest({ authorization: 'Bearer cron-test-secret' }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      recipients: 3,
      sent: 3,
      upcomingEvents: 2,
      pastEvents: 1,
      pdfsRendered: 2,
    });
    expect(mockRunDigest).toHaveBeenCalledTimes(1);
  });

  it('returns 500 if the service throws', async () => {
    mockRunDigest.mockRejectedValueOnce(new Error('boom'));
    const res = await GET(
      makeRequest({ authorization: 'Bearer cron-test-secret' }),
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/internal/i);
  });
});
