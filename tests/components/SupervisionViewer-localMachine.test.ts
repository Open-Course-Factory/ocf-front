/**
 * A learner's machine that runs in their browser has no console on a server:
 * the wall shows the learner, says why there is no live view, and never tries
 * to connect.
 */

import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@xterm/xterm', () => ({
  Terminal: class {
    open() {}
    loadAddon() {} attachCustomKeyEventHandler() {}
    dispose() {}
    reset() {}
    write() {}
    onData() { return { dispose() {} } }
    cols = 80
    rows = 24
  }
}))
vi.mock('@xterm/addon-fit', () => ({ FitAddon: class { activate() {} fit() {} dispose() {} } }))
vi.mock('../../src/stores/currentUser', () => ({ useCurrentUserStore: () => ({ secretToken: 'tok' }) }))

import SupervisionViewer from '../../src/components/Terminal/SupervisionViewer.vue'

function mountViewer(sessionId: string) {
  setActivePinia(createPinia())
  return mount(SupervisionViewer, {
    props: { sessionId, learnerName: 'Karim', compact: true },
    global: {
      plugins: [createI18n({ legacy: false, locale: 'en', fallbackLocale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })]
    }
  })
}

describe('SupervisionViewer on a machine in the learner\'s browser', () => {
  it('says there is no live view, and opens no connection', async () => {
    const sockets = vi.fn()
    vi.stubGlobal('WebSocket', class { constructor(url: string) { sockets(url) } close() {} })
    const wrapper = mountViewer('local-abc')
    await flushPromises()

    expect(sockets).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Karim')
    expect(wrapper.find('[data-testid="supervision-in-browser"]').text()).toContain('browser')
    expect(wrapper.text()).not.toContain('Connecting')
    vi.unstubAllGlobals()
  })
})
