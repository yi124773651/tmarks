/**
 * 书签标签 + 快照按钮展示（共享）
 */

import type { Bookmark } from '@/lib/types'
import { SnapshotViewer } from '../SnapshotViewer'

interface BookmarkTagListProps {
  bookmark: Bookmark
  maxTags?: number
}

export function BookmarkTagList({ bookmark, maxTags = 4 }: BookmarkTagListProps) {
  const hasTags = bookmark.tags && bookmark.tags.length > 0
  const hasSnapshot = bookmark.has_snapshot && (bookmark.snapshot_count ?? 0) > 0

  if (!hasTags && !hasSnapshot) return null

  return (
    <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
      {hasSnapshot && (
        <div onClick={(e) => e.stopPropagation()}>
          <SnapshotViewer
            bookmarkId={bookmark.id}
            bookmarkTitle={bookmark.title}
            snapshotCount={bookmark.snapshot_count ?? 0}
          />
        </div>
      )}
      {bookmark.tags?.slice(0, maxTags).map((tag) => (
        <span
          key={tag.id}
          className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium"
        >
          {tag.name}
        </span>
      ))}
      {bookmark.tags && bookmark.tags.length > maxTags && (
        <span className="text-[10px] sm:text-xs text-muted-foreground/60">
          +{bookmark.tags.length - maxTags}
        </span>
      )}
    </div>
  )
}
