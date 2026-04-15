/**
 * 导出功能组件
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Code, Loader2 } from 'lucide-react'
import { ProgressIndicator } from '../common/ProgressIndicator'
import { ErrorDisplay } from '../common/ErrorDisplay'
import { ExportOptionsForm, type ExportScope } from './ExportOptionsForm'
import { useAuthStore } from '@/stores/authStore'
import type { ExportFormat, ExportOptions } from '@shared/import-export-types'

interface ExportSectionProps {
  onExport?: (format: ExportFormat, options: ExportOptions) => void
}

interface ExportStats {
  total_bookmarks: number
  total_tags: number
  pinned_bookmarks: number
  total_tab_groups: number
  estimated_size: number
}

export function ExportSection({ onExport }: ExportSectionProps) {
  const { t } = useTranslation('import')
  const exportFormat: ExportFormat = 'json'
  const [isExporting, setIsExporting] = useState(false)
  const [scope, setScope] = useState<ExportScope>('all')
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const [exportStats, setExportStats] = useState<ExportStats | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const [exportProgress, setExportProgress] = useState<{
    current: number
    total: number
    status: string
  } | null>(null)
  const [options, setOptions] = useState<ExportOptions>({
    include_tags: true,
    include_metadata: true,
    format_options: {
      pretty_print: true,
      include_click_stats: false,
      include_user_info: false
    }
  })

  const fetchExportPreview = async () => {
    try {
      const token = useAuthStore.getState().accessToken
      const response = await fetch('/api/v1/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ format: exportFormat, scope, include_deleted: includeDeleted })
      })

      if (response.ok) {
        const data = await response.json()
        setExportStats({
          ...data.stats,
          estimated_size: data.estimated_size
        })
      }
    } catch (error) {
      console.error('Failed to fetch export preview:', error)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    setExportError(null)
    setExportProgress({ current: 0, total: 100, status: t('export.preparing') })

    try {
      const params = new URLSearchParams({
        format: exportFormat,
        scope,
        include_deleted: includeDeleted.toString(),
        include_metadata: options.include_metadata.toString(),
        include_tags: options.include_tags.toString(),
        pretty_print: options.format_options?.pretty_print?.toString() || 'true',
        include_stats: options.format_options?.include_click_stats?.toString() || 'false',
        include_user: options.format_options?.include_user_info?.toString() || 'false'
      })

      setExportProgress({ current: 25, total: 100, status: t('export.generating') })

      const token = useAuthStore.getState().accessToken
      const response = await fetch(`/api/v1/export?${params}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Export failed')
      }

      setExportProgress({ current: 75, total: 100, status: t('export.downloading') })

      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition?.match(/filename="([^"]+)"/)?.[1] ||
                     `tmarks-export-${Date.now()}.json`

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      setExportProgress({ current: 100, total: 100, status: t('export.complete') })
      onExport?.(exportFormat, options)

    } catch (error) {
      const message = error instanceof Error ? error.message : t('export.failedRetry')
      setExportError(message)
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
      setTimeout(() => setExportProgress(null), 2000)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-foreground">
          {t('export.title')}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {t('export.description')}
        </p>
      </div>

      <div className="space-y-2">
        <div className="block text-sm font-medium text-foreground">
          {t('export.selectFormat')}
        </div>
        <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 sm:p-4">
          <Code className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground text-sm sm:text-base">
                {t('format.json')}
              </span>
              <span className="px-2 py-0.5 text-xs bg-success/10 text-success rounded flex-shrink-0">
                {t('format.recommended')}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {t('format.jsonDesc')}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-foreground">
          {t('export.options')}
        </label>

        <ExportOptionsForm
          scope={scope}
          setScope={setScope}
          includeDeleted={includeDeleted}
          setIncludeDeleted={setIncludeDeleted}
          options={options}
          setOptions={setOptions}
          disabled={isExporting}
        />
      </div>

      {exportStats && (
        <div className="bg-muted rounded-lg p-3 sm:p-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">{t('export.previewTitle')}</h4>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
            <div className="text-center sm:text-left">
              <div className="text-lg sm:text-xl font-bold text-primary">{exportStats.total_bookmarks}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">{t('export.bookmarkCount')}</div>
            </div>
            <div className="text-center sm:text-left">
              <div className="text-lg sm:text-xl font-bold text-success">{exportStats.total_tags}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">{t('export.tagCount')}</div>
            </div>
            <div className="text-center sm:text-left">
              <div className="text-lg sm:text-xl font-bold text-warning">{exportStats.pinned_bookmarks}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">{t('export.pinnedCount')}</div>
            </div>
            <div className="text-center sm:text-left">
              <div className="text-lg sm:text-xl font-bold text-primary">{exportStats.total_tab_groups}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">{t('export.tabGroupCount')}</div>
            </div>
            <div className="text-center sm:text-left">
              <div className="text-lg sm:text-xl font-bold text-foreground">{formatFileSize(exportStats.estimated_size)}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">{t('export.estimatedSize')}</div>
            </div>
          </div>
        </div>
      )}

      {exportProgress && (
        <ProgressIndicator
          progress={{
            current: exportProgress.current,
            total: exportProgress.total,
            percentage: (exportProgress.current / exportProgress.total) * 100,
            status: exportProgress.status
          }}
          variant="default"
          showSpeed={false}
          showETA={false}
        />
      )}

      {exportError && (
        <ErrorDisplay
          errors={[{ message: exportError }]}
          variant="error"
          title={t('export.failed')}
          dismissible={true}
          onDismiss={() => setExportError(null)}
          onRetry={handleExport}
        />
      )}

      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
        <button
          onClick={fetchExportPreview}
          disabled={isExporting}
          className="w-full sm:w-auto px-4 py-3 sm:py-2 text-sm font-medium text-foreground bg-card border border-border rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
        >
          {t('export.preview')}
        </button>

        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-3 sm:py-2 text-sm font-medium text-primary-foreground bg-primary border border-transparent rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span>{isExporting ? t('export.exporting') : t('export.startExport')}</span>
        </button>
      </div>
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
