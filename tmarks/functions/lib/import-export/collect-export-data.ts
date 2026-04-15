import type {
  TMarksExportData,
  ExportBookmark,
  ExportTag,
  ExportUser,
  ExportTabGroup,
  ExportTabGroupItem,
} from '../../../shared/import-export-types'
import { EXPORT_VERSION } from '../../../shared/import-export-types'
import type { ExportScope } from './export-scope'

const DEFAULT_TAG_COLOR = '#3b82f6'

function parseMaybeJsonStringArray(raw: unknown): string[] | undefined {
  if (raw == null) return undefined
  if (Array.isArray(raw)) return raw.map(String)
  if (typeof raw !== 'string') return undefined
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.map(String)
    return undefined
  } catch {
    return undefined
  }
}

async function collectUser(db: D1Database, userId: string): Promise<ExportUser> {
  interface UserRow {
    id: string
    email: string | null
    username: string
    created_at: string
  }

  if (userId === 'default-user') {
    return {
      id: 'default-user',
      email: 'default@tmarks.local',
      name: 'Default User',
      created_at: new Date().toISOString(),
    }
  }

  const { results: users } = await db
    .prepare('SELECT id, email, username, created_at FROM users WHERE id = ?')
    .bind(userId)
    .all<UserRow>()

  const foundUser = users?.[0]
  if (!foundUser) throw new Error('User not found')

  return {
    id: foundUser.id,
    email: foundUser.email ?? '',
    name: foundUser.username,
    created_at: foundUser.created_at,
  }
}

async function collectBookmarksAndTags(
  db: D1Database,
  userId: string,
  includeDeleted: boolean
): Promise<{ bookmarks: ExportBookmark[]; tags: ExportTag[] }> {
  const bookmarkWhere = includeDeleted ? 'user_id = ?' : 'user_id = ? AND deleted_at IS NULL'
  const tagWhere = includeDeleted ? 'user_id = ?' : 'user_id = ? AND deleted_at IS NULL'

  const { results: bookmarks } = await db
    .prepare(
      `
      SELECT
        id, title, url, description, cover_image, cover_image_id, favicon,
        is_pinned, is_archived, is_public,
        click_count, last_clicked_at,
        has_snapshot, latest_snapshot_at, snapshot_count,
        created_at, updated_at, deleted_at
      FROM bookmarks
      WHERE ${bookmarkWhere}
      ORDER BY created_at DESC
    `
    )
    .bind(userId)
    .all()

  const { results: tags } = await db
    .prepare(
      `
      SELECT
        id, name, color, click_count, last_clicked_at, created_at, updated_at, deleted_at
      FROM tags
      WHERE ${tagWhere}
      ORDER BY name ASC
    `
    )
    .bind(userId)
    .all()

  const bookmarkTagSql = includeDeleted
    ? `
      SELECT bt.bookmark_id, bt.tag_id, t.name as tag_name
      FROM bookmark_tags bt
      JOIN tags t ON bt.tag_id = t.id
      WHERE bt.user_id = ?
    `
    : `
      SELECT bt.bookmark_id, bt.tag_id, t.name as tag_name
      FROM bookmark_tags bt
      JOIN tags t ON bt.tag_id = t.id
      JOIN bookmarks b ON bt.bookmark_id = b.id
      WHERE bt.user_id = ? AND t.deleted_at IS NULL AND b.deleted_at IS NULL
    `

  const { results: bookmarkTags } = await db.prepare(bookmarkTagSql).bind(userId).all()

  const bookmarkTagMap = new Map<string, string[]>()
  const tagCountMap = new Map<string, number>()

  bookmarkTags?.forEach((bt: Record<string, unknown>) => {
    const bookmarkId = String(bt.bookmark_id)
    const tagName = String(bt.tag_name)
    const list = bookmarkTagMap.get(bookmarkId) ?? []
    list.push(tagName)
    bookmarkTagMap.set(bookmarkId, list)
  })

  // Compute bookmark_count per tag name
  for (const tagList of bookmarkTagMap.values()) {
    for (const tagName of tagList) {
      tagCountMap.set(tagName, (tagCountMap.get(tagName) ?? 0) + 1)
    }
  }

  const exportBookmarks: ExportBookmark[] = (bookmarks || []).map((bookmark: Record<string, unknown>) => ({
    id: String(bookmark.id),
    title: String(bookmark.title),
    url: String(bookmark.url),
    description: (bookmark.description ?? null) as string | null,
    cover_image: (bookmark.cover_image ?? null) as string | null,
    cover_image_id: (bookmark.cover_image_id ?? null) as string | null,
    favicon: (bookmark.favicon ?? null) as string | null,
    tags: bookmarkTagMap.get(String(bookmark.id)) || [],
    is_pinned: Boolean(bookmark.is_pinned),
    is_archived: Boolean(bookmark.is_archived),
    is_public: Boolean(bookmark.is_public),
    click_count: Number(bookmark.click_count ?? 0),
    last_clicked_at: (bookmark.last_clicked_at ?? null) as string | null,
    has_snapshot: Boolean(bookmark.has_snapshot),
    latest_snapshot_at: (bookmark.latest_snapshot_at ?? null) as string | null,
    snapshot_count: Number(bookmark.snapshot_count ?? 0),
    created_at: String(bookmark.created_at),
    updated_at: String(bookmark.updated_at),
    deleted_at: (bookmark.deleted_at ?? null) as string | null,
  }))

  const exportTags: ExportTag[] = (tags || []).map((tag: Record<string, unknown>) => ({
    id: String(tag.id),
    name: String(tag.name),
    color: (tag.color == null || tag.color === '') ? DEFAULT_TAG_COLOR : String(tag.color),
    click_count: Number(tag.click_count ?? 0),
    last_clicked_at: (tag.last_clicked_at ?? null) as string | null,
    created_at: String(tag.created_at),
    updated_at: String(tag.updated_at),
    deleted_at: (tag.deleted_at ?? null) as string | null,
    bookmark_count: tagCountMap.get(String(tag.name)) ?? 0,
  }))

  return { bookmarks: exportBookmarks, tags: exportTags }
}

