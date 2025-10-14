/**
 * Service layer type definitions
 */

/**
 * Terminal instance type configuration
 */
export interface InstanceType {
  prefix: string
  name: string
  description: string
  size: string
  ram_gb?: number
  cpu_cores?: number
  display_order?: number
}

/**
 * Terminal instance availability check result
 */
export interface InstanceAvailability {
  available: boolean
  requiredSizes: string[]
  reason?: string
}

/**
 * Feature flag actor (user context)
 */
export interface FeatureFlagActor {
  userId: string
  role?: string
  email?: string
}

/**
 * Feature flag definition
 */
export interface FeatureFlag {
  key: string
  enabled: boolean
  description?: string
  created_at?: string
  updated_at?: string
}

/**
 * Server metrics (terminal capacity)
 */
export interface ServerMetrics {
  cpu_percent: number
  ram_total_gb: number
  ram_available_gb: number
  disk_total_gb?: number
  disk_available_gb?: number
  active_terminals?: number
  max_terminals?: number
  timestamp?: string
}

/**
 * Async operation state
 */
export interface AsyncState<T = any> {
  isLoading: boolean
  error: string
  data?: T
  lastLoaded?: Date
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
  prefix?: string
  enabled?: boolean
}

/**
 * Demo mode configuration
 */
export interface DemoConfig {
  enabled: boolean
  simulateDelay?: boolean
  delayMs?: number
  logActions?: boolean
}

/**
 * Notification options
 */
export interface NotificationOptions {
  title?: string
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  action?: () => void
  actionText?: string
}

/**
 * Toast notification options
 */
export interface ToastOptions {
  message: string
  duration?: number
  position?: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}
