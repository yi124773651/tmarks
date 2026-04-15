/**
 * 清空书签回收站 API
 * 路径: /api/v1/bookmarks/trash/empty
 * 认证: JWT Token (Bearer)
 */

import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env } from '../../../../lib/types'
import { success, internalError } from '../../../../lib/response'
import { requireAuth, AuthContext } from '../../../../middleware/auth'

// DELETE /api/v1/bookmarks/trash/empty - 清空回收站
export const onRequestDelete: PagesFunction<Env, string, AuthContext>[] = [
  requireAuth,
  async (context) => {
    const userId = context.data.user_id

    try {
      // 获取回收站中的书签 ID
      const { results: trashBookmarks } = await context.env.DB.prepare(
        'SELECT id FROM bookmarks WHERE user_id = ? AND deleted_at IS NOT NULL'
      )
        .bind(userId)
        .all<{ id: string }>()

      if (trashBookmarks.length === 0) {
        return success({ message: 'Trash is already empty', count: 0 })
      }

      const bookmarkIds = trashBookmarks.map(b => b.id)

      // 删除标签关联
      for (const id of bookmarkIds) {
        await context.env.DB.prepare('DELETE FROM bookmark_tags WHERE bookmark_id = ?')
          .bind(id)
          .run()
      }

      // 删除快照
      for (const id of bookmarkIds) {
        await context.env.DB.prepare('DELETE FROM bookmark_snapshots WHERE bookmark_id = ?')
          .bind(id)
          .run()
      }

      // 永久删除所有回收站书签
      await context.env.DB.prepare(
        'DELETE FROM bookmarks WHERE user_id = ? AND deleted_at IS NOT NULL'
      )
        .bind(userId)
        .run()

      return success({
        message: 'Trash emptied successfully',
        count: bookmarkIds.length,
      })
    } catch (error) {
      console.error('Empty trash error:', error)
      return internalError('Failed to empty trash')
    }
  },
]
