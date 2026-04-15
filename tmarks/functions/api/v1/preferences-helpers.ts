export interface UserPreferences {
  user_id: string
  theme: 'light' | 'dark' | 'system'
  page_size: number
  view_mode: 'list' | 'card' | 'minimal' | 'title'
  density: 'compact' | 'normal' | 'comfortable'
  tag_layout?: 'grid' | 'masonry'
  sort_by?: 'created' | 'updated' | 'pinned' | 'popular'
  search_auto_clear_seconds?: number
  tag_selection_auto_clear_seconds?: number
  enable_search_auto_clear?: number
  enable_tag_selection_auto_clear?: number
  default_bookmark_icon?: string
  snapshot_retention_count?: number
  snapshot_auto_create?: number
  snapshot_auto_dedupe?: number
  snapshot_auto_cleanup_days?: number
  updated_at: string
}

export interface UpdatePreferencesRequest {
  theme?: 'light' | 'dark' | 'system'
  page_size?: number
  view_mode?: 'list' | 'card' | 'minimal' | 'title'
  density?: 'compact' | 'normal' | 'comfortable'
  tag_layout?: 'grid' | 'masonry'
  sort_by?: 'created' | 'updated' | 'pinned' | 'popular'
  search_auto_clear_seconds?: number
  tag_selection_auto_clear_seconds?: number
  enable_search_auto_clear?: boolean
  enable_tag_selection_auto_clear?: boolean
  default_bookmark_icon?: string
  snapshot_retention_count?: number
  snapshot_auto_create?: boolean
  snapshot_auto_dedupe?: boolean
  snapshot_auto_cleanup_days?: number
}

export async function hasTagLayoutColumn(db: D1Database): Promise<boolean> {
  try {
    await db.prepare('SELECT tag_layout FROM user_preferences LIMIT 1').first()
    return true
  } catch (error) {
    if (error instanceof Error && /no such column: tag_layout/i.test(error.message)) {
      return false
    }
    throw error
  }
}

export async function hasSortByColumn(db: D1Database): Promise<boolean> {
  try {
    await db.prepare('SELECT sort_by FROM user_preferences LIMIT 1').first()
    return true
  } catch (error) {
    if (error instanceof Error && /no such column: sort_by/i.test(error.message)) {
      return false
    }
    throw error
  }
}

export async function hasAutomationColumns(db: D1Database): Promise<boolean> {
  try {
    await db
      .prepare('SELECT search_auto_clear_seconds FROM user_preferences LIMIT 1')
      .first()
    return true
  } catch (error) {
    if (
      error instanceof Error &&
      /no such column: search_auto_clear_seconds/i.test(error.message)
    ) {
      return false
    }
    throw error
  }
}

export function mapPreferences(preferences: UserPreferences) {
  return {
    theme: preferences.theme,
    page_size: preferences.page_size,
    view_mode: preferences.view_mode,
    density: preferences.density,
    tag_layout: preferences.tag_layout ?? 'grid',
    sort_by: preferences.sort_by ?? 'popular',
    search_auto_clear_seconds: preferences.search_auto_clear_seconds ?? 15,
    tag_selection_auto_clear_seconds: preferences.tag_selection_auto_clear_seconds ?? 30,
    enable_search_auto_clear: preferences.enable_search_auto_clear === 1,
    enable_tag_selection_auto_clear: preferences.enable_tag_selection_auto_clear === 1,
    default_bookmark_icon: preferences.default_bookmark_icon ?? 'bookmark',
    snapshot_retention_count: preferences.snapshot_retention_count ?? 5,
    snapshot_auto_create: preferences.snapshot_auto_create === 1,
    snapshot_auto_dedupe: preferences.snapshot_auto_dedupe === 1,
    snapshot_auto_cleanup_days: preferences.snapshot_auto_cleanup_days ?? 0,
    updated_at: preferences.updated_at,
  }
}

export function validatePreferences(body: UpdatePreferencesRequest): string | null {
  if (body.theme && !['light', 'dark', 'system'].includes(body.theme)) {
    return 'Invalid theme value'
  }

  if (body.page_size && (body.page_size < 10 || body.page_size > 100)) {
    return 'Page size must be between 10 and 100'
  }

  if (body.view_mode && !['list', 'card', 'minimal', 'title'].includes(body.view_mode)) {
    return 'Invalid view mode'
  }

  if (body.density && !['compact', 'normal', 'comfortable'].includes(body.density)) {
    return 'Invalid density value'
  }

  if (body.tag_layout && !['grid', 'masonry'].includes(body.tag_layout)) {
    return 'Invalid tag layout value'
  }

  if (body.sort_by && !['created', 'updated', 'pinned', 'popular'].includes(body.sort_by)) {
    return 'Invalid sort_by value'
  }

  if (body.search_auto_clear_seconds !== undefined && (body.search_auto_clear_seconds < 5 || body.search_auto_clear_seconds > 120)) {
    return 'Search auto clear seconds must be between 5 and 120'
  }

  if (body.tag_selection_auto_clear_seconds !== undefined && (body.tag_selection_auto_clear_seconds < 10 || body.tag_selection_auto_clear_seconds > 300)) {
    return 'Tag selection auto clear seconds must be between 10 and 300'
  }

  if (
    body.default_bookmark_icon &&
    !['gradient-glow', 'pulse-breath', 'orbital-spinner', 'bookmark'].includes(
      body.default_bookmark_icon,
    )
  ) {
    return 'Invalid default bookmark icon value'
  }

  if (body.snapshot_retention_count !== undefined && (body.snapshot_retention_count < -1 || body.snapshot_retention_count > 100)) {
    return 'Snapshot retention count must be between -1 and 100'
  }

  if (body.snapshot_auto_cleanup_days !== undefined && (body.snapshot_auto_cleanup_days < 0 || body.snapshot_auto_cleanup_days > 365)) {
    return 'Snapshot auto cleanup days must be between 0 and 365'
  }

  return null
}
