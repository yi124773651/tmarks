/**
 * 瀑布流网格容器
 * 负责列计算 + 置顶/普通分组 + 渲染子项
 */

import { useRef, type ReactNode } from 'react'
import type { Bookmark } from '@/lib/types'
import { useResponsiveColumns, useEditHintVisibility } from './useResponsiveColumns'

interface MasonryGridProps {
  bookmarks: Bookmark[]
  /** 每列最小宽度 */
  minColumnWidth: number
  /** 列间距 */
  gap: number
  /** 最小列数 */
  minCols?: number
  /** 每项的间距 CSS class */
  itemSpacing?: string
  /** 渲染单个书签卡片 */
  renderItem: (bookmark: Bookmark, showEditHint: boolean) => ReactNode
}

export function MasonryGrid({
  bookmarks,
  minColumnWidth,
  gap,
  minCols = 1,
  itemSpacing = 'mb-3 sm:mb-4',
  renderItem,
}: MasonryGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const columns = useResponsiveColumns(containerRef, { minColumnWidth, gap, minCols })
  const showEditHint = useEditHintVisibility()

  const pinnedBookmarks = bookmarks.filter(b => b.is_pinned)
  const unpinnedBookmarks = bookmarks.filter(b => !b.is_pinned)

  const cols: Bookmark[][] = Array.from({ length: columns }, () => [])
  for (let i = 0; i < pinnedBookmarks.length; i++) {
    cols[i % columns]!.push(pinnedBookmarks[i]!)
  }
  for (let i = 0; i < unpinnedBookmarks.length; i++) {
    cols[i % columns]!.push(unpinnedBookmarks[i]!)
  }

  return (
    <div ref={containerRef} className="w-full min-w-0">
      {cols.length > 0 && (
        <div
          className="w-full min-w-0"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gap: `${gap}px`,
          }}
        >
          {cols.map((col, colIndex) => (
            <div key={`col-${colIndex}`} className="min-w-0">
              {col.map((bookmark) => (
                <div key={bookmark.id} className={itemSpacing}>
                  {renderItem(bookmark, showEditHint)}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
