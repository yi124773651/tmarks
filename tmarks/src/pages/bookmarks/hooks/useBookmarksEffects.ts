import { useEffect } from 'react'
import { usePreferences, useUpdatePreferences } from '@/hooks/usePreferences'
import { getStoredViewModeUpdatedAt, setStoredViewMode } from '@/hooks/useBookmarkFilters'
import { ViewMode } from '@/lib/constants/bookmarks'
import type { SortOption } from '@/components/common/SortSelector'

interface UseBookmarksEffectsProps {
  selectedTags: string[]
  setSelectedTags: (tags: string[]) => void
  searchKeyword: string
  setSearchKeyword: (keyword: string) => void
  setViewMode: (mode: ViewMode) => void
  setTagLayout: (layout: 'grid' | 'masonry') => void
  setSortBy: (sort: SortOption) => void
  sortByInitialized: boolean
  setSortByInitialized: (initialized: boolean) => void
  autoCleanupTimerRef: React.MutableRefObject<NodeJS.Timeout | null>
}

/**
 * 书签页面的副作用管理 Hook
 */
export function useBookmarksEffects({
  selectedTags,
  setSelectedTags,
  searchKeyword,
  setSearchKeyword,
  setViewMode,
  setTagLayout,
  setSortBy,
  sortByInitialized,
  setSortByInitialized,
  autoCleanupTimerRef,
}: UseBookmarksEffectsProps) {
  const { data: preferences } = usePreferences()
  const updatePreferences = useUpdatePreferences()

  // 初始化视图模式和排序方式
  useEffect(() => {
    if (preferences?.view_mode) {
      const storedUpdatedAt = getStoredViewModeUpdatedAt()
      const serverUpdatedAt = preferences.updated_at ? new Date(preferences.updated_at).getTime() : 0

      if (serverUpdatedAt > storedUpdatedAt) {
        setViewMode(preferences.view_mode)
        setStoredViewMode(preferences.view_mode, serverUpdatedAt)
      }
    }

    if (preferences?.tag_layout) {
      setTagLayout(preferences.tag_layout)
    }

    if (preferences?.sort_by && !sortByInitialized) {
      setSortBy(preferences.sort_by)
      setSortByInitialized(true)
    }
  }, [preferences, sortByInitialized, setViewMode, setTagLayout, setSortBy, setSortByInitialized])

  // 标签自动清空
  useEffect(() => {
    const enableAutoClear = preferences?.enable_tag_selection_auto_clear ?? false
    const clearSeconds = preferences?.tag_selection_auto_clear_seconds ?? 30

    if (enableAutoClear && selectedTags.length > 0) {
      if (autoCleanupTimerRef.current) clearTimeout(autoCleanupTimerRef.current)
      autoCleanupTimerRef.current = setTimeout(() => {
        setSelectedTags([])
      }, clearSeconds * 1000)
    }

    return () => {
      if (autoCleanupTimerRef.current) clearTimeout(autoCleanupTimerRef.current)
    }
  }, [selectedTags, preferences, autoCleanupTimerRef, setSelectedTags])

  // 搜索自动清空
  useEffect(() => {
    const enableAutoClear = preferences?.enable_search_auto_clear ?? true
    const clearSeconds = preferences?.search_auto_clear_seconds ?? 15

    if (enableAutoClear && searchKeyword.trim()) {
      const timer = setTimeout(() => {
        setSearchKeyword('')
      }, clearSeconds * 1000)
      return () => clearTimeout(timer)
    }
  }, [searchKeyword, preferences, setSearchKeyword])

  return {
    updatePreferences,
    handleViewModeSync: (mode: ViewMode) => {
      setStoredViewMode(mode)
      updatePreferences.mutate({ view_mode: mode })
    },
    handleSortSync: (sort: SortOption) => {
      updatePreferences.mutate({ sort_by: sort })
    },
    handleTagLayoutSync: (layout: 'grid' | 'masonry') => {
      updatePreferences.mutate({ tag_layout: layout })
    }
  }
}
