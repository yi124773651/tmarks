/**
 *  API - 
 * : /api/v1/tab-groups/items/:id/move
 * : JWT Token (Bearer)
 */

import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, RouteParams } from '../../../../../lib/types'
import { success, badRequest, notFound, internalError } from '../../../../../lib/response'
import { requireAuth, AuthContext } from '../../../../../middleware/auth'

interface TabGroupItemRow {
  id: string
  group_id: string
  title: string
  url: string
  favicon: string | null
  position: number
  created_at: string
  is_pinned?: number
  is_todo?: number
}

interface MoveItemRequest {
  target_group_id: string
  position?: number
}

// POST /api/v1/tab-groups/items/:id/move - 
export const onRequestPost: PagesFunction<Env, RouteParams, AuthContext>[] = [
  requireAuth,
  async (context) => {
    const userId = context.data.user_id
    const itemId = context.params.id

    try {
      const body = (await context.request.json()) as MoveItemRequest

      if (!body.target_group_id) {
        return badRequest('target_group_id is required')
      }

      // 1. 
      const item = await context.env.DB.prepare(
        `SELECT tgi.*, tg.user_id 
         FROM tab_group_items tgi
         JOIN tab_groups tg ON tgi.group_id = tg.id
         WHERE tgi.id = ?`
      )
        .bind(itemId)
        .first<TabGroupItemRow & { user_id: string }>()

      if (!item) {
        return notFound('Tab group item not found')
      }

      if (item.user_id !== userId) {
        return notFound('Tab group item not found')
      }

      // 2. 
      const targetGroup = await context.env.DB.prepare(
        'SELECT id, user_id FROM tab_groups WHERE id = ? AND user_id = ?'
      )
        .bind(body.target_group_id, userId)
        .first<{ id: string; user_id: string }>()

      if (!targetGroup) {
        return notFound('Target group not found')
      }

      // 3. ，
      if (item.group_id === body.target_group_id) {
        if (body.position !== undefined) {
          // 
          await context.env.DB.prepare(
            'UPDATE tab_group_items SET position = ? WHERE id = ?'
          )
            .bind(body.position, itemId)
            .run()

          // 
          await context.env.DB.prepare(
            `UPDATE tab_group_items 
             SET position = position + 1 
             WHERE group_id = ? AND id != ? AND position >= ?`
          )
            .bind(item.group_id, itemId, body.position)
            .run()
        }
      } else {
        // 4. 

        // 4.1 
        const maxPositionResult = await context.env.DB.prepare(
          'SELECT MAX(position) as max_position FROM tab_group_items WHERE group_id = ?'
        )
          .bind(body.target_group_id)
          .first<{ max_position: number | null }>()

        const targetPosition =
          body.position !== undefined
            ? body.position
            : (maxPositionResult?.max_position ?? -1) + 1

        // 4.2 
        await context.env.DB.prepare(
          `UPDATE tab_group_items 
           SET group_id = ?, position = ? 
           WHERE id = ?`
        )
          .bind(body.target_group_id, targetPosition, itemId)
          .run()

        // 4.3 （）
        await context.env.DB.prepare(
          `UPDATE tab_group_items 
           SET position = position - 1 
           WHERE group_id = ? AND position > ?`
        )
          .bind(item.group_id, item.position)
          .run()

        // 4.4 （）
        if (body.position !== undefined) {
          await context.env.DB.prepare(
            `UPDATE tab_group_items 
             SET position = position + 1 
             WHERE group_id = ? AND id != ? AND position >= ?`
          )
            .bind(body.target_group_id, itemId, targetPosition)
            .run()
        }
      }

      // 5. 
      const updatedItem = await context.env.DB.prepare(
        'SELECT * FROM tab_group_items WHERE id = ?'
      )
        .bind(itemId)
        .first<TabGroupItemRow>()

      if (!updatedItem) {
        return internalError('Failed to load item after move')
      }

      return success({
        item: updatedItem,
        message: 'Item moved successfully',
      })
    } catch (error) {
      console.error('Move tab group item error:', error)
      return internalError('Failed to move tab group item')
    }
  },
]
