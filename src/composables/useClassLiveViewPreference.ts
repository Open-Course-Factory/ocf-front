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
 * Which representation of a class the teacher last used — the progression table
 * or the supervision wall — remembered per class.
 *
 * Same storage discipline as useWallOrder, for the same reason: a validated,
 * self-describing envelope `{ v: 1, view }` so a stale, foreign or corrupted
 * value under the key is ignored and the caller falls back to its default,
 * instead of flowing into rendering and showing neither view.
 */

import { computed, type Ref } from 'vue'

export type ClassLiveViewMode = 'progress' | 'wall'

const ENVELOPE_VERSION = 1

function isViewMode(value: unknown): value is ClassLiveViewMode {
  return value === 'progress' || value === 'wall'
}

export function useClassLiveViewPreference(groupId: Ref<string>) {
  const storageKey = computed(() => `ocf-class-live-view-${groupId.value}`)

  /** The remembered view, or null when nothing usable is stored. */
  function readStoredView(): ClassLiveViewMode | null {
    let raw: string | null
    try {
      raw = localStorage.getItem(storageKey.value)
    } catch {
      return null
    }
    if (raw === null) return null

    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      return null
    }
    const view = (parsed as { view?: unknown } | null)?.view
    return isViewMode(view) ? view : null
  }

  function storeView(view: ClassLiveViewMode): void {
    try {
      localStorage.setItem(storageKey.value, JSON.stringify({ v: ENVELOPE_VERSION, view }))
    } catch {
      /* storage unavailable — the choice still holds for this visit */
    }
  }

  return { readStoredView, storeView }
}