async function collectTabGroups(
  db: D1Database,
  userId: string,
  includeDeleted: boolean
): Promise<ExportTabGroup[]> {
  const where = includeDeleted ? 'user_id = ?' : 'user_id = ? AND is_deleted = 0'

  const { results: tabGroups } = await db
    .prepare(
      `
      SELECT
        id, title, parent_id, is_folder, position, color, tags,
        is_deleted, deleted_at, created_at, updated_at
      FROM tab_groups
      WHERE ${where}
      ORDER BY position ASC
    `
    )
    .bind(userId)
    .all()

  const { results: tabGroupItems } = await db
    .prepare(
      `
      SELECT tgi.id, tgi.group_id, tgi.title, tgi.url, tgi.favicon, tgi.position,
             tgi.is_pinned, tgi.is_todo, tgi.is_archived, tgi.created_at
      FROM tab_group_items tgi
      JOIN tab_groups tg ON tgi.group_id = tg.id
      WHERE tg.user_id = ? ${includeDeleted ? '' : 'AND tg.is_deleted = 0'}
      ORDER BY tgi.position ASC
    `
    )
    .bind(userId)
    .all()

  const groupItemsMap = new Map<string, ExportTabGroupItem[]>()
  tabGroupItems?.forEach((item: Record<string, unknown>) => {
    const groupId = String(item.group_id)
    const list = groupItemsMap.get(groupId) ?? []
    list.push({
      id: String(item.id),
      title: String(item.title),
      url: String(item.url),
      favicon: item.favicon ? String(item.favicon) : undefined,
      position: Number(item.position),
      is_pinned: Boolean(item.is_pinned),
      is_todo: Boolean(item.is_todo),
      is_archived: Boolean(item.is_archived),
      created_at: String(item.created_at),
    })
    groupItemsMap.set(groupId, list)
  })

  return (tabGroups || []).map((group: Record<string, unknown>) => ({
    id: String(group.id),
    title: String(group.title),
    parent_id: group.parent_id ? String(group.parent_id) : undefined,
    is_folder: Boolean(group.is_folder),
    position: Number(group.position),
    color: group.color ? String(group.color) : undefined,
    tags: parseMaybeJsonStringArray(group.tags),
    is_deleted: Boolean(group.is_deleted),
    deleted_at: group.deleted_at ? String(group.deleted_at) : undefined,
    created_at: String(group.created_at),
    updated_at: String(group.updated_at),
    items: groupItemsMap.get(String(group.id)) || [],
  }))
}

export async function collectExportData(
  db: D1Database,
  userId: string,
  scope: ExportScope,
  includeDeleted: boolean
): Promise<TMarksExportData> {
  const exportedAt = new Date().toISOString()
  const user = await collectUser(db, userId)

  const shouldBookmarks = scope === 'all' || scope === 'bookmarks'
  const shouldTabGroups = scope === 'all' || scope === 'tab_groups'

  const [{ bookmarks, tags }, tab_groups] = await Promise.all([
    shouldBookmarks ? collectBookmarksAndTags(db, userId, includeDeleted) : Promise.resolve({ bookmarks: [], tags: [] }),
    shouldTabGroups ? collectTabGroups(db, userId, includeDeleted) : Promise.resolve([] as ExportTabGroup[]),
  ])

  return {
    version: EXPORT_VERSION,
    format: 'tmarks' as const,
    exported_at: exportedAt,
    user,
    bookmarks,
    tags,
    tab_groups,
    metadata: {
      total_bookmarks: bookmarks.length,
      total_tags: tags.length,
      total_tab_groups: tab_groups.length,
      export_format: 'json',
      source: 'tmarks',
    },
  }
}
