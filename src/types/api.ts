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

// ==========================================
// ORGANIZATION API REQUEST/RESPONSE TYPES
// ==========================================

/**
 * Create Organization Request
 */
export interface CreateOrganizationRequest {
  name: string
  display_name: string
  description?: string
  max_groups?: number
  max_members?: number
}

/**
 * Update Organization Request
 */
export interface UpdateOrganizationRequest {
  display_name?: string
  description?: string
  max_groups?: number
  max_members?: number
  metadata?: Record<string, any>
}

/**
 * Subscribe Organization Request
 */
export interface SubscribeOrganizationRequest {
  subscription_plan_id: string
  payment_method_id?: string
  quantity?: number // Always 1 for org subscriptions
}

/**
 * Cancel Organization Subscription Request
 */
export interface CancelOrganizationSubscriptionRequest {
  cancel_at_period_end?: boolean
}

/**
 * Create Checkout Session Request (Individual)
 */
export interface CreateCheckoutSessionRequest {
  subscription_plan_id: string
  success_url: string
  cancel_url: string
  allow_replace?: boolean
}

/**
 * Create Bulk Checkout Session Request
 */
export interface CreateBulkCheckoutSessionRequest {
  subscription_plan_id: string
  quantity: number
  success_url: string
  cancel_url: string
  group_id?: string
}

/**
 * Upgrade Subscription Request
 */
export interface UpgradeSubscriptionRequest {
  new_plan_id: string
  proration_behavior?: 'always_invoice' | 'create_prorations' | 'none'
}

/**
 * Assign License Request
 */
export interface AssignLicenseRequest {
  user_id: string
}

/**
 * Update Batch Quantity Request
 */
export interface UpdateBatchQuantityRequest {
  new_quantity: number
}

/**
 * Checkout Session Response
 */
export interface CheckoutSessionResponse {
  url: string
  session_id: string
}

/**
 * Include query parameter for relationships
 */
export interface IncludeParams {
  includes?: string // e.g., "members,groups" or "subscription_plan,user"
}
