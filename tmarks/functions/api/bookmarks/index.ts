/**
 * 对外 API - 书签管理
 * 路径: /api/bookmarks
 * 认证: API Key (X-API-Key header)
 */

import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, Bookmark, BookmarkRow, RouteParams, SQLParam } from '../../lib/types'
import { success, badRequest, created, internalError } from '../../lib/response'
import { requireApiKeyAuth, ApiKeyAuthContext } from '../../middleware/api-key-auth-pages'
import { isValidUrl, sanitizeString } from '../../lib/validation'
import { generateUUID } from '../../lib/crypto'
import { normalizeBookmark } from './utils'
import { invalidatePublicShareCache } from '../shared/cache'

interface CreateBookmarkRequest {
  title: string
  url: string
  description?: string
  cover_image?: string
  tag_ids?: string[]
  is_pinned?: boolean
  is_archived?: boolean
  is_public?: boolean
}

// GET /api/bookmarks - 获取书签列表
interface BookmarkWithTags extends Bookmark {
  tags: Array<{ id: string; name: string; color: string | null }>
}

export const onRequestGet: PagesFunction<Env, RouteParams, ApiKeyAuthContext>[] = [
  requireApiKeyAuth('bookmarks.read'),
  async (context) => {
    const userId = context.data.user_id
    const url = new URL(context.request.url)

    try {
      const keyword = url.searchParams.get('keyword')
      const tags = url.searchParams.get('tags')
      const pageSize = parseInt(url.searchParams.get('page_size') || '30')
      const pageCursor = url.searchParams.get('page_cursor')
      const sortBy = (url.searchParams.get('sort') as 'created' | 'updated' | 'pinned') || 'created'
      const archivedParam = url.searchParams.get('archived')
      const archived = archivedParam ? archivedParam === 'true' : undefined

      // 构建查询
      let query = `
        SELECT DISTINCT b.*
        FROM bookmarks b
        WHERE b.user_id = ? AND b.deleted_at IS NULL
      `
      const params: SQLParam[] = [userId]

      // 归档过滤
      if (archived !== undefined) {
        query += ` AND b.is_archived = ?`
        params.push(archived ? 1 : 0)
      }

      // 关键词搜索
      if (keyword) {
        query += ` AND (b.title LIKE ? OR b.description LIKE ? OR b.url LIKE ?)`
        const searchPattern = `%${keyword}%`
        params.push(searchPattern, searchPattern, searchPattern)
      }

      // 标签过滤（交集逻辑：必须包含所有选中的标签）
      if (tags) {
        const tagIds = tags.split(',').filter(Boolean)
        if (tagIds.length > 0) {
          query += ` AND b.id IN (
            SELECT bt.bookmark_id
            FROM bookmark_tags bt
            WHERE bt.tag_id IN (${tagIds.map(() => '?').join(',')})
            GROUP BY bt.bookmark_id
            HAVING COUNT(DISTINCT bt.tag_id) = ?
          )`
          params.push(...tagIds, tagIds.length)
        }
      }

      // 游标分页
      if (pageCursor) {
        query += ` AND b.id < ?`
        params.push(pageCursor)
      }

      // 排序
      let orderBy = ''
      switch (sortBy) {
        case 'updated':
          orderBy = 'ORDER BY b.is_pinned DESC, b.updated_at DESC, b.id DESC'
          break
        case 'pinned':
          orderBy = 'ORDER BY b.is_pinned DESC, b.created_at DESC, b.id DESC'
          break
        case 'created':
        default:
          orderBy = 'ORDER BY b.is_pinned DESC, b.created_at DESC, b.id DESC'
          break
      }

      query += ` ${orderBy} LIMIT ?`
      params.push(pageSize + 1)

      const { results } = await context.env.DB.prepare(query).bind(...params).all<BookmarkRow>()

      const hasMore = results.length > pageSize
      const bookmarks = hasMore ? results.slice(0, pageSize) : results
      const nextCursor = hasMore && bookmarks.length > 0 ? String(bookmarks[bookmarks.length - 1].id) : null

      // 优化：使用单次查询获取所有书签的标签
      const bookmarkIds = bookmarks.map(b => b.id)

      // 一次性获取所有书签的标签
      let allTags: Array<{ bookmark_id: string; id: string; name: string; color: string | null }> = []

      if (bookmarkIds.length > 0) {
        const placeholders = bookmarkIds.map(() => '?').join(',')
        const { results: tagResults } = await context.env.DB.prepare(
          `SELECT
             bt.bookmark_id,
             t.id,
             t.name,
             t.color
           FROM tags t
           INNER JOIN bookmark_tags bt ON t.id = bt.tag_id
           WHERE bt.bookmark_id IN (${placeholders})
             AND t.deleted_at IS NULL
           ORDER BY bt.bookmark_id, t.name`
        )
          .bind(...bookmarkIds)
          .all<{ bookmark_id: string; id: string; name: string; color: string | null }>()

        allTags = tagResults ?? []
      }

      // 将标签按书签ID分组
      const tagsByBookmarkId = new Map<string, Array<{ id: string; name: string; color: string | null }>>()
      for (const tag of allTags || []) {
        if (!tagsByBookmarkId.has(tag.bookmark_id)) {
          tagsByBookmarkId.set(tag.bookmark_id, [])
        }
        tagsByBookmarkId.get(tag.bookmark_id)!.push({
          id: tag.id,
          name: tag.name,
          color: tag.color,
        })
      }

      // 组装书签和标签数据
      const bookmarksWithTags: BookmarkWithTags[] = bookmarks.map(row => {
        const normalized = normalizeBookmark(row)
        return {
          ...normalized,
          tags: tagsByBookmarkId.get(row.id) || [],
        }
      })

      return success({
        bookmarks: bookmarksWithTags,
        meta: {
          page_size: pageSize,
          count: bookmarks.length,
          next_cursor: nextCursor,
          has_more: hasMore,
        },
      })
    } catch (error) {
      console.error('Get bookmarks error:', error)
      return internalError('Failed to get bookmarks')
    }
  },
]

