/**
 * PATCH /api/v1/tab-groups/batch-update
 * Batch update tab group positions
 */

import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, RouteParams } from '../../../lib/types'
import { success, badRequest, internalError } from '../../../lib/response'
import { requireAuth, AuthContext } from '../../../middleware/auth'

interface BatchUpdateItem {
  id: string
  position: number
  parent_id: string | null
}

interface BatchUpdateRequest {
  updates: BatchUpdateItem[]
}

export const onRequestPatch: PagesFunction<Env, RouteParams, AuthContext>[] = [
  requireAuth,
  async (context) => {
    const userId = context.data.user_id

    try {
      const body = (await context.request.json()) as BatchUpdateRequest

      if (!body.updates || !Array.isArray(body.updates) || body.updates.length === 0) {
        return badRequest('updates array is required')
      }

      if (body.updates.length > 200) {
        return badRequest('Cannot update more than 200 items at once')
      }

      const db = context.env.DB
      const stmts = body.updates.map(item =>
        db.prepare(
          `UPDATE tab_groups
           SET position = ?, parent_id = ?, updated_at = datetime('now')
           WHERE id = ? AND user_id = ?`
        ).bind(item.position, item.parent_id, item.id, userId)
      )

      await db.batch(stmts)

      return success({
        message: 'Batch update successful',
        updated_count: body.updates.length,
      })
    } catch (error) {
      console.error('Batch update tab groups error:', error)
      return internalError('Failed to batch update tab groups')
    }
  },
]
