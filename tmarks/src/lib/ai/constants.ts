/**
 * AI 服务常量定义
 * 包含服务商类型、API 地址和默认模型配置
 */

export type AIProvider = 'openai' | 'deepseek' | 'claude' | 'siliconflow' | 'modelscope' | 'custom'

export const AI_SERVICE_URLS: Record<AIProvider, string> = {
  openai: 'https://api.openai.com/v1',
  deepseek: 'https://api.deepseek.com/v1',
  claude: 'https://api.anthropic.com/v1',
  siliconflow: 'https://api.siliconflow.cn/v1',
  modelscope: 'https://api-inference.modelscope.cn/v1',
  custom: '',
}

export const AI_DEFAULT_MODELS: Record<AIProvider, string> = {
  openai: 'gpt-4o-mini',
  deepseek: 'deepseek-chat',
  claude: 'claude-3-5-sonnet-20241022',
  siliconflow: 'deepseek-ai/DeepSeek-V2.5',
  modelscope: 'Qwen/Qwen2.5-72B-Instruct',
  custom: '',
}

export const AI_TIMEOUT = 60_000
