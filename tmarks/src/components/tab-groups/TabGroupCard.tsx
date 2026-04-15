import { useTranslation } from 'react-i18next'
import { Calendar, Layers, Trash2, Edit2, FolderOpen, Download, Palette, Tag, Share2, Check, X } from 'lucide-react'
import type { TabGroup } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'
import { getColorClasses, getLeftBorderColor } from './colorUtils'
import { TagsList } from './TagsInput'

interface TabItem {
  id: string
  url: string
  title: string
  favicon?: string | null
}

interface TabGroupCardProps {
  group: TabGroup
  onDelete: (id: string, title: string) => void
  onOpenAll: (items: TabItem[]) => void
  onExport: (group: TabGroup) => void
  onColorClick: (groupId: string) => void
  onTagsClick: (groupId: string) => void
  onShareClick: (groupId: string) => void
  isEditingTitle: boolean
  editingTitle: string
  onStartEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onTitleChange: (title: string) => void
  children: React.ReactNode
}

export function TabGroupCard({
  group,
  onDelete,
  onOpenAll,
  onExport,
  onColorClick,
  onTagsClick,
  onShareClick,
  isEditingTitle,
  editingTitle,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onTitleChange,
  children,
}: TabGroupCardProps) {
  const { t, i18n } = useTranslation('tabGroups')
  const dateLocale = i18n.language === 'zh-CN' ? zhCN : enUS
  const colorClasses = getColorClasses(group.color)
  const leftBorderColor = getLeftBorderColor(group.color)

  return (
    <div className={`card border-l-4 hover:shadow-xl transition-all duration-200 ${colorClasses} ${leftBorderColor}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => onTitleChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSaveEdit()
                  if (e.key === 'Escape') onCancelEdit()
                }}
                className="input flex-1"
                autoFocus
              />
              <button
                onClick={onSaveEdit}
                className="p-2 text-success hover:bg-success/10 rounded transition-colors"
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                onClick={onCancelEdit}
                className="p-2 text-muted-foreground hover:bg-muted rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <h3 className="text-xl font-semibold text-foreground">{group.title}</h3>
              <button
                onClick={onStartEdit}
                className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground transition-opacity"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
            <div className="flex items-center gap-1">
              <Layers className="w-4 h-4" />
              <span>{t('header.tabCount', { count: group.item_count || 0 })}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                {formatDistanceToNow(new Date(group.created_at), {
                  addSuffix: true,
                  locale: dateLocale,
                })}
              </span>
            </div>
          </div>

          {group.tags && group.tags.length > 0 && (
            <div className="mt-2">
              <TagsList tags={group.tags} />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onColorClick(group.id)}
            className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
            title={t('menu.setColor')}
          >
            <Palette className="w-5 h-5" />
          </button>
          <button
            onClick={() => onTagsClick(group.id)}
            className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
            title={t('export.tags')}
          >
            <Tag className="w-5 h-5" />
          </button>
          <button
            onClick={() => onShareClick(group.id)}
            className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
            title={t('action.share')}
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => onOpenAll(group.items || [])}
            className="p-2 text-success hover:bg-success/10 rounded-lg transition-colors"
            title={t('action.openAll')}
          >
            <FolderOpen className="w-5 h-5" />
          </button>
          <button
            onClick={() => onExport(group)}
            className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
            title={t('action.export')}
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(group.id, group.title)}
            className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            title={t('action.delete')}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Items */}
      {children}
    </div>
  )
}

