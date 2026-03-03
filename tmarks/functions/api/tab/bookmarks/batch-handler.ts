/**
 * 批量书签创建处理器
 */

import type { EventContext } from '@cloudflare/workers-types'
import type { Env, RouteParams } from '../../../lib/types'
import type { ApiKeyAuthContext } from '../../../middleware/api-key-auth-pages'
import { success, badRequest, internalError } from '../../../lib/response'
import { isValidUrl, sanitizeString } from '../../../lib/validation'
import { generateUUID } from '../../../lib/crypto'
import { invalidatePublicShareCache } from '../../shared/cache'

interface BatchCreateBookmarkItem {
  title: string
  url: string
  description?: string
  cover_image?: string
  favicon?: string
  tags?: string[]
  is_pinned?: boolean
  is_archived?: boolean
  is_public?: boolean
}

interface BatchCreateResult {
  success: number
  failed: number
  skipped: number
  total: number
  errors?: Array<{
    index: number
    url: string
    error: string
  }>
  created_bookmarks: Array<{
    id: string
    url: string
    title: string
  }>
}

export async function batchCreateBookmarks(
  context: EventContext<Env, RouteParams, ApiKeyAuthContext>,
  userId: string,
  bookmarks: BatchCreateBookmarkItem[]
): Promise<Response> {
  console.log('[Batch Handler] ===== BATCH HANDLER CALLED =====')
  console.log('[Batch Handler] User ID:', userId)
  console.log('[Batch Handler] Bookmarks count:', bookmarks?.length)
  console.log('[Batch Handler] First bookmark:', JSON.stringify(bookmarks?.[0]))
  
  // 测试：立即返回成功响应
  return success({
    success: 0,
    failed: 0,
    skipped: 0,
    total: bookmarks?.length || 0,
    created_bookmarks: [],
    test: 'BATCH_HANDLER_REACHED'
  })
}
