import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Archive, RotateCcw, Trash2, Calendar, Layers, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { BottomNav } from '@/components/common/BottomNav'
import { MobileHeader } from '@/components/common/MobileHeader'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useTabGroupsTrashQuery, useInvalidateTabGroups } from '@/hooks/useTabGroupsQuery'
import { tabGroupsService } from '@/services/tab-groups'
import { useToastStore } from '@/stores/toastStore'
import { logger } from '@/lib/logger'

export function TrashPage() {
  const { t, i18n } = useTranslation('tabGroups')
  const { t: tc } = useTranslation('common')
  const dateLocale = i18n.language === 'zh-CN' ? zhCN : enUS
  const isMobile = useIsMobile()
  const { success, error: showError } = useToastStore()
  const trashQuery = useTabGroupsTrashQuery()
  const invalidateTabGroups = useInvalidateTabGroups()
  const tabGroups = trashQuery.data || []
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })

  const handleRestore = (id: string, title: string) => {
    setConfirmDialog({
      isOpen: true,
      title: t('confirm.restoreGroup'),
      message: t('confirm.restoreGroupMessage', { title }),
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
        try {
          await tabGroupsService.restoreTabGroup(id)
          await invalidateTabGroups()
          success(t('trashPage.restoreSuccess'))
        } catch (err) {
          logger.error('Failed to restore:', err)
          showError(t('trashPage.restoreFailed'))
        }
      },
    })
  }

  const handlePermanentDelete = (id: string, title: string) => {
    setConfirmDialog({
      isOpen: true,
      title: t('confirm.permanentDelete'),
      message: t('confirm.permanentDeleteMessage', { title }),
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
        try {
          await tabGroupsService.permanentDeleteTabGroup(id)
          await invalidateTabGroups()
          success(t('trashPage.deleteSuccess'))
        } catch (err) {
          logger.error('Failed to delete:', err)
          showError(t('trashPage.deleteFailed'))
        }
      },
    })
  }

  if (trashQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{tc('status.loading')}</p>
        </div>
      </div>
    )
  }

  if (trashQuery.isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-4">{t('trashPage.loadFailed')}</p>
          <button
            onClick={() => {
              void trashQuery.refetch()
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            {tc('button.retry')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-screen flex flex-col bg-background ${isMobile ? 'overflow-hidden' : ''}`}>
      {isMobile && (
        <MobileHeader
          title={t('trashPage.title')}
          showMenu={false}
          showSearch={false}
          showMore={false}
        />
      )}

      <div className={`flex-1 overflow-y-auto ${isMobile ? 'pb-20 min-h-0' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {!isMobile && (
            <div className="mb-8">
              <Link
                to="/tab"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>{t('statistics.backToTabGroups')}</span>
              </Link>
              <div className="flex items-center gap-3 mb-2">
                <Archive className="w-8 h-8 text-muted-foreground" />
                <h1 className="text-3xl font-bold text-foreground">{t('trashPage.title')}</h1>
              </div>
              <p className="text-muted-foreground">{t('trashPage.description')}</p>
            </div>
          )}

          {tabGroups.length === 0 ? (
            <div className="text-center py-16">
              <Archive className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">{t('trashPage.empty')}</h3>
              <p className="text-muted-foreground">{t('trashPage.emptyDescription')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tabGroups.map((group) => (
                <div key={group.id} className="card p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-2">{group.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Layers className="w-4 h-4" />
                          <span>{t('header.tabCount', { count: group.item_count || 0 })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {t('trashPage.deletedAt')}{' '}
                            {group.deleted_at
                              ? formatDistanceToNow(new Date(group.deleted_at), {
                                  addSuffix: true,
                                  locale: dateLocale,
                                })
                              : '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRestore(group.id, group.title)}
                        className="flex items-center gap-2 px-4 py-2 bg-success text-success-foreground rounded-lg hover:bg-success/90 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        {t('trashPage.restore')}
                      </button>
                      <button
                        onClick={() => handlePermanentDelete(group.id, group.title)}
                        className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        {t('trashPage.permanentDelete')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <ConfirmDialog
            isOpen={confirmDialog.isOpen}
            title={confirmDialog.title}
            message={confirmDialog.message}
            onConfirm={confirmDialog.onConfirm}
            onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
          />
        </div>
      </div>

      {isMobile && <BottomNav />}
    </div>
  )
}
