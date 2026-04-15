import { Calendar, Edit2, Check, X, Share2, FolderOpen, Download, Trash2, MoreVertical } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatDistanceToNow } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'
import type { TabGroup } from '@/lib/types'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { DropdownMenu } from '@/components/common/DropdownMenu'

interface TabGroupHeaderProps {
  group: TabGroup
  isEditingTitle: boolean
  editingTitle: string
  onEditTitle: () => void
  onSaveTitle: () => void
  onCancelEdit: () => void
  onTitleChange: (title: string) => void
  onShareClick: () => void
  onOpenAll: () => void
  onExport: () => void
  onDelete: () => void
  isDeleting: boolean
}

export function TabGroupHeader({
  group,
  isEditingTitle,
  editingTitle,
  onEditTitle,
  onSaveTitle,
  onCancelEdit,
  onTitleChange,
  onShareClick,
  onOpenAll,
  onExport,
  onDelete,
  isDeleting,
}: TabGroupHeaderProps) {
  const { t, i18n } = useTranslation('tabGroups')
  const { t: tc } = useTranslation('common')
  const isMobile = useIsMobile()

  // 根据当前语言选择 date-fns locale
  const dateLocale = i18n.language === 'zh-CN' ? zhCN : enUS

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
                className="input flex-1"
                autoFocus
              />
              <button
                onClick={onSaveTitle}
                className="p-2 text-success hover:bg-success/10 rounded transition-colors"
                title={tc('button.save')}
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                onClick={onCancelEdit}
                className="p-2 text-muted-foreground hover:bg-muted rounded transition-colors"
                title={tc('button.cancel')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
              <h3 className="text-xl font-semibold text-foreground flex-1">
                {group.title}
              </h3>
              <button
                onClick={onEditTitle}
                className="p-2 text-muted-foreground hover:bg-muted rounded transition-colors"
                title={t('action.rename')}
              >
                <Edit2 className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>
              {formatDistanceToNow(new Date(group.created_at), {
                addSuffix: true,
                locale: dateLocale,
              })}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span>{t('header.tabCount', { count: group.items?.length || 0 })}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 ml-4">
        {isMobile ? (
          <DropdownMenu
            trigger={
              <button className="p-2 text-muted-foreground hover:bg-muted rounded transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            }
            items={[
              {
                label: t('action.openAll'),
                icon: <FolderOpen className="w-4 h-4" />,
                onClick: onOpenAll,
                disabled: !group.items || group.items.length === 0,
              },
              {
                label: t('action.export'),
                icon: <Download className="w-4 h-4" />,
                onClick: onExport,
                disabled: !group.items || group.items.length === 0,
              },
              {
                label: t('action.share'),
                icon: <Share2 className="w-4 h-4" />,
                onClick: onShareClick,
              },
              {
                label: isDeleting ? t('action.deleting') : t('action.delete'),
                icon: <Trash2 className="w-4 h-4" />,
                onClick: onDelete,
                disabled: isDeleting,
                danger: true,
              },
            ]}
          />
        ) : (
          <>
            <button
              onClick={onOpenAll}
              disabled={!group.items || group.items.length === 0}
              className="p-2 text-muted-foreground hover:bg-muted rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={t('action.openAll')}
            >
              <FolderOpen className="w-5 h-5" />
            </button>
            <button
              onClick={onExport}
              disabled={!group.items || group.items.length === 0}
              className="p-2 text-muted-foreground hover:bg-muted rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={t('action.export')}
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onShareClick}
              className="p-2 text-muted-foreground hover:bg-muted rounded transition-colors"
              title={t('action.share')}
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={onDelete}
              disabled={isDeleting}
              className="p-2 text-destructive hover:bg-destructive/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={isDeleting ? t('action.deleting') : t('action.delete')}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
