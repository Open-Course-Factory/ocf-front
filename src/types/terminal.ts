/**
 * Terminal, backend, and SSH key type definitions
 */

import type { BaseEntity } from './base'

/**
 * Backend (Incus server) entity
 */
export interface Backend {
  id: string
  name: string
  description?: string
  connected: boolean
  is_default: boolean
  is_active: boolean
}

/**
 * Terminal Session entity
 */
export interface TerminalSession extends BaseEntity {
  user_id: string
  session_id: string
  name?: string
  instance_type?: string
  status: 'starting' | 'active' | 'stopped' | 'expired' | 'terminated'
  console_url?: string
  expires_at?: string
  terms?: string
  backend?: string
  organization_id?: string
}

/**
 * Terminal Share entity (extended to support group sharing)
 */
export interface TerminalShare extends BaseEntity {
  terminal_id: string
  shared_with_user_id?: string
  shared_with_group_id?: string
  shared_by_user_id: string
  share_type: 'user' | 'group'
  access_level: 'read' | 'write' | 'owner'
  expires_at?: string
  is_active: boolean
  metadata?: Record<string, any>
}

/**
 * SSH Key entity
 */
export interface SshKey extends BaseEntity {
  user_id: string
  name: string
  public_key?: string
  private_key?: string
  fingerprint?: string
}

/**
 * Distribution available for session creation
 */
export interface Distribution {
  name: string
  prefix: string
  description: string
  os_type?: string
  is_global: boolean
  min_size_key?: string
  default_size_key?: string
  supported_features?: string[]
}

/**
 * Size option returned by session-options endpoint
 */
export interface SessionOptionSize {
  key: string
  name: string
  description?: string
  cpu: number
  cpu_allowance: string
  memory: string
  disk: string
  processes: number
  sort_order: number
  allowed: boolean
  reason?: string
}

/**
 * Feature option returned by session-options endpoint
 */
export interface SessionOptionFeature {
  key: string
  name: string
  description?: string
  allowed: boolean
  reason?: string
}

/**
 * Response from GET /terminals/session-options
 */
export interface SessionOptionsResponse {
  distribution: Distribution
  allowed_sizes: SessionOptionSize[]
  allowed_features: SessionOptionFeature[]
}

/**
 * Request body for POST /terminals/start-composed-session
 */
export interface StartComposedSessionData {
  distribution: string
  size: string
  features: Record<string, boolean>
  terms: string
  name?: string
  expiry?: number
  backend?: string
  organization_id?: string
  hostname?: string
  packages?: string[]
}
