import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { tabGroupsService } from '@/services/tab-groups'
import type { TabGroup, TabGroupItem } from '@/lib/types'
import { ColorPicker, getColorClasses } from '@/components/tab-groups/ColorPicker'
import { ShareDialog } from '@/components/tab-groups/ShareDialog'
import { sortTabGroups, type SortOption } from '@/components/tab-groups/SortSelector'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { SearchBar } from '@/components/tab-groups/SearchBar'
import { BatchActionBar } from '@/components/tab-groups/BatchActionBar'
import { EmptyState } from '@/components/tab-groups/EmptyState'
import { TabGroupHeader } from '@/components/tab-groups/TabGroupHeader'
import { TabItemList } from '@/components/tab-groups/TabItemList'
import { TabGroupSidebar } from '@/components/tab-groups/TabGroupSidebar'
import { TodoSidebar } from '@/components/tab-groups/TodoSidebar'
import { ResizablePanel } from '@/components/common/ResizablePanel'
import { arrayMove } from '@dnd-kit/sortable'
import type { DragEndEvent } from '@dnd-kit/core'
import { Archive, BarChart3 } from 'lucide-react'
import { useTabGroupActions } from '@/hooks/useTabGroupActions'
import { useBatchActions } from '@/hooks/useBatchActions'

