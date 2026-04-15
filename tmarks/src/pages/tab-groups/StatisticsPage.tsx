import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart3, TrendingUp, Layers, Share2, Archive, Globe, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BottomNav } from '@/components/common/BottomNav'
import { MobileHeader } from '@/components/common/MobileHeader'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useTabGroupsStatisticsQuery } from '@/hooks/useTabGroupsQuery'

export function StatisticsPage() {
  const { t } = useTranslation('tabGroups')
  const { t: tc } = useTranslation('common')
  const isMobile = useIsMobile()
  const [days, setDays] = useState(30)
  const statisticsQuery = useTabGroupsStatisticsQuery(days)
  const statistics = statisticsQuery.data || null

  if (statisticsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{tc('status.loading')}</p>
        </div>
      </div>
    )
  }

  if (statisticsQuery.isError || !statistics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-4">{t('page.loadFailed')}</p>
          <button
            onClick={() => {
              void statisticsQuery.refetch()
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            {tc('button.retry')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-screen flex flex-col bg-background ${isMobile ? 'overflow-hidden' : ''}`}>
      {isMobile && (
        <MobileHeader
          title={t('statistics.title')}
          showMenu={false}
          showSearch={false}
          showMore={false}
        />
      )}

      <div className={`flex-1 overflow-y-auto ${isMobile ? 'pb-20 min-h-0' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            {!isMobile && (
              <Link
                to="/tab"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>{t('statistics.backToTabGroups')}</span>
              </Link>
            )}
            <div className={`flex items-center ${isMobile ? 'flex-col gap-4' : 'justify-between'}`}>
              {!isMobile && (
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-8 h-8 text-primary" />
                  <h1 className="text-3xl font-bold text-foreground">{t('statistics.title')}</h1>
                </div>
              )}
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className={`px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card text-foreground ${isMobile ? 'w-full' : ''}`}
              >
                <option value={7}>{t('statistics.last7Days')}</option>
                <option value={30}>{t('statistics.last30Days')}</option>
                <option value={90}>{t('statistics.last90Days')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-2">
                <Layers className="w-8 h-8 text-primary" />
                <span className="text-3xl font-bold text-foreground">{statistics.summary.total_groups}</span>
              </div>
              <p className="text-muted-foreground">{t('statistics.tabGroups')}</p>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-success" />
                <span className="text-3xl font-bold text-foreground">{statistics.summary.total_items}</span>
              </div>
              <p className="text-muted-foreground">{t('statistics.tabs')}</p>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-2">
                <Share2 className="w-8 h-8 text-accent" />
                <span className="text-3xl font-bold text-foreground">{statistics.summary.total_shares}</span>
              </div>
              <p className="text-muted-foreground">{t('statistics.shares')}</p>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-2">
                <Archive className="w-8 h-8 text-muted-foreground" />
                <span className="text-3xl font-bold text-foreground">{statistics.summary.total_deleted_groups}</span>
              </div>
              <p className="text-muted-foreground">{t('statistics.trash')}</p>
            </div>
          </div>

          <div className="card p-6 mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Globe className="w-6 h-6 text-primary" />
              {t('statistics.topDomains')}
            </h2>
            {statistics.top_domains.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{t('statistics.noData')}</p>
            ) : (
              <div className="space-y-3">
                {statistics.top_domains.map((domain, index) => (
                  <div key={domain.domain} className="flex items-center gap-4">
                    <span className="text-lg font-semibold text-muted-foreground/50 w-8">{index + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-foreground font-medium">{domain.domain}</span>
                        <span className="text-muted-foreground">{t('statistics.count', { count: domain.count })}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
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

          <div className="card p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Layers className="w-6 h-6 text-primary" />
              {t('statistics.groupSizeDistribution')}
            </h2>
            {statistics.group_size_distribution.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{t('statistics.noData')}</p>
            ) : (
              <div className="space-y-3">
                {statistics.group_size_distribution.map((item) => (
                  <div key={item.range} className="flex items-center gap-4">
                    <span className="text-foreground font-medium w-20">{item.range}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="w-full bg-muted rounded-full h-8">
                          <div
                            className="bg-success h-8 rounded-full transition-all flex items-center justify-end pr-3"
                            style={{
                              width: `${(item.count / Math.max(...statistics.group_size_distribution.map((entry) => entry.count))) * 100}%`,
                              minWidth: '60px',
                            }}
                          >
                            <span className="text-primary-foreground font-semibold">{item.count}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">{t('statistics.groupCreationTrend')}</h2>
              {statistics.trends.groups.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">{t('statistics.noData')}</p>
              ) : (
                <div className="space-y-2">
                  {statistics.trends.groups.slice(-10).map((trend) => (
                    <div key={trend.date} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{trend.date}</span>
                      <span className="font-semibold text-foreground">{t('statistics.count', { count: trend.count })}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">{t('statistics.tabAdditionTrend')}</h2>
              {statistics.trends.items.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">{t('statistics.noData')}</p>
              ) : (
                <div className="space-y-2">
                  {statistics.trends.items.slice(-10).map((trend) => (
                    <div key={trend.date} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{trend.date}</span>
                      <span className="font-semibold text-foreground">{t('statistics.count', { count: trend.count })}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isMobile && <BottomNav />}
    </div>
  )
}
