import { Layers, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface EmptyStateProps {
  isSearching: boolean
  searchQuery?: string
}

export function EmptyState({ isSearching, searchQuery }: EmptyStateProps) {
  const { t } = useTranslation('tabGroups')

  if (isSearching) {
    return (
      <div className="text-center py-16">
        <Search className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          {t('search.noResults')}
        </h3>
        <p className="text-muted-foreground">
          {t('search.tryDifferent', { query: searchQuery })}
        </p>
      </div>
    )
  }

  return (
    <div className="text-center py-16 w-full">
      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
        <Layers className="w-12 h-12 text-primary" />
      </div>
      <h3 className="text-2xl font-bold text-foreground mb-3">
        {t('empty.title')}
      </h3>
      <p className="text-muted-foreground mb-6">
        {t('empty.description')}
      </p>
      <div className="flex items-center justify-center gap-4">
        <div className="text-sm text-muted-foreground/80">
          {t('empty.tip')}
        </div>
      </div>
    </div>
  )
}
