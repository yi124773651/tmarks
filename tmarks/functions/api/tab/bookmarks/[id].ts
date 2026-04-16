/**
 *  API - 
 * : /api/tab/bookmarks/:id
 * : API Key (X-API-Key header)
 */

import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, BookmarkRow, RouteParams, SQLParam } from '../../../lib/types'
import { success, badRequest, notFound, noContent, internalError } from '../../../lib/response'
import { requireApiKeyAuth, ApiKeyAuthContext } from '../../../middleware/api-key-auth-pages'
import { isValidUrl, sanitizeString } from '../../../lib/validation'
import { normalizeBookmark } from '../../../lib/bookmark-utils'
import { getValidTagIds, replaceBookmarkTags, replaceBookmarkTagsByNames } from '../../../lib/tags'
import { invalidatePublicShareCache } from '../../shared/cache'

interface UpdateBookmarkRequest {
  title?: string
  url?: string
  description?: string
  cover_image?: string
  favicon?: string
  tag_ids?: string[]  // ： ID 
  tags?: string[]     // ：（）
  is_pinned?: boolean
  is_archived?: boolean
  is_public?: boolean
}

// GET /api/bookmarks/:id - 
export const onRequestGet: PagesFunction<Env, RouteParams, ApiKeyAuthContext>[] = [
  requireApiKeyAuth('bookmarks.read'),
  async (context) => {
    const userId = context.data.user_id
    const bookmarkId = context.params.id

    try {
      const bookmarkRow = await context.env.DB.prepare(
        'SELECT * FROM bookmarks WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
      )
        .bind(bookmarkId, userId)
        .first<BookmarkRow>()

      if (!bookmarkRow) {
        return notFound('Bookmark not found')
      }

      const { results: tags } = await context.env.DB.prepare(
        `SELECT t.id, t.name, t.color
         FROM tags t
         INNER JOIN bookmark_tags bt ON t.id = bt.tag_id
         WHERE bt.bookmark_id = ? AND bt.user_id = ? AND t.deleted_at IS NULL`
      )
        .bind(bookmarkId, userId)
        .all<{ id: string; name: string; color: string | null }>()

      const snapshotCountResult = await context.env.DB.prepare(
        `SELECT COUNT(*) as count FROM bookmark_snapshots WHERE bookmark_id = ? AND user_id = ?`
      )
        .bind(bookmarkId, userId)
        .first<{ count: number }>()

      const snapshotCount = snapshotCountResult?.count || 0

      await invalidatePublicShareCache(context.env, userId)

      return success({
        bookmark: {
          ...normalizeBookmark(bookmarkRow),
          tags: tags || [],
          snapshot_count: snapshotCount,
          has_snapshot: snapshotCount > 0,
        },
      })
    } catch (error) {
      console.error('Get bookmark error:', error)
      return internalError('Failed to get bookmark')
    }
  },
]

// PATCH /api/bookmarks/:id - 
export const onRequestPatch: PagesFunction<Env, RouteParams, ApiKeyAuthContext>[] = [
  requireApiKeyAuth('bookmarks.update'),
  async (context) => {
    const userId = context.data.user_id
    const bookmarkId = context.params.id

    try {
      const existing = await context.env.DB.prepare(
        'SELECT id FROM bookmarks WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
      )
        .bind(bookmarkId, userId)
        .first()

      if (!existing) {
        return notFound('Bookmark not found')
      }

      const body = (await context.request.json()) as UpdateBookmarkRequest
      const updates: string[] = []
      const values: SQLParam[] = []

      if (body.title !== undefined) {
        if (!body.title.trim()) return badRequest('Title cannot be empty')
        updates.push('title = ?')
        values.push(sanitizeString(body.title, 500))
      }

      if (body.url !== undefined) {
        if (!body.url.trim()) return badRequest('URL cannot be empty')
        if (!isValidUrl(body.url)) return badRequest('Invalid URL format')
        updates.push('url = ?')
        values.push(sanitizeString(body.url, 2000))
      }

      if (body.description !== undefined) {
        updates.push('description = ?')
        values.push(body.description ? sanitizeString(body.description, 1000) : null)
      }

      if (body.cover_image !== undefined) {
        updates.push('cover_image = ?')
        values.push(body.cover_image ? sanitizeString(body.cover_image, 2000) : null)
      }

      if (body.favicon !== undefined) {
        updates.push('favicon = ?')
        values.push(body.favicon ? sanitizeString(body.favicon, 2000) : null)
      }

      if (body.is_pinned !== undefined) {
        updates.push('is_pinned = ?')
        values.push(body.is_pinned ? 1 : 0)
      }

      if (body.is_archived !== undefined) {
        updates.push('is_archived = ?')
        values.push(body.is_archived ? 1 : 0)
      }

      if (body.is_public !== undefined) {
        updates.push('is_public = ?')
        values.push(body.is_public ? 1 : 0)
      }

      const now = new Date().toISOString()

      if (updates.length > 0) {
        updates.push('updated_at = ?')
        values.push(now)
        values.push(bookmarkId, userId)

        await context.env.DB.prepare(
          `UPDATE bookmarks SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`
        )
          .bind(...values)
          .run()
      }

      if (body.tags !== undefined) {
        await replaceBookmarkTagsByNames(context.env.DB, bookmarkId, body.tags, userId, now)
      } else if (body.tag_ids !== undefined) {
        const validTagIds = await getValidTagIds(context.env.DB, userId, body.tag_ids)
        await replaceBookmarkTags(context.env.DB, bookmarkId, userId, validTagIds, now)
      }

      const bookmarkRow = await context.env.DB.prepare(
        'SELECT * FROM bookmarks WHERE id = ? AND user_id = ?'
      )
        .bind(bookmarkId, userId)
        .first<BookmarkRow>()

      const { results: tags } = await context.env.DB.prepare(
        `SELECT t.id, t.name, t.color
         FROM tags t
         INNER JOIN bookmark_tags bt ON t.id = bt.tag_id
         WHERE bt.bookmark_id = ? AND bt.user_id = ?`
      )
        .bind(bookmarkId, userId)
        .all<{ id: string; name: string; color: string | null }>()

      if (!bookmarkRow) {
        return internalError('Failed to load bookmark after update')
      }

      return success({
        bookmark: {
          ...normalizeBookmark(bookmarkRow),
          tags: tags || [],
        },
      })
    } catch (error) {
      console.error('Update bookmark error:', error)
      return internalError('Failed to update bookmark')
    }
  },
]

// DELETE /api/bookmarks/:id - 
export const onRequestDelete: PagesFunction<Env, RouteParams, ApiKeyAuthContext>[] = [
  requireApiKeyAuth('bookmarks.delete'),
  async (context) => {
    const userId = context.data.user_id
    const bookmarkId = context.params.id

    try {
      const existing = await context.env.DB.prepare(
        'SELECT id FROM bookmarks WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
      )
        .bind(bookmarkId, userId)
        .first()

      if (!existing) {
        return notFound('Bookmark not found')
      }

      const now = new Date().toISOString()

      await context.env.DB.prepare(
        'UPDATE bookmarks SET deleted_at = ?, updated_at = ? WHERE id = ? AND user_id = ?'
      )
        .bind(now, now, bookmarkId, userId)
        .run()

      await invalidatePublicShareCache(context.env, userId)

      return noContent()
    } catch (error) {
      console.error('Delete bookmark error:', error)
      return internalError('Failed to delete bookmark')
    }
  },
]
