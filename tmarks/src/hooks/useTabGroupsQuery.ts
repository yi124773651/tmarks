import { useQuery, useQueryClient } from '@tanstack/react-query'
import { tabGroupsService } from '@/services/tab-groups'

export const TAB_GROUPS_QUERY_KEY = ['tab-groups', 'all'] as const
export const TAB_GROUPS_TRASH_QUERY_KEY = ['tab-groups', 'trash'] as const
export const TAB_GROUP_DETAIL_QUERY_KEY = 'tab-group-detail'
export const TAB_GROUPS_STATISTICS_QUERY_KEY = 'tab-groups-statistics'

export function useTabGroupsQuery() {
  return useQuery({
    queryKey: TAB_GROUPS_QUERY_KEY,
    queryFn: async () => {
      const groups = await tabGroupsService.listAllTabGroups()
      return groups.filter((group) => !group.is_deleted)
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: 'always',
  })
}

export function useTabGroupsTrashQuery() {
  return useQuery({
    queryKey: TAB_GROUPS_TRASH_QUERY_KEY,
    queryFn: async () => {
      const response = await tabGroupsService.getTrash()
      return response.tab_groups
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: 'always',
  })
}

export function useTabGroupDetailQuery(groupId?: string) {
  return useQuery({
    queryKey: [TAB_GROUP_DETAIL_QUERY_KEY, groupId],
    queryFn: async () => {
      if (!groupId) {
        throw new Error('Missing group id')
      }
      return tabGroupsService.getTabGroup(groupId)
    },
    enabled: Boolean(groupId),
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: 'always',
  })
}

export function useTabGroupsStatisticsQuery(days: number) {
  return useQuery({
    queryKey: [TAB_GROUPS_STATISTICS_QUERY_KEY, days],
    queryFn: async () => tabGroupsService.getStatistics(days),
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: 'always',
  })
}

export function useInvalidateTabGroups() {
  const queryClient = useQueryClient()

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: TAB_GROUPS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: TAB_GROUPS_TRASH_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: [TAB_GROUP_DETAIL_QUERY_KEY] }),
      queryClient.invalidateQueries({ queryKey: [TAB_GROUPS_STATISTICS_QUERY_KEY] }),
    ])
  }
}
