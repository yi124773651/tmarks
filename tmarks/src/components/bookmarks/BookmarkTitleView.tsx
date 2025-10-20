import { useMemo, useRef } from 'react'
import type { Bookmark } from '@/lib/types'
import { useRecordClick } from '@/hooks/useBookmarks'

interface BookmarkTitleViewProps {
  bookmarks: Bookmark[]
  onEdit?: (bookmark: Bookmark) => void
  readOnly?: boolean
}

export function BookmarkTitleView({ bookmarks, onEdit, readOnly = false }: BookmarkTitleViewProps) {
  return (
    <div className="columns-1 sm:columns-2 xl:columns-4 gap-2.5 sm:gap-3">
      {bookmarks.map((bookmark) => (
        <div key={bookmark.id} className="break-inside-avoid mb-2.5 sm:mb-3">
          <TitleOnlyCard
            bookmark={bookmark}
            onEdit={onEdit ? () => onEdit(bookmark) : undefined}
            readOnly={readOnly}
          />
        </div>
      ))}
    </div>
  )
}

interface TitleOnlyCardProps {
  bookmark: Bookmark
  onEdit?: () => void
  readOnly?: boolean
}

function TitleOnlyCard({ bookmark, onEdit, readOnly = false }: TitleOnlyCardProps) {
  const recordClick = useRecordClick()
  const hasEditClickRef = useRef(false)
  const domain = useMemo(() => {
    try {
      return new URL(bookmark.url).hostname
    } catch (error) {
      return bookmark.url.replace(/^https?:\/\//i, '').split('/')[0] || bookmark.url
    }
  }, [bookmark.url])

  const handleVisit = () => {
    if (!readOnly) {
      recordClick.mutate(bookmark.id)
    }
    window.open(bookmark.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="relative group">
      <div className="rounded-xl border border-border/70 bg-card/95 backdrop-blur-sm shadow-[0_10px_26px_-16px_rgba(15,23,42,0.32)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-14px_rgba(59,130,246,0.28)]">
        <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-primary/4 via-transparent to-secondary/8 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        {!!onEdit && !readOnly && (
          <button
            type="button"
            onMouseDown={(event) => {
              event.preventDefault()
              event.stopPropagation()
              ;(event.nativeEvent as MouseEvent).stopImmediatePropagation?.()
            }}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              ;(event.nativeEvent as MouseEvent).stopImmediatePropagation?.()
              hasEditClickRef.current = true
              setTimeout(() => {
                hasEditClickRef.current = false
              }, 0)
              onEdit()
            }}
            className="absolute top-3 right-3 w-8 h-8 rounded-xl border border-white/20 bg-card/80 hover:bg-muted/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg"
            title="编辑"
          >
            <svg className="w-4 h-4 text-base-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}

        <div className="relative z-10 px-5 py-4 space-y-2 pointer-events-none">
          <button
            type="button"
            onClick={(event) => {
              if (hasEditClickRef.current) {
                hasEditClickRef.current = false
                event.preventDefault()
                return
              }
              handleVisit()
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                handleVisit()
              }
            }}
            className="pointer-events-auto inline-flex max-w-full text-left text-sm font-semibold leading-snug text-foreground line-clamp-2 hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-md pr-12"
          >
            {bookmark.title?.trim() || bookmark.url}
          </button>
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto block text-xs text-muted-foreground/70 truncate hover:text-primary"
            onClick={() => {
              if (!readOnly) {
                recordClick.mutate(bookmark.id)
              }
            }}
          >
            {domain}
          </a>
        </div>
      </div>
    </div>
  )
}
