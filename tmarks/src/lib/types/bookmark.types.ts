export interface Tag {
  id: string
  user_id?: string
  name: string
  color: string | null
  bookmark_count?: number
  click_count?: number
  last_clicked_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface Bookmark {
  id: string
  user_id: string
  title: string
  url: string
  description: string | null
  cover_image: string | null
  favicon: string | null
  is_pinned: boolean
  is_archived: boolean
  is_public: boolean
  click_count: number
  last_clicked_at: string | null
  has_snapshot: boolean
  latest_snapshot_at: string | null
  snapshot_count?: number
  ai_summary?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
  tags: Tag[]
}

export interface CreateBookmarkRequest {
  title: string
  url: string
  description?: string
  cover_image?: string
  favicon?: string
  tag_ids?: string[]
  is_pinned?: boolean
  is_archived?: boolean
  is_public?: boolean
}

export interface UpdateBookmarkRequest {
  title?: string
  url?: string
  description?: string | null
  cover_image?: string | null
  favicon?: string | null
  tag_ids?: string[]
  is_pinned?: boolean
  is_archived?: boolean
  is_public?: boolean
}

export interface BookmarksResponse {
  bookmarks: Bookmark[]
  meta: {
    page_size: number
    count: number
    next_cursor?: string
    has_more: boolean
    related_tag_ids?: string[]
  }
}

export interface CreateTagRequest {
  name: string
  color?: string
}

export interface UpdateTagRequest {
  name?: string
  color?: string | null
}

export interface TagsResponse {
  tags: Tag[]
}

export interface BookmarkQueryParams {
  keyword?: string
  tags?: string
  page_size?: number
  page_cursor?: string
  sort?: 'created' | 'updated' | 'pinned' | 'popular'
  archived?: boolean
  pinned?: boolean
}

export interface TagQueryParams {
  sort?: 'usage' | 'name' | 'clicks'
}

export type BatchActionType = 'delete' | 'update_tags' | 'pin' | 'unpin' | 'archive' | 'unarchive'

export interface BatchActionRequest {
  action: BatchActionType
  bookmark_ids: string[]
  add_tag_ids?: string[]
  remove_tag_ids?: string[]
}

export interface BatchActionResponse {
  success: boolean
  affected_count: number
  errors?: Array<{ bookmark_id: string; message: string }>
}
