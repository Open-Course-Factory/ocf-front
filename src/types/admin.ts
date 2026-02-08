/**
 * Admin, audit, email template, and usage type definitions
 */

import type { BaseEntity } from './base'

/**
 * Audit Log entity
 */
export interface AuditLog extends BaseEntity {
  user_id: string
  organization_id?: string
  action: string
  entity_type: string
  entity_id: string
  changes?: Record<string, any>
  ip_address?: string
  user_agent?: string
}

/**
 * Email Template Variable
 */
export interface EmailTemplateVariable {
  name: string
  description: string
  example: string
}

/**
 * Email Template entity
 */
export interface EmailTemplate extends BaseEntity {
  name: string
  display_name: string
  description?: string
  subject: string
  html_body: string
  variables: string // JSON string of EmailTemplateVariable[]
  is_active: boolean
  is_system: boolean
  last_tested_at?: string
}

/**
 * Usage Metric entity
 */
export interface UsageMetric extends BaseEntity {
  user_id: string
  metric_type: 'concurrent_terminals' | 'courses' | 'lab_sessions'
  current_value: number
  limit_value: number
  period_start: string
  period_end: string
  last_updated: string
  usage_percent: number // Calculated: (current_value / limit_value) * 100
}

/**
 * Usage Limits (from subscription plan)
 */
export interface UsageLimits {
  max_concurrent_terminals: number
  max_session_duration_minutes: number
  max_courses: number
  allowed_machine_sizes: string[]
  network_access_enabled: boolean
  data_persistence_enabled: boolean
  data_persistence_gb: number
}
