/**
 * 安全中间件
 * 提供安全头、CSP策略、输入验证等安全功能
 */

import type { PagesFunction } from '@cloudflare/workers-types'

/**
 * 安全头中间件
 */
export const securityHeaders: PagesFunction = async (context) => {
  const response = await context.next()
  
  // 创建新的响应头
  const newHeaders = new Headers(response.headers)
  
  // 检查是否是快照查看路径（这些路径需要宽松的 CSP）
  const url = new URL(context.request.url)
  const isSnapshotView = url.pathname.includes('/snapshots/') && 
                         (url.pathname.includes('/view') || url.searchParams.has('sig'))
  
  const standardCsp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  // Snapshot view should not execute scripts from captured HTML.
  const snapshotCsp = [
    "default-src 'none'",
    "script-src 'none'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'none'",
    "media-src 'self' data: https:",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ')

  // 安全头配置
  const securityHeaders = {
    // 防止点击劫持（快照查看除外）
    ...(!isSnapshotView && { 'X-Frame-Options': 'DENY' }),
    
    // 防止 MIME 类型嗅探
    'X-Content-Type-Options': 'nosniff',
    
    // XSS 保护
    'X-XSS-Protection': '1; mode=block',
    
    // 引用者策略
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // 权限策略
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    
    // 内容安全策略
    'Content-Security-Policy': isSnapshotView ? snapshotCsp : standardCsp,
    
    // HSTS (仅在 HTTPS 环境下)
    ...(context.request.url.startsWith('https://') && {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    })
  }
  
  // 添加安全头（跳过 undefined 值）
  Object.entries(securityHeaders).forEach(([key, value]) => {
    if (value) {
      newHeaders.set(key, value)
    }
  })
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  })
}

/**
 * CORS 配置中间件
 */
export const corsHeaders: PagesFunction = async (context) => {
  // 从环境变量获取允许的源
  const allowedOriginsEnv = (context.env as { CORS_ALLOWED_ORIGINS?: string })?.CORS_ALLOWED_ORIGINS

  const cors = getCorsPolicy(context.request, allowedOriginsEnv)

  // 处理预检请求
  if (context.request.method === 'OPTIONS') {
    const headers: Record<string, string> = {
      'Access-Control-Allow-Origin': cors.origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
    }

    if (cors.allowCredentials) {
      headers['Access-Control-Allow-Credentials'] = 'true'
    }

    return new Response(null, {
      headers,
    })
  }

  const response = await context.next()
  const newHeaders = new Headers(response.headers)

  // 添加 CORS 头
  newHeaders.set('Access-Control-Allow-Origin', cors.origin)
  if (cors.allowCredentials) {
    newHeaders.set('Access-Control-Allow-Credentials', 'true')
  } else {
    newHeaders.delete('Access-Control-Allow-Credentials')
  }
  newHeaders.set('Vary', 'Origin')
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  })
}

/**
 * 获取允许的源
 * @param request 请求对象
 * @param allowedOriginsEnv 环境变量中的允许源列表（逗号分隔）
 */
function getCorsPolicy(request: Request, allowedOriginsEnv?: string): { origin: string; allowCredentials: boolean } {
  const origin = request.headers.get('Origin')

  const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
  ]

  const envOrigins = allowedOriginsEnv
    ? allowedOriginsEnv.split(',').map(o => o.trim()).filter(Boolean)
    : []

  const allowedOrigins = [...defaultOrigins, ...envOrigins]

  // 浏览器扩展: 必须在 CORS_ALLOWED_ORIGINS 配置中显式列出
  // 例如: chrome-extension://abcdef123456,extension://abcdef123456
  if (origin && (origin.startsWith('chrome-extension://') || origin.startsWith('extension://'))) {
    if (allowedOrigins.includes(origin)) {
      return { origin, allowCredentials: true }
    }
    // 开发环境回退: 仅在 localhost 来源时允许未配置白名单的扩展
    const hasExtensionWhitelist = allowedOrigins.some(
      o => o.startsWith('chrome-extension://') || o.startsWith('extension://')
    )
    if (!hasExtensionWhitelist && allowedOrigins.some(o => o.includes('localhost'))) {
      return { origin, allowCredentials: true }
    }
    return { origin: 'null', allowCredentials: false }
  }

  if (origin && allowedOrigins.includes(origin)) {
    return { origin, allowCredentials: true }
  }

  if (!origin) {
    return { origin: '*', allowCredentials: false }
  }

  return { origin: 'null', allowCredentials: false }
}

/**
 * 输入验证中间件
 */
export function validateInput<T>(validator: (data: unknown) => data is T) {
  return async (context: { request: Request; next: () => Promise<Response>; validatedData?: T }) => {
    if (context.request.method === 'POST' || context.request.method === 'PUT' || context.request.method === 'PATCH') {
      try {
        const body = await context.request.json()

        if (!validator(body)) {
          return new Response(
            JSON.stringify({
              error: {
                code: 'INVALID_INPUT',
                message: 'Invalid request body format'
              }
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            }
          )
        }

        // 将验证后的数据附加到 context
        context.validatedData = body
      } catch {
        return new Response(
          JSON.stringify({
            error: {
              code: 'INVALID_JSON',
              message: 'Invalid JSON format'
            }
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    }

    return context.next()
  }
}

/**
 * 速率限制中间件（基于 IP）
 * 注意：此函数当前仅作为占位符，实际速率限制逻辑在 rate-limit.ts 中实现
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function rateLimitByIP(_limit: number, _windowSeconds: number) {
  return async (context: { request: Request; next: () => Promise<Response> }) => {
    // 获取 IP 地址用于将来的速率限制实现
    // const ip = context.request.headers.get('CF-Connecting-IP') ||
    //            context.request.headers.get('X-Forwarded-For') ||
    //            'unknown'

    // 这里可以集成到现有的速率限制系统
    // 暂时返回继续执行
    return context.next()
  }
}

/**
 * 日志记录中间件
 */
export const requestLogger: PagesFunction = async (context) => {
  const start = Date.now()
  const ip = context.request.headers.get('CF-Connecting-IP') || 'unknown'
  const userAgent = context.request.headers.get('User-Agent') || 'unknown'

  // 从日志 URL 中移除敏感查询参数
  const logUrl = new URL(context.request.url)
  for (const param of ['sig', 'token', 'api_key', 'key']) {
    if (logUrl.searchParams.has(param)) {
      logUrl.searchParams.set(param, '***')
    }
  }
  const sanitizedUrl = logUrl.toString()

  try {
    const response = await context.next()
    const duration = Date.now() - start

    // 记录请求日志
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      method: context.request.method,
      url: sanitizedUrl,
      status: response.status,
      duration,
      ip,
      userAgent: userAgent.substring(0, 100),
    }))

    return response
  } catch (error) {
    const duration = Date.now() - start

    // 记录错误日志
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      method: context.request.method,
      url: sanitizedUrl,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
      ip,
      userAgent: userAgent.substring(0, 100),
    }))

    throw error
  }
}

/**
 * 组合安全中间件
 */
export const securityMiddleware: PagesFunction = async (context) => {
  // 依次应用安全中间件
  return securityHeaders(context)
}
