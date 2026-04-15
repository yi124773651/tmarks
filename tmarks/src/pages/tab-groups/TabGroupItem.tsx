import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Edit2, ExternalLink, Check, X } from 'lucide-react'
import { tabGroupsService } from '@/services/tab-groups'
import type { TabGroupItem as TabGroupItemType } from '@/lib/types'
import { useToastStore } from '@/stores/toastStore'
import { logger } from '@/lib/logger'

interface TabGroupItemProps {
  item: TabGroupItemType
  index: number
  onRefresh: () => Promise<void>
}

export function TabGroupItem({ item, index, onRefresh }: TabGroupItemProps) {
  const { t } = useTranslation('tabGroups')
  const { success, error: showError } = useToastStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editingTitle, setEditingTitle] = useState('')

  const handleEdit = () => {
    setEditingTitle(item.title)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditingTitle('')
  }

  const handleSave = async () => {
    if (!editingTitle.trim()) {
      showError(t('message.titleRequired'))
      return
    }

    try {
      await tabGroupsService.updateTabGroupItem(item.id, { title: editingTitle.trim() })
      await onRefresh()
      setIsEditing(false)
      setEditingTitle('')
      success(t('detail.updateSuccess'))
    } catch (err) {
      logger.error('Failed to update item:', err)
      showError(t('detail.updateFailed'))
    }
  }

  return (
    <div className="group relative flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-success/50 hover:shadow-md transition-all duration-200">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-success/20 to-success/10 flex-shrink-0">
        <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
          {index + 1}
        </span>
      </div>

      {item.favicon && (
        <img src={item.favicon} alt="" className="w-5 h-5 rounded flex-shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            type="text"
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            className="w-full px-2 py-1 rounded border border-border bg-card text-sm font-medium mb-1"
            style={{ color: 'var(--foreground)' }}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleSave()
              if (e.key === 'Escape') handleCancel()
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h3
            className="font-medium truncate mb-0.5 cursor-pointer hover:text-primary transition-colors"
            style={{ color: 'var(--foreground)' }}
            onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
          >
            {item.title}
          </h3>
        )}
        <p className="text-sm truncate" style={{ color: 'var(--muted-foreground)' }}>
          {item.url}
        </p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {isEditing ? (
          <>
            <button
              onClick={() => void handleSave()}
              className="p-1.5 rounded-lg bg-success text-success-foreground hover:bg-success/90 transition-colors"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancel}
              className="p-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleEdit()
              }}
              className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Edit2 className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                window.open(item.url, '_blank', 'noopener,noreferrer')
              }}
              className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <ExternalLink className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
