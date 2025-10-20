import { useRef, memo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { Bookmark } from '@/lib/types'
import { useRecordClick } from '@/hooks/useBookmarks'

interface BookmarkListViewProps {
  bookmarks: Bookmark[]
  onEdit?: (bookmark: Bookmark) => void
  readOnly?: boolean
}

export function BookmarkListView({
  bookmarks,
  onEdit,
  readOnly = false,
}: BookmarkListViewProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  // 只有超过 200 个书签时才启用虚拟滚动
  const enableVirtualization = bookmarks.length > 200

  const virtualizer = useVirtualizer({
    count: bookmarks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 150, // 估计每行高度
    overscan: 5, // 预渲染额外的行
    enabled: enableVirtualization,
  })

  return (
    <div
      ref={parentRef}
      className="space-y-2 sm:space-y-3 scrollbar-hide"
      style={enableVirtualization ? { height: '600px', overflow: 'auto' } : undefined}
    >
      {enableVirtualization && (
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const bookmark = bookmarks[virtualRow.index]
            if (!bookmark) return null
            return (
              <div
                key={bookmark.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <BookmarkListItem
                  bookmark={bookmark}
                  onEdit={onEdit ? () => onEdit(bookmark) : undefined}
                  readOnly={readOnly}
                />
              </div>
            )
          })}
        </div>
      )}

      {!enableVirtualization &&
        bookmarks.map((bookmark) => (
          <BookmarkListItem
            key={bookmark.id}
            bookmark={bookmark}
            onEdit={onEdit ? () => onEdit(bookmark) : undefined}
            readOnly={readOnly}
          />
        ))}
    </div>
  )
}

interface BookmarkListItemProps {
  bookmark: Bookmark
  onEdit?: () => void
  readOnly?: boolean
}

const BookmarkListItem = memo(function BookmarkListItem({
  bookmark,
  onEdit,
  readOnly = false,
}: BookmarkListItemProps) {
  const recordClick = useRecordClick()

  const handleVisit = () => {
    // 记录点击统计
    if (!readOnly) {
      recordClick.mutate(bookmark.id)
    }
    // 打开书签
    window.open(bookmark.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="card hover:shadow-lg transition-all relative group mb-2 sm:mb-3 touch-manipulation">
      {/* 编辑按钮 */}
      {!!onEdit && !readOnly && (
        <button
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onEdit()
          }}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 w-9 h-9 sm:w-8 sm:h-8 rounded-lg bg-card hover:bg-muted backdrop-blur-sm flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all hover:scale-110 shadow-lg z-10 touch-manipulation"
          title="编辑"
        >
          <svg className="w-4 h-4 text-base-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">

        {/* 封面图 */}
        {bookmark.cover_image && (
          <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg overflow-hidden bg-base-200">
            <img
              src={bookmark.cover_image}
              alt={bookmark.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        )}

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* 标题 */}
              <h3 className="font-semibold text-base mb-1 flex items-center gap-2">
                <button
                  onClick={handleVisit}
                  className="hover:text-primary transition-colors text-left"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    wordBreak: 'break-word'
                  }}
                  title={bookmark.title}
                >
                  {bookmark.title}
                </button>
                {!!bookmark.is_pinned && (
                  <span className="bg-warning text-warning-content text-xs px-2 py-0.5 rounded-full font-medium" title="已置顶">
                    置顶
                  </span>
                )}
                {!!bookmark.is_archived && (
                  <span className="bg-base-content/40 text-card text-xs px-2 py-0.5 rounded-full font-medium" title="已归档">
                    归档
                  </span>
                )}
              </h3>

              {/* URL */}
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline block mb-2"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  wordBreak: 'break-all'
                }}
              >
                {bookmark.url}
              </a>

              {/* 描述 */}
              {bookmark.description && (
                <p className="text-sm text-base-content/70 line-clamp-2 mb-2">
                  {bookmark.description}
                </p>
              )}

              {/* 标签 */}
              {bookmark.tags && bookmark.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {bookmark.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            </div>
        </div>
      </div>
    </div>
  )
})
