import { useTranslation } from 'react-i18next'
import { HelpCircle, MessageCircle, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'

export function HelpPage() {
  const { t } = useTranslation('info')

  const faqs = [
    { question: t('help.faq.q1'), answer: t('help.faq.a1') },
    { question: t('help.faq.q2'), answer: t('help.faq.a2') },
    { question: t('help.faq.q3'), answer: t('help.faq.a3') },
    { question: t('help.faq.q4'), answer: t('help.faq.a4') },
    { question: t('help.faq.q5'), answer: t('help.faq.a5') },
    { question: t('help.faq.q6'), answer: t('help.faq.a6') },
    { question: t('help.faq.q7'), answer: t('help.faq.a7') },
    { question: t('help.faq.q8'), answer: t('help.faq.a8') }
  ]

  const guides = [
    {
      title: t('help.guides.quickStart.title'),
      description: t('help.guides.quickStart.description'),
      icon: FileText,
      link: '/extension'
    },
    {
      title: t('help.guides.extension.title'),
      description: t('help.guides.extension.description'),
      icon: FileText,
      link: '/extension'
    },
    {
      title: t('help.guides.importExport.title'),
      description: t('help.guides.importExport.description'),
      icon: FileText,
      link: '/settings/general?section=data'
    },
    {
      title: t('help.guides.share.title'),
      description: t('help.guides.share.description'),
      icon: FileText,
      link: '/settings/general?section=share'
    }
  ]

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
      {/* 标题 */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">{t('help.title')}</h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          {t('help.subtitle')}
        </p>
      </div>

      {/* 快速指南 */}
      <div className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">{t('help.guides.title')}</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {guides.map((guide) => {
            const Icon = guide.icon
            return (
              <Link
                key={guide.title}
                to={guide.link}
                className="card p-5 hover:border-primary/50 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">{guide.title}</h3>
                    <p className="text-sm text-muted-foreground">{guide.description}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* 常见问题 */}
      <div className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">{t('help.faq.title')}</h2>
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <details key={index} className="card p-5 group">
              <summary className="flex items-start gap-3 cursor-pointer list-none">
                <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground group-open:text-primary transition-colors">
                    {faq.question}
                  </h3>
                </div>
                <svg
                  className="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="mt-3 pl-8 text-sm text-muted-foreground">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* 联系支持 */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold text-foreground">{t('help.contact.title')}</h2>
        </div>
        <p className="text-sm text-muted-foreground">{t('help.contact.description')}</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="https://github.com/ai-tmarks/tmarks/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary flex items-center gap-2 justify-center"
          >
            <FileText className="w-4 h-4" />
            {t('help.contact.submitIssue')}
          </a>
          <a
            href="mailto:support@tmarks.com"
            className="btn btn-secondary flex items-center gap-2 justify-center"
          >
            <MessageCircle className="w-4 h-4" />
            {t('help.contact.contactSupport')}
          </a>
        </div>
      </div>
    </div>
  )
}
