import { Calendar, Edit2, Check, X, Palette, Share2, FolderOpen, Download, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { TabGroup } from '@/lib/types'

interface TabGroupHeaderProps {
  group: TabGroup
  isEditingTitle: boolean
  editingTitle: string
  onEditTitle: () => void
  onSaveTitle: () => void
  onCancelEdit: () => void
  onTitleChange: (title: string) => void
  onColorClick: () => void
  onShareClick: () => void
  onOpenAll: () => void
  onExport: () => void
  onDelete: () => void
  isDeleting: boolean
  colorPickerSlot?: React.ReactNode
}

export function TabGroupHeader({
  group,
  isEditingTitle,
  editingTitle,
  onEditTitle,
  onSaveTitle,
  onCancelEdit,
  onTitleChange,
  onColorClick,
  onShareClick,
  onOpenAll,
  onExport,
  onDelete,
  isDeleting,
  colorPickerSlot,
}: TabGroupHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        {/* Title */}
        <div className="flex items-center gap-3 mb-2">
          {isEditingTitle ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => onTitleChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSaveTitle()
                  } else if (e.key === 'Escape') {
                    onCancelEdit()
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                onClick={onSaveTitle}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="保存"
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                onClick={onCancelEdit}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="取消"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
              <h3 className="text-xl font-semibold text-gray-900 flex-1">
                {group.title}
              </h3>
              <button
                onClick={onEditTitle}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="重命名"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>
              {formatDistanceToNow(new Date(group.created_at), {
                addSuffix: true,
                locale: zhCN,
              })}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span>{group.items?.length || 0} 个标签页</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 ml-4">
        <button
          onClick={onOpenAll}
          disabled={!group.items || group.items.length === 0}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="打开全部"
        >
          <FolderOpen className="w-5 h-5" />
        </button>
        <button
          onClick={onExport}
          disabled={!group.items || group.items.length === 0}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="导出 Markdown"
        >
          <Download className="w-5 h-5" />
        </button>
        <div className="relative">
          <button
            onClick={onColorClick}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="设置颜色"
          >
            <Palette className="w-5 h-5" />
          </button>
          {colorPickerSlot}
        </div>
        <button
          onClick={onShareClick}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="分享"
        >
          <Share2 className="w-5 h-5" />
        </button>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={isDeleting ? '删除中...' : '删除'}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

