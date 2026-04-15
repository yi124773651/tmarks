import { useTranslation } from 'react-i18next'
import type { TabGroupItem } from '@/lib/types'
import { ExternalLink, Trash2, Check, CheckCircle2, Circle, MoreVertical, Edit2, FolderInput, Archive } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { Locale } from 'date-fns'
import { DropdownMenu } from '@/components/common/DropdownMenu'

interface TodoItemCardProps {
  item: TabGroupItem
  groupId: string
  groupTitle: string
  processingId: string | null
  editingItemId: string | null
  editingTitle: string
  dateLocale: Locale
  onToggleTodo: (itemId: string, currentStatus: boolean) => void
  onDelete: (itemId: string) => void
  onRename: (item: TabGroupItem) => void
  onSaveRename: (itemId: string) => void
  onOpenTab: (url: string) => void
  onOpenInCurrentTab: (url: string) => void
  onOpenInIncognito: () => void
  onMove: (itemId: string, groupId: string) => void
  onArchive: (itemId: string) => void
  setEditingItemId: (id: string | null) => void
  setEditingTitle: (title: string) => void
}

export function TodoItemCard({
  item,
  groupId,
  groupTitle,
  processingId,
  editingItemId,
  editingTitle,
  dateLocale,
  onToggleTodo,
  onDelete,
  onRename,
  onSaveRename,
  onOpenTab,
  onOpenInCurrentTab,
  onOpenInIncognito,
  onMove,
  onArchive,
  setEditingItemId,
  setEditingTitle,
}: TodoItemCardProps) {
  const { t } = useTranslation('tabGroups')

  const relativeTime = item.created_at
    ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: dateLocale })
    : ''

  return (
    <div
      className="group bg-card rounded-lg p-4 border border-border hover:shadow-md hover:border-primary/30 transition-all duration-200"
    >
      {/* 标题和操作 */}
      <div className="flex items-start gap-3">
        {/* 复选框 */}
        <button
          onClick={() => onToggleTodo(item.id, item.is_todo || false)}
          disabled={processingId === item.id}
          className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 ${
            processingId === item.id
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:scale-110 hover:border-primary'
          } ${
            item.is_todo
              ? 'border-primary bg-primary/10'
              : 'border-border hover:bg-muted'
          }`}
        >
          {item.is_todo && (
            <Check className="w-4 h-4 text-primary" />
          )}
        </button>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          {editingItemId === item.id ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSaveRename(item.id)
                  } else if (e.key === 'Escape') {
                    setEditingItemId(null)
                    setEditingTitle('')
                  }
                }}
                className="input flex-1 text-sm"
                autoFocus
              />
              <button
                onClick={() => onSaveRename(item.id)}
                className="text-success hover:text-success/80"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setEditingItemId(null)
                  setEditingTitle('')
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {item.title}
            </h3>
          )}

          {/* 来源标签 */}
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">
              <Circle className="w-2 h-2 fill-current" />
              {groupTitle}
            </span>
            {relativeTime && (
              <span className="text-xs text-muted-foreground/70">
                {relativeTime}
              </span>
            )}
          </div>

          {/* URL */}
          {item.url && (
            <div className="flex items-center gap-1 mt-2">
              <ExternalLink className="w-3 h-3 text-muted-foreground/70" />
              <p className="text-xs text-muted-foreground truncate">
                {(() => { try { return new URL(item.url).hostname } catch { return item.url } })()}
              </p>
            </div>
          )}
        </div>

        {/* 三个点菜单 */}
        <DropdownMenu
          trigger={
            <button className="flex-shrink-0 p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
          }
          items={[
            {
              label: t('menu.openInNewWindow'),
              icon: <ExternalLink className="w-4 h-4" />,
              onClick: () => onOpenTab(item.url),
            },
            {
              label: t('menu.openInCurrentWindow'),
              icon: <ExternalLink className="w-4 h-4" />,
              onClick: () => onOpenInCurrentTab(item.url),
            },
            {
              label: t('menu.openInIncognito'),
              icon: <ExternalLink className="w-4 h-4" />,
              onClick: () => onOpenInIncognito(),
            },
            {
              label: t('menu.rename'),
              icon: <Edit2 className="w-4 h-4" />,
              onClick: () => onRename(item),
            },
            {
              label: item.is_todo ? t('todo.cancelTaskMark') : t('todo.markAsCompleted'),
              icon: <CheckCircle2 className="w-4 h-4" />,
              onClick: () => onToggleTodo(item.id, item.is_todo || false),
            },
            {
              label: t('todo.moveToOtherGroup'),
              icon: <FolderInput className="w-4 h-4" />,
              onClick: () => onMove(item.id, groupId),
            },
            {
              label: t('todo.markAsArchived'),
              icon: <Archive className="w-4 h-4" />,
              onClick: () => onArchive(item.id),
            },
            {
              label: t('menu.moveToTrash'),
              icon: <Trash2 className="w-4 h-4" />,
              onClick: () => onDelete(item.id),
              danger: true,
            },
          ]}
        />
      </div>
    </div>
  )
}
