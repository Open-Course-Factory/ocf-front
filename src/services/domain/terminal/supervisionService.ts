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

/**
 * Terminal supervision service — the teacher-facing "class wall" data source and
 * the supervise WebSocket URL builder.
 */

import axios from 'axios'

export interface LiveSession {
  session_id: string
  user_id: string
  user_name?: string
  status?: string
}

export const supervisionService = {
  /**
   * List the active terminal sessions of a class group (the wall a teacher sees).
   * No /api/v1/ prefix — the axios interceptor adds it (a double prefix 404s).
   */
  async getGroupLiveSessions(groupId: string): Promise<LiveSession[]> {
    const response = await axios.get(`/class-groups/${groupId}/terminal-sessions`)
    return response.data
  }
}

/**
 * Build the supervise WebSocket URL for a learner session. Role and control are
 * enforced server-side by ocf-core, so the client URL just targets
 * /terminals/:id/supervise. Mirrors the console URL builder in TerminalViewer:
 * the /api/v1/ prefix is explicit (WS bypasses the axios interceptor) and the
 * scheme is wss iff VITE_PROTOCOL is https.
 */
export function buildSuperviseWsUrl(sessionId: string, token?: string): string {
  const protocol = import.meta.env.VITE_PROTOCOL === 'https' ? 'wss' : 'ws'
  const apiUrl = import.meta.env.VITE_API_URL
  let url = `${protocol}://${apiUrl}/api/v1/terminals/${sessionId}/supervise`
  if (token) {
    url += `?token=${encodeURIComponent(token)}`
  }
  return url
}
