import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookOpen, User, Layers } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { ColorThemeSelector } from '@/components/common/ColorThemeSelector'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { ThemedRoot } from '@/components/layout/ThemedRoot'
import { ShellHeader } from '@/components/layout/ShellHeader'

export function FullScreenAppShell() {
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
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4">
            <button
              onClick={handleToggleView}
              className="hidden sm:flex btn btn-sm btn-ghost p-2"
              title={isOnTabGroupsPage ? t('nav.switchToBookmarks') : t('nav.switchToTabGroups')}
            >
              {isOnTabGroupsPage ? <BookOpen className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
            </button>

            <ThemeToggle />
            <ColorThemeSelector />

            {user && (
              <button
                onClick={() => navigate('/settings/general')}
                className="btn btn-sm btn-ghost p-2"
                title={t('nav.userSettings', { username: user.username })}
              >
                <User className="w-4 h-4" />
              </button>
            )}
          </div>
        }
      />

      <main className="w-full pb-16 sm:pb-0 flex flex-col min-h-0 flex-1">
        <Outlet />
      </main>

      <MobileBottomNav />
    </ThemedRoot>
  )
}
