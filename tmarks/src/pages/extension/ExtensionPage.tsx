import { useTranslation } from 'react-i18next'
import { Download, Chrome, CheckCircle, AlertCircle } from 'lucide-react'

const EXTENSION_ZIP = 'tmarks-extension-chrome.zip'
const CHROMIUM_BROWSERS = ['Chrome', 'Edge', 'Brave', 'Opera', '360', 'QQ', 'Sogou']

export function ExtensionPage() {
  const { t } = useTranslation('info')

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = `/extensions/${EXTENSION_ZIP}`
    link.download = EXTENSION_ZIP
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const featureKeys = ['saveTabGroups', 'restoreTabs', 'autoSync'] as const
  const installSteps = [1, 2, 3, 4, 5, 6] as const

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-float">
          <Chrome className="w-12 h-12" style={{ color: 'var(--foreground)' }} />
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
          {t('extension.title')}
        </h1>
        <p className="text-lg" style={{ color: 'var(--muted-foreground)' }}>
          {t('extension.subtitle')}
        </p>
      </div>

      <div className="card shadow-float mb-8 bg-gradient-to-br from-primary/5 to-secondary/5">
        <h2 className="text-xl font-bold mb-4 text-center" style={{ color: 'var(--foreground)' }}>
          {t('extension.download.title')}
        </h2>

        <div className="max-w-md mx-auto text-center p-4 rounded-xl border-2" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center">
            <Chrome className="w-12 h-12" style={{ color: 'var(--foreground)' }} />
          </div>
          <h3 className="text-base font-bold mb-1" style={{ color: 'var(--foreground)' }}>
            Chrome / Chromium
          </h3>
          <p className="text-xs mb-3" style={{ color: 'var(--muted-foreground)' }}>
            {CHROMIUM_BROWSERS.join(' / ')}
          </p>
          <button
            onClick={handleDownload}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <Download className="w-4 h-4" />
            {t('extension.download.button')}
          </button>
        </div>
      </div>

      <div className="card shadow-float mb-8">
        <h2 className="text-xl font-bold mb-4 text-center" style={{ color: 'var(--foreground)' }}>
          {t('extension.browsers.title')}
        </h2>

        <div className="flex flex-wrap justify-center gap-2">
          {CHROMIUM_BROWSERS.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-muted/30"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              <Chrome className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{name}</span>
            </span>
          ))}
        </div>

        <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/10 text-center">
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {t('extension.version', { version: '1.0.4', size: '428 KB', date: '2026-02-06' })}
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--muted-foreground)' }}>
            {t('extension.tip')}
          </p>
        </div>
      </div>

      <div className="card shadow-float mb-8">
        <h2 className="text-xl font-bold mb-6 text-center" style={{ color: 'var(--foreground)' }}>
          {t('extension.features.title')}
        </h2>

        <div className="grid md:grid-cols-3 gap-4">
          {featureKeys.map((key) => (
            <div key={key} className="p-5 rounded-xl border bg-muted/20" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
                    {t(`extension.features.${key}.title`)}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    {t(`extension.features.${key}.description`)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card shadow-float mb-8">
        <h2 className="text-xl font-bold mb-6 text-center" style={{ color: 'var(--foreground)' }}>
          {t('extension.install.title')}
        </h2>

        <div className="space-y-4 max-w-3xl mx-auto">
          {installSteps.map((step) => (
            <div key={step} className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">{step}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                  {t(`extension.install.step${step}.title`)}
                </h3>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  {t(`extension.install.step${step}.description`)}
                </p>
                {step === 3 && (
                  <div className="mt-2 p-3 bg-muted/30 rounded-lg border border-border text-sm">
                    <p className="mb-1">Chrome: chrome://extensions/</p>
                    <p>Edge: edge://extensions/</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card shadow-float bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 mb-8">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-primary" />
          <div>
            <h3 className="font-medium mb-2" style={{ color: 'var(--foreground)' }}>
              {t('extension.tips.title')}
            </h3>
            <ul className="text-sm space-y-1" style={{ color: 'var(--muted-foreground)' }}>
              <li>• {t('extension.tips.tip1')}</li>
              <li>• {t('extension.tips.tip2')}</li>
              <li>• {t('extension.tips.tip3')}</li>
              <li>• {t('extension.tips.tip4')}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="card shadow-float">
        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
          {t('extension.faq.title')}
        </h2>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n}>
              <h3 className="font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                Q: {t(`extension.faq.q${n}`)}
              </h3>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                A: {t(`extension.faq.a${n}`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

