import type { Bookmark } from '@/lib/types'
import { useRecordClick } from '@/hooks/useBookmarks'

interface BookmarkMinimalListViewProps {
  bookmarks: Bookmark[]
  onEdit?: (bookmark: Bookmark) => void
  readOnly?: boolean
}

export function BookmarkMinimalListView({ bookmarks, onEdit, readOnly = false }: BookmarkMinimalListViewProps) {
  return (
    <div className="rounded-xl border border-base-300 overflow-hidden">
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,2fr)_auto] gap-4 px-4 py-2 text-xs uppercase tracking-wide text-base-content/50 bg-base-200">
        <span>标题</span>
        <span>网址</span>
        <span>备注</span>
        <span className="text-right">{readOnly ? '' : '操作'}</span>
      </div>
      <div>
        {bookmarks.map((bookmark) => (
          <MinimalRow
            key={bookmark.id}
            bookmark={bookmark}
            onEdit={onEdit ? () => onEdit(bookmark) : undefined}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  )
}

interface MinimalRowProps {
  bookmark: Bookmark
  onEdit?: () => void
  readOnly?: boolean
}

function MinimalRow({ bookmark, onEdit, readOnly = false }: MinimalRowProps) {
  const recordClick = useRecordClick()

  const handleVisit = () => {
    if (!readOnly) {
      recordClick.mutate(bookmark.id)
    }
    window.open(bookmark.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,2fr)_auto] gap-4 px-4 py-3 text-sm items-center border-t border-base-200 first:border-t-0 hover:bg-base-200/60">
      <button
        type="button"
        onClick={handleVisit}
        className="text-left font-medium truncate hover:text-primary"
        title={bookmark.title}
      >
        {bookmark.title || bookmark.url}
      </button>
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-primary truncate hover:underline"
        title={bookmark.url}
      >
        {bookmark.url}
      </a>
      <span className="text-xs text-base-content/70 truncate" title={bookmark.description || undefined}>
        {bookmark.description || '—'}
      </span>
      <div className="flex justify-end">
        {!!onEdit && !readOnly ? (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onEdit()
            }}
            className="text-xs font-medium px-3 py-1 rounded-md bg-base-300 hover:bg-base-200 transition-colors"
          >
            编辑
          </button>
        ) : null}
      </div>
    </div>
  )
}
