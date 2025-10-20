import { Search, CheckCircle, BarChart3, Archive } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SortSelector, type SortOption } from './SortSelector'

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
  return (
    <div className="flex items-center gap-4 mb-6">
      {/* Search Input */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="搜索标签页组..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="input w-full pl-10"
        />
      </div>

      {/* Sort Selector */}
      <SortSelector value={sortBy} onChange={onSortChange} />

      {/* Batch Mode Toggle */}
      <button
        onClick={onBatchModeToggle}
        className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
          batchMode
            ? 'bg-primary text-primary-foreground'
            : 'btn-outline'
        }`}
      >
        <CheckCircle className="w-5 h-5" />
        批量操作
      </button>

      {/* Statistics Link */}
      <Link
        to="/tab-groups/statistics"
        className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded hover:bg-muted transition-colors text-foreground"
      >
        <BarChart3 className="w-5 h-5" />
        统计
      </Link>

      {/* Trash Link */}
      <Link
        to="/tab-groups/trash"
        className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded hover:bg-muted transition-colors text-foreground"
      >
        <Archive className="w-5 h-5" />
        回收站
      </Link>
    </div>
  )
}

