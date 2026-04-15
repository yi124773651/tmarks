import type { Env } from './types'
import type { D1Database } from '@cloudflare/workers-types'

/**
 * R2 
 *
 * ： R2 （ + ）�?
 * ：�?D1 �?bookmark_snapshots.file_size �?bookmark_images.file_size �?
 */

// ： <= 0 「�?
type UsageRow = {
  total: number | null
}

/**
 * �?R2 （�?
 *
 * �?
 * - �?/ : 「�?
 * - : 「�?
 * - <= 0: 「�?
 * - > 0: �?
 */
export function getR2MaxTotalBytes(env: Env): number {
  const raw = env.R2_MAX_TOTAL_BYTES

  if (!raw || raw.trim() === '') {
    return Number.POSITIVE_INFINITY
  }

  const parsed = Number(raw)

  if (!Number.isFinite(parsed)) {
    console.warn('[StorageQuota] Invalid R2_MAX_TOTAL_BYTES, treating as unlimited', raw)
    return Number.POSITIVE_INFINITY
  }

  if (parsed <= 0) {
    return Number.POSITIVE_INFINITY
  }

  return parsed
}

/**
 * �?R2 （）
 *
 * �?
 * - bookmark_snapshots.file_size：�?HTML +（ V2 ）�?
 * - bookmark_images.file_size：（ image_hash �?
 */
export async function getCurrentR2UsageBytes(db: D1Database): Promise<number> {
  const snapshotRow = await db
    .prepare('SELECT COALESCE(SUM(file_size), 0) AS total FROM bookmark_snapshots')
    .first<UsageRow>()

  const snapshotsTotal = snapshotRow?.total ?? 0

  let imagesTotal = 0
  try {
    const imageRow = await db
      .prepare('SELECT COALESCE(SUM(file_size), 0) AS total FROM bookmark_images')
      .first<UsageRow>()

    imagesTotal = imageRow?.total ?? 0
  } catch (error) {
    console.warn('[StorageQuota] Failed to query bookmark_images usage', error)
  }

  return snapshotsTotal + imagesTotal
}

export interface R2QuotaCheckResult {
  allowed: boolean
  limitBytes: number
  usedBytes: number
}

/**
 *  additionalBytes ，�?
 */
export async function checkR2Quota(
  db: D1Database,
  env: Env,
  additionalBytes: number
): Promise<R2QuotaCheckResult> {
  const limitBytes = getR2MaxTotalBytes(env)

  // ：�?D1 ，�?
  if (!Number.isFinite(limitBytes)) {
    return { allowed: true, limitBytes, usedBytes: 0 }
  }

  const usedBytes = await getCurrentR2UsageBytes(db)
  const willUse = usedBytes + Math.max(0, additionalBytes)

  if (willUse > limitBytes) {
    return { allowed: false, limitBytes, usedBytes }
  }

  return { allowed: true, limitBytes, usedBytes }
}
