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
  access_level: 'read' | 'write' | 'admin'
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
