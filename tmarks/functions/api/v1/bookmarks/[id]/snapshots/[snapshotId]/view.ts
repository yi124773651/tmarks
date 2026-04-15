/**
 *  API -  URL
 * : /api/v1/bookmarks/:id/snapshots/:snapshotId/view
 * :  URL（ JWT Token）
 */

import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env } from '../../../../../../lib/types'
import { unauthorized, notFound, internalError } from '../../../../../../lib/response'
import { verifySignedUrl, extractSignedParams } from '../../../../../../lib/signed-url'
import { generateImageSig } from '../../../../../../lib/image-sig'

// GET /api/v1/bookmarks/:id/snapshots/:snapshotId/view -  URL 
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const bookmarkId = context.params.id as string
    const snapshotId = context.params.snapshotId as string
    const db = context.env.DB
    const bucket = context.env.SNAPSHOTS_BUCKET
    if (!bucket) {
      return internalError('Storage not configured')
    }

    // 
    const { signature, expires, userId, action } = extractSignedParams(context.request as unknown as Request)

    if (!signature || !expires || !userId) {
      return unauthorized('Missing signature parameters')
    }

    // 
    const verification = await verifySignedUrl(
      signature,
      expires,
      userId,
      snapshotId,
      context.env.JWT_SECRET,
      action || undefined
    )

    if (!verification.valid) {
      return unauthorized(verification.error || 'Invalid signature')
    }

    // 
    const snapshot = await db
      .prepare(
        `SELECT s.*, b.url as bookmark_url
         FROM bookmark_snapshots s
         JOIN bookmarks b ON s.bookmark_id = b.id
         WHERE s.id = ? AND s.bookmark_id = ? AND s.user_id = ?`
      )
      .bind(snapshotId, bookmarkId, userId)
      .first()

    if (!snapshot) {
      return notFound('Snapshot not found')
    }

    //  R2 
    const r2Object = await bucket.get(snapshot.r2_key as string)

    if (!r2Object) {
      return notFound('Snapshot file not found')
    }

    //  HTML 
    let htmlContent = await r2Object.text()
    
    const htmlSize = new Blob([htmlContent]).size
    console.log(`[Snapshot View API] Retrieved from R2: ${(htmlSize / 1024).toFixed(1)}KB`)

    //  V2 （ /api/snapshot-images/ ）
    const isV2 = htmlContent.includes('/api/snapshot-images/')
    
    if (isV2) {
      const version = (snapshot as Record<string, unknown>).version as number || 1
      
      //  hash 
      const imgUrlRegex = /\/api\/snapshot-images\/([a-zA-Z0-9._-]+?)(?:\?[^"\s)]*)?(?=["\s)]|$)/g
      const matches = Array.from(htmlContent.matchAll(imgUrlRegex))
      const uniqueHashes = [...new Set(matches.map(m => m[1]).filter(h => h.length <= 128))]
      
      // 
      const sigMap = new Map<string, string>()
      for (const hash of uniqueHashes) {
        sigMap.set(hash, await generateImageSig(hash, userId, bookmarkId, context.env.JWT_SECRET))
      }
      
      let replacedCount = 0
      htmlContent = htmlContent.replace(imgUrlRegex, (_match: string, hash: string) => {
        replacedCount++
        const sig = sigMap.get(hash) || ''
        return `/api/snapshot-images/${hash}?u=${userId}&b=${bookmarkId}&v=${version}&sig=${sig}`
      })
      console.log(`[Snapshot View API] V2 format: normalized ${replacedCount} image URLs with signatures`)
    }

    return new Response(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
        //  CSP ：，
        'Content-Security-Policy': "default-src 'none'; img-src * data: blob:; style-src 'unsafe-inline' *; font-src * data:; frame-src 'none'; script-src 'none'; connect-src 'none';",
        //  X-Frame-Options  iframe 
        'X-Frame-Options': 'DENY',
      },
    })
  } catch (error) {
    console.error('[Snapshot View API] Error:', error)
    return internalError('Failed to get snapshot')
  }
}
