import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { Tag } from '@/lib/types'

interface TagSelectorProps {
  tagInput: string
  setTagInput: (val: string) => void
  onTagInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  selectedTagIds: string[]
  toggleTag: (tagId: string) => void
  tags: Tag[]
  isPending: boolean
}

export function TagSelector({
  tagInput,
  setTagInput,
  onTagInputKeyDown,
  selectedTagIds,
  toggleTag,
  tags,
  isPending,
}: TagSelectorProps) {
  const { t } = useTranslation('bookmarks')
  const availableTagsScrollRef = useRef<HTMLDivElement | null>(null)
  const availableTagsInnerRef = useRef<HTMLDivElement | null>(null)
  
  // Cache for wheel step
  const scrollStepRef = useRef<number | null>(null)

  const handleAvailableTagsWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const scrollEl = availableTagsScrollRef.current
    if (!scrollEl) return

    e.preventDefault()
    e.stopPropagation()

    if (scrollStepRef.current === null) {
      const innerEl = availableTagsInnerRef.current
      const firstItem = innerEl?.querySelector('button') as HTMLButtonElement | null
      const itemHeight = firstItem?.getBoundingClientRect().height ?? 24

      let rowGap = 0
      if (innerEl) {
        const style = window.getComputedStyle(innerEl)
        const gapValue = style.rowGap || style.gap
        const parsed = Number.parseFloat(gapValue)
        rowGap = Number.isFinite(parsed) ? parsed : 0
      }
      scrollStepRef.current = Math.max(1, Math.round(itemHeight + rowGap))
    }

    const direction = e.deltaY > 0 ? 1 : -1
    scrollEl.scrollBy({ top: direction * (scrollStepRef.current || 24), behavior: 'auto' })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-medium text-foreground">
          {t('form.tags')}
          <span className="text-xs text-muted-foreground ml-1.5">
            {t('form.tagsBatchHint')}
          </span>
        </label>
        {selectedTagIds.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {t('form.tagsSelected', { count: selectedTagIds.length })}
          </span>
        )}
      </div>

      {/* 标签输入框 */}
      <input
        type="text"
        className="input mb-2"
        placeholder={t('form.tagsInputPlaceholder')}
        value={tagInput}
        onChange={(e) => setTagInput(e.target.value)}
        onKeyDown={onTagInputKeyDown}
        disabled={isPending}
      />

      {/* 已选标签 */}
      {selectedTagIds.length > 0 && (
        <div className="mb-2 p-2 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex flex-wrap gap-1.5">
            {selectedTagIds.map((tagId) => {
              const tag = tags.find((t) => t.id === tagId)
              if (!tag) return null
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className="text-xs px-2.5 py-1 rounded-full bg-primary text-primary-content hover:bg-primary/90 transition-colors shadow-sm"
                  disabled={isPending}
                >
                  {tag.name} ×
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 可选标签列表 */}
      <div
        ref={availableTagsScrollRef}
        onWheelCapture={handleAvailableTagsWheel}
        className="p-2.5 bg-muted rounded-lg max-h-[120px] overflow-y-auto scrollbar-theme min-h-0 overscroll-contain"
        style={{ scrollbarGutter: 'stable' }}
      >
        <div ref={availableTagsInnerRef} className="flex flex-wrap gap-1.5">
          {tags.length === 0 ? (
            <p className="text-xs text-muted-foreground py-1">
              {t('form.noTags')}
            </p>
          ) : (
            tags
              .filter((tag) => !selectedTagIds.includes(tag.id))
              .map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className="text-xs px-2.5 py-1 rounded-full bg-card border border-border text-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  disabled={isPending}
                >
                  {tag.name}
                </button>
              ))
          )}
        </div>
      </div>
    </div>
  )
}
