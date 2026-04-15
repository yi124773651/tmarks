import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { useTranslation } from 'react-i18next'
import { TreeNodeContent } from './TreeNodeContent'
import type { TabGroup } from '@/lib/types'

interface TreeNodeProps {
  group: TabGroup
  level: number
  isLast: boolean
  parentLines: boolean[]
  selectedGroupId: string | null
  onSelectGroup: (groupId: string | null) => void
  expandedGroups: Set<string>
  toggleGroup: (groupId: string, e: React.MouseEvent) => void
  editingGroupId: string | null
  setEditingGroupId: (id: string | null) => void
  editingTitle: string
  setEditingTitle: (title: string) => void
  onRenameGroup?: (groupId: string, newTitle: string) => Promise<void>
  onRefresh?: () => Promise<void>
  activeId: string | null
  overId: string | null
  dropPosition: 'before' | 'inside' | 'after' | null
  onOpenMoveDialog?: (group: TabGroup) => void
}

export function TreeNode({
  group,
  level,
  isLast,
  parentLines,
  selectedGroupId,
  onSelectGroup,
  expandedGroups,
  toggleGroup,
  editingGroupId,
  setEditingGroupId,
  editingTitle,
  setEditingTitle,
  onRenameGroup,
  onRefresh,
  activeId,
  overId,
  dropPosition,
  onOpenMoveDialog,
}: TreeNodeProps) {
  const { t } = useTranslation('tabGroups')
  const isSelected = selectedGroupId === group.id
  const isExpanded = expandedGroups.has(group.id)
  const hasChildren = (group.children?.length || 0) > 0
  const isFolder = group.is_folder === 1
  const isEditing = editingGroupId === group.id
  const isBeingDragged = activeId === group.id
  const isDropTarget = overId === group.id && !isBeingDragged
  const isLocked = group.tags?.includes('__locked__') || false

  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useSortable({
    id: group.id,
    data: {
      type: isFolder ? 'folder' : 'group',
      parentId: group.parent_id,
    },
    disabled: isLocked,
    // 完全禁用布局动画
    animateLayoutChanges: () => false,
  })

  // 不应用 transform，元素保持原位置不动
  // 只通过 DragOverlay 显示拖拽预览，通过指示器显示插入位置
  const style = {
    opacity: isDragging ? 0.5 : 1,
    cursor: isLocked ? 'not-allowed' : 'grab',
  }

  return (
    <div ref={setNodeRef} style={style}>
      {/* 拖放指示器 - before（蓝色横线 + 左侧圆点） */}
      {isDropTarget && dropPosition === 'before' && (
        <div className="relative h-1 mx-2">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary border-2 border-background" />
          <div className="absolute left-2 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary" />
        </div>
      )}

      {/* 节点内容组件 */}
      <TreeNodeContent
        group={group}
        level={level}
        isSelected={isSelected}
        isExpanded={isExpanded}
        hasChildren={hasChildren}
        isFolder={isFolder}
        isEditing={isEditing}
        isBeingDragged={isBeingDragged}
        isLocked={isLocked}
        isDropTarget={isDropTarget}
        dropPosition={dropPosition}
        attributes={attributes}
        listeners={listeners}
        toggleGroup={toggleGroup}
        onSelectGroup={onSelectGroup}
        editingTitle={editingTitle}
        setEditingTitle={setEditingTitle}
        setEditingGroupId={setEditingGroupId}
        onRenameGroup={onRenameGroup}
        onRefresh={onRefresh}
        onOpenMoveDialog={onOpenMoveDialog}
      />

      {/* 拖放指示器 - after（蓝色横线 + 左侧圆点） */}
      {isDropTarget && dropPosition === 'after' && (
        <div className="relative h-1 mx-2">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary border-2 border-background" />
          <div className="absolute left-2 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary" />
        </div>
      )}

      {/* 空文件夹拖放区域 - 当拖拽到空文件夹内部时显示 */}
      {isFolder && isDropTarget && dropPosition === 'inside' && !hasChildren && (
        <div
          className="mx-2 py-3 border-2 border-dashed border-primary rounded-lg bg-primary/5 text-center"
          style={{ marginLeft: `${(level + 1) * 20 + 12}px` }}
        >
          <span className="text-xs text-primary font-medium">{t('folder.dropHere')}</span>
        </div>
      )}

      {/* 子节点 */}
      {isExpanded && hasChildren && group.children && (
        <div>
          {group.children?.map((child, index) => (
            <TreeNode
              key={child.id}
              group={child}
              level={level + 1}
              isLast={index === (group.children?.length ?? 0) - 1}
              parentLines={[...parentLines, !isLast]}
              selectedGroupId={selectedGroupId}
              onSelectGroup={onSelectGroup}
              expandedGroups={expandedGroups}
              toggleGroup={toggleGroup}
              editingGroupId={editingGroupId}
              setEditingGroupId={setEditingGroupId}
              editingTitle={editingTitle}
              setEditingTitle={setEditingTitle}
              onRenameGroup={onRenameGroup}
              onRefresh={onRefresh}
              activeId={activeId}
              overId={overId}
              dropPosition={dropPosition}
              onOpenMoveDialog={onOpenMoveDialog}
            />
          ))}
        </div>
      )}
    </div>
  )
}
