import { apiClient } from '@/lib/api-client'
import type { R2StorageQuotaResponse, R2StorageQuota } from '@/lib/types'
import { assertData } from './index'

export const storageService = {
  async getR2Quota(): Promise<R2StorageQuota> {
    const response = await apiClient.get<R2StorageQuotaResponse>('/settings/storage')
    // 后端使用 ApiResponse 包裹，此处直接返回内部的 quota 对象
    return assertData(response.data, 'GET /settings/storage').quota
  },
}
