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

import { defineStore } from 'pinia'
import axios from 'axios'

/**
 * Lightweight summary of a user surfaced in the impersonation UI (banner,
 * picker, etc.). Mirrors the shape returned by
 * POST /admin/impersonate/start and the embedded `impersonated_by` block of
 * /auth/me when an impersonation session is active.
 */
export interface UserSummary {
  id: string
  username: string
  display_name: string
  email: string
  avatar?: string
}

/**
 * Reactive shape of the impersonation store state.
 */
export interface ImpersonationState {
  /** ID of the user the admin is currently impersonating, if any. */
  targetUserId: string | null
  /** Profile of the impersonated user, for banner display. */
  target: UserSummary | null
  /** Profile of the admin behind the impersonation, for banner display. */
  impersonator: UserSummary | null
  /** True while an impersonation API call is in flight. */
  loading: boolean
  /** Last error message from start()/stop(), or null. */
  error: string | null
}

/**
 * sessionStorage key used to persist the impersonation target across page
 * reloads (kept per-tab so different tabs don't accidentally share an
 * impersonation context).
 */
export const SESSION_STORAGE_KEY = 'ocf_impersonate_target'

const START_URL = 'admin/impersonate/start'
const STOP_URL = 'admin/impersonate/stop'

function extractErrorMessage(err: any): string {
  return (
    err?.response?.data?.error_message ||
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    'unknown error'
  )
}

/**
 * Pinia store managing admin user-impersonation state on the frontend.
 *
 * The state machine is intentionally minimal:
 *  - hydrate() reads sessionStorage on app boot so the next /auth/me call
 *    carries the X-Impersonate-User header (added by the axios interceptor).
 *  - start(targetUserId) calls the backend, persists to sessionStorage on
 *    success, and exposes the target profile to the UI banner.
 *  - stop(silent?) ALWAYS clears local state, even on backend failure, to
 *    avoid stranding the frontend if the server-side session has already
 *    expired. `silent=true` skips the network call (used by the axios
 *    response interceptor when the backend has already signalled the
 *    impersonation is gone).
 *  - applyAuthMeData(data) is called by the currentUser store after every
 *    /auth/me load so the impersonation banner reflects the authoritative
 *    server state (including detecting silent server-side expiry).
 */
export const useImpersonationStore = defineStore('impersonation', {
  state: (): ImpersonationState => ({
    targetUserId: null,
    target: null,
    impersonator: null,
    loading: false,
    error: null,
  }),
  getters: {
    isImpersonating(state): boolean {
      return state.targetUserId !== null && state.targetUserId !== ''
    },
  },
  actions: {
    /**
     * Read sessionStorage and restore `targetUserId` so the next API call
     * carries the impersonation header. Does NOT call the backend — the
     * subsequent /auth/me will confirm or clear via applyAuthMeData().
     */
    hydrate() {
      try {
        const raw = sessionStorage.getItem(SESSION_STORAGE_KEY)
        if (!raw) return
        const trimmed = raw.trim()
        if (!trimmed) return
        this.targetUserId = trimmed
      } catch (_e) {
        // sessionStorage may be unavailable (private browsing, SSR) — ignore
      }
    },

    /**
     * Start impersonating a user. POSTs to the backend, persists the target
     * id to sessionStorage on success, and populates the banner state.
     */
    async start(targetUserId: string): Promise<UserSummary | null> {
      this.loading = true
      this.error = null
      try {
        const response = await axios.post(START_URL, { target_user_id: targetUserId })
        const target: UserSummary | null = response?.data?.target ?? null
        try {
          sessionStorage.setItem(SESSION_STORAGE_KEY, targetUserId)
        } catch (_e) {
          // sessionStorage unavailable — the impersonation is still active
          // for this session, just won't survive a reload
        }
        this.targetUserId = targetUserId
        this.target = target
        return target
      } catch (err: any) {
        this.error = extractErrorMessage(err)
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Stop the active impersonation. ALWAYS clears local state (even on
     * failure) so the frontend can recover from a server-side expiry. When
     * `silent` is true, no network call is made — used by the axios
     * interceptor when the backend has already invalidated the session.
     */
    async stop(silent?: boolean): Promise<void> {
      try {
        if (silent !== true) {
          try {
            await axios.post(STOP_URL)
          } catch (err: any) {
            // Swallow — local state must always be cleared
            this.error = extractErrorMessage(err)
          }
        }
      } finally {
        this.targetUserId = null
        this.target = null
        this.impersonator = null
        try {
          sessionStorage.removeItem(SESSION_STORAGE_KEY)
        } catch (_e) {
          // ignore
        }
      }
    },

    /**
     * Sync impersonation state from a freshly-loaded /auth/me response.
     *  - If the response carries `impersonated_by`, populate banner state.
     *  - If the response lacks `impersonated_by` but local state thinks we
     *    are impersonating, the server-side session expired — clear local
     *    state.
     */
    applyAuthMeData(data: any) {
      if (!data) return
      if (data.impersonated_by) {
        const ib = data.impersonated_by
        this.impersonator = {
          id: ib.id || ib.user_id || '',
          username: ib.username || ib.user_name || '',
          display_name: ib.display_name || ib.username || '',
          email: ib.email || '',
          avatar: ib.avatar,
        }
        this.target = {
          id: data.id || data.user_id || '',
          username: data.username || data.user_name || '',
          display_name: data.display_name || data.username || '',
          email: data.email || '',
          avatar: data.avatar,
        }
        // Keep targetUserId aligned with the authoritative server view
        if (this.target.id) {
          this.targetUserId = this.target.id
        }
      } else if (this.targetUserId !== null) {
        // Server says no impersonation, but local state thinks otherwise —
        // the session expired or was revoked. Clear everything.
        this.targetUserId = null
        this.target = null
        this.impersonator = null
        try {
          sessionStorage.removeItem(SESSION_STORAGE_KEY)
        } catch (_e) {
          // ignore
        }
      }
    },
  },
})
