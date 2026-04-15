import { Search, CheckCircle, Archive, ArrowUpDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { SortOption } from './sortUtils'
import { useIsMobile } from '@/hooks/useMediaQuery'

interface SearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  sortBy: SortOption
  onSortChange: (sort: SortOption) => void
  onBatchModeToggle: () => void
  batchMode: boolean
}

export function SearchBar({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  onBatchModeToggle,
  batchMode,
}: SearchBarProps) {
  const { t } = useTranslation('tabGroups')
  const isMobile = useIsMobile()

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'created', label: t('sort.created') },
    { value: 'title', label: t('sort.title') },
    { value: 'count', label: t('sort.count') },
  ]

  const currentSortLabel = sortOptions.find(opt => opt.value === sortBy)?.label || t('sort.label')

  return (
    <div className="flex items-center gap-2 flex-1">
      {/* Search Input */}
      <div className="flex-1 relative min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder={t('search.placeholder')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="input w-full pl-10"
        />
      </div>

      {/* Sort Selector - Icon Only */}
      <div className="relative flex-shrink-0">
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="appearance-none w-10 h-10 flex items-center justify-center border border-border rounded hover:bg-muted transition-colors cursor-pointer opacity-0 absolute inset-0"
          title={currentSortLabel}
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="w-10 h-10 flex items-center justify-center border border-border rounded hover:bg-muted transition-colors pointer-events-none" style={{backgroundColor: 'var(--card)'}}>
          <ArrowUpDown className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>

      {/* Batch Mode Toggle - Icon Only */}
      <button
        onClick={onBatchModeToggle}
        className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded transition-colors ${
          batchMode
            ? 'bg-primary text-primary-foreground'
            : 'border border-border hover:bg-muted text-muted-foreground'
        }`}
        title={batchMode ? t('batch.exit') : t('batch.enter')}
      >
        <CheckCircle className="w-5 h-5" />
      </button>

      {/* Trash Link - 移动端隐藏（在底部导航） */}
      {!isMobile && (
        <Link
          to="/tab/trash"
          className="w-10 h-10 flex-shrink-0 flex items-center justify-center border border-border rounded hover:bg-muted transition-colors text-muted-foreground"
          title={t('trash.title')}
        >
          <Archive className="w-5 h-5" />
        </Link>
      )}
    </div>
  )
}