// POST /api/bookmarks - 创建书签
export const onRequestPost: PagesFunction<Env, RouteParams, ApiKeyAuthContext>[] = [
  requireApiKeyAuth('bookmarks.create'),
  async (context) => {
    const userId = context.data.user_id

    try {
      const body = (await context.request.json()) as CreateBookmarkRequest

      if (!body.title || !body.url) {
        return badRequest('Title and URL are required')
      }

      if (!isValidUrl(body.url)) {
        return badRequest('Invalid URL format')
      }

      const title = sanitizeString(body.title, 500)
      const url = sanitizeString(body.url, 2000)
      const description = body.description ? sanitizeString(body.description, 1000) : null
      const coverImage = body.cover_image ? sanitizeString(body.cover_image, 2000) : null

      // 检查URL是否已存在（包括已删除的）
      const existing = await context.env.DB.prepare(
        'SELECT id, deleted_at FROM bookmarks WHERE user_id = ? AND url = ?'
      )
        .bind(userId, url)
        .first<{ id: string; deleted_at: string | null }>()

      const now = new Date().toISOString()
      let bookmarkId: string
      const isPinned = body.is_pinned ? 1 : 0
      const isArchived = body.is_archived ? 1 : 0
      const isPublic = body.is_public ? 1 : 0

      if (existing) {
        if (!existing.deleted_at) {
          return badRequest('Bookmark with this URL already exists')
        }

        // 恢复已删除的书签
        bookmarkId = existing.id
        await context.env.DB.prepare(
          `UPDATE bookmarks
           SET title = ?, description = ?, cover_image = ?,
               is_pinned = ?, is_archived = ?, is_public = ?,
               deleted_at = NULL, updated_at = ?
           WHERE id = ?`
        )
          .bind(
            title,
            description,
            coverImage,
            isPinned,
            isArchived,
            isPublic,
            now,
            bookmarkId
          )
          .run()

        await context.env.DB.prepare('DELETE FROM bookmark_tags WHERE bookmark_id = ?')
          .bind(bookmarkId)
          .run()
      } else {
        // 创建新书签
        bookmarkId = generateUUID()
        await context.env.DB.prepare(
          `INSERT INTO bookmarks (id, user_id, title, url, description, cover_image, is_pinned, is_archived, is_public, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(
            bookmarkId,
            userId,
            title,
            url,
            description,
            coverImage,
            isPinned,
            isArchived,
            isPublic,
            now,
            now
          )
          .run()
      }

      // 关联标签
      if (body.tag_ids && body.tag_ids.length > 0) {
        for (const tagId of body.tag_ids) {
          await context.env.DB.prepare(
            'INSERT INTO bookmark_tags (bookmark_id, tag_id, user_id, created_at) VALUES (?, ?, ?, ?)'
          )
            .bind(bookmarkId, tagId, userId, now)
            .run()
        }
      }

      // 获取完整的书签信息
      const bookmarkRow = await context.env.DB.prepare('SELECT * FROM bookmarks WHERE id = ?')
        .bind(bookmarkId)
        .first<BookmarkRow>()

      const { results: tags } = await context.env.DB.prepare(
        `SELECT t.id, t.name, t.color
         FROM tags t
         INNER JOIN bookmark_tags bt ON t.id = bt.tag_id
         WHERE bt.bookmark_id = ?`
      )
        .bind(bookmarkId)
        .all<{ id: number; name: string; color: string | null }>()

      if (!bookmarkRow) {
        return internalError('Failed to load bookmark after creation')
      }

      await invalidatePublicShareCache(context.env, userId)

      return created({
        bookmark: {
          ...normalizeBookmark(bookmarkRow),
          tags: tags || [],
        },
      })
    } catch (error) {
      console.error('Create bookmark error:', error)
      return internalError('Failed to create bookmark')
    }
  },
]
