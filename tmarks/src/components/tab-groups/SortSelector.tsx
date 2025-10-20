import { ArrowUpDown } from 'lucide-react'

export type SortOption = 'created' | 'title' | 'count'

interface SortSelectorProps {
  value: SortOption
  onChange: (value: SortOption) => void
}

export function SortSelector({ value, onChange }: SortSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="w-5 h-5 text-gray-600" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        <option value="created">按创建时间</option>
        <option value="title">按标题</option>
        <option value="count">按标签页数量</option>
      </select>
    </div>
  )
}

export function sortTabGroups<T extends { title: string; created_at: string; item_count?: number }>(
  groups: T[],
  sortBy: SortOption
): T[] {
  const sorted = [...groups]

  switch (sortBy) {
    case 'title':
      return sorted.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'))
    case 'count':
      return sorted.sort((a, b) => (b.item_count || 0) - (a.item_count || 0))
    case 'created':
    default:
      return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }
}

