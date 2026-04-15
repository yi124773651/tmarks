/**
 * 核心缓存服务
 * 
 * 提供统一的缓存接口，支持内存缓存和自动过期
 */

import type { Env } from '../types'
import type {
  CacheConfig,
  CacheStrategyType,
  CacheEntry,
  CacheSetOptions,
  CacheStats,
} from './types'
import { loadCacheConfig } from './config'
import { shouldCacheQuery } from './strategies'

/**
 * 缓存服务类
 */
export class CacheService {
  private config: CacheConfig
  private env: Env
  private memCache: Map<string, CacheEntry> = new Map()
  private hits = 0
  private misses = 0
  private errorCount = 0
  private readonly MAX_ERRORS = 10

  constructor(env: Env) {
    this.env = env
    this.config = loadCacheConfig(env)
  }

  /**
   * 获取缓存数据
   */
  async get<T>(
    type: CacheStrategyType,
    key: string
  ): Promise<T | null> {
    if (!this.isEnabled(type)) {
      return null
    }

    try {
      // 内存缓存
      if (this.config.memoryCache.enabled) {
        const memCached = this.getFromMemory<T>(key)
        if (memCached !== null) {
          this.hits++
          return memCached
        }
      }

      this.misses++
      return null
    } catch (error) {
      this.handleError('get', error)
      this.misses++
      return null
    }
  }

  /**
   * 设置缓存数据
   */
  async set<T>(
    type: CacheStrategyType,
    key: string,
    data: T,
    options?: CacheSetOptions
  ): Promise<void> {
    if (!this.isEnabled(type)) {
      return
    }

    try {
      // 内存缓存
      if (this.config.memoryCache.enabled) {
        this.setToMemory(key, data, options?.ttl)
      }
    } catch (error) {
      this.handleError('set', error)
    }
  }

  /**
   * 删除缓存
   */
  async delete(key: string): Promise<void> {
    try {
      this.memCache.delete(key)
    } catch (error) {
      this.handleError('delete', error)
    }
  }

  /**
   * 批量删除缓存（按前缀）
   */
  async invalidate(prefix: string): Promise<void> {
    try {
      const keysToDelete: string[] = []
      this.memCache.forEach((_, key) => {
        if (key.startsWith(prefix)) {
          keysToDelete.push(key)
        }
      })
      keysToDelete.forEach(key => this.memCache.delete(key))
    } catch (error) {
      this.handleError('invalidate', error)
    }
  }

  /**
   * 判断是否应该缓存
   */
  shouldCache(type: CacheStrategyType, params?: Record<string, unknown>): boolean {
    if (!this.isEnabled(type)) {
      return false
    }
    return shouldCacheQuery(type, params)
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses
    return {
      level: this.config.level,
      enabled: this.config.enabled,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
      memCacheSize: this.memCache.size,
      strategies: this.config.strategies,
    }
  }

  /**
   * 获取配置
   */
  getConfig(): CacheConfig {
    return { ...this.config }
  }

  // ==================== 私有方法 ====================

  /**
   * 检查是否启用该类型缓存
   */
  private isEnabled(type: CacheStrategyType): boolean {
    return this.config.enabled && this.config.strategies[type]
  }

  /**
   * 从内存缓存获取
   */
  private getFromMemory<T>(key: string): T | null {
    const entry = this.memCache.get(key)
    if (entry && entry.expires > Date.now()) {
      return entry.data as T
    }
    if (entry) {
      this.memCache.delete(key)
    }
    return null
  }

  /**
   * 写入内存缓存
   */
  private setToMemory<T>(key: string, data: T, ttlSeconds?: number): void {
    // 内存泄漏修复：当条目数过多时，清理过期条目
    if (this.memCache.size > 500) {
      const now = Date.now()
      for (const [k, entry] of this.memCache.entries()) {
        if (entry.expires <= now) {
          this.memCache.delete(k)
        }
      }
    }

    const maxAge = (ttlSeconds ?? this.config.memoryCache.maxAge) * 1000
    this.memCache.set(key, {
      data,
      expires: Date.now() + maxAge,
    })
  }

  /**
   * 错误处理
   */
  private handleError(operation: string, error: unknown): void {
    this.errorCount++

    if (this.errorCount >= this.MAX_ERRORS) {
      console.error(`Too many cache errors (${this.errorCount}), disabling cache`)
      this.config.enabled = false
    }

    const message = error instanceof Error ? error.message : String(error)
    console.warn(`Cache ${operation} error:`, message)
  }
}
