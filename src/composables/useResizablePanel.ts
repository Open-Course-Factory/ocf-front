/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Resizable side panel logic for editor pages.
 *
 * The same drag-from-the-left-edge resize behavior was duplicated in
 * ScenarioEditor.vue and CourseEditor.vue. This composable exposes it once.
 *
 * Usage:
 *
 *   const { panelWidth, isResizing, startResize } = useResizablePanel({
 *     storageKey: 'scenarioEditor_treePanelWidth'
 *   })
 *
 *   <div :style="{ width: panelWidth + 'px' }">
 *     <div class="resize-handle" @mousedown="startResize" :class="{ resizing: isResizing }" />
 *   </div>
 *
 * The composable installs document-level mousemove/mouseup listeners on mount
 * and tears them down on unmount, so callers don't need to wire that up.
 */

import { ref, onMounted, onUnmounted } from 'vue'

interface UseResizablePanelOptions {
  // localStorage key used to persist the width across reloads.
  storageKey: string
  // Default width when nothing is in storage.
  defaultWidth?: number
  // Min/max bounds enforced during drag and when reading from storage.
  minWidth?: number
  maxWidth?: number
}

export function useResizablePanel(options: UseResizablePanelOptions) {
  const minWidth = options.minWidth ?? 200
  const maxWidth = options.maxWidth ?? 600
  const defaultWidth = options.defaultWidth ?? 280

  const panelWidth = ref(defaultWidth)
  const isResizing = ref(false)
  const resizeStartX = ref(0)
  const resizeStartWidth = ref(0)

  function loadPanelWidth() {
    const saved = localStorage.getItem(options.storageKey)
    if (saved) {
      const width = parseInt(saved)
      if (width >= minWidth && width <= maxWidth) {
        panelWidth.value = width
      }
    }
  }

  function startResize(event: MouseEvent) {
    isResizing.value = true
    resizeStartX.value = event.clientX
    resizeStartWidth.value = panelWidth.value
    event.preventDefault()
  }

  function handleResize(event: MouseEvent) {
    if (!isResizing.value) return

    // Resize from left edge — moving the cursor left grows the panel.
    const deltaX = resizeStartX.value - event.clientX
    const newWidth = resizeStartWidth.value + deltaX

    if (newWidth >= minWidth && newWidth <= maxWidth) {
      panelWidth.value = newWidth
    }
  }

  function stopResize() {
    if (isResizing.value) {
      isResizing.value = false
      localStorage.setItem(options.storageKey, panelWidth.value.toString())
    }
  }

  onMounted(() => {
    loadPanelWidth()
    document.addEventListener('mousemove', handleResize)
    document.addEventListener('mouseup', stopResize)
  })

  onUnmounted(() => {
    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', stopResize)
  })

  return {
    panelWidth,
    isResizing,
    startResize,
    loadPanelWidth
  }
}
