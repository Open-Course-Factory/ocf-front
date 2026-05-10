/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.

 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

/*
 * Single source of truth for terminal session lifecycle state.
 *
 * The `state` field on a session (added in 2026) is the canonical lifecycle
 * indicator: 'running' | 'stopped' | 'deleted'. The legacy `status` field
 * is being phased out and can be out of sync with `state` (some ocf-core
 * code paths still write `status='expired'` independently). Components MUST
 * use this helper rather than reading either field directly.
 *
 * Invariant: a session whose `expires_at` is in the past is dead regardless
 * of what `state` says — guards against stale rows (GORM AutoMigrate
 * stamping `state='running'` on legacy rows, server-side races, etc.).
 */
export type EffectiveSessionState = 'running' | 'stopped' | 'deleted'

export interface SessionLifecycleFields {
  state?: string | null
  status?: string | null
  expires_at?: string | null
}

export function getEffectiveSessionState(
  session: SessionLifecycleFields | null | undefined
): EffectiveSessionState {
  if (!session) return 'deleted'

  // expires_at invariant — past means dead.
  if (session.expires_at && new Date(session.expires_at).getTime() < Date.now()) {
    return 'deleted'
  }

  // Prefer the new `state` field when present.
  if (
    session.state === 'running' ||
    session.state === 'stopped' ||
    session.state === 'deleted'
  ) {
    return session.state
  }

  // Legacy fallback (old API responses pre-MR-D).
  if (session.status === 'active' || session.status === 'starting') return 'running'
  return 'deleted'
}

/**
 * Whether the session is currently consumable (terminal can be opened).
 * Convenience wrapper for the common boolean check.
 */
export function isSessionActive(
  session: SessionLifecycleFields | null | undefined
): boolean {
  return getEffectiveSessionState(session) === 'running'
}
