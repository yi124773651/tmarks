/**
 * Change Password API
 * Path: /api/v1/change-password
 * Auth: JWT Token
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

// POST /api/v1/change-password - Change password
export const onRequestPost: PagesFunction<Env, RouteParams, AuthContext>[] = [
  requireAuth,
  async (context) => {
    const userId = context.data.user_id

    try {
      const body = (await context.request.json()) as ChangePasswordRequest

      // Validate request parameters
      if (!body.current_password || !body.new_password) {
        return badRequest('Current password and new password are required')
      }

      // Validate new password length
      if (body.new_password.length < 6) {
        return badRequest('New password must be at least 6 characters')
      }

      // Get user's current password hash
      const user = await context.env.DB.prepare(
        'SELECT password_hash FROM users WHERE id = ?'
      )
        .bind(userId)
        .first<{ password_hash: string }>()

      if (!user) {
        return unauthorized('User not found')
      }

      // Verify current password
      const isCurrentPasswordValid = await verifyPassword(
        body.current_password,
        user.password_hash
      )

      if (!isCurrentPasswordValid) {
        return unauthorized('Current password is incorrect')
      }

      // Generate new password hash
      const newPasswordHash = await hashPassword(body.new_password)

      // Update password
      const now = new Date().toISOString()
      await context.env.DB.prepare(
        'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?'
      )
        .bind(newPasswordHash, now, userId)
        .run()

      return success({
        message: 'Password changed successfully',
      })
    } catch (error) {
      console.error('Change password error:', error)
      return internalError('Failed to change password')
    }
  },
]
