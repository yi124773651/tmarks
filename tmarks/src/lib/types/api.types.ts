export interface ApiResponse<T = unknown> {
  data?: T
  error?: ApiError
  meta?: {
    page?: number
    page_size?: number
    total?: number
    next_cursor?: string
    count?: number
  }
}

export interface ApiError {
  code: string
  message: string
  details?: unknown
}
