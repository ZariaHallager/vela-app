const MAX_REQUESTS = 50;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

interface IpRecord {
  count: number;
  resetAt: number;
}

// Module-level map persists for the lifetime of the server process / edge worker instance.
const ipLimits = new Map<string, IpRecord>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check and increment the rate limit for the given IP address.
 *
 * When RATE_LIMIT_ENABLED is not "true" every call is unconditionally allowed.
 * Otherwise enforces MAX_REQUESTS per WINDOW_MS rolling window per IP.
 */
export function checkRateLimit(ip: string): RateLimitResult {
  if (process.env.RATE_LIMIT_ENABLED !== 'true') {
    return { allowed: true, remaining: MAX_REQUESTS, resetAt: 0 };
  }

  const now = Date.now();
  const record = ipLimits.get(ip);

  if (!record || now >= record.resetAt) {
    // First request in this window (or window has expired).
    ipLimits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt: now + WINDOW_MS };
  }

  if (record.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count += 1;
  return { allowed: true, remaining: MAX_REQUESTS - record.count, resetAt: record.resetAt };
}
