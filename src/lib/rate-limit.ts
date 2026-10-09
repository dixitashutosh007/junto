import { NextRequest } from 'next/server';

/**
 * Fixed-window in-memory rate limiter.
 *
 * Counts are per server instance, so on serverless hosting this is a
 * best-effort brake rather than a hard limit. Firebase also rate-limits SMS
 * sends; see docs/PRODUCTION_ROADMAP.md (task 2.5) for a shared store.
 */

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

// Expired windows are pruned once the table grows past this size
const MAX_TRACKED_KEYS = 10_000;

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  if (windows.size > MAX_TRACKED_KEYS) {
    for (const [k, w] of windows) if (w.resetAt <= now) windows.delete(k);
  }
  const existing = windows.get(key);

  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

export function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

/** Test-only: clears all counters */
export function resetRateLimits(): void {
  windows.clear();
}
