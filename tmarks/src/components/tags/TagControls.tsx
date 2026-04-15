import { useTranslation } from 'react-i18next'

interface TagControlsProps {
  sortBy: 'usage' | 'name' | 'clicks'
  onSortChange: (sortBy: 'usage' | 'name' | 'clicks') => void
  layout: 'grid' | 'masonry'
  onLayoutChange: (layout: 'grid' | 'masonry') => void
  selectedCount: number
  onClearSelection: () => void
}

export function TagControls({
  sortBy,
  onSortChange,
  layout,
  onLayoutChange,
  selectedCount,
  onClearSelection,
}: TagControlsProps) {
  const { t } = useTranslation('tags')
  
  const handleSortToggle = () => {
    if (sortBy === 'usage') {
      onSortChange('clicks')
    } else if (sortBy === 'clicks') {
      onSortChange('name')
    } else {
      onSortChange('usage')
    }
  }

  const getSortIcon = () => {
    switch (sortBy) {
      case 'usage':
        return {
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          ),
          title: t('sort.byUsage'),
        }
      case 'clicks':
        return {
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
          ),
          title: t('sort.byClicks'),
        }
      case 'name':
        return {
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
          ),
          title: t('sort.byName'),
        }
    }
  }

  const sortConfig = getSortIcon()

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleSortToggle}
        className="btn btn-sm btn-ghost p-2 flex-shrink-0"
        title={sortConfig.title}
      >
        {sortConfig.icon}
      </button>

      <button
        onClick={() => onLayoutChange(layout === 'grid' ? 'masonry' : 'grid')}
        className="btn btn-sm btn-ghost p-2 flex-shrink-0"
        title={layout === 'grid' ? t('layout.grid') : t('layout.masonry')}
      >
        {layout === 'grid' ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h6v4H4V5zM4 11h6v8H4v-8zM12 5h8v6h-8V5zM12 13h8v6h-8v-6z" />
          </svg>
        )}
      </button>

      <button
        onClick={onClearSelection}
        disabled={selectedCount === 0}
        className={`btn btn-sm p-2 flex-shrink-0 ${
          selectedCount === 0
            ? 'btn-disabled'
            : 'btn-ghost hover:bg-error/10 hover:text-error'
        }`}
        title={selectedCount > 0 ? t('selection.clearWithCount', { count: selectedCount }) : t('selection.clear')}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
