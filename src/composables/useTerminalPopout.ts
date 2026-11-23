/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Labinux
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

import { computed, onBeforeUnmount, shallowRef } from 'vue'

// Sent by the page to its popup: the popup closes itself, so it can drop its
// console and its leave-page guard first instead of prompting.
export const POP_IN_MESSAGE = 'ocf-terminal-pop-in'

// Marks the terminal page as a popup that can be put back in the page.
export const POPOUT_QUERY = 'popout'

export function terminalWindowUrl(sessionId: string, popout = false): string {
  const url = `${window.location.origin}/terminal/${sessionId}?header=true&footer=false`
  return popout ? `${url}&${POPOUT_QUERY}=1` : url
}

export const TERMINAL_WINDOW_FEATURES = 'width=1000,height=600,menubar=no,toolbar=no,location=no,status=no'

/**
 * Opener side: moves a session's console to its own window, and brings it
 * back when that window closes, whichever side closed it.
 */
export function useTerminalPopout() {
  const popup = shallowRef<Window | null>(null)
  let watcher: ReturnType<typeof setInterval> | undefined

  function bringBack() {
    clearInterval(watcher)
    popup.value = null
  }

  // Returns false when the browser blocked the window: the console stays here.
  function popOut(sessionId: string): boolean {
    const win = window.open(terminalWindowUrl(sessionId, true), `ocf-terminal-${sessionId}`, TERMINAL_WINDOW_FEATURES)
    if (!win) return false
    popup.value = win
    clearInterval(watcher)
    // No event fires on the opener when a popup closes, so poll for it.
    watcher = setInterval(() => {
      if (win.closed) bringBack()
    }, 500)
    return true
  }

  function popIn() {
    popup.value?.postMessage(POP_IN_MESSAGE, window.location.origin)
  }

  onBeforeUnmount(() => clearInterval(watcher))

  return { isPoppedOut: computed(() => popup.value !== null), popOut, popIn }
}
