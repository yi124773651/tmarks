import { useTranslation } from 'react-i18next'
import { Shield, Lock, Eye, Database, UserCheck } from 'lucide-react'

export function PrivacyPage() {
  const { t } = useTranslation('info')

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
      {/* 标题 */}
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">{t('privacy.title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('privacy.lastUpdated', { date: '2024-11-19' })}
        </p>
      </div>

      {/* 简介 */}
      <div className="card p-6 space-y-3">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold text-foreground">{t('privacy.commitment.title')}</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t('privacy.commitment.description')}
        </p>
      </div>

      {/* 信息收集 */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">{t('privacy.collection.title')}</h2>
        </div>
        <div className="card p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">{t('privacy.collection.account.title')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('privacy.collection.account.description')}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">{t('privacy.collection.bookmarks.title')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('privacy.collection.bookmarks.description')}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">{t('privacy.collection.usage.title')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('privacy.collection.usage.description')}
            </p>
          </div>
        </div>
      </div>

      {/* 信息使用 */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Eye className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">{t('privacy.usage.title')}</h2>
        </div>
        <div className="card p-6">
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{t('privacy.usage.item1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{t('privacy.usage.item2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{t('privacy.usage.item3')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{t('privacy.usage.item4')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{t('privacy.usage.item5')}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 数据安全 */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">{t('privacy.security.title')}</h2>
        </div>
        <div className="card p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('privacy.security.description')}
          </p>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-success mt-0.5">✓</span>
              <span>{t('privacy.security.item1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-success mt-0.5">✓</span>
              <span>{t('privacy.security.item2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-success mt-0.5">✓</span>
              <span>{t('privacy.security.item3')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-success mt-0.5">✓</span>
              <span>{t('privacy.security.item4')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-success mt-0.5">✓</span>
              <span>{t('privacy.security.item5')}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 用户权利 */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <UserCheck className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">{t('privacy.rights.title')}</h2>
        </div>
        <div className="card p-6">
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{t('privacy.rights.access')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{t('privacy.rights.modify')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{t('privacy.rights.delete')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{t('privacy.rights.export')}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Cookie 使用 */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">{t('privacy.cookies.title')}</h2>
        <div className="card p-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            {t('privacy.cookies.description')}
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{t('privacy.cookies.item1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{t('privacy.cookies.item2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{t('privacy.cookies.item3')}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 第三方服务 */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">{t('privacy.thirdParty.title')}</h2>
        <div className="card p-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            {t('privacy.thirdParty.description')}
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{t('privacy.thirdParty.cloudflare')}</span>
            </li>
          </ul>
          <p className="text-sm text-muted-foreground">
            {t('privacy.thirdParty.note')}
          </p>
        </div>
      </div>

      {/* 政策更新 */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">{t('privacy.updates.title')}</h2>
        <div className="card p-6">
          <p className="text-sm text-muted-foreground">
            {t('privacy.updates.description')}
          </p>
        </div>
      </div>

      {/* 联系我们 */}
      <div className="card p-6 space-y-3">
        <h2 className="text-xl font-bold text-foreground">{t('privacy.contact.title')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('privacy.contact.description')}
        </p>
        <div className="text-sm text-muted-foreground">
          <p>{t('privacy.contact.email')}<a href="mailto:privacy@tmarks.com" className="text-primary hover:underline">privacy@tmarks.com</a></p>
        </div>
      </div>
    </div>
  )
}
