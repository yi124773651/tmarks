import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useState, useEffect } from 'react'

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [hydrated, setHydrated] = useState(useAuthStore.persist.hasHydrated())

  useEffect(() => {
    if (hydrated) return
    // Zustand persist 提供 onFinishHydration 回调
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true)
    })
    // 如果在注册回调期间已经 hydrated
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true)
    }
    return unsub
  }, [hydrated])

  // 开发环境下可以跳过登录
  const skipAuth = import.meta.env.DEV && import.meta.env.VITE_SKIP_AUTH === 'true'

  if (!hydrated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{
          width: 32, height: 32, border: '3px solid #e5e7eb',
          borderTopColor: '#6366f1', borderRadius: '50%',
          animation: 'spin 0.6s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!isAuthenticated && !skipAuth) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
