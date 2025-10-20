import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { PublicAppShell } from '@/components/layout/PublicAppShell'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { BookmarksPage } from '@/pages/bookmarks/BookmarksPage'
import { TabGroupsPage } from '@/pages/tab-groups/TabGroupsPage'
import { TabGroupDetailPage } from '@/pages/tab-groups/TabGroupDetailPage'
import { TrashPage } from '@/pages/tab-groups/TrashPage'
import { StatisticsPage } from '@/pages/tab-groups/StatisticsPage'
import { ApiKeysPage } from '@/pages/settings/ApiKeysPage'
import { ShareSettingsPage } from '@/pages/settings/ShareSettingsPage'
import { ImportExportPage } from '@/pages/settings/ImportExportPage'
import { PublicSharePage } from '@/pages/share/PublicSharePage'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* 公开分享页面使用公开布局 */}
      <Route element={<PublicAppShell />}>
        <Route path="/share/:slug" element={<PublicSharePage />} />
      </Route>

      {/* 受保护的路由 */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<BookmarksPage />} />
          <Route path="/tab-groups" element={<TabGroupsPage />} />
          <Route path="/tab-groups/trash" element={<TrashPage />} />
          <Route path="/tab-groups/statistics" element={<StatisticsPage />} />
          <Route path="/tab-groups/:id" element={<TabGroupDetailPage />} />
          <Route path="/api-keys" element={<ApiKeysPage />} />
          <Route path="/share-settings" element={<ShareSettingsPage />} />
          <Route path="/import-export" element={<ImportExportPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  )
}
