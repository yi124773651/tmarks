import { useTranslation } from 'react-i18next'
import type { CreateApiKeyRequest } from '@/services/api-keys'

interface StepBasicInfoProps {
  formData: CreateApiKeyRequest
  onChange: (data: Partial<CreateApiKeyRequest>) => void
  onNext: () => void
  onCancel: () => void
  canProceed: boolean
}

export function StepBasicInfo({
  formData,
  onChange,
  onNext,
  onCancel,
  canProceed,
}: StepBasicInfoProps) {
  const { t } = useTranslation('settings')

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-foreground mb-4">
        {t('apiKey.create.title')} - {t('apiKey.create.step', { current: 1, total: 3 })}
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {t('apiKey.create.nameRequired')}
          </label>
          <input
            type="text"
            className="input w-full"
            placeholder={t('apiKey.create.namePlaceholder')}
            value={formData.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {t('apiKey.create.nameHint')}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {t('apiKey.create.description')}
          </label>
          <textarea
            className="input w-full h-20 resize-none"
            placeholder={t('apiKey.create.descriptionPlaceholder')}
            value={formData.description}
            onChange={(e) => onChange({ description: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <button className="btn" onClick={onCancel}>
          {t('apiKey.create.cancel')}
        </button>
        <button
          className="btn btn-primary"
          onClick={onNext}
          disabled={!canProceed}
        >
          {t('apiKey.create.next')}
        </button>
      </div>
    </div>
  )
}
