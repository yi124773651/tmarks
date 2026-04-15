/**
 * 创建 API Key 模态框
 * 多步骤流程：基本信息 → 权限设置 → 过期设置 → 显示 Key
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCreateApiKey } from '@/hooks/useApiKeys'
import { AlertDialog } from '@/components/common/AlertDialog'
import { PERMISSION_TEMPLATES } from '@shared/permissions'
import type { ApiKeyWithKey, CreateApiKeyRequest } from '@/services/api-keys'
import { Z_INDEX } from '@/lib/constants/z-index'
import { StepBasicInfo } from './StepBasicInfo'
import { StepPermissions } from './StepPermissions'
import { StepSuccess } from './StepSuccess'

interface CreateApiKeyModalProps {
  onClose: () => void
}

type Step = 'basic' | 'permissions' | 'expiration' | 'success'

export function CreateApiKeyModal({ onClose }: CreateApiKeyModalProps) {
  const { t } = useTranslation('settings')
  const createApiKey = useCreateApiKey()

  const [step, setStep] = useState<Step>('basic')
  const [formData, setFormData] = useState<CreateApiKeyRequest>({
    name: '',
    description: '',
    template: 'BASIC',
    permissions: [],
    expires_at: null,
  })
  const [createdKey, setCreatedKey] = useState<ApiKeyWithKey | null>(null)
  const [showErrorAlert, setShowErrorAlert] = useState(false)

  const updateFormData = (data: Partial<CreateApiKeyRequest>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const handleNext = () => {
    if (step === 'basic') setStep('permissions')
    else if (step === 'permissions') setStep('expiration')
    else if (step === 'expiration') handleCreate()
  }

  const handleBack = () => {
    if (step === 'permissions') setStep('basic')
    else if (step === 'expiration') setStep('permissions')
  }

  const handleCreate = async () => {
    try {
      const result = await createApiKey.mutateAsync(formData)
      setCreatedKey(result)
      setStep('success')
    } catch {
      setShowErrorAlert(true)
    }
  }

  const canProceed = () => {
    if (step === 'basic') return formData.name.trim().length > 0
    if (step === 'permissions') {
      const perms =
        formData.template
          ? PERMISSION_TEMPLATES[formData.template].permissions
          : formData.permissions
      return !!(perms && perms.length > 0)
    }
    return true
  }

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center"
      style={{ zIndex: Z_INDEX.API_KEY_MODAL }}
      onClick={step !== 'success' ? onClose : undefined}
    >
      <AlertDialog
        isOpen={showErrorAlert}
        title={t('apiKey.create.failed')}
        message={t('apiKey.create.failedMessage')}
        type="error"
        onConfirm={() => setShowErrorAlert(false)}
      />

      <div className="card rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--card)' }} onClick={(e) => e.stopPropagation()}>
        {/* 步骤 1: 基本信息 */}
        {step === 'basic' && (
          <StepBasicInfo
            formData={formData}
            onChange={updateFormData}
            onNext={handleNext}
            onCancel={onClose}
            canProceed={canProceed()}
          />
        )}

        {/* 步骤 2: 权限设置 */}
        {step === 'permissions' && (
          <StepPermissions
            formData={formData}
            onChange={updateFormData}
            onNext={handleNext}
            onBack={handleBack}
            canProceed={canProceed()}
          />
        )}

        {/* 步骤 3: 过期设置 */}
        {step === 'expiration' && (
          <div className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">
              {t('apiKey.create.title')} - {t('apiKey.create.step', { current: 3, total: 4 })}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  {t('apiKey.create.expiration')}
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/30">
                    <input
                      type="radio"
                      name="expires"
                      checked={formData.expires_at === null}
                      onChange={() =>
                        updateFormData({ expires_at: null })
                      }
                    />
                    <span className="text-foreground">{t('apiKey.create.neverExpire')}</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/30">
                    <input
                      type="radio"
                      name="expires"
                      checked={formData.expires_at === '30d'}
                      onChange={() =>
                        updateFormData({ expires_at: '30d' })
                      }
                    />
                    <span className="text-foreground">{t('apiKey.create.expireIn30Days')}</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/30">
                    <input
                      type="radio"
                      name="expires"
                      checked={formData.expires_at === '90d'}
                      onChange={() =>
                        updateFormData({ expires_at: '90d' })
                      }
                    />
                    <span className="text-foreground">{t('apiKey.create.expireIn90Days')}</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button className="btn" onClick={handleBack}>
                {t('apiKey.create.prev')}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleNext}
                disabled={createApiKey.isPending}
              >
                {createApiKey.isPending ? t('apiKey.create.creating') : t('apiKey.create.createButton')}
              </button>
            </div>
          </div>
        )}

        {/* 步骤 4: 成功显示 Key */}
        {step === 'success' && createdKey && (
          <StepSuccess
            createdKey={createdKey}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  )
}
