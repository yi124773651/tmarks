/**
 * API Keys Management Page
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApiKeys, useRevokeApiKey, useDeleteApiKey } from '@/hooks/useApiKeys'
import { CreateApiKeyModal } from '@/components/api-keys/CreateApiKeyModal'
import { ApiKeyCard } from '@/components/api-keys/ApiKeyCard'
import { ApiKeyDetailModal } from '@/components/api-keys/ApiKeyDetailModal'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { AlertDialog } from '@/components/common/AlertDialog'
import type { ApiKey } from '@/services/api-keys'

export function ApiKeysPage() {
  const { t } = useTranslation('settings')
  const { t: tCommon } = useTranslation('common')
  const { data, isLoading } = useApiKeys()
  const revokeApiKey = useRevokeApiKey()
  const deleteApiKey = useDeleteApiKey()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null)
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  } | null>(null)
  const [alertState, setAlertState] = useState<{
    isOpen: boolean
    title: string
    message: string
    type: 'success' | 'error' | 'info' | 'warning'
  } | null>(null)

  const handleRevoke = async (id: string) => {
    setConfirmState({
      isOpen: true,
      title: t('apiKey.page.revokeTitle'),
      message: t('apiKey.page.revokeMessage'),
      onConfirm: async () => {
        setConfirmState(null)
        try {
          await revokeApiKey.mutateAsync(id)
          setAlertState({
            isOpen: true,
            title: tCommon('dialog.successTitle'),
            message: t('apiKey.page.revokeSuccess'),
            type: 'success',
          })
        } catch {
          setAlertState({
            isOpen: true,
            title: tCommon('dialog.errorTitle'),
            message: t('apiKey.page.revokeFailed'),
            type: 'error',
          })
        }
      },
    })
  }

  const handleDelete = async (id: string) => {
    setConfirmState({
      isOpen: true,
      title: t('apiKey.page.deleteTitle'),
      message: t('apiKey.page.deleteMessage'),
      onConfirm: async () => {
        setConfirmState(null)
        try {
          await deleteApiKey.mutateAsync(id)
          setAlertState({
            isOpen: true,
            title: tCommon('dialog.successTitle'),
            message: t('apiKey.page.deleteSuccess'),
            type: 'success',
          })
        } catch {
          setAlertState({
            isOpen: true,
            title: tCommon('dialog.errorTitle'),
            message: t('apiKey.page.deleteFailed'),
            type: 'error',
          })
        }
      },
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center text-muted-foreground">{tCommon('status.loading')}</div>
      </div>
    )
  }

  const keys = data?.keys || []
  const quota = data?.quota || { used: 0, limit: 3 }

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      {confirmState && (
        <ConfirmDialog
          isOpen={confirmState.isOpen}
          title={confirmState.title}
          message={confirmState.message}
          type="warning"
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}

      {alertState && (
        <AlertDialog
          isOpen={alertState.isOpen}
          title={alertState.title}
          message={alertState.message}
          type={alertState.type}
          onConfirm={() => setAlertState(null)}
        />
      )}

      {/* Title card */}
      <div className="card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('apiKey.page.title')}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t('apiKey.page.description')}
            </p>
          </div>
          <button
            className="btn btn-primary w-full sm:w-auto touch-manipulation"
            onClick={() => setShowCreateModal(true)}
            disabled={quota.used >= quota.limit}
          >
            + {t('apiKey.page.createNew')}
          </button>
        </div>
      </div>

      {/* Content card */}
      <div className="card p-4 sm:p-6">
        {/* Info text */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-muted/30 border border-border rounded-lg">
          <p className="text-xs sm:text-sm text-muted-foreground mb-2 leading-relaxed">
            {t('apiKey.page.info')}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t('apiKey.page.currentUsage')}: <strong>{quota.used} / {quota.limit >= 999 ? t('apiKey.page.unlimited') : quota.limit}</strong>
          </p>
        </div>

        {/* API Keys list */}
        {keys.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-sm sm:text-base text-muted-foreground mb-4">{t('apiKey.page.empty')}</p>
            <button
              className="btn btn-primary w-full sm:w-auto touch-manipulation"
              onClick={() => setShowCreateModal(true)}
            >
              {t('apiKey.page.createFirst')}
            </button>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {keys.map((key) => (
              <ApiKeyCard
                key={key.id}
                apiKey={key}
                onViewDetails={() => setSelectedKey(key)}
                onRevoke={() => handleRevoke(key.id)}
                onDelete={() => handleDelete(key.id)}
              />
            ))}
          </div>
        )}

        {/* Tips */}
        <div className="mt-6 p-4 bg-info/10 border border-info/30 rounded-lg">
          <h4 className="font-medium text-info mb-2">{t('apiKey.page.tipsTitle')}</h4>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>{t('apiKey.page.tip1', { limit: quota.limit >= 999 ? t('apiKey.page.unlimited') : quota.limit })}</li>
            <li>{t('apiKey.page.tip2')}</li>
            <li>{t('apiKey.page.tip3')}</li>
          </ul>
        </div>
      </div>

      {/* 创建 API Key 模态框 */}
      {showCreateModal && (
        <CreateApiKeyModal onClose={() => setShowCreateModal(false)} />
      )}

      {/* API Key 详情模态框 */}
      {selectedKey && (
        <ApiKeyDetailModal
          apiKey={selectedKey}
          onClose={() => setSelectedKey(null)}
        />
      )}
    </div>
  )
}
