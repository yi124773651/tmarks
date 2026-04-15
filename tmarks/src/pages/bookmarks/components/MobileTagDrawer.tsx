import { useTranslation } from 'react-i18next'

import { TagSidebar } from '@/components/tags/TagSidebar'
import type { Bookmark } from '@/lib/types'

interface MobileTagDrawerProps {
  isOpen: boolean
  onClose: () => void
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  tagLayout: 'grid' | 'masonry'
  onTagLayoutChange: (layout: 'grid' | 'masonry') => void
  bookmarks: Bookmark[]
  isLoading: boolean
  searchMode: 'bookmark' | 'tag'
  searchKeyword: string
  relatedTagIds?: string[]
}

export function MobileTagDrawer({
  isOpen,
  onClose,
  selectedTags,
  onTagsChange,
  tagLayout,
  onTagLayoutChange,
  bookmarks,
  isLoading,
  searchMode,
  searchKeyword,
  relatedTagIds,
}: MobileTagDrawerProps) {
  const { t } = useTranslation(['bookmarks', 'tags'])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-background border-r border-border shadow-xl animate-in slide-in-from-left duration-300 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-background flex-shrink-0">
          <h3 className="text-lg font-semibold text-foreground">{t('tags:filter.title')}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
            aria-label={t('tags:filter.close')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-background min-h-0 overscroll-contain touch-auto">
          <TagSidebar
            selectedTags={selectedTags}
            onTagsChange={(tags) => {
              onTagsChange(tags)
              if (tags.length >= 2 && tags.length > selectedTags.length) {
                setTimeout(() => onClose(), 500)
              }
            }}
            tagLayout={tagLayout}
            onTagLayoutChange={onTagLayoutChange}
            relatedTagIds={relatedTagIds}
            bookmarks={bookmarks}
            isLoadingBookmarks={isLoading}
            searchQuery={searchMode === 'tag' ? searchKeyword : ''}
          />
        </div>
      </div>
    </div>
  )
}
