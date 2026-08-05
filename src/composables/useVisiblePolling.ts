/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */

import { onMounted, onUnmounted } from 'vue'

/**
 * Runs `poll` every `intervalMs` for as long as the component is mounted AND
 * the browser tab is visible, and once immediately when the tab comes back.
 *
 * Live counters are only worth refreshing while somebody is looking at them: a
 * teacher who leaves the console open in a background tab all afternoon should
 * not keep the endpoint busy, and should still see current numbers the moment
 * they switch back rather than up to a full interval later.
 */
export function useVisiblePolling(poll: () => void | Promise<void>, intervalMs: number) {
  let timer: ReturnType<typeof setInterval> | null = null

  const pollIfVisible = () => {
    if (!document.hidden) poll()
  }

  onMounted(() => {
    timer = setInterval(pollIfVisible, intervalMs)
    document.addEventListener('visibilitychange', pollIfVisible)
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
    timer = null
    document.removeEventListener('visibilitychange', pollIfVisible)
  })
}
