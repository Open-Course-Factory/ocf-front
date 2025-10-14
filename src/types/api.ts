/**
 * API request and response type definitions
 */

/**
 * Standard paginated API response
 */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  currentPage: number
  lastPage: number
  perPage: number
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  data: T
  message?: string
  success?: boolean
}

/**
 * API request configuration
 */
export interface ApiRequestConfig {
  headers?: Record<string, string>
  params?: Record<string, any>
  timeout?: number
}

/**
 * Cursor-based pagination parameters
 */
export interface CursorPaginationParams {
  cursor?: string
  limit?: number
}

/**
 * Offset-based pagination parameters
 */
export interface OffsetPaginationParams {
  page?: number
  perPage?: number
  limit?: number
  offset?: number
}

/**
 * Common query filters
 */
export interface QueryFilters {
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, any>
}

/**
 * File upload configuration
 */
export interface FileUploadConfig {
  file: File
  onProgress?: (progress: number) => void
  maxSize?: number
  allowedTypes?: string[]
}
