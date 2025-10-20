import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, BookmarkRow, PublicProfile } from '../../lib/types'
import { notFound, success, internalError } from '../../lib/response'
import { normalizeBookmark } from '../bookmarks/utils'

interface PublicSharePayload {
  profile: {
    username: string
    title: string | null
    description: string | null
    slug: string
  }
  bookmarks: Array<ReturnType<typeof normalizeBookmark> & { tags: Array<{ id: string; name: string; color: string | null }> }>
  tags: Array<{ id: string; name: string; color: string | null; bookmark_count: number }>
  generated_at: string
}

const CACHE_PREFIX = 'public-share:'

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const slug = (context.params.slug as string | undefined)?.toLowerCase()

  if (!slug) {
    return notFound('Share link not found')
  }

  const cacheKey = `${CACHE_PREFIX}${slug}`

  try {
    const cached = await context.env.PUBLIC_SHARE_KV?.get(cacheKey, 'json')
    if (cached) {
      return success(cached as PublicSharePayload)
    }

    const user = await context.env.DB.prepare(
      `SELECT id as user_id, username, public_share_enabled, public_slug, public_page_title, public_page_description
       FROM users
       WHERE LOWER(public_slug) = ? AND public_share_enabled = 1`
    )
      .bind(slug)
      .first<PublicProfile>()

    if (!user || !user.public_share_enabled || !user.public_slug) {
      return notFound('Share link not found')
    }

    const { results: bookmarkRows } = await context.env.DB.prepare(
      `SELECT *
       FROM bookmarks
       WHERE user_id = ?
         AND is_public = 1
         AND deleted_at IS NULL
       ORDER BY is_pinned DESC, created_at DESC`
    )
      .bind(user.user_id)
      .all<BookmarkRow>()

    const bookmarkIds = (bookmarkRows || []).map((row) => row.id)

    let allTags: Array<{ bookmark_id: string; id: string; name: string; color: string | null }> = []

    if (bookmarkIds.length > 0) {
      const placeholders = bookmarkIds.map(() => '?').join(',')
      const { results: tagRows } = await context.env.DB.prepare(
        `SELECT bt.bookmark_id, t.id, t.name, t.color
         FROM bookmark_tags bt
         INNER JOIN tags t ON t.id = bt.tag_id
         WHERE bt.bookmark_id IN (${placeholders})
           AND t.deleted_at IS NULL
         ORDER BY t.name`
      )
        .bind(...bookmarkIds)
        .all<{ bookmark_id: string; id: string; name: string; color: string | null }>()

      allTags = tagRows || []
    }

    const tagsByBookmark = new Map<string, Array<{ id: string; name: string; color: string | null }>>()
    const tagCountMap = new Map<string, { id: string; name: string; color: string | null; count: number }>()

    for (const tag of allTags) {
      if (!tagsByBookmark.has(tag.bookmark_id)) {
        tagsByBookmark.set(tag.bookmark_id, [])
      }
      tagsByBookmark.get(tag.bookmark_id)!.push({ id: tag.id, name: tag.name, color: tag.color })

      if (!tagCountMap.has(tag.id)) {
        tagCountMap.set(tag.id, { id: tag.id, name: tag.name, color: tag.color, count: 0 })
      }
      tagCountMap.get(tag.id)!.count += 1
    }

    const bookmarks = (bookmarkRows || []).map((row) => ({
      ...normalizeBookmark(row),
      tags: tagsByBookmark.get(row.id) || [],
    }))

    const tags = Array.from(tagCountMap.values()).map((tag) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      bookmark_count: tag.count,
    }))

    const payload: PublicSharePayload = {
      profile: {
        username: user.username,
        title: user.public_page_title,
        description: user.public_page_description,
        slug: user.public_slug,
      },
      bookmarks,
      tags,
      generated_at: new Date().toISOString(),
    }

    if (context.env.PUBLIC_SHARE_KV) {
      await context.env.PUBLIC_SHARE_KV.put(cacheKey, JSON.stringify(payload))
    }

    return success(payload)
  } catch (error) {
    console.error('Public share error:', error)
    return internalError('Failed to load shared bookmarks')
  }
}
