import { ExternalLink, AlertCircle, Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function PermissionsPage() {
  const { t } = useTranslation('settings')

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">{t('browserPermissions.title')}</h1>
        <p className="text-muted-foreground">
          {t('browserPermissions.description')}
        </p>
      </div>

      {/* Popup permission card */}
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <ExternalLink className="w-6 h-6 text-primary" />
          </div>
          
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {t('browserPermissions.popup.title')}
            </h2>
            <p className="text-muted-foreground">
              {t('browserPermissions.popup.description')}
            </p>
          </div>
        </div>
      </div>

      {/* How to instructions */}
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-3 mb-4">
          <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-foreground mb-2">{t('browserPermissions.howTo.title')}</h3>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="font-semibold text-foreground">1.</span>
                <span>{t('browserPermissions.howTo.step1')}</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-foreground">2.</span>
                <span>{t('browserPermissions.howTo.step2')}</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-foreground">3.</span>
                <span>{t('browserPermissions.howTo.step3')}</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-foreground">4.</span>
                <span>{t('browserPermissions.howTo.step4')}</span>
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Browser-specific instructions */}
      <div className="card p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-foreground mb-3">{t('browserPermissions.browsers.title')}</h3>
            
            <div className="space-y-4 text-sm">
              {/* Chrome */}
              <div>
                <h4 className="font-semibold text-foreground mb-1">{t('browserPermissions.browsers.chrome.title')}</h4>
                <p className="text-muted-foreground">
                  {t('browserPermissions.browsers.chrome.description')}
                </p>
              </div>

              {/* Firefox */}
              <div>
                <h4 className="font-semibold text-foreground mb-1">{t('browserPermissions.browsers.firefox.title')}</h4>
                <p className="text-muted-foreground">
                  {t('browserPermissions.browsers.firefox.description')}
                </p>
              </div>

              {/* Safari */}
              <div>
                <h4 className="font-semibold text-foreground mb-1">{t('browserPermissions.browsers.safari.title')}</h4>
                <p className="text-muted-foreground">
                  {t('browserPermissions.browsers.safari.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why popup permission is needed */}
      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <h4 className="font-semibold text-foreground mb-2">{t('browserPermissions.why.title')}</h4>
        <p className="text-sm text-muted-foreground">
          {t('browserPermissions.why.description')}
        </p>
      </div>
    </div>
  )
}
