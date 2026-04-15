import type { SortOption } from '@/components/common/SortSelector'

export const VIEW_MODES = ['list', 'card', 'minimal', 'title'] as const
export type ViewMode = typeof VIEW_MODES[number]

export const SORT_OPTIONS: SortOption[] = ['created', 'updated', 'pinned', 'popular']

export type VisibilityFilter = 'all' | 'public' | 'private'
export const VISIBILITY_FILTERS: VisibilityFilter[] = ['all', 'public', 'private']

export const VIEW_MODE_STORAGE_KEY = 'tmarks:view_mode'
export const VIEW_MODE_UPDATED_AT_STORAGE_KEY = 'tmarks:view_mode_updated_at'
