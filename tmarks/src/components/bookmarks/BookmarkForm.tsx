import { useTags } from '@/hooks/useTags'
import type { Bookmark } from '@/lib/types'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Z_INDEX } from '@/lib/constants/z-index'
import { useBookmarkForm } from './useBookmarkForm'
import { TagSelector } from './TagSelector'

interface BookmarkFormProps {
  bookmark?: Bookmark | null
  onClose: () => void
  onSuccess?: () => void
}

export function BookmarkForm({ bookmark, onClose, onSuccess }: BookmarkFormProps) {
  const { data: tagsData } = useTags()
  const tags = tagsData?.tags || []

  const {
    title, setTitle,
    url, setUrl,
    description, setDescription,
    coverImage, setCoverImage,
    selectedTagIds, toggleTag,
    isPinned, setIsPinned,
    isArchived, setIsArchived,
    isPublic, setIsPublic,
    error,
    tagInput, setTagInput,
    showDeleteConfirm, setShowDeleteConfirm,
    urlWarning, checkingUrl,
    isPending,
    handleSubmit,
    processTagInput,
    handleDeleteClick,
    handleConfirmDelete,
    isEditing,
    t
  } = useBookmarkForm({ bookmark, onClose, onSuccess, tags })

  const handleTagInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      await processTagInput()
    }
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: Z_INDEX.BOOKMARK_FORM }}>
      <div className="card w-full max-w-4xl max-h-[92vh] flex flex-col min-h-0" style={{ backgroundColor: 'var(--card)' }}>
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h2 className="text-xl font-bold text-foreground">
            {isEditing ? t('form.editTitle') : t('form.addTitle')}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-foreground transition-colors"
            disabled={isPending}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-3 p-2.5 bg-error/10 border border-error/30 text-error rounded-lg text-xs animate-fade-in flex items-center gap-2 flex-shrink-0">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto min-h-0 overscroll-contain" style={{ scrollbarGutter: 'stable' }}>
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* 第一行：标题和URL */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="title" className="block text-xs font-medium mb-1.5 text-foreground">
                  {t('form.titleRequired')} <span className="text-error">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  className="input"
                  placeholder={t('form.titlePlaceholder')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isPending}
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="url" className="block text-xs font-medium mb-1.5 text-foreground">
                  {t('form.urlRequired')} <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <input
                    id="url"
                    type="url"
                    className={`input ${urlWarning ? 'border-warning' : ''}`}
                    placeholder={t('form.urlPlaceholder')}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={isPending}
                  />
                  {checkingUrl && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="animate-spin h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                </div>
                {urlWarning && (
                  <div className="mt-1.5 p-2 bg-warning/10 border border-warning/30 rounded-lg text-xs text-warning animate-fade-in flex items-start gap-2">
                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <p className="font-medium">{t('form.urlWarning.title')}</p>
                      <p className="mt-0.5 text-muted-foreground">
                        {t('form.urlWarning.bookmark', { title: urlWarning.bookmark.title })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 第二行：描述和封面图 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="description" className="block text-xs font-medium mb-1.5 text-foreground">
                  {t('form.description')}
                </label>
                <textarea
                  id="description"
                  className="input min-h-[60px] resize-none text-sm"
                  placeholder={t('form.descriptionPlaceholder')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isPending}
                />
              </div>

              <div>
                <label htmlFor="coverImage" className="block text-xs font-medium mb-1.5 text-foreground">
                  {t('form.coverImage')}
                </label>
                <div className="flex gap-2">
                  <input
                    id="coverImage"
                    type="url"
                    className="input flex-1"
                    placeholder={t('form.coverImagePlaceholder')}
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    disabled={isPending}
                  />
                  {coverImage && (
                    <img
                      src={coverImage}
                      alt={t('form.coverImage')}
                      className="w-[60px] h-[60px] object-cover rounded-lg flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* 标签选择 */}
            <TagSelector
              tagInput={tagInput}
              setTagInput={setTagInput}
              onTagInputKeyDown={handleTagInputKeyDown}
              selectedTagIds={selectedTagIds}
              toggleTag={toggleTag}
              tags={tags}
              isPending={isPending}
            />

            {/* 选项和按钮 */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    disabled={isPending}
                  />
                  <span className="text-xs text-foreground">{t('form.pinned')}</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isArchived}
                    onChange={(e) => setIsArchived(e.target.checked)}
                    disabled={isPending}
                  />
                  <span className="text-xs text-foreground">{t('form.archived')}</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    disabled={isPending}
                  />
                  <span className="text-xs text-foreground">{t('form.public')}</span>
                </label>
              </div>

              {/* 按钮 */}
              <div className="flex gap-2">
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleDeleteClick}
                    className="btn btn-sm btn-outline border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground px-4"
                    disabled={isPending}
                    title={t('form.delete')}
                  >
                    {isPending ? t('form.deleting') : t('form.delete')}
                  </button>
                )}
                <button type="submit" className="btn btn-sm px-6" disabled={isPending}>
                  {isPending
                    ? t('form.saving')
                    : isEditing
                      ? t('form.save')
                      : t('form.create')}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-sm btn-outline px-4"
                  disabled={isPending}
                >
                  {t('form.cancel')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title={t('form.deleteTitle')}
        message={t('form.deleteMessage')}
        type="error"
        confirmText={t('form.delete')}
        cancelText={t('form.cancel')}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}
