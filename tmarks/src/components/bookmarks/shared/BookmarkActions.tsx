/**
 * 共享的书签卡片操作组件：批量选择复选框 + 编辑按钮
 */

import { useTranslation } from 'react-i18next'

interface BatchCheckboxProps {
  bookmarkId: string
  isSelected: boolean
  onToggleSelect: (id: string) => void
  size?: 'sm' | 'md'
}

export function BatchCheckbox({ bookmarkId, isSelected, onToggleSelect, size = 'md' }: BatchCheckboxProps) {
  const { t } = useTranslation('bookmarks')
  const sizeClass = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6'
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'

  return (
    <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10">
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSelect(bookmarkId) }}
        className={`${sizeClass} rounded flex items-center justify-center transition-all ${
          isSelected ? 'bg-primary text-primary-foreground' : 'bg-card border-2 border-border hover:border-primary'
        }`}
        title={isSelected ? t('batch.deselect') : t('batch.select')}
      >
        {isSelected && (
          <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
    </div>
  )
}

interface EditButtonProps {
  onEdit: () => void
  showHint: boolean
}

export function EditButton({ onEdit, showHint }: EditButtonProps) {
  const { t } = useTranslation('bookmarks')

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onEdit() }}
      className={`absolute top-2 right-2 sm:top-3 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center transition-all hover:scale-110 z-10 touch-manipulation ${
        showHint ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 active:opacity-100'
      }`}
      title={t('action.edit')}
    >
      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-base-content drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    </button>
  )
}
