import { useTranslation } from 'react-i18next'

interface SettingsTipsProps {
  tips: string[]
}

export function SettingsTips({ tips }: SettingsTipsProps) {
  const { t } = useTranslation('settings')

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-foreground mb-2">
        {t('tips.title')}
      </h4>
      <ul className="text-xs text-muted-foreground space-y-1">
        {tips.map((tip, index) => (
          <li key={index}>• {tip}</li>
        ))}
      </ul>
    </div>
  )
}
