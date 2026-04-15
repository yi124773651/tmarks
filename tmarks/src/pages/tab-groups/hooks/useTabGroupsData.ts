import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { sortTabGroupsForView, type SortOption } from '@/components/tab-groups/sortUtils'
import { useTabGroupsQuery } from '@/hooks/useTabGroupsQuery'
import { searchInFields } from '@/lib/search-utils'
import type { TabGroup } from '@/lib/types'

interface UseTabGroupsDataProps {
  tabGroups: TabGroup[]
  setTabGroups: React.Dispatch<React.SetStateAction<TabGroup[]>>
  selectedGroupId: string | null
  searchQuery: string
  sortBy: SortOption
}

export function useTabGroupsData({
  tabGroups,
  setTabGroups,
  selectedGroupId,
  searchQuery,
  sortBy,
}: UseTabGroupsDataProps) {
  const { t } = useTranslation('tabGroups')
  const tabGroupsQuery = useTabGroupsQuery()
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    if (tabGroupsQuery.data) {
      setTabGroups(tabGroupsQuery.data)
    }
  }, [tabGroupsQuery.data, setTabGroups])

  const error = tabGroupsQuery.isError ? t('page.loadFailed') : null
  const isLoading = tabGroupsQuery.isLoading && tabGroups.length === 0

  const refreshTreeOnly = async () => {
    await tabGroupsQuery.refetch()
  }

  const groupFilteredTabGroups = useMemo(() => {
    if (tabGroups.length === 0) return []
    if (!selectedGroupId) return tabGroups

    const selectedGroup = tabGroups.find((group) => group.id === selectedGroupId)
    if (!selectedGroup) return []

    if (selectedGroup.is_folder === 1) {
      return tabGroups.filter((group) => group.parent_id === selectedGroupId)
    }

    return [selectedGroup]
  }, [selectedGroupId, tabGroups])

  const filteredTabGroups = useMemo(() => {
    if (groupFilteredTabGroups.length === 0) return []
    if (!debouncedSearchQuery.trim()) return groupFilteredTabGroups

    const query = debouncedSearchQuery.trim().toLowerCase()
    const results: TabGroup[] = []

    for (const group of groupFilteredTabGroups) {
      if (searchInFields([group.title], query)) {
        results.push(group)
        continue
      }

      if (!group.items?.length) {
        continue
      }

      const matchingItems = group.items.filter((item) =>
        searchInFields([item.title, item.url], query)
      )

      if (matchingItems.length > 0) {
        results.push({
          ...group,
          items: matchingItems,
        })
      }
    }

    return results
  }, [debouncedSearchQuery, groupFilteredTabGroups])

  const sortedGroups = useMemo(() => {
    if (filteredTabGroups.length === 0) return []
    return sortTabGroupsForView(filteredTabGroups, sortBy)
  }, [filteredTabGroups, sortBy])

  return {
    isLoading,
    error,
    debouncedSearchQuery,
    refetchTabGroups: tabGroupsQuery.refetch,
    refreshTreeOnly,
    groupFilteredTabGroups,
    filteredTabGroups,
    sortedGroups,
  }
}
