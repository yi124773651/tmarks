import { ExternalLink, Trash2, Edit2, Pin, CheckSquare, Check, X, GripVertical } from 'lucide-react'
import type { TabGroupItem } from '@/lib/types'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface TabItemProps {
  item: TabGroupItem
  groupId: string
  isHighlighted: boolean
  isSelected: boolean
  batchMode: boolean
  editingItemId: string | null
  editingTitle: string
  onItemClick: (item: TabGroupItem, e: React.MouseEvent) => void
  onEditItem: (item: TabGroupItem) => void
  onSaveEdit: (groupId: string, itemId: string) => void
  onTogglePin: (groupId: string, itemId: string, currentPinned: number) => void
  onToggleTodo: (groupId: string, itemId: string, currentTodo: number) => void
  onDeleteItem: (groupId: string, itemId: string, title: string) => void
  setEditingItemId: (id: string | null) => void
  setEditingTitle: (title: string) => void
  extractDomain: (url: string) => string
}

export function TabItem({
  item,
  groupId,
  isHighlighted,
  isSelected,
  batchMode,
  editingItemId,
  editingTitle,
  onItemClick,
  onEditItem,
  onSaveEdit,
  onTogglePin,
  onToggleTodo,
  onDeleteItem,
  setEditingItemId,
  setEditingTitle,
  extractDomain,
}: TabItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const isEditing = editingItemId === item.id

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 p-3 rounded-lg border transition-all ${
        isHighlighted
          ? 'bg-yellow-50 border-yellow-300'
          : isSelected
            ? 'bg-blue-50 border-blue-300'
            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
      }`}
    >
      {/* Drag Handle */}
      {!batchMode && (
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      )}

      {/* Checkbox for batch mode */}
      {batchMode && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation()
            onItemClick(item, e as any)
          }}
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
      )}

      {/* Favicon */}
      <img
        src={`https://www.google.com/s2/favicons?domain=${extractDomain(item.url)}&sz=32`}
        alt=""
        className="w-5 h-5 flex-shrink-0"
        onError={(e) => {
          e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>'
        }}
      />

      {/* Title and URL */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            type="text"
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSaveEdit(groupId, item.id)
              } else if (e.key === 'Escape') {
                setEditingItemId(null)
              }
            }}
            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        ) : (
          <>
            <div className="flex items-center gap-2">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate"
                onClick={(e) => !batchMode && e.stopPropagation()}
              >
                {item.title}
              </a>
              {item.is_pinned === 1 && (
                <Pin className="w-3 h-3 text-blue-600 flex-shrink-0" />
              )}
              {item.is_todo === 1 && (
                <CheckSquare className="w-3 h-3 text-green-600 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-gray-500 truncate">{item.url}</p>
          </>
        )}
      </div>

      {/* Actions */}
      {!batchMode && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isEditing ? (
            <>
              <button
                onClick={() => onSaveEdit(groupId, item.id)}
                className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                title="保存"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => setEditingItemId(null)}
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="取消"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="打开链接"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={() => onEditItem(item)}
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="编辑"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onTogglePin(groupId, item.id, item.is_pinned || 0)}
                className={`p-1.5 rounded transition-colors ${
                  item.is_pinned === 1
                    ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title={item.is_pinned === 1 ? '取消固定' : '固定'}
              >
                <Pin className="w-4 h-4" />
              </button>
              <button
                onClick={() => onToggleTodo(groupId, item.id, item.is_todo || 0)}
                className={`p-1.5 rounded transition-colors ${
                  item.is_todo === 1
                    ? 'text-green-600 bg-green-50 hover:bg-green-100'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title={item.is_todo === 1 ? '取消待办' : '标记待办'}
              >
                <CheckSquare className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteItem(groupId, item.id, item.title)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="删除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

