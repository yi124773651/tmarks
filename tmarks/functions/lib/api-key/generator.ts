/**
 * API Key Generator - �?API Key
 * : tmk_live_[20]
 */

/**
 *  API Key
 * @param env  ('live' | 'test')
 * @returns API Key, , SHA256 
 */
export async function generateApiKey(env: 'live' | 'test' = 'live'): Promise<{
  key: string
  prefix: string
  hash: string
}> {
  // Base62 �?(a-z, A-Z, 0-9)
  const base62Chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

  //  20 �?  const randomBytes = new Uint8Array(20)
  crypto.getRandomValues(randomBytes)

  const randomStr = Array.from(randomBytes)
    .map(byte => base62Chars[byte % base62Chars.length])
    .join('')

  // �?Key
  const key = `tmk_${env}_${randomStr}`

  // （，�?12 ）
  const prefix = key.substring(0, 13) // tmk_live_1a2b

  //  SHA256 
  const hash = await hashApiKey(key)

  return { key, prefix, hash }
}

/**
 *  SHA256 
 * @param key API Key 
 * @returns SHA256  (hex)
 */
export async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(key)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)

  // �?hex �?  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  return hashHex
}

/**
 *  API Key 
 * @param key API Key �? * @returns 
 */
export function isValidApiKeyFormat(key: string): boolean {
  // : tmk_(live|test)_[20base62]
  const pattern = /^tmk_(live|test)_[a-zA-Z0-9]{20}$/
  return pattern.test(key)
}
