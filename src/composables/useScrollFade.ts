/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Tells a reader that a scroller has more below the fold.
 *
 * Extracted from the scenario briefing card, which was the only place that had
 * it, so the scenario instructions could get the same affordance without a
 * second copy of the rule.
 */

import { onUnmounted, ref, watch, type Ref } from 'vue'

// The fade must clear once the last line is readable, not once the final pixel
// arrives — a sub-pixel remainder is not "more to read".
const BOTTOM_EPSILON_PX = 10

/**
 * Toggles `hasOverflow` for a scrollable element that still has content below
 * its bottom edge. Bind it to the element's `has-overflow` class and give the
 * element the `ocf-scroll-fade` class, which carries the gradient.
 *
 * Call `check()` after replacing the element's content: nothing observed here
 * fires when text is swapped for text of a different length.
 */
export function useScrollFade(elementRef: Ref<HTMLElement | null>) {
  const hasOverflow = ref(false)

  function check() {
    const el = elementRef.value
    if (!el) {
      hasOverflow.value = false
      return
    }
    hasOverflow.value = el.scrollHeight - el.scrollTop - el.clientHeight > BOTTOM_EPSILON_PX
  }

  // Resizing the box changes what fits with no scroll and no new content — a
  // narrower panel reflows the text, a shorter one hides a paragraph.
  let observer: ResizeObserver | null = null

  watch(elementRef, (el) => {
    observer?.disconnect()
    observer = null

    if (el && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(check)
      observer.observe(el)
    }
    check()
  }, { immediate: true })

  onUnmounted(() => {
    observer?.disconnect()
    observer = null
  })

  return { hasOverflow, check }
}
