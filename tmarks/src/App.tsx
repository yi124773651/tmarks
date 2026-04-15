import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { AppRouter } from '@/routes'
import { useAuthStore } from '@/stores/authStore'
import { ToastContainer } from '@/components/common/Toast'
import { DialogHost } from '@/components/common/DialogHost'
import { useToastStore } from '@/stores/toastStore'
import { useThemeStore } from '@/stores/themeStore'
import { queryClient } from '@/lib/query-client'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'

function App() {
  const { user, isAuthenticated, accessToken, refreshToken, clearAuth, refreshAccessToken } = useAuthStore()
  const { toasts, removeToast } = useToastStore()
  const { theme, colorTheme } = useThemeStore()
  const previousUserId = useRef<string | null | undefined>(undefined)

  // 应用主题到 document.documentElement
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    root.setAttribute('data-color-theme', colorTheme)
  }, [theme, colorTheme])

  useEffect(() => {
    if (isAuthenticated && !accessToken) {
      if (refreshToken) {
        refreshAccessToken().catch((err) => {
          console.error('Failed to refresh access token:', err)
          clearAuth()
        })
      } else {
        clearAuth()
      }
    }
  }, [isAuthenticated, accessToken, refreshToken, refreshAccessToken, clearAuth])

  const userId = user?.id ?? null

  useEffect(() => {
    if (previousUserId.current === undefined) {
      previousUserId.current = userId
      return
    }

    if (previousUserId.current !== userId) {
      queryClient.clear()
      previousUserId.current = userId
    }
  }, [userId])

  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout>
    const handler = () => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['bookmarks'] }).catch((err) => console.error('Failed to invalidate bookmarks:', err))
        queryClient.invalidateQueries({ queryKey: ['tags'] }).catch((err) => console.error('Failed to invalidate tags:', err))
      }, 300)
    }

    window.addEventListener('tmarks:data-changed', handler)
    return () => {
      window.removeEventListener('tmarks:data-changed', handler)
      clearTimeout(debounceTimer)
    }
  }, [])

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRouter />
          <ToastContainer toasts={toasts} onClose={removeToast} />
          <DialogHost />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
