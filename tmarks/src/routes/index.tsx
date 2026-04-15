import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { FullScreenAppShell } from '@/components/layout/FullScreenAppShell'
import { PublicAppShell } from '@/components/layout/PublicAppShell'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

// 懒加载页面组件
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })))
const BookmarksPage = lazy(() => import('@/pages/bookmarks/BookmarksPage').then(m => ({ default: m.BookmarksPage })))
const BookmarkTrashPage = lazy(() => import('@/pages/bookmarks/BookmarkTrashPage').then(m => ({ default: m.BookmarkTrashPage })))
const TabGroupsPage = lazy(() => import('@/pages/tab-groups/TabGroupsPage').then(m => ({ default: m.TabGroupsPage })))
const TabGroupDetailPage = lazy(() => import('@/pages/tab-groups/TabGroupDetailPage').then(m => ({ default: m.TabGroupDetailPage })))
const TrashPage = lazy(() => import('@/pages/tab-groups/TrashPage').then(m => ({ default: m.TrashPage })))
const StatisticsPage = lazy(() => import('@/pages/tab-groups/StatisticsPage').then(m => ({ default: m.StatisticsPage })))
const TodoPage = lazy(() => import('@/pages/tab-groups/TodoPage').then(m => ({ default: m.TodoPage })))
const PermissionsPage = lazy(() => import('@/pages/settings/PermissionsPage').then(m => ({ default: m.PermissionsPage })))
const GeneralSettingsPage = lazy(() => import('@/pages/settings/GeneralSettingsPage').then(m => ({ default: m.GeneralSettingsPage })))
const PublicSharePage = lazy(() => import('@/pages/share/PublicSharePage').then(m => ({ default: m.PublicSharePage })))
const ExtensionPage = lazy(() => import('@/pages/extension/ExtensionPage').then(m => ({ default: m.ExtensionPage })))
const AboutPage = lazy(() => import('@/pages/info/AboutPage').then(m => ({ default: m.AboutPage })))
const HelpPage = lazy(() => import('@/pages/info/HelpPage').then(m => ({ default: m.HelpPage })))
const PrivacyPage = lazy(() => import('@/pages/info/PrivacyPage').then(m => ({ default: m.PrivacyPage })))
const TermsPage = lazy(() => import('@/pages/info/TermsPage').then(m => ({ default: m.TermsPage })))

// 加载中组件
function PageLoader() {
  const { t } = useTranslation('common')
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <svg className="animate-spin h-12 w-12 mx-auto mb-4 text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-muted-foreground">{t('status.loading')}</p>
      </div>
    </div>
  )
}

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* 公开分享页面使用公开布局 */}
        <Route element={<PublicAppShell />}>
          <Route path="/share/:slug" element={<PublicSharePage />} />
        </Route>

        {/* 受保护的路由 */}
        <Route element={<ProtectedRoute />}>
          {/* 全屏布局 - 用于书签和标签页组 */}
          <Route element={<FullScreenAppShell />}>
            <Route path="/" element={<BookmarksPage />} />
            <Route path="/tab" element={<TabGroupsPage />} />
          </Route>

          {/* 常规布局 - 用于设置和其他页面 */}
          <Route element={<AppShell />}>
            <Route path="/bookmarks/trash" element={<BookmarkTrashPage />} />
            <Route path="/tab/todo" element={<TodoPage />} />
            <Route path="/tab/trash" element={<TrashPage />} />
            <Route path="/tab/statistics" element={<StatisticsPage />} />
            <Route path="/tab/:id" element={<TabGroupDetailPage />} />
            <Route path="/settings/general" element={<GeneralSettingsPage />} />
            {/* 旧独立页面重定向到设置页面对应 section */}
            <Route path="/api-keys" element={<Navigate to="/settings/general?section=api" replace />} />
            <Route path="/share-settings" element={<Navigate to="/settings/general?section=share" replace />} />
            <Route path="/import-export" element={<Navigate to="/settings/general?section=data" replace />} />
            <Route path="/permissions" element={<PermissionsPage />} />
            <Route path="/extension" element={<ExtensionPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}
