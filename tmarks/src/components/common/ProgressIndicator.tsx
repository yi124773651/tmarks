/**
 * 进度指示器组件
 * 提供丰富的进度显示和动画效果
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle, Loader2, Clock, Zap } from 'lucide-react'
import { useAnimatedProgress } from './useAnimatedProgress'

export interface ProgressInfo {
  current: number
  total: number
  percentage: number
  status: string
  message?: string
  estimated_remaining?: number
  speed?: number // items per second
}

export interface ProgressIndicatorProps {
  progress: ProgressInfo
  variant?: 'default' | 'compact' | 'detailed'
  showSpeed?: boolean
  showETA?: boolean
  className?: string
}

export function ProgressIndicator({
  progress,
  variant = 'default',
  showSpeed = true,
  showETA = true,
  className = ''
}: ProgressIndicatorProps) {
  const { t } = useTranslation('common')
  const animatedPercentage = useAnimatedProgress(progress.percentage)
  const [isComplete, setIsComplete] = useState(false)

  // 完成状态检测
  useEffect(() => {
    if (progress.percentage >= 100) {
      const timer = setTimeout(() => {
        setIsComplete(true)
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setIsComplete(false)
    }
  }, [progress.percentage])

  // 紧凑模式
  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className="flex-shrink-0">
          {isComplete ? (
            <CheckCircle className="h-5 w-5 text-success" />
          ) : (
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground truncate">
              {progress.status}
            </span>
            <span className="text-muted-foreground ml-2">
              {Math.round(animatedPercentage)}%
            </span>
          </div>
          <div className="mt-1 w-full bg-muted rounded-full h-1.5">
            <div 
              className="bg-primary h-1.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${animatedPercentage}%` }}
            />
          </div>
        </div>
      </div>
    )
  }

  // 详细模式
  if (variant === 'detailed') {
    return (
      <div className={`space-y-3 sm:space-y-4 ${className}`}>
        {/* 状态头部 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              {isComplete ? (
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
              ) : (
                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary animate-spin" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm sm:text-base md:text-lg font-semibold text-foreground truncate">
                {progress.status}
              </h4>
              {progress.message && (
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {progress.message}
                </p>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
              {Math.round(animatedPercentage)}%
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {progress.current} / {progress.total}
            </div>
          </div>
        </div>

        {/* 进度条 */}
        <div className="space-y-2">
          <div className="w-full bg-muted rounded-full h-2 sm:h-3 overflow-hidden">
            <div
              className="h-2 sm:h-3 rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-primary to-primary/90"
              style={{ width: `${animatedPercentage}%` }}
            >
              {/* 动画光效 */}
              <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </div>
          </div>

          {/* 统计信息 */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center space-x-3 sm:space-x-4">
              {showSpeed && progress.speed && (
                <div className="flex items-center space-x-1">
                  <Zap className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">{t('progress.itemsPerSecond', { count: Math.round(progress.speed) })}</span>
                </div>
              )}
              {showETA && progress.estimated_remaining && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">{t('progress.remaining', { time: formatTime(progress.estimated_remaining, t) })}</span>
                </div>
              )}
            </div>
            <div className="whitespace-nowrap">
              {t('progress.processed', { count: progress.current })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 默认模式
  return (
    <div className={`space-y-2 sm:space-y-3 ${className}`}>
      {/* 状态和百分比 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {isComplete ? (
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-success flex-shrink-0" />
          ) : (
            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary animate-spin flex-shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-medium text-foreground truncate">
            {progress.status}
          </span>
        </div>
        <span className="text-xs sm:text-sm font-medium text-foreground flex-shrink-0 ml-2">
          {Math.round(animatedPercentage)}%
        </span>
      </div>

      {/* 进度条 */}
      <div className="w-full bg-muted rounded-full h-1.5 sm:h-2 overflow-hidden">
        <div
          className="bg-primary h-1.5 sm:h-2 rounded-full transition-all duration-500 ease-out relative"
          style={{ width: `${animatedPercentage}%` }}
        >
          {/* 动画条纹 */}
          {!isComplete && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
          )}
        </div>
      </div>

      {/* 详细信息 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0 text-xs text-muted-foreground">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <span className="whitespace-nowrap">{progress.current} / {progress.total}</span>
          {showSpeed && progress.speed && (
            <span className="whitespace-nowrap">{t('progress.itemsPerSecond', { count: Math.round(progress.speed) })}</span>
          )}
          {showETA && progress.estimated_remaining && (
            <span className="whitespace-nowrap">{t('progress.remaining', { time: formatTime(progress.estimated_remaining, t) })}</span>
          )}
        </div>
        {progress.message && (
          <span className="text-xs text-muted-foreground truncate">
            {progress.message}
          </span>
        )}
      </div>
    </div>
  )
}

// 工具函数：格式化时间
function formatTime(seconds: number, t: (key: string, options?: Record<string, unknown>) => string): string {
  if (seconds < 60) {
    return t('time.seconds', { count: Math.round(seconds) })
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return remainingSeconds > 0 
      ? t('time.minutesSeconds', { minutes, seconds: remainingSeconds })
      : t('time.minutes', { count: minutes })
  } else {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return minutes > 0 
      ? t('time.hoursMinutes', { hours, minutes })
      : t('time.hours', { count: hours })
  }
}
