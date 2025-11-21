/**
 * 快照批量清理 API
 * 路径: /api/v1/bookmarks/:id/snapshots/cleanup
 * 认证: JWT Token
 */

import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env } from '../../../../../lib/types'
import { success, badRequest, notFound, internalError } from '../../../../../lib/response'
import { requireAuth, AuthContext } from '../../../../../middleware/auth'

interface CleanupRequest {
  keep_count?: number
  older_than_days?: number
}

interface RouteParams {
  id: string
}

// POST /api/v1/bookmarks/:id/snapshots/cleanup - 批量清理快照
export const onRequestPost: PagesFunction<Env, RouteParams, AuthContext>[] = [
  requireAuth,
  async (context) => {
    const userId = context.data.user_id
    const bookmarkId = context.params.id

    try {
      const body = await context.request.json() as CleanupRequest
      const { keep_count, older_than_days } = body

      const db = context.env.DB
      const bucket = context.env.SNAPSHOTS_BUCKET

      if (!bucket) {
        return internalError('Storage not configured')
      }

      // 验证书签所有权
      const bookmark = await db
        .prepare('SELECT id FROM bookmarks WHERE id = ? AND user_id = ? AND deleted_at IS NULL')
        .bind(bookmarkId, userId)
        .first()

      if (!bookmark) {
        return notFound('Bookmark not found')
      }

      let toDelete: any[] = []

      // 按保留数量清理
      if (keep_count !== undefined && keep_count >= 0) {
        const result = await db
          .prepare(
            `SELECT id, r2_key, file_size
             FROM bookmark_snapshots
             WHERE bookmark_id = ? AND user_id = ?
             ORDER BY version DESC
             LIMIT -1 OFFSET ?`
          )
          .bind(bookmarkId, userId, keep_count)
          .all()

        toDelete = result.results || []
      }
      // 按时间清理
      else if (older_than_days !== undefined && older_than_days > 0) {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - older_than_days)
        const cutoffDateStr = cutoffDate.toISOString()

        const result = await db
          .prepare(
            `SELECT id, r2_key, file_size
             FROM bookmark_snapshots
             WHERE bookmark_id = ? AND user_id = ? AND created_at < ?
             ORDER BY version ASC`
          )
          .bind(bookmarkId, userId, cutoffDateStr)
          .all()

        toDelete = result.results || []
      } else {
        return badRequest('Must specify keep_count or older_than_days')
      }

      if (toDelete.length === 0) {
        return success({
          deleted_count: 0,
          freed_space: 0,
          message: 'No snapshots to delete',
        })
      }

      // 计算释放的空间
      const freedSpace = toDelete.reduce((sum, s) => sum + (s.file_size as number || 0), 0)

      // 删除 R2 文件
      for (const snapshot of toDelete) {
        await bucket.delete(snapshot.r2_key as string)
      }

      // 删除数据库记录
      const ids = toDelete.map((s) => `'${s.id}'`).join(',')
      await db
        .prepare(`DELETE FROM bookmark_snapshots WHERE id IN (${ids})`)
        .run()

      // 检查是否还有快照
      const remaining = await db
        .prepare(
          `SELECT COUNT(*) as count FROM bookmark_snapshots
           WHERE bookmark_id = ? AND user_id = ?`
        )
        .bind(bookmarkId, userId)
        .first()

      if (!remaining || (remaining.count as number) === 0) {
        await db
          .prepare(
            `UPDATE bookmarks 
             SET has_snapshot = 0, latest_snapshot_at = NULL 
             WHERE id = ?`
          )
          .bind(bookmarkId)
          .run()
      }

      return success({
        deleted_count: toDelete.length,
        freed_space: freedSpace,
        message: `Deleted ${toDelete.length} snapshots`,
      })
    } catch (error) {
      console.error('Cleanup snapshots error:', error)
      return internalError('Failed to cleanup snapshots')
    }
  },
]
