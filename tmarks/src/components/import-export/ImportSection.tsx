/**
 * 导入功能组件
 * 提供书签数据导入功能的用户界面
 */

import { useState, useRef } from 'react'
import { Upload, FileText, Code, CheckCircle, Loader2 } from 'lucide-react'
import { DragDropUpload } from '../common/DragDropUpload'
import { ProgressIndicator } from '../common/ProgressIndicator'
import { ErrorDisplay } from '../common/ErrorDisplay'
import type {
  ImportFormat,
  ImportOptions,
  ImportResult,
  ValidationResult
} from '../../../shared/import-export-types'

interface ImportSectionProps {
  onImport?: (result: ImportResult) => void
}

interface ImportProgress {
  current: number
  total: number
  status: string
}

export function ImportSection({ onImport }: ImportSectionProps) {
  const [selectedFormat, setSelectedFormat] = useState<ImportFormat>('html')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [options, setOptions] = useState<ImportOptions>({
    skip_duplicates: true,
    create_missing_tags: true,
    preserve_timestamps: true,
    batch_size: 50,
    max_concurrent: 5,
    default_tag_color: '#3b82f6',
    folder_as_tag: true
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  // 格式选项
  const formatOptions = [
    {
      value: 'html' as ImportFormat,
      label: 'HTML',
      description: '浏览器导出的书签文件',
      icon: FileText,
      extensions: ['.html', '.htm'],
      recommended: true
    },
    {
      value: 'json' as ImportFormat,
      label: 'JSON',
      description: 'JSON 格式的书签数据',
      icon: Code,
      extensions: ['.json'],
      recommended: false
    }
  ]

  // 文件选择处理
  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setImportResult(null)
    setValidationResult(null)
    validateFile(file)
  }



  // 文件验证
  const validateFile = async (file: File) => {
    try {
      const content = await file.text()
      
      const response = await fetch('/api/v1/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: selectedFormat,
          content,
          options: { ...options, batch_size: 1 } // 只验证，不实际导入
        })
      })

      if (response.ok) {
        setValidationResult({ valid: true, errors: [], warnings: [] })
      } else {
        const error = await response.json()
        setValidationResult({
          valid: false,
          errors: error.errors || [{ field: 'file', message: error.message }],
          warnings: error.warnings || []
        })
      }
    } catch (error) {
      setValidationResult({
        valid: false,
        errors: [{ field: 'file', message: '文件读取失败' }],
        warnings: []
      })
    }
  }

  // 执行导入
  const handleImport = async () => {
    if (!selectedFile) return

    setIsImporting(true)
    setImportProgress({ current: 0, total: 100, status: '准备导入...' })

    try {
      const content = await selectedFile.text()
      
      const response = await fetch('/api/v1/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: selectedFormat,
          content,
          options
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '导入失败')
      }

      const result: ImportResult = await response.json()
      setImportResult(result)
      onImport?.(result)

    } catch (error) {
      console.error('Import failed:', error)
      setImportResult({
        success: 0,
        failed: 1,
        skipped: 0,
        total: 1,
        errors: [{
          index: 0,
          item: { title: '', url: '', tags: [] },
          error: error instanceof Error ? error.message : '未知错误',
          code: 'UNKNOWN_ERROR'
        }],
        created_bookmarks: [],
        created_tags: []
      })
    } finally {
      setIsImporting(false)
      setImportProgress(null)
    }
  }

  // 重置状态
  const handleReset = () => {
    setSelectedFile(null)
    setImportResult(null)
    setValidationResult(null)
    setImportProgress(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 标题 */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
          导入书签
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          从其他平台导入您的书签数据
        </p>
      </div>

      {/* 格式选择 */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          文件格式
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {formatOptions.map((format) => {
            const Icon = format.icon
            return (
              <div
                key={format.value}
                className={`relative rounded-lg border p-3 sm:p-4 cursor-pointer transition-all touch-manipulation ${
                  selectedFormat === format.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => setSelectedFormat(format.value)}
              >
                <div className="flex items-start space-x-3">
                  <Icon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                        {format.label}
                      </span>
                      {format.recommended && (
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded flex-shrink-0">
                          推荐
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {format.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      支持: {format.extensions.join(', ')}
                    </p>
                  </div>
                  <input
                    type="radio"
                    name="format"
                    value={format.value}
                    checked={selectedFormat === format.value}
                    onChange={() => setSelectedFormat(format.value)}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 flex-shrink-0 mt-0.5"
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 文件选择 */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          选择文件
        </label>

        <DragDropUpload
          onFileSelect={handleFileSelect}
          accept={formatOptions.find(f => f.value === selectedFormat)?.extensions.join(',')}
          maxSize={50 * 1024 * 1024} // 50MB
          disabled={isImporting}
        >
          {selectedFile ? (
            <div className="p-6 text-center">
              <div className="flex flex-col items-center space-y-3">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    文件已选择
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  重新选择
                </button>
              </div>
            </div>
          ) : null}
        </DragDropUpload>
      </div>

      {/* 验证结果 */}
      {validationResult && (
        <ErrorDisplay
          errors={validationResult.errors}
          variant={validationResult.valid ? 'success' : 'error'}
          title={validationResult.valid ? '文件验证通过' : '文件验证失败'}
          dismissible={false}
          collapsible={true}
          showDetails={true}
        />
      )}

      {/* 导入选项 */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          导入选项
        </label>
        
        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={options.skip_duplicates}
              onChange={(e) => setOptions(prev => ({
                ...prev,
                skip_duplicates: e.target.checked
              }))}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              跳过重复的书签
            </span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={options.create_missing_tags}
              onChange={(e) => setOptions(prev => ({
                ...prev,
                create_missing_tags: e.target.checked
              }))}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              自动创建缺失的标签
            </span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={options.preserve_timestamps}
              onChange={(e) => setOptions(prev => ({
                ...prev,
                preserve_timestamps: e.target.checked
              }))}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              保留原始时间戳
            </span>
          </label>

          {selectedFormat === 'html' && (
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={options.folder_as_tag}
                onChange={(e) => setOptions(prev => ({
                  ...prev,
                  folder_as_tag: e.target.checked
                }))}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                将文件夹转换为标签
              </span>
            </label>
          )}
        </div>
      </div>

      {/* 导入进度 */}
      {importProgress && (
        <ProgressIndicator
          progress={{
            current: importProgress.current,
            total: importProgress.total,
            percentage: (importProgress.current / importProgress.total) * 100,
            status: importProgress.status,
            message: `正在处理第 ${importProgress.current} / ${importProgress.total} 项`
          }}
          variant="detailed"
          showSpeed={true}
          showETA={true}
        />
      )}

      {/* 导入结果 */}
      {importResult && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            导入结果
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center sm:text-left">
              <div className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">
                {importResult.success}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                成功导入
              </div>
            </div>
            <div className="text-center sm:text-left">
              <div className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400">
                {importResult.failed}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                导入失败
              </div>
            </div>
            <div className="text-center sm:text-left">
              <div className="text-lg sm:text-xl font-bold text-yellow-600 dark:text-yellow-400">
                {importResult.skipped}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                跳过重复
              </div>
            </div>
            <div className="text-center sm:text-left">
              <div className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">
                {importResult.total}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                总计处理
              </div>
            </div>
          </div>

          {/* 成功率指示器 */}
          {importResult.total > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">成功率</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {Math.round((importResult.success / importResult.total) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-600 dark:bg-green-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(importResult.success / importResult.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {importResult.errors.length > 0 && (
            <div className="mt-4">
              <ErrorDisplay
                errors={importResult.errors.map(error => ({
                  message: error.error,
                  code: error.code,
                  details: `书签: ${error.item.title || error.item.url}`
                }))}
                variant="error"
                title={`导入错误 (${importResult.errors.length})`}
                dismissible={false}
                collapsible={true}
                maxVisible={2}
              />
            </div>
          )}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex space-x-3">
        <button
          onClick={handleImport}
          disabled={!selectedFile || !validationResult?.valid || isImporting}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 sm:py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
        >
          {isImporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          <span>{isImporting ? '导入中...' : '开始导入'}</span>
        </button>
      </div>
    </div>
  )
}

// 工具函数：格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
