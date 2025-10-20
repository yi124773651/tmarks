import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { shareService } from '@/services/share'
import type { ShareSettings, UpdateShareSettingsRequest, PublicSharePayload } from '@/lib/types'

export const SHARE_SETTINGS_QUERY_KEY = 'share-settings'

export function useShareSettings() {
  return useQuery<ShareSettings>({
    queryKey: [SHARE_SETTINGS_QUERY_KEY],
    queryFn: () => shareService.getSettings(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateShareSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateShareSettingsRequest) => shareService.updateSettings(payload),
    onSuccess: (data) => {
      queryClient.setQueryData([SHARE_SETTINGS_QUERY_KEY], data)
    },
  })
}

export function usePublicShare(slug: string, enabled: boolean) {
  return useQuery<PublicSharePayload>({
    queryKey: ['public-share', slug],
    queryFn: () => shareService.getPublicShare(slug),
    enabled: enabled && Boolean(slug),
    staleTime: 60 * 1000,
  })
}
