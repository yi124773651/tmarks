import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { tabGroupsService } from '@/services/tab-groups'
import type { TabGroup, TabGroupItem } from '@/lib/types'
import { useToastStore } from '@/stores/toastStore'
import { useInvalidateTabGroups } from './useTabGroupsQuery'
import { logger } from '@/lib/logger'

interface UseTabGroupItemActionsProps {
  setTabGroups: React.Dispatch<React.SetStateAction<TabGroup[]>>
  setConfirmDialog: React.Dispatch<React.SetStateAction<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>>
  confirmDialog: {
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }
}

export function useTabGroupItemActions({
  setTabGroups,
  setConfirmDialog,
  confirmDialog,
}: UseTabGroupItemActionsProps) {
  const { t } = useTranslation('tabGroups')
  const { success, error: showError } = useToastStore()
  const invalidateTabGroups = useInvalidateTabGroups()
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  const handleEditItem = (item: TabGroupItem) => {
    setEditingItemId(item.id)
    setEditingTitle(item.title)
  }

  const handleSaveEdit = async (groupId: string, itemId: string) => {
    if (!editingTitle.trim()) {
      showError(t('message.titleRequired'))
      return
    }

    try {
      await tabGroupsService.updateTabGroupItem(itemId, { title: editingTitle })
      setTabGroups((prev) =>
        prev.map((group) =>
          group.id === groupId
            ? {
              ...group,
              items: group.items?.map((item) =>
                item.id === itemId ? { ...item, title: editingTitle } : item
              ),
            }
            : group
        )
      )
      await invalidateTabGroups()
      setEditingItemId(null)
      setEditingTitle('')
      success(t('message.editSuccess'))
    } catch (err) {
      logger.error('Failed to update item:', err)
      showError(t('message.editFailed'))
    }
  }

  const handleTogglePin = async (groupId: string, itemId: string, currentPinned: boolean) => {
    const newPinned = !currentPinned
    try {
      await tabGroupsService.updateTabGroupItem(itemId, { is_pinned: newPinned })
      setTabGroups((prev) =>
        prev.map((group) =>
          group.id === groupId
            ? {
              ...group,
              items: group.items?.map((item) =>
                item.id === itemId ? { ...item, is_pinned: newPinned } : item
              ),
            }
            : group
        )
      )
      await invalidateTabGroups()
      success(newPinned ? t('message.pinSuccess') : t('message.unpinSuccess'))
    } catch (err) {
      logger.error('Failed to toggle pin:', err)
      showError(t('message.operationFailed'))
    }
  }

  const handleToggleTodo = async (groupId: string, itemId: string, currentTodo: boolean) => {
    const newTodo = !currentTodo
    try {
      await tabGroupsService.updateTabGroupItem(itemId, { is_todo: newTodo })
      setTabGroups((prev) =>
        prev.map((group) =>
          group.id === groupId
            ? {
              ...group,
              items: group.items?.map((item) =>
                item.id === itemId ? { ...item, is_todo: newTodo } : item
              ),
            }
            : group
        )
      )
      await invalidateTabGroups()
      success(newTodo ? t('message.todoSuccess') : t('message.untodoSuccess'))
    } catch (err) {
      logger.error('Failed to toggle todo:', err)
      showError(t('message.operationFailed'))
    }
  }

  const handleDeleteItem = (groupId: string, itemId: string, title: string) => {
    setConfirmDialog({
      isOpen: true,
      title: t('confirm.deleteItem'),
      message: t('confirm.deleteItemMessage', { title }),
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false })
        try {
          await tabGroupsService.deleteTabGroupItem(itemId)
          setTabGroups((prev) =>
            prev.map((group) =>
              group.id === groupId
                ? {
                  ...group,
                  items: group.items?.filter((item) => item.id !== itemId),
                  item_count: (group.item_count || 0) - 1,
                }
                : group
            )
          )
          await invalidateTabGroups()
          success(t('message.deleteSuccess'))
        } catch (err) {
          logger.error('Failed to delete item:', err)
          showError(t('message.deleteFailed'))
        }
      },
    })
  }

  return {
    editingItemId,
    setEditingItemId,
    editingTitle,
    setEditingTitle,
    handleEditItem,
    handleSaveEdit,
    handleTogglePin,
    handleToggleTodo,
    handleDeleteItem,
  }
}
