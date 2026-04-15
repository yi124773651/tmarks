/**
 *  — 
 */

export async function cleanupOldSnapshots(
  db: D1Database,
  bucket: R2Bucket,
  bookmarkId: string,
  userId: string
) {
  try {
    const bookmarkSettings = await db
      .prepare('SELECT snapshot_retention_count FROM bookmarks WHERE id = ? AND user_id = ?')
      .bind(bookmarkId, userId)
      .first()

    const userSettings = await db
      .prepare('SELECT snapshot_retention_count FROM user_preferences WHERE user_id = ?')
      .bind(userId)
      .first()

    const retentionCount =
      (bookmarkSettings?.snapshot_retention_count as number | null) ??
      (userSettings?.snapshot_retention_count as number | null) ??
      5

    if (retentionCount === -1) {
      return
    }

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

    const deletedIds: unknown[] = []
    for (const snapshot of toDelete.results) {
      try {
        await bucket.delete(snapshot.r2_key as string)
        deletedIds.push(snapshot.id)
      } catch (error) {
        console.error('Failed to delete R2 file:', snapshot.r2_key, error)
      }
    }

    if (deletedIds.length === 0) return

    const placeholders = deletedIds.map(() => '?').join(',')
    await db
      .prepare(`DELETE FROM bookmark_snapshots WHERE id IN (${placeholders}) AND user_id = ?`)
      .bind(...deletedIds, userId)
      .run()
  } catch (error) {
    console.error('Cleanup snapshots error:', error)
  }
}
