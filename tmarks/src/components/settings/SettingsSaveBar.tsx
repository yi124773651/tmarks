/**
 * 设置保存栏
 * 当有未保存的变更时从底部滑入显示
 */

import { useTranslation } from 'react-i18next'
import { Save, RotateCcw } from 'lucide-react'

interface SettingsSaveBarProps {
  isDirty: boolean
  isSaving: boolean
  onSave: () => void
  onDiscard: () => void
}

export function SettingsSaveBar({ isDirty, isSaving, onSave, onDiscard }: SettingsSaveBarProps) {
  const { t } = useTranslation('settings')

  if (!isDirty) return null

  return (
    <div className="sticky bottom-0 z-10 mt-6 -mx-3 sm:-mx-6 animate-in slide-in-from-bottom duration-300">
      <div className="bg-card/95 backdrop-blur-sm border-t border-border px-4 py-3 flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">
          {t('message.unsavedChanges')}
        </span>
        <div className="flex gap-2">
          <button
            onClick={onDiscard}
            disabled={isSaving}
            className="btn btn-ghost btn-sm flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t('action.discard')}
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="btn btn-primary btn-sm flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? t('action.saving') : t('action.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
