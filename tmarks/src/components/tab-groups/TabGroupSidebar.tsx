import type { TabGroup } from '@/lib/types'
import { ChevronRight, ChevronDown, Circle } from 'lucide-react'
import { useState } from 'react'

interface TabGroupSidebarProps {
  tabGroups: TabGroup[]
  selectedGroupId: string | null
  onSelectGroup: (groupId: string | null) => void
}

const colorClasses: Record<string, string> = {
  '红色': 'text-red-500',
  '橙色': 'text-orange-500',
  '黄色': 'text-yellow-500',
  '绿色': 'text-green-500',
  '青色': 'text-cyan-500',
  '蓝色': 'text-blue-500',
  '紫色': 'text-purple-500',
  '粉色': 'text-pink-500',
  '灰色': 'text-gray-500',
}

export function TabGroupSidebar({
  tabGroups,
  selectedGroupId,
  onSelectGroup,
}: TabGroupSidebarProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const totalCount = tabGroups.reduce((sum, group) => sum + (group.item_count || 0), 0)

  const toggleGroup = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  return (
    <div className="w-full h-full bg-white border-r border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-200">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          标签页组
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {/* 全部 */}
        <div
          onClick={() => onSelectGroup(null)}
          className={`group flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-100 ${
            selectedGroupId === null ? 'bg-blue-50' : ''
          }`}
        >
          <div className="w-4 h-4 flex items-center justify-center">
            <Circle className={`w-2 h-2 ${selectedGroupId === null ? 'fill-blue-500 text-blue-500' : 'text-gray-400'}`} />
          </div>
          <span className={`text-sm flex-1 ${selectedGroupId === null ? 'text-blue-600 font-medium' : 'text-gray-700'}`}>
            全部
          </span>
          <span className="text-xs text-gray-500">{totalCount}</span>
        </div>

        {/* 标签页组列表 */}
        {tabGroups.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <p className="text-xs text-gray-400">暂无分组</p>
          </div>
        ) : (
          tabGroups.map((group) => {
            const isSelected = selectedGroupId === group.id
            const isExpanded = expandedGroups.has(group.id)
            const hasItems = (group.items?.length || 0) > 0

            return (
              <div key={group.id}>
                {/* 分组行 */}
                <div
                  className={`group flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-100 ${
                    isSelected ? 'bg-blue-50' : ''
                  }`}
                >
                  {/* 展开/折叠按钮 */}
                  <button
                    onClick={(e) => toggleGroup(group.id, e)}
                    className="w-4 h-4 flex items-center justify-center hover:bg-gray-200 rounded"
                  >
                    {hasItems ? (
                      isExpanded ? (
                        <ChevronDown className="w-3 h-3 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-gray-500" />
                      )
                    ) : (
                      <div className="w-3 h-3" />
                    )}
                  </button>

                  {/* 颜色圆点 */}
                  <Circle
                    className={`w-2 h-2 flex-shrink-0 ${
                      group.color ? colorClasses[group.color] : 'text-gray-400'
                    } ${isSelected ? 'fill-current' : ''}`}
                  />

                  {/* 标题 */}
                  <span
                    onClick={() => onSelectGroup(group.id)}
                    className={`text-sm flex-1 truncate ${
                      isSelected ? 'text-blue-600 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {group.title}
                  </span>

                  {/* 数量 */}
                  <span className="text-xs text-gray-500">{group.item_count || 0}</span>
                </div>

                {/* 子项列表 */}
                {isExpanded && hasItems && (
                  <div className="bg-gray-50">
                    {group.items?.slice(0, 10).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 px-3 py-1 pl-11 hover:bg-gray-100 cursor-pointer"
                        onClick={() => window.open(item.url, '_blank')}
                      >
                        <Circle className="w-1.5 h-1.5 text-gray-400" />
                        <span className="text-xs text-gray-600 truncate flex-1">{item.title}</span>
                      </div>
                    ))}
                    {(group.items?.length || 0) > 10 && (
                      <div className="px-3 py-1 pl-11 text-xs text-gray-400">
                        还有 {(group.items?.length || 0) - 10} 项...
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
