import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, RouteParams } from '../lib/types'
import { extractJWT, verifyJWT } from '../lib/jwt'
import { unauthorized } from '../lib/response'

export interface AuthContext extends Record<string, unknown> {
  user_id: string
  session_id?: string
}

/**
 * 认证中间�?- 验证 JWT 并提取用户信�?
 */
export const requireAuth: PagesFunction<Env, RouteParams, AuthContext> = async (context) => {
  const token = extractJWT(context.request)

  if (!token) {
    return unauthorized('Missing authorization token')
  }

  try {
    const payload = await verifyJWT(token, context.env.JWT_SECRET)

    // 将用户信息附加到 context.data
    context.data.user_id = payload.sub
    context.data.session_id = payload.session_id

    return context.next()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid token'
    return unauthorized(message)
  }
}

/**
 * 可选认证中间件 - 如果�?token 则验证，没有则继�?
 */
export const optionalAuth: PagesFunction<Env, RouteParams, Partial<AuthContext>> = async (context) => {
  const token = extractJWT(context.request)

  if (token) {
    try {
      const payload = await verifyJWT(token, context.env.JWT_SECRET)
      context.data.user_id = payload.sub
      context.data.session_id = payload.session_id
    } catch {
      // 忽略错误，继续执�?
    }
  }

  return context.next()
}
