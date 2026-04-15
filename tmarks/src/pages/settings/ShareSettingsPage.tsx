import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useShareSettings, useUpdateShareSettings } from '@/hooks/useShare'

export function ShareSettingsPage() {
  const { t } = useTranslation('share')
  const { data, isLoading } = useShareSettings()
  const updateShare = useUpdateShareSettings()

  const [enabled, setEnabled] = useState(false)
  const [slug, setSlug] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!data) return
    setEnabled(data.enabled)
    setSlug(data.slug || '')
    setTitle(data.title || '')
    setDescription(data.description || '')
  }, [data])

  const shareUrl = useMemo(() => {
    if (!slug) return ''
    if (typeof window === 'undefined') return `/share/${slug}`
    return `${window.location.origin}/share/${slug}`
  }, [slug])

  const handleSave = () => {
    updateShare.mutate({
      enabled,
      slug: slug.trim() || null,
      title: title.trim() || null,
      description: description.trim() || null,
    })
  }

  const handleRegenerate = () => {
    updateShare.mutate({
      regenerate_slug: true,
      enabled: true,
      title: title.trim() || null,
      description: description.trim() || null,
    })
  }

  const handleCopy = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (error) {
      console.error('Copy failed', error)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">{t('settings.title')}</h1>

      <div className="card p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{t('settings.enableTitle')}</h2>
            <p className="text-sm text-base-content/70">{t('settings.enableDescription')}</p>
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <span>{t('settings.enableLabel')}</span>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              disabled={isLoading || updateShare.isPending}
            />
          </label>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-base-content/70">{t('settings.slugLabel')}</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="input flex-1"
                placeholder={t('settings.slugPlaceholder')}
                value={slug}
                onChange={(e) => setSlug(e.target.value.replace(/[^a-zA-Z0-9-]/g, '').replace(/^-+|-+$/g, '').toLowerCase())}
                disabled={isLoading || updateShare.isPending}
              />
              <button
                type="button"
                className="btn btn-sm"
                onClick={handleRegenerate}
                disabled={updateShare.isPending}
              >
                {t('settings.regenerate')}
              </button>
            </div>
            <p className="text-xs text-base-content/60">{t('settings.slugHint')}</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-base-content/70">{t('settings.pageTitleLabel')}</label>
            <input
              type="text"
              className="input"
              placeholder={t('settings.pageTitlePlaceholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading || updateShare.isPending}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-base-content/70">{t('settings.descriptionLabel')}</label>
          <textarea
            className="input min-h-[80px]"
            placeholder={t('settings.descriptionPlaceholder')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading || updateShare.isPending}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-base-content/70">{t('settings.linkLabel')}</label>
          <div className="flex gap-2">
            <input
              type="text"
              className="input flex-1"
              readOnly
              value={shareUrl || t('settings.linkPlaceholder')}
            />
            <button
              type="button"
              className="btn btn-sm"
              onClick={handleCopy}
              disabled={!shareUrl}
            >
              {copied ? t('settings.copied') : t('settings.copy')}
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={() => {
              if (!data) return
              setEnabled(data.enabled)
              setSlug(data.slug || '')
              setTitle(data.title || '')
              setDescription(data.description || '')
            }}
            disabled={isLoading || updateShare.isPending}
          >
            {t('settings.reset')}
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={handleSave}
            disabled={updateShare.isPending}
          >
            {updateShare.isPending ? t('settings.saving') : t('settings.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
