/**
 * 缓存策略
 * 
 * 提供缓存键生成和策略判断功能
 */

import type { CacheStrategyType, QueryParams } from './types'

/**
 * 生成缓存�?
 */
export function generateCacheKey(
  type: CacheStrategyType,
  userId: string,
  params?: QueryParams | Record<string, unknown>
): string {
  const parts: string[] = []

  // 基础前缀
  switch (type) {
    case 'rateLimit':
      parts.push('ratelimit')
      break
    case 'publicShare':
      parts.push('public-share')
      break
    case 'defaultList':
    case 'tagFilter':
    case 'search':
    case 'complexQuery':
      parts.push('bookmarks')
      break
  }

  // 用户 ID
  if (userId) {
    parts.push(userId)
  }

  // 查询参数
  if (params) {
    if (type === 'search' && params.keyword) {
      parts.push('search', params.keyword)
    }

    if (type === 'tagFilter' && params.tags) {
      const tags = Array.isArray(params.tags) ? params.tags : [params.tags]
      parts.push('tags', tags.sort().join(','))
    }

    if (params.archived) {
      parts.push('archived')
    }

    if (params.pinned) {
      parts.push('pinned')
    }

    if (params.sort) {
      parts.push('sort', params.sort)
    }

    if (params.page_size) {
      parts.push('size', String(params.page_size))
    }

    if (params.page_cursor) {
      parts.push('cursor', String(params.page_cursor))
    }
  }

  return parts.join(':')
}

/**
 * 判断查询类型
 */
export function getQueryType(params?: QueryParams): CacheStrategyType {
  if (!params) {
    return 'defaultList'
  }

  // 搜索查询
  if (params.keyword) {
    return 'search'
  }

  // 标签筛�?
  if (params.tags && params.tags.length > 0) {
    return 'tagFilter'
  }

  // 默认列表 (无筛选条�?
  if (!params.archived && !params.pinned && !params.sort) {
    return 'defaultList'
  }

  // 复杂查询
  return 'complexQuery'
}

/**
 * 判断是否应该缓存该查�?
 */
export function shouldCacheQuery(
  type: CacheStrategyType,
  params?: QueryParams
): boolean {
  // 速率限制和公开分享总是缓存
  if (type === 'rateLimit' || type === 'publicShare') {
    return true
  }

  // 默认列表总是缓存
  if (type === 'defaultList') {
    return true
  }

  // 标签筛选：只缓存简单查�?(�?个标�?
  if (type === 'tagFilter' && params?.tags) {
    return params.tags.length <= 3
  }

  // 搜索：只缓存短关键词 (�?0字符)
  if (type === 'search' && params?.keyword) {
    return params.keyword.length <= 50
  }

  // 复杂查询：根据配置决�?
  return false
}

/**
 * 生成缓存失效前缀
 */
export function getCacheInvalidationPrefix(
  userId: string,
  type?: CacheStrategyType
): string {
  if (type === 'publicShare') {
    return 'public-share:'
  }

  if (type === 'rateLimit') {
    return `ratelimit:${userId}:`
  }

  // 默认失效所有书签相关缓�?
  return `bookmarks:${userId}:`
}

/**
 * 哈希查询参数 (用于缓存�?
 */
export function hashQueryParams(params: QueryParams): string {
  const sorted = Object.keys(params)
    .sort()
    .map(key => {
      const value = params[key as keyof QueryParams]
      if (Array.isArray(value)) {
        return `${key}=${value.sort().join(',')}`
      }
      return `${key}=${value}`
    })
    .join('&')

  return sorted
}
