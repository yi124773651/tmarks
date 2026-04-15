/**
 * 密码哈希和验�?
 * 注意: Cloudflare Workers 不支�?Argon2id，这里使�?PBKDF2 作为替代
 * PBKDF2 �?NIST 推荐的密码哈希算法，安全性足�?
 */

const PBKDF2_ITERATIONS = 100000 // OWASP 推荐最小�?
const SALT_LENGTH = 16
const HASH_LENGTH = 32

/**
 * 哈希密码
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)

  // 生成随机�?
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))

  // 导入密码为密钥材�?
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  )

  // 使用 PBKDF2 派生密钥
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    HASH_LENGTH * 8
  )

  // 组合盐和哈希�?
  const hash = new Uint8Array(hashBuffer)
  const result = new Uint8Array(salt.length + hash.length)
  result.set(salt, 0)
  result.set(hash, salt.length)

  // 转换�?base64
  return `pbkdf2_sha256:${PBKDF2_ITERATIONS}:${arrayBufferToBase64(result)}`
}

/**
 * 验证密码
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const parts = hash.split(':')
    if (parts.length !== 3 || parts[0] !== 'pbkdf2_sha256') {
      return false
    }

    const iterations = parseInt(parts[1], 10)
    const storedHash = base64ToArrayBuffer(parts[2])

    // 提取盐和哈希
    const salt = storedHash.slice(0, SALT_LENGTH)
    const originalHash = storedHash.slice(SALT_LENGTH)

    // 使用相同的盐计算哈希
    const encoder = new TextEncoder()
    const passwordBuffer = encoder.encode(password)

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits']
    )

    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      HASH_LENGTH * 8
    )

    const computedHash = new Uint8Array(hashBuffer)

    // 时间恒定比较
    return timingSafeEqual(originalHash, computedHash)
  } catch {
    return false
  }
}

/**
 * 生成随机令牌
 */
export function generateToken(length: number = 32): string {
  const array = crypto.getRandomValues(new Uint8Array(length))
  return arrayBufferToBase64(array)
}

/**
 * 哈希刷新令牌（用于存储）
 */
export async function hashRefreshToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return arrayBufferToBase64(new Uint8Array(hashBuffer))
}

/**
 * 生成 UUID v4（标准格式，36 字符�?
 */
export function generateUUID(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40 // Version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // Variant 10

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/**
 * 生成�?UUID�?2 字符，Base64 编码�?
 * 与标�?UUID 安全性相同，但更短，适合 URL
 */
export function generateShortUUID(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40 // Version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // Variant 10
  
  // Base64 URL 编码（移�?padding�?
  const binary = Array.from(bytes, b => String.fromCharCode(b)).join('')
  const base64 = btoa(binary)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * 生成 NanoID（默�?21 字符，URL 安全�?
 * 推荐用于公开 URL 中的 ID，比 UUID 更短更美�?
 */
export function generateNanoId(length: number = 21): string {
  // 使用 URL 安全的字符集�?4 个字符）
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-'
  const randomValues = new Uint8Array(length)
  crypto.getRandomValues(randomValues)
  
  let id = ''
  for (let i = 0; i < length; i++) {
    id += alphabet[randomValues[i] % alphabet.length]
  }
  return id
}

/**
 * 时间恒定比较（防止时序攻击）
 */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i]
  }

  return result === 0
}

/**
 * ArrayBuffer �?Base64
 */
function arrayBufferToBase64(buffer: Uint8Array): string {
  const binary = Array.from(buffer, (byte) => String.fromCharCode(byte)).join('')
  return btoa(binary)
}

/**
 * Base64 �?ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}
