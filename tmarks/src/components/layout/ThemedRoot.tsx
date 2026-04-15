import type React from 'react'
import { useThemeStore } from '@/stores/themeStore'

export function ThemedRoot({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  const { theme, colorTheme } = useThemeStore()

  return (
    <div
      className={`min-h-screen ${className}`.trim()}
      style={{ backgroundColor: 'var(--background)' }}
      data-theme={theme}
      data-color-theme={colorTheme}
    >
      {children}
    </div>
  )
}

