import { useState } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { tabGroupsService } from '@/services/tab-groups'
import type { TabGroup, TabGroupItem } from '@/lib/types'
import { logger } from '@/lib/logger'

interface UseTabGroupItemDnDProps {
  tabGroups: TabGroup[]
  setTabGroups: React.Dispatch<React.SetStateAction<TabGroup[]>>
  moveItemDialog: {
    isOpen: boolean
    item: TabGroupItem | null
    currentGroupId: string
  }
  setMoveItemDialog: React.Dispatch<
    React.SetStateAction<{
      isOpen: boolean
      item: TabGroupItem | null
      currentGroupId: string
    }>
  >
  refreshTreeOnly: () => Promise<unknown>
  showError: (message: string) => void
  moveFailedMessage: string
}

export function useTabGroupItemDnD({
  tabGroups,
  setTabGroups,
  moveItemDialog,
  setMoveItemDialog,
  refreshTreeOnly,
  showError,
  moveFailedMessage,
}: UseTabGroupItemDnDProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) return

    let sourceGroup: TabGroup | undefined
    let sourceItem: TabGroupItem | undefined
    let targetGroup: TabGroup | undefined
    let targetItem: TabGroupItem | undefined

    for (const group of tabGroups) {
      const item = group.items?.find((entry) => entry.id === active.id)
      if (item) {
        sourceGroup = group
        sourceItem = item
        break
      }
    }

    for (const group of tabGroups) {
      const item = group.items?.find((entry) => entry.id === over.id)
      if (item) {
        targetGroup = group
        targetItem = item
        break
      }
    }

    if (!sourceGroup || !sourceItem || !targetGroup || !targetItem) return

    if (sourceGroup.id === targetGroup.id) {
      if (!sourceGroup.items) {
        logger.error('Source group items is undefined')
        showError(moveFailedMessage)
        return
      }

      const oldIndex = sourceGroup.items.findIndex((item) => item.id === active.id)
      const newIndex = sourceGroup.items.findIndex((item) => item.id === over.id)
      const newItems: TabGroupItem[] = arrayMove(sourceGroup.items, oldIndex, newIndex)

      setTabGroups((prev) =>
        prev.map((group) => (group.id === sourceGroup!.id ? { ...group, items: newItems } : group))
      )

      try {
        await Promise.all(
          newItems.map((item, index) => tabGroupsService.updateTabGroupItem(item.id, { position: index }))
        )
        await refreshTreeOnly()
      } catch (err) {
        logger.error('Failed to update positions:', err)
        setTabGroups((prev) =>
          prev.map((group) => (group.id === sourceGroup!.id ? { ...group, items: sourceGroup!.items } : group))
        )
        showError(moveFailedMessage)
      }
      return
    }

    if (!sourceGroup.items || !targetGroup.items) {
      logger.error('Source or target group items is undefined')
      showError(moveFailedMessage)
      return
    }

    const targetIndex = targetGroup.items.findIndex((item) => item.id === over.id)
    const newSourceItems: TabGroupItem[] = sourceGroup.items.filter((item) => item.id !== active.id)
    const newTargetItems: TabGroupItem[] = [...targetGroup.items]
    newTargetItems.splice(targetIndex, 0, sourceItem)

    setTabGroups((prev) =>
      prev.map((group) => {
        if (group.id === sourceGroup!.id) {
          return { ...group, items: newSourceItems, item_count: newSourceItems.length }
        }
        if (group.id === targetGroup!.id) {
          return { ...group, items: newTargetItems, item_count: newTargetItems.length }
        }
        return group
      })
    )

    try {
      await tabGroupsService.moveTabGroupItem(sourceItem.id, targetGroup.id, targetIndex)
      await Promise.all(
        newSourceItems.map((item, index) => tabGroupsService.updateTabGroupItem(item.id, { position: index }))
      )
      await refreshTreeOnly()
    } catch (err) {
      logger.error('Failed to move item across groups:', err)
      setTabGroups((prev) =>
        prev.map((group) => {
          if (group.id === sourceGroup!.id) {
            return { ...group, items: sourceGroup!.items, item_count: sourceGroup!.items?.length ?? 0 }
          }
          if (group.id === targetGroup!.id) {
            return { ...group, items: targetGroup!.items, item_count: targetGroup!.items?.length ?? 0 }
          }
          return group
        })
      )
      showError(moveFailedMessage)
    }
  }

  const handleMoveItem = (item: TabGroupItem) => {
    const currentGroup = tabGroups.find((group) => group.items?.some((entry) => entry.id === item.id))
    if (!currentGroup) return

    setMoveItemDialog({
      isOpen: true,
      item,
      currentGroupId: currentGroup.id,
    })
  }

  const handleMoveItemToGroup = async (targetGroupId: string) => {
    const { item, currentGroupId } = moveItemDialog
    if (!item) return

    const sourceGroup = tabGroups.find((group) => group.id === currentGroupId)
    const targetGroup = tabGroups.find((group) => group.id === targetGroupId)
    if (!sourceGroup || !targetGroup || !sourceGroup.items) return

    const newSourceItems: TabGroupItem[] = sourceGroup.items.filter((entry) => entry.id !== item.id)
    const newTargetItems: TabGroupItem[] = [...(targetGroup.items || []), item]

    setTabGroups((prev) =>
      prev.map((group) => {
        if (group.id === currentGroupId) {
          return { ...group, items: newSourceItems, item_count: newSourceItems.length }
        }
        if (group.id === targetGroupId) {
          return { ...group, items: newTargetItems, item_count: newTargetItems.length }
        }
        return group
      })
    )

    try {
      await tabGroupsService.moveTabGroupItem(item.id, targetGroupId, newTargetItems.length - 1)
      await Promise.all(
        newSourceItems.map((entry, index) => tabGroupsService.updateTabGroupItem(entry.id, { position: index }))
      )
      await refreshTreeOnly()
    } catch (err) {
      logger.error('Failed to move item to group:', err)
      setTabGroups((prev) =>
        prev.map((group) => {
          if (group.id === currentGroupId) {
            return { ...group, items: sourceGroup.items, item_count: sourceGroup.items?.length ?? 0 }
          }
          if (group.id === targetGroupId) {
            return { ...group, items: targetGroup.items, item_count: targetGroup.items?.length ?? 0 }
          }
          return group
        })
      )
      showError(moveFailedMessage)
    }
  }

  return {
    activeId,
    handleDragStart,
    handleDragEnd,
    handleMoveItem,
    handleMoveItemToGroup,
  }
}
