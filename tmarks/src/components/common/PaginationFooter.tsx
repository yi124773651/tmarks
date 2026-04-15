import { useTranslation } from 'react-i18next'

interface PaginationFooterProps {
  hasMore: boolean
  isLoading: boolean
  onLoadMore: () => void
  currentCount: number
  totalLoaded: number
}

export function PaginationFooter({
  hasMore,
  isLoading,
  onLoadMore,
  currentCount,
  totalLoaded,
}: PaginationFooterProps) {
  const { t } = useTranslation('common')
  const { t: tb } = useTranslation('bookmarks')

  if (!hasMore && currentCount === 0) {
    return null
  }

  return (
    <div className="card text-center py-6 mt-6">
      {/* 统计信息 */}
      <div className="text-sm text-base-content/60 mb-4">
        {hasMore ? (
          <>{t('pagination.total', { count: totalLoaded })}</>
        ) : (
          <>{t('pagination.total', { count: totalLoaded })}</>
        )}
      </div>

      {/* 加载更多按钮 */}
      {hasMore && (
        <button
          onClick={onLoadMore}
          disabled={isLoading}
          className="btn btn-primary"
        >
          {isLoading ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              {t('status.loading')}
            </>
          ) : (
            t('button.loadMore')
          )}
        </button>
      )}

      {/* 已加载全部 */}
      {!hasMore && totalLoaded > 0 && (
        <div className="text-sm text-base-content/40">
          {tb('empty.title')}
        </div>
      )}
    </div>
  )
}
