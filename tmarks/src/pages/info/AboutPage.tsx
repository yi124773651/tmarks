import { useTranslation } from 'react-i18next'
import { Heart, Zap, Shield, Globe, Github, Star } from 'lucide-react'

export function AboutPage() {
  const { t } = useTranslation('info')

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
      {/* 标题 */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">{t('about.title')}</h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          {t('about.subtitle')}
        </p>
      </div>

      {/* 版本信息 */}
      <div className="card p-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
          <Star className="w-4 h-4" />
          <span className="text-sm font-medium">{t('about.version')} 2.0.0</span>
        </div>
        <p className="text-sm text-muted-foreground">{t('about.releaseNote')}</p>
      </div>

      {/* 核心特性 */}
      <div className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">{t('about.features.title')}</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="card p-5 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">{t('about.features.fast.title')}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{t('about.features.fast.description')}</p>
          </div>

          <div className="card p-5 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-success" />
              </div>
              <h3 className="font-semibold text-foreground">{t('about.features.secure.title')}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{t('about.features.secure.description')}</p>
          </div>

          <div className="card p-5 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-warning" />
              </div>
              <h3 className="font-semibold text-foreground">{t('about.features.sync.title')}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{t('about.features.sync.description')}</p>
          </div>

          <div className="card p-5 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
                <Heart className="w-5 h-5 text-error" />
              </div>
              <h3 className="font-semibold text-foreground">{t('about.features.opensource.title')}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{t('about.features.opensource.description')}</p>
          </div>
        </div>
      </div>

      {/* 技术栈 */}
      <div className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">{t('about.techStack.title')}</h2>
        <div className="card p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">{t('about.techStack.frontend')}</h3>
            <div className="flex flex-wrap gap-2">
              {['React 18', 'TypeScript', 'Vite', 'TailwindCSS', 'React Router', 'Zustand', 'React Query'].map((tech) => (
                <span key={tech} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {tech}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">{t('about.techStack.backend')}</h3>
            <div className="flex flex-wrap gap-2">
              {['Cloudflare Pages', 'Cloudflare D1', 'Cloudflare KV', 'JWT'].map((tech) => (
                <span key={tech} className="px-3 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 开源信息 */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Github className="w-6 h-6 text-foreground" />
          <h2 className="text-xl font-bold text-foreground">{t('about.opensource.title')}</h2>
        </div>
        <p className="text-sm text-muted-foreground">{t('about.opensource.description')}</p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>{t('about.opensource.contribute1')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>{t('about.opensource.contribute2')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>{t('about.opensource.contribute3')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>{t('about.opensource.contribute4')}</span>
          </li>
        </ul>
        <a
          href="https://github.com/ai-tmarks/tmarks"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary inline-flex items-center gap-2"
        >
          <Github className="w-4 h-4" />
          {t('about.opensource.visitGithub')}
        </a>
      </div>

      {/* 致谢 */}
      <div className="card p-6 space-y-3">
        <h2 className="text-xl font-bold text-foreground">{t('about.thanks.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('about.thanks.description')}</p>
        <div className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
          <div>• Cloudflare Pages & D1</div>
          <div>• React & TypeScript</div>
          <div>• Vite & TailwindCSS</div>
          <div>• Lucide Icons</div>
        </div>
      </div>
    </div>
  )
}
