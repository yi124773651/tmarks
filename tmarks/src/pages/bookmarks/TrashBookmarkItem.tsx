import { useTranslation } from 'react-i18next'
import { RotateCcw, Trash2, Calendar, Link2 } from 'lucide-react'
import type { Bookmark } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'

interface TrashBookmarkItemProps {
  bookmark: Bookmark
  onRestore: (id: string, title: string) => void
  onDelete: (id: string, title: string) => void
}

export function TrashBookmarkItem({ bookmark, onRestore, onDelete }: TrashBookmarkItemProps) {
  const { t, i18n } = useTranslation('bookmarks')
  const dateLocale = i18n.language === 'zh-CN' ? zhCN : enUS

  return (
    <div className="card p-4 sm:p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3">
            {bookmark.favicon ? (
              <img
                src={bookmark.favicon}
                alt=""
                className="w-6 h-6 rounded flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            ) : (
              <Link2 className="w-6 h-6 text-muted-foreground flex-shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-1 truncate">
                {bookmark.title}
              </h3>
              <p className="text-sm text-muted-foreground truncate mb-2">
                {bookmark.url}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {t('trash.deletedAt', {
                      time: bookmark.deleted_at
                        ? formatDistanceToNow(new Date(bookmark.deleted_at), {
                            addSuffix: true,
                            locale: dateLocale,
                          })
                        : ''
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onRestore(bookmark.id, bookmark.title)}
            className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-success text-success-foreground rounded-lg hover:bg-success/90 transition-colors text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            {t('trash.restore')}
          </button>
          <button
            onClick={() => onDelete(bookmark.id, bookmark.title)}
            className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors text-sm"
          >
            <Trash2 className="w-4 h-4" />
            {t('trash.delete')}
          </button>
        </div>
      </div>
    </div>
  )
}
