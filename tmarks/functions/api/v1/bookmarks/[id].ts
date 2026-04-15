import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, Bookmark, BookmarkRow, RouteParams, SQLParam } from '../../../lib/types'
import { success, badRequest, notFound, noContent, internalError } from '../../../lib/response'
import { requireAuth, AuthContext } from '../../../middleware/auth'
import { isValidUrl, sanitizeString } from '../../../lib/validation'
import { normalizeBookmark } from '../../../lib/bookmark-utils'
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
  is_public?: boolean
}

// PATCH /api/v1/bookmarks/:id - 
export const onRequestPatch: PagesFunction<Env, RouteParams, AuthContext>[] = [
  requireAuth,
  async (context) => {
    try {
      const userId = context.data.user_id
      const bookmarkId = context.params.id
      const body = await context.request.json() as UpdateBookmarkRequest

      // 
      const bookmarkRow = await context.env.DB.prepare(
        'SELECT * FROM bookmarks WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
      )
        .bind(bookmarkId, userId)
        .first<BookmarkRow>()

      if (!bookmarkRow) {
        return notFound('Bookmark not found')
      }

      // 
      if (body.url && !isValidUrl(body.url)) {
        return badRequest('Invalid URL format')
      }

      // 
      const updates: string[] = []
      const values: SQLParam[] = []

      if (body.title !== undefined) {
        updates.push('title = ?')
        values.push(sanitizeString(body.title, 500))
      }

      if (body.url !== undefined) {
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

      // 
      if (body.tags !== undefined) {
        const { createOrLinkTags } = await import('../../../lib/tags')
        await context.env.DB.prepare('DELETE FROM bookmark_tags WHERE bookmark_id = ? AND user_id = ?')
          .bind(bookmarkId, userId)
          .run()
        if (body.tags.length > 0) {
          await createOrLinkTags(context.env.DB, bookmarkId, body.tags, userId)
        }
      } else if (body.tag_ids !== undefined) {
        const stmts = [
          context.env.DB.prepare('DELETE FROM bookmark_tags WHERE bookmark_id = ? AND user_id = ?')
            .bind(bookmarkId, userId),
        ]
        if (body.tag_ids.length > 0) {
          for (const tagId of body.tag_ids) {
            stmts.push(
              context.env.DB.prepare(
                'INSERT INTO bookmark_tags (bookmark_id, tag_id, user_id, created_at) VALUES (?, ?, ?, ?)'
              ).bind(bookmarkId, tagId, userId, now)
            )
          }
        }
        await context.env.DB.batch(stmts)
      }

      // 
      const updatedBookmarkRow = await context.env.DB.prepare('SELECT * FROM bookmarks WHERE id = ? AND user_id = ?')
        .bind(bookmarkId, userId)
        .first<BookmarkRow>()

      const { results: tags } = await context.env.DB.prepare(
        `SELECT t.id, t.name, t.color
         FROM tags t
         INNER JOIN bookmark_tags bt ON t.id = bt.tag_id
         WHERE bt.bookmark_id = ? AND bt.user_id = ? AND t.deleted_at IS NULL`
      )
        .bind(bookmarkId, userId)
        .all<{ id: string; name: string; color: string | null }>()

      if (!updatedBookmarkRow) {
        return internalError('Failed to load bookmark after update')
      }

      await invalidatePublicShareCache(context.env, userId)

      return success({
        bookmark: {
          ...normalizeBookmark(updatedBookmarkRow),
          tags: tags || [],
        },
      })
    } catch (error) {
      console.error('Update bookmark error:', error)
      return internalError('Failed to update bookmark')
    }
  },
]

// DELETE /api/v1/bookmarks/:id - 
export const onRequestDelete: PagesFunction<Env, RouteParams, AuthContext>[] = [
  requireAuth,
  async (context) => {
    try {
      const userId = context.data.user_id
      const bookmarkId = context.params.id

      // 
      const bookmark = await context.env.DB.prepare(
        'SELECT id FROM bookmarks WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
      )
        .bind(bookmarkId, userId)
        .first()

      if (!bookmark) {
        return notFound('Bookmark not found')
      }

      const now = new Date().toISOString()
      await context.env.DB.prepare(
        'UPDATE bookmarks SET deleted_at = ?, updated_at = ?, click_count = 0, last_clicked_at = NULL WHERE id = ? AND user_id = ?'
      ).bind(now, now, bookmarkId, userId).run()

      await invalidatePublicShareCache(context.env, userId)

      return noContent()
    } catch (error) {
      console.error('Delete bookmark error:', error)
      return internalError('Failed to delete bookmark')
    }
  },
]

// PUT /api/v1/bookmarks/:id - 
export const onRequestPut: PagesFunction<Env, RouteParams, AuthContext>[] = [
  requireAuth,
  async (context) => {
    try {
      const userId = context.data.user_id
      const bookmarkId = context.params.id

      // 、
      const bookmark = await context.env.DB.prepare(
        'SELECT * FROM bookmarks WHERE id = ? AND user_id = ? AND deleted_at IS NOT NULL'
      )
        .bind(bookmarkId, userId)
        .first<Bookmark>()

      if (!bookmark) {
        return notFound('Deleted bookmark not found')
      }

      // 
      const now = new Date().toISOString()
      await context.env.DB.prepare(
        'UPDATE bookmarks SET deleted_at = NULL, updated_at = ? WHERE id = ? AND user_id = ?'
      )
        .bind(now, bookmarkId, userId)
        .run()

      // 
      const restoredBookmarkRow = await context.env.DB.prepare('SELECT * FROM bookmarks WHERE id = ? AND user_id = ?')
        .bind(bookmarkId, userId)
        .first<BookmarkRow>()

      const { results: tags } = await context.env.DB.prepare(
        `SELECT t.id, t.name, t.color
         FROM tags t
         INNER JOIN bookmark_tags bt ON t.id = bt.tag_id
         WHERE bt.bookmark_id = ? AND bt.user_id = ? AND t.deleted_at IS NULL`
      )
        .bind(bookmarkId, userId)
        .all<{ id: string; name: string; color: string | null }>()

      if (!restoredBookmarkRow) {
        return internalError('Failed to load bookmark after restore')
      }

      await invalidatePublicShareCache(context.env, userId)

      return success({
        bookmark: {
          ...normalizeBookmark(restoredBookmarkRow),
          tags: tags || [],
        },
      })
    } catch (error) {
      console.error('Restore bookmark error:', error)
      return internalError('Failed to restore bookmark')
    }
  },
]
