/**
 * 客户端过滤/排序/分页 hook
 * 用于公开分享页等一次性加载全量数据后在前端处理的场景
 */

import { useMemo, useState, useCallback } from 'react'
import type { Bookmark } from '@/lib/types'
import type { SortOption } from '@/components/common/SortSelector'
import type { VisibilityFilter } from '@/lib/constants/bookmarks'

interface UseClientSideFilterOptions {
  bookmarks: Bookmark[]
  selectedTags: string[]
  searchKeyword: string
  sortBy: SortOption
  visibilityFilter: VisibilityFilter
  pageSize?: number
}

interface UseClientSideFilterResult {
  /** 经过筛选+排序的完整列表 */
  sortedBookmarks: Bookmark[]
  /** 当前页显示的切片 */
  displayedBookmarks: Bookmark[]
  /** 经过标签过滤后的列表（供 TagSidebar 统计用） */
  tagFilteredBookmarks: Bookmark[]
  hasMore: boolean
  currentPage: number
  loadMore: () => void
  resetPage: () => void
}

export function useClientSideFilter({
  bookmarks,
  selectedTags,
  searchKeyword,
  sortBy,
  visibilityFilter,
  pageSize = 30,
}: UseClientSideFilterOptions): UseClientSideFilterResult {
  const [currentPage, setCurrentPage] = useState(1)

  // 1. Tag filter
  const tagFilteredBookmarks = useMemo(() => {
    if (selectedTags.length === 0) return bookmarks
    return bookmarks.filter((b) =>
      selectedTags.every((tagId) => b.tags?.some((t) => t.id === tagId))
    )
  }, [bookmarks, selectedTags])

  // 2. Keyword search
  const searchFiltered = useMemo(() => {
    const kw = searchKeyword.trim().toLowerCase()
    if (!kw) return tagFilteredBookmarks
    return tagFilteredBookmarks.filter((b) => {
      return (
        b.title.toLowerCase().includes(kw) ||
        b.url.toLowerCase().includes(kw) ||
        b.description?.toLowerCase().includes(kw) ||
        b.ai_summary?.toLowerCase().includes(kw) ||
        b.tags?.some((tag) => tag.name.toLowerCase().includes(kw))
      )
    })
  }, [tagFilteredBookmarks, searchKeyword])

  // 3. Visibility filter
  const visFiltered = useMemo(() => {
    if (visibilityFilter === 'all') return searchFiltered
    return searchFiltered.filter((b) =>
      visibilityFilter === 'public' ? b.is_public : !b.is_public
    )
  }, [searchFiltered, visibilityFilter])

  // 4. Sort
  const sortedBookmarks = useMemo(() => {
    const result = [...visFiltered]
    result.sort((a, b) => {
      switch (sortBy) {
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'updated':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        case 'pinned':
          if (a.is_pinned && !b.is_pinned) return -1
          if (!a.is_pinned && b.is_pinned) return 1
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'popular':
          return (b.click_count || 0) - (a.click_count || 0)
        default:
          return 0
      }
    })
    return result
  }, [visFiltered, sortBy])

  // 5. Paginate
  const displayedBookmarks = useMemo(() => {
    return sortedBookmarks.slice(0, currentPage * pageSize)
  }, [sortedBookmarks, currentPage, pageSize])

  const hasMore = sortedBookmarks.length > displayedBookmarks.length

  const loadMore = useCallback(() => setCurrentPage((p) => p + 1), [])
  const resetPage = useCallback(() => setCurrentPage(1), [])

  return {
    sortedBookmarks,
    displayedBookmarks,
    tagFilteredBookmarks,
    hasMore,
    currentPage,
    loadMore,
    resetPage,
  }
}
