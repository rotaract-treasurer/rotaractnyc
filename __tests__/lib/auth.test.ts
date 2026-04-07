/**
 * Tests for auth flow — JWT token validation
 *
 * Exercises the JWT validation logic embedded in the Next.js middleware
 * by constructing tokens with specific properties and verifying the
 * middleware correctly rejects or accepts them.
 *
 * Also covers auth-adjacent helpers (getRateLimitKey) and session cookie
 * configuration.
 */

// Prevent the rateLimit module's cleanup setInterval from leaking.
// doNotFake: ['Date'] keeps Date.now() real so JWT expiry math is unaffected.
jest.useFakeTimers({ doNotFake: ['Date'] });

import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';
import { getRateLimitKey } from '@/lib/rateLimit';

// ─── Constants ──────────────────────────────────────────────────────────────

const PROJECT_ID = 'test-project-id';
const COOKIE_NAME = 'rotaract_portal_session';
const PORTAL_PATH = '/portal/dashboard';
const BASE_URL = 'http://localhost:3000';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Base64-encode a JSON object (standard base64, which Node's Buffer accepts). */
function base64Encode(obj: object): string {
  return Buffer.from(JSON.stringify(obj)).toString('base64');
}

/**
 * Build a JWT string with configurable header and payload.
 * Defaults produce a valid-looking Firebase ID token.
 */
function buildJwt(
  headerOverrides: Record<string, any> = {},
  payloadOverrides: Record<string, any> = {},
): string {
  const header = { alg: 'RS256', typ: 'JWT', ...headerOverrides };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: `https://securetoken.google.com/${PROJECT_ID}`,
    iat: now,
    exp: now + 3600, // 1 hour from now
    sub: 'user-123',
    aud: PROJECT_ID,
    ...payloadOverrides,
  };
  return `${base64Encode(header)}.${base64Encode(payload)}.fake-signature-segment`;
}

/** Create a NextRequest aimed at `path`, optionally carrying a session cookie. */
function makeRequest(path: string, sessionCookie?: string): NextRequest {
  const url = new URL(path, BASE_URL);
  const headers: Record<string, string> = {};
  if (sessionCookie !== undefined) {
    headers.cookie = `${COOKIE_NAME}=${sessionCookie}`;
  }
  return new NextRequest(url, { headers });
}

/** Assert the response is a redirect to /portal/login. */
function expectRedirectToLogin(res: Response) {
  expect(res.status).toBe(307);
  const location = res.headers.get('location') || '';
  expect(location).toContain('/portal/login');
}

/** Assert the response deletes the session cookie. */
function expectCookieDeleted(res: Response) {
  const setCookie = res.headers.get('set-cookie') || '';
  expect(setCookie).toContain(COOKIE_NAME);
}

// ─── Environment setup ──────────────────────────────────────────────────────

beforeAll(() => {
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = PROJECT_ID;
});

afterAll(() => {
  delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  jest.clearAllTimers();
  jest.useRealTimers();
});

// ─── JWT validation tests ───────────────────────────────────────────────────

