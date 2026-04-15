import { useTranslation } from 'react-i18next'
import { logger } from '@/lib/logger'
import { tabGroupsService } from '@/services/tab-groups'
import type { TabGroup, TabGroupItem } from '@/lib/types'

interface UseGroupManagementProps {
  tabGroups: TabGroup[]
  refreshTreeOnly: () => Promise<void>
  showError: (message: string) => void
  batchMode: boolean
  selectedItems: Set<string>
  setSelectedItems: (items: Set<string>) => void
  setHighlightedDomain: React.Dispatch<React.SetStateAction<string | null>>
}

export function useGroupManagement({
  tabGroups,
  refreshTreeOnly,
  showError,
  batchMode,
  selectedItems,
  setSelectedItems,
  setHighlightedDomain,
}: UseGroupManagementProps) {
  const { t } = useTranslation('tabGroups')

  const handleCreateFolder = async () => {
    try {
      await tabGroupsService.createFolder(t('folder.newFolder'))
      await refreshTreeOnly()
    } catch (err) {
      logger.error('Failed to create folder:', err)
      showError(t('page.createFolderFailed'))
    }
  }

  const handleRenameGroup = async (groupId: string, newTitle: string) => {
    try {
      await tabGroupsService.updateTabGroup(groupId, { title: newTitle })
      await refreshTreeOnly()
    } catch (err) {
      logger.error('Failed to rename group:', err)
      showError(t('page.renameFailed'))
    }
  }

  const handleMoveGroup = async (groupId: string, newParentId: string | null, newPosition: number) => {
    try {
      const draggedGroup = tabGroups.find((group) => group.id === groupId)
      if (!draggedGroup) return

      const siblings = tabGroups.filter((group) => (group.parent_id || null) === newParentId)
      siblings.sort((a, b) => (a.position || 0) - (b.position || 0))

      const draggedIndex = siblings.findIndex((group) => group.id === groupId)
      if (draggedIndex !== -1) siblings.splice(draggedIndex, 1)

      siblings.splice(newPosition, 0, draggedGroup)
      const updates = siblings.map((group, index) => ({
        id: group.id,
        position: index,
        parent_id: newParentId,
      }))

      await tabGroupsService.batchUpdatePositions(updates)
      await refreshTreeOnly()
    } catch (err) {
      logger.error('Failed to move group:', err)
      showError(t('page.moveFailed'))
    }
  }

  const extractDomain = (url: string): string => {
    try {
      return new URL(url).hostname
    } catch {
      return ''
    }
  }

  const handleItemClick = (item: TabGroupItem, e: React.MouseEvent | React.ChangeEvent<HTMLInputElement>) => {
    if (batchMode) {
      e.preventDefault()
      const next = new Set(selectedItems)
      if (next.has(item.id)) next.delete(item.id)
      else next.add(item.id)
      setSelectedItems(next)
      return
    }

    const domain = extractDomain(item.url)
    setHighlightedDomain((prev) => (prev === domain ? null : domain))
  }

  return {
    handleCreateFolder,
    handleRenameGroup,
    handleMoveGroup,
    handleItemClick,
    extractDomain,
  }
}
