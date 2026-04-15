/**
 * 批量更新置顶书签排序
 * POST /api/tab/bookmarks/reorder-pinned
 */

import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, RouteParams } from '../../../lib/types'
import { success, badRequest, internalError } from '../../../lib/response'
import { requireApiKeyAuth, ApiKeyAuthContext } from '../../../middleware/api-key-auth-pages'

interface ReorderPinnedRequest {
  bookmark_ids: string[]
}

export const onRequestPost: PagesFunction<Env, RouteParams, ApiKeyAuthContext>[] = [
  requireApiKeyAuth('bookmarks.write'),
  async (context) => {
    try {
      const userId = context.data.user_id
      const body = (await context.request.json()) as ReorderPinnedRequest

      if (!body.bookmark_ids || !Array.isArray(body.bookmark_ids) || body.bookmark_ids.length === 0) {
        return badRequest('bookmark_ids is required and must be a non-empty array')
      }

      // 验证所有书签都属于当前用户且已置顶
      const placeholders = body.bookmark_ids.map(() => '?').join(',')
      const { results: bookmarks } = await context.env.DB.prepare(
        `SELECT id FROM bookmarks 
         WHERE id IN (${placeholders}) 
         AND user_id = ? 
         AND is_pinned = 1 
         AND deleted_at IS NULL`
      )
        .bind(...body.bookmark_ids, userId)
        .all<{ id: string }>()

      if (bookmarks.length !== body.bookmark_ids.length) {
        return badRequest('Some bookmarks are not found, not pinned, or do not belong to you')
      }

      // 批量更新排序
      const now = new Date().toISOString()
      const updates = body.bookmark_ids.map((id, index) => {
        return context.env.DB.prepare(
          'UPDATE bookmarks SET pin_order = ?, updated_at = ? WHERE id = ? AND user_id = ?'
        ).bind(index, now, id, userId)
      })

      await context.env.DB.batch(updates)

      return success({
        message: 'Pinned bookmarks reordered successfully',
        count: body.bookmark_ids.length,
      })
    } catch (error) {
      console.error('Reorder pinned bookmarks error:', error)
      return internalError('Failed to reorder pinned bookmarks')
    }
  },
]
