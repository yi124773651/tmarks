/**
 * 移动端底部导航栏组件
 * 提供移动端专用的导航体验
 */

import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookOpen, Layers, Download } from 'lucide-react'
import { Z_INDEX } from '@/lib/constants/z-index'

interface NavItem {
  id: string
  labelKey: string
  icon: React.ComponentType<{ className?: string }>
  path: string
  badge?: number
}

export function MobileBottomNav() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const location = useLocation()

  const navItems: NavItem[] = [
    {
      id: 'bookmarks',
      labelKey: 'nav.bookmarks',
      icon: BookOpen,
      path: '/'
    },
    {
      id: 'tab-groups',
      labelKey: 'nav.tabGroups',
      icon: Layers,
      path: '/tab'
    },
    {
      id: 'extension',
      labelKey: 'nav.extension',
      icon: Download,
      path: '/extension'
    }
  ]

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border sm:hidden" style={{ zIndex: Z_INDEX.MOBILE_BOTTOM_NAV }}>
      <div className="grid grid-cols-3 h-16">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center space-y-1 px-2 py-2 transition-colors duration-200 touch-manipulation ${
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${
                  active ? 'text-primary' : ''
                }`} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-xs font-medium ${
                active ? 'text-primary' : ''
              }`}>
                {t(item.labelKey)}
              </span>
            </button>
          )
        })}
      </div>
      
      {/* 安全区域适配 */}
      <div className="h-safe-area-inset-bottom bg-card" />
    </div>
  )
}
