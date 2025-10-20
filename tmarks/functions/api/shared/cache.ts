import type { Env } from '../../lib/types'

const CACHE_PREFIX = 'public-share:'

export async function invalidatePublicShareCache(env: Env, userId: string) {
  if (!env.PUBLIC_SHARE_KV) {
    return
  }

  const record = await env.DB.prepare(
    `SELECT public_slug FROM users WHERE id = ? AND public_share_enabled = 1`
  )
    .bind(userId)
    .first<{ public_slug: string | null }>()

  if (!record?.public_slug) {
    return
  }

  const key = `${CACHE_PREFIX}${record.public_slug.toLowerCase()}`
  await env.PUBLIC_SHARE_KV.delete(key)
}
