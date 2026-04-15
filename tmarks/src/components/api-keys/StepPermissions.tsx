import { useTranslation } from 'react-i18next'
import {
  PERMISSION_TEMPLATES,
  getPermissionLabel,
  type PermissionTemplate,
} from '@shared/permissions'
import type { CreateApiKeyRequest } from '@/services/api-keys'

interface StepPermissionsProps {
  formData: CreateApiKeyRequest
  onChange: (data: Partial<CreateApiKeyRequest>) => void
  onNext: () => void
  onBack: () => void
  canProceed: boolean
}

export function StepPermissions({
  formData,
  onChange,
  onNext,
  onBack,
  canProceed,
}: StepPermissionsProps) {
  const { t } = useTranslation('settings')

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-foreground mb-4">
        {t('apiKey.create.title')} - {t('apiKey.create.step', { current: 2, total: 3 })}
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            {t('apiKey.create.quickSelect')}
          </label>
          <div className="space-y-2">
            {(Object.keys(PERMISSION_TEMPLATES) as PermissionTemplate[]).map(
              (template) => (
                <label
                  key={template}
                  className="flex items-start gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/30"
                >
                  <input
                    type="radio"
                    name="template"
                    checked={formData.template === template}
                    onChange={() => onChange({ template })}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-foreground">
                      {t(PERMISSION_TEMPLATES[template].nameKey)}
                      {template === 'BASIC' && (
                        <span className="ml-2 text-xs bg-primary text-primary-content px-2 py-0.5 rounded">
                          {t('apiKey.create.recommended')}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t(PERMISSION_TEMPLATES[template].descriptionKey)}
                    </div>
                  </div>
                </label>
              )
            )}
          </div>
        </div>

        {/* 预览权限 */}
        <div className="p-4 bg-muted/30 border border-border rounded-lg">
          <div className="text-sm font-medium text-foreground mb-2">
            {t('apiKey.create.includedPermissions')}
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            {(formData.template
              ? PERMISSION_TEMPLATES[formData.template].permissions
              : formData.permissions || []
            ).map((perm: string) => (
              <div key={perm} className="flex items-center gap-2">
                <span>✓</span>
                <span className="font-medium">{getPermissionLabel(perm)}</span>
                <span className="text-muted-foreground/60">({perm})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <button className="btn" onClick={onBack}>
          {t('apiKey.create.prev')}
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
