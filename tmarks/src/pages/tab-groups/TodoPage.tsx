import { useTranslation } from 'react-i18next'
import { MobileHeader } from '@/components/common/MobileHeader'
import { TodoSidebar } from '@/components/tab-groups/TodoSidebar'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useTabGroupsQuery } from '@/hooks/useTabGroupsQuery'

export function TodoPage() {
  const { t } = useTranslation('tabGroups')
  const { t: tc } = useTranslation('common')
  const isMobile = useIsMobile()
  const tabGroupsQuery = useTabGroupsQuery()

  if (tabGroupsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">{tc('status.loading')}</div>
      </div>
    )
  }

  return (
    <div className={`h-screen flex flex-col bg-background ${isMobile ? 'overflow-hidden' : ''}`}>
      {isMobile && (
        <MobileHeader
          title={t('todo.title')}
          showMenu={false}
          showSearch={false}
          showMore={false}
        />
      )}

      <div className={`flex-1 overflow-hidden ${isMobile ? 'min-h-0' : ''}`}>
        <TodoSidebar tabGroups={tabGroupsQuery.data || []} />
      </div>
    </div>
  )
}
