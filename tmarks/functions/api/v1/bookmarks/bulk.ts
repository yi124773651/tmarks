import type { PagesFunction, D1PreparedStatement } from '@cloudflare/workers-types'
import type { Env, RouteParams } from '../../../lib/types'
import { requireAuth, type AuthContext } from '../../../middleware/auth'
import { invalidatePublicShareCache } from '../../shared/cache'
import { CacheService } from '../../../lib/cache'
import { createBookmarkCacheManager } from '../../../lib/cache/bookmark-cache'

type BatchActionType = 'delete' | 'update_tags' | 'pin' | 'unpin' | 'archive' | 'unarchive'
interface BatchActionRequest {
  action: BatchActionType
  bookmark_ids: string[]
  add_tag_ids?: string[]
  remove_tag_ids?: string[]
}
interface BatchActionResponse {
  success: boolean
  affected_count: number
  errors?: Array<{ bookmark_id: string; message: string }>
}

export const onRequestPatch: PagesFunction<Env, RouteParams, AuthContext>[] = [
  requireAuth,
  async (context) => {
    const userId = context.data.user_id
    let body: BatchActionRequest | null = null
    try {
      body = (await context.request.json()) as BatchActionRequest
      const { action, bookmark_ids, add_tag_ids, remove_tag_ids } = body
      if (!action || !bookmark_ids || !Array.isArray(bookmark_ids) || bookmark_ids.length === 0) {
        return new Response(JSON.stringify({ code: 'INVALID_REQUEST', message: 'action and bookmark_ids are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
      }
      if (bookmark_ids.length > 100) {
        return new Response(JSON.stringify({ code: 'TOO_MANY_ITEMS', message: 'Cannot process more than 100 bookmarks at once' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
      }
      const db = context.env.DB
      const placeholders = bookmark_ids.map(() => '?').join(',')
      let affectedCount = 0
      const errors: Array<{ bookmark_id: string; message: string }> = []

      switch (action) {
        case 'delete': {
          const result = await db.prepare(
            `UPDATE bookmarks SET deleted_at = datetime('now'), click_count = 0, last_clicked_at = NULL WHERE id IN (${placeholders}) AND user_id = ? AND deleted_at IS NULL`
          ).bind(...bookmark_ids, userId).run()
          affectedCount = result.meta.changes || 0
          await db.prepare(`INSERT INTO audit_logs (user_id, event_type, payload, created_at) VALUES (?, 'batch_delete_bookmarks', ?, datetime('now'))`).bind(userId, JSON.stringify({ bookmark_ids, count: affectedCount })).run()
          break
        }
        case 'pin': {
          const result = await db.prepare(`UPDATE bookmarks SET is_pinned = 1, updated_at = datetime('now') WHERE id IN (${placeholders}) AND user_id = ? AND deleted_at IS NULL`).bind(...bookmark_ids, userId).run()
          affectedCount = result.meta.changes || 0
          break
        }
        case 'unpin': {
          const result = await db.prepare(`UPDATE bookmarks SET is_pinned = 0, updated_at = datetime('now') WHERE id IN (${placeholders}) AND user_id = ? AND deleted_at IS NULL`).bind(...bookmark_ids, userId).run()
          affectedCount = result.meta.changes || 0
          break
        }
        case 'update_tags': {
          if (add_tag_ids && add_tag_ids.length > 50) {
            return new Response(JSON.stringify({ code: 'INVALID_REQUEST', message: 'Cannot add more than 50 tags at once' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
          }
          if (remove_tag_ids && remove_tag_ids.length > 50) {
            return new Response(JSON.stringify({ code: 'INVALID_REQUEST', message: 'Cannot remove more than 50 tags at once' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
          }
          const verifyResult = await db.prepare(`SELECT id FROM bookmarks WHERE id IN (${placeholders}) AND user_id = ? AND deleted_at IS NULL`).bind(...bookmark_ids, userId).all<{ id: string }>()
          const validBookmarkIds = verifyResult.results.map((row: { id: string }) => row.id)
          if (validBookmarkIds.length === 0) {
            return new Response(JSON.stringify({ code: 'NO_VALID_BOOKMARKS', message: 'No valid bookmarks found' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
          }
          // Collect all tag mutation statements for atomic batch execution
          const tagStmts: D1PreparedStatement[] = []

          if (remove_tag_ids && remove_tag_ids.length > 0) {
            const tagPlaceholders = remove_tag_ids.map(() => '?').join(',')
            const bookmarkPlaceholders = validBookmarkIds.map(() => '?').join(',')
            tagStmts.push(
              db.prepare(`DELETE FROM bookmark_tags WHERE bookmark_id IN (${bookmarkPlaceholders}) AND tag_id IN (${tagPlaceholders}) AND user_id = ?`).bind(...validBookmarkIds, ...remove_tag_ids, userId)
            )
          }

          let validTagIds: string[] = []
          if (add_tag_ids && add_tag_ids.length > 0) {
            const tagPlaceholders = add_tag_ids.map(() => '?').join(',')
            const tagsResult = await db.prepare(`SELECT id FROM tags WHERE id IN (${tagPlaceholders}) AND user_id = ? AND deleted_at IS NULL`).bind(...add_tag_ids, userId).all<{ id: string }>()
            validTagIds = tagsResult.results.map((row: { id: string }) => row.id)
            if (validTagIds.length > 0) {
              for (const bookmarkId of validBookmarkIds) {
                for (const tagId of validTagIds) {
                  tagStmts.push(
                    db.prepare(`INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag_id, user_id, created_at) VALUES (?, ?, ?, datetime('now'))`).bind(bookmarkId, tagId, userId)
                  )
                }
              }
            }
          }

          // Add usage count updates, bookmark timestamps, and audit log
          const bookmarkPlaceholders = validBookmarkIds.map(() => '?').join(',')
          if (validTagIds.length > 0) {
            for (const tagId of validTagIds) {
              tagStmts.push(
                db.prepare(`UPDATE tags SET usage_count = (SELECT COUNT(*) FROM bookmark_tags WHERE tag_id = ? AND user_id = ?) WHERE id = ? AND user_id = ?`).bind(tagId, userId, tagId, userId)
              )
            }
          }
          if (remove_tag_ids && remove_tag_ids.length > 0) {
            for (const tagId of remove_tag_ids) {
              tagStmts.push(
                db.prepare(`UPDATE tags SET usage_count = (SELECT COUNT(*) FROM bookmark_tags WHERE tag_id = ? AND user_id = ?) WHERE id = ? AND user_id = ?`).bind(tagId, userId, tagId, userId)
              )
            }
          }
          tagStmts.push(
            db.prepare(`UPDATE bookmarks SET updated_at = datetime('now') WHERE id IN (${bookmarkPlaceholders}) AND user_id = ?`).bind(...validBookmarkIds, userId),
            db.prepare(`INSERT INTO audit_logs (user_id, event_type, payload, created_at) VALUES (?, 'batch_update_tags', ?, datetime('now'))`).bind(userId, JSON.stringify({ bookmark_ids: validBookmarkIds, add_tag_ids, remove_tag_ids })),
          )
          affectedCount = validBookmarkIds.length

          try {
            await db.batch(tagStmts)
          } catch (e) {
            console.error('Batch tag update failed:', e)
            errors.push({ bookmark_id: 'batch', message: 'Failed to update tags in batch' })
          }
          break
        }
        default:
          return new Response(JSON.stringify({ code: 'INVALID_ACTION', message: `Invalid action: ${action}` }), { status: 400, headers: { 'Content-Type': 'application/json' } })
      }

      const response: BatchActionResponse = { success: true, affected_count: affectedCount }
      if (errors.length > 0) response.errors = errors
      const cache = new CacheService(context.env)
      const bookmarkCache = createBookmarkCacheManager(cache)
      await bookmarkCache.handleBatchOperation(userId)
      await invalidatePublicShareCache(context.env, userId)
      return new Response(JSON.stringify(response), { status: 200, headers: { 'Content-Type': 'application/json' } })
    } catch (error) {
      console.error('Batch operation error:', error)
      return new Response(JSON.stringify({ code: 'INTERNAL_ERROR', message: 'Failed to perform batch operation' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
  },
]
