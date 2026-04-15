/**
 * 共享搜索工具栏组件
 * 搜索输入 + 排序/可见性/视图模式切换
 * 被 BookmarksPage (TopActionBar) 和 PublicSharePage 复用
 */

import { ReactNode } from 'react'
import { Tag as TagIcon, Search, Bookmark as BookmarkIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ViewMode, VisibilityFilter } from '@/lib/constants/bookmarks'
import type { SortOption } from '@/components/common/SortSelector'
import { ViewModeIcon, VisibilityIcon, SortIcon } from '@/components/common/BookmarkIcons'

interface SearchToolbarProps {
  searchMode: 'bookmark' | 'tag'
  onSearchModeToggle: () => void
  searchKeyword: string
  onSearchKeywordChange: (keyword: string) => void
  sortBy: SortOption
  onSortByChange: () => void
  visibilityFilter: VisibilityFilter
  onVisibilityChange: () => void
  viewMode: ViewMode
  onViewModeChange: () => void
  /** 移动端标签抽屉触发按钮 */
  onOpenTagDrawer?: () => void
  /** 额外的操作按钮（批量模式、添加、回收站等） */
  extraActions?: ReactNode
  /** 搜索框 placeholder 的 i18n namespace */
  i18nNs?: string
}

export function SearchToolbar({
  searchMode,
  onSearchModeToggle,
  searchKeyword,
  onSearchKeywordChange,
  sortBy,
  onSortByChange,
  visibilityFilter,
  onVisibilityChange,
  viewMode,
  onViewModeChange,
  onOpenTagDrawer,
  extraActions,
  i18nNs = 'bookmarks',
}: SearchToolbarProps) {
  const { t } = useTranslation(i18nNs)

  const sortLabel = t(`sort.${sortBy}`, sortBy)
  const visLabel = t(`filter.${visibilityFilter}`, visibilityFilter)
  const viewLabel = t(`viewMode.${viewMode}`, viewMode)

  return (
    <>
      {/* Mobile: two-row layout */}
      <div className="flex flex-col gap-3 w-full lg:hidden">
        <div className="flex items-center gap-3 w-full">
          {onOpenTagDrawer && (
            <button
              onClick={onOpenTagDrawer}
              className="group w-11 h-11 rounded-xl flex items-center justify-center transition-all bg-card border border-border hover:bg-muted text-foreground shadow-sm flex-shrink-0"
            >
              <TagIcon className="w-5 h-5" />
            </button>
          )}
          <SearchInput
            searchMode={searchMode}
            onSearchModeToggle={onSearchModeToggle}
            searchKeyword={searchKeyword}
            onSearchKeywordChange={onSearchKeywordChange}
            placeholder={searchMode === 'bookmark' ? t('search.placeholder', t('search.bookmarkPlaceholder', '')) : t('search.tagPlaceholder', '')}
          />
        </div>
        <div className="flex items-center gap-1 w-full sm:w-auto justify-center">
          <ToolButton onClick={onSortByChange} title={sortLabel}><SortIcon sort={sortBy} /></ToolButton>
          <ToolButton onClick={onVisibilityChange} title={visLabel} active={visibilityFilter !== 'all'}><VisibilityIcon filter={visibilityFilter} /></ToolButton>
          <ToolButton onClick={onViewModeChange} title={viewLabel}><ViewModeIcon mode={viewMode} /></ToolButton>
          {extraActions}
        </div>
      </div>

      {/* PC: single-row layout */}
      <div className="hidden lg:flex items-center gap-3 w-full">
        <SearchInput
          searchMode={searchMode}
          onSearchModeToggle={onSearchModeToggle}
          searchKeyword={searchKeyword}
          onSearchKeywordChange={onSearchKeywordChange}
          placeholder={searchMode === 'bookmark' ? t('search.placeholder', t('search.bookmarkPlaceholder', '')) : t('search.tagPlaceholder', '')}
        />
        <div className="flex items-center gap-2 flex-shrink-0">
          <ToolButton onClick={onSortByChange} title={sortLabel}><SortIcon sort={sortBy} /></ToolButton>
          <ToolButton onClick={onVisibilityChange} title={visLabel} active={visibilityFilter !== 'all'}><VisibilityIcon filter={visibilityFilter} /></ToolButton>
          <ToolButton onClick={onViewModeChange} title={viewLabel}><ViewModeIcon mode={viewMode} /></ToolButton>
          {extraActions}
        </div>
      </div>
    </>
  )
}

function SearchInput({
  searchMode,
  onSearchModeToggle,
  searchKeyword,
  onSearchKeywordChange,
  placeholder,
}: {
  searchMode: 'bookmark' | 'tag'
  onSearchModeToggle: () => void
  searchKeyword: string
  onSearchKeywordChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div className="flex-1 min-w-0">
      <div className="relative w-full">
        <button
          onClick={onSearchModeToggle}
          className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center transition-all hover:text-primary hover:scale-110"
        >
          {searchMode === 'bookmark' ? <BookmarkIcon className="w-5 h-5" /> : <TagIcon className="w-5 h-5" />}
        </button>
        <Search className="absolute left-10 sm:left-12 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          className="input w-full !pl-16 sm:!pl-[4.5rem] h-11 sm:h-auto text-sm sm:text-base"
          placeholder={placeholder}
          value={searchKeyword}
          onChange={(e) => onSearchKeywordChange(e.target.value)}
        />
      </div>
    </div>
  )
}

function ToolButton({
  onClick,
  title,
  active,
  children,
}: {
  onClick: () => void
  title: string
  active?: boolean
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`btn btn-sm btn-ghost p-2 flex-shrink-0 ${active ? 'text-primary' : ''}`}
      title={title}
    >
      {children}
    </button>
  )
}
