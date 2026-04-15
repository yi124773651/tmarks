import { Trash2, Pin, CheckSquare, Download, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useIsMobile } from '@/hooks/useMediaQuery'

interface BatchActionBarProps {
  selectedCount: number
  onSelectAll: () => void
  onDeselectAll: () => void
  onBatchDelete: () => void
  onBatchPin: () => void
  onBatchTodo: () => void
  onBatchExport: () => void
  onCancel: () => void
}

export function BatchActionBar({
  selectedCount,
  onSelectAll,
  onDeselectAll,
  onBatchDelete,
  onBatchPin,
  onBatchTodo,
  onBatchExport,
  onCancel,
}: BatchActionBarProps) {
  const { t } = useTranslation('tabGroups')
  const isMobile = useIsMobile()

  return (
    <div className={`bg-primary/10 border border-primary/20 rounded mb-6 ${
      isMobile ? 'fixed bottom-16 left-0 right-0 z-20 rounded-none border-x-0 p-3' : 'p-4'
    }`}>
      <div className={`flex items-center ${isMobile ? 'flex-col gap-2' : 'justify-between'}`}>
        <div className={`flex items-center ${isMobile ? 'w-full justify-between' : 'gap-4'}`}>
          <span className="text-sm font-medium text-foreground">
            {t('batch.selected', { count: selectedCount })}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onSelectAll}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              {t('batch.selectAll')}
            </button>
            <span className="text-border">|</span>
            <button
              onClick={onDeselectAll}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              {t('batch.deselectAll')}
            </button>
          </div>
        </div>

        <div className={`flex items-center gap-2 ${isMobile ? 'w-full justify-between' : ''}`}>
          <button
            onClick={onBatchPin}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded hover:bg-muted transition-colors text-sm ${isMobile ? 'flex-1' : ''}`}
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
            disabled={selectedCount === 0}
          >
            <Pin className="w-4 h-4" />
            {!isMobile && t('batch.pin')}
          </button>
          <button
            onClick={onBatchTodo}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded hover:bg-muted transition-colors text-sm ${isMobile ? 'flex-1' : ''}`}
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
            disabled={selectedCount === 0}
          >
            <CheckSquare className="w-4 h-4" />
            {!isMobile && t('batch.todo')}
          </button>
          <button
            onClick={onBatchExport}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded hover:bg-muted transition-colors text-sm ${isMobile ? 'flex-1' : ''}`}
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
            disabled={selectedCount === 0}
          >
            <Download className="w-4 h-4" />
            {!isMobile && t('batch.export')}
          </button>
          <button
            onClick={onBatchDelete}
            className={`flex items-center gap-2 px-3 py-1.5 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors text-sm ${isMobile ? 'flex-1' : ''}`}
            disabled={selectedCount === 0}
          >
            <Trash2 className="w-4 h-4" />
            {!isMobile && t('batch.delete')}
          </button>
          <button
            onClick={onCancel}
            className={`flex items-center gap-2 px-3 py-1.5 bg-muted text-foreground rounded hover:bg-muted/80 transition-colors text-sm ${isMobile ? 'flex-1' : ''}`}
          >
            <X className="w-4 h-4" />
            {!isMobile && t('batch.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
