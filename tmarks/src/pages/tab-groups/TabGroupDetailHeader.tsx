import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Trash2,
  Edit2,
  Check,
  X,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'
import { tabGroupsService } from '@/services/tab-groups'
import { useToastStore } from '@/stores/toastStore'
import { logger } from '@/lib/logger'
import type { TabGroup } from '@/lib/types'

interface TabGroupDetailHeaderProps {
  tabGroup: TabGroup
  onRefresh: () => Promise<void>
  onDelete: () => void
}

export function TabGroupDetailHeader({ tabGroup, onRefresh, onDelete }: TabGroupDetailHeaderProps) {
  const { t, i18n } = useTranslation('tabGroups')
  const dateLocale = i18n.language === 'zh-CN' ? zhCN : enUS
  const navigate = useNavigate()
  const { success, error: showError } = useToastStore()

  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [isSavingTitle, setIsSavingTitle] = useState(false)

  const handleSaveTitle = async () => {
    if (!editedTitle.trim()) return
    try {
      setIsSavingTitle(true)
      await tabGroupsService.updateTabGroup(tabGroup.id, { title: editedTitle.trim() })
      await onRefresh()
      setIsEditingTitle(false)
      success(t('detail.titleUpdateSuccess'))
    } catch (err) {
      logger.error('Failed to update title:', err)
      showError(t('detail.titleUpdateFailed'))
    } finally {
      setIsSavingTitle(false)
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), {
        addSuffix: true,
        locale: dateLocale,
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="mb-6">
      <button
        onClick={() => navigate('/tab')}
        className="flex items-center gap-2 mb-4 text-sm hover:opacity-70 transition-opacity"
        style={{ color: 'var(--muted-foreground)' }}
      >
        <ArrowLeft className="w-4 h-4" />
        {t('detail.backToList')}
      </button>

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {isEditingTitle ? (
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-lg font-semibold"
                style={{ color: 'var(--foreground)' }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleSaveTitle()
                  if (e.key === 'Escape') {
                    setEditedTitle(tabGroup.title)
                    setIsEditingTitle(false)
                  }
                }}
              />
              <button
                onClick={() => void handleSaveTitle()}
                disabled={isSavingTitle || !editedTitle.trim()}
                className="p-2 rounded-lg bg-success text-success-foreground hover:bg-success/90 transition-colors disabled:opacity-50"
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setEditedTitle(tabGroup.title)
                  setIsEditingTitle(false)
                }}
                disabled={isSavingTitle}
                className="p-2 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                {tabGroup.title}
              </h1>
              <button
                onClick={() => {
                  setEditedTitle(tabGroup.title)
                  setIsEditingTitle(true)
                }}
                className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                title={t('detail.editTitle')}
              >
                <Edit2 className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
              </button>
            </div>
          )}

          <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(tabGroup.created_at)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ExternalLink className="w-4 h-4" />
              <span>{t('header.tabCount', { count: tabGroup.items?.length || 0 })}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onDelete}
            className="px-4 py-2 rounded-lg border border-border hover:bg-destructive/10 hover:border-destructive/50 transition-colors flex items-center gap-2"
            title={t('confirm.deleteGroup')}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">{t('action.delete')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
