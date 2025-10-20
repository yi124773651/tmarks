import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  // 开发环境下可以跳过登录
  const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true'

  if (!isAuthenticated && !skipAuth) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
