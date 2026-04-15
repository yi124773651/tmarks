import { apiClient } from '@/lib/api-client'
import type {
  Bookmark,
  BookmarksResponse,
  CreateBookmarkRequest,
  UpdateBookmarkRequest,
  BookmarkQueryParams,
  BatchActionRequest,
  BatchActionResponse,
} from '@/lib/types'
import { assertData } from './index'

export const bookmarksService = {
  /**
   * 获取书签列表
   */
  async getBookmarks(params?: BookmarkQueryParams) {
    const searchParams = new URLSearchParams()

    if (params?.keyword) searchParams.set('keyword', params.keyword)
    if (params?.tags) searchParams.set('tags', params.tags)
    if (params?.page_size) searchParams.set('page_size', params.page_size.toString())
    if (params?.page_cursor) searchParams.set('page_cursor', params.page_cursor)
    if (params?.sort) searchParams.set('sort', params.sort)
    if (params?.archived !== undefined) searchParams.set('archived', params.archived.toString())
    if (params?.pinned !== undefined) searchParams.set('pinned', params.pinned.toString())

    const query = searchParams.toString()
    const endpoint = query ? `/bookmarks?${query}` : '/bookmarks'

    const response = await apiClient.get<BookmarksResponse>(endpoint)
    return assertData(response.data, 'GET /bookmarks')
  },

  /**
   * 创建书签
   */
  async createBookmark(data: CreateBookmarkRequest) {
    const response = await apiClient.post<{ bookmark: Bookmark }>('/bookmarks', data)
    return assertData(response.data, 'POST /bookmarks').bookmark
  },

  /**
   * 更新书签
   */
  async updateBookmark(id: string, data: UpdateBookmarkRequest) {
    const response = await apiClient.patch<{ bookmark: Bookmark }>(`/bookmarks/${id}`, data)
    return assertData(response.data, `PATCH /bookmarks/${id}`).bookmark
  },

  /**
   * 删除书签
   */
  async deleteBookmark(id: string) {
    await apiClient.delete(`/bookmarks/${id}`)
  },

  /**
   * 恢复已删除的书签
   */
  async restoreBookmark(id: string) {
    const response = await apiClient.put<{ bookmark: Bookmark }>(`/bookmarks/${id}`)
    return assertData(response.data, `PUT /bookmarks/${id}`).bookmark
  },

  /**
   * 记录书签点击
   */
  async recordClick(id: string) {
    const response = await apiClient.post<{ message: string; clicked_at: string }>(`/bookmarks/${id}/click`)
    return assertData(response.data, `POST /bookmarks/${id}/click`)
  },

  /**
   * 批量操作书签
   */
  async batchAction(data: BatchActionRequest) {
    const response = await apiClient.patch<BatchActionResponse>('/bookmarks/bulk', data)
    return assertData(response.data, 'PATCH /bookmarks/bulk')
  },

  /**
   * 获取书签统计数据
   */
  async getStatistics(params: {
    granularity: 'day' | 'week' | 'month' | 'year'
    startDate: string
    endDate: string
  }) {
    const { granularity, startDate, endDate } = params
    const response = await apiClient.get(
      `/bookmarks/statistics?granularity=${granularity}&start_date=${startDate}&end_date=${endDate}`
    )
    return assertData(response.data, 'GET /bookmarks/statistics')
  },

  /**
   * 检查 URL 是否已存在
   */
  async checkUrlExists(url: string) {
    const response = await apiClient.get<{ exists: boolean; bookmark?: Bookmark }>(
      `/bookmarks/check-url?url=${encodeURIComponent(url)}`
    )
    return assertData(response.data, 'GET /bookmarks/check-url')
  },

  /**
   * 获取回收站书签列表
   */
  async getTrash(params?: { page_size?: number; page_cursor?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.page_size) searchParams.set('page_size', params.page_size.toString())
    if (params?.page_cursor) searchParams.set('page_cursor', params.page_cursor)
    
    const query = searchParams.toString()
    const endpoint = query ? `/bookmarks/trash?${query}` : '/bookmarks/trash'
    
    const response = await apiClient.get<BookmarksResponse>(endpoint)
    return assertData(response.data, 'GET /bookmarks/trash')
  },

  /**
   * 从回收站恢复书签
   */
  async restoreFromTrash(id: string) {
    const response = await apiClient.patch<{ bookmark: Bookmark }>(`/bookmarks/${id}/restore`, {})
    return assertData(response.data, `PATCH /bookmarks/${id}/restore`).bookmark
  },

  /**
   * 永久删除书签
   */
  async permanentDelete(id: string) {
    await apiClient.delete(`/bookmarks/${id}/permanent`)
  },

  /**
   * 清空回收站
   */
  async emptyTrash() {
    const response = await apiClient.delete<{ message: string; count: number }>('/bookmarks/trash/empty')
    return assertData(response.data, 'DELETE /bookmarks/trash/empty')
  },
}
