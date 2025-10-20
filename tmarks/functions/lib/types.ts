export interface Env {
  DB: D1Database
  RATE_LIMIT_KV?: KVNamespace // Optional for development
  PUBLIC_SHARE_KV?: KVNamespace // Optional cache for public share pages
  ALLOW_REGISTRATION?: string
  JWT_SECRET: string
  ENCRYPTION_KEY: string
  ENVIRONMENT: 'development' | 'production'
  JWT_ACCESS_TOKEN_EXPIRES_IN: string
  JWT_REFRESH_TOKEN_EXPIRES_IN: string
}

export interface User {
  id: string
  username: string
  email: string | null
  password_hash: string
  created_at: string
  updated_at: string
}

export interface Bookmark {
  id: string
  user_id: string
  title: string
  url: string
  description: string | null
  cover_image: string | null
  is_pinned: boolean
  is_archived: boolean
  is_public: boolean
  click_count: number
  last_clicked_at: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface BookmarkRow extends Omit<Bookmark, 'is_pinned' | 'is_archived' | 'is_public'> {
  is_pinned: number | boolean
  is_archived: number | boolean
  is_public: number | boolean
}

export interface PublicProfile {
  user_id: string
  public_share_enabled: boolean
  public_slug: string | null
  public_page_title: string | null
  public_page_description: string | null
  username: string
}

export interface Tag {
  id: string
  user_id: string
  name: string
  color: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface ApiError {
  code: string
  message: string
  details?: unknown
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: ApiError
  meta?: {
    page?: number
    page_size?: number
    total?: number
    next_cursor?: string
  }
}

export type RouteParams = Record<string, string>

export type SQLParam = string | number | boolean | null
