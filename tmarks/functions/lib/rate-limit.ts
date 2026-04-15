import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env } from './types'

type RateLimiterContext = Parameters<PagesFunction<Env>>[0]

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  retryAfter?: number
}

let ensureTablePromise: Promise<void> | null = null

async function ensureTable(db: D1Database): Promise<void> {
  if (ensureTablePromise) return ensureTablePromise

  ensureTablePromise = db
    .prepare(
      `CREATE TABLE IF NOT EXISTS rate_limits (
        key TEXT NOT NULL,
        window_seconds INTEGER NOT NULL,
        window_start INTEGER NOT NULL,
        count INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (key, window_seconds, window_start)
      )`
    )
    .run()
    .then(() => undefined)
    .catch(() => undefined)

  return ensureTablePromise
}

function getWindowStart(now: number, windowSeconds: number): number {
  const windowMs = windowSeconds * 1000
  return Math.floor(now / windowMs) * windowMs
}

async function checkAndRecord(
  db: D1Database,
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = Date.now()
  const windowStart = getWindowStart(now, windowSeconds)
  const resetAt = windowStart + windowSeconds * 1000

  try {
    await ensureTable(db)

    // Atomic upsert + increment; count is the *new* count after this request.
    const row = await db
      .prepare(
        `INSERT INTO rate_limits (key, window_seconds, window_start, count, updated_at)
         VALUES (?, ?, ?, 1, ?)
         ON CONFLICT(key, window_seconds, window_start)
         DO UPDATE SET count = count + 1, updated_at = excluded.updated_at
         RETURNING count`
      )
      .bind(key, windowSeconds, windowStart, now)
      .first<{ count: number }>()

    const count = Number(row?.count || 0)
    const allowed = count <= limit
    const remaining = Math.max(0, limit - count)

    return {
      allowed,
      remaining,
      resetAt,
      retryAfter: allowed ? undefined : Math.max(0, Math.ceil((resetAt - now) / 1000)),
    }
  } catch {
    // Fail-open to avoid accidental outage.
    return { allowed: true, remaining: limit, resetAt }
  }
}

export function getClientIP(request: Request): string {
  const cfIP = request.headers.get('CF-Connecting-IP')
  if (cfIP) return cfIP

  const xForwardedFor = request.headers.get('X-Forwarded-For')
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim()
  }

  const xRealIP = request.headers.get('X-Real-IP')
  if (xRealIP) return xRealIP

  return 'unknown'
}

export function createRateLimiter(
  getKey: (context: RateLimiterContext) => string,
  limit: number,
  windowSeconds: number
): PagesFunction<Env> {
  return async (context) => {
    const key = getKey(context)
    const result = await checkAndRecord(context.env.DB, key, limit, windowSeconds)

    const headers: Record<string, string> = {
      'X-RateLimit-Limit': String(limit),
      'X-RateLimit-Remaining': String(result.remaining),
      'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
    }

    if (!result.allowed) {
      const retryAfter = result.retryAfter ?? 0
      return new Response(
        JSON.stringify({
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          retry_after: retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfter),
            ...headers,
          },
        }
      )
    }

    const response = await context.next()
    Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v))
    return response
  }
}

export const loginRateLimiter = createRateLimiter(
  (context) => {
    const ip = getClientIP(context.request)
    return `login:${ip}`
  },
  30,
  60
)

export const filterRateLimiter = createRateLimiter(
  (context) => {
    const userId = context.data?.user_id || getClientIP(context.request)
    return `filter:${userId}`
  },
  600,
  60
)

