/**
 * API Key Rate Limiter (D1-backed)
 */

import {
  RateLimitWindow,
  RateLimitConfig,
  RateLimitResult,
  DEFAULT_LIMITS
} from './rate-limiter-types';

let ensureTablePromise: Promise<void> | null = null;

async function ensureTable(db: D1Database): Promise<void> {
  if (ensureTablePromise) return ensureTablePromise;

  ensureTablePromise = db
    .prepare(
      `CREATE TABLE IF NOT EXISTS api_key_rate_limits (
        api_key_id TEXT NOT NULL,
        window TEXT NOT NULL,
        window_start INTEGER NOT NULL,
        count INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (api_key_id, window, window_start)
      )`
    )
    .run()
    .then(() => undefined)
    .catch(() => undefined);

  return ensureTablePromise;
}

function getWindowMs(window: RateLimitWindow): number {
  if (window === 'minute') return 60_000;
  if (window === 'hour') return 3_600_000;
  return 86_400_000;
}

function getLimit(limits: RateLimitConfig, window: RateLimitWindow): number {
  if (window === 'minute') return limits.per_minute;
  if (window === 'hour') return limits.per_hour;
  return limits.per_day;
}

function getWindowStart(now: number, windowMs: number): number {
  return Math.floor(now / windowMs) * windowMs;
}

async function maybeCleanup(db: D1Database, now: number): Promise<void> {
  // Use a consistent 1% probability for cleanup
  if (Math.random() < 0.01) {
    const cutoff = now - 7 * 86_400_000;
    await db.prepare(`DELETE FROM api_key_rate_limits WHERE updated_at < ?`).bind(cutoff).run();
  }
}

async function getCounts(
  db: D1Database,
  apiKeyId: string,
  windows: Array<{ window: RateLimitWindow; windowStart: number }>
): Promise<Map<RateLimitWindow, number>> {
  const counts = new Map<RateLimitWindow, number>();
  windows.forEach((w) => counts.set(w.window, 0));

  const minute = windows.find((w) => w.window === 'minute')!;
  const hour = windows.find((w) => w.window === 'hour')!;
  const day = windows.find((w) => w.window === 'day')!;

  const result = await db
    .prepare(
      `SELECT window, count
       FROM api_key_rate_limits
       WHERE api_key_id = ?
         AND (
           (window = 'minute' AND window_start = ?)
           OR (window = 'hour' AND window_start = ?)
           OR (window = 'day' AND window_start = ?)
         )`
    )
    .bind(apiKeyId, minute.windowStart, hour.windowStart, day.windowStart)
    .all<{ window: RateLimitWindow; count: number }>();

  (result.results || []).forEach((row) => {
    counts.set(row.window, Number(row.count) || 0);
  });

  return counts;
}

/**
 * Check rate limit without incrementing counters.
 */
export async function checkRateLimit(
  apiKeyId: string,
  db: D1Database,
  limits: RateLimitConfig = DEFAULT_LIMITS
): Promise<RateLimitResult> {
  const now = Date.now();

  try {
    await ensureTable(db);

    const windows: Array<{ window: RateLimitWindow; windowStart: number }> = (['minute', 'hour', 'day'] as const).map((w) => {
      const windowMs = getWindowMs(w);
      return { window: w, windowStart: getWindowStart(now, windowMs) };
    });

    const counts = await getCounts(db, apiKeyId, windows);

    let minuteAllowedResult: RateLimitResult | null = null;

    for (const w of ['minute', 'hour', 'day'] as const) {
      const limit = getLimit(limits, w);
      const current = counts.get(w) || 0;
      const windowMs = getWindowMs(w);
      const windowStart = windows.find((x) => x.window === w)!.windowStart;
      const reset = windowStart + windowMs;
      const remaining = Math.max(0, limit - current);

      if (current >= limit) {
        return {
          allowed: false,
          window: w,
          limit,
          remaining: 0,
          reset,
          retryAfter: Math.max(0, Math.ceil((reset - now) / 1000)),
        };
      }

      if (w === 'minute') {
        minuteAllowedResult = {
          allowed: true,
          window: w,
          limit,
          remaining,
          reset,
        };
      }
    }

    return (
      minuteAllowedResult || {
        allowed: true,
        window: 'minute',
        limit: limits.per_minute,
        remaining: limits.per_minute,
        reset: now + 60_000,
      }
    );
  } catch {
    // Fail-open to avoid accidental outage.
    return {
      allowed: true,
      window: 'minute',
      limit: limits.per_minute,
      remaining: limits.per_minute,
      reset: now + 60_000,
    };
  }
}

/**
 * Atomically consume one request from all rate-limit windows if allowed.
 */
export async function consumeRateLimit(
  apiKeyId: string,
  db: D1Database,
  limits: RateLimitConfig = DEFAULT_LIMITS
): Promise<RateLimitResult> {
  // 1. Check current limits
  const result = await checkRateLimit(apiKeyId, db, limits);

  // 2. Only increment counters AFTER confirming the request is allowed
  if (result.allowed) {
    try {
      await recordRequest(apiKeyId, db);
      // Return the result with decremented remaining count
      return {
        ...result,
        remaining: Math.max(0, result.remaining - 1),
      };
    } catch {
      // If recording fails, still allow the request (fail-open)
      return result;
    }
  }

  return result;
}

/**
 * Record a request by incrementing all counters.
 */
export async function recordRequest(
  apiKeyId: string,
  db: D1Database
): Promise<void> {
  const now = Date.now();
  await ensureTable(db);

  const windows: RateLimitWindow[] = ['minute', 'hour', 'day'];
  const statements = windows.map((w) => {
    const windowMs = getWindowMs(w);
    const windowStart = getWindowStart(now, windowMs);
    return db
      .prepare(
        `INSERT INTO api_key_rate_limits (api_key_id, window, window_start, count, updated_at)
         VALUES (?, ?, ?, 1, ?)
         ON CONFLICT(api_key_id, window, window_start)
         DO UPDATE SET count = count + 1, updated_at = excluded.updated_at`
      )
      .bind(apiKeyId, w, windowStart, now);
  });

  // D1 batch is best-effort here
  const anyDb = db as unknown as { batch?: (stmts: unknown[]) => Promise<unknown> };
  if (typeof anyDb.batch === 'function') {
    await anyDb.batch(statements);
  } else {
    for (const stmt of statements) {
      await stmt.run();
    }
  }

  // Opportunistic cleanup
  await maybeCleanup(db, now);
}
