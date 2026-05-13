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
 * Precedence: the canonical `state` field wins over `expires_at`. The
 * `expires_at`-in-the-past check only applies when `state === 'running'`
 * (zombie guard against stale rows / server-side races where the backend
 * hasn't yet transitioned an expired row out of 'running'). Once the
 * backend has set `state='stopped'` or `state='deleted'`, that is the
 * canonical truth — the original expires_at refers to the previous active
 * run's deadline and is naturally in the past, which is expected and not
 * a reason to override the backend's terminal state.
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

  const isExpired =
    !!session.expires_at && new Date(session.expires_at).getTime() < Date.now()

  // Canonical `state` from the backend wins. Why: 'stopped' and 'deleted' are
  // terminal-ish states deliberately set by the backend; their expires_at
  // (the previous active run's deadline) is naturally in the past once the
  // session is stopped — overriding to 'deleted' would hide the "Session
  // arrêtée — Resume / Delete" banner for persistent sessions and prevent
  // users from resuming a backend-preserved container.
  if (session.state === 'stopped' || session.state === 'deleted') {
    return session.state
  }

  // Zombie guard: state='running' but expires_at in the past means the
  // backend hasn't yet transitioned the row out of 'running' (server-side
  // race, stale row from GORM AutoMigrate, etc.). Treat as deleted.
  if (session.state === 'running') {
    return isExpired ? 'deleted' : 'running'
  }

  // Legacy fallback (old API responses pre-MR-D). Same zombie guard applies.
  if (session.status === 'active' || session.status === 'starting') {
    return isExpired ? 'deleted' : 'running'
  }
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

/**
 * Whether the WebSocket-backed terminal is currently usable: socket open AND
 * the session is effectively running per the SSOT. If sessionInfo is not yet
 * loaded, we trust the WebSocket state (the terminal page can open the WS
 * before sessionInfo is fetched, and we don't want to flicker an error during
 * that window).
 */
export function canConnectToTerminal(
  session: SessionLifecycleFields | null | undefined,
  isWebSocketOpen: boolean
): boolean {
  if (!isWebSocketOpen) return false
  if (session == null) return true
  return isSessionActive(session)
}

/**
 * Pre-connection error label to show when the terminal is not yet connected.
 * Returns null when the session is connectable (the caller should not show
 * an error in that case). 'sessionEnded' for stopped sessions, 'sessionExpired'
 * for deleted or expired sessions.
 */
export function preConnectError(
  session: SessionLifecycleFields | null | undefined
): 'sessionEnded' | 'sessionExpired' | null {
  if (session == null) return null
  const state = getEffectiveSessionState(session)
  if (state === 'running') return null
  if (state === 'stopped') return 'sessionEnded'
  return 'sessionExpired'
}
