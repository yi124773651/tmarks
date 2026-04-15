/**
 * 错误显示组件
 * 提供统一的错误状态显示和处理
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  X, 
  ChevronDown, 
  ChevronUp,
  RefreshCw,
  Copy
} from 'lucide-react'

interface ErrorItem {
  id?: string
  message: string
  details?: string
  code?: string
  field?: string
  timestamp?: string
}

interface ErrorDisplayProps {
  errors: ErrorItem[]
  variant?: 'error' | 'warning' | 'info' | 'success'
  title?: string
  dismissible?: boolean
  collapsible?: boolean
  showDetails?: boolean
  maxVisible?: number
  onDismiss?: () => void
  onRetry?: () => void
  className?: string
}

export function ErrorDisplay({
  errors,
  variant = 'error',
  title,
  dismissible = true,
  collapsible = true,
  showDetails = false,
  maxVisible = 3,
  onDismiss,
  onRetry,
  className = ''
}: ErrorDisplayProps) {
  const { t } = useTranslation('common')
  const [isExpanded, setIsExpanded] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  if (errors.length === 0) return null

  // 样式配置
  const variantConfig = {
    error: {
      containerClass: 'bg-destructive/10 border-destructive/20',
      iconClass: 'text-destructive',
      titleClass: 'text-destructive',
      textClass: 'text-destructive/90',
      icon: AlertCircle
    },
    warning: {
      containerClass: 'bg-warning/10 border-warning/20',
      iconClass: 'text-warning',
      titleClass: 'text-warning',
      textClass: 'text-warning/90',
      icon: AlertTriangle
    },
    info: {
      containerClass: 'bg-primary/10 border-primary/20',
      iconClass: 'text-primary',
      titleClass: 'text-primary',
      textClass: 'text-primary/90',
      icon: Info
    },
    success: {
      containerClass: 'bg-success/10 border-success/20',
      iconClass: 'text-success',
      titleClass: 'text-success',
      textClass: 'text-success/90',
      icon: CheckCircle
    }
  }

  const config = variantConfig[variant]
  const Icon = config.icon

  // 显示的错误数量
  const visibleErrors = isExpanded ? errors : errors.slice(0, maxVisible)
  const hasMore = errors.length > maxVisible

  // 复制错误信息
  const copyError = async (error: ErrorItem, index: number) => {
    const errorText = [
      `${t('error.error')}: ${error.message}`,
      error.code && `${t('error.code')}: ${error.code}`,
      error.field && `${t('error.field')}: ${error.field}`,
      error.details && `${t('error.details')}: ${error.details}`,
      error.timestamp && `${t('error.time')}: ${error.timestamp}`
    ].filter(Boolean).join('\n')

    try {
      await navigator.clipboard.writeText(errorText)
      setCopiedId(error.id || index.toString())
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy error:', err)
    }
  }

  return (
    <div className={`rounded-lg border p-3 sm:p-4 ${config.containerClass} ${className}`}>
      {/* 头部 */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
          <Icon className={`h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0 ${config.iconClass}`} />
          <div className="flex-1 min-w-0">
            <h3 className={`text-sm sm:text-base font-semibold ${config.titleClass}`}>
              {title || getDefaultTitle(variant, errors.length, t)}
            </h3>

            {/* 错误列表 */}
            <div className="mt-2 space-y-1.5 sm:space-y-2">
              {visibleErrors.map((error, index) => (
                <ErrorItem
                  key={error.id || index}
                  error={error}
                  index={index}
                  variant={variant}
                  showDetails={showDetails}
                  onCopy={() => copyError(error, index)}
                  isCopied={copiedId === (error.id || index.toString())}
                />
              ))}
            </div>

            {/* 展开/收起按钮 */}
            {hasMore && collapsible && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`mt-3 inline-flex items-center space-x-1 text-xs sm:text-sm font-medium ${config.textClass} hover:underline touch-manipulation`}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>{t('action.collapse')}</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{t('error.showMore', { count: errors.length - maxVisible })}</span>
                    <span className="sm:hidden">{t('error.more', { count: errors.length - maxVisible })}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center space-x-1 sm:space-x-2 ml-2 flex-shrink-0">
          {onRetry && (
            <button
              onClick={onRetry}
              className={`p-1.5 sm:p-2 rounded-md ${config.textClass} hover:bg-muted/50 touch-manipulation`}
              title={t('action.retry')}
            >
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          )}

          {dismissible && (
            <button
              onClick={onDismiss}
              className={`p-1.5 sm:p-2 rounded-md ${config.textClass} hover:bg-muted/50 touch-manipulation`}
              title={t('action.close')}
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * 单个错误项组件
 */
interface ErrorItemProps {
  error: ErrorItem
  index: number
  variant: 'error' | 'warning' | 'info' | 'success'
  showDetails: boolean
  onCopy: () => void
  isCopied: boolean
}

function ErrorItem({ error, variant, showDetails, onCopy, isCopied }: ErrorItemProps) {
  const { t } = useTranslation('common')
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false)

  const variantConfig = {
    error: 'text-destructive/90',
    warning: 'text-warning/90',
    info: 'text-primary/90',
    success: 'text-success/90'
  }

  const textClass = variantConfig[variant]

  return (
    <div className="space-y-1">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className={`text-xs sm:text-sm ${textClass} leading-relaxed`}>
            {error.field && (
              <span className="font-semibold">{error.field}: </span>
            )}
            <span className="break-words">{error.message}</span>
            {error.code && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-muted/50 rounded whitespace-nowrap">
                {error.code}
              </span>
            )}
          </p>

          {error.details && (showDetails || isDetailsExpanded) && (
            <div className="mt-2 p-2 bg-muted/30 rounded text-xs font-mono break-all">
              {error.details}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
          {error.details && !showDetails && (
            <button
              onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
              className={`p-1.5 rounded text-xs ${textClass} hover:bg-muted/50 touch-manipulation`}
              title={t('action.viewDetails')}
            >
              {isDetailsExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          )}

          <button
            onClick={onCopy}
            className={`p-1.5 rounded text-xs ${textClass} hover:bg-muted/50 touch-manipulation`}
            title={isCopied ? t('status.copied') : t('action.copyError')}
          >
            {isCopied ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>

      {error.timestamp && (
        <p className={`text-xs ${textClass} opacity-75 truncate`}>
          {new Date(error.timestamp).toLocaleString()}
        </p>
      )}
    </div>
  )
}

function getDefaultTitle(variant: string, count: number, t: (key: string, options?: Record<string, unknown>) => string): string {
  const titles = {
    error: count === 1 ? t('error.occurred') : t('error.occurredCount', { count }),
    warning: count === 1 ? t('error.warning') : t('error.warningCount', { count }),
    info: count === 1 ? t('error.info') : t('error.infoCount', { count }),
    success: count === 1 ? t('error.success') : t('error.successCount', { count })
  }
  
  return titles[variant as keyof typeof titles] || t('error.notification')
}
