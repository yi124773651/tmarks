/**
 * 拖拽上传组件
 * 支持拖拽和点击上传文件，提供良好的视觉反馈
 */

import { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react'

interface DragDropUploadProps {
  onFileSelect: (file: File) => void
  accept?: string
  maxSize?: number
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}

interface UploadState {
  isDragOver: boolean
  isValidDrag: boolean
  error: string | null
}

export function DragDropUpload({
  onFileSelect,
  accept = '*',
  maxSize = 10 * 1024 * 1024,
  disabled = false,
  className = '',
  children
}: DragDropUploadProps) {
  const { t } = useTranslation('common')
  const [state, setState] = useState<UploadState>({
    isDragOver: false,
    isValidDrag: false,
    error: null
  })
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxSize) {
      return t('upload.fileSizeExceeded', { size: formatFileSize(maxSize) })
    }

    if (accept !== '*') {
      const acceptedTypes = accept.split(',').map(type => type.trim())
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      const isValidType = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return type === fileExtension
        }
        return file.type.match(type.replace('*', '.*'))
      })
      
      if (!isValidType) {
        return t('upload.fileTypeNotSupported', { types: acceptedTypes.join(', ') })
      }
    }

    return null
  }, [accept, maxSize, t])

  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file)
    if (error) {
      setState(prev => ({ ...prev, error }))
      return
    }

    setState(prev => ({ ...prev, error: null }))
    onFileSelect(file)
  }, [validateFile, onFileSelect])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    const isValidDrag = files.length === 1 && files[0] && validateFile(files[0]) === null

    setState(prev => ({
      ...prev,
      isDragOver: true,
      isValidDrag: isValidDrag || false
    }))
  }, [disabled, validateFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setState(prev => ({
        ...prev,
        isDragOver: false,
        isValidDrag: false
      }))
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setState(prev => ({
      ...prev,
      isDragOver: false,
      isValidDrag: false
    }))

    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 1) {
      if (files[0]) {
        handleFileSelect(files[0])
      }
    }
  }, [disabled, handleFileSelect])

  const handleClick = useCallback(() => {
    if (disabled) return
    fileInputRef.current?.click()
  }, [disabled])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  const containerClasses = [
    'relative border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer',
    'hover:border-muted-foreground/50',
    'focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2',
    className
  ]

  if (disabled) {
    containerClasses.push('opacity-50 cursor-not-allowed')
  } else if (state.isDragOver) {
    if (state.isValidDrag) {
      containerClasses.push('border-success bg-success/10')
    } else {
      containerClasses.push('border-destructive bg-destructive/10')
    }
  } else {
    containerClasses.push('border-border')
  }

  return (
    <div className="space-y-3">
      <div
        className={containerClasses.join(' ')}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="sr-only"
          disabled={disabled}
        />

        {children || (
          <div className="p-8 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className={`p-3 rounded-full ${
                state.isDragOver
                  ? state.isValidDrag
                    ? 'bg-success/20'
                    : 'bg-destructive/20'
                  : 'bg-muted'
              }`}>
                {state.isDragOver ? (
                  state.isValidDrag ? (
                    <CheckCircle className="h-8 w-8 text-success" />
                  ) : (
                    <AlertCircle className="h-8 w-8 text-destructive" />
                  )
                ) : (
                  <Upload className="h-8 w-8 text-muted-foreground" />
                )}
              </div>

              <div className="space-y-1">
                <p className="text-base font-medium text-foreground">
                  {state.isDragOver
                    ? state.isValidDrag
                      ? t('upload.dropToUpload')
                      : t('upload.formatNotSupported')
                    : t('upload.dragOrClick')
                  }
                </p>
                {accept !== '*' && !state.isDragOver && (
                  <p className="text-sm text-muted-foreground">
                    {t('upload.supportedFormats', { formats: accept })}
                  </p>
                )}
              </div>

              {!state.isDragOver && (
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 touch-manipulation"
                  disabled={disabled}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {t('upload.selectFile')}
                </button>
              )}
            </div>
          </div>
        )}

        {state.isDragOver && (
          <div className="absolute inset-0 bg-muted/20 rounded-lg pointer-events-none" />
        )}
      </div>

      {state.error && (
        <div className="flex items-center justify-between p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">
              {state.error}
            </span>
          </div>
          <button
            onClick={clearError}
            className="text-destructive hover:text-destructive/80"
          >
            <span className="sr-only">{t('upload.close')}</span>
            ×
          </button>
        </div>
      )}
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
