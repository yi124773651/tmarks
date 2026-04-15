/**
 * AI 模型列表获取服务
 * 支持从 OpenAI 兼容 API 自动获取可用模型
 */

import i18n from '@/i18n'
import type { AIProvider } from './constants'
import { AI_SERVICE_URLS } from './constants'

// 支持自动获取模型的服务商
const OPENAI_COMPATIBLE_PROVIDERS = new Set<AIProvider>([
  'openai',
  'deepseek',
  'siliconflow',
  'custom'
])

/**
 * 清理 API URL
 */
const sanitizeBaseUrl = (baseUrl: string): string => {
  const trimmed = baseUrl.trim()
  if (!trimmed) return trimmed

  return trimmed
    .replace(/\s+/g, '')
    .replace(/\/chat\/completions$/, '')
    .replace(/\/$/, '')
}

/**
 * 解析 API URL
 */
const resolveBaseUrl = (provider: AIProvider, apiUrl?: string): string | undefined => {
  if (apiUrl && apiUrl.trim()) {
    return sanitizeBaseUrl(apiUrl)
  }

  const fallback = AI_SERVICE_URLS[provider]
  return fallback ? sanitizeBaseUrl(fallback) : undefined
}

/**
 * 从 OpenAI 兼容 API 获取模型列表
 */
const fetchOpenAIStyleModels = async (baseUrl: string, apiKey: string): Promise<string[]> => {
  const url = `${baseUrl}/models`
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`${i18n.t('errors:ai.modelListFailed')} (${response.status}): ${errorText || response.statusText}`)
  }

  const json = await response.json()
  if (!Array.isArray(json?.data)) {
    throw new Error(i18n.t('errors:ai.modelListInvalid'))
  }

  const models = json.data
    .map((item: unknown) => {
      if (item && typeof item === 'object' && 'id' in item) {
        return (item as { id: unknown }).id
      }
      return undefined
    })
    .filter((id: unknown): id is string => typeof id === 'string' && id.length > 0)

  if (models.length === 0) {
    throw new Error(i18n.t('errors:ai.modelListEmpty'))
  }

  return models
}

/**
 * 检查是否支持自动获取模型
 */
export const canFetchModels = (provider: AIProvider, apiUrl?: string): boolean => {
  if (!OPENAI_COMPATIBLE_PROVIDERS.has(provider)) {
    return false
  }

  if (provider === 'custom') {
    const trimmed = apiUrl?.trim()
    return Boolean(trimmed && /^https?:\/\//.test(trimmed))
  }

  return true
}

/**
 * 获取可用模型列表
 */
export async function fetchAvailableModels(
  provider: AIProvider,
  apiKey: string,
  apiUrl?: string
): Promise<string[]> {
  if (!OPENAI_COMPATIBLE_PROVIDERS.has(provider)) {
    throw new Error(i18n.t('errors:ai.providerNotSupported'))
  }

  if (!apiKey.trim()) {
    throw new Error(i18n.t('errors:ai.missingApiKey'))
  }

  const baseUrl = resolveBaseUrl(provider, apiUrl)
  if (!baseUrl) {
    throw new Error(i18n.t('errors:ai.missingApiUrl'))
  }

  return fetchOpenAIStyleModels(baseUrl, apiKey)
}
