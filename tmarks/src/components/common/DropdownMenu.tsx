import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Z_INDEX } from '@/lib/constants/z-index'

export interface MenuItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  danger?: boolean
  disabled?: boolean
  divider?: boolean  // 在此项之前显示分隔线
}

interface DropdownMenuProps {
  trigger: React.ReactNode
  items: MenuItem[]
  align?: 'left' | 'right'
}

export function DropdownMenu({ trigger, items, align = 'right' }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, right: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // 更新菜单位置
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setMenuPosition({
        top: rect.bottom + 4, // 4px gap
        left: align === 'left' ? rect.left : 0,
        right: align === 'right' ? window.innerWidth - rect.right : 0
      })
    }
  }, [isOpen, align])

  // 调整菜单位置，确保不超出屏幕
  useEffect(() => {
    if (isOpen && menuRef.current && triggerRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect()
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const gap = 4
      const padding = 10 // 距离屏幕边缘的最小距离

      let adjustedTop = triggerRect.bottom + gap
      let adjustedLeft = menuPosition.left
      let adjustedRight = menuPosition.right

      // 检查垂直方向溢出
      if (adjustedTop + menuRect.height > window.innerHeight) {
        // 尝试显示在触发器上方
        const topPosition = triggerRect.top - menuRect.height - gap
        if (topPosition >= padding) {
          adjustedTop = topPosition
        } else {
          // 如果上方也放不下，则贴近屏幕底部
          adjustedTop = window.innerHeight - menuRect.height - padding
        }
      }

      // 检查水平方向溢出
      if (align === 'left') {
        // 左对齐：检查右侧是否溢出
        if (adjustedLeft + menuRect.width > window.innerWidth - padding) {
          adjustedLeft = window.innerWidth - menuRect.width - padding
        }
        // 检查左侧是否溢出
        if (adjustedLeft < padding) {
          adjustedLeft = padding
        }
      } else {
        // 右对齐：检查左侧是否溢出
        const leftEdge = window.innerWidth - adjustedRight - menuRect.width
        if (leftEdge < padding) {
          adjustedRight = window.innerWidth - menuRect.width - padding
        }
        // 检查右侧是否溢出
        if (adjustedRight < padding) {
          adjustedRight = padding
        }
      }

      // 应用调整后的位置
      menuRef.current.style.top = `${adjustedTop}px`
      if (align === 'left') {
        menuRef.current.style.left = `${adjustedLeft}px`
        menuRef.current.style.right = 'auto'
      } else {
        menuRef.current.style.right = `${adjustedRight}px`
        menuRef.current.style.left = 'auto'
      }
    }
  }, [isOpen, menuPosition, align])

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <>
      <div ref={triggerRef} onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>

      {isOpen && createPortal(
        <div
          ref={menuRef}
          className="fixed w-56 rounded shadow-2xl border py-1"
          style={{
            top: `${menuPosition.top}px`,
            left: align === 'left' ? `${menuPosition.left}px` : 'auto',
            right: align === 'right' ? `${menuPosition.right}px` : 'auto',
            zIndex: Z_INDEX.DROPDOWN,
            backgroundColor: 'var(--card)',
            borderColor: 'var(--border)'
          }}
        >
          {items.map((item, index) => (
            <div key={index}>
              {item.divider && index > 0 && (
                <div className="my-1 h-px bg-border" />
              )}
              <button
                onClick={() => {
                  if (!item.disabled) {
                    item.onClick()
                    setIsOpen(false)
                  }
                }}
                disabled={item.disabled}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors ${
                  item.danger
                    ? 'text-destructive hover:bg-destructive/10'
                    : 'text-foreground hover:bg-muted'
                } ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                <span className="flex-1">{item.label}</span>
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  )
}

