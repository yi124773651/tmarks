import { TabItem } from './TabItem'
import type { TabGroupItem } from '@/lib/types'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

interface TabItemListProps {
  items: TabGroupItem[]
  groupId: string
  highlightedDomain: string | null
  selectedItems: Set<string>
  batchMode: boolean
  editingItemId: string | null
  editingTitle: string
  onDragEnd: (event: DragEndEvent) => void
  onItemClick: (item: TabGroupItem, e: React.MouseEvent) => void
  onEditItem: (item: TabGroupItem) => void
  onSaveEdit: (groupId: string, itemId: string) => void
  onTogglePin: (groupId: string, itemId: string, currentPinned: number) => void
  onToggleTodo: (groupId: string, itemId: string, currentTodo: number) => void
  onDeleteItem: (groupId: string, itemId: string, title: string) => void
  setEditingItemId: (id: string | null) => void
  setEditingTitle: (title: string) => void
  extractDomain: (url: string) => string
}

export function TabItemList({
  items,
  groupId,
  highlightedDomain,
  selectedItems,
  batchMode,
  editingItemId,
  editingTitle,
  onDragEnd,
  onItemClick,
  onEditItem,
  onSaveEdit,
  onTogglePin,
  onToggleTodo,
  onDeleteItem,
  setEditingItemId,
  setEditingTitle,
  extractDomain,
}: TabItemListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        此标签页组没有标签页
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {items.map((item) => {
            const domain = extractDomain(item.url)
            const isHighlighted = highlightedDomain === domain
            const isSelected = selectedItems.has(item.id)

            return (
              <TabItem
                key={item.id}
                item={item}
                groupId={groupId}
                isHighlighted={isHighlighted}
                isSelected={isSelected}
                batchMode={batchMode}
                editingItemId={editingItemId}
                editingTitle={editingTitle}
                onItemClick={onItemClick}
                onEditItem={onEditItem}
                onSaveEdit={onSaveEdit}
                onTogglePin={onTogglePin}
                onToggleTodo={onToggleTodo}
                onDeleteItem={onDeleteItem}
                setEditingItemId={setEditingItemId}
                setEditingTitle={setEditingTitle}
                extractDomain={extractDomain}
              />
            )
          })}
        </div>
      </SortableContext>
    </DndContext>
  )
}

