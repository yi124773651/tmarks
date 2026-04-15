import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Tag } from '@/lib/types'
import { useDeleteTag, useUpdateTag } from '@/hooks/useTags'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { AlertDialog } from '@/components/common/AlertDialog'
import { TagFormModal } from './TagFormModal'
import { logger } from '@/lib/logger'
import { Z_INDEX } from '@/lib/constants/z-index'

interface TagManageModalProps {
  tags: Tag[]
  onClose: () => void
}

export function TagManageModal({ tags, onClose }: TagManageModalProps) {
  const { t } = useTranslation('tags')
  const { t: tc } = useTranslation('common')
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [editName, setEditName] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null)
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showErrorAlert, setShowErrorAlert] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const deleteTag = useDeleteTag()
  const updateTag = useUpdateTag()

  const sortedTags = useMemo(() => {
    return [...tags].sort((a, b) => (b.bookmark_count || 0) - (a.bookmark_count || 0))
  }, [tags])

  const handleEditClick = (tag: Tag) => {
    setEditingTag(tag)
    setEditName(tag.name)
    setIsEditModalOpen(true)
  }

  const handleSaveEdit = async (value?: string) => {
    if (!editingTag) return
    const nextName = value?.trim() ?? editName.trim()
    if (!nextName) return

    try {
      await updateTag.mutateAsync({
        id: editingTag.id,
        data: { name: nextName },
      })
      setEditingTag(null)
      setEditName('')
      setIsEditModalOpen(false)
      setSuccessMessage(t('message.updateSuccess'))
      setShowSuccessAlert(true)
    } catch (error) {
      logger.error('Failed to update tag:', error)
      setErrorMessage(t('message.updateFailed'))
      setShowErrorAlert(true)
    }
  }

  const handleCancelEdit = () => {
    setEditingTag(null)
    setEditName('')
    setIsEditModalOpen(false)
  }

  const openDeleteConfirm = (tag: Tag) => {
    setTagToDelete(tag)
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = async () => {
    if (!tagToDelete) return

    setShowDeleteConfirm(false)
    try {
      await deleteTag.mutateAsync(tagToDelete.id)
      if (editingTag?.id === tagToDelete.id) {
        setEditingTag(null)
        setIsEditModalOpen(false)
        setEditName('')
      }
      setSuccessMessage(t('message.deleteSuccess'))
      setShowSuccessAlert(true)
    } catch (error) {
      logger.error('Failed to delete tag:', error)
      setErrorMessage(t('message.deleteFailed'))
      setShowErrorAlert(true)
    } finally {
      setTagToDelete(null)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 animate-fade-in bg-background/80 backdrop-blur-sm" style={{ zIndex: Z_INDEX.TAG_MANAGE_MODAL }}>
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative card rounded-2xl shadow-2xl w-full max-h-[68vh] flex flex-col border border-border animate-scale-in" style={{padding: 0, maxWidth: '1200px', backgroundColor: 'var(--card)'}}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-primary-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{t('manage.title')}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t('manage.description')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground/60 hover:text-foreground"
            title={tc('button.close')}
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {sortedTags.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground/60">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <p className="text-sm font-medium mb-1 text-foreground">{t('manage.noTags')}</p>
              <p className="text-xs text-muted-foreground/50">{t('manage.noTagsHint')}</p>
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-2.5 space-y-2.5">
              {sortedTags.map((tag, index) => (
                <div
                  key={tag.id}
                  className="break-inside-avoid cursor-pointer group"
                  style={{ animationDelay: `${index * 30}ms` }}
                  onClick={() => handleEditClick(tag)}
                >
                  <div className="relative rounded-xl border border-border bg-card/95 shadow-sm hover:shadow-md hover:shadow-primary/10 transition-all duration-200 hover:-translate-y-0.5">
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center"
                        title={t('action.edit')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>

                    <div className="p-3.5 space-y-2">
                      <div className="space-y-0.5">
                        <h3 className="text-base font-semibold text-foreground truncate">{tag.name}</h3>
                        {tag.bookmark_count !== undefined && (
                          <p className="text-xs text-muted-foreground/70">
                            {tag.bookmark_count === 0 
                              ? t('manage.noBookmarks') 
                              : t('manage.bookmarkCount', { count: tag.bookmark_count })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-border bg-muted/30">
          <button onClick={onClose} className="btn w-full">
            {t('action.done')}
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title={t('confirm.deleteTitle')}
        message={t('confirm.deleteMessage', { name: tagToDelete?.name })}
        type="warning"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false)
          setTagToDelete(null)
        }}
      />

      <AlertDialog
        isOpen={showSuccessAlert}
        title={tc('dialog.successTitle')}
        message={successMessage}
        type="success"
        onConfirm={() => setShowSuccessAlert(false)}
      />

      <AlertDialog
        isOpen={showErrorAlert}
        title={tc('dialog.errorTitle')}
        message={errorMessage}
        type="error"
        onConfirm={() => setShowErrorAlert(false)}
      />

      <TagFormModal
        isOpen={isEditModalOpen && Boolean(editingTag)}
        title={t('action.edit')}
        initialName={editingTag?.name ?? ''}
        onConfirm={(value) => handleSaveEdit(value)}
        onCancel={handleCancelEdit}
        confirmLabel={t('action.save')}
        isSubmitting={updateTag.isPending}
        onDelete={() => {
          if (editingTag) {
            openDeleteConfirm(editingTag)
          }
        }}
        isDeleting={deleteTag.isPending}
      />
    </div>
  )
}
