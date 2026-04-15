import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { Z_INDEX } from '@/lib/constants/z-index'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastProps {
  id: string
  type: ToastType
  message: string
  duration?: number
  onClose: (id: string) => void
}

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
}

const COLORS = {
  success: {
    bg: 'toast-surface',
    bgOverlay: 'bg-success/10',
    border: 'border-success',
    icon: 'text-success',
    text: 'text-foreground',
  },
  error: {
    bg: 'toast-surface',
    bgOverlay: 'bg-destructive/10',
    border: 'border-destructive',
    icon: 'text-destructive',
    text: 'text-foreground',
  },
  info: {
    bg: 'toast-surface',
    bgOverlay: 'bg-primary/10',
    border: 'border-primary',
    icon: 'text-primary',
    text: 'text-foreground',
  },
  warning: {
    bg: 'toast-surface',
    bgOverlay: 'bg-warning/10',
    border: 'border-warning',
    icon: 'text-warning',
    text: 'text-foreground',
  },
}

export function Toast({ id, type, message, duration = 3000, onClose }: ToastProps) {
  const { t } = useTranslation('common')
  const Icon = ICONS[type]
  const colors = COLORS[type]

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [id, duration, onClose])

  return (
    <div
      className={`relative flex items-start gap-3 p-4 rounded-lg border-2 shadow-lg ${colors.bg} ${colors.border} min-w-[320px] max-w-md animate-slide-in backdrop-blur-sm overflow-hidden`}
    >
      <div className={`absolute inset-0 rounded-lg ${colors.bgOverlay} z-0 pointer-events-none`}></div>
      
      <Icon className={`relative z-10 w-5 h-5 ${colors.icon} flex-shrink-0 mt-0.5`} />
      <p className={`relative z-10 flex-1 text-sm font-medium ${colors.text}`}>{message}</p>
      <button
        onClick={() => onClose(id)}
        className={`relative z-10 ${colors.icon} hover:opacity-70 transition-opacity flex-shrink-0`}
        aria-label={t('button.close')}
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  )
}

export function ToastContainer({ toasts, onClose }: { toasts: ToastProps[]; onClose: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 flex flex-col gap-2" style={{ zIndex: Z_INDEX.TOAST }}>
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  )
}
