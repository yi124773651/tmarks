import { useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookmarkListLayout } from '@/components/bookmarks/BookmarkListLayout'
import { usePublicShare } from '@/hooks/useShare'
import { useBookmarkFilters } from '@/hooks/useBookmarkFilters'
import { useClientSideFilter } from '@/hooks/useClientSideFilter'

export function PublicSharePage() {
  const { t } = useTranslation('share')
  const { slug = '' } = useParams()

  const {
    selectedTags, setSelectedTags,
    debouncedSelectedTags,
    searchKeyword, setSearchKeyword,
    debouncedSearchKeyword,
    searchMode, setSearchMode,
    sortBy, handleSortChange,
    viewMode, handleViewModeChange,
    visibilityFilter, handleVisibilityChange,
    tagLayout, setTagLayout, handleTagLayoutChange,
  } = useBookmarkFilters()

  const shareQuery = usePublicShare(slug, true)
  const shareInfo = shareQuery.data?.profile
  const allBookmarks = shareQuery.data?.bookmarks || []
  const tags = shareQuery.data?.tags || []

  const {
    displayedBookmarks,
    tagFilteredBookmarks,
    sortedBookmarks,
    hasMore,
    loadMore,
  } = useClientSideFilter({
    bookmarks: allBookmarks,
    selectedTags: debouncedSelectedTags,
    searchKeyword: debouncedSearchKeyword,
    sortBy,
    visibilityFilter,
  })

  const handleSearchModeToggle = useCallback(
    () => setSearchMode(searchMode === 'bookmark' ? 'tag' : 'bookmark'),
    [searchMode, setSearchMode]
  )

  if (shareQuery.isLoading) {
    return <div className="text-center text-muted-foreground py-24">{t('loading')}</div>
  }
  if (shareQuery.isError) {
    return <div className="text-center text-muted-foreground py-24">{t('error')}</div>
  }

  return (
    <BookmarkListLayout
      readOnly
      bookmarks={displayedBookmarks}
      tagBookmarks={tagFilteredBookmarks}
      isLoading={shareQuery.isLoading}
      hasMore={hasMore}
      onLoadMore={loadMore}
      searchMode={searchMode}
      onSearchModeToggle={handleSearchModeToggle}
      searchKeyword={searchKeyword}
      onSearchKeywordChange={setSearchKeyword}
      sortBy={sortBy}
      onSortByChange={handleSortChange}
      visibilityFilter={visibilityFilter}
      onVisibilityChange={handleVisibilityChange}
      viewMode={viewMode}
      onViewModeChange={handleViewModeChange}
      selectedTags={selectedTags}
      onTagsChange={setSelectedTags}
      tagLayout={tagLayout}
      onTagLayoutChange={(l) => { handleTagLayoutChange(l); setTagLayout(l) }}
      debouncedSearchKeyword={debouncedSearchKeyword}
      availableTags={tags}
      i18nNs="share"
      headerSlot={
        <ShareHeader
          shareInfo={shareInfo}
          totalCount={allBookmarks.length}
          filteredCount={sortedBookmarks.length}
          t={t}
        />
      }
    />
  )
}

/** 分享信息头部卡片 */
function ShareHeader({ shareInfo, totalCount, filteredCount, t }: {
  shareInfo?: { title?: string | null; description?: string | null; username?: string } | null
  totalCount: number
  filteredCount: number
  t: (key: string, opts?: Record<string, unknown>) => string
}) {
  if (!shareInfo && totalCount === 0) return null

  return (
    <div className="card shadow-float p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-primary">
            {shareInfo?.title || (shareInfo?.username ? t('defaultTitle', { username: shareInfo.username }) : t('guestTitle'))}
          </h1>
          {shareInfo?.description && <p className="text-sm text-muted-foreground mt-1">{shareInfo.description}</p>}
        </div>
        {totalCount > 0 && (
          <div className="text-sm text-muted-foreground">
            {filteredCount === totalCount
              ? t('stats.total', { count: totalCount })
              : t('stats.filtered', { filtered: filteredCount, total: totalCount })}
          </div>
        )}
      </div>
    </div>
  )
}
