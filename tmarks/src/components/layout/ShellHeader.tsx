import type React from 'react'
import { BookOpen } from 'lucide-react'

export function ShellHeader({
  title,
  subtitle,
  onHome,
  right,
}: {
  title: string
  subtitle?: React.ReactNode
  onHome: () => void
  right?: React.ReactNode
}) {
  return (
    <header className="h-16 sm:h-20 sticky top-0 z-50 backdrop-filter backdrop-blur-xl bg-card/80 border-b border-border/50 shadow-float flex items-center">
      <div className="w-full mx-auto px-3 sm:px-6 flex items-center justify-between">
        <button
          onClick={onHome}
          className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity duration-200 focus:outline-none"
        >
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-float">
            <BookOpen className="w-5 h-5 sm:w-7 sm:h-7" style={{ color: 'var(--foreground)' }} />
          </div>
          <div className="block text-left">
            <h1 className="text-lg sm:text-2xl font-bold" style={{ color: 'var(--primary)' }}>
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs font-medium hidden sm:block" style={{ color: 'var(--muted-foreground)' }}>
                {subtitle}
              </p>
            )}
          </div>
        </button>

        {right ? <div className="flex items-center gap-2">{right}</div> : null}
      </div>
    </header>
  )
}

