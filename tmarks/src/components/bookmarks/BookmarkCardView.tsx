import type { Bookmark } from '@/lib/types'
import { AdaptiveImage } from '@/components/common/AdaptiveImage'
import { useRecordClick } from '@/hooks/useBookmarks'
import { useState, useEffect, useRef } from 'react'
import type { ImageType } from '@/lib/image-utils'

interface BookmarkCardViewProps {
  bookmarks: Bookmark[]
  onEdit?: (bookmark: Bookmark) => void
  readOnly?: boolean
}

export function BookmarkCardView({
  bookmarks,
  onEdit,
  readOnly = false,
}: BookmarkCardViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [columns, setColumns] = useState(1)

  // 动态计算列数
  useEffect(() => {
    const updateColumns = () => {
      if (!containerRef.current) return

      const containerWidth = containerRef.current.offsetWidth
      // 每列最小宽度280px，间距16px
      const minColumnWidth = 280
      const gap = 16

      // 计算可以容纳的列数
      let cols = 1
      for (let i = 1; i <= 4; i++) {
        const totalWidth = i * minColumnWidth + (i - 1) * gap
        if (containerWidth >= totalWidth) {
          cols = i
        } else {
          break
        }
      }

      setColumns(cols)
    }

    // 初始计算
    updateColumns()

    // 监听窗口大小变化
    const resizeObserver = new ResizeObserver(updateColumns)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="gap-3 sm:gap-4"
      style={{
        columnCount: columns,
        columnGap: '1rem'
      } as React.CSSProperties}
    >
      {bookmarks.map((bookmark) => (
        <div key={bookmark.id} className="break-inside-avoid mb-3 sm:mb-4">
          <BookmarkCard
            bookmark={bookmark}
            onEdit={onEdit ? () => onEdit(bookmark) : undefined}
            readOnly={readOnly}
          />
        </div>
      ))}
    </div>
  )
}

interface BookmarkCardProps {
  bookmark: Bookmark
  onEdit?: () => void
  readOnly?: boolean
}

function BookmarkCard({
  bookmark,
  onEdit,
  readOnly = false,
}: BookmarkCardProps) {
  const [imageType, setImageType] = useState<ImageType>('unknown')
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
    <div
      className="card hover:shadow-xl transition-all relative group flex flex-col cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/60 touch-manipulation"
      role="link"
      tabIndex={0}
      onClick={handleVisit}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          handleVisit()
        }
      }}
      aria-label={`打开书签 ${bookmark.title}`}
    >
      {/* 编辑按钮 */}
      {!!onEdit && !readOnly && (
        <button
          onClick={(event) => {
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

      {/* 图片区域 - 根据图片类型自适应布局 */}
      {bookmark.cover_image && bookmark.cover_image.trim() !== '' && (
        <div
          className={`relative bg-base-200 overflow-hidden flex-shrink-0 ${
            imageType === 'favicon'
              ? 'h-20 flex items-center justify-center'
              : 'h-32'
          }`}
          style={{ borderTopLeftRadius: 'calc(var(--radius) * 1.5)', borderTopRightRadius: 'calc(var(--radius) * 1.5)' }}
        >
          <AdaptiveImage
            src={bookmark.cover_image}
            alt={bookmark.title}
            className={
              imageType === 'favicon'
                ? 'w-12 h-12 object-contain'
                : 'w-full h-full object-cover'
            }
            onTypeDetected={setImageType}
          />
        </div>
      )}

      {/* 内容区 */}
      <div className="flex flex-col p-3 gap-2 relative">
        {/* 状态标识 */}
        {(!!bookmark.is_pinned || !!bookmark.is_archived) && (
          <div className="flex gap-1 mb-1">
            {!!bookmark.is_pinned && (
              <span className="bg-warning text-warning-content text-xs px-1.5 py-0.5 rounded-full font-medium">
                置顶
              </span>
            )}
            {!!bookmark.is_archived && (
              <span className="bg-base-content/40 text-base-100 text-xs px-1.5 py-0.5 rounded-full font-medium">
                归档
              </span>
            )}
          </div>
        )}

                {/* 标题 */}
        <h3
          className="font-semibold text-sm line-clamp-2 hover:text-primary transition-colors leading-snug"
          title={bookmark.title}
        >
          {bookmark.title}
        </h3>

        {/* 描述 */}
        {bookmark.description && (
          <p className="text-xs text-base-content/70 line-clamp-3 leading-relaxed">
            {bookmark.description}
          </p>
        )}

        {/* 标签 */}
        {bookmark.tags && bookmark.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {bookmark.tags.slice(0, 4).map((tag) => (
              <span
                key={tag.id}
                className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary"
              >
                {tag.name}
              </span>
            ))}
            {bookmark.tags.length > 4 && (
              <span className="text-[11px] text-base-content/60 flex items-center px-1">
                +{bookmark.tags.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
