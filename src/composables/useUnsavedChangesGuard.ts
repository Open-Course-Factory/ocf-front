/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */

import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

/**
 * Asks before throwing away edits that were never saved.
 *
 * The step form sits in the page rather than in a modal, so nothing closes it
 * on purpose: opening another step, another scenario or another page simply
 * replaces it. `confirmDiscard()` resolves true straight away when there is
 * nothing to lose, otherwise once the author has answered the dialog the page
 * renders from `isAsking` — `answer(true)` discards, `answer(false)` stays.
 */
export function useUnsavedChangesGuard(isDirty: Ref<boolean>) {
  const isAsking = ref(false)
  let resolvePending: ((discard: boolean) => void) | null = null

  function confirmDiscard(): Promise<boolean> {
    if (!isDirty.value) return Promise.resolve(true)
    resolvePending?.(false)
    isAsking.value = true
    return new Promise(resolve => { resolvePending = resolve })
  }

  function answer(discard: boolean) {
    isAsking.value = false
    resolvePending?.(discard)
    resolvePending = null
  }

  onBeforeRouteLeave(() => confirmDiscard())

  // A tab close or reload cannot wait for an in-page dialog: the browser asks.
  function onBeforeUnload(event: BeforeUnloadEvent) {
    if (!isDirty.value) return
    event.preventDefault()
    event.returnValue = ''
  }

  onMounted(() => window.addEventListener('beforeunload', onBeforeUnload))
  onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))

  return { isAsking, confirmDiscard, answer }
}
