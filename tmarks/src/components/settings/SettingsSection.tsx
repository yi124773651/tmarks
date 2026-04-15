/**
 * 设置区块组件
 * 统一的设置项布局
 */

import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface SettingsSectionProps {
  title: string
  description?: string
  icon?: LucideIcon
  children: ReactNode
  className?: string
}

export function SettingsSection({ title, description, icon: Icon, children, className = '' }: SettingsSectionProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
      </div>
      <div>{children}</div>
    </div>
  )
}

interface SettingsItemProps {
  title: string
  description?: string
  icon?: LucideIcon
  iconColor?: string
  action?: ReactNode
  children?: ReactNode
}

export function SettingsItem({ title, description, icon: Icon, iconColor = 'text-primary', action, children }: SettingsItemProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {Icon && <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground">{title}</div>
          {description && (
            <div className="text-xs text-muted-foreground mt-1">{description}</div>
          )}
          {children}
        </div>
      </div>
      {action && <div className="flex-shrink-0 ml-4">{action}</div>}
    </div>
  )
}

export function SettingsDivider() {
  return <div className="border-t border-border" />
}
