/**
 * 
 *  Base64  R2 
 */

import type { R2Bucket } from '@cloudflare/workers-types'

const R2_UPLOAD_CONCURRENCY = 6

interface ImageInput {
  hash: string
  data: string // base64
  type: string
}

interface DecodedImage {
  hash: string
  bytes: Uint8Array
  type: string
}

/**  Base64 ， charCodeAt */
export function decodeBase64Image(image: ImageInput): DecodedImage | null {
  try {
    const base64Data = image.data.includes(',')
      ? image.data.split(',')[1]
      : image.data
    const binaryString = atob(base64Data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return { hash: image.hash, bytes, type: image.type }
  } catch {
    return null
  }
}

interface UploadResult {
  uploadedHashes: string[]
  totalImageSize: number
}

/**
 *  R2
 *  N  R2_UPLOAD_CONCURRENCY 
 */
export async function uploadImagesConcurrently(
  decoded: DecodedImage[],
  bucket: R2Bucket,
  userId: string,
  bookmarkId: string,
  version: number,
  timestamp: number,
): Promise<UploadResult> {
  const uploadedHashes: string[] = []
  let totalImageSize = 0

  for (let i = 0; i < decoded.length; i += R2_UPLOAD_CONCURRENCY) {
    const batch = decoded.slice(i, i + R2_UPLOAD_CONCURRENCY)
    const results = await Promise.allSettled(
      batch.map(async (img) => {
        const imageKey = `${userId}/${bookmarkId}/v${version}/images/${img.hash}`
        await bucket.put(imageKey, img.bytes, {
          httpMetadata: { contentType: img.type },
          customMetadata: {
            userId,
            bookmarkId,
            version: version.toString(),
            snapshotTimestamp: timestamp.toString(),
          },
        })
        return img
      })
    )

    for (const result of results) {
      if (result.status === 'fulfilled') {
        uploadedHashes.push(result.value.hash)
        totalImageSize += result.value.bytes.length
      } else {
        console.error('[Snapshot Upload] Image upload failed:', result.reason)
      }
    }
  }

  return { uploadedHashes, totalImageSize }
}

/**
 *  HTML  URL
 * ， O(n*m)  replace
 */
export function replaceImagePlaceholders(
  html: string,
  uploadedHashes: string[],
  userId: string,
  bookmarkId: string,
  version: number,
): string {
  if (uploadedHashes.length === 0) return html

  const hashSet = new Set(uploadedHashes)
  // Match all /api/snapshot-images/{hash} placeholders in one pass
  return html.replace(
    /\/api\/snapshot-images\/([a-f0-9]+)/g,
    (match, hash) => {
      if (hashSet.has(hash)) {
        return `/api/snapshot-images/${hash}?u=${userId}&b=${bookmarkId}&v=${version}`
      }
      return match
    }
  )
}
