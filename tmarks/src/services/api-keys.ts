/**
 * API Keys 服务层
 * 前端调用后端 API 的封装
 */

import { apiClient } from '@/lib/api-client'
import { assertData } from './index'

export interface ApiKey {
  id: string
  key_prefix: string
  name: string
  description: string | null
  permissions: string[]
  status: 'active' | 'revoked' | 'expired'
  expires_at: string | null
  last_used_at: string | null
  last_used_ip: string | null
  created_at: string
  updated_at: string
}

export interface ApiKeyWithKey extends ApiKey {
  key: string // 完整 Key，仅在创建时返回
}

export interface ApiKeyStats {
  total_requests: number
  last_used_at: string | null
  last_used_ip: string | null
}

export interface ApiKeyWithStats extends ApiKey {
  stats: ApiKeyStats
}

export interface ApiKeyLog {
  api_key_id: string
  user_id: string
  endpoint: string
  method: string
  status: number
  ip: string | null
  created_at: string
}

export interface CreateApiKeyRequest {
  name: string
  description?: string
  permissions?: string[]
  template?: 'READ_ONLY' | 'BASIC' | 'FULL'
  expires_at?: string | null
}

export interface UpdateApiKeyRequest {
  name?: string
  description?: string
  permissions?: string[]
  template?: 'READ_ONLY' | 'BASIC' | 'FULL'
  expires_at?: string | null
}

/**
 * 获取用户的所有 API Keys
 */
export async function getApiKeys(): Promise<{
  keys: ApiKey[]
  quota: { used: number; limit: number }
}> {
  const response = await apiClient.get<{ keys: ApiKey[]; quota: { used: number; limit: number } }>('/settings/api-keys')
  return assertData(response.data, 'GET /settings/api-keys')
}

/**
 * 获取单个 API Key 详情
 */
export async function getApiKey(id: string): Promise<ApiKeyWithStats> {
  const response = await apiClient.get<ApiKeyWithStats>(`/settings/api-keys/${id}`)
  return assertData(response.data, `GET /settings/api-keys/${id}`)
}

/**
 * 创建新的 API Key
 */
export async function createApiKey(data: CreateApiKeyRequest): Promise<ApiKeyWithKey> {
  const response = await apiClient.post<ApiKeyWithKey>('/settings/api-keys', data)
  return assertData(response.data, 'POST /settings/api-keys')
}

/**
 * 更新 API Key
 */
export async function updateApiKey(id: string, data: UpdateApiKeyRequest): Promise<ApiKey> {
  const response = await apiClient.patch<ApiKey>(`/settings/api-keys/${id}`, data)
  return assertData(response.data, `PATCH /settings/api-keys/${id}`)
}

/**
 * 撤销 API Key
 */
export async function revokeApiKey(id: string): Promise<void> {
  await apiClient.delete(`/settings/api-keys/${id}`)
}

/**
 * 永久删除 API Key
 */
export async function deleteApiKey(id: string): Promise<void> {
  await apiClient.delete(`/settings/api-keys/${id}?hard=true`)
}

/**
 * 获取 API Key 使用日志
 */
export async function getApiKeyLogs(
  id: string,
  limit: number = 10
): Promise<{ logs: ApiKeyLog[]; limit: number }> {
  const response = await apiClient.get<{ logs: ApiKeyLog[]; limit: number }>(`/settings/api-keys/${id}/logs?limit=${limit}`)
  return assertData(response.data, `GET /settings/api-keys/${id}/logs`)
}
