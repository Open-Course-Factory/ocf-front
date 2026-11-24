/**
 * The viewer's enlarge button fills the browser window instead of asking the
 * browser for full screen: browsers keep Esc to leave a page's full screen, so
 * vim's Esc threw the trainer out of it (Firefox offers no way to keep the key).
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

vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: () => ({ secretToken: 'tok' })
}))

import SupervisionViewer from '../../src/components/Terminal/SupervisionViewer.vue'

async function mountViewer() {
  setActivePinia(createPinia())
  const wrapper = mount(SupervisionViewer, {
    props: { sessionId: 'sess-1', autoConnect: false },
    global: {
      plugins: [createI18n({
        legacy: false, locale: 'en', fallbackLocale: 'en',
        messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false
      })]
    }
  })
  await flushPromises()
  return wrapper
}

describe('SupervisionViewer — fill the window', () => {
  it('fills the window and back without the browser full screen, which takes Esc', async () => {
    const requestFullscreen = vi.fn().mockResolvedValue(undefined)
    HTMLElement.prototype.requestFullscreen = requestFullscreen
    const wrapper = await mountViewer()
    const button = wrapper.find('[data-testid="supervision-fullscreen"]')

    await button.trigger('click')
    expect(wrapper.classes()).toContain('supervision-viewer-maximized')
    expect(requestFullscreen).not.toHaveBeenCalled()

    await button.trigger('click')
    expect(wrapper.classes()).not.toContain('supervision-viewer-maximized')
  })
})
