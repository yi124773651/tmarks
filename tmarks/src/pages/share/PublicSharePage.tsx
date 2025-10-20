import { useMemo, useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useParams } from 'react-router-dom'
import { TagSidebar } from '@/components/tags/TagSidebar'
import { BookmarkListContainer } from '@/components/bookmarks/BookmarkListContainer'
import { SortSelector, type SortOption } from '@/components/common/SortSelector'
import { usePublicShare } from '@/hooks/useShare'

const VIEW_MODES = ['list', 'minimal', 'card', 'title'] as const
type ViewMode = typeof VIEW_MODES[number]

interface MenuPosition {
  top: number
  left: number
  width?: number
}

function ViewModeIcon({ mode }: { mode: ViewMode }) {
  if (mode === 'card') {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5h6v6h-6zM4 15h6v6H4zM14 15h6v6h-6z" />
      </svg>
    )
  }

  if (mode === 'minimal') {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 5.5v13M17 5.5v13" />
      </svg>
    )
  }

  if (mode === 'title') {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h8M4 12h12M4 18h10" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5v2M18 11v2M16 17v2" />
      </svg>
    )
  }

  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18l-7 8v6l-4 2v-8L3 4z" />
    </svg>
  )
}



export function PublicSharePage() {
  const { slug = '' } = useParams()
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('card')
  const [sortBy, setSortBy] = useState<SortOption>('popular')
  const [tagLayout, setTagLayout] = useState<'grid' | 'masonry'>('grid')
  const [isTagSidebarOpen, setIsTagSidebarOpen] = useState(false)
  const viewMenuButtonRef = useRef<HTMLButtonElement>(null)
  const viewMenuContentRef = useRef<HTMLDivElement | null>(null)
  const [viewMenuPosition, setViewMenuPosition] = useState<MenuPosition | null>(null)
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false)
  const searchCleanupTimerRef = useRef<NodeJS.Timeout | null>(null)

  const shareQuery = usePublicShare(slug, Boolean(slug))
  const allBookmarks = shareQuery.data?.bookmarks || []

  const filteredBookmarks = useMemo(() => {
    const byTags = selectedTags.length
      ? allBookmarks.filter((bookmark) => {
          const bookmarkTagIds = bookmark.tags?.map((t) => t.id) || []
          return selectedTags.every((tagId) => bookmarkTagIds.includes(tagId))
        })
      : allBookmarks

    const byKeyword = searchKeyword.trim()
      ? byTags.filter((bookmark) => {
          const keyword = searchKeyword.trim().toLowerCase()
          return (
            bookmark.title.toLowerCase().includes(keyword) ||
            (bookmark.description || '').toLowerCase().includes(keyword) ||
            bookmark.url.toLowerCase().includes(keyword)
          )
        })
      : byTags

    const sorted = [...byKeyword].sort((a, b) => {
      switch (sortBy) {
        case 'updated':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        case 'pinned':
          if (a.is_pinned !== b.is_pinned) {
            return Number(b.is_pinned) - Number(a.is_pinned)
          }
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'popular':
          if ((b.click_count || 0) !== (a.click_count || 0)) {
            return (b.click_count || 0) - (a.click_count || 0)
          }
          if (b.last_clicked_at && a.last_clicked_at) {
            return new Date(b.last_clicked_at).getTime() - new Date(a.last_clicked_at).getTime()
          }
          return 0
        case 'created':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    return sorted
  }, [allBookmarks, selectedTags, searchKeyword, sortBy])

  const shareInfo = shareQuery.data?.profile
  const tags = shareQuery.data?.tags || []

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        isViewMenuOpen &&
        !viewMenuButtonRef.current?.contains(target) &&
        !viewMenuContentRef.current?.contains(target)
      ) {
        setIsViewMenuOpen(false)
        setViewMenuPosition(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isViewMenuOpen])

  // 搜索关键词自动清空逻辑 - 20秒后自动清除搜索内容
  useEffect(() => {
    // 清除之前的定时器
    if (searchCleanupTimerRef.current) {
      clearTimeout(searchCleanupTimerRef.current)
      searchCleanupTimerRef.current = null
    }

    // 如果有搜索关键词，设置20秒后自动清空
    if (searchKeyword.trim()) {
      searchCleanupTimerRef.current = setTimeout(() => {
        setSearchKeyword('')
      }, 20000) // 20秒
    }

    // 清理函数
    return () => {
      if (searchCleanupTimerRef.current) {
        clearTimeout(searchCleanupTimerRef.current)
        searchCleanupTimerRef.current = null
      }
    }
  }, [searchKeyword])

  const toggleViewMenu = () => {
    setIsViewMenuOpen((prev) => {
      const next = !prev
      if (next && viewMenuButtonRef.current) {
        const rect = viewMenuButtonRef.current.getBoundingClientRect()
        const width = Math.max(rect.width + 120, 200)
        const maxLeft = window.scrollX + window.innerWidth - width - 12
        const left = Math.min(rect.left + window.scrollX, maxLeft)
        setViewMenuPosition({
          top: rect.bottom + window.scrollY + 8,
          left,
          width,
        })
      } else {
        setViewMenuPosition(null)
      }
      return next
    })
  }

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    setIsViewMenuOpen(false)
    setViewMenuPosition(null)
    viewMenuContentRef.current = null
  }

  const viewMenuPortal =
    typeof document !== 'undefined' && isViewMenuOpen && viewMenuPosition
      ? createPortal(
          <div
            ref={(node) => {
              viewMenuContentRef.current = node
            }}
            className="rounded-lg border border-border shadow-lg overflow-hidden"
            style={{
              position: 'absolute',
              top: viewMenuPosition.top,
              left: viewMenuPosition.left,
              width: viewMenuPosition.width ?? 200,
              backgroundColor: 'var(--card)',
              zIndex: 1000,
            }}
          >
            {VIEW_MODES.map((modeOption) => (
              <button
                key={modeOption}
                type="button"
                onClick={() => handleViewModeChange(modeOption)}
                className={`w-full px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                  viewMode === modeOption
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-base-content/80 hover:bg-base-200/60'
                }`}
              >
                <ViewModeIcon mode={modeOption} />
                <span>
                  {modeOption === 'list'
                    ? '列表视图'
                    : modeOption === 'card'
                      ? '卡片视图'
                      : modeOption === 'minimal'
                        ? '极简列表'
                        : '标题瀑布'}
                </span>
              </button>
            ))}
          </div>,
          document.body,
        )
      : null

  return (
    <>
      {viewMenuPortal}
      <div className="w-full mx-auto py-3 sm:py-4 md:py-6 px-3 sm:px-4 md:px-6">
      {shareQuery.isLoading && (
        <div className="text-center text-base-content/60 py-24">正在加载公开书签...</div>
      )}

      {shareQuery.isError && !shareQuery.isLoading && (
        <div className="text-center text-base-content/60 py-24">分享链接无效或内容已下线。</div>
      )}

      {!shareQuery.isLoading && !shareQuery.isError && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 md:gap-6">
          <aside className="hidden lg:block lg:col-span-3 order-2 lg:order-1 fixed top-[calc(5rem+0.75rem)] sm:top-[calc(5rem+1rem)] md:top-[calc(5rem+1.5rem)] left-3 sm:left-4 md:left-6 bottom-3 w-[calc(25%-1.5rem)] z-40">
            <TagSidebar
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              bookmarks={allBookmarks}
              isLoadingBookmarks={shareQuery.isLoading}
              tagLayout={tagLayout}
              onTagLayoutChange={setTagLayout}
              readOnly
              availableTags={tags}
            />
          </aside>

          <main className="lg:col-span-9 lg:col-start-4 order-1 lg:order-2">
          <div className="space-y-3 sm:space-y-4 md:space-y-5">
            {/* 分享信息卡片 */}
            <div className="card shadow-float">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-primary">
                    {shareInfo?.title || `${shareInfo?.username || '访客'}的书签精选`}
                  </h1>
                  {shareInfo?.description && (
                    <p className="text-sm text-base-content/70 mt-1">{shareInfo.description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 顶部操作栏 */}
            <div className="card shadow-float">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                {/* 移动端标签抽屉按钮 + 搜索框 */}
                <div className="flex items-center gap-3 flex-1 w-full sm:min-w-[280px]">
                  {/* 标签抽屉按钮 - 仅移动端显示 */}
                  <button
                    onClick={() => setIsTagSidebarOpen(true)}
                    className="lg:hidden w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-float bg-card border border-border hover:bg-muted hover:border-primary/30 text-foreground"
                    title="打开标签"
                    aria-label="打开标签"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </button>

                  {/* 搜索框 */}
                  <div className="relative flex-1">
                    <svg className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-base-content/40 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      className="input w-full pl-10 sm:pl-12 h-11 sm:h-auto text-sm sm:text-base"
                      placeholder="搜索书签标题、描述或URL..."
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <SortSelector
                    value={sortBy}
                    onChange={setSortBy}
                  />

                  <button
                    ref={viewMenuButtonRef}
                    type="button"
                    onClick={toggleViewMenu}
                    className="w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-float bg-base-200 text-base-content/80 hover:bg-base-300"
                    title="切换视图"
                    aria-label="切换视图"
                  >
                    <ViewModeIcon mode={viewMode} />
                  </button>
                </div>
              </div>
            </div>

            <BookmarkListContainer
              bookmarks={filteredBookmarks}
              viewMode={viewMode}
              readOnly
            />
          </div>
          </main>
        </div>
      )}

      {/* 移动端标签抽屉 */}
      {isTagSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* 背景遮罩 */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsTagSidebarOpen(false)}
          />

          {/* 抽屉内容 */}
          <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-background border-r border-border shadow-xl animate-in slide-in-from-left duration-300">
            {/* 抽屉头部 */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-background">
              <h3 className="text-lg font-semibold text-foreground">标签筛选</h3>
              <button
                onClick={() => setIsTagSidebarOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
                aria-label="关闭标签抽屉"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 抽屉内容区域 */}
            <div className="flex-1 overflow-y-auto p-4 bg-background">
              <TagSidebar
                selectedTags={selectedTags}
                onTagsChange={(tags) => {
                  setSelectedTags(tags)
                  // 选择2个或更多标签后自动关闭抽屉
                  if (tags.length >= 2 && tags.length > selectedTags.length) {
                    setTimeout(() => setIsTagSidebarOpen(false), 500)
                  }
                }}
                tagLayout={tagLayout}
                onTagLayoutChange={setTagLayout}
                bookmarks={allBookmarks}
                isLoadingBookmarks={shareQuery.isLoading}
                readOnly
                availableTags={tags}
              />
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
