import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '@/components/tab-groups/EmptyState'
import { PinnedItemsSection } from '@/components/tab-groups/PinnedItemsSection'
import { TabGroupHeader } from '@/components/tab-groups/TabGroupHeader'
import { TabItemList } from '@/components/tab-groups/TabItemList'
import type { TabGroup, TabGroupItem } from '@/lib/types'

interface TabGroupsGridProps {
  tabGroups: TabGroup[]
  filteredTabGroups: TabGroup[]
  sortedGroups: TabGroup[]
  selectedGroupId: string | null
  searchQuery: string
  activeId: string | null
  sensors: Parameters<typeof DndContext>[0]['sensors']
  highlightedDomain: string | null
  selectedItems: Set<string>
  batchMode: boolean
  deletingId: string | null
  editingGroupId: string | null
  editingGroupTitle: string
  editingItemId: string | null
  editingTitle: string
  onDragStart: Parameters<typeof DndContext>[0]['onDragStart']
  onDragEnd: Parameters<typeof DndContext>[0]['onDragEnd']
  onEditGroup: (group: TabGroup) => void
  onSaveGroupEdit: (groupId: string) => void
  onSetEditingGroupId: (id: string | null) => void
  onSetEditingGroupTitle: (title: string) => void
  onOpenAll: (items: TabGroupItem[]) => void
  onExportMarkdown: (group: TabGroup) => void
  onDelete: (id: string, title: string) => void
  onShareClick: (id: string) => void
  onItemClick: (item: TabGroupItem, e: React.MouseEvent | React.ChangeEvent<HTMLInputElement>) => void
  onEditItem: (item: TabGroupItem) => void
  onSaveEdit: (groupId: string, itemId: string) => void
  onTogglePin: (groupId: string, itemId: string, currentPinned: boolean) => void
  onToggleTodo: (groupId: string, itemId: string, currentTodo: boolean) => void
  onDeleteItem: (groupId: string, itemId: string, title: string) => void
  onMoveItem: (item: TabGroupItem) => void
  onSetEditingItemId: (id: string | null) => void
  onSetEditingTitle: (title: string) => void
  extractDomain: (url: string) => string
}

function renderGroupCard(props: TabGroupsGridProps & { group: TabGroup }) {
  const {
    group,
    highlightedDomain,
    selectedItems,
    batchMode,
    deletingId,
    editingGroupId,
    editingGroupTitle,
    editingItemId,
    editingTitle,
    onEditGroup,
    onSaveGroupEdit,
    onSetEditingGroupId,
    onSetEditingGroupTitle,
    onOpenAll,
    onExportMarkdown,
    onDelete,
    onShareClick,
    onItemClick,
    onEditItem,
    onSaveEdit,
    onTogglePin,
    onToggleTodo,
    onDeleteItem,
    onMoveItem,
    onSetEditingItemId,
    onSetEditingTitle,
    extractDomain,
  } = props

  return (
    <div key={group.id} className="card border-l-[3px] border-l-primary p-6 hover:shadow-xl transition-all duration-200">
      <TabGroupHeader
        group={group}
        isEditingTitle={editingGroupId === group.id}
        editingTitle={editingGroupTitle}
        onEditTitle={() => onEditGroup(group)}
        onSaveTitle={() => onSaveGroupEdit(group.id)}
        onCancelEdit={() => {
          onSetEditingGroupId(null)
          onSetEditingGroupTitle('')
        }}
        onTitleChange={onSetEditingGroupTitle}
        onOpenAll={() => onOpenAll(group.items || [])}
        onExport={() => onExportMarkdown(group)}
        onDelete={() => onDelete(group.id, group.title)}
        isDeleting={deletingId === group.id}
        onShareClick={() => onShareClick(group.id)}
      />

      {group.items && group.items.length > 0 && (
        <TabItemList
          items={group.items}
          groupId={group.id}
          highlightedDomain={highlightedDomain}
          selectedItems={selectedItems}
          batchMode={batchMode}
          editingItemId={editingItemId}
          editingTitle={editingTitle}
          onItemClick={onItemClick}
          onEditItem={onEditItem}
          onSaveEdit={onSaveEdit}
          onTogglePin={onTogglePin}
          onToggleTodo={onToggleTodo}
          onDeleteItem={onDeleteItem}
          onMoveItem={onMoveItem}
          setEditingItemId={onSetEditingItemId}
          setEditingTitle={onSetEditingTitle}
          extractDomain={extractDomain}
        />
      )}
    </div>
  )
}

export function TabGroupsGrid(props: TabGroupsGridProps) {
  const { t } = useTranslation('tabGroups')
  const {
    tabGroups,
    filteredTabGroups,
    sortedGroups,
    selectedGroupId,
    searchQuery,
    activeId,
    sensors,
    onDragStart,
    onDragEnd,
  } = props

  if (tabGroups.length === 0) {
    return <EmptyState isSearching={false} searchQuery="" />
  }

  if (filteredTabGroups.length === 0) {
    return <EmptyState isSearching={true} searchQuery={searchQuery} />
  }

  return (
    <>
      {!searchQuery && sortedGroups.length > 0 && (
        <PinnedItemsSection
          tabGroups={sortedGroups}
          onUnpin={(groupId, itemId) => props.onTogglePin(groupId, itemId, true)}
        />
      )}

      {sortedGroups.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <div className="grid grid-cols-1 gap-6">
            {(() => {
              const groupsByParent = new Map<string | null, TabGroup[]>()
              sortedGroups.forEach((group) => {
                const parentId = group.parent_id || null
                const groups = groupsByParent.get(parentId) || []
                groups.push(group)
                groupsByParent.set(parentId, groups)
              })

              const cards: JSX.Element[] = []
              if (selectedGroupId) {
                sortedGroups.forEach((group) => {
                  if (group.is_folder !== 1) {
                    cards.push(renderGroupCard({ ...props, group }))
                  }
                })
                return cards
              }

              const rootGroups = groupsByParent.get(null) || []
              rootGroups.forEach((group) => {
                if (group.is_folder === 1) {
                  const children = groupsByParent.get(group.id) || []
                  if (children.length > 0) {
                    cards.push(
                      <div key={`folder-${group.id}`} className="mt-6 first:mt-0">
                        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                          <span>📁</span>
                          <span>{group.title}</span>
                          <span className="text-sm text-muted-foreground">
                            {t('header.tabCount', {
                              count: children.reduce((sum, entry) => sum + (entry.item_count || 0), 0),
                            })}
                          </span>
                        </h2>
                        <div className="space-y-6">
                          {children.map((childGroup) => renderGroupCard({ ...props, group: childGroup }))}
                        </div>
                      </div>
                    )
                  }
                } else {
                  cards.push(renderGroupCard({ ...props, group }))
                }
              })

              return cards
            })()}
          </div>

          <DragOverlay>
            {activeId ? (
              <div
                className="bg-card border-2 border-primary rounded shadow-xl cursor-grabbing p-3 opacity-95"
                style={{ transform: 'scale(1.05)' }}
              >
                {(() => {
                  for (const group of tabGroups) {
                    const item = group.items?.find((entry) => entry.id === activeId)
                    if (item) {
                      return (
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded bg-primary/20 flex-shrink-0" />
                          <span className="text-sm font-medium text-foreground truncate max-w-[300px]">
                            {item.title}
                          </span>
                        </div>
                      )
                    }
                  }
                  return null
                })()}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </>
  )
}
