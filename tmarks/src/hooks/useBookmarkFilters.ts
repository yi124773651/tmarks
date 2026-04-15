import { useState, useRef, useEffect, useCallback } from 'react'
import type { SortOption } from '@/components/common/SortSelector'
import {
  VIEW_MODES,
  ViewMode,
  VisibilityFilter,
  VISIBILITY_FILTERS,
  SORT_OPTIONS,
  VIEW_MODE_STORAGE_KEY,
  VIEW_MODE_UPDATED_AT_STORAGE_KEY
} from '@/lib/constants/bookmarks'

function isValidViewMode(value: string | null): value is ViewMode {
  return !!value && (VIEW_MODES as readonly string[]).includes(value)
}

function getStoredViewMode(): ViewMode | null {
  if (typeof window === 'undefined') return null
  const stored = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY)
  return isValidViewMode(stored) ? stored : null
}

export function getStoredViewModeUpdatedAt(): number {
  if (typeof window === 'undefined') return 0
  const stored = window.localStorage.getItem(VIEW_MODE_UPDATED_AT_STORAGE_KEY)
  const timestamp = stored ? Number(stored) : 0
  return Number.isFinite(timestamp) ? timestamp : 0
}

export function setStoredViewMode(mode: ViewMode, updatedAt?: number) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode)
  window.localStorage.setItem(
    VIEW_MODE_UPDATED_AT_STORAGE_KEY,
    String(typeof updatedAt === 'number' && Number.isFinite(updatedAt) ? updatedAt : Date.now()),
  )
}

export function useBookmarkFilters() {
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [debouncedSelectedTags, setDebouncedSelectedTags] = useState<string[]>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [debouncedSearchKeyword, setDebouncedSearchKeyword] = useState('')
  const [searchMode, setSearchMode] = useState<'bookmark' | 'tag'>('bookmark')
  const [sortBy, setSortBy] = useState<SortOption>('created')
  const [viewMode, setViewMode] = useState<ViewMode>(() => getStoredViewMode() ?? 'card')
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all')
  const [tagLayout, setTagLayout] = useState<'grid' | 'masonry'>('grid')

  const tagDebounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const searchCleanupTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 标签搜索防抖
  useEffect(() => {
    if (tagDebounceTimerRef.current) clearTimeout(tagDebounceTimerRef.current)
    tagDebounceTimerRef.current = setTimeout(() => {
      setDebouncedSelectedTags(selectedTags)
    }, 300)
    return () => {
      if (tagDebounceTimerRef.current) clearTimeout(tagDebounceTimerRef.current)
    }
  }, [selectedTags])

  // 关键词搜索防抖
  useEffect(() => {
    if (searchCleanupTimerRef.current) clearTimeout(searchCleanupTimerRef.current)
    searchCleanupTimerRef.current = setTimeout(() => {
      setDebouncedSearchKeyword(searchKeyword)
    }, 400)
    return () => {
      if (searchCleanupTimerRef.current) clearTimeout(searchCleanupTimerRef.current)
    }
  }, [searchKeyword])

  const handleViewModeChange = useCallback(() => {
    const currentIndex = VIEW_MODES.indexOf(viewMode)
    const nextMode = VIEW_MODES[(currentIndex + 1) % VIEW_MODES.length]!
    setViewMode(nextMode)
    setStoredViewMode(nextMode)
    return nextMode
  }, [viewMode])

  const handleSortChange = useCallback(() => {
    const currentIndex = SORT_OPTIONS.indexOf(sortBy)
    const nextSort = SORT_OPTIONS[(currentIndex + 1) % SORT_OPTIONS.length]!
    setSortBy(nextSort)
    return nextSort
  }, [sortBy])

  const handleVisibilityChange = useCallback(() => {
    const currentIndex = VISIBILITY_FILTERS.indexOf(visibilityFilter)
    const nextFilter = VISIBILITY_FILTERS[(currentIndex + 1) % VISIBILITY_FILTERS.length]!
    setVisibilityFilter(nextFilter)
    return nextFilter
  }, [visibilityFilter])

  const handleTagLayoutChange = useCallback((layout: 'grid' | 'masonry') => {
    setTagLayout(layout)
  }, [])

  return {
    selectedTags,
    setSelectedTags,
    debouncedSelectedTags,
    searchKeyword,
    setSearchKeyword,
    debouncedSearchKeyword,
    searchMode,
    setSearchMode,
    sortBy,
    setSortBy,
    handleSortChange,
    viewMode,
    setViewMode,
    handleViewModeChange,
    visibilityFilter,
    setVisibilityFilter,
    handleVisibilityChange,
    tagLayout,
    setTagLayout,
    handleTagLayoutChange,
  }
}
