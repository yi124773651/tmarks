import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Archive, Trash2, ArrowLeft, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { bookmarksService } from '@/services/bookmarks'
import type { Bookmark } from '@/lib/types'
import { useToastStore } from '@/stores/toastStore'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { logger } from '@/lib/logger'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { MobileHeader } from '@/components/common/MobileHeader'
import { TrashBookmarkItem } from './TrashBookmarkItem'

export function BookmarkTrashPage() {
  const { t } = useTranslation('bookmarks')
  const isMobile = useIsMobile()
  const { success, error: showError } = useToastStore()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    isDanger?: boolean
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isDanger: false,
  })

  const loadTrash = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await bookmarksService.getTrash({ page_size: 100 })
      setBookmarks(response.bookmarks)
    } catch (err) {
      logger.error('Failed to load bookmark trash:', err)
      setError(t('trash.loadFailed'))
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadTrash()
  }, [loadTrash])

  const handleRestore = (id: string, title: string) => {
    setConfirmDialog({
      isOpen: true,
      title: t('trash.restoreTitle'),
      message: t('trash.restoreMessage', { title }),
      isDanger: false,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
        try {
          await bookmarksService.restoreFromTrash(id)
          setBookmarks(prev => prev.filter(b => b.id !== id))
          success(t('trash.restoreSuccess'))
        } catch (err) {
          logger.error('Failed to restore bookmark:', err)
          showError(t('trash.restoreFailed'))
        }
      },
    })
  }

  const handlePermanentDelete = (id: string, title: string) => {
    setConfirmDialog({
      isOpen: true,
      title: t('trash.permanentDeleteTitle'),
      message: t('trash.permanentDeleteMessage', { title }),
      isDanger: true,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
        try {
          await bookmarksService.permanentDelete(id)
          setBookmarks(prev => prev.filter(b => b.id !== id))
          success(t('trash.permanentDeleteSuccess'))
        } catch (err) {
          logger.error('Failed to permanently delete bookmark:', err)
          showError(t('trash.permanentDeleteFailed'))
        }
      },
    })
  }

  const handleEmptyTrash = () => {
    if (bookmarks.length === 0) return

    setConfirmDialog({
      isOpen: true,
      title: t('trash.emptyTrashTitle'),
      message: t('trash.emptyTrashMessage', { count: bookmarks.length }),
      isDanger: true,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
        try {
          const result = await bookmarksService.emptyTrash()
          setBookmarks([])
          success(t('trash.emptyTrashSuccess', { count: result.count }))
        } catch (err) {
          logger.error('Failed to empty trash:', err)
          showError(t('trash.emptyTrashFailed'))
        }
      },
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('trash.loading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={loadTrash}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            {t('trash.retry')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-screen flex flex-col bg-background ${isMobile ? 'overflow-hidden' : ''}`}>
      {/* 移动端顶部工具栏 */}
      {isMobile && (
        <MobileHeader
          title={t('trash.title')}
          showMenu={false}
          showSearch={false}
          showMore={false}
        />
      )}

      <div className={`flex-1 overflow-y-auto ${isMobile ? 'pb-20 min-h-0' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header - 桌面端显示 */}
          {!isMobile && (
            <div className="mb-8">
              <Link
                to="/bookmarks"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>{t('trash.backToBookmarks')}</span>
              </Link>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Archive className="w-8 h-8 text-muted-foreground" />
                    <h1 className="text-3xl font-bold text-foreground">{t('trash.title')}</h1>
                  </div>
                  <p className="text-muted-foreground">{t('trash.warning')}</p>
                </div>
                {bookmarks.length > 0 && (
                  <button
                    onClick={handleEmptyTrash}
                    className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('trash.emptyTrash')}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 移动端清空按钮 */}
          {isMobile && bookmarks.length > 0 && (
            <div className="mb-4 flex justify-end">
              <button
                onClick={handleEmptyTrash}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {t('trash.empty')}
              </button>
            </div>
          )}

          {/* Empty State */}
          {bookmarks.length === 0 ? (
            <div className="text-center py-16">
              <Archive className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">{t('trash.emptyState.title')}</h3>
              <p className="text-muted-foreground">{t('trash.emptyState.description')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 提示信息 */}
              <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p>{t('trash.warning')}</p>
                </div>
              </div>

              {/* 书签列表 */}
              {bookmarks.map((bookmark) => (
                <TrashBookmarkItem
                  key={bookmark.id}
                  bookmark={bookmark}
                  onRestore={handleRestore}
                  onDelete={handlePermanentDelete}
                />
              ))}
            </div>
          )}

          {/* Confirm Dialog */}
          <ConfirmDialog
            isOpen={confirmDialog.isOpen}
            title={confirmDialog.title}
            message={confirmDialog.message}
            onConfirm={confirmDialog.onConfirm}
            onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
            confirmText={confirmDialog.isDanger ? t('trash.confirmDelete') : t('trash.confirm')}
            cancelText={t('batch.cancel')}
          />
        </div>
      </div>
    </div>
  )
}
