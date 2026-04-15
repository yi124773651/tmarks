import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { Bookmark, DefaultBookmarkIcon } from '@/lib/types'
import { useRecordClick } from '@/hooks/useBookmarks'
import { usePreferences } from '@/hooks/usePreferences'
import { DefaultBookmarkIconComponent } from './DefaultBookmarkIcon'
import { MasonryGrid } from './shared/MasonryGrid'
import { BatchCheckbox, EditButton } from './shared/BookmarkActions'
import { BookmarkTagList } from './shared/BookmarkTagList'
import { useFaviconFallback } from './shared/useFaviconFallback'

interface BookmarkTitleViewProps {
  bookmarks: Bookmark[]
  onEdit?: (bookmark: Bookmark) => void
  readOnly?: boolean
  batchMode?: boolean
  selectedIds?: string[]
  onToggleSelect?: (id: string) => void
}

export function BookmarkTitleView({
  bookmarks,
  onEdit,
  readOnly = false,
  batchMode = false,
  selectedIds = [],
  onToggleSelect,
}: BookmarkTitleViewProps) {
  return (
    <MasonryGrid
      bookmarks={bookmarks}
      minColumnWidth={240}
      gap={10}
      minCols={2}
      itemSpacing="mb-2.5 sm:mb-3"
      renderItem={(bookmark, showEditHint) => (
        <TitleOnlyCard
          bookmark={bookmark}
          onEdit={onEdit ? () => onEdit(bookmark) : undefined}
          readOnly={readOnly}
          batchMode={batchMode}
          isSelected={selectedIds.includes(bookmark.id)}
          onToggleSelect={onToggleSelect}
          showEditHint={showEditHint}
        />
      )}
    />
  )
}

interface TitleOnlyCardProps {
  bookmark: Bookmark
  onEdit?: () => void
  readOnly?: boolean
  batchMode?: boolean
  isSelected?: boolean
  onToggleSelect?: (id: string) => void
  showEditHint?: boolean
}

function TitleOnlyCard({
  bookmark,
  onEdit,
  readOnly = false,
  batchMode = false,
  isSelected = false,
  onToggleSelect,
  showEditHint = false,
}: TitleOnlyCardProps) {
  const { t } = useTranslation('bookmarks')
  const recordClick = useRecordClick()
  const hasEditClickRef = useRef(false)
  const { data: preferences } = usePreferences()
  const defaultIcon: DefaultBookmarkIcon = preferences?.default_bookmark_icon || 'orbital-spinner'
  const {
    domain, googleFaviconUrl,
    hasCoverImage, hasFavicon, hasGoogleFavicon, hasAnyIcon,
    setCoverImageError, setFaviconError, checkIfGoogleDefaultIcon,
  } = useFaviconFallback(bookmark)

  const handleCardClick = () => {
    if (batchMode && onToggleSelect) {
      onToggleSelect(bookmark.id)
    } else {
      if (!readOnly) recordClick.mutate(bookmark.id)
      window.open(bookmark.url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="relative group">
      <div className={`rounded-lg sm:rounded-xl border border-border/70 bg-card/95 backdrop-blur-sm shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 ${
        batchMode && isSelected ? 'ring-2 ring-primary' : ''
      }`}>
        <div className="pointer-events-none absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/4 via-transparent to-secondary/8 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        {batchMode && onToggleSelect && (
          <BatchCheckbox bookmarkId={bookmark.id} isSelected={isSelected} onToggleSelect={onToggleSelect} size="sm" />
        )}
        {!!onEdit && !readOnly && !batchMode && <EditButton onEdit={onEdit} showHint={showEditHint} />}

        <div className="relative z-10 px-3 py-3 sm:px-5 sm:py-4 space-y-1.5 sm:space-y-2 pointer-events-none">
          {bookmark.is_pinned && (
            <div className="flex items-center gap-1 mb-1">
              <span className="bg-warning text-warning-content text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full font-medium">
                {t('status.pinned')}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 sm:gap-2.5">
            <FaviconIcon
              bookmark={bookmark} hasCoverImage={hasCoverImage} hasFavicon={hasFavicon}
              hasGoogleFavicon={hasGoogleFavicon} hasAnyIcon={hasAnyIcon}
              googleFaviconUrl={googleFaviconUrl} defaultIcon={defaultIcon}
              setCoverImageError={setCoverImageError} setFaviconError={setFaviconError}
              checkIfGoogleDefaultIcon={checkIfGoogleDefaultIcon}
            />
            <div className="flex-1 min-w-0 flex items-baseline gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={(e) => { if (hasEditClickRef.current) { hasEditClickRef.current = false; e.preventDefault(); return }; handleCardClick() }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick() } }}
                className="pointer-events-auto flex-shrink min-w-0 text-left text-xs sm:text-sm font-semibold leading-snug text-foreground truncate hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-md pr-9 sm:pr-12"
                title={bookmark.title?.trim() || bookmark.url}
              >
                {bookmark.title?.trim() || bookmark.url}
              </button>
              <a
                href={bookmark.url} target="_blank" rel="noopener noreferrer"
                className="pointer-events-auto flex-shrink-0 text-[10px] sm:text-xs text-muted-foreground/60 hover:text-primary transition-colors truncate max-w-[40%]"
                onClick={(e) => { if (batchMode) { e.preventDefault(); onToggleSelect?.(bookmark.id) } else if (!readOnly) recordClick.mutate(bookmark.id) }}
                title={domain}
              >
                {domain}
              </a>
            </div>
          </div>

          <div className="pt-0.5">
            <BookmarkTagList bookmark={bookmark} maxTags={3} />
          </div>
        </div>
      </div>
    </div>
  )
}

function FaviconIcon(props: {
  bookmark: Bookmark; hasCoverImage: boolean; hasFavicon: boolean; hasGoogleFavicon: boolean; hasAnyIcon: boolean
  googleFaviconUrl: string; defaultIcon: DefaultBookmarkIcon
  setCoverImageError: (v: boolean) => void; setFaviconError: (v: boolean) => void; checkIfGoogleDefaultIcon: (img: HTMLImageElement) => void
}) {
  const imgClass = "w-full h-full object-contain"
  return (
    <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
      {props.hasAnyIcon ? (
        props.hasCoverImage ? <img src={props.bookmark.cover_image!} alt="" className={imgClass} onError={() => props.setCoverImageError(true)} /> :
        props.hasFavicon ? <img src={props.bookmark.favicon!} alt="" className={imgClass} onError={() => props.setFaviconError(true)} /> :
        props.hasGoogleFavicon ? <img src={props.googleFaviconUrl} alt="" className={imgClass} onLoad={(e) => props.checkIfGoogleDefaultIcon(e.target as HTMLImageElement)} onError={() => props.setFaviconError(true)} /> : null
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <DefaultBookmarkIconComponent icon={props.defaultIcon} className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      )}
    </div>
  )
}
