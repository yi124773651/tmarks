/**
 *  URL 
 * �?URL
 *  AWS S3 Presigned URL �?
 */

export interface SignedUrlParams {
  userId: string
  resourceId: string //  ID（ snapshot ID�?
  expiresIn?: number // （），�?1 
  action?: string // （ 'view', 'download'�?
}

export interface SignedUrlData {
  userId: string
  resourceId: string
  expires: number // Unix timestamp
  action?: string
}

/**
 *  URL
 * @param params 
 * @param secret 
 * @returns 
 */
export async function generateSignedUrl(
  params: SignedUrlParams,
  secret: string
): Promise<{ signature: string; expires: number }> {
  const now = Math.floor(Date.now() / 1000)
  const expires = now + (params.expiresIn || 3600) //  1 

  const data: SignedUrlData = {
    userId: params.userId,
    resourceId: params.resourceId,
    expires,
    action: params.action,
  }

  // �?
  const message = `${data.userId}:${data.resourceId}:${data.expires}:${data.action || ''}`
  const signature = await sign(message, secret)

  return { signature, expires }
}

/**
 *  URL
 * @param signature �?
 * @param expires 
 * @param userId  ID
 * @param resourceId  ID
 * @param action 
 * @param secret 
 * @returns 
 */
export async function verifySignedUrl(
  signature: string,
  expires: number,
  userId: string,
  resourceId: string,
  secret: string,
  action?: string
): Promise<{ valid: boolean; error?: string }> {
  // �?
  const now = Math.floor(Date.now() / 1000)
  if (expires < now) {
    return { valid: false, error: 'URL has expired' }
  }

  // �?
  const message = `${userId}:${resourceId}:${expires}:${action || ''}`
  const expectedSignature = await sign(message, secret)

  if (signature !== expectedSignature) {
    return { valid: false, error: 'Invalid signature' }
  }

  return { valid: true }
}

/**
 * 
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
 *  HMAC-SHA256 
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
  
  // �?hex （）
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
