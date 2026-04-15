/**
 *  API
 * : /api/tab/bookmarks/:id/snapshots/:snapshotId
 * : API Key (X-API-Key header)
 */

import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env } from '../../../../../lib/types'
import { success, notFound, internalError } from '../../../../../lib/response'
import { requireApiKeyAuth, ApiKeyAuthContext } from '../../../../../middleware/api-key-auth-pages'

// GET /api/tab/bookmarks/:id/snapshots/:snapshotId - 
export const onRequestGet: PagesFunction<Env, 'id' | 'snapshotId', ApiKeyAuthContext>[] = [
  requireApiKeyAuth('bookmarks.read'),
  async (context) => {
    try {
      const userId = context.data.user_id
      const bookmarkId = context.params.id as string
      const snapshotId = context.params.snapshotId as string
      const db = context.env.DB
      const bucket = context.env.SNAPSHOTS_BUCKET

      if (!bucket) {
        return internalError('Storage not configured')
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
      
      //  data URL （）
      const dataUrlCount = (htmlContent.match(/src="data:/g) || []).length
      const htmlSize = new Blob([htmlContent]).size
      console.log(`[Snapshot API] Retrieved from R2: ${(htmlSize / 1024).toFixed(1)}KB, data URLs: ${dataUrlCount}`)

      //  CSP meta  HTML head （）
      const cspMetaTag = '<meta http-equiv="Content-Security-Policy" content="default-src * \'unsafe-inline\' \'unsafe-eval\' data: blob:; img-src * data: blob:; font-src * data:; style-src * \'unsafe-inline\'; script-src * \'unsafe-inline\' \'unsafe-eval\'; frame-src *; connect-src *;">';
      if (htmlContent.includes('<head>')) {
        htmlContent = htmlContent.replace('<head>', `<head>${cspMetaTag}`);
        console.log(`[Snapshot API] Injected CSP meta tag`);
      } else if (htmlContent.includes('<HEAD>')) {
        htmlContent = htmlContent.replace('<HEAD>', `<HEAD>${cspMetaTag}`);
        console.log(`[Snapshot API] Injected CSP meta tag`);
      }

      //  V2 （ /api/snapshot-images/ ）
      const isV2 = htmlContent.includes('/api/snapshot-images/')
      
      if (isV2) {
        const version = (snapshot as Record<string, unknown>).version as number || 1
        
        //  URL： URL，
        let replacedCount = 0
        htmlContent = htmlContent.replace(
          /\/api\/snapshot-images\/([a-zA-Z0-9._-]+?)(?:\?[^"\s)]*)?(?=["\s)]|$)/g,
          (_match: string, hash: string) => {
            replacedCount++
            // ，（）
            return `/api/snapshot-images/${hash}?u=${userId}&b=${bookmarkId}&v=${version}`;
          }
        )
        console.log(`[Snapshot API] V2 format detected, normalized ${replacedCount} image URLs`)
      }

      return new Response(htmlContent, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
          'X-Content-Type-Options': 'nosniff',
          //  CSP （）
          'Content-Security-Policy': "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; img-src * data: blob:; font-src * data:; style-src * 'unsafe-inline'; script-src * 'unsafe-inline' 'unsafe-eval'; frame-src *; connect-src *;",
        },
      })
    } catch (error) {
      console.error('Get snapshot error:', error)
      return internalError('Failed to get snapshot')
    }
  },
]

// DELETE /api/tab/bookmarks/:id/snapshots/:snapshotId - 
export const onRequestDelete: PagesFunction<Env, 'id' | 'snapshotId', ApiKeyAuthContext>[] = [
  requireApiKeyAuth('bookmarks.delete'),
  async (context) => {
    const userId = context.data.user_id
    const bookmarkId = context.params.id as string
    const snapshotId = context.params.snapshotId as string

    try {
      const db = context.env.DB
      const bucket = context.env.SNAPSHOTS_BUCKET

      if (!bucket) {
        return internalError('Storage not configured')
      }

      // 
      const snapshot = await db
        .prepare(
          `SELECT id, r2_key, is_latest
           FROM bookmark_snapshots
           WHERE id = ? AND bookmark_id = ? AND user_id = ?`
        )
        .bind(snapshotId, bookmarkId, userId)
        .first()

      if (!snapshot) {
        return notFound('Snapshot not found')
      }

      //  R2 
      await bucket.delete(snapshot.r2_key as string)

      // 
      await db
        .prepare('DELETE FROM bookmark_snapshots WHERE id = ?')
        .bind(snapshotId)
        .run()

      // （1）
      await db
        .prepare(
          `UPDATE bookmarks 
           SET snapshot_count = MAX(0, snapshot_count - 1)
           WHERE id = ?`
        )
        .bind(bookmarkId)
        .run()

      // ，
      if (snapshot.is_latest) {
        const nextLatest = await db
          .prepare(
            `SELECT id FROM bookmark_snapshots
             WHERE bookmark_id = ? AND user_id = ?
             ORDER BY version DESC
             LIMIT 1`
          )
          .bind(bookmarkId, userId)
          .first()

        if (nextLatest) {
          await db
            .prepare(
              `UPDATE bookmark_snapshots 
               SET is_latest = 1 
               WHERE id = ?`
            )
            .bind(nextLatest.id)
            .run()
        } else {
          // ，
          await db
            .prepare(
              `UPDATE bookmarks 
               SET has_snapshot = 0, 
                   latest_snapshot_at = NULL,
                   snapshot_count = 0
               WHERE id = ?`
            )
            .bind(bookmarkId)
            .run()
        }
      }

      return success({ message: 'Snapshot deleted successfully' })
    } catch (error) {
      console.error('Delete snapshot error:', error)
      return internalError('Failed to delete snapshot')
    }
  },
]
