import { useTranslation } from 'react-i18next'
import { buildTabOpenerHtml, getThemeColors } from './buildTabOpenerHtml'
import { tabGroupsService } from '@/services/tab-groups'
import type { TabGroup } from '@/lib/types'
import { useDialogStore } from '@/stores/dialogStore'

export interface TabGroupMenuActions {
  onOpenInNewWindow: (group: TabGroup) => void
  onOpenInCurrentWindow: (group: TabGroup) => void
  onOpenInIncognito: (group: TabGroup) => void
  onRename: (group: TabGroup) => void
  onShare: (group: TabGroup) => void
  onCopyToClipboard: (group: TabGroup) => void
  onCreateFolderAbove: (group: TabGroup) => void
  onCreateFolderInside: (group: TabGroup) => void
  onCreateFolderBelow: (group: TabGroup) => void
  onPinToTop: (group: TabGroup) => void
  onRemoveDuplicates: (group: TabGroup) => void
  onLock: (group: TabGroup) => void
  onMove: (group: TabGroup) => Promise<void>
  onMoveToTrash: (group: TabGroup) => void
}

interface UseTabGroupMenuProps {
  onRefresh?: () => Promise<void>
  onStartRename: (groupId: string, title: string) => void
  onOpenMoveDialog?: (group: TabGroup) => void
}

