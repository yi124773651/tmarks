import { Bookmark, Tag } from './bookmark.types'

export type TagLayoutPreference = 'grid' | 'masonry'
export type SortByPreference = 'created' | 'updated' | 'pinned' | 'popular'

export type DefaultBookmarkIcon = 'favicon' | 'letter' | 'hash' | 'none' | 'orbital-spinner'

export interface UserPreferences {
  user_id?: string
  theme: 'light' | 'dark' | 'system'
  page_size: number
  view_mode: 'list' | 'card' | 'minimal' | 'title'
  density: 'compact' | 'normal' | 'comfortable'
  tag_layout: TagLayoutPreference
  sort_by: SortByPreference
  search_auto_clear_seconds: number
  tag_selection_auto_clear_seconds: number
  enable_search_auto_clear: boolean
  enable_tag_selection_auto_clear: boolean
  default_bookmark_icon: DefaultBookmarkIcon
  snapshot_retention_count: number
  updated_at: string
}

export interface UpdatePreferencesRequest {
  theme?: 'light' | 'dark' | 'system'
  page_size?: number
  view_mode?: 'list' | 'card' | 'minimal' | 'title'
  density?: 'compact' | 'normal' | 'comfortable'
  tag_layout?: TagLayoutPreference
  sort_by?: SortByPreference
  search_auto_clear_seconds?: number
  tag_selection_auto_clear_seconds?: number
  enable_search_auto_clear?: boolean
  enable_tag_selection_auto_clear?: boolean
  search_debounce_ms?: number
  mobile_edit_auto_cancel_seconds?: number
  double_click_delay_ms?: number
  enable_edit_confirmation?: boolean
  default_bookmark_icon?: DefaultBookmarkIcon
  snapshot_retention_count?: number
  enable_animations?: boolean
  animation_speed?: 'fast' | 'normal' | 'slow'
  enable_virtual_scroll?: boolean
  toast_duration_seconds?: number
  enable_success_sound?: boolean
  auto_copy_share_link?: boolean
  auto_save_delay_seconds?: number
  warn_unsaved_changes?: boolean
  show_bookmark_thumbnails?: boolean
  show_bookmark_descriptions?: boolean
  show_tag_colors?: boolean
  sidebar_default_expanded?: boolean
}

export interface PreferencesResponse {
  preferences: UserPreferences
}

export interface ShareSettings {
  enabled: boolean
  slug: string | null
  title: string | null
  description: string | null
}

export interface ShareSettingsResponse {
  share: ShareSettings
}

export interface R2StorageQuota {
  used_bytes: number
  limit_bytes: number | null
  unlimited: boolean
}

export interface R2StorageQuotaResponse {
  quota: R2StorageQuota
}

export interface UpdateShareSettingsRequest {
  enabled?: boolean
  slug?: string | null
  title?: string | null
  description?: string | null
  regenerate_slug?: boolean
}

export interface PublicSharePayload {
  profile: {
    username: string
    title: string | null
    description: string | null
    slug: string
  }
  bookmarks: Bookmark[]
  tags: Array<Tag & { bookmark_count: number }>
  generated_at: string
}

export interface PublicSharePaginatedPayload {
  profile: {
    username: string
    title: string | null
    description: string | null
    slug: string
  }
  bookmarks: Bookmark[]
  tags: Array<Tag & { bookmark_count: number }>
  meta: {
    page_size: number
    count: number
    next_cursor: string | null
    has_more: boolean
  }
}
