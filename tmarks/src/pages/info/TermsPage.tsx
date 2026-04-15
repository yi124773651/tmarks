import { useTranslation } from 'react-i18next'
import { FileText, AlertCircle, Scale, Ban } from 'lucide-react'

export function TermsPage() {
  const { t } = useTranslation('info')

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
      {/* 标题 */}
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">{t('terms.title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('terms.lastUpdated', { date: '2024-11-19' })}
        </p>
      </div>

      {/* 简介 */}
      <div className="card p-6 space-y-3">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold text-foreground">{t('terms.welcome.title')}</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t('terms.welcome.description')}
        </p>
      </div>

      {/* 服务说明 */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">{t('terms.service.title')}</h2>
        <div className="card p-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            {t('terms.service.description')}
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{t('terms.service.item1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{t('terms.service.item2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{t('terms.service.item3')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{t('terms.service.item4')}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 用户责任 */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">{t('terms.responsibility.title')}</h2>
        <div className="card p-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            {t('terms.responsibility.description')}
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{t('terms.responsibility.item1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{t('terms.responsibility.item2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{t('terms.responsibility.item3')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{t('terms.responsibility.item4')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{t('terms.responsibility.item5')}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 禁止行为 */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Ban className="w-5 h-5 text-error" />
          <h2 className="text-xl font-bold text-foreground">{t('terms.prohibited.title')}</h2>
        </div>
        <div className="card p-6 border-error/20">
          <p className="text-sm text-muted-foreground mb-3">
            {t('terms.prohibited.description')}
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-error mt-0.5">✗</span>
              <span>{t('terms.prohibited.item1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-error mt-0.5">✗</span>
              <span>{t('terms.prohibited.item2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-error mt-0.5">✗</span>
              <span>{t('terms.prohibited.item3')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-error mt-0.5">✗</span>
              <span>{t('terms.prohibited.item4')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-error mt-0.5">✗</span>
              <span>{t('terms.prohibited.item5')}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 知识产权 */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Scale className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">{t('terms.ip.title')}</h2>
        </div>
        <div className="card p-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            {t('terms.ip.description1')}
          </p>
          <p className="text-sm text-muted-foreground">
            {t('terms.ip.description2')}
          </p>
        </div>
      </div>

      {/* 服务变更和终止 */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">{t('terms.changes.title')}</h2>
        <div className="card p-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            {t('terms.changes.description1')}
          </p>
          <p className="text-sm text-muted-foreground">
            {t('terms.changes.description2')}
          </p>
        </div>
      </div>

      {/* 免责声明 */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-warning" />
          <h2 className="text-xl font-bold text-foreground">{t('terms.disclaimer.title')}</h2>
        </div>
        <div className="card p-6 border-warning/20">
          <p className="text-sm text-muted-foreground mb-3">
            {t('terms.disclaimer.description')}
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-warning mt-0.5">!</span>
              <span>{t('terms.disclaimer.item1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-warning mt-0.5">!</span>
              <span>{t('terms.disclaimer.item2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-warning mt-0.5">!</span>
              <span>{t('terms.disclaimer.item3')}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 责任限制 */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">{t('terms.liability.title')}</h2>
        <div className="card p-6">
          <p className="text-sm text-muted-foreground">
            {t('terms.liability.description')}
          </p>
        </div>
      </div>

      {/* 条款变更 */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">{t('terms.termChanges.title')}</h2>
        <div className="card p-6">
          <p className="text-sm text-muted-foreground">
            {t('terms.termChanges.description')}
          </p>
        </div>
      </div>

      {/* 适用法律 */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">{t('terms.law.title')}</h2>
        <div className="card p-6">
          <p className="text-sm text-muted-foreground">
            {t('terms.law.description')}
          </p>
        </div>
      </div>

      {/* 联系我们 */}
      <div className="card p-6 space-y-3">
        <h2 className="text-xl font-bold text-foreground">{t('terms.contact.title')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('terms.contact.description')}
        </p>
        <div className="text-sm text-muted-foreground">
          <p>{t('terms.contact.email')}<a href="mailto:legal@tmarks.com" className="text-primary hover:underline">legal@tmarks.com</a></p>
        </div>
      </div>
    </div>
  )
}
