import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { X, Copy, Check, Share2, Eye } from 'lucide-react'
import { tabGroupsService } from '@/services/tab-groups'
import type { Share } from '@/lib/types'
import { Z_INDEX } from '@/lib/constants/z-index'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { AlertDialog } from '@/components/common/AlertDialog'

interface ShareDialogProps {
  groupId: string
  groupTitle: string
  onClose: () => void
}

export function ShareDialog({ groupId, groupTitle, onClose }: ShareDialogProps) {
  const { t } = useTranslation('tabGroups')
  const { t: tc } = useTranslation('common')
  const isMobile = useIsMobile()
  const [share, setShare] = useState<Share | null>(null)
  const [shareUrl, setShareUrl] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isCopied, setIsCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showCopyError, setShowCopyError] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const loadOrCreateShare = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      try {
        const response = await tabGroupsService.getShare(groupId)
        setShare(response.share)
        setShareUrl(response.share_url)
      } catch {
        const response = await tabGroupsService.createShare(groupId, { is_public: true })
        setShare(response.share)
        setShareUrl(response.share_url)
      }
    } catch (error) {
      console.error('Failed to load/create share:', error)
      setError(t('share.createFailed'))
    } finally {
      setIsLoading(false)
    }
  }, [groupId, t])

  useEffect(() => {
    loadOrCreateShare()
  }, [loadOrCreateShare])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      setShowCopyError(true)
    }
  }

  const handleDelete = async () => {
    try {
      await tabGroupsService.deleteShare(groupId)
      onClose()
    } catch (err) {
      console.error('Failed to delete share:', err)
      setError(t('share.deleteFailed'))
    }
  }

  const dialogContent = (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6" style={{ zIndex: Z_INDEX.SHARE_DIALOG }} onClick={onClose}>
      <div className="rounded-2xl sm:rounded-3xl shadow-xl max-w-md w-full border border-border" style={{backgroundColor: 'var(--card)'}} onClick={(e) => e.stopPropagation()}>
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          title={tc('dialog.confirmTitle')}
          message={t('share.confirmDelete')}
          type="warning"
          onConfirm={() => {
            setShowDeleteConfirm(false)
            handleDelete()
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />

        <AlertDialog
          isOpen={showCopyError}
          title={tc('dialog.errorTitle')}
          message={t('share.copyFailed')}
          type="error"
          onConfirm={() => setShowCopyError(false)}
        />

        {/* Header */}
        <div className={`flex items-center justify-between border-b border-border ${isMobile ? 'p-4' : 'p-6'}`}>
          <div className="flex items-center gap-2 sm:gap-3">
            <Share2 className={`text-primary ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
            <h2 className={`font-semibold text-foreground ${isMobile ? 'text-lg' : 'text-xl'}`}>{t('share.title')}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X className={isMobile ? 'w-5 h-5' : 'w-6 h-6'} />
          </button>
        </div>

        {/* Content */}
        <div className={isMobile ? 'p-4' : 'p-6'}>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">{t('share.generating')}</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive mb-4">{error}</p>
              <button
                onClick={loadOrCreateShare}
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                {tc('button.retry')}
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">{t('share.groupName')}</p>
                <p className="text-foreground font-medium">{groupTitle}</p>
              </div>

              {share && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Eye className="w-4 h-4" />
                    <span>{t('share.viewCount')}: {share.view_count}</span>
                  </div>
                </div>
              )}

              <div className="mb-4 sm:mb-6">
                <p className="text-sm text-muted-foreground mb-2">{t('share.link')}</p>
                <div className={`flex gap-2 ${isMobile ? 'flex-col' : ''}`}>
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="input flex-1 text-sm"
                  />
                  <button
                    onClick={handleCopy}
                    className={`bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 ${isMobile ? 'py-3 min-h-[44px]' : 'px-4 py-2'}`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{t('share.copied')}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>{t('share.copy')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded p-3 sm:p-4 mb-4">
                <p className="text-xs sm:text-sm text-foreground">
                  {t('share.tip')}
                </p>
              </div>

              <div className={`flex gap-2 ${isMobile ? 'flex-col-reverse' : 'justify-between'}`}>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className={`text-destructive hover:bg-destructive/10 rounded transition-colors ${isMobile ? 'py-3 min-h-[44px]' : 'px-4 py-2'}`}
                >
                  {t('share.delete')}
                </button>
                <button
                  onClick={onClose}
                  className={`bg-muted text-foreground rounded hover:bg-muted/80 transition-colors ${isMobile ? 'py-3 min-h-[44px]' : 'px-4 py-2'}`}
                >
                  {t('share.close')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(dialogContent, document.body)
}
