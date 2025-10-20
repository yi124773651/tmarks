import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { preferencesService } from '@/services/preferences'
import type { UpdatePreferencesRequest } from '@/lib/types'

export const PREFERENCES_QUERY_KEY = 'preferences'

/**
 * 获取用户偏好设置
 */
export function usePreferences() {
  return useQuery({
    queryKey: [PREFERENCES_QUERY_KEY],
    queryFn: () => preferencesService.getPreferences(),
  })
}

/**
 * 更新用户偏好设置
 */
export function useUpdatePreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdatePreferencesRequest) => preferencesService.updatePreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PREFERENCES_QUERY_KEY] })
    },
  })
}
