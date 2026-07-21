/**
 * Tests for SupervisionViewer's root keydown handling.
 *
 * The compact tile is keyboard-activatable: space / enter expand it, and the
 * browser's default (page scroll on space) must be suppressed. But the
 * non-compact (focused) viewer embeds a live xterm the supervisor can type into
 * once they take the hand. The root's `@keydown.space.prevent` /
 * `@keydown.enter.prevent` call preventDefault UNCONDITIONALLY (Vue's `.prevent`
 * modifier ignores the ternary), so a space bubbling up from xterm's textarea
 * gets its default cancelled — killing the follow-up input event and swallowing
 * the space before xterm emits it via onData. Supervisor-typed spaces vanish.
 *
 * Contract pinned here:
 *   - non-compact: space/enter keydown reaching the root leaves the event
 *     un-prevented and emits NO 'expand' — the shell receives the space.
 *   - compact: space/enter still preventDefault AND emit 'expand' — the tile's
 *     keyboard activation keeps working (regression guard for the fix).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'

vi.mock('@xterm/xterm', () => ({
  Terminal: class {
    open() {}
    loadAddon() {}
    dispose() {}
    reset() {}
    write() {}
    onData() { return { dispose() {} } }
    cols = 80
    rows = 24
  }
}))
vi.mock('@xterm/addon-fit', () => ({ FitAddon: class { fit() {} dispose() {} } }))

vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: () => ({ secretToken: 'tok' })
}))

import SupervisionViewer from '../../src/components/Terminal/SupervisionViewer.vue'

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false
  })
}

async function mountViewer(props: Record<string, unknown> = {}) {
  setActivePinia(createPinia())
  const wrapper = mount(SupervisionViewer, {
    props: {
      sessionId: 'sess-1',
      autoConnect: false,
      ...props
    },
    global: {
      plugins: [createTestI18n()]
    }
  })
  // onMounted lazily imports the (mocked) xterm modules — let it settle.
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 0))
  await nextTick()
  return wrapper
}

// Dispatch a real, cancelable keydown on the root element so preventDefault()
// registers on the event and `defaultPrevented` reflects the true browser state.
function dispatchKeydown(el: Element, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
  el.dispatchEvent(event)
  return event
}

describe('SupervisionViewer — root keydown passthrough', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('non-compact (focused) viewer', () => {
    it('does not preventDefault a space keydown reaching the root', async () => {
      const wrapper = await mountViewer({ compact: false })
      const event = dispatchKeydown(wrapper.element, ' ')
      expect(event.defaultPrevented).toBe(false)
    })

    it('does not preventDefault an enter keydown reaching the root', async () => {
      const wrapper = await mountViewer({ compact: false })
      const event = dispatchKeydown(wrapper.element, 'Enter')
      expect(event.defaultPrevented).toBe(false)
    })

    it('emits no "expand" on space keydown', async () => {
      const wrapper = await mountViewer({ compact: false })
      dispatchKeydown(wrapper.element, ' ')
      expect(wrapper.emitted('expand')).toBeUndefined()
    })
  })

  describe('compact tile', () => {
    it('preventDefaults a space keydown so the page does not scroll', async () => {
      const wrapper = await mountViewer({ compact: true })
      const event = dispatchKeydown(wrapper.element, ' ')
      expect(event.defaultPrevented).toBe(true)
    })

    it('emits "expand" on space keydown', async () => {
      const wrapper = await mountViewer({ compact: true })
      dispatchKeydown(wrapper.element, ' ')
      expect(wrapper.emitted('expand')).toHaveLength(1)
    })

    it('emits "expand" on enter keydown', async () => {
      const wrapper = await mountViewer({ compact: true })
      dispatchKeydown(wrapper.element, 'Enter')
      expect(wrapper.emitted('expand')).toHaveLength(1)
    })
  })
})
