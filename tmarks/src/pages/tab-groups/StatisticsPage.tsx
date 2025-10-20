import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Layers, Share2, Archive, Globe, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { tabGroupsService } from '@/services/tab-groups'
import type { StatisticsResponse } from '@/lib/types'

export function StatisticsPage() {
  const [statistics, setStatistics] = useState<StatisticsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(30)

  useEffect(() => {
    loadStatistics()
  }, [days])

  const loadStatistics = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await tabGroupsService.getStatistics(days)
      setStatistics(data)
    } catch (err) {
      console.error('Failed to load statistics:', err)
      setError('加载统计数据失败')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (error || !statistics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || '加载失败'}</p>
          <button
            onClick={loadStatistics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/tab-groups"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回标签页组</span>
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">使用统计</h1>
          </div>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={7}>最近 7 天</option>
            <option value={30}>最近 30 天</option>
            <option value={90}>最近 90 天</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Layers className="w-8 h-8 text-blue-600" />
            <span className="text-3xl font-bold text-gray-900">{statistics.summary.total_groups}</span>
          </div>
          <p className="text-gray-600">标签页组</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <span className="text-3xl font-bold text-gray-900">{statistics.summary.total_items}</span>
          </div>
          <p className="text-gray-600">标签页</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Share2 className="w-8 h-8 text-purple-600" />
            <span className="text-3xl font-bold text-gray-900">{statistics.summary.total_shares}</span>
          </div>
          <p className="text-gray-600">分享</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Archive className="w-8 h-8 text-gray-600" />
            <span className="text-3xl font-bold text-gray-900">{statistics.summary.total_deleted_groups}</span>
          </div>
          <p className="text-gray-600">回收站</p>
        </div>
      </div>

      {/* Top Domains */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Globe className="w-6 h-6 text-blue-600" />
          热门域名 Top 10
        </h2>
        {statistics.top_domains.length === 0 ? (
          <p className="text-gray-600 text-center py-8">暂无数据</p>
        ) : (
          <div className="space-y-3">
            {statistics.top_domains.map((domain, index) => (
              <div key={domain.domain} className="flex items-center gap-4">
                <span className="text-lg font-semibold text-gray-400 w-8">{index + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-900 font-medium">{domain.domain}</span>
                    <span className="text-gray-600">{domain.count} 个</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${statistics.top_domains[0] ? (domain.count / statistics.top_domains[0].count) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Group Size Distribution */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Layers className="w-6 h-6 text-blue-600" />
          标签页组大小分布
        </h2>
        {statistics.group_size_distribution.length === 0 ? (
          <p className="text-gray-600 text-center py-8">暂无数据</p>
        ) : (
          <div className="space-y-3">
            {statistics.group_size_distribution.map((item) => (
              <div key={item.range} className="flex items-center gap-4">
                <span className="text-gray-900 font-medium w-20">{item.range} 个</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="w-full bg-gray-200 rounded-full h-8">
                      <div
                        className="bg-green-600 h-8 rounded-full transition-all flex items-center justify-end pr-3"
                        style={{
                          width: `${(item.count / Math.max(...statistics.group_size_distribution.map((d) => d.count))) * 100}%`,
                          minWidth: '60px',
                        }}
                      >
                        <span className="text-white font-semibold">{item.count}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">标签页组创建趋势</h2>
          {statistics.trends.groups.length === 0 ? (
            <p className="text-gray-600 text-center py-8">暂无数据</p>
          ) : (
            <div className="space-y-2">
              {statistics.trends.groups.slice(-10).map((trend) => (
                <div key={trend.date} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{trend.date}</span>
                  <span className="font-semibold text-gray-900">{trend.count} 个</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">标签页添加趋势</h2>
          {statistics.trends.items.length === 0 ? (
            <p className="text-gray-600 text-center py-8">暂无数据</p>
          ) : (
            <div className="space-y-2">
              {statistics.trends.items.slice(-10).map((trend) => (
                <div key={trend.date} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{trend.date}</span>
                  <span className="font-semibold text-gray-900">{trend.count} 个</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

