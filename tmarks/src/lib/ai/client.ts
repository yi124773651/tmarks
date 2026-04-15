/**
 * AI 服务客户端
 * 支持多种 AI 服务商的统一调用接口
 */

import { AI_SERVICE_URLS, AI_DEFAULT_MODELS, AI_TIMEOUT, type AIProvider } from './constants'

// 系统提示词
const SYSTEM_PROMPT = '你是一个智能书签整理助手。请根据用户的要求整理书签数据。返回格式必须是 JSON。'

// 调用参数
export interface AICallParams {
  provider: AIProvider
  apiKey: string
  apiUrl?: string
  model?: string
  prompt: string
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
}

// 调用结果
export interface AICallResult {
  content: string
  raw: unknown
}

/**
 * 解析 API URL，确保正确拼接端点
 */
function resolveEndpoint(baseUrl: string, endpoint: string): string {
  const trimmed = baseUrl.trim()
  if (!trimmed) return endpoint
  if (trimmed.includes(endpoint)) return trimmed
  
  const normalizedBase = trimmed.replace(/\/$/, '')
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${normalizedBase}${normalizedEndpoint}`
}

/**
 * 构建 OpenAI 兼容格式的请求
 */
function buildOpenAIRequest(params: AICallParams, options?: {
  includeJsonResponseFormat?: boolean
  additionalBody?: Record<string, unknown>
}) {
  const { apiKey, apiUrl, model, prompt, systemPrompt, temperature, maxTokens, provider } = params
  
  const baseUrl = apiUrl?.trim() || AI_SERVICE_URLS[provider]
  const url = resolveEndpoint(baseUrl, '/chat/completions')
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  }
  
  const body: Record<string, unknown> = {
    model: model || AI_DEFAULT_MODELS[provider],
    messages: [
      { role: 'system', content: systemPrompt || SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ],
    temperature: temperature ?? 0.7,
    max_tokens: maxTokens ?? 2000
  }
  
  if (options?.includeJsonResponseFormat) {
    body.response_format = { type: 'json_object' }
  }
  
  if (options?.additionalBody) {
    Object.assign(body, options.additionalBody)
  }
  
  return { url, headers, body }
}

/**
 * 构建 Claude 格式的请求
 */
function buildClaudeRequest(params: AICallParams) {
  const { apiKey, apiUrl, model, prompt, systemPrompt, temperature, maxTokens } = params
  
  const baseUrl = apiUrl?.trim() || AI_SERVICE_URLS.claude
  const url = resolveEndpoint(baseUrl, '/messages')
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01'
  }
  
  const body = {
    model: model || AI_DEFAULT_MODELS.claude,
    system: systemPrompt || SYSTEM_PROMPT,
    max_tokens: maxTokens ?? 2000,
    temperature: temperature ?? 0.7,
    messages: [
      { role: 'user', content: prompt }
    ]
  }
  
  return { url, headers, body }
}

/**
 * 从 OpenAI 兼容格式的响应中提取内容
 */
function extractOpenAIContent(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  
  const dataObj = data as Record<string, unknown>
  const choices = dataObj.choices
  
  if (!Array.isArray(choices) || choices.length === 0) return undefined
  
  const firstChoice = choices[0]
  if (!firstChoice || typeof firstChoice !== 'object') return undefined
  
  const message = (firstChoice as Record<string, unknown>).message
  if (!message || typeof message !== 'object') return undefined
  
  const content = (message as Record<string, unknown>).content
  if (typeof content === 'string') return content.trim()
  
  return undefined
}

/**
 * 从 Claude 格式的响应中提取内容
 */
function extractClaudeContent(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  
  const dataObj = data as Record<string, unknown>
  const content = dataObj.content
  
  if (Array.isArray(content) && content.length > 0) {
    const first = content[0]
    if (first && typeof first === 'object' && 'text' in first) {
      return (first as { text: string }).text.trim()
    }
  }
  
  return undefined
}

/**
 * 调用 AI 服务
 */
export async function callAI(params: AICallParams): Promise<AICallResult> {
  const { provider } = params
  
  let url: string
  let headers: Record<string, string>
  let body: Record<string, unknown>
  let extractContent: (data: unknown) => string | undefined
  
  // 根据服务商构建请求
  switch (provider) {
    case 'claude':
      ({ url, headers, body } = buildClaudeRequest(params))
      extractContent = extractClaudeContent
      break
    
    case 'openai':
    case 'deepseek':
      ({ url, headers, body } = buildOpenAIRequest(params, { includeJsonResponseFormat: true }))
      extractContent = extractOpenAIContent
      break
    
    case 'siliconflow':
      ({ url, headers, body } = buildOpenAIRequest(params, { additionalBody: { stream: false } }))
      extractContent = extractOpenAIContent
      break
    
    case 'modelscope':
      ({ url, headers, body } = buildOpenAIRequest(params, { additionalBody: { result_format: 'message' } }))
      extractContent = extractOpenAIContent
      break
    
    default:
      // zhipu, iflow, custom 都使用 OpenAI 兼容格式
      ({ url, headers, body } = buildOpenAIRequest(params))
      extractContent = extractOpenAIContent
  }
  
  // 发送请求
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT)
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      let errorText: string
      try {
        errorText = await response.text()
      } catch {
        errorText = 'Unknown error'
      }
      throw new Error(`AI API 请求失败 (${response.status}): ${errorText.substring(0, 200)}`)
    }
    
    const data = await response.json()
    const content = extractContent(data)
    
    if (!content) {
      throw new Error(`AI 响应格式错误: ${JSON.stringify(data).substring(0, 200)}`)
    }
    
    return { content, raw: data }
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('AI 请求超时，请稍后重试')
    }
    
    throw error
  }
}

/**
 * 测试 AI 连接
 */
export async function testAIConnection(params: {
  provider: AIProvider
  apiKey: string
  apiUrl?: string
  model?: string
}): Promise<{ success: boolean; latency: number; error?: string }> {
  const startTime = Date.now()
  
  try {
    await callAI({
      ...params,
      prompt: 'Hi',
      maxTokens: 5
    })
    
    return {
      success: true,
      latency: Date.now() - startTime
    }
  } catch (error) {
    return {
      success: false,
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
