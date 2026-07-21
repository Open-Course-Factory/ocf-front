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
 * Per-group ordering for the live-session wall: the trainer drags tiles to arrange
 * them, and the order is remembered per group in localStorage.
 *
 * Persistence uses a self-describing, validated envelope `{ v: 1, order: string[] }`
 * so a stale / foreign / corrupted value under the key is ignored (fall back to
 * server order) instead of flowing into rendering and blanking the wall. A legacy
 * bare-array value written by older builds is still honored on read and upgraded to
 * the envelope on the next persist.
 */

import { ref, computed, type Ref } from 'vue'

interface Identified {
  session_id: string
}

const ENVELOPE_VERSION = 1

function storageKeyFor(groupId: string): string {
  return `ocf-live-wall-order-${groupId}`
}

// Read the stored order, understanding both the v1 envelope and a legacy bare
// array. Any other shape (or unreadable/invalid JSON) yields an empty order.
function readStoredOrder(key: string): string[] {
  let raw: string | null
  try {
    raw = localStorage.getItem(key)
  } catch {
    return []
  }
  if (raw === null) return []

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }

  if (Array.isArray(parsed)) return parsed as string[]
  if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { order?: unknown }).order)) {
    return (parsed as { order: string[] }).order
  }
  return []
}

function writeStoredOrder(key: string, order: string[]): void {
  try {
    localStorage.setItem(key, JSON.stringify({ v: ENVELOPE_VERSION, order }))
  } catch {
    /* storage unavailable — order stays in-memory for the session */
  }
}

export function useWallOrder<T extends Identified>(groupId: Ref<string>, liveSessions?: Ref<T[]>) {
  const wallOrder = ref<string[]>([])
  const draggingId = ref<string | null>(null)
  const storageKey = computed(() => storageKeyFor(groupId.value))

  // The single ordering primitive: stored order first (deduped, skipping ids no
  // longer live), then any remaining sessions in server order.
  function applyStoredOrder(list: T[], order: string[]): T[] {
    const byId = new Map(list.map(s => [s.session_id, s]))
    const ordered: T[] = []
    const seen = new Set<string>()
    for (const id of order) {
      const s = byId.get(id)
      if (s && !seen.has(id)) {
        ordered.push(s)
        seen.add(id)
      }
    }
    for (const s of list) {
      if (!seen.has(s.session_id)) {
        ordered.push(s)
        seen.add(s.session_id)
      }
    }
    return ordered
  }

  const orderedSessions = computed<T[]>(() =>
    liveSessions ? applyStoredOrder(liveSessions.value, wallOrder.value) : []
  )

  function loadStoredOrder() {
    wallOrder.value = readStoredOrder(storageKey.value)
  }

  function persist(order: string[]) {
    wallOrder.value = order
    writeStoredOrder(storageKey.value, order)
  }

  function onDragStart(sessionId: string, event: DragEvent) {
    draggingId.value = sessionId
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', sessionId)
    }
  }

  function onDrop(targetId: string, event: DragEvent) {
    const sourceId = draggingId.value || event.dataTransfer?.getData('text/plain') || ''
    draggingId.value = null
    if (!sourceId || sourceId === targetId) return

    const ids = orderedSessions.value.map(s => s.session_id)
    const from = ids.indexOf(sourceId)
    const to = ids.indexOf(targetId)
    if (from === -1 || to === -1) return
    ids.splice(from, 1)
    ids.splice(to, 0, sourceId)
    persist(ids)
  }

  return {
    wallOrder,
    draggingId,
    orderedSessions,
    applyStoredOrder,
    loadStoredOrder,
    persist,
    onDragStart,
    onDrop
  }
}
