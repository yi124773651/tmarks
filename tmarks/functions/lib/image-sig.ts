/**
 * Generate HMAC signature for snapshot image URLs
 */
export async function generateImageSig(
  hash: string,
  userId: string,
  bookmarkId: string,
  secret: string
): Promise<string> {
  const data = `img:${hash}:${userId}:${bookmarkId}`
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  const bytes = new Uint8Array(signature)
  const CHUNK = 8192
  const chunks: string[] = []
  for (let i = 0; i < bytes.length; i += CHUNK) {
    chunks.push(String.fromCharCode(...bytes.subarray(i, i + CHUNK)))
  }
  return btoa(chunks.join(''))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}
