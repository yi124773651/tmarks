import { generateUUID } from './crypto'

function normalizeTagNames(tagNames: string[]): string[] {
  const seen = new Set<string>()
  const normalized: string[] = []

  for (const rawName of tagNames) {
    const name = rawName.trim()
    if (!name) continue

    const key = name.toLowerCase()
    if (seen.has(key)) continue

    seen.add(key)
    normalized.push(name)
  }

  return normalized
}

function uniqueTagIds(tagIds: string[]): string[] {
  const seen = new Set<string>()
  const uniqueIds: string[] = []

  for (const rawId of tagIds) {
    const tagId = rawId.trim()
    if (!tagId || seen.has(tagId)) continue

    seen.add(tagId)
    uniqueIds.push(tagId)
  }

  return uniqueIds
}

export async function getValidTagIds(
  db: D1Database,
  userId: string,
  tagIds: string[]
): Promise<string[]> {
  const requestedIds = uniqueTagIds(tagIds)
  if (requestedIds.length === 0) return []

  const placeholders = requestedIds.map(() => '?').join(',')
  const { results } = await db.prepare(
    `SELECT id
     FROM tags
     WHERE id IN (${placeholders}) AND user_id = ? AND deleted_at IS NULL`
  )
    .bind(...requestedIds, userId)
    .all<{ id: string }>()

  const validIds = new Set((results || []).map((row) => row.id))
  return requestedIds.filter((tagId) => validIds.has(tagId))
}

export async function resolveOrCreateTagIds(
  db: D1Database,
  userId: string,
  tagNames: string[],
  now: string = new Date().toISOString()
): Promise<string[]> {
  const normalizedNames = normalizeTagNames(tagNames)
  if (normalizedNames.length === 0) return []

  const placeholders = normalizedNames.map(() => '?').join(',')
  const { results: existingTags } = await db.prepare(
    `SELECT id, name
     FROM tags
     WHERE user_id = ? AND LOWER(name) IN (${placeholders}) AND deleted_at IS NULL`
  )
    .bind(userId, ...normalizedNames.map((name) => name.toLowerCase()))
    .all<{ id: string; name: string }>()

  const tagMap = new Map<string, string>()
  for (const tag of existingTags || []) {
    tagMap.set(tag.name.toLowerCase(), tag.id)
  }

  const tagsToCreate = normalizedNames.filter((name) => !tagMap.has(name.toLowerCase()))
  if (tagsToCreate.length > 0) {
    const insertStatements = tagsToCreate.map((name) => {
      const tagId = generateUUID()
      tagMap.set(name.toLowerCase(), tagId)
      return db
        .prepare('INSERT INTO tags (id, user_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
        .bind(tagId, userId, name, now, now)
    })
    await db.batch(insertStatements)
  }

  return normalizedNames
    .map((name) => tagMap.get(name.toLowerCase()))
    .filter((tagId): tagId is string => Boolean(tagId))
}

export async function createOrLinkTags(
  db: D1Database,
  bookmarkId: string,
  tagNames: string[],
  userId: string
): Promise<void> {
  const now = new Date().toISOString()
  const tagIds = await resolveOrCreateTagIds(db, userId, tagNames, now)
  if (tagIds.length === 0) return

  const linkStatements = tagIds.map((tagId) =>
    db
      .prepare('INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag_id, user_id, created_at) VALUES (?, ?, ?, ?)')
      .bind(bookmarkId, tagId, userId, now)
  )
  await db.batch(linkStatements)
}

export async function replaceBookmarkTags(
  db: D1Database,
  bookmarkId: string,
  userId: string,
  tagIds: string[],
  now: string = new Date().toISOString()
): Promise<void> {
  const normalizedIds = uniqueTagIds(tagIds)
  const statements: D1PreparedStatement[] = [
    db.prepare('DELETE FROM bookmark_tags WHERE bookmark_id = ? AND user_id = ?')
      .bind(bookmarkId, userId),
  ]

  for (const tagId of normalizedIds) {
    statements.push(
      db
        .prepare('INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag_id, user_id, created_at) VALUES (?, ?, ?, ?)')
        .bind(bookmarkId, tagId, userId, now)
    )
  }

  await db.batch(statements)
}

export async function replaceBookmarkTagsByNames(
  db: D1Database,
  bookmarkId: string,
  tagNames: string[],
  userId: string,
  now: string = new Date().toISOString()
): Promise<void> {
  const tagIds = await resolveOrCreateTagIds(db, userId, tagNames, now)
  await replaceBookmarkTags(db, bookmarkId, userId, tagIds, now)
}
