/**
 * Dual Authentication Middleware
 * Supports both JWT Token and API Key authentication methods
 */

import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, RouteParams } from '../lib/types'
import { validateApiKey } from '../lib/api-key/validator'
import { consumeRateLimit } from '../lib/api-key/rate-limiter'
import { hasPermission } from '../../shared/permissions'
import { unauthorized, forbidden, tooManyRequests } from '../lib/response'
import { verifyJWT } from '../lib/jwt'

export interface DualAuthContext {
  user_id: string
  auth_type: 'jwt' | 'api_key'
  api_key_id?: string
  api_key_permissions?: string[]
}

/**
 * Create dual authentication middleware
 * @param requiredPermission Required permission (only for API Key authentication)
 */
export function requireDualAuth(
  requiredPermission: string
): PagesFunction<Env, RouteParams, DualAuthContext> {
  return async (context) => {
    const request = context.request

    try {
      // 1. Check for API Key
      const apiKey = request.headers.get('X-API-Key')
      
      if (apiKey) {
        // API Key authentication flow
        const validation = await validateApiKey(apiKey, context.env.DB)

        if (!validation.valid || !validation.data || !validation.permissions) {
          return unauthorized({
            code: 'INVALID_API_KEY',
            message: validation.error || 'Invalid API Key',
          })
        }

        const { data: keyData, permissions } = validation

        // Check permissions
        if (!hasPermission(permissions, requiredPermission)) {
          return forbidden({
            code: 'INSUFFICIENT_PERMISSIONS',
            message: `Missing required permission: ${requiredPermission}`,
            required: requiredPermission,
            available: permissions,
          })
        }

        // Rate limiting (D1)
        const rateLimitResult = await consumeRateLimit(keyData.id, context.env.DB)
        if (!rateLimitResult.allowed) {
          const headers: Record<string, string> = {
            'Retry-After': String(rateLimitResult.retryAfter || 0),
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(Math.ceil(rateLimitResult.reset / 1000)),
          }
          return tooManyRequests(
            {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many requests. Please try again later.',
            },
            headers
          )
        }

        // Get request IP
        const ip =
          request.headers.get('CF-Connecting-IP') ||
          request.headers.get('X-Forwarded-For') ||
          null

        // Pass user info to context.data
        context.data.user_id = keyData.user_id
        context.data.auth_type = 'api_key'
        context.data.api_key_id = keyData.id
        context.data.api_key_permissions = permissions

        // Update last used info (async)
        context.waitUntil(
          (async () => {
            try {
              await context.env.DB.prepare(
                `UPDATE api_keys SET last_used_at = datetime('now'), last_used_ip = ? WHERE id = ?`
              )
                .bind(ip, keyData.id)
                .run()
            } catch (error) {
              console.error('Failed to update last_used:', error)
            }
          })()
        )

        return context.next()
      }

      // 2. Check for JWT Token
      const authHeader = request.headers.get('Authorization')
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)

        try {
          const payload = await verifyJWT(token, context.env.JWT_SECRET)

          if (!payload || !payload.sub) {
            return unauthorized({
              code: 'INVALID_TOKEN',
              message: 'Invalid or expired token',
            })
          }

          // Pass user info to context.data
          context.data.user_id = payload.sub
          context.data.auth_type = 'jwt'

          return context.next()
        } catch {
          return unauthorized({
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired token',
          })
        }
      }

      // 3. No authentication provided
      return unauthorized({
        code: 'MISSING_AUTH',
        message: 'Authentication required. Provide either X-API-Key header or Bearer token.',
      })
    } catch (error) {
      console.error('Dual auth middleware error:', error)
      return unauthorized({
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
      })
    }
  }
}

