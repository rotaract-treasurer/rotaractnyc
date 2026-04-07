/**
 * Rate limiter for API routes.
 *
 * Uses Upstash Redis (@upstash/ratelimit) when UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN are configured, which is the recommended approach
 * for serverless environments (Vercel) where in-memory state doesn't persist
 * across invocations.
 *
 * Falls back to an in-memory Map for local development when Upstash isn't set up.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ── Upstash Redis-backed rate limiter (production) ──────────────────────────

const hasUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

let redis: Redis | null = null;
if (hasUpstash) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

/**
 * Create an Upstash rate limiter with the given window config.
 * Instances are cached by (max, windowSec) to avoid recreating on every request.
 */
const upstashLimiters = new Map<string, Ratelimit>();

function getUpstashLimiter(max: number, windowSec: number): Ratelimit {
  const cacheKey = `${max}:${windowSec}`;
  let limiter = upstashLimiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(max, `${windowSec} s`),
      analytics: false,
      prefix: 'rl',
    });
    upstashLimiters.set(cacheKey, limiter);
  }
  return limiter;
}

// ── In-memory fallback (local dev only) ─────────────────────────────────────

interface MemoryEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, MemoryEntry>();

// Periodically clean up expired in-memory entries
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    memoryStore.forEach((entry, key) => {
      if (entry.resetAt < now) memoryStore.delete(key);
    });
  }, 60_000);
}

function memoryRateLimit(
  key: string,
  max: number,
  windowSec: number,
): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || entry.resetAt < now) {
    const resetAt = now + windowSec * 1000;
    memoryStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: max - 1, resetAt };
  }

  if (entry.count >= max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: max - entry.count, resetAt: entry.resetAt };
}

// ── Public API ──────────────────────────────────────────────────────────────

interface RateLimitOptions {
  /** Max requests per window (default: 10) */
  max?: number;
  /** Window size in seconds (default: 60) */
  windowSec?: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check if a request is allowed under rate limiting.
 *
 * @param key  A unique identifier (e.g., IP address, user ID)
 * @param opts Rate limit options
 */
export async function rateLimit(
  key: string,
  opts: RateLimitOptions = {},
): Promise<RateLimitResult> {
  const { max = 10, windowSec = 60 } = opts;

  if (hasUpstash && redis) {
    const limiter = getUpstashLimiter(max, windowSec);
    const result = await limiter.limit(key);
    return {
      allowed: result.success,
      remaining: result.remaining,
      resetAt: result.reset,
    };
  }

  // Fallback for local dev without Upstash
  if (process.env.NODE_ENV === 'development' && !hasUpstash) {
    return memoryRateLimit(key, max, windowSec);
  }

  // In production without Upstash, warn and allow (fail open, but log)
  if (!hasUpstash) {
    console.warn(
      '[rateLimit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set — rate limiting is disabled. ' +
        'Set these env vars for production.',
    );
  }
  return memoryRateLimit(key, max, windowSec);
}

/**
 * Helper: get a rate-limit key from a Request.
 */
export function getRateLimitKey(request: Request, prefix = 'api'): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
  return `${prefix}:${ip}`;
}

/**
 * Helper: create a 429 response.
 */
export function rateLimitResponse(resetAt: number): Response {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(Math.max(retryAfter, 1)),
      },
    },
  );
}
