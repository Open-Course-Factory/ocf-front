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
 * Supervision protocol — the safety-critical split between terminal output and
 * control metadata on a supervised terminal WebSocket.
 *
 * The supervise socket carries two kinds of frames that MUST NEVER be confused:
 *   - TEXT frames   → raw PTY output, written verbatim to xterm.
 *   - BINARY frames → JSON control metadata (`{"type":"attachment",...}`) that
 *                     drives the learner indicator (watched / controlled /
 *                     observer count / ended). NEVER written to the terminal.
 *
 * The routing decision is kept pure here so TerminalViewer / SupervisionViewer
 * can wire it to `socket.onmessage` without re-deriving the rules.
 */

export interface SupervisionState {
  watched: boolean
  controlled: boolean
  observers: number
  ended: boolean
}

export function initialSupervisionState(): SupervisionState {
  return { watched: false, controlled: false, observers: 0, ended: false }
}

export type SupervisionFrameRoute =
  | { route: 'terminal' }
  | { route: 'ignore' }
  | { route: 'control'; state: SupervisionState }

/**
 * Decide how an incoming frame should be handled.
 *
 * SAFETY: a TEXT frame is ALWAYS terminal output — it is never parsed as
 * control, even if its bytes happen to look like a control message (a learner
 * can echo control-shaped JSON into their own shell). Only BINARY frames are
 * inspected as control metadata; anything malformed or unrecognized is ignored
 * (never thrown, never written to the terminal) so the feature is
 * forward-compatible with new backend events.
 */
export function routeSupervisionFrame(
  data: string,
  isBinary: boolean,
  current: SupervisionState
): SupervisionFrameRoute {
  if (!isBinary) {
    return { route: 'terminal' }
  }

  let parsed: any
  try {
    parsed = JSON.parse(data)
  } catch {
    return { route: 'ignore' }
  }

  if (!parsed || parsed.type !== 'attachment' || typeof parsed.event !== 'string') {
    return { route: 'ignore' }
  }

  const state: SupervisionState = { ...current }

  switch (parsed.event) {
    case 'joined':
      state.watched = true
      state.observers = typeof parsed.observers === 'number'
        ? parsed.observers
        : current.observers + 1
      break
    case 'left':
      state.observers = Math.max(0, current.observers - 1)
      state.watched = state.observers > 0
      break
    case 'took_hand':
      state.controlled = true
      state.watched = true
      break
    case 'released':
      state.controlled = false
      break
    case 'session_ended':
      state.ended = true
      break
    default:
      // Unknown event — ignore rather than mutate state (forward-compatible).
      return { route: 'ignore' }
  }

  return { route: 'control', state }
}

/**
 * The in-band control envelope a supervisor sends to take / release the hand.
 * Sent as a TEXT frame (plain JSON string) on the supervise socket — NOT binary
 * (unlike the resize message, which is TextEncoder-encoded), and NOT to
 * tt-backend.
 */
export const SUPERVISION_MESSAGES = {
  takeHand: JSON.stringify({ type: 'take_hand' }),
  releaseHand: JSON.stringify({ type: 'release_hand' })
}

function sendWhenOpen(socket: Pick<WebSocket, 'send' | 'readyState'>, message: string): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(message)
  }
}

export function sendTakeHand(socket: Pick<WebSocket, 'send' | 'readyState'>): void {
  sendWhenOpen(socket, SUPERVISION_MESSAGES.takeHand)
}

export function sendReleaseHand(socket: Pick<WebSocket, 'send' | 'readyState'>): void {
  sendWhenOpen(socket, SUPERVISION_MESSAGES.releaseHand)
}
