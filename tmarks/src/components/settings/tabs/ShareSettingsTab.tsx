/**
 * 分享设置标签页
 * 公开分享书签的配置
 */

import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Share2, Copy, RefreshCw, Info } from 'lucide-react'
import { useShareSettings, useUpdateShareSettings } from '@/hooks/useShare'
import { useToastStore } from '@/stores/toastStore'
import { Toggle } from '@/components/common/Toggle'
import { SettingsSection, SettingsDivider } from '../SettingsSection'
import { InfoBox } from '../InfoBox'

export function ShareSettingsTab() {
  const { t } = useTranslation('settings')
  const { data, isLoading } = useShareSettings()
  const updateShare = useUpdateShareSettings()
  const { addToast } = useToastStore()

  const [enabled, setEnabled] = useState(false)
  const [slug, setSlug] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [, setCopied] = useState(false)

  useEffect(() => {
    if (data) {
      setEnabled(data.enabled || false)
      setSlug(data.slug || '')
      setTitle(data.title || '')
      setDescription(data.description || '')
    }
  }, [data])

  const shareUrl = useMemo(() => {
    if (!slug) return ''
    return `${window.location.origin}/share/${slug}`
  }, [slug])

  const handleSave = async () => {
    try {
      await updateShare.mutateAsync({
        enabled,
        slug: slug.trim() || null,
        title: title.trim() || null,
        description: description.trim() || null,
      })
      addToast('success', t('share.saveSuccess'))
    } catch {
      addToast('error', t('share.saveFailed'))
    }
  }

  const handleRegenerate = async () => {
    try {
      await updateShare.mutateAsync({
        regenerate_slug: true,
        enabled: true,
        title: title.trim() || null,
        description: description.trim() || null,
      })
      addToast('success', t('share.regenerateSuccess'))
    } catch {
      addToast('error', t('share.regenerateFailed'))
    }
  }

  const handleCopyLink = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
      addToast('success', t('share.copySuccess'))
    } catch {
      addToast('error', t('share.copyFailed'))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 启用分享 */}
      <SettingsSection icon={Share2} title={t('share.publicShare.title')} description={t('share.publicShare.description')}>
        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{t('share.publicShare.enable')}</div>
              <div className="text-xs text-muted-foreground">{t('share.publicShare.enableHint')}</div>
            </div>
            <Toggle checked={enabled} onChange={setEnabled} />
          </div>
        </div>
      </SettingsSection>

      {enabled && (
        <>
          <SettingsDivider />

          {/* 分享配置 */}
          <SettingsSection icon={Copy} title={t('share.shareLink.label')} description={t('share.slug.hint')}>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Slug */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('share.slug.label')}</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder={t('share.slug.placeholder')}
                      className="input flex-1"
                      disabled={updateShare.isPending}
                    />
                    <button
                      onClick={handleRegenerate}
                      disabled={updateShare.isPending}
                      className="btn btn-ghost px-3"
                      title={t('share.slug.regenerate')}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 标题 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('share.pageTitle.label')}</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('share.pageTitle.placeholder')}
                    className="input"
                    disabled={updateShare.isPending}
                  />
                </div>
              </div>

              {/* 描述 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('share.pageDescription.label')}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('share.pageDescription.placeholder')}
                  className="input min-h-[60px]"
                  disabled={updateShare.isPending}
                />
              </div>

              {/* 分享链接和保存 */}
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl || t('share.shareLink.placeholder')}
                  className="input flex-1 bg-muted/30"
                />
                <button
                  onClick={handleCopyLink}
                  disabled={!shareUrl}
                  className="btn btn-ghost"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateShare.isPending}
                  className="btn btn-primary"
                >
                  {updateShare.isPending ? t('action.saving') : t('action.save')}
                </button>
              </div>
            </div>
          </SettingsSection>
        </>
      )}

      <SettingsDivider />

      <InfoBox icon={Info} title={t('share.infoBox.title')} variant="success">
        <ul className="space-y-1 text-xs">
          <li>• {t('share.infoBox.tip1')}</li>
          <li>• {t('share.infoBox.tip2')}</li>
        </ul>
      </InfoBox>
    </div>
  )
}