export function useTabGroupMenu({ onRefresh, onStartRename, onOpenMoveDialog }: UseTabGroupMenuProps): TabGroupMenuActions {
  const { t } = useTranslation('tabGroups')
  const dialog = useDialogStore.getState()

  // 打开所有标签页
  const openAllTabs = async (group: TabGroup, mode: 'new' | 'current' | 'incognito') => {
    if (!group.items || group.items.length === 0) {
      await dialog.alert({ message: t('message.noTabsToOpen'), type: 'info' })
      return
    }

    const modeText = t(`openMode.${mode === 'new' ? 'newWindow' : mode === 'current' ? 'currentWindow' : 'incognito'}`)
    
    // 确认打开多个标签页
    if (group.items.length > 5) {
      const confirmed = await dialog.confirm({
        title: t('confirm.openMultipleTabs'),
        message: t('confirm.openTabsMessage', { mode: modeText, count: group.items.length }),
        type: 'warning',
      })
      if (!confirmed) {
        return
      }
    }

    // 对于"当前窗口"模式，使用传统方法
    if (mode === 'current' && group.items && group.items.length > 0) {
      const firstItem = group.items[0]
      if (firstItem) {
        window.location.href = firstItem.url
      }
      return
    }

    try {
      const colors = getThemeColors()
      const i18nSuccessPartial = t('tabOpener.successPartial', { opened: '__OPENED__', failed: '__FAILED__' } as Record<string, unknown>)
        .replace('__OPENED__', "' + opened + '")
        .replace('__FAILED__', "' + failed + '")
      const i18nSuccessAll = t('tabOpener.successAll', { count: '__COUNT__' } as Record<string, unknown>)
        .replace('__COUNT__', "' + opened + '")

      const html = buildTabOpenerHtml(
        group.items.map(item => ({ url: item.url, title: item.title })),
        colors,
        {
          title: t('tabOpener.title'),
          heading: t('tabOpener.heading'),
          preparing: t('tabOpener.preparing'),
          opening: t('tabOpener.opening'),
          successPartial: i18nSuccessPartial,
          successAll: i18nSuccessAll,
          closeWindow: t('tabOpener.closeWindow'),
        }
      )

      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const newWindow = window.open(url, '_blank', 'width=800,height=600')

      if (newWindow) {
        await dialog.alert({ message: t('message.tabManagerOpened', { mode: modeText }), type: 'success' })
        setTimeout(() => URL.revokeObjectURL(url), 5000)
      } else {
        await dialog.alert({ message: t('message.cannotOpenWindow'), type: 'error' })
      }
    } catch (error) {
      console.error('Failed to open tabs:', error)
      await dialog.alert({ message: t('message.openTabsFailed'), type: 'error' })
    }
  }

  const onOpenInNewWindow = (group: TabGroup) => openAllTabs(group, 'new')
  const onOpenInCurrentWindow = (group: TabGroup) => openAllTabs(group, 'current')
  const onOpenInIncognito = (group: TabGroup) => openAllTabs(group, 'incognito')

  const onRename = (group: TabGroup) => {
    onStartRename(group.id, group.title)
  }

  const onShare = async (group: TabGroup) => {
    try {
      const shareData = await tabGroupsService.createShare(group.id, {
        is_public: true,
        expires_in_days: 30
      })

      const shareUrl = shareData.share_url

      // 复制到剪贴板
      try {
        await navigator.clipboard.writeText(shareUrl)
        await dialog.alert({
          title: t('share.linkCreated'),
          message: t('share.linkCreatedMessage', { url: shareUrl }),
          type: 'success',
        })
      } catch {
        await dialog.alert({
          title: t('share.linkCreated'),
          message: t('share.linkCreatedManualCopy', { url: shareUrl }),
          type: 'warning',
        })
      }
    } catch (error) {
      console.error('Failed to create share:', error)
      await dialog.alert({ message: t('share.createFailed'), type: 'error' })
    }
  }

  const onCopyToClipboard = async (group: TabGroup) => {
    if (!group.items || group.items.length === 0) {
      await dialog.alert({ message: t('message.noTabsInGroup'), type: 'info' })
      return
    }

    const text = group.items.map(item => `${item.title}\n${item.url}`).join('\n\n')
    try {
      await navigator.clipboard.writeText(text)
      await dialog.alert({ message: t('message.copiedToClipboard'), type: 'success' })
    } catch (err) {
      console.error('Failed to copy:', err)
      await dialog.alert({ message: t('message.copyFailed'), type: 'error' })
    }
  }

  const createFolderAt = async (parentId?: string | null) => {
    try {
      await tabGroupsService.createFolder(t('folder.newFolder'), parentId)
      await onRefresh?.()
    } catch (err) {
      console.error('Failed to create folder:', err)
      await dialog.alert({ message: t('message.createFolderFailed'), type: 'error' })
    }
  }
  const onCreateFolderAbove = (group: TabGroup) => createFolderAt(group.parent_id)
  const onCreateFolderInside = async (group: TabGroup) => {
    if (group.is_folder !== 1) return
    await createFolderAt(group.id)
  }
  const onCreateFolderBelow = (group: TabGroup) => createFolderAt(group.parent_id)

  const onPinToTop = async (group: TabGroup) => {
    try {
      // 将该项的 position 设置为 -1（最小值），这样排序时会在最前面
      await tabGroupsService.updateTabGroup(group.id, {
        position: -1
      })
      await onRefresh?.()
    } catch (err) {
      console.error('Failed to pin to top:', err)
      await dialog.alert({ message: t('message.pinFailed'), type: 'error' })
    }
  }

  const onRemoveDuplicates = async (group: TabGroup) => {
    if (!group.items || group.items.length === 0) return

    const seen = new Set<string>()
    const duplicates: string[] = []

    group.items.forEach(item => {
      if (seen.has(item.url)) {
        duplicates.push(item.id)
      } else {
        seen.add(item.url)
      }
    })

    if (duplicates.length === 0) {
      await dialog.alert({ message: t('message.noDuplicates'), type: 'info' })
      return
    }

    const confirmed = await dialog.confirm({
      title: t('confirm.removeDuplicates'),
      message: t('confirm.removeDuplicatesMessage', { count: duplicates.length }),
      type: 'warning',
    })

    if (confirmed) {
      try {
        for (const id of duplicates) {
          await tabGroupsService.deleteTabGroupItem(id)
        }
        await onRefresh?.()
        await dialog.alert({ message: t('message.duplicatesRemoved', { count: duplicates.length }), type: 'success' })
      } catch (err) {
        console.error('Failed to remove duplicates:', err)
        await dialog.alert({ message: t('message.deleteFailed'), type: 'error' })
      }
    }
  }

  const onLock = async (group: TabGroup) => {
    // 锁定功能：使用 tags 字段存储锁定状态
    try {
      const currentTags = group.tags || []
      const isLocked = currentTags.includes('__locked__')

      let newTags: string[]
      if (isLocked) {
        // 解锁：移除 __locked__ 标签
        newTags = currentTags.filter(tag => tag !== '__locked__')
      } else {
        // 锁定：添加 __locked__ 标签
        newTags = [...currentTags, '__locked__']
      }

      await tabGroupsService.updateTabGroup(group.id, {
        tags: newTags
      })
      await onRefresh?.()
    } catch (err) {
      console.error('Failed to lock/unlock:', err)
      await dialog.alert({ message: t('message.operationFailed'), type: 'error' })
    }
  }

  const onMove = async (group: TabGroup) => {
    if (onOpenMoveDialog) {
      onOpenMoveDialog(group)
    } else {
      await dialog.alert({ message: t('message.moveFunctionDeveloping'), type: 'info' })
    }
  }

  const onMoveToTrash = async (group: TabGroup) => {
    const confirmed = await dialog.confirm({
      title: t('confirm.deleteGroup'),
      message: t('confirm.deleteGroupMessage', { title: group.title }),
      type: 'warning',
    })
    if (!confirmed) return

    try {
      await tabGroupsService.deleteTabGroup(group.id)
      await onRefresh?.()
    } catch (err) {
      console.error('Failed to delete:', err)
      await dialog.alert({ message: t('message.deleteFailed'), type: 'error' })
    }
  }

  return {
    onOpenInNewWindow,
    onOpenInCurrentWindow,
    onOpenInIncognito,
    onRename,
    onShare,
    onCopyToClipboard,
    onCreateFolderAbove,
    onCreateFolderInside,
    onCreateFolderBelow,
    onPinToTop,
    onRemoveDuplicates,
    onLock,
    onMove,
    onMoveToTrash,
  }
}
