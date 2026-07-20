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
 * Read-only-by-default control gate for a supervisor watching a learner session.
 *
 * A supervisor starts READ-ONLY: no keystroke is ever forwarded to the learner's
 * shell until they explicitly take the hand. The button label toggles between
 * "take hand" and "release hand" via `controlActionKey`. The wire format is
 * pinned once in supervisionProtocol (sendTakeHand / sendReleaseHand).
 */

import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { sendTakeHand, sendReleaseHand } from '../services/domain/terminal/supervisionProtocol'

type MinimalSocket = Pick<WebSocket, 'send' | 'readyState'>

export interface SupervisionControl {
  hasControl: Ref<boolean>
  takeHand: () => void
  releaseHand: () => void
  forwardKeystroke: (data: string) => void
  controlActionKey: ComputedRef<'takeHand' | 'releaseHand'>
  isControlledByOther: ComputedRef<boolean>
}

/**
 * @param getSocket  the live supervise socket (or null).
 * @param isGloballyControlled  optional getter for the session's GLOBAL controlled
 *   state (set by ANY trainer's took_hand frame). It must NEVER leak into
 *   `hasControl` — that stays a purely LOCAL signal ("this client took the hand").
 *   `isControlledByOther` distinguishes "someone else holds the hand".
 */
export function useSupervisionControl(
  getSocket: () => MinimalSocket | null,
  isGloballyControlled?: () => boolean
): SupervisionControl {
  const hasControl = ref(false)

  const controlActionKey = computed<'takeHand' | 'releaseHand'>(() =>
    hasControl.value ? 'releaseHand' : 'takeHand'
  )

  const isControlledByOther = computed<boolean>(() =>
    isGloballyControlled?.() === true && !hasControl.value
  )

  function takeHand() {
    const socket = getSocket()
    if (socket) sendTakeHand(socket)
    hasControl.value = true
  }

  function releaseHand() {
    const socket = getSocket()
    if (socket) sendReleaseHand(socket)
    hasControl.value = false
  }

  function forwardKeystroke(data: string) {
    // Read-only until the hand is taken: never forward keystrokes to the learner.
    if (!hasControl.value) return
    const socket = getSocket()
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(data)
    }
  }

  return { hasControl, takeHand, releaseHand, forwardKeystroke, controlActionKey, isControlledByOther }
}
