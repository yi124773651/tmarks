/**
 * 书签快照 API
 * 路径: /api/v1/bookmarks/:id/snapshots
 * 认证: JWT Token
 */

import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env } from '../../../../lib/types'
import { success, badRequest, notFound, internalError, forbidden } from '../../../../lib/response'
import { requireAuth, AuthContext } from '../../../../middleware/auth'
import { nanoid } from 'nanoid'

// 使用 Web Crypto API 计算 SHA-256 哈希
async function sha256(content: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(content)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

interface CreateSnapshotRequest {
  html_content: string
  title: string
  url: string
  force?: boolean
}

// GET /api/v1/bookmarks/:id/snapshots - 获取快照列表
export const onRequestGet: PagesFunction<Env, 'id', AuthContext>[] = [
  requireAuth,
  async (context) => {
    const userId = context.data.user_id
    const bookmarkId = context.params.id

    try {
      const db = context.env.DB

      // 验证书签所有权
      const bookmark = await db
        .prepare('SELECT id FROM bookmarks WHERE id = ? AND user_id = ? AND deleted_at IS NULL')
        .bind(bookmarkId, userId)
        .first()

      if (!bookmark) {
        return notFound('Bookmark not found')
      }

      // 获取快照列表
      const snapshots = await db
        .prepare(
          `SELECT id, version, file_size, content_hash, snapshot_title, 
                  is_latest, created_at
           FROM bookmark_snapshots
           WHERE bookmark_id = ? AND user_id = ?
           ORDER BY version DESC`
        )
        .bind(bookmarkId, userId)
        .all()

      return success({
        snapshots: snapshots.results || [],
        total: snapshots.results?.length || 0,
      })
    } catch (error) {
      console.error('Get snapshots error:', error)
      return internalError('Failed to get snapshots')
    }
  },
]

// POST /api/v1/bookmarks/:id/snapshots - 创建快照
export const onRequestPost: PagesFunction<Env, 'id', AuthContext>[] = [
  requireAuth,
  async (context) => {
    const userId = context.data.user_id
    const bookmarkId = context.params.id

    try {
      const body = await context.request.json() as CreateSnapshotRequest
      const { html_content, title, url, force = false } = body

      if (!html_content || !title || !url) {
        return badRequest('Missing required fields')
      }

      const db = context.env.DB
      const bucket = context.env.SNAPSHOTS_BUCKET

      if (!bucket) {
        return internalError('Storage not configured')
      }

      // 验证书签所有权
      const bookmark = await db
        .prepare('SELECT id FROM bookmarks WHERE id = ? AND user_id = ? AND deleted_at IS NULL')
        .bind(bookmarkId, userId)
        .first()

      if (!bookmark) {
        return notFound('Bookmark not found')
      }

      // 计算内容哈希
      const contentHash = await sha256(html_content)

      // 检查是否重复（如果启用去重）
      if (!force) {
        const latestSnapshot = await db
          .prepare(
            `SELECT content_hash FROM bookmark_snapshots
             WHERE bookmark_id = ? AND is_latest = 1`
          )
          .bind(bookmarkId)
          .first()

        if (latestSnapshot && latestSnapshot.content_hash === contentHash) {
          return success({
            message: 'Content unchanged, no new snapshot created',
            is_duplicate: true,
          })
        }
      }

      // 获取下一个版本号
      const versionResult = await db
        .prepare(
          `SELECT COALESCE(MAX(version), 0) + 1 as next_version
           FROM bookmark_snapshots
           WHERE bookmark_id = ?`
        )
        .bind(bookmarkId)
        .first()

      const version = versionResult?.next_version as number || 1

      // 生成 R2 键
      const timestamp = Date.now()
      const r2Key = `${userId}/${bookmarkId}/snapshot-${timestamp}-v${version}.html`

      // 上传到 R2
      await bucket.put(r2Key, html_content, {
        httpMetadata: {
          contentType: 'text/html; charset=utf-8',
        },
        customMetadata: {
          userId,
          bookmarkId,
          version: version.toString(),
          title,
        },
      })

      const fileSize = new Blob([html_content]).size
      const snapshotId = nanoid()
      const now = new Date().toISOString()

      // 开始事务
      const batch = [
        // 插入新快照
        db.prepare(
          `INSERT INTO bookmark_snapshots 
           (id, bookmark_id, user_id, version, is_latest, content_hash, 
            r2_key, r2_bucket, file_size, mime_type, snapshot_url, 
            snapshot_title, snapshot_status, created_at, updated_at)
           VALUES (?, ?, ?, ?, 1, ?, ?, 'tmarks-snapshots', ?, 'text/html', ?, ?, 'completed', ?, ?)`
        ).bind(
          snapshotId,
          bookmarkId,
          userId,
          version,
          contentHash,
          r2Key,
          fileSize,
          url,
          title,
          now,
          now
        ),

        // 更新旧快照的 is_latest 标志
        db.prepare(
          `UPDATE bookmark_snapshots 
           SET is_latest = 0 
           WHERE bookmark_id = ? AND id != ?`
        ).bind(bookmarkId, snapshotId),

        // 更新书签表
        db.prepare(
          `UPDATE bookmarks 
           SET has_snapshot = 1, latest_snapshot_at = ? 
           WHERE id = ?`
        ).bind(now, bookmarkId),
      ]

      await db.batch(batch)

      // 检查并清理旧快照
      await cleanupOldSnapshots(db, bucket, bookmarkId, userId)

      return success({
        snapshot: {
          id: snapshotId,
          version,
          file_size: fileSize,
          content_hash: contentHash,
          created_at: now,
        },
        message: 'Snapshot created successfully',
      })
    } catch (error) {
      console.error('Create snapshot error:', error)
      return internalError('Failed to create snapshot')
    }
  },
]

// 清理旧快照
async function cleanupOldSnapshots(
  db: D1Database,
  bucket: R2Bucket,
  bookmarkId: string,
  userId: string
) {
  try {
    // 获取保留策略
    const bookmarkSettings = await db
      .prepare('SELECT snapshot_retention_count FROM bookmarks WHERE id = ?')
      .bind(bookmarkId)
      .first()

    const userSettings = await db
      .prepare('SELECT snapshot_retention_count FROM user_preferences WHERE user_id = ?')
      .bind(userId)
      .first()

    const retentionCount =
      (bookmarkSettings?.snapshot_retention_count as number | null) ??
      (userSettings?.snapshot_retention_count as number | null) ??
      5

    // -1 表示无限制
    if (retentionCount === -1) {
      return
    }

    // 获取需要删除的快照
    const toDelete = await db
      .prepare(
        `SELECT id, r2_key
         FROM bookmark_snapshots
         WHERE bookmark_id = ? AND user_id = ?
         ORDER BY version DESC
         LIMIT -1 OFFSET ?`
      )
      .bind(bookmarkId, userId, retentionCount)
      .all()

    if (!toDelete.results || toDelete.results.length === 0) {
      return
    }

    // 删除 R2 文件
    for (const snapshot of toDelete.results) {
      await bucket.delete(snapshot.r2_key as string)
    }

    // 删除数据库记录
    const ids = toDelete.results.map((s) => s.id).join("','")
    await db
      .prepare(`DELETE FROM bookmark_snapshots WHERE id IN ('${ids}')`)
      .run()
  } catch (error) {
    console.error('Cleanup snapshots error:', error)
  }
}
