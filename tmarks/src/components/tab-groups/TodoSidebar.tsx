import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { TabGroup, TabGroupItem } from '@/lib/types'
import { ListTodo, Circle } from 'lucide-react'
import { tabGroupsService } from '@/services/tab-groups'
import { useToastStore } from '@/stores/toastStore'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { zhCN, enUS } from 'date-fns/locale'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useInvalidateTabGroups } from '@/hooks/useTabGroupsQuery'
import { TodoItemCard } from './TodoItemCard'

interface TodoSidebarProps {
  tabGroups: TabGroup[]
}

export function TodoSidebar({ tabGroups }: TodoSidebarProps) {
  const { t, i18n } = useTranslation('tabGroups')
  const isMobile = useIsMobile()
  const invalidateTabGroups = useInvalidateTabGroups()
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  } | null>(null)
  const { success, error: showError } = useToastStore()
  
  const dateLocale = i18n.language === 'zh-CN' ? zhCN : enUS

  // 收集所有TODO项并按创建时间排序
  const sortedTodos = useMemo(() => {
    const todoItems: Array<{ item: TabGroupItem; groupId: string; groupTitle: string }> = []
    tabGroups.forEach((group) => {
      group.items?.forEach((item) => {
        if (item.is_todo) {
          todoItems.push({
            item,
            groupId: group.id,
            groupTitle: group.title,
          })
        }
      })
    })
    return todoItems.sort((a, b) =>
      new Date(b.item.created_at || 0).getTime() - new Date(a.item.created_at || 0).getTime()
    )
  }, [tabGroups])

  const handleToggleTodo = async (itemId: string, currentStatus: boolean) => {
    setProcessingId(itemId)
    try {
      await tabGroupsService.updateTabGroupItem(itemId, {
        is_todo: !currentStatus,
      })
      await invalidateTabGroups()
      success(currentStatus ? t('todo.todoUnmarked') : t('todo.todoMarked'))
    } catch (err) {
      console.error('Failed to toggle todo:', err)
      showError(t('message.operationFailed'))
    } finally {
      setProcessingId(null)
    }
  }

  const handleDelete = async (itemId: string) => {
    setConfirmState({
      isOpen: true,
      title: t('confirm.deleteItem'),
      message: t('confirm.deleteItemMessage', { title: '' }),
      onConfirm: async () => {
        setConfirmState(null)
        setProcessingId(itemId)
        try {
          await tabGroupsService.deleteTabGroupItem(itemId)
          await invalidateTabGroups()
          success(t('todo.tabDeleted'))
        } catch (err) {
          console.error('Failed to delete item:', err)
          showError(t('message.deleteFailed'))
        } finally {
          setProcessingId(null)
        }
      },
    })
  }

  const handleOpenTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleOpenInCurrentTab = (url: string) => {
    window.location.href = url
  }

  const handleOpenInIncognito = () => {
    showError(t('todo.incognitoNotSupported'))
  }

  const handleRename = (item: TabGroupItem) => {
    setEditingItemId(item.id)
    setEditingTitle(item.title)
  }

  const handleSaveRename = async (itemId: string) => {
    if (!editingTitle.trim()) {
      showError(t('message.titleRequired'))
      return
    }

    setProcessingId(itemId)
    try {
      await tabGroupsService.updateTabGroupItem(itemId, {
        title: editingTitle.trim(),
      })
      await invalidateTabGroups()
      success(t('todo.renameSuccess'))
      setEditingItemId(null)
      setEditingTitle('')
    } catch (err) {
      console.error('Failed to rename item:', err)
      showError(t('message.renameFailed'))
    } finally {
      setProcessingId(null)
    }
  }

  const handleMove = async (itemId: string, currentGroupId: string) => {
    const availableGroups = tabGroups.filter(g => g.id !== currentGroupId && !g.is_folder)
    
    if (availableGroups.length === 0) {
      showError(t('todo.noGroupsToMove'))
      return
    }

    const targetGroup = availableGroups[0]
    
    if (!targetGroup) {
      showError(t('todo.noGroupsToMove'))
      return
    }

    setConfirmState({
      isOpen: true,
      title: t('todo.moveTab'),
      message: t('todo.moveTabMessage', { title: targetGroup.title }),
      onConfirm: async () => {
        setConfirmState(null)
        setProcessingId(itemId)
        try {
          await tabGroupsService.moveTabGroupItem(itemId, targetGroup.id)
          await invalidateTabGroups()
          success(t('todo.tabMoved', { title: targetGroup.title }))
        } catch (err) {
          console.error('Failed to move item:', err)
          showError(t('page.moveFailed'))
        } finally {
          setProcessingId(null)
        }
      },
    })
  }

  const handleArchive = async (itemId: string) => {
    setConfirmState({
      isOpen: true,
      title: t('todo.archiveTab'),
      message: t('todo.archiveTabMessage'),
      onConfirm: async () => {
        setConfirmState(null)
        setProcessingId(itemId)
        try {
          await tabGroupsService.updateTabGroupItem(itemId, {
            is_archived: true,
          })
          await invalidateTabGroups()
          success(t('todo.tabArchived'))
        } catch (err) {
          console.error('Failed to archive item:', err)
          showError(t('message.operationFailed'))
        } finally {
          setProcessingId(null)
        }
      },
    })
  }

  return (
    <div className={`w-full h-full bg-card overflow-y-auto flex flex-col ${isMobile ? '' : 'border-l border-border'}`}>
      {confirmState && (
        <ConfirmDialog
          isOpen={confirmState.isOpen}
          title={confirmState.title}
          message={confirmState.message}
          type="warning"
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}

      {/* 标题栏 */}
      <div className={`p-4 border-b border-border bg-muted sticky top-0 z-10 shadow-md ${isMobile ? 'pt-safe-area-top' : ''}`}>
        <div className="flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-foreground" />
          <h2 className="text-lg font-bold text-foreground">{t('todo.title')}</h2>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <Circle className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {sortedTodos.length} {t('todo.title').toLowerCase()}
            </span>
          </div>
        </div>
      </div>

      {/* TODO列表 */}
      <div className={`p-4 space-y-3 ${isMobile ? 'pb-20' : ''}`}>
        {sortedTodos.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <ListTodo className="w-10 h-10 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">{t('todo.empty')}</p>
            <p className="text-muted-foreground/70 text-xs mt-2">
              {t('todo.emptyTip')}
            </p>
          </div>
        ) : (
          sortedTodos.map(({ item, groupId, groupTitle }) => (
            <TodoItemCard
              key={item.id}
              item={item}
              groupId={groupId}
              groupTitle={groupTitle}
              processingId={processingId}
              editingItemId={editingItemId}
              editingTitle={editingTitle}
              dateLocale={dateLocale}
              onToggleTodo={handleToggleTodo}
              onDelete={handleDelete}
              onRename={handleRename}
              onSaveRename={handleSaveRename}
              onOpenTab={handleOpenTab}
              onOpenInCurrentTab={handleOpenInCurrentTab}
              onOpenInIncognito={handleOpenInIncognito}
              onMove={handleMove}
              onArchive={handleArchive}
              setEditingItemId={setEditingItemId}
              setEditingTitle={setEditingTitle}
            />
          ))
        )}
      </div>
    </div>
  )
}
