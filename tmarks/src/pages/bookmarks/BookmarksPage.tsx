import { useMemo, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle, CheckSquare, Plus, Trash2 } from 'lucide-react'
import { BookmarkForm } from '@/components/bookmarks/BookmarkForm'
import { BatchActionBar } from '@/components/bookmarks/BatchActionBar'
import { BookmarkListLayout } from '@/components/bookmarks/BookmarkListLayout'
import { BatchSelectionPrompt } from './components/BatchSelectionPrompt'
import { useBookmarksState } from './hooks/useBookmarksState'
import { useBookmarksEffects } from './hooks/useBookmarksEffects'
import { useInfiniteBookmarks } from '@/hooks/useBookmarks'
import { useTags } from '@/hooks/useTags'
import type { Bookmark, BookmarkQueryParams } from '@/lib/types'

export function BookmarksPage() {
  const { t } = useTranslation('bookmarks')
  const state = useBookmarksState()
  const {
    selectedTags, setSelectedTags, debouncedSelectedTags,
    searchKeyword, setSearchKeyword, debouncedSearchKeyword,
    searchMode, setSearchMode,
    sortBy, setSortBy, handleSortChange,
    viewMode, setViewMode, handleViewModeChange,
    visibilityFilter, setVisibilityFilter,
    tagLayout, setTagLayout, handleTagLayoutChange,
    showForm, setShowForm, editingBookmark, setEditingBookmark,
    batchMode, setBatchMode, selectedIds, setSelectedIds,
    sortByInitialized, setSortByInitialized,
    previousCountRef, autoCleanupTimerRef,
  } = state

  const { handleViewModeSync, handleSortSync, handleTagLayoutSync } = useBookmarksEffects({
    selectedTags, setSelectedTags, searchKeyword, setSearchKeyword,
    setViewMode, setTagLayout, setSortBy,
    sortByInitialized, setSortByInitialized, autoCleanupTimerRef,
  })

  const queryParams = useMemo<BookmarkQueryParams>(() => {
    const params: BookmarkQueryParams = { sort: sortBy }
    if (searchMode === 'bookmark' && debouncedSearchKeyword.trim()) {
      params.keyword = debouncedSearchKeyword.trim()
    }
    if (debouncedSelectedTags.length > 0) {
      params.tags = debouncedSelectedTags.join(',')
    }
    return params
  }, [searchMode, debouncedSearchKeyword, debouncedSelectedTags, sortBy])

  const bookmarksQuery = useInfiniteBookmarks(queryParams)
  const { refetch: refetchTags } = useTags()

  const bookmarks = useMemo(() => {
    if (!bookmarksQuery.data?.pages?.length) return [] as Bookmark[]
    const uniqueMap = new Map<string, Bookmark>()
    bookmarksQuery.data.pages.flatMap(p => p.bookmarks).forEach(b => {
      const existing = uniqueMap.get(b.id)
      if (!existing || (b.tags?.length ?? 0) > (existing.tags?.length ?? 0)) {
        uniqueMap.set(b.id, b)
      } else if ((b.tags?.length ?? 0) === (existing.tags?.length ?? 0)) {
        uniqueMap.set(b.id, { ...existing, ...b })
      }
    })
    return Array.from(uniqueMap.values())
  }, [bookmarksQuery.data])

  const serverRelatedTagIds = useMemo(() =>
    bookmarksQuery.data?.pages?.[0]?.meta?.related_tag_ids
  , [bookmarksQuery.data?.pages])

  const filteredBookmarks = useMemo(() => {
    if (visibilityFilter === 'all') return bookmarks
    return bookmarks.filter(b => visibilityFilter === 'public' ? b.is_public : !b.is_public)
  }, [bookmarks, visibilityFilter])

  const handleOpenForm = useCallback((bookmark?: Bookmark) => {
    setEditingBookmark(bookmark || null)
    setShowForm(true)
  }, [setEditingBookmark, setShowForm])

  const isInitialLoading = bookmarksQuery.isLoading && bookmarks.length === 0
  useEffect(() => {
    if (filteredBookmarks.length > 0) previousCountRef.current = filteredBookmarks.length
  }, [filteredBookmarks.length, previousCountRef])

  const handleVisibilityChange = useCallback(() => {
    setVisibilityFilter(
      visibilityFilter === 'all' ? 'public' : visibilityFilter === 'public' ? 'private' : 'all'
    )
  }, [visibilityFilter, setVisibilityFilter])

  const extraActions = (
    <>
      <button
        onClick={() => { setBatchMode(!batchMode); if (batchMode) setSelectedIds([]) }}
        className={`btn btn-sm p-2 flex-shrink-0 ${batchMode ? 'btn-primary' : 'btn-ghost'}`}
        title={batchMode ? t('toolbar.exitBatchMode') : t('toolbar.batchMode')}
      >
        <CheckCircle className="w-4 h-4 lg:hidden" />
        <CheckSquare className="w-5 h-5 hidden lg:block" />
      </button>
      <Link to="/bookmarks/trash" className="btn btn-sm btn-ghost p-2 flex-shrink-0" title={t('toolbar.trash')}>
        <Trash2 className="w-4 h-4 lg:w-5 lg:h-5" />
      </Link>
      <button onClick={() => handleOpenForm()} className="btn btn-sm btn-primary p-2 flex-shrink-0" title={t('toolbar.addBookmark')}>
        <Plus className="w-4 h-4 lg:w-5 lg:h-5" strokeWidth={2.5} />
      </button>
    </>
  )

  return (
    <>
      <BookmarkListLayout
        fullScreen
        bookmarks={filteredBookmarks}
        isLoading={isInitialLoading || bookmarksQuery.isFetching}
        isError={bookmarksQuery.isError}
        onRetry={() => bookmarksQuery.refetch()}
        hasMore={bookmarksQuery.hasNextPage ?? false}
        isFetchingMore={bookmarksQuery.isFetchingNextPage}
        onLoadMore={() => bookmarksQuery.fetchNextPage()}
        totalLoaded={bookmarks.length}
        searchMode={searchMode}
        onSearchModeToggle={() => setSearchMode(searchMode === 'bookmark' ? 'tag' : 'bookmark')}
        searchKeyword={searchKeyword}
        onSearchKeywordChange={setSearchKeyword}
        sortBy={sortBy}
        onSortByChange={() => handleSortSync(handleSortChange())}
        visibilityFilter={visibilityFilter}
        onVisibilityChange={handleVisibilityChange}
        viewMode={viewMode}
        onViewModeChange={() => handleViewModeSync(handleViewModeChange())}
        selectedTags={selectedTags}
        onTagsChange={setSelectedTags}
        tagLayout={tagLayout}
        onTagLayoutChange={(l) => { handleTagLayoutChange(l); handleTagLayoutSync(l) }}
        debouncedSearchKeyword={debouncedSearchKeyword}
        relatedTagIds={serverRelatedTagIds}
        batchMode={batchMode}
        selectedIds={selectedIds}
        onToggleSelect={(id) => setSelectedIds(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id])}
        onEdit={handleOpenForm}
        extraActions={extraActions}
        selectionPromptSlot={
          <BatchSelectionPrompt
            batchMode={batchMode} selectedCount={selectedIds.length}
            totalCount={filteredBookmarks.length}
            onSelectAll={() => setSelectedIds(filteredBookmarks.map(b => b.id))}
            onClearSelection={() => { setSelectedIds([]); setBatchMode(false) }}
          />
        }
        footerSlot={
          <>
            {showForm && (
              <BookmarkForm
                bookmark={editingBookmark} onClose={() => setShowForm(false)}
                onSuccess={() => { bookmarksQuery.refetch(); refetchTags() }}
              />
            )}
            {batchMode && selectedIds.length > 0 && (
              <BatchActionBar
                selectedIds={selectedIds} onClearSelection={() => { setSelectedIds([]); setBatchMode(false) }}
                onSuccess={() => { setSelectedIds([]); setBatchMode(false); bookmarksQuery.refetch(); refetchTags() }}
              />
            )}
          </>
        }
      />
    </>
  )
}
