import { useRef, useState } from 'react'
import type { TabGroup, TabGroupItem } from '@/lib/types'
import type { SortOption } from '@/components/tab-groups/sortUtils'

export function useTabGroupsState() {
  const [tabGroups, setTabGroups] = useState<TabGroup[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedDomain, setHighlightedDomain] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('created')
  const searchCleanupTimerRef = useRef<NodeJS.Timeout | null>(null)

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [batchMode, setBatchMode] = useState(false)

  const [sharingGroupId, setSharingGroupId] = useState<string | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const [moveItemDialog, setMoveItemDialog] = useState<{
    isOpen: boolean
    item: TabGroupItem | null
    currentGroupId: string
  }>({
    isOpen: false,
    item: null,
    currentGroupId: '',
  })

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

  return {
    tabGroups,
    setTabGroups,
    deletingId,
    setDeletingId,
    searchQuery,
    setSearchQuery,
    highlightedDomain,
    setHighlightedDomain,
    sortBy,
    setSortBy,
    searchCleanupTimerRef,
    selectedItems,
    setSelectedItems,
    batchMode,
    setBatchMode,
    sharingGroupId,
    setSharingGroupId,
    selectedGroupId,
    setSelectedGroupId,
    isDrawerOpen,
    setIsDrawerOpen,
    moveItemDialog,
    setMoveItemDialog,
    confirmDialog,
    setConfirmDialog,
  }
}
