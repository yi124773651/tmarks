import { Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Download } from 'lucide-react'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { ColorThemeSelector } from '@/components/common/ColorThemeSelector'
import { ThemedRoot } from '@/components/layout/ThemedRoot'
import { ShellHeader } from '@/components/layout/ShellHeader'

export function PublicAppShell() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()

  return (
    <ThemedRoot>
      <ShellHeader
        title="TMarks"
        subtitle={t('nav.smartBookmarkManagement')}
        onHome={() => navigate('/')}
        right={
          <>
            <ThemeToggle />
            <ColorThemeSelector />

            <button
              onClick={() => {
                const link = document.createElement('a')
                link.href = '/tmarks-extension.zip'
                link.download = 'tmarks-extension.zip'
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
              }}
              className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 border border-border hover:border-primary hover:bg-card/50"
              style={{ color: 'var(--foreground)' }}
              title={t('nav.extension')}
            >
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">{t('nav.extension')}</span>
            </button>

            <button
              onClick={() => navigate('/login')}
              className="px-3 py-2 sm:px-4 sm:py-2 text-sm font-medium rounded-lg transition-all duration-200 bg-primary text-primary-content hover:bg-primary/90 shadow-float"
            >
              {t('action.login')}
            </button>
          </>
        }
      />

      <main className="w-full px-3 sm:px-6">
        <div className="mx-auto" style={{ maxWidth: '100%' }}>
          <Outlet />
        </div>
      </main>
    </ThemedRoot>
  )
}
