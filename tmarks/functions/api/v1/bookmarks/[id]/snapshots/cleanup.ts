/**
 *  API
 * : /api/v1/bookmarks/:id/snapshots/cleanup
 * : JWT Token
 */

import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env } from '../../../../../lib/types'
import { success, badRequest, notFound, internalError } from '../../../../../lib/response'
import { requireAuth, AuthContext } from '../../../../../middleware/auth'

interface CleanupRequest {
  keep_count?: number
  older_than_days?: number
  verify_and_fix?: boolean
}

interface RouteParams {
  id: string
}

interface SnapshotRow {
  id: string
  r2_key: string
  file_size: number
}

async function deleteSnapshotRows(
  db: D1Database, ids: string[], userId: string,
): Promise<void> {
  const placeholders = ids.map(() => '?').join(',')
  await db
    .prepare(`DELETE FROM bookmark_snapshots WHERE id IN (${placeholders}) AND user_id = ?`)
    .bind(...ids, userId)
    .run()
}

async function updateBookmarkSnapshotCount(
  db: D1Database, bookmarkId: string, userId: string,
): Promise<void> {
  const remaining = await db
    .prepare(
      `SELECT COUNT(*) as count FROM bookmark_snapshots
       WHERE bookmark_id = ? AND user_id = ?`,
    )
    .bind(bookmarkId, userId)
    .first()

  const remainingCount = (remaining?.count as number) || 0

  if (remainingCount === 0) {
    await db
      .prepare(
        `UPDATE bookmarks
         SET has_snapshot = 0, latest_snapshot_at = NULL, snapshot_count = 0
         WHERE id = ? AND user_id = ?`,
      )
      .bind(bookmarkId, userId)
      .run()
  } else {
    await db
      .prepare(`UPDATE bookmarks SET snapshot_count = ? WHERE id = ? AND user_id = ?`)
      .bind(remainingCount, bookmarkId, userId)
      .run()
  }
}

async function handleVerifyAndFix(
  db: D1Database, bucket: R2Bucket, bookmarkId: string, userId: string,
) {
  const { results: allSnapshots } = await db
    .prepare(
      `SELECT id, r2_key, file_size FROM bookmark_snapshots
       WHERE bookmark_id = ? AND user_id = ?`,
    )
    .bind(bookmarkId, userId)
    .all<SnapshotRow>()

  const orphaned: SnapshotRow[] = []

  for (const snapshot of allSnapshots || []) {
    try {
      const r2Object = await bucket.head(snapshot.r2_key)
      if (!r2Object) orphaned.push(snapshot)
    } catch {
      orphaned.push(snapshot)
    }
  }

  if (orphaned.length === 0) {
    return success({
      deleted_count: 0,
      freed_space: 0,
      message: 'All snapshots are valid, no orphaned records found',
    })
  }

  await deleteSnapshotRows(db, orphaned.map((s) => s.id), userId)
  await updateBookmarkSnapshotCount(db, bookmarkId, userId)

  return success({
    deleted_count: orphaned.length,
    freed_space: 0,
    message: `Fixed ${orphaned.length} orphaned snapshot records`,
  })
}

// POST /api/v1/bookmarks/:id/snapshots/cleanup
export const onRequestPost: PagesFunction<Env, RouteParams, AuthContext>[] = [
  requireAuth,
  async (context) => {
    const userId = context.data.user_id
    const bookmarkId = context.params.id

    try {
      const body = await context.request.json() as CleanupRequest
      const { keep_count, older_than_days, verify_and_fix } = body

      const db = context.env.DB
      const bucket = context.env.SNAPSHOTS_BUCKET

      if (!bucket) {
        return internalError('Storage not configured')
      }

      const bookmark = await db
        .prepare('SELECT id FROM bookmarks WHERE id = ? AND user_id = ? AND deleted_at IS NULL')
        .bind(bookmarkId, userId)
        .first()

      if (!bookmark) return notFound('Bookmark not found')

      if (verify_and_fix) {
        return handleVerifyAndFix(db, bucket, bookmarkId, userId)
      }

      let toDelete: SnapshotRow[] = []

      if (keep_count !== undefined && keep_count >= 0) {
        const result = await db
          .prepare(
            `SELECT id, r2_key, file_size FROM bookmark_snapshots
             WHERE bookmark_id = ? AND user_id = ?
             ORDER BY version DESC LIMIT -1 OFFSET ?`,
          )
          .bind(bookmarkId, userId, keep_count)
          .all()
        toDelete = result.results || []
      } else if (older_than_days !== undefined && older_than_days > 0) {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - older_than_days)
        const result = await db
          .prepare(
            `SELECT id, r2_key, file_size FROM bookmark_snapshots
             WHERE bookmark_id = ? AND user_id = ? AND created_at < ?
             ORDER BY version ASC`,
          )
          .bind(bookmarkId, userId, cutoffDate.toISOString())
          .all()
        toDelete = result.results || []
      } else {
        return badRequest('Must specify keep_count or older_than_days')
      }

      if (toDelete.length === 0) {
        return success({ deleted_count: 0, freed_space: 0, message: 'No snapshots to delete' })
      }

      const freedSpace = toDelete.reduce((sum, s) => sum + (s.file_size as number || 0), 0)

      for (const snapshot of toDelete) {
        await bucket.delete(snapshot.r2_key as string)
      }

      await deleteSnapshotRows(db, toDelete.map((s) => s.id), userId)
      await updateBookmarkSnapshotCount(db, bookmarkId, userId)

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
