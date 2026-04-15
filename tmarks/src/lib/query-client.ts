/**
 * React Query 客户端配置
 * 
 * 提供持久化缓存支持，减少 API 请求，提升用户体验
 */

import { QueryClient } from '@tanstack/react-query'
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

/**
 * 创建持久化存储
 * 使用 localStorage 存储缓存数据
 */
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'tmarks-cache',
  serialize: JSON.stringify,
  deserialize: JSON.parse,
})

/**
 * 创建 QueryClient 实例
 * 
 * 配置说明:
 * - staleTime: 30分钟 (书签变化不频繁)
 * - gcTime: 24小时 (保留缓存数据)
 * - refetchOnWindowFocus: true (窗口聚焦时刷新)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 60 * 1000,       // 30分钟
      gcTime: 24 * 60 * 60 * 1000,     // 24小时
      retry: 2,
      refetchOnWindowFocus: true,       // 窗口聚焦时刷新
      refetchOnReconnect: true,         // 重新连接时刷新
    },
    mutations: {
      retry: 1,
    },
  },
})

/**
 * 启用持久化
 * 
 * 配置说明:
 * - maxAge: 24小时 (缓存最大保留时间)
 * - buster: 版本号 (更新版本号会清除旧缓存)
 */
persistQueryClient({
  queryClient,
  persister,
  maxAge: 24 * 60 * 60 * 1000,  // 24小时
  buster: 'v1',                  // 版本控制
})
