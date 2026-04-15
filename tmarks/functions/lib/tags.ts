import { generateUUID } from './crypto'
/**
 * 
 * 、
 * 
 * @param db - D1 �?
 * @param bookmarkId -  ID
 * @param tagNames - 
 * @param userId -  ID
 */
export async function createOrLinkTags(
  db: D1Database,
  bookmarkId: string,
  tagNames: string[],
  userId: string
): Promise<void> {
  if (!tagNames || tagNames.length === 0) return
  const now = new Date().toISOString()
  // ：， N+1 
  const trimmedNames = tagNames.map(name => name.trim()).filter(name => name.length > 0)
  if (trimmedNames.length === 0) return
  //  IN 
  const placeholders = trimmedNames.map(() => '?').join(',')
  const { results: existingTags } = await db
    .prepare(`SELECT id, name FROM tags WHERE user_id = ? AND LOWER(name) IN (${placeholders}) AND deleted_at IS NULL`)
    .bind(userId, ...trimmedNames.map(name => name.toLowerCase()))
    .all<{ id: string; name: string }>()
  // �?ID （�?
  const tagMap = new Map<string, string>()
  for (const tag of existingTags || []) {
    tagMap.set(tag.name.toLowerCase(), tag.id)
  }
  // �?
  const tagsToCreate = trimmedNames.filter(name => !tagMap.has(name.toLowerCase()))
  // �?
  if (tagsToCreate.length > 0) {
    // （D1 �?
    const insertStatements = tagsToCreate.map(name => {
      const tagId = generateUUID()
      tagMap.set(name.toLowerCase(), tagId)
      return db
        .prepare('INSERT INTO tags (id, user_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
        .bind(tagId, userId, name, now, now)
    })
    await db.batch(insertStatements)
  }
  // �?
  const linkStatements = trimmedNames.map(name => {
    const tagId = tagMap.get(name.toLowerCase())
    if (!tagId) {
      console.error(`[createOrLinkTags] Tag ID not found for: ${name}`)
      return null
    }
    return db
      .prepare('INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag_id, user_id, created_at) VALUES (?, ?, ?, ?)')
      .bind(bookmarkId, tagId, userId, now)
  }).filter(stmt => stmt !== null) as D1PreparedStatement[]
  if (linkStatements.length > 0) {
    await db.batch(linkStatements)
  }
}
