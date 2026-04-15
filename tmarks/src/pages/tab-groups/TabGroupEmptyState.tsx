import { ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function TabGroupEmptyState() {
  const { t } = useTranslation('tabGroups')

  return (
    <div className="text-center py-12 rounded-2xl border border-border bg-card">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
        <ExternalLink className="w-8 h-8" style={{ color: 'var(--muted-foreground)' }} />
      </div>
      <p className="text-lg font-medium mb-1" style={{ color: 'var(--foreground)' }}>
        {t('detail.noTabs')}
      </p>
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        {t('detail.tabsCleared')}
      </p>
    </div>
  )
}
