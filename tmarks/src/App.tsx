import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { AppRouter } from './routes'
import { useAuthStore } from './stores/authStore'
import { ToastContainer } from './components/common/Toast'
import { useToastStore } from './stores/toastStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

function App() {
  const { user, isAuthenticated, accessToken, refreshToken, clearAuth, refreshAccessToken } = useAuthStore()
  const { toasts, removeToast } = useToastStore()
  const previousUserId = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    if (isAuthenticated && !accessToken) {
      if (refreshToken) {
        refreshAccessToken().catch(() => {
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

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRouter />
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