export function TabGroupsPage() {
  const [tabGroups, setTabGroups] = useState<TabGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedDomain, setHighlightedDomain] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [batchMode, setBatchMode] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('created')
  const [editingColorGroupId, setEditingColorGroupId] = useState<string | null>(null)
  const [sharingGroupId, setSharingGroupId] = useState<string | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })

  // Use custom hooks
  const {
    editingItemId,
    setEditingItemId,
    editingTitle,
    setEditingTitle,
    editingGroupId,
    setEditingGroupId,
    editingGroupTitle,
    setEditingGroupTitle,
    handleDelete,
    handleOpenAll,
    handleExportMarkdown,
    handleEditGroup,
    handleSaveGroupEdit,
    handleColorChange,
    handleEditItem,
    handleSaveEdit,
    handleTogglePin,
    handleToggleTodo,
    handleDeleteItem,
  } = useTabGroupActions({
    setTabGroups,
    setDeletingId,
    setConfirmDialog,
    confirmDialog,
  })

  const {
    handleBatchDelete,
    handleBatchPin,
    handleBatchTodo,
    handleBatchExport,
    handleDeselectAll,
  } = useBatchActions({
    tabGroups,
    setTabGroups,
    selectedItems,
    setSelectedItems,
    setConfirmDialog,
    confirmDialog,
  })

  useEffect(() => {
    loadTabGroups()
  }, [])

  const loadTabGroups = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const groups = await tabGroupsService.getAllTabGroups()
      setTabGroups(groups)
    } catch (err) {
      console.error('Failed to load tab groups:', err)
      setError('加载标签页组失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleItemClick = (item: TabGroupItem, e: React.MouseEvent) => {
    if (batchMode) {
      e.preventDefault()
      const newSelected = new Set(selectedItems)
      if (newSelected.has(item.id)) {
        newSelected.delete(item.id)
      } else {
        newSelected.add(item.id)
      }
      setSelectedItems(newSelected)
      return
    }

    const domain = extractDomain(item.url)
    if (highlightedDomain === domain) {
      setHighlightedDomain(null)
    } else {
      setHighlightedDomain(domain)
    }
  }

  const extractDomain = (url: string): string => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch {
      return ''
    }
  }

  const handleDragEnd = async (event: DragEndEvent, groupId: string) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const group = tabGroups.find((g) => g.id === groupId)
    if (!group || !group.items) return

    const oldIndex = group.items.findIndex((item) => item.id === active.id)
    const newIndex = group.items.findIndex((item) => item.id === over.id)

    const newItems = arrayMove(group.items, oldIndex, newIndex)

    // Update local state immediately
    setTabGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, items: newItems } : g
      )
    )

    // Update positions in backend
    try {
      await Promise.all(
        newItems.map((item: TabGroupItem, index: number) =>
          tabGroupsService.updateTabGroupItem(item.id, { position: index })
        )
      )
    } catch (err) {
      console.error('Failed to update positions:', err)
      // Revert on error
      setTabGroups((prev) =>
        prev.map((g) =>
          g.id === groupId ? { ...g, items: group.items } : g
        )
      )
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            加载中...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={loadTabGroups}
            className="px-4 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            style={{ color: 'var(--foreground)' }}
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  // Filter by selected group first
  const groupFilteredTabGroups = selectedGroupId
    ? tabGroups.filter(g => g.id === selectedGroupId)
    : tabGroups

  // Then filter by search query
  const filteredTabGroups = groupFilteredTabGroups.map((group) => {
    if (!searchQuery.trim()) return group

    const query = searchQuery.toLowerCase()
    const matchesTitle = group.title.toLowerCase().includes(query)
    const filteredItems = group.items?.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.url.toLowerCase().includes(query)
    )

    if (matchesTitle || (filteredItems && filteredItems.length > 0)) {
      return {
        ...group,
        items: matchesTitle ? group.items : filteredItems,
      }
    }

    return null
  }).filter((g): g is TabGroup => g !== null)

  const totalTabs = tabGroups.reduce((sum, group) => sum + (group.item_count || group.items?.length || 0), 0)
  const filteredTotalTabs = filteredTabGroups.reduce((sum, group) => sum + (group.items?.length || 0), 0)

  // Sort filtered groups
  const sortedGroups = sortTabGroups(filteredTabGroups, sortBy)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 左侧导航栏 */}
      <ResizablePanel
        side="left"
        defaultWidth={240}
        minWidth={200}
        maxWidth={400}
        storageKey="tab-groups-left-sidebar-width"
      >
        <TabGroupSidebar
          tabGroups={tabGroups}
          selectedGroupId={selectedGroupId}
          onSelectGroup={setSelectedGroupId}
        />
      </ResizablePanel>

      {/* 中间内容区域 */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {/* Header */}
          <div className="mb-6">
        {/* Navigation */}
        <div className="flex items-center gap-4 mb-4">
          <Link
            to="/tab-groups"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            标签页组
          </Link>
          <Link
            to="/tab-groups/trash"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <Archive className="w-4 h-4" />
            回收站
          </Link>
          <Link
            to="/tab-groups/statistics"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <BarChart3 className="w-4 h-4" />
            统计
          </Link>
        </div>

        {/* Stats */}
        {tabGroups.length > 0 && (
          <div className="flex items-center gap-4 mb-4">
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {searchQuery ? filteredTabGroups.length : tabGroups.length}
              </p>
              <p className="text-xs text-gray-600">个标签页组</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {searchQuery ? filteredTotalTabs : totalTabs}
              </p>
              <p className="text-xs text-gray-600">个标签页</p>
            </div>
          </div>
        )}

        {/* Batch Action Bar */}
        {batchMode && selectedItems.size > 0 && (
          <BatchActionBar
            selectedCount={selectedItems.size}
            onSelectAll={() => {
              // Select all items from all groups
              const allItemIds = new Set<string>()
              tabGroups.forEach((group) => {
                group.items?.forEach((item) => {
                  allItemIds.add(item.id)
                })
              })
              setSelectedItems(allItemIds)
            }}
            onDeselectAll={handleDeselectAll}
            onBatchDelete={handleBatchDelete}
            onBatchPin={handleBatchPin}
            onBatchTodo={handleBatchTodo}
            onBatchExport={handleBatchExport}
            onCancel={() => {
              setBatchMode(false)
              setSelectedItems(new Set())
            }}
          />
        )}

        {/* Search Bar */}
        {tabGroups.length > 0 && (
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onBatchModeToggle={() => setBatchMode(!batchMode)}
            batchMode={batchMode}
          />
        )}
      </div>

      {/* Empty State */}
      {tabGroups.length === 0 && <EmptyState isSearching={false} searchQuery="" />}

      {/* No Search Results */}
      {tabGroups.length > 0 && filteredTabGroups.length === 0 && (
        <EmptyState isSearching={true} searchQuery={searchQuery} />
      )}

      {/* Tab Groups Grid */}
      {sortedGroups.length > 0 && (
        <div className="grid grid-cols-1 gap-6">
          {sortedGroups.map((group) => {
            const colorClasses = getColorClasses(group.color)

            // 获取左侧色条颜色
            const getLeftBorderColor = (color: string | null) => {
              switch (color) {
                case '红色': return 'border-l-red-500'
                case '橙色': return 'border-l-orange-500'
                case '黄色': return 'border-l-yellow-500'
                case '绿色': return 'border-l-green-500'
                case '蓝色': return 'border-l-blue-500'
                case '紫色': return 'border-l-purple-500'
                case '粉色': return 'border-l-pink-500'
                default: return 'border-l-gray-200'
              }
            }

            const leftBorderColor = getLeftBorderColor(group.color)

            return (
              <div
                key={group.id}
                className={`rounded-xl border-2 border-l-8 p-6 shadow-sm hover:shadow-xl transition-all duration-200 ${colorClasses} ${leftBorderColor}`}
              >
              {/* Header */}
              <TabGroupHeader
                group={group}
                isEditingTitle={editingGroupId === group.id}
                editingTitle={editingGroupTitle}
                onEditTitle={() => handleEditGroup(group)}
                onSaveTitle={() => handleSaveGroupEdit(group.id)}
                onCancelEdit={() => {
                  setEditingGroupId(null)
                  setEditingGroupTitle('')
                }}
                onTitleChange={setEditingGroupTitle}
                onOpenAll={() => handleOpenAll(group.items || [])}
                onExport={() => handleExportMarkdown(group)}
                onDelete={() => handleDelete(group.id, group.title)}
                isDeleting={deletingId === group.id}
                onColorClick={() =>
                  setEditingColorGroupId(editingColorGroupId === group.id ? null : group.id)
                }
                onShareClick={() => setSharingGroupId(group.id)}
                colorPickerSlot={
                  editingColorGroupId === group.id && (
                    <ColorPicker
                      currentColor={group.color}
                      onColorChange={(color) => handleColorChange(group.id, color)}
                      onClose={() => setEditingColorGroupId(null)}
                    />
                  )
                }
              />

              {/* Tab Items List */}
              {group.items && group.items.length > 0 && (
                <TabItemList
                  items={group.items}
                  groupId={group.id}
                  highlightedDomain={highlightedDomain}
                  selectedItems={selectedItems}
                  batchMode={batchMode}
                  editingItemId={editingItemId}
                  editingTitle={editingTitle}
                  onDragEnd={(event) => handleDragEnd(event, group.id)}
                  onItemClick={handleItemClick}
                  onEditItem={handleEditItem}
                  onSaveEdit={handleSaveEdit}
                  onTogglePin={handleTogglePin}
                  onToggleTodo={handleToggleTodo}
                  onDeleteItem={handleDeleteItem}
                  setEditingItemId={setEditingItemId}
                  setEditingTitle={setEditingTitle}
                  extractDomain={extractDomain}
                />
              )}
            </div>
            )
          })}
        </div>
      )}

      {/* Share Dialog */}
      {sharingGroupId && (
        <ShareDialog
          groupId={sharingGroupId}
          groupTitle={tabGroups.find((g) => g.id === sharingGroupId)?.title || ''}
          onClose={() => setSharingGroupId(null)}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
        </div>
      </div>

      {/* 右侧TODO栏 */}
      <ResizablePanel
        side="right"
        defaultWidth={320}
        minWidth={280}
        maxWidth={500}
        storageKey="tab-groups-right-sidebar-width"
      >
        <TodoSidebar
          tabGroups={tabGroups}
          onUpdate={loadTabGroups}
        />
      </ResizablePanel>
    </div>
  )
}
