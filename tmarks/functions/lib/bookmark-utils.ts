import type { Bookmark, BookmarkRow } from './types'

/**
 *  Bookmark 
 *  SQLite �?0/1 �?boolean �?
 */
export function normalizeBookmark(row: BookmarkRow): Bookmark {
  return {
    ...row,
    is_pinned: Boolean(row.is_pinned),
    is_archived: Boolean(row.is_archived),
    is_public: Boolean(row.is_public),
    click_count: Number(row.click_count || 0),
    has_snapshot: Boolean(row.has_snapshot),
    snapshot_count: Number(row.snapshot_count || 0),
  }
}
