import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { tabGroupsService } from '@/services/tab-groups'
import type { TabGroup, TabGroupItem } from '@/lib/types'
import { useToastStore } from '@/stores/toastStore'
import { useInvalidateTabGroups } from './useTabGroupsQuery'
import { formatDistanceToNow } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'
import { logger } from '@/lib/logger'
import { useTabGroupItemActions } from './useTabGroupItemActions'
import { buildTabOpenerHtml, getThemeColors } from './buildTabOpenerHtml'

interface UseTabGroupActionsProps {
  setTabGroups: React.Dispatch<React.SetStateAction<TabGroup[]>>
  setDeletingId: React.Dispatch<React.SetStateAction<string | null>>
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

export function useTabGroupActions({
  setTabGroups,
  setDeletingId,
  setConfirmDialog,
  confirmDialog,
}: UseTabGroupActionsProps) {
  const { t, i18n } = useTranslation('tabGroups')
  const { success, error: showError } = useToastStore()
  const invalidateTabGroups = useInvalidateTabGroups()
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editingGroupTitle, setEditingGroupTitle] = useState('')

  // Include item actions
  const itemActions = useTabGroupItemActions({
    setTabGroups,
    setConfirmDialog,
    confirmDialog,
  })

  const dateLocale = i18n.language === 'zh-CN' ? zhCN : enUS

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

  const handleDelete = (id: string, title: string) => {
    setConfirmDialog({
      isOpen: true,
      title: t('confirm.deleteGroup'),
      message: t('confirm.deleteGroupMessage', { title }),
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false })
        setDeletingId(id)
        try {
          await tabGroupsService.deleteTabGroup(id)
          setTabGroups((prev) => prev.filter((g) => g.id !== id))
          await invalidateTabGroups()
          success(t('message.movedToTrash'))
        } catch (err) {
          logger.error('Failed to delete tab group:', err)
          showError(t('message.deleteFailed'))
        } finally {
          setDeletingId(null)
        }
      },
    })
  }

  const handleOpenAll = (items: TabGroupItem[]) => {
    if (!items || items.length === 0) {
      showError(t('message.noTabsToOpen'))
      return
    }

    const itemCount = items.length

    // 提示用户
    const message =
      itemCount > 10
        ? t('confirm.openTabsWarning', { count: itemCount })
        : t('confirm.openTabsMessage', { mode: t('openMode.newWindow'), count: itemCount })

    setConfirmDialog({
      isOpen: true,
      title: t('confirm.openMultipleTabs'),
      message,
      onConfirm: () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false })

        // Use tab opener popup to avoid browser popup blocker
        const colors = getThemeColors()
        const i18nSuccessPartial = t('tabOpener.successPartial', { opened: '__OPENED__', failed: '__FAILED__' } as Record<string, unknown>)
          .replace('__OPENED__', "' + opened + '")
          .replace('__FAILED__', "' + failed + '")
        const i18nSuccessAll = t('tabOpener.successAll', { count: '__COUNT__' } as Record<string, unknown>)
          .replace('__COUNT__', "' + opened + '")
        const html = buildTabOpenerHtml(
          items.map(item => ({ url: item.url, title: item.title })),
          colors,
          {
            title: t('tabOpener.title', { defaultValue: 'Opening Tabs' }),
            heading: t('tabOpener.heading', { defaultValue: 'Opening Tabs...' }),
            preparing: t('tabOpener.preparing', { defaultValue: 'Preparing...' }),
            opening: t('tabOpener.opening', { defaultValue: 'Opening: ' }),
            successPartial: i18nSuccessPartial,
            successAll: i18nSuccessAll,
            closeWindow: t('tabOpener.closeWindow', { defaultValue: 'Close Window' }),
          }
        )
        const blob = new Blob([html], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        const newWindow = window.open(url, '_blank', 'width=800,height=600')

        if (newWindow) {
          setTimeout(() => URL.revokeObjectURL(url), 5000)
          success(t('message.openingTabs', { count: itemCount }))
        } else {
          URL.revokeObjectURL(url)
          showError(t('message.cannotOpenWindow', { defaultValue: 'Popup was blocked. Please allow popups for this site.' }))
        }
      },
    })
  }

  const handleExportMarkdown = (group: TabGroup) => {
    const items = group.items || []
    let markdown = `# ${group.title}\n\n`
    markdown += `${t('export.createdTime')}: ${formatDate(group.created_at)}\n`
    markdown += `${t('export.tabCount')}: ${items.length}\n\n`

    if (group.tags && group.tags.length > 0) {
      markdown += `${t('export.tags')}: ${group.tags.join(', ')}\n\n`
    }

    markdown += `---\n\n`

    items.forEach((item, index) => {
      markdown += `${index + 1}. [${item.title}](${item.url})\n`
      if (item.is_pinned) markdown += `   - 📌 ${t('item.pinned')}\n`
      if (item.is_todo) markdown += `   - ✅ ${t('item.todo')}\n`
      markdown += '\n'
    })

    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${group.title}-${Date.now()}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    success(t('message.exportSuccess'))
  }

  const handleEditGroup = (group: TabGroup) => {
    setEditingGroupId(group.id)
    setEditingGroupTitle(group.title)
  }

  const handleSaveGroupEdit = async (groupId: string) => {
    if (!editingGroupTitle.trim()) {
      showError(t('message.titleRequired'))
      return
    }

    try {
      await tabGroupsService.updateTabGroup(groupId, { title: editingGroupTitle })
      setTabGroups((prev) =>
        prev.map((g) => (g.id === groupId ? { ...g, title: editingGroupTitle } : g))
      )
      await invalidateTabGroups()
      setEditingGroupId(null)
      setEditingGroupTitle('')
      success(t('message.renameSuccess'))
    } catch (err) {
      logger.error('Failed to update group title:', err)
      showError(t('message.renameFailed'))
    }
  }

  return {
    ...itemActions,
    editingGroupId,
    setEditingGroupId,
    editingGroupTitle,
    setEditingGroupTitle,
    formatDate,
    handleDelete,
    handleOpenAll,
    handleExportMarkdown,
    handleEditGroup,
    handleSaveGroupEdit,
  }
}
