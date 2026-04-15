/**
 * API 密钥设置标签页
 * 管理 API 密钥的创建、查看、撤销和删除
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Key, Copy, Trash2, Plus, Eye, Ban, Info, AlertTriangle } from 'lucide-react'
import { useApiKeys, useRevokeApiKey, useDeleteApiKey } from '@/hooks/useApiKeys'
import { useToastStore } from '@/stores/toastStore'
import { CreateApiKeyModal } from '@/components/api-keys/CreateApiKeyModal'
import { ApiKeyDetailModal } from '@/components/api-keys/ApiKeyDetailModal'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { SettingsSection, SettingsDivider } from '../SettingsSection'
import { InfoBox } from '../InfoBox'
import type { ApiKey } from '@/services/api-keys'

export function ApiSettingsTab() {
  const { t } = useTranslation('settings')
  const { data, isLoading } = useApiKeys()
  const revokeApiKey = useRevokeApiKey()
  const deleteApiKey = useDeleteApiKey()
  const { addToast } = useToastStore()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null)
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
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
          addToast('success', t('apiKey.page.revokeSuccess'))
        } catch {
          addToast('error', t('apiKey.page.revokeFailed'))
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
          addToast('success', t('apiKey.page.deleteSuccess'))
        } catch {
          addToast('error', t('apiKey.page.deleteFailed'))
        }
      },
    })
  }

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key)
    addToast('success', t('share.copySuccess'))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const keys = data?.keys || []
  const quota = data?.quota || { used: 0, limit: 3 }

  return (
    <div className="space-y-6">
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

      {/* 密钥管理 */}
      <SettingsSection icon={Key} title={t('apiKey.page.title')} description={t('apiKey.page.description')}>
        <div className="space-y-4">
          {/* 配额和创建按钮 */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="text-sm">
              <span className="text-muted-foreground">{t('apiKey.page.currentUsage')}</span>
              <span className="font-medium ml-2">
                {quota.used} / {quota.limit >= 999 ? t('apiKey.page.unlimited') : quota.limit}
              </span>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={quota.used >= quota.limit}
              className="btn btn-primary btn-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('apiKey.page.createNew')}
            </button>
          </div>

          {/* 密钥列表 */}
          {keys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{t('apiKey.page.empty')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {keys.map((key: ApiKey) => (
                <div
                  key={key.id}
                  className={`p-3 rounded-lg border ${
                    key.status === 'revoked'
                      ? 'border-error/30 bg-error/5'
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Key className={`w-4 h-4 ${key.status === 'revoked' ? 'text-error' : 'text-primary'}`} />
                        <span className="font-medium text-sm">{key.name}</span>
                        {key.status === 'revoked' && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-error/20 text-error">
                            {t('apiKey.status.revoked')}
                          </span>
                        )}
                      </div>
                      <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                        {key.key_prefix}••••••••
                      </code>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleCopy(key.key_prefix)} className="p-1.5 hover:bg-muted rounded" title={t('apiKey.copyPrefix')}>
                        <Copy className="w-4 h-4" />
                      </button>
                      <button onClick={() => setSelectedKey(key)} className="p-1.5 hover:bg-muted rounded" title={t('apiKey.viewDetails')}>
                        <Eye className="w-4 h-4" />
                      </button>
                      {key.status === 'active' && (
                        <button onClick={() => handleRevoke(key.id)} className="p-1.5 text-warning hover:bg-warning/10 rounded" title={t('apiKey.revoke')}>
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => handleDelete(key.id)} className="p-1.5 text-error hover:bg-error/10 rounded" title={t('apiKey.delete')}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SettingsSection>

      <SettingsDivider />

      <div className="grid sm:grid-cols-2 gap-3">
        <InfoBox icon={Info} title={t('apiKey.infoBox.usageTitle')} variant="info">
          <ul className="space-y-1 text-xs">
            <li>• {t('apiKey.infoBox.usageTip1')}</li>
            <li>• {t('apiKey.page.tip2')}</li>
          </ul>
        </InfoBox>

        <InfoBox icon={AlertTriangle} title={t('apiKey.infoBox.securityTitle')} variant="warning">
          <ul className="space-y-1 text-xs">
            <li>• {t('apiKey.infoBox.securityTip1')}</li>
            <li>• {t('apiKey.infoBox.securityTip2')}</li>
          </ul>
        </InfoBox>
      </div>

      {showCreateModal && <CreateApiKeyModal onClose={() => setShowCreateModal(false)} />}
      {selectedKey && <ApiKeyDetailModal apiKey={selectedKey} onClose={() => setSelectedKey(null)} />}
    </div>
  )
}
