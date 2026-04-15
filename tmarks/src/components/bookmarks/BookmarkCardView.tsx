import { useTranslation } from 'react-i18next'
import type { Bookmark, DefaultBookmarkIcon } from '@/lib/types'
import { AdaptiveImage } from '@/components/common/AdaptiveImage'
import { useRecordClick } from '@/hooks/useBookmarks'
import { useState } from 'react'
import type { ImageType } from '@/lib/image-utils'
import { DefaultBookmarkIconComponent } from './DefaultBookmarkIcon'
import { usePreferences } from '@/hooks/usePreferences'
import { MasonryGrid } from './shared/MasonryGrid'
import { BatchCheckbox, EditButton } from './shared/BookmarkActions'
import { BookmarkTagList } from './shared/BookmarkTagList'
import { useFaviconFallback } from './shared/useFaviconFallback'

interface BookmarkCardViewProps {
  bookmarks: Bookmark[]
  onEdit?: (bookmark: Bookmark) => void
  readOnly?: boolean
  batchMode?: boolean
  selectedIds?: string[]
  onToggleSelect?: (id: string) => void
}

export function BookmarkCardView({
  bookmarks, onEdit, readOnly = false,
  batchMode = false, selectedIds = [], onToggleSelect,
}: BookmarkCardViewProps) {
  return (
    <MasonryGrid
      bookmarks={bookmarks}
      minColumnWidth={280}
      gap={16}
      renderItem={(bookmark, showEditHint) => (
        <BookmarkCard
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

interface BookmarkCardProps {
  bookmark: Bookmark
  onEdit?: () => void
  readOnly?: boolean
  batchMode?: boolean
  isSelected?: boolean
  onToggleSelect?: (id: string) => void
  showEditHint?: boolean
}

function BookmarkCard({
  bookmark, onEdit, readOnly = false,
  batchMode = false, isSelected = false, onToggleSelect, showEditHint = false,
}: BookmarkCardProps) {
  const { t } = useTranslation('bookmarks')
  const [imageType, setImageType] = useState<ImageType>('unknown')
  const recordClick = useRecordClick()
  const { data: preferences } = usePreferences()
  const defaultIcon: DefaultBookmarkIcon = preferences?.default_bookmark_icon || 'orbital-spinner'
  const {
    googleFaviconUrl, hasCoverImage, hasFavicon, hasGoogleFavicon, hasAnyIcon,
    setCoverImageError, setFaviconError, checkIfGoogleDefaultIcon,
  } = useFaviconFallback(bookmark)

  const handleVisit = () => {
    if (!readOnly) recordClick.mutate(bookmark.id)
    window.open(bookmark.url, '_blank', 'noopener,noreferrer')
  }

  const handleCardClick = (e: React.MouseEvent) => {
    if (batchMode && onToggleSelect) { e.preventDefault(); onToggleSelect(bookmark.id) }
    else handleVisit()
  }

  const radiusStyle = { borderTopLeftRadius: 'calc(var(--radius) * 1.5)', borderTopRightRadius: 'calc(var(--radius) * 1.5)' }

  return (
    <div
      className={`card hover:shadow-xl transition-all relative group flex flex-col cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/60 touch-manipulation w-full min-w-0 ${
        batchMode && isSelected ? 'ring-2 ring-primary' : ''
      }`}
      role="link" tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (batchMode && onToggleSelect) { onToggleSelect(bookmark.id) } else { handleVisit() } } }}
      aria-label={t('action.open', { title: bookmark.title })}
    >
      {batchMode && onToggleSelect && (
        <BatchCheckbox bookmarkId={bookmark.id} isSelected={isSelected} onToggleSelect={onToggleSelect} />
      )}
      {!!onEdit && !readOnly && !batchMode && <EditButton onEdit={onEdit} showHint={showEditHint} />}

      {/* 图片区域 */}
      {hasAnyIcon ? (
        <div
          className={`relative overflow-hidden flex-shrink-0 flex items-center justify-center ${
            imageType === 'favicon' || hasFavicon || hasGoogleFavicon
              ? 'h-24 sm:h-20 bg-gradient-to-br from-primary/5 to-secondary/5'
              : 'h-40 sm:h-32 bg-gradient-to-br from-primary/10 to-secondary/10'
          }`}
          style={radiusStyle}
        >
          {hasCoverImage ? (
            <AdaptiveImage
              src={bookmark.cover_image!} alt={bookmark.title}
              className={imageType === 'favicon' ? 'w-14 h-14 sm:w-12 sm:h-12 object-contain' : 'w-full h-full object-cover'}
              onTypeDetected={setImageType} onError={() => setCoverImageError(true)}
            />
          ) : hasFavicon ? (
            <div className="relative w-14 h-14 sm:w-12 sm:h-12 flex items-center justify-center">
              <img src={bookmark.favicon!} alt={bookmark.title} className="w-full h-full object-contain" onError={() => setFaviconError(true)} />
            </div>
          ) : hasGoogleFavicon ? (
            <div className="relative w-14 h-14 sm:w-12 sm:h-12 flex items-center justify-center">
              <img src={googleFaviconUrl} alt={bookmark.title} className="w-full h-full object-contain"
                onLoad={(e) => checkIfGoogleDefaultIcon(e.target as HTMLImageElement)} onError={() => setFaviconError(true)} />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="relative h-24 sm:h-20 overflow-hidden flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5" style={radiusStyle}>
          <DefaultBookmarkIconComponent icon={defaultIcon} />
        </div>
      )}

      {/* 内容区 */}
      <div className="flex flex-col p-4 sm:p-3 gap-2.5 sm:gap-2 relative">
        {(bookmark.is_pinned || bookmark.is_archived) && (
          <div className="flex gap-1.5 mb-1">
            {bookmark.is_pinned && <span className="bg-warning text-warning-content text-xs px-2 py-0.5 rounded-full font-medium">{t('status.pinned')}</span>}
            {bookmark.is_archived && <span className="bg-base-content/40 text-base-100 text-xs px-2 py-0.5 rounded-full font-medium">{t('status.archived')}</span>}
          </div>
        )}

        <h3 className="font-semibold text-base sm:text-sm line-clamp-2 hover:text-primary transition-colors leading-snug" title={bookmark.title}>
          {bookmark.title}
        </h3>

        {bookmark.description && (
          <p className="text-sm sm:text-xs text-base-content/70 line-clamp-3 leading-relaxed">{bookmark.description}</p>
        )}

        {bookmark.ai_summary && (
          <div className="bg-primary/5 border border-primary/10 rounded-lg p-2.5 sm:p-2 mt-0.5">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/10 px-1.5 py-0.5 rounded">AI</span>
              <span className="text-[11px] font-medium text-primary/80">{t('view.aiSummaryTitle')}</span>
            </div>
            <p className="text-[11px] text-base-content/80 line-clamp-3 italic leading-relaxed">"{bookmark.ai_summary}"</p>
          </div>
        )}

        <div className="mt-1">
          <BookmarkTagList bookmark={bookmark} />
        </div>
      </div>
    </div>
  )
}
