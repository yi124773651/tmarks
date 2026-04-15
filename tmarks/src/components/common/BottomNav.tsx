import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Layers, CheckSquare, Trash2 } from 'lucide-react'

interface NavItem {
  path: string
  icon: React.ReactNode
  labelKey: string
}

const navItems: NavItem[] = [
  {
    path: '/tab',
    icon: <Layers className="w-5 h-5" />,
    labelKey: 'nav.all',
  },
  {
    path: '/tab/todo',
    icon: <CheckSquare className="w-5 h-5" />,
    labelKey: 'nav.todo',
  },
  {
    path: '/tab/trash',
    icon: <Trash2 className="w-5 h-5" />,
    labelKey: 'nav.trash',
  },
]

export function BottomNav() {
  const { t } = useTranslation('common')
  const location = useLocation()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 border-t border-border z-30 safe-area-bottom md:hidden"
      style={{ backgroundColor: 'var(--card)' }}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className={`transition-transform ${isActive ? 'scale-110' : ''}`}>
                {item.icon}
              </div>
              <span className="text-xs mt-1 font-medium">{t(item.labelKey)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
