import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env } from '../../../lib/types'
import { badRequest, created, conflict, internalError } from '../../../lib/response'
import { isValidUsername, isValidPassword, isValidEmail, sanitizeString } from '../../../lib/validation'
import { hashPassword, generateUUID } from '../../../lib/crypto'

interface RegisterRequest {
  username: string
  password: string
  email?: string
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB

    // 简单的注册速率限制：每�?IP 每小时最�?5 �?
    const clientIP = context.request.headers.get('CF-Connecting-IP') || 'unknown'

    // 先记录本次注册尝试（无论成败都计入速率限制�?
    try {
      await db.prepare(
        `INSERT INTO audit_logs (user_id, event_type, ip, payload, created_at)
         VALUES ('system', 'register_attempt', ?, ?, datetime('now'))`
      ).bind(clientIP, JSON.stringify({ ip: clientIP })).run()
    } catch {
      // 审计日志插入失败不影响注册流�?
    }

    const rateCheck = await db.prepare(
      `SELECT COUNT(*) as cnt FROM audit_logs
       WHERE event_type = 'register_attempt'
       AND ip = ?
       AND created_at > datetime('now', '-1 hour')`
    ).bind(clientIP).first<{ cnt: number }>()
    
    if (rateCheck && rateCheck.cnt >= 5) {
      return new Response(JSON.stringify({ code: 'RATE_LIMITED', message: 'Too many registration attempts' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '3600' }
      })
    }

    // 检查是否允许注�?
    if (context.env.ALLOW_REGISTRATION !== 'true') {
      return badRequest('Registration is currently disabled')
    }

    const body = await context.request.json() as RegisterRequest

    // 验证输入
    if (!body.username || !body.password) {
      return badRequest('Username and password are required')
    }

    if (!isValidUsername(body.username)) {
      return badRequest('Username must be 3-20 characters and contain only letters, numbers, and underscores')
    }

    if (!isValidPassword(body.password)) {
      return badRequest('Password must be at least 8 characters')
    }

    if (body.email && !isValidEmail(body.email)) {
      return badRequest('Invalid email format')
    }

    const username = sanitizeString(body.username, 20)
    const email = body.email ? sanitizeString(body.email, 255) : null

    // 检查用户名是否已存�?
    const existingUser = await db.prepare(
      'SELECT id FROM users WHERE LOWER(username) = LOWER(?)'
    )
      .bind(username)
      .first()

    if (existingUser) {
      return conflict('Username already exists')
    }

    // 检查邮箱是否已存在
    if (email) {
      const existingEmail = await db.prepare(
        'SELECT id FROM users WHERE LOWER(email) = LOWER(?)'
      )
        .bind(email)
        .first()

      if (existingEmail) {
        return conflict('Email already exists')
      }
    }

    // 哈希密码
    const passwordHash = await hashPassword(body.password)

    // 生成 UUID
    const userId = generateUUID()

    const now = new Date()
    const nowISO = now.toISOString()
    const ip = context.request.headers.get('CF-Connecting-IP') || 'unknown'
    const userAgent = context.request.headers.get('User-Agent') || 'unknown'

    // 创建用户
    await db.prepare(
      `INSERT INTO users (id, username, email, password_hash, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(userId, username, email, passwordHash, nowISO, nowISO)
      .run()

    // 创建默认偏好设置
    try {
      await db.prepare(
        `INSERT INTO user_preferences (user_id, theme, page_size, view_mode, density, tag_layout, sort_by, updated_at)
         VALUES (?, 'light', 30, 'list', 'normal', 'grid', 'popular', ?)`
      )
        .bind(userId, nowISO)
        .run()
    } catch (error) {
      if (error instanceof Error && (/no such column: tag_layout/i.test(error.message) || /no such column: sort_by/i.test(error.message))) {
        // 尝试不包�?tag_layout �?sort_by
        await db.prepare(
          `INSERT INTO user_preferences (user_id, theme, page_size, view_mode, density, updated_at)
           VALUES (?, 'light', 30, 'list', 'normal', ?)`
        )
          .bind(userId, nowISO)
          .run()
      } else {
        throw error
      }
    }

    // 记录审计日志 (失败不影响注�?
    try {
      await db.prepare(
        `INSERT INTO audit_logs (user_id, event_type, payload, ip, user_agent, created_at)
         VALUES (?, 'user.registered', ?, ?, ?, ?)`
      )
        .bind(
          userId,
          JSON.stringify({ username, email: email || null }),
          ip,
          userAgent,
          nowISO
        )
        .run()
    } catch (auditError) {
      // 审计日志失败不影响注�?只记录错�?
      console.error('Failed to create audit log:', auditError)
    }

    return created({
      user: {
        id: userId,
        username,
        email: email || null,
        created_at: nowISO,
      },
    })
  } catch (error) {
    console.error('Register error:', error)
    return internalError('Registration failed')
  }
}
