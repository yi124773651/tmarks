import { apiClient } from '@/lib/api-client'
import type {
  ShareSettingsResponse,
  UpdateShareSettingsRequest,
  ShareSettings,
  PublicSharePayload,
} from '@/lib/types'

const PUBLIC_SHARE_BASE = import.meta.env.VITE_PUBLIC_SHARE_URL || '/api/public'

export const shareService = {
  async getSettings(): Promise<ShareSettings> {
    const response = await apiClient.get<ShareSettingsResponse>('/settings/share')
    return response.data!.share
  },

  async updateSettings(payload: UpdateShareSettingsRequest): Promise<ShareSettings> {
    const response = await apiClient.put<ShareSettingsResponse>('/settings/share', payload)
    return response.data!.share
  },

  async getPublicShare(slug: string): Promise<PublicSharePayload> {
    const url = `${PUBLIC_SHARE_BASE.replace(/\/$/, '')}/${encodeURIComponent(slug)}`
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('无法加载公开分享内容')
    }

    const data = (await response.json()) as { data?: PublicSharePayload; error?: { message: string } }
    if (!data.data) {
      throw new Error(data.error?.message || '公开内容不存在')
    }
    return data.data
  },
}
