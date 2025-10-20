/**
 * 内部 API - 标签页组操作
 * 路径: /api/tab-groups
 * 认证: JWT Token (Bearer)
 */

import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, RouteParams, SQLParam } from '../../lib/types'
import { success, badRequest, created, internalError } from '../../lib/response'
import { requireAuth, AuthContext } from '../../middleware/auth'
import { sanitizeString } from '../../lib/validation'
import { generateUUID } from '../../lib/crypto'

interface TabGroupRow {
  id: string
  user_id: string
  title: string
  color: string | null
  tags: string | null
  is_deleted: number
  deleted_at: string | null
  created_at: string
  updated_at: string
}

interface TabGroupItemRow {
  id: string
  group_id: string
  title: string
  url: string
  favicon: string | null
  position: number
  created_at: string
}

interface CreateTabGroupRequest {
  title?: string
  items: Array<{
    title: string
    url: string
    favicon?: string
  }>
}

// GET /api/tab-groups - 获取标签页组列表
export const onRequestGet: PagesFunction<Env, RouteParams, AuthContext>[] = [
  requireAuth,
  async (context) => {
    const userId = context.data.user_id
    const url = new URL(context.request.url)

    const pageSize = Math.min(parseInt(url.searchParams.get('page_size') || '30'), 100)
    const pageCursor = url.searchParams.get('page_cursor') || ''

    try {
      // Try to query with is_deleted column first
      let groups: TabGroupRow[] = []
      try {
        let query = `
          SELECT *
          FROM tab_groups
          WHERE user_id = ? AND (is_deleted IS NULL OR is_deleted = 0)
        `
        const params: SQLParam[] = [userId]

        // Pagination
        if (pageCursor) {
          query += ` AND created_at < ?`
          params.push(pageCursor)
        }

        query += ` ORDER BY created_at DESC LIMIT ?`
        params.push(pageSize + 1)

        const result = await context.env.DB.prepare(query)
          .bind(...params)
          .all<TabGroupRow>()
        groups = result.results
      } catch (e) {
        // Fallback: query without is_deleted column
        let query = `
          SELECT *
          FROM tab_groups
          WHERE user_id = ?
        `
        const params: SQLParam[] = [userId]

        // Pagination
        if (pageCursor) {
          query += ` AND created_at < ?`
          params.push(pageCursor)
        }

        query += ` ORDER BY created_at DESC LIMIT ?`
        params.push(pageSize + 1)

        const result = await context.env.DB.prepare(query)
          .bind(...params)
          .all<TabGroupRow>()
        groups = result.results
      }

      const hasMore = groups.length > pageSize
      const tabGroups = hasMore ? groups.slice(0, pageSize) : groups
      const nextCursor = hasMore ? tabGroups[tabGroups.length - 1].created_at : undefined

      // Get items for each group
      const groupsWithItems = await Promise.all(
        tabGroups.map(async (group) => {
          const { results: items } = await context.env.DB.prepare(
            'SELECT * FROM tab_group_items WHERE group_id = ? ORDER BY position ASC'
          )
            .bind(group.id)
            .all<TabGroupItemRow>()

          // Parse tags
          let tags: string[] | null = null
          if (group.tags) {
            try {
              tags = JSON.parse(group.tags)
            } catch (e) {
              tags = null
            }
          }

          return {
            ...group,
            tags,
            items: items || [],
            item_count: items?.length || 0,
          }
        })
      )

      return success({
        tab_groups: groupsWithItems,
        meta: {
          page_size: pageSize,
          next_cursor: nextCursor,
        },
      })
    } catch (error) {
      console.error('Get tab groups error:', error)
      return internalError('Failed to get tab groups')
    }
  },
]

// POST /api/tab-groups - 创建标签页组
export const onRequestPost: PagesFunction<Env, RouteParams, AuthContext>[] = [
  requireAuth,
  async (context) => {
    const userId = context.data.user_id

    try {
      const body = (await context.request.json()) as CreateTabGroupRequest

      if (!body.items || body.items.length === 0) {
        return badRequest('At least one tab item is required')
      }

      // Generate title if not provided (timestamp format)
      const now = new Date()
      const defaultTitle = body.title || now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).replace(/\//g, '-')

      const title = sanitizeString(defaultTitle, 200)
      const groupId = generateUUID()
      const timestamp = now.toISOString()

      // Insert tab group
      await context.env.DB.prepare(
        'INSERT INTO tab_groups (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
      )
        .bind(groupId, userId, title, timestamp, timestamp)
        .run()

      // Insert tab group items
      const itemInserts = body.items.map((item, index) => {
        const itemId = generateUUID()
        const itemTitle = sanitizeString(item.title, 500)
        const itemUrl = sanitizeString(item.url, 2000)
        const favicon = item.favicon ? sanitizeString(item.favicon, 2000) : null

        return context.env.DB.prepare(
          'INSERT INTO tab_group_items (id, group_id, title, url, favicon, position, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        )
          .bind(itemId, groupId, itemTitle, itemUrl, favicon, index, timestamp)
          .run()
      })

      await Promise.all(itemInserts)

      // Get created tab group with items
      const groupRow = await context.env.DB.prepare(
        'SELECT * FROM tab_groups WHERE id = ?'
      )
        .bind(groupId)
        .first<TabGroupRow>()

      const { results: items } = await context.env.DB.prepare(
        'SELECT * FROM tab_group_items WHERE group_id = ? ORDER BY position ASC'
      )
        .bind(groupId)
        .all<TabGroupItemRow>()

      return created({
        tab_group: {
          ...groupRow,
          items: items || [],
          item_count: items?.length || 0,
        },
      })
    } catch (error) {
      console.error('Create tab group error:', error)
      return internalError('Failed to create tab group')
    }
  },
]

