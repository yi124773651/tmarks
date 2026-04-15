import type { D1Database } from '@cloudflare/workers-types'
import type { Bookmark, BookmarkRow } from '../lib/types'

export async function fetchFullBookmarks(
  db: D1Database,
  rows: BookmarkRow[],
  userId: string
): Promise<Bookmark[]> {
  const bookmarkIds = rows.map(r => r.id)
  if (bookmarkIds.length === 0) return []

  // 获取这些书签的所有标签关联
  const { results: tagRelations } = await db
    .prepare(
      `SELECT bt.bookmark_id, t.id, t.name, t.color
       FROM bookmark_tags bt
       JOIN tags t ON bt.tag_id = t.id
       WHERE bt.bookmark_id IN (${bookmarkIds.map(() => '?').join(',')}) AND bt.user_id = ?`
    )
    .bind(...bookmarkIds, userId)
    .all<{ bookmark_id: string; id: string; name: string; color: string }>()

  // 组装最终结果
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
      title: row.title,
      url: row.url,
      description: row.description,
      ai_summary: row.ai_summary,
      thumbnail_url: row.thumbnail_url,
      favicon_url: row.favicon_url,
      is_public: Boolean(row.is_public),
      created_at: row.created_at,
      updated_at: row.updated_at,
      tags,
    }
  })
}
