/**
 * Security Middleware
 * Provides security headers, CSP policies, input validation, and other security features
 */

import type { PagesFunction } from '@cloudflare/workers-types'

/**
 * Security Headers Middleware
 */
export const securityHeaders: PagesFunction = async (context) => {
  const response = await context.next()
  
  // Create new response headers
  const newHeaders = new Headers(response.headers)
  
  // Check if this is a snapshot view path (these paths need relaxed CSP)
  const url = new URL(context.request.url)
  const isSnapshotView = url.pathname.includes('/snapshots/') && 
                         (url.pathname.includes('/view') || url.searchParams.has('sig'))
  
  const standardCsp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  // Snapshot view should not execute scripts from captured HTML.
  const snapshotCsp = [
    "default-src 'none'",
    "script-src 'none'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'none'",
    "media-src 'self' data: https:",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ')

  // Security headers configuration
  const securityHeaders = {
    // Prevent clickjacking (except for snapshot views)
    ...(!isSnapshotView && { 'X-Frame-Options': 'DENY' }),
    
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // XSS protection
    'X-XSS-Protection': '1; mode=block',
    
    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions policy
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    
    // Content Security Policy
    'Content-Security-Policy': isSnapshotView ? snapshotCsp : standardCsp,
    
    // HSTS (only in HTTPS environment)
    ...(context.request.url.startsWith('https://') && {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    })
  }
  
  // Add security headers (skip undefined values)
  Object.entries(securityHeaders).forEach(([key, value]) => {
    if (value) {
      newHeaders.set(key, value)
    }
  })
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  })
}

/**
 * CORS Configuration Middleware
 */
export const corsHeaders: PagesFunction = async (context) => {
  // Get allowed origins from environment variables
  const allowedOriginsEnv = (context.env as { CORS_ALLOWED_ORIGINS?: string })?.CORS_ALLOWED_ORIGINS

  const cors = getCorsPolicy(context.request, allowedOriginsEnv)

  // Handle preflight requests
  if (context.request.method === 'OPTIONS') {
    const headers: Record<string, string> = {
      'Access-Control-Allow-Origin': cors.origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
    }

    if (cors.allowCredentials) {
      headers['Access-Control-Allow-Credentials'] = 'true'
    }

    return new Response(null, {
      headers,
    })
  }

  const response = await context.next()
  const newHeaders = new Headers(response.headers)

  // Add CORS headers
  newHeaders.set('Access-Control-Allow-Origin', cors.origin)
  if (cors.allowCredentials) {
    newHeaders.set('Access-Control-Allow-Credentials', 'true')
  } else {
    newHeaders.delete('Access-Control-Allow-Credentials')
  }
  newHeaders.set('Vary', 'Origin')
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  })
}

/**
 * Get allowed origins
 * @param request Request object
 * @param allowedOriginsEnv Allowed origins list from environment variables (comma-separated)
 */
function getCorsPolicy(request: Request, allowedOriginsEnv?: string): { origin: string; allowCredentials: boolean } {
  const origin = request.headers.get('Origin')

  const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
  ]

  const envOrigins = allowedOriginsEnv
    ? allowedOriginsEnv.split(',').map(o => o.trim()).filter(Boolean)
    : []

  const allowedOrigins = [...defaultOrigins, ...envOrigins]

  // Browser extensions must be explicitly listed in CORS_ALLOWED_ORIGINS
  // Example: chrome-extension://abcdef123456,extension://abcdef123456
  if (origin && (origin.startsWith('chrome-extension://') || origin.startsWith('extension://'))) {
    if (allowedOrigins.includes(origin)) {
      return { origin, allowCredentials: true }
    }
    // Development fallback: allow unconfigured extensions only when localhost origins exist
    const hasExtensionWhitelist = allowedOrigins.some(
      o => o.startsWith('chrome-extension://') || o.startsWith('extension://')
    )
    if (!hasExtensionWhitelist && allowedOrigins.some(o => o.includes('localhost'))) {
      return { origin, allowCredentials: true }
    }
    return { origin: 'null', allowCredentials: false }
  }

  if (origin && allowedOrigins.includes(origin)) {
    return { origin, allowCredentials: true }
  }

  if (!origin) {
    return { origin: '*', allowCredentials: false }
  }

  return { origin: 'null', allowCredentials: false }
}

/**
 * Input Validation Middleware
 */
export function validateInput<T>(validator: (data: unknown) => data is T) {
  return async (context: { request: Request; next: () => Promise<Response>; validatedData?: T }) => {
    if (context.request.method === 'POST' || context.request.method === 'PUT' || context.request.method === 'PATCH') {
      try {
        const body = await context.request.json()

        if (!validator(body)) {
          return new Response(
            JSON.stringify({
              error: {
                code: 'INVALID_INPUT',
                message: 'Invalid request body format'
              }
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            }
          )
        }

        // Attach validated data to context
        context.validatedData = body
      } catch {
        return new Response(
          JSON.stringify({
            error: {
              code: 'INVALID_JSON',
              message: 'Invalid JSON format'
            }
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    }

    return context.next()
  }
}

/**
 * Rate Limiting Middleware (IP-based)
 * Note: This function currently serves as a placeholder, actual rate limiting logic is implemented in rate-limit.ts
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function rateLimitByIP(_limit: number, _windowSeconds: number) {
  return async (context: { request: Request; next: () => Promise<Response> }) => {
    // Get IP address for future rate limiting implementation
    // const ip = context.request.headers.get('CF-Connecting-IP') ||
    //            context.request.headers.get('X-Forwarded-For') ||
    //            'unknown'

    // This can be integrated into the existing rate limiting system
    // For now, continue execution
    return context.next()
  }
}

/**
 * Request Logging Middleware
 */
export const requestLogger: PagesFunction = async (context) => {
  const start = Date.now()
  const ip = context.request.headers.get('CF-Connecting-IP') || 'unknown'
  const userAgent = context.request.headers.get('User-Agent') || 'unknown'

  // Remove sensitive query parameters from logged URL
  const logUrl = new URL(context.request.url)
  for (const param of ['sig', 'token', 'api_key', 'key']) {
    if (logUrl.searchParams.has(param)) {
      logUrl.searchParams.set(param, '***')
    }
  }
  const sanitizedUrl = logUrl.toString()

  try {
    const response = await context.next()
    const duration = Date.now() - start

    // Log request
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      method: context.request.method,
      url: sanitizedUrl,
      status: response.status,
      duration,
      ip,
      userAgent: userAgent.substring(0, 100),
    }))

    return response
  } catch (error) {
    const duration = Date.now() - start

    // Log error
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      method: context.request.method,
      url: sanitizedUrl,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
      ip,
      userAgent: userAgent.substring(0, 100),
    }))

    throw error
  }
}

/**
 * Combined Security Middleware
 */
export const securityMiddleware: PagesFunction = async (context) => {
  // Apply security middleware in sequence
  return securityHeaders(context)
}
