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
 * Terminal Session entity. `state` is the SSOT lifecycle field driven by
 * tt-backend (running, stopped, deleted, etc.). The legacy parallel
 * `status` field was removed in MR !239 — readers must consume `state`
 * via getEffectiveSessionState() in utils/sessionState.ts.
 */
export interface TerminalSession extends BaseEntity {
  user_id: string
  session_id: string
  name?: string
  instance_type?: string
  console_url?: string
  expires_at?: string
  terms?: string
  backend?: string
  organization_id?: string
  state: 'running' | 'stopped' | 'deleted' | 'starting' | 'resuming' | 'hibernating'
  persistence_mode?: 'ephemeral' | 'persistent'
  idle_until?: string
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
 * Machine size catalog entry returned by GET /terminals/sizes
 */
export interface Size {
  key: string
  name: string
  description?: string
  cpu: number
  cpu_allowance?: string
  memory: string
  disk: string
  processes: number
  sort_order: number
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
  /** Parsed memory in MiB (server-computed, optional during dual-mode rollout) */
  memory_mb?: number
  /** floor(min(remaining_cpu / cpu, remaining_memory_mb / memory_mb)) — server-computed */
  remaining_count?: number
}

/**
 * Session quota block returned by session-options (budget mode).
 * Tracks aggregate CPU + memory consumption against plan limits.
 *
 * **The presence of this field IS the budget-mode signal.** When the backend
 * runs a plan in count mode, it MUST omit this field (do not emit a sentinel
 * `scope: "unlimited"` — that variant was retired in MR !237). When this field
 * is present, callers treat the response as budget mode regardless of values:
 * - `max_cpu === 0` / `max_memory_mb === 0` mean "no cap on that axis"
 *   (the server still emits a `remaining_*` MaxInt32 sentinel so the UI can
 *   render "unlimited" capacity without re-interpreting `max_*`).
 */
export interface SessionQuota {
  /** 0 = unlimited */
  max_cpu: number
  /** 0 = unlimited */
  max_memory_mb: number
  used_cpu: number
  used_memory_mb: number
  remaining_cpu: number
  remaining_memory_mb: number
  scope: 'user' | 'organization'
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
  /** Budget-mode quota block — optional during dual-mode rollout */
  quota?: SessionQuota
}

/**
 * Per-user entry in org terminal usage response.
 * In budget mode the backend also reports the user's aggregate CPU/RAM usage.
 */
export interface OrgTerminalUsageUser {
  user_id: string
  display_name: string
  email: string
  active_count: number
  /** Budget mode only — aggregate CPU consumed by this user's active sessions */
  active_cpu?: number
  /** Budget mode only — aggregate memory (MiB) consumed by this user's active sessions */
  active_memory_mb?: number
}

/**
 * Remaining capacity per catalog size for budget-mode plans.
 * `remaining_count = floor(min(remaining_cpu / cpu, remaining_memory_mb / memory_mb))`.
 */
export interface SizeRemaining {
  key: string
  cpu: number
  memory_mb: number
  remaining_count: number
}

/**
 * Response from GET /organizations/:id/terminal-usage.
 *
 * Backward-compatible: legacy count-mode fields (`active_terminals`, `max_terminals`)
 * are always present. Budget-mode fields (`quota`, `remaining_by_size`) are optional
 * and only populated when the org's plan uses `quota_model: 'budget'`.
 */
export interface OrgTerminalUsage {
  organization_id: string
  active_terminals: number
  max_terminals: number
  plan_name: string
  is_fallback: boolean
  users: OrgTerminalUsageUser[]
  /** Budget mode — aggregate CPU/RAM quota across the organization */
  quota?: SessionQuota
  /** Budget mode — remaining capacity per catalog size */
  remaining_by_size?: SizeRemaining[]
}

/**
 * Request body for POST /terminals/start-composed-session
 */
export interface StartComposedSessionData {
  distribution: string
  size: string
  features: Record<string, boolean>
  terms: string
  recording_enabled: number
  name?: string
  expiry?: number
  backend?: string
  organization_id?: string
  hostname?: string
  packages?: string[]
  persistence_mode?: 'ephemeral' | 'persistent'
}
