import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env } from '../../../../lib/types'
import { success, notFound, internalError } from '../../../../lib/response'
import { requireAuth, AuthContext } from '../../../../middleware/auth'

// POST /api/v1/bookmarks/:id/click - 记录书签点击
export const onRequestPost: PagesFunction<Env, 'id', AuthContext>[] = [
  requireAuth,
  async (context) => {
    try {
      const userId = context.data.user_id
      const bookmarkId = context.params.id as string
      const now = new Date().toISOString()

      // 检查书签是否存在且属于当前用户
      const bookmark = await context.env.DB.prepare(
        'SELECT id FROM bookmarks WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
      )
        .bind(bookmarkId, userId)
        .first()

      if (!bookmark) {
        return notFound('Bookmark not found')
      }

      // 更新点击次数和最后点击时间
      await context.env.DB.prepare(
        'UPDATE bookmarks SET click_count = click_count + 1, last_clicked_at = ? WHERE id = ?'
      )
        .bind(now, bookmarkId)
        .run()

      return success({
        message: 'Click recorded successfully',
        clicked_at: now,
      })
    } catch (error) {
      console.error('Record click error:', error)
      return internalError('Failed to record click')
    }
  },
]