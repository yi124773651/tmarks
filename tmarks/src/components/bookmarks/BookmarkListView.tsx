import { useRef, useState, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { Bookmark } from '@/lib/types'
import { BookmarkListItem } from './BookmarkListItem'
import { useIsMobile } from '@/hooks/useMediaQuery'

interface BookmarkListViewProps {
  bookmarks: Bookmark[]
  onEdit?: (bookmark: Bookmark) => void
  readOnly?: boolean
  batchMode?: boolean
  selectedIds?: string[]
  onToggleSelect?: (id: string) => void
}

/**
 * 书签列表视图组件
 * 包含虚拟滚动支持，适用于大量数据的展示
 */
export function BookmarkListView({
  bookmarks,
  onEdit,
  readOnly = false,
  batchMode = false,
  selectedIds = [],
  onToggleSelect,
}: BookmarkListViewProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [showEditHint, setShowEditHint] = useState(true)
  const isMobile = useIsMobile()

  // 移动端10秒后隐藏编辑按钮提示
  useEffect(() => {
    if (isMobile) {
      const timer = setTimeout(() => {
        setShowEditHint(false)
      }, 10000)
      return () => clearTimeout(timer)
    } else {
      setShowEditHint(false)
    }
  }, [isMobile])

  // 只有超过 100 个书签时才启用虚拟滚动
  const enableVirtualization = bookmarks.length > 100

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
      className="space-y-3 sm:space-y-4 scrollbar-hide"
      style={enableVirtualization ? { height: 'calc(100dvh - 16rem)', overflow: 'auto' } : undefined}
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
                  batchMode={batchMode}
                  isSelected={selectedIds.includes(bookmark.id)}
                  onToggleSelect={onToggleSelect}
                  showEditHint={showEditHint}
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
            batchMode={batchMode}
            isSelected={selectedIds.includes(bookmark.id)}
            onToggleSelect={onToggleSelect}
            showEditHint={showEditHint}
          />
        ))}
    </div>
  )
}
