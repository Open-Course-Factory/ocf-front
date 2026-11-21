/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Labinux
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
 * Terminal text zoom, for a trainer showing a terminal to a room. One level for
 * every terminal on the page (module-level ref), remembered per browser.
 */

import { ref, computed } from 'vue'

const STORAGE_KEY = 'ocf-terminal-zoom'
const ZOOM_LEVELS = [0.75, 1, 1.25, 1.5, 1.75, 2, 2.5]

function readStoredZoom(): number {
  try {
    const stored = Number(localStorage.getItem(STORAGE_KEY))
    return ZOOM_LEVELS.includes(stored) ? stored : 1
  } catch {
    return 1
  }
}

const zoom = ref(readStoredZoom())

function setZoom(level: number) {
  zoom.value = level
  try {
    localStorage.setItem(STORAGE_KEY, String(level))
  } catch {
    // Storage blocked: the zoom still applies, it just is not remembered.
  }
}

export function useTerminalZoom() {
  const index = computed(() => ZOOM_LEVELS.indexOf(zoom.value))
  return {
    zoom,
    canZoomIn: computed(() => index.value < ZOOM_LEVELS.length - 1),
    canZoomOut: computed(() => index.value > 0),
    zoomIn: () => setZoom(ZOOM_LEVELS[Math.min(index.value + 1, ZOOM_LEVELS.length - 1)]),
    zoomOut: () => setZoom(ZOOM_LEVELS[Math.max(index.value - 1, 0)]),
    resetZoom: () => setZoom(1)
  }
}
