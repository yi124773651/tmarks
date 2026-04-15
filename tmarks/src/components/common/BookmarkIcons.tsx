import { 
  LayoutGrid, 
  List, 
  AlignLeft, 
  Type, 
  Eye, 
  Lock, 
  Layers, 
  Calendar, 
  RefreshCw, 
  Bookmark as BookmarkIcon, 
  TrendingUp 
} from 'lucide-react'
import type { ViewMode, VisibilityFilter } from '@/lib/constants/bookmarks'
import type { SortOption } from '@/components/common/SortSelector'

export function ViewModeIcon({ mode, className }: { mode: ViewMode, className?: string }) {
  const baseClass = className || "w-4 h-4"
  switch (mode) {
    case 'card':
      return <LayoutGrid className={baseClass} />
    case 'list':
      return <List className={baseClass} />
    case 'minimal':
      return <AlignLeft className={baseClass} />
    case 'title':
      return <Type className={baseClass} />
    default:
      return <LayoutGrid className={baseClass} />
  }
}

export function VisibilityIcon({ filter, className }: { filter: VisibilityFilter, className?: string }) {
  const baseClass = className || "w-4 h-4"
  switch (filter) {
    case 'public':
      return <Eye className={baseClass} />
    case 'private':
      return <Lock className={baseClass} />
    case 'all':
      return <Layers className={baseClass} />
    default:
      return <Layers className={baseClass} />
  }
}

export function SortIcon({ sort, className }: { sort: SortOption, className?: string }) {
  const baseClass = className || "w-4 h-4"
  switch (sort) {
    case 'created':
      return <Calendar className={baseClass} />
    case 'updated':
      return <RefreshCw className={baseClass} />
    case 'pinned':
      return <BookmarkIcon className={baseClass} />
    case 'popular':
      return <TrendingUp className={baseClass} />
    default:
      return <Calendar className={baseClass} />
  }
}
