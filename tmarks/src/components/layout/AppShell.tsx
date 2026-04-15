import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookOpen, User, Layers } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { ColorThemeSelector } from '@/components/common/ColorThemeSelector'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { ThemedRoot } from '@/components/layout/ThemedRoot'
import { ShellHeader } from '@/components/layout/ShellHeader'

export function AppShell() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()

  const isOnTabGroupsPage = location.pathname.startsWith('/tab')

  const handleToggleView = () => {
    if (isOnTabGroupsPage) {
      navigate('/')
    } else {
      navigate('/tab')
    }
  }

  return (
    <ThemedRoot>
      <ShellHeader
        title="TMarks"
        subtitle={isOnTabGroupsPage ? t('nav.manageTabGroups') : t('nav.smartBookmarkManagement')}
        onHome={() => navigate('/')}
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleView}
              className="hidden sm:flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300 bg-card hover:bg-primary/5 active:scale-95 text-foreground shadow-sm hover:shadow-md"
              title={isOnTabGroupsPage ? t('nav.switchToBookmarks') : t('nav.switchToTabGroups')}
            >
              {isOnTabGroupsPage ? <BookOpen className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
            </button>

            <ThemeToggle />
            <ColorThemeSelector />

            {user && (
              <button
                onClick={() => navigate('/settings/general')}
                className="flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300 bg-card hover:bg-primary/5 active:scale-95 text-foreground shadow-sm hover:shadow-md"
                title={t('nav.userSettings', { username: user.username })}
              >
                <User className="w-5 h-5" />
              </button>
            )}
          </div>
        }
      />

      <main className="w-full pb-16 sm:pb-6 pt-3 sm:pt-6 flex flex-col min-h-0 flex-1 bg-muted/30">
        <div className="mx-auto w-full px-3 sm:px-6">
          <Outlet />
        </div>
      </main>

      <MobileBottomNav />
    </ThemedRoot>
  )
}
