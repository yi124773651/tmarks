/**
 * 设置页面侧栏导航组件
 * Desktop: 固定侧栏 | Mobile: 下拉选择器
 */

import { ReactNode, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface SettingsNavItem {
  id: string
  label: string
  icon: LucideIcon
}

export interface SettingsNavGroup {
  label: string
  items: SettingsNavItem[]
}

interface SettingsNavProps {
  groups: SettingsNavGroup[]
  activeSection: string
  onSectionChange: (sectionId: string) => void
  children: ReactNode
}

export function SettingsNav({ groups, activeSection, onSectionChange, children }: SettingsNavProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const allItems = groups.flatMap((g) => g.items)
  const activeItem = allItems.find((item) => item.id === activeSection)

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
      {/* Mobile: 下拉选择器 */}
      <div className="lg:hidden relative">
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="w-full flex items-center justify-between gap-2 px-4 py-3 text-sm font-medium bg-card rounded-lg border border-border"
        >
          <div className="flex items-center gap-2">
            {activeItem && <activeItem.icon className="w-4 h-4 text-primary" />}
            <span>{activeItem?.label}</span>
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${showMobileMenu ? 'rotate-180' : ''}`} />
        </button>
        {showMobileMenu && (
          <div className="absolute z-20 mt-2 w-full rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
            {groups.map((group) => (
              <div key={group.label}>
                <div className="px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/30">
                  {group.label}
                </div>
                {group.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSectionChange(item.id)
                        setShowMobileMenu(false)
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                        activeSection === item.id
                          ? 'text-primary bg-primary/10'
                          : 'text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: 侧栏导航 */}
      <nav className="hidden lg:block w-52 flex-shrink-0">
        <div className="sticky top-6 space-y-5">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = activeSection === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSectionChange(item.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors ${
                        isActive
                          ? 'text-primary bg-primary/10 font-medium'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* 内容区域 */}
      <div className="flex-1 min-w-0">
        <div className="animate-in fade-in duration-200">{children}</div>
      </div>
    </div>
  )
}
