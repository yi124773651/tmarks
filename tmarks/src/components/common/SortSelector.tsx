import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'
import { ChevronDown, Clock, RefreshCw, Pin, TrendingUp, Calendar } from 'lucide-react'
import { Z_INDEX } from '@/lib/constants/z-index'

export type SortOption = 'created' | 'updated' | 'pinned' | 'popular'

interface SortSelectorProps {
  value: SortOption
  onChange: (value: SortOption) => void
  className?: string
}

interface SortOptionConfig {
  value: SortOption
  labelKey: string
  icon: React.ComponentType<{ className?: string }>
  descriptionKey: string
  group: 'time' | 'priority' | 'engagement'
}

interface MenuPosition {
  top: number
  left: number
  width?: number
}

const SORT_OPTIONS: SortOptionConfig[] = [
  {
    value: 'created',
    labelKey: 'sort.byCreated',
    icon: Calendar,
    descriptionKey: 'sort.byCreatedDesc',
    group: 'time'
  },
  {
    value: 'updated',
    labelKey: 'sort.byUpdated',
    icon: RefreshCw,
    descriptionKey: 'sort.byUpdatedDesc',
    group: 'time'
  },
  {
    value: 'pinned',
    labelKey: 'sort.pinnedFirst',
    icon: Pin,
    descriptionKey: 'sort.pinnedFirstDesc',
    group: 'priority'
  },
  {
    value: 'popular',
    labelKey: 'sort.byPopular',
    icon: TrendingUp,
    descriptionKey: 'sort.byPopularDesc',
    group: 'engagement'
  }
]



export function SortSelector({ value, onChange, className = '' }: SortSelectorProps) {
  const { t } = useTranslation('common')
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const optionsRef = useRef<HTMLDivElement | null>(null)

  const currentOption = SORT_OPTIONS.find(option => option.value === value)
  const CurrentIcon = currentOption?.icon || Clock



  // 处理键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'Escape':
          setIsOpen(false)
          buttonRef.current?.focus()
          break
        case 'ArrowDown':
          e.preventDefault()
          setFocusedIndex(prev => 
            prev < SORT_OPTIONS.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : SORT_OPTIONS.length - 1
          )
          break
        case 'Enter':
        case ' ': {
          e.preventDefault()
          const option = SORT_OPTIONS[focusedIndex]
          if (focusedIndex >= 0 && option) {
            onChange(option.value)
            setIsOpen(false)
            buttonRef.current?.focus()
          }
          break
        }
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, focusedIndex, onChange])

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        isOpen &&
        !buttonRef.current?.contains(target) &&
        !optionsRef.current?.contains(target)
      ) {
        setIsOpen(false)
        setMenuPosition(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev
      if (next) {
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect()
          const width = Math.max(rect.width, 200)
          const maxLeft = window.scrollX + window.innerWidth - width - 12
          const left = Math.min(rect.left + window.scrollX, maxLeft)
          setMenuPosition({
            top: rect.bottom + window.scrollY + 8,
            left,
            width,
          })
        }
      } else {
        setMenuPosition(null)
      }
      return next
    })
    setFocusedIndex(-1)
  }

  const handleOptionClick = (optionValue: SortOption) => {
    onChange(optionValue)
    setIsOpen(false)
    setMenuPosition(null)
    buttonRef.current?.focus()
  }

  const menuPortal =
    typeof document !== 'undefined' && isOpen && menuPosition
      ? createPortal(
          <div
            ref={(node) => {
              optionsRef.current = node
            }}
            className="rounded-lg border border-border shadow-lg overflow-hidden"
            style={{
              position: 'absolute',
              top: menuPosition.top,
              left: menuPosition.left,
              width: menuPosition.width ?? 200,
              backgroundColor: 'var(--card)',
              zIndex: Z_INDEX.DROPDOWN,
            }}
            role="listbox"
            aria-label={t('sort.options')}
          >
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleOptionClick(option.value)}
                className={`w-full px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                  value === option.value
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-base-content/80 hover:bg-base-200/60'
                }`}
              >
                <option.icon className="w-4 h-4" />
                <span>{t(option.labelKey)}</span>
              </button>
            ))}
          </div>,
          document.body,
        )
      : null

  return (
    <>
      {menuPortal}
      <div className={`relative ${className}`}>
        {/* 触发按钮 */}
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggle}
          className={`
            w-auto min-w-[100px] sm:min-w-[160px] h-10 sm:h-11 px-2 sm:px-4 py-2
            border border-border rounded-xl
            flex items-center justify-between gap-1.5 sm:gap-3
            text-sm font-medium text-foreground
            transition-all duration-200 ease-out
            hover:border-primary/30
            focus:outline-none
            shadow-sm hover:shadow-md
            ${isOpen ? 'border-primary/50 shadow-md' : ''}
          `}
          style={{
            backgroundColor: isOpen ? 'var(--muted)' : 'var(--card)',
            outline: 'none'
          }}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={t('sort.selectSort')}
        >
          <div className="flex items-center gap-1 sm:gap-2">
            <CurrentIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
            <span className="truncate text-[11px] sm:text-sm">{currentOption ? t(currentOption.labelKey) : ''}</span>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>
    </>
  )
}
