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
 * Transient "just produced output" highlight for wall tiles. A session is marked
 * active on activity and stays active for `windowMs`; a fresh mark within the
 * window pushes the deadline out. `stop()` cancels every pending timer and is meant
 * to be wired to the consumer's onUnmounted.
 */

import { ref } from 'vue'

export function useActivityHighlight(windowMs = 2000) {
  const activeTiles = ref<Set<string>>(new Set())
  const timers = new Map<string, ReturnType<typeof setTimeout>>()

  function markActivity(sessionId: string) {
    const next = new Set(activeTiles.value)
    next.add(sessionId)
    activeTiles.value = next

    const existing = timers.get(sessionId)
    if (existing) clearTimeout(existing)
    timers.set(sessionId, setTimeout(() => {
      const cleared = new Set(activeTiles.value)
      cleared.delete(sessionId)
      activeTiles.value = cleared
      timers.delete(sessionId)
    }, windowMs))
  }

  function stop() {
    timers.forEach(timer => clearTimeout(timer))
    timers.clear()
  }

  return { activeTiles, markActivity, stop }
}
