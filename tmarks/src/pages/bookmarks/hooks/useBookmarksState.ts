import { useState, useRef } from 'react'
import type { Bookmark } from '@/lib/types'
import { useBookmarkFilters } from '@/hooks/useBookmarkFilters'

/**
 * 书签页面的状态管理 Hook
 */
export function useBookmarksState() {
  const filters = useBookmarkFilters()
  
  // 表单和编辑状态
  const [showForm, setShowForm] = useState(false)
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null)

  // 批量操作状态
  const [batchMode, setBatchMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // UI 状态
  const [isTagSidebarOpen, setIsTagSidebarOpen] = useState(false)
  const [sortByInitialized, setSortByInitialized] = useState(false)

  // Refs
  const previousCountRef = useRef(0)
  const autoCleanupTimerRef = useRef<NodeJS.Timeout | null>(null)

  return {
    ...filters,

    // 表单和编辑
    showForm,
    setShowForm,
    editingBookmark,
    setEditingBookmark,

    // 批量操作
    batchMode,
    setBatchMode,
    selectedIds,
    setSelectedIds,

    // UI
    isTagSidebarOpen,
    setIsTagSidebarOpen,
    sortByInitialized,
    setSortByInitialized,

    // Refs
    previousCountRef,
    autoCleanupTimerRef,
    searchCleanupTimerRef: { current: null }, // Mock for compatibility if needed, but useBookmarkFilters handles it now
    tagDebounceTimerRef: { current: null }, // Same here
  }
}
