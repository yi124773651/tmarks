import type { ApiResponse } from './types'
import { useAuthStore } from '@/stores/authStore'
import { logger } from '@/lib/logger'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

let isRefreshing = false
let refreshSubscribers: Array<{
  resolve: (token: string) => void
  reject: (error: Error) => void
}> = []

function subscribeToRefresh(): { promise: Promise<string>; unsubscribe: () => void } {
  let entry: { resolve: (token: string) => void; reject: (error: Error) => void }
  const promise = new Promise<string>((resolve, reject) => {
    entry = { resolve, reject }
    refreshSubscribers.push(entry)
  })
  const unsubscribe = () => {
    refreshSubscribers = refreshSubscribers.filter(e => e !== entry)
  }
  return { promise, unsubscribe }
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach(({ resolve }) => resolve(token))
  refreshSubscribers = []
}

function rejectSubscribers(error: Error) {
  refreshSubscribers.forEach(({ reject }) => reject(error))
  refreshSubscribers = []
}

/**
 * HTTP 客户端
 */
class HttpClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private getAuthToken(): string | null {
    return useAuthStore.getState().accessToken
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    let token = this.getAuthToken()

    const makeRequest = async (authToken: string) => {
      const headers = new Headers({
        'Content-Type': 'application/json',
        ...(options.headers && typeof options.headers === 'object' ? options.headers : {}),
      })

      if (authToken && !headers.get('Authorization')) {
        headers.set('Authorization', `Bearer ${authToken}`)
      }

      return fetch(url, {
        ...options,
        headers,
      })
    }

    const handle401Error = async () => {
      if (!isRefreshing) {
        isRefreshing = true
        try {
          const authStore = useAuthStore.getState()
          await authStore.refreshAccessToken()
          const newToken = authStore.accessToken
          if (newToken) {
            onRefreshed(newToken)
            return newToken
          } else {
            throw new Error('Failed to get new token after refresh')
          }
        } catch (error) {
          const err = error instanceof Error ? error : new Error('Token refresh failed')
          rejectSubscribers(err)
          this.clearAuthAndRedirect()
          logger.error('Token refresh failed:', err)
          throw error
        } finally {
          isRefreshing = false
        }
      } else {
        const { promise, unsubscribe } = subscribeToRefresh()
        let timeoutId: ReturnType<typeof setTimeout>
        const timeout = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            unsubscribe()
            reject(new Error('Token refresh timeout'))
          }, 10000)
        })
        return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId))
      }
    }

    try {
      let response = await makeRequest(token || '')

      if (response.status === 401 && !endpoint.includes('/auth/refresh')) {
        try {
          const newToken = await handle401Error()
          if (newToken) {
            token = newToken
            response = await makeRequest(newToken)
          }
        } catch {
          let data: { error?: { code: string; message: string } } = { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }
          try {
            const text = await response.text()
            if (text) {
              const parsed = JSON.parse(text) as { error?: { code: string; message: string } }
              data = parsed
            }
          } catch {
            // use default error
          }
          const apiError = data.error || { code: 'UNAUTHORIZED', message: 'Unauthorized' }
          throw new ApiError(apiError.code, apiError.message, response.status)
        }
      }

      if (response.status === 204) {
        return {} as ApiResponse<T>
      }

      let data: unknown
      try {
        const text = await response.text()
        if (!text || text.trim() === '') {
          if (!response.ok) {
            throw new ApiError('EMPTY_RESPONSE', 'Server returned empty response', response.status)
          }
          return {} as ApiResponse<T>
        }
        data = JSON.parse(text) as unknown
      } catch (parseError) {
        if (parseError instanceof ApiError) {
          throw parseError
        }
        throw new ApiError(
          'INVALID_RESPONSE',
          `Failed to parse server response: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`,
          response.status
        )
      }

      if (!response.ok) {
        const errorData = data as { error?: { code: string; message: string } }
        const error = errorData.error || { code: 'UNKNOWN_ERROR', message: 'An error occurred' }
        throw new ApiError(error.code, error.message, response.status)
      }

      return data as ApiResponse<T>
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      throw new ApiError(
        'NETWORK_ERROR',
        error instanceof Error ? error.message : 'Network request failed',
        0
      )
    }
  }

  private clearAuthAndRedirect() {
    const { clearAuth } = useAuthStore.getState()
    clearAuth()

    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login'
    }
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async put<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async patch<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }
}

export const apiClient = new HttpClient(API_BASE_URL)
