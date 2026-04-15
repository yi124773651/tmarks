/**
 * 修改密码 API
 * 路径: /api/v1/change-password
 * 认证: JWT Token
 */

import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, RouteParams } from '../../lib/types'
import { success, badRequest, unauthorized, internalError } from '../../lib/response'
import { requireAuth, AuthContext } from '../../middleware/auth'
import { hashPassword, verifyPassword } from '../../lib/crypto'

interface ChangePasswordRequest {
  current_password: string
  new_password: string
}

// POST /api/v1/change-password - 修改密码
export const onRequestPost: PagesFunction<Env, RouteParams, AuthContext>[] = [
  requireAuth,
  async (context) => {
    const userId = context.data.user_id

    try {
      const body = (await context.request.json()) as ChangePasswordRequest

      // 验证请求参数
      if (!body.current_password || !body.new_password) {
        return badRequest('当前密码和新密码不能为空')
      }

      // 验证新密码长�?
      if (body.new_password.length < 6) {
        return badRequest('新密码至少需�?6 个字�?)
      }

      // 获取用户当前密码哈希
      const user = await context.env.DB.prepare(
        'SELECT password_hash FROM users WHERE id = ?'
      )
        .bind(userId)
        .first<{ password_hash: string }>()

      if (!user) {
        return unauthorized('用户不存�?)
      }

      // 验证当前密码
      const isCurrentPasswordValid = await verifyPassword(
        body.current_password,
        user.password_hash
      )

      if (!isCurrentPasswordValid) {
        return unauthorized('当前密码不正�?)
      }

      // 生成新密码哈�?
      const newPasswordHash = await hashPassword(body.new_password)

      // 更新密码
      const now = new Date().toISOString()
      await context.env.DB.prepare(
        'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?'
      )
        .bind(newPasswordHash, now, userId)
        .run()

      return success({
        message: '密码修改成功',
      })
    } catch (error) {
      console.error('Change password error:', error)
      return internalError('密码修改失败')
    }
  },
]
