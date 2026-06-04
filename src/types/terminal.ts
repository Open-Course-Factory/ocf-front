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
  // Size key from catalog (XS/S/M/L/XL) — surfaced so the UI can display
  // the budget weight of each session without re-fetching the catalog.
  machine_size?: string
  console_url?: string
  expires_at?: string
  terms?: string
  backend?: string
  organization_id?: string
  state: 'running' | 'stopped' | 'deleted' | 'starting' | 'resuming' | 'hibernating'
  persistence_mode?: 'ephemeral' | 'persistent'
  idle_until?: string
  // JSON string of the features enabled at composition time, e.g. `{"network":true}`.
  // Omitted/empty for legacy sessions created before the composed-feature model.
  composed_features?: string
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
  // Raw tt-backend cpuset count (NOT the budget cost). For user-facing vCPU display use cpu_mcpu instead.
  cpu: number
  cpu_allowance?: string
  memory: string
  disk: string
  processes: number
  sort_order: number
  // Effective CPU budget cost in millicores (1000 = 1 vCPU). SSOT for vCPU display. 0/undefined means the backend didn't have this size in its budget catalog — fall back to CANONICAL_SIZE_CATALOG.
  cpu_mcpu?: number
}

/**
 * Size option returned by session-options endpoint
 */
export interface SessionOptionSize {
  key: string
  name: string
  description?: string
  // Raw tt-backend cpuset count (NOT the budget cost). For user-facing vCPU display use cpu_mcpu instead.
  cpu: number
  cpu_allowance: string
  memory: string
  disk: string
  processes: number
  sort_order: number
  allowed: boolean
  reason?: string
  /** Parsed memory in MiB (server-computed) */
  memory_mb: number
  /** floor(min(remaining_cpu / cpu, remaining_memory_mb / memory_mb)) — server-computed */
  remaining_count: number
  // Effective CPU budget cost in millicores (1000 = 1 vCPU). SSOT for vCPU display. 0/undefined means the backend didn't have this size in its budget catalog — fall back to CANONICAL_SIZE_CATALOG.
  cpu_mcpu?: number
}

/**
 * Session quota block returned by session-options.
 * Tracks aggregate CPU + memory consumption against plan limits.
 *
 * Unlimited budget is signalled by `max_cpu === 0` / `max_memory_mb === 0` on the
 * relevant axis (the server still emits a `remaining_*` MaxInt32 sentinel so the
 * UI can render "unlimited" capacity without re-interpreting `max_*`).
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
  /** `unlimited` = unconstrained plan; ignore per-size remaining counts. */
  scope: 'user' | 'organization' | 'unlimited'
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
  quota: SessionQuota
}

/**
 * Per-user entry in org terminal usage response.
 * Reports the user's aggregate CPU/RAM usage across active sessions.
 */
export interface OrgTerminalUsageUser {
  user_id: string
  display_name: string
  email: string
  active_count: number
  /** Aggregate CPU consumed by this user's active sessions */
  active_cpu: number
  /** Aggregate memory (MiB) consumed by this user's active sessions */
  active_memory_mb: number
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
 * Reports the aggregate CPU/RAM budget envelope and remaining capacity per
 * catalog size for the organization's active plan.
 */
export interface OrgTerminalUsage {
  organization_id: string
  plan_name: string
  is_fallback: boolean
  users: OrgTerminalUsageUser[]
  /** Aggregate CPU/RAM quota across the organization */
  quota: SessionQuota
  /** Remaining capacity per catalog size */
  remaining_by_size: SizeRemaining[]
}

/**
 * One row of the active-sessions list returned by GET /terminals/my-usage.
 *
 * Stopped persistent sessions appear in this list because they still reserve
 * CPU/RAM against the plan budget (per D6). Stopped ephemeral sessions are
 * fully released and never appear here.
 */
export interface ActiveSession {
  session_id: string
  /** Falls back to instance type when blank */
  name: string
  /** "XS" | "S" | "M" | "L" | "XL" */
  size_key: string
  size_cpu: number
  size_memory_mb: number
  state: 'running' | 'stopped'
  persistence_mode: 'ephemeral' | 'persistent'
  /** ISO 8601 */
  last_started_at: string
  /** ISO 8601 */
  expires_at: string
}

/**
 * Response from GET /terminals/my-usage[?organization_id=<id>].
 *
 * The CPU/RAM envelope reflects either the user's personal plan or the org
 * plan when an organization context is passed. `max_cpu === 0` /
 * `max_memory_mb === 0` signals an unlimited axis (mirrors SessionQuota).
 */
export interface MyTerminalUsageResponse {
  plan_name: string
  plan_source: 'personal' | 'organization'
  /** Org name when source = organization, otherwise empty string */
  plan_source_name: string
  /** 0 = unlimited */
  max_cpu: number
  /** 0 = unlimited */
  max_memory_mb: number
  max_session_duration_minutes: number
  used_cpu: number
  used_memory_mb: number
  active_sessions: ActiveSession[]
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
