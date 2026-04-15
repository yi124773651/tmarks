import React from 'react'
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Circle,
  MoreHorizontal,
} from 'lucide-react'
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core'
import { useTranslation } from 'react-i18next'
import { DropdownMenu } from '@/components/common/DropdownMenu'
import { useTabGroupMenu } from '@/hooks/useTabGroupMenu'
import { buildTreeNodeMenu } from './TreeNodeMenu'
import { getTotalItemCount } from './TreeUtils'
import type { TabGroup } from '@/lib/types'

export interface TreeNodeContentProps {
  group: TabGroup
  level: number
  isSelected: boolean
  isExpanded: boolean
  hasChildren: boolean
  isFolder: boolean
  isEditing: boolean
  isBeingDragged: boolean
  isLocked: boolean
  isDropTarget: boolean
  dropPosition: 'before' | 'inside' | 'after' | null
  attributes: DraggableAttributes
  listeners: DraggableSyntheticListeners
  toggleGroup: (groupId: string, e: React.MouseEvent) => void
  onSelectGroup: (groupId: string | null) => void
  editingTitle: string
  setEditingTitle: (title: string) => void
  setEditingGroupId: (id: string | null) => void
  onRenameGroup?: (groupId: string, newTitle: string) => Promise<void>
  onRefresh?: () => Promise<void>
  onOpenMoveDialog?: (group: TabGroup) => void
}

export function TreeNodeContent({
  group,
  level,
  isSelected,
  isExpanded,
  hasChildren,
  isFolder,
  isEditing,
  isBeingDragged,
  isLocked,
  isDropTarget,
  dropPosition,
  attributes,
  listeners,
  toggleGroup,
  onSelectGroup,
  editingTitle,
  setEditingTitle,
  setEditingGroupId,
  onRenameGroup,
  onRefresh,
  onOpenMoveDialog,
}: TreeNodeContentProps) {
  const { t } = useTranslation('tabGroups')

  const handleRenameSubmit = async () => {
    if (!editingTitle.trim() || editingTitle === group.title) {
      setEditingGroupId(null)
      setEditingTitle(group.title)
      return
    }

    try {
      await onRenameGroup?.(group.id, editingTitle.trim())
      setEditingGroupId(null)
    } catch (error) {
      console.error('Failed to rename:', error)
      setEditingTitle(group.title)
    }
  }

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleRenameSubmit()
    } else if (e.key === 'Escape') {
      setEditingGroupId(null)
      setEditingTitle(group.title)
    }
  }

  const menuActions = useTabGroupMenu({
    onRefresh: onRefresh || (async () => {}),
    onStartRename: (groupId, title) => {
      setEditingGroupId(groupId)
      setEditingTitle(title)
    },
    onOpenMoveDialog,
  })

  const menuItems = buildTreeNodeMenu({
    group,
    isFolder,
    isLocked,
    menuActions,
    t,
  })

  // 拖放指示器样式
  let dropIndicatorClass = ''
  if (isDropTarget && dropPosition) {
    if (dropPosition === 'before') {
      dropIndicatorClass = 'border-t-2 border-t-primary'
    } else if (dropPosition === 'after') {
      dropIndicatorClass = 'border-b-2 border-b-primary'
    } else if (dropPosition === 'inside' && isFolder) {
      dropIndicatorClass = 'bg-primary/10 border-2 border-primary border-dashed'
    }
  }

  return (
    <div
      style={{
        paddingLeft: `${level * 20 + 12}px`, // 使用缩进代替树状线
      }}
      className={`treeItem group flex items-center gap-1 py-1.5 pr-3 hover:bg-muted relative ${
        isSelected ? 'bg-primary/10' : ''
      } ${isBeingDragged ? 'opacity-50' : ''} ${dropIndicatorClass}`}
    >
      {/* 展开/折叠按钮 */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          toggleGroup(group.id, e)
        }}
        className="w-4 h-4 flex items-center justify-center hover:bg-muted rounded flex-shrink-0 mr-1"
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          )
        ) : (
          <div className="w-3 h-3" />
        )}
      </button>

      {/* 图标和标题区域 - 可拖拽区域 */}
      <div
        {...attributes}
        {...(isLocked ? {} : listeners)}
        className={`flex items-center gap-1.5 flex-1 min-w-0 ${
          isLocked ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
        }`}
      >
        {/* 图标 */}
        {isFolder ? (
          isExpanded ? (
            <FolderOpen className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          ) : (
            <Folder className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          )
        ) : (
          <Circle
            className={`w-2 h-2 flex-shrink-0 ${
              isSelected ? 'fill-primary text-primary' : 'text-muted-foreground'
            }`}
          />
        )}

        {/* 标题 */}
        {isEditing ? (
          <input
            type="text"
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={handleRenameKeyDown}
            className="text-xs flex-1 px-1 py-0.5 border border-primary rounded bg-card text-foreground focus:outline-none"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            onClick={(e) => {
              e.stopPropagation()
              onSelectGroup(group.id)
            }}
            className={`text-xs flex-1 truncate leading-[19px] ${
              isSelected ? 'font-semibold text-primary' : 'text-foreground'
            }`}
          >
            {group.title}
          </span>
        )}

        {/* 标签页数量 */}
        {!isEditing && (
          <span className="text-xs text-muted-foreground flex-shrink-0 ml-auto">
            {getTotalItemCount(group)}
          </span>
        )}
      </div>

      {/* 右键菜单 */}
      {!isEditing && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1">
          <DropdownMenu
            trigger={
              <button className="p-0.5 hover:bg-muted rounded">
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            }
            items={menuItems}
          />
        </div>
      )}
    </div>
  )
}
