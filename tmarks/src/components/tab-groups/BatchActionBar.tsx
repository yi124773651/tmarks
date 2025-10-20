import { Trash2, Pin, CheckSquare, Download, X } from 'lucide-react'

interface BatchActionBarProps {
  selectedCount: number
  onSelectAll: () => void
  onDeselectAll: () => void
  onBatchDelete: () => void
  onBatchPin: () => void
  onBatchTodo: () => void
  onBatchExport: () => void
  onCancel: () => void
}

export function BatchActionBar({
  selectedCount,
  onSelectAll,
  onDeselectAll,
  onBatchDelete,
  onBatchPin,
  onBatchTodo,
  onBatchExport,
  onCancel,
}: BatchActionBarProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-blue-900">
            已选择 {selectedCount} 个标签页
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onSelectAll}
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              全选
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={onDeselectAll}
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              取消全选
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBatchPin}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            disabled={selectedCount === 0}
          >
            <Pin className="w-4 h-4" />
            固定
          </button>
          <button
            onClick={onBatchTodo}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            disabled={selectedCount === 0}
          >
            <CheckSquare className="w-4 h-4" />
            待办
          </button>
          <button
            onClick={onBatchExport}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            disabled={selectedCount === 0}
          >
            <Download className="w-4 h-4" />
            导出
          </button>
          <button
            onClick={onBatchDelete}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            disabled={selectedCount === 0}
          >
            <Trash2 className="w-4 h-4" />
            删除
          </button>
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            <X className="w-4 h-4" />
            取消
          </button>
        </div>
      </div>
    </div>
  )
}