describe('Middleware JWT validation', () => {
  it('rejects requests with no session cookie', () => {
    const req = makeRequest(PORTAL_PATH);
    const res = middleware(req);

    expectRedirectToLogin(res);
    // No cookie to delete when none was sent
    const setCookie = res.headers.get('set-cookie') || '';
    expect(setCookie).not.toContain(COOKIE_NAME);
  });

  it('rejects empty session cookie value', () => {
    const req = makeRequest(PORTAL_PATH, '');
    const res = middleware(req);

    expectRedirectToLogin(res);
  });

  it('rejects malformed JWT — single segment (not 3 parts)', () => {
    const req = makeRequest(PORTAL_PATH, 'not-a-jwt');
    const res = middleware(req);

    expectRedirectToLogin(res);
    expectCookieDeleted(res);
  });

  it('rejects malformed JWT — two segments only', () => {
    const req = makeRequest(PORTAL_PATH, 'part1.part2');
    const res = middleware(req);

    expectRedirectToLogin(res);
    expectCookieDeleted(res);
  });

  it('rejects malformed JWT — four segments', () => {
    const req = makeRequest(PORTAL_PATH, 'a.b.c.d');
    const res = middleware(req);

    expectRedirectToLogin(res);
    expectCookieDeleted(res);
  });

  it('rejects JWT with non-JSON base64 header', () => {
    // Three dot-separated parts but the header isn't valid JSON
    const badHeader = Buffer.from('this is not json').toString('base64');
    const token = `${badHeader}.${base64Encode({ sub: 'x' })}.sig`;
    const req = makeRequest(PORTAL_PATH, token);
    const res = middleware(req);

    expectRedirectToLogin(res);
    expectCookieDeleted(res);
  });

  it('rejects JWT with wrong algorithm (HS256)', () => {
    const token = buildJwt({ alg: 'HS256' });
    const req = makeRequest(PORTAL_PATH, token);
    const res = middleware(req);

    expectRedirectToLogin(res);
    expectCookieDeleted(res);
  });

  it('rejects JWT with wrong algorithm (none)', () => {
    const token = buildJwt({ alg: 'none' });
    const req = makeRequest(PORTAL_PATH, token);
    const res = middleware(req);

    expectRedirectToLogin(res);
    expectCookieDeleted(res);
  });

  it('rejects JWT with wrong issuer', () => {
    const token = buildJwt({}, { iss: 'https://evil.example.com/wrong-project' });
    const req = makeRequest(PORTAL_PATH, token);
    const res = middleware(req);

    expectRedirectToLogin(res);
    expectCookieDeleted(res);
  });

  it('rejects JWT with issuer for a different Firebase project', () => {
    const token = buildJwt({}, {
      iss: 'https://securetoken.google.com/some-other-project',
    });
    const req = makeRequest(PORTAL_PATH, token);
    const res = middleware(req);

    expectRedirectToLogin(res);
    expectCookieDeleted(res);
  });

  it('rejects expired JWT', () => {
    const now = Math.floor(Date.now() / 1000);
    const token = buildJwt({}, {
      exp: now - 3600,   // expired 1 hour ago
      iat: now - 7200,   // issued 2 hours ago
    });
    const req = makeRequest(PORTAL_PATH, token);
    const res = middleware(req);

    expectRedirectToLogin(res);
    expectCookieDeleted(res);
  });

  it('rejects JWT that just expired (exp = now - 1)', () => {
    const now = Math.floor(Date.now() / 1000);
    const token = buildJwt({}, {
      exp: now - 1,
      iat: now - 60,
    });
    const req = makeRequest(PORTAL_PATH, token);
    const res = middleware(req);

    expectRedirectToLogin(res);
    expectCookieDeleted(res);
  });

  it('rejects JWT older than 14 days', () => {
    const now = Math.floor(Date.now() / 1000);
    const fifteenDaysAgo = now - 15 * 24 * 60 * 60;
    const token = buildJwt({}, {
      iat: fifteenDaysAgo,
      exp: now + 3600,  // not expired, but too old
    });
    const req = makeRequest(PORTAL_PATH, token);
    const res = middleware(req);

    expectRedirectToLogin(res);
    expectCookieDeleted(res);
  });

  it('allows valid JWT structure to pass through', () => {
    const token = buildJwt();
    const req = makeRequest(PORTAL_PATH, token);
    const res = middleware(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  it('allows JWT issued just under 14 days ago (boundary)', () => {
    const now = Math.floor(Date.now() / 1000);
    // 14 days minus a 10-second buffer to avoid real-clock drift between
    // JWT creation and middleware evaluation.
    const justUnderFourteenDays = now - (14 * 24 * 60 * 60) + 10;
    const token = buildJwt({}, {
      iat: justUnderFourteenDays,
      exp: now + 3600,
    });
    const req = makeRequest(PORTAL_PATH, token);
    const res = middleware(req);

    // (now - iat) is slightly less than 14 days → should pass
    expect(res.status).toBe(200);
  });

  it('allows JWT with far-future expiry (still within 14-day iat window)', () => {
    const now = Math.floor(Date.now() / 1000);
    const token = buildJwt({}, {
      iat: now,
      exp: now + 7 * 24 * 3600, // expires in 7 days
    });
    const req = makeRequest(PORTAL_PATH, token);
    const res = middleware(req);

    expect(res.status).toBe(200);
  });

  it('skips issuer check when NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set', () => {
    const savedProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    try {
      // Token with a random issuer should pass when no project ID is configured
      const token = buildJwt({}, {
        iss: 'https://securetoken.google.com/any-project',
      });
      const req = makeRequest(PORTAL_PATH, token);
      const res = middleware(req);

      expect(res.status).toBe(200);
    } finally {
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = savedProjectId;
    }
  });
});

// ─── Redirect URL tests ─────────────────────────────────────────────────────

describe('Redirect URL structure', () => {
  it('includes the original path as a redirect search param', () => {
    const req = makeRequest('/portal/events/123');
    const res = middleware(req);

    const location = new URL(res.headers.get('location')!, BASE_URL);
    expect(location.pathname).toBe('/portal/login');
    expect(location.searchParams.get('redirect')).toBe('/portal/events/123');
  });

  it('includes /portal/dashboard as redirect when accessing /portal/dashboard', () => {
    const req = makeRequest(PORTAL_PATH);
    const res = middleware(req);

    const location = new URL(res.headers.get('location')!, BASE_URL);
    expect(location.searchParams.get('redirect')).toBe('/portal/dashboard');
  });

  it('includes /portal/settings as redirect for nested paths', () => {
    const req = makeRequest('/portal/settings');
    const res = middleware(req);

    const location = new URL(res.headers.get('location')!, BASE_URL);
    expect(location.searchParams.get('redirect')).toBe('/portal/settings');
  });
});

// ─── Session cookie configuration ───────────────────────────────────────────

describe('Session cookie configuration', () => {
  it('reads from the "rotaract_portal_session" cookie specifically', () => {
    // A request with a different cookie name should be treated as unauthenticated
    const url = new URL(PORTAL_PATH, BASE_URL);
    const req = new NextRequest(url, {
      headers: { cookie: 'wrong_cookie_name=' + buildJwt() },
    });
    const res = middleware(req);

    expectRedirectToLogin(res);
  });

  it('ignores other cookies when session cookie is missing', () => {
    const url = new URL(PORTAL_PATH, BASE_URL);
    const req = new NextRequest(url, {
      headers: { cookie: 'theme=dark; lang=en' },
    });
    const res = middleware(req);

    expectRedirectToLogin(res);
  });

  it('reads session cookie correctly among multiple cookies', () => {
    const token = buildJwt();
    const url = new URL(PORTAL_PATH, BASE_URL);
    const req = new NextRequest(url, {
      headers: {
        cookie: `theme=dark; ${COOKIE_NAME}=${token}; lang=en`,
      },
    });
    const res = middleware(req);

    expect(res.status).toBe(200);
  });
});

// ─── Auth-adjacent: getRateLimitKey ─────────────────────────────────────────

describe('getRateLimitKey (auth-adjacent)', () => {
  it('extracts the first IP from x-forwarded-for header', () => {
    const request = new Request('https://example.com', {
      headers: { 'x-forwarded-for': '203.0.113.50, 70.41.3.18' },
    });
    expect(getRateLimitKey(request)).toBe('api:203.0.113.50');
  });

  it('returns "unknown" when no forwarding header is present', () => {
    const request = new Request('https://example.com');
    expect(getRateLimitKey(request)).toBe('api:unknown');
  });

  it('accepts a custom prefix for scoped rate limiting', () => {
    const request = new Request('https://example.com', {
      headers: { 'x-forwarded-for': '10.0.0.1' },
    });
    expect(getRateLimitKey(request, 'auth')).toBe('auth:10.0.0.1');
  });
});
