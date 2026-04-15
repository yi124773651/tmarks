import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { RotateCcw, Layers } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useTabGroupDetailQuery, useInvalidateTabGroups } from '@/hooks/useTabGroupsQuery'
import { tabGroupsService } from '@/services/tab-groups'
import { useToastStore } from '@/stores/toastStore'
import { logger } from '@/lib/logger'
import { buildTabOpenerHtml, getThemeColors } from '@/hooks/buildTabOpenerHtml'
import { TabGroupItem } from './TabGroupItem'
import { TabGroupEmptyState } from './TabGroupEmptyState'
import { TabGroupDetailHeader } from './TabGroupDetailHeader'

export function TabGroupDetailPage() {
  const { t } = useTranslation('tabGroups')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { success, error: showError } = useToastStore()
  const detailQuery = useTabGroupDetailQuery(id)
  const invalidateTabGroups = useInvalidateTabGroups()
  const tabGroup = detailQuery.data || null

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

  const refresh = async () => {
    await Promise.all([detailQuery.refetch(), invalidateTabGroups()])
  }

  const handleDelete = () => {
    if (!tabGroup) return
    setConfirmDialog({
      isOpen: true,
      title: t('confirm.deleteGroup'),
      message: t('confirm.deleteGroupMessage', { title: tabGroup.title }),
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
        try {
          await tabGroupsService.deleteTabGroup(tabGroup.id)
          await invalidateTabGroups()
          success(t('message.deleteSuccess'))
          navigate('/tab')
        } catch (err) {
          logger.error('Failed to delete tab group:', err)
          showError(t('message.deleteFailed'))
        }
      },
    })
  }

  const handleRestoreAll = () => {
    if (!tabGroup?.items?.length) return
    const items = tabGroup.items
    const itemCount = items.length
    const message = itemCount > 10
      ? t('detail.openAllWarning', { count: itemCount })
      : t('detail.openAllMessage', { count: itemCount })

    setConfirmDialog({
      isOpen: true,
      title: t('detail.openAllTabs'),
      message,
      onConfirm: () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }))

        // Use tab opener popup to avoid browser popup blocker
        const colors = getThemeColors()
        const i18nSuccessPartial = t('tabOpener.successPartial', { opened: '__OPENED__', failed: '__FAILED__' } as Record<string, unknown>)
          .replace('__OPENED__', "' + opened + '")
          .replace('__FAILED__', "' + failed + '")
        const i18nSuccessAll = t('tabOpener.successAll', { count: '__COUNT__' } as Record<string, unknown>)
          .replace('__COUNT__', "' + opened + '")
        const html = buildTabOpenerHtml(
          items.map(item => ({ url: item.url, title: item.title })),
          colors,
          {
            title: t('tabOpener.title', { defaultValue: 'Opening Tabs' }),
            heading: t('tabOpener.heading', { defaultValue: 'Opening Tabs...' }),
            preparing: t('tabOpener.preparing', { defaultValue: 'Preparing...' }),
            opening: t('tabOpener.opening', { defaultValue: 'Opening: ' }),
            successPartial: i18nSuccessPartial,
            successAll: i18nSuccessAll,
            closeWindow: t('tabOpener.closeWindow', { defaultValue: 'Close Window' }),
          }
        )
        const blob = new Blob([html], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        const newWindow = window.open(url, '_blank', 'width=800,height=600')

        if (newWindow) {
          setTimeout(() => URL.revokeObjectURL(url), 5000)
          success(t('detail.allOpened', { count: itemCount }))
        } else {
          URL.revokeObjectURL(url)
          showError(t('message.cannotOpenWindow', { defaultValue: 'Popup was blocked. Please allow popups for this site.' }))
        }
      },
    })
  }

  if (detailQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{t('page.loading')}</p>
        </div>
      </div>
    )
  }

  if (detailQuery.isError || !tabGroup) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-4">{t('detail.groupNotFound')}</p>
          <button
            onClick={() => navigate('/tab')}
            className="px-4 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            style={{ color: 'var(--foreground)' }}
          >
            {t('detail.backToList')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <TabGroupDetailHeader 
        tabGroup={tabGroup} 
        onRefresh={refresh} 
        onDelete={handleDelete} 
      />

      <div className="space-y-3">
        {tabGroup.items && tabGroup.items.length > 0 ? (
          <>
            <div className="rounded-2xl border border-border bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5" style={{ color: 'var(--foreground)' }} />
                  <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                    {t('detail.totalTabs', { count: tabGroup.items.length })}
                  </span>
                </div>
                <button
                  onClick={handleRestoreAll}
                  className="px-3 py-1.5 rounded-lg bg-success text-success-foreground text-sm font-medium hover:shadow-lg hover:bg-success/90 transition-all duration-200 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {t('detail.restoreAll')}
                </button>
              </div>
            </div>

            {tabGroup.items.map((item, index) => (
              <TabGroupItem
                key={item.id}
                item={item}
                index={index}
                onRefresh={refresh}
              />
            ))}
          </>
        ) : (
          <TabGroupEmptyState />
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
