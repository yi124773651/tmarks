import type { D1Database } from '@cloudflare/workers-types'
import type { Bookmark, BookmarkRow } from '../lib/types'

export async function fetchFullBookmarks(
  db: D1Database,
  rows: BookmarkRow[],
  userId: string
): Promise<Bookmark[]> {
  const bookmarkIds = rows.map(r => r.id)
  if (bookmarkIds.length === 0) return []

  // Fetch all tag relations for these bookmarks
  const { results: tagRelations } = await db
    .prepare(
      `SELECT bt.bookmark_id, t.id, t.name, t.color
       FROM bookmark_tags bt
       JOIN tags t ON bt.tag_id = t.id
       WHERE bt.bookmark_id IN (${bookmarkIds.map(() => '?').join(',')}) AND bt.user_id = ?`
    )
    .bind(...bookmarkIds, userId)
    .all<{ bookmark_id: string; id: string; name: string; color: string }>()

  // Assemble final results
  return rows.map(row => {
    const tags = tagRelations
      .filter(tr => tr.bookmark_id === row.id)
      .map(tr => ({
        id: tr.id,
        name: tr.name,
        color: tr.color,
      }))

    return {
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      url: row.url,
      description: row.description,
      cover_image: row.cover_image,
      favicon: row.favicon,
      is_pinned: Boolean(row.is_pinned),
      is_archived: Boolean(row.is_archived),
      is_public: Boolean(row.is_public),
      click_count: row.click_count,
      last_clicked_at: row.last_clicked_at,
      has_snapshot: row.has_snapshot,
      latest_snapshot_at: row.latest_snapshot_at,
      snapshot_count: row.snapshot_count,
      created_at: row.created_at,
      updated_at: row.updated_at,
      deleted_at: row.deleted_at,
      tags,
    }
  })
}
