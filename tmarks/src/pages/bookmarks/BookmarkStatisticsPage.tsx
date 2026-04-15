import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart3, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { MobileHeader } from '@/components/common/MobileHeader'
import { StatisticsCards } from './components/StatisticsCards'
import { useStatisticsData, type Granularity } from './hooks/useStatisticsData'

interface BookmarkStatisticsPageProps {
  embedded?: boolean
}

export function BookmarkStatisticsPage({ embedded = false }: BookmarkStatisticsPageProps) {
  const { t, i18n } = useTranslation('bookmarks')
  const isMobile = useIsMobile()
  const [granularity, setGranularity] = useState<Granularity>('day')
  const [currentDate, setCurrentDate] = useState(new Date())

  const { statistics, isLoading, error, loadStatistics, getDateRange } = useStatisticsData(granularity, currentDate)

  const navigateTime = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    switch (granularity) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
        break
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
        break
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
        break
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1))
        break
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => setCurrentDate(new Date())

  const formatCurrentRange = () => {
    const range = getDateRange()
    const start = new Date(range.startDate)
    const end = new Date(range.endDate)
    const locale = i18n.language

    if (granularity === 'day') {
      return start.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })
    }
    if (granularity === 'week') {
      return `${start.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(locale, { month: 'short', day: 'numeric' })}`
    }
    if (granularity === 'month') {
      return start.toLocaleDateString(locale, { year: 'numeric', month: 'long' })
    }
    return start.getFullYear().toString()
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const locale = i18n.language
    if (granularity === 'year') return dateString
    if (granularity === 'month') {
      const [year, month] = dateString.split('-')
      if (!year || !month) return dateString
      const monthNum = Number.parseInt(month, 10)
      if (!Number.isFinite(monthNum)) return dateString
      const date = new Date(Number(year), monthNum - 1)
      return date.toLocaleDateString(locale, { year: 'numeric', month: 'short' })
    }
    if (granularity === 'week') {
      const [year, weekPart] = dateString.split('-W')
      if (!year || !weekPart) return dateString
      const weekNum = Number.parseInt(weekPart, 10)
      if (!Number.isFinite(weekNum)) return dateString
      return `${year} W${weekNum}`
    }
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return dateString
    return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString(i18n.language, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getNavigationLabel = (direction: 'prev' | 'next') => {
    const key = direction === 'prev' 
      ? `statistics.navigation.prev${granularity.charAt(0).toUpperCase() + granularity.slice(1)}`
      : `statistics.navigation.next${granularity.charAt(0).toUpperCase() + granularity.slice(1)}`
    return t(key)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('statistics.loading')}</p>
        </div>
      </div>
    )
  }

  if (error || !statistics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || t('statistics.loadFailed')}</p>
          <button
            onClick={loadStatistics}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            {t('statistics.retry')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`${embedded ? '' : 'min-h-screen'} bg-background ${isMobile && !embedded ? 'pb-20' : ''}`}>
      {isMobile && !embedded && (
        <MobileHeader
          title={t('statistics.title')}
          showMenu={false}
          showSearch={false}
          showMore={false}
        />
      )}

      <div className={`${embedded ? '' : 'max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8'}`}>
        <div className="mb-6 sm:mb-8">
          {!isMobile && !embedded && (
            <Link
              to="/bookmarks"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{t('statistics.backToBookmarks')}</span>
            </Link>
          )}

          <div className="flex items-center justify-between mb-4">
            {!isMobile && !embedded && (
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold text-foreground">{t('statistics.title')}</h1>
              </div>
            )}

            <select
              value={granularity}
              onChange={(e) => setGranularity(e.target.value as Granularity)}
              className={`px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card text-foreground ${embedded ? 'ml-auto' : ''}`}
            >
              <option value="day">{t('statistics.granularity.day')}</option>
              <option value="week">{t('statistics.granularity.week')}</option>
              <option value="month">{t('statistics.granularity.month')}</option>
              <option value="year">{t('statistics.granularity.year')}</option>
            </select>
          </div>

          <div className="flex items-center justify-center gap-2 sm:gap-4">
            <button
              onClick={() => navigateTime('prev')}
              className="btn btn-ghost btn-sm flex items-center gap-1 hover:bg-muted/30"
              title={getNavigationLabel('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">
                {getNavigationLabel('prev')}
              </span>
            </button>

            <div className="flex items-center gap-2">
              <div className="text-base sm:text-lg font-semibold text-foreground px-3 sm:px-4 py-2 bg-card border border-border rounded-lg min-w-[200px] sm:min-w-[280px] text-center">
                {formatCurrentRange()}
              </div>
              <button
                onClick={goToToday}
                className="btn btn-ghost btn-sm"
                title={t('statistics.navigation.today')}
              >
                {t('statistics.navigation.today')}
              </button>
            </div>

            <button
              onClick={() => navigateTime('next')}
              className="btn btn-ghost btn-sm flex items-center gap-1 hover:bg-muted/30"
              title={getNavigationLabel('next')}
            >
              <span className="hidden sm:inline">
                {getNavigationLabel('next')}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <StatisticsCards
          statistics={statistics}
          formatDate={formatDate}
          formatDateTime={formatDateTime}
        />
      </div>
    </div>
  )
}
