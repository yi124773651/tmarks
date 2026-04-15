/**
 * 签名 URL 工具
 * 用于生成和验证带签名的临时访�?URL
 * 类似 AWS S3 Presigned URL 的实�?
 */

export interface SignedUrlParams {
  userId: string
  resourceId: string // 资源 ID（如 snapshot ID�?
  expiresIn?: number // 有效期（秒），默�?1 小时
  action?: string // 操作类型（如 'view', 'download'�?
}

export interface SignedUrlData {
  userId: string
  resourceId: string
  expires: number // Unix timestamp
  action?: string
}

/**
 * 生成签名 URL
 * @param params 签名参数
 * @param secret 签名密钥
 * @returns 签名字符串和过期时间
 */
export async function generateSignedUrl(
  params: SignedUrlParams,
  secret: string
): Promise<{ signature: string; expires: number }> {
  const now = Math.floor(Date.now() / 1000)
  const expires = now + (params.expiresIn || 3600) // 默认 1 小时

  const data: SignedUrlData = {
    userId: params.userId,
    resourceId: params.resourceId,
    expires,
    action: params.action,
  }

  // 生成签名字符�?
  const message = `${data.userId}:${data.resourceId}:${data.expires}:${data.action || ''}`
  const signature = await sign(message, secret)

  return { signature, expires }
}

/**
 * 验证签名 URL
 * @param signature 签名字符�?
 * @param expires 过期时间
 * @param userId 用户 ID
 * @param resourceId 资源 ID
 * @param action 操作类型
 * @param secret 签名密钥
 * @returns 是否有效
 */
export async function verifySignedUrl(
  signature: string,
  expires: number,
  userId: string,
  resourceId: string,
  secret: string,
  action?: string
): Promise<{ valid: boolean; error?: string }> {
  // 检查是否过�?
  const now = Math.floor(Date.now() / 1000)
  if (expires < now) {
    return { valid: false, error: 'URL has expired' }
  }

  // 重新生成签名并比�?
  const message = `${userId}:${resourceId}:${expires}:${action || ''}`
  const expectedSignature = await sign(message, secret)

  if (signature !== expectedSignature) {
    return { valid: false, error: 'Invalid signature' }
  }

  return { valid: true }
}

/**
 * 从请求中提取签名参数
 */
export function extractSignedParams(request: Request): {
  signature: string | null
  expires: number | null
  userId: string | null
  action: string | null
} {
  try {
    const url = new URL(request.url)
    const signature = url.searchParams.get('sig') || url.searchParams.get('signature')
    const expiresStr = url.searchParams.get('exp') || url.searchParams.get('expires')
    const userId = url.searchParams.get('u') || url.searchParams.get('user')
    const action = url.searchParams.get('a') || url.searchParams.get('action')

    return {
      signature,
      expires: expiresStr ? parseInt(expiresStr, 10) : null,
      userId,
      action,
    }
  } catch {
    return {
      signature: null,
      expires: null,
      userId: null,
      action: null,
    }
  }
}

/**
 * 使用 HMAC-SHA256 签名
 */
async function sign(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const messageData = encoder.encode(message)

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, messageData)
  
  // 转换�?hex 字符串（更短更易读）
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
