/**
 * 对外 API - 永久删除书签
 * 路径: /api/tab/bookmarks/:id/permanent
 * 认证: API Key (X-API-Key header)
 */

import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, RouteParams } from '../../../../lib/types'
import { noContent, notFound, internalError } from '../../../../lib/response'
import { requireApiKeyAuth, ApiKeyAuthContext } from '../../../../middleware/api-key-auth-pages'

// DELETE /api/tab/bookmarks/:id/permanent - 永久删除（从回收站彻底删除）
export const onRequestDelete: PagesFunction<Env, RouteParams, ApiKeyAuthContext>[] = [
  requireApiKeyAuth('bookmarks.delete'),
  async (context) => {
    const userId = context.data.user_id
    const bookmarkId = context.params.id

    try {
      // 检查书签是否存在且已在回收站中
      const existing = await context.env.DB.prepare(
        'SELECT id FROM bookmarks WHERE id = ? AND user_id = ? AND deleted_at IS NOT NULL'
      )
        .bind(bookmarkId, userId)
        .first()

      if (!existing) {
        return notFound('Bookmark not found in trash')
      }

      // 删除标签关联
      await context.env.DB.prepare('DELETE FROM bookmark_tags WHERE bookmark_id = ?')
        .bind(bookmarkId)
        .run()

      // 删除快照
      await context.env.DB.prepare('DELETE FROM bookmark_snapshots WHERE bookmark_id = ?')
        .bind(bookmarkId)
        .run()

      // 永久删除书签
      await context.env.DB.prepare('DELETE FROM bookmarks WHERE id = ?')
        .bind(bookmarkId)
        .run()

      return noContent()
    } catch (error) {
      console.error('Permanent delete bookmark error:', error)
      return internalError('Failed to permanently delete bookmark')
    }
  },
]
