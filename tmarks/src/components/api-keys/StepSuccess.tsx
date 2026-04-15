import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { ApiKeyWithKey } from '@/services/api-keys'

interface StepSuccessProps {
  createdKey: ApiKeyWithKey
  onClose: () => void
}

export function StepSuccess({ createdKey, onClose }: StepSuccessProps) {
  const { t } = useTranslation('settings')
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(createdKey.key)
    setCopied(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-6">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">⚠️</div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          {t('apiKey.success.title')}
        </h2>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-2">
          {t('apiKey.success.yourKey')}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            className="input flex-1 font-mono text-sm"
            value={createdKey.key}
            readOnly
            onClick={(e) => e.currentTarget.select()}
          />
          <button className="btn" onClick={handleCopy}>
            {copied ? t('apiKey.success.copied') : t('apiKey.success.copy')}
          </button>
        </div>
      </div>

      <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg mb-6">
        <h4 className="font-medium text-warning mb-2">{t('apiKey.success.warning')}</h4>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
          <li>{t('apiKey.success.warningList.showOnce')}</li>
          <li>{t('apiKey.success.warningList.saveNow')}</li>
          <li>{t('apiKey.success.warningList.prefixOnly', { prefix: createdKey.key_prefix })}</li>
        </ul>
      </div>

      <div className="flex justify-center">
        <button className="btn btn-primary" onClick={onClose}>
          {t('apiKey.success.close')}
        </button>
      </div>
    </div>
  )
}
