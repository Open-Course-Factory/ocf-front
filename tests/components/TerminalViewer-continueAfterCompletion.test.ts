/**
 * Tests for continuing in a completed scenario run (ocf-front #357).
 *
 * Completing a run does not stop its machine, but the "Session Complete"
 * overlay covered the console with navigation-only buttons, so the learner
 * could never get back to a terminal that was still running. While the machine
 * runs, the overlay now offers Continue experimenting, which dismisses it.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  }
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { sessionId: 'sess-test' }, query: {} }),
  useRouter: () => ({ push: vi.fn() }),
  createRouter: vi.fn(),
  createWebHistory: vi.fn()
}))

vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: () => ({ secretToken: 'tok' })
}))

vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showError: vi.fn(),
    showSuccess: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn(),
    showConfirm: vi.fn().mockResolvedValue(true)
  })
}))

vi.mock('../../src/services/domain/terminal/terminalService', () => ({
  terminalService: {
    syncSession: vi.fn().mockResolvedValue({})
  }
}))

vi.mock('@xterm/xterm', () => ({ Terminal: class { open() {} loadAddon() {} attachCustomKeyEventHandler() {} dispose() {} onResize() {} focus() {} reset() {} cols = 80; rows = 24; element = null } }))
vi.mock('@xterm/addon-fit', () => ({ FitAddon: class { fit() {} dispose() {} } }))
vi.mock('@xterm/addon-attach', () => ({ AttachAddon: class { dispose() {} } }))

import TerminalViewer from '../../src/components/Terminal/TerminalViewer.vue'
import TerminalEndStateOverlay from '../../src/components/Terminal/TerminalEndStateOverlay.vue'

const inOneHour = () => new Date(Date.now() + 3600_000).toISOString()
const running = () => ({ session_id: 'sess-test', state: 'running', expires_at: inOneHour() })
const stopped = () => ({ session_id: 'sess-test', state: 'stopped', expires_at: inOneHour() })

function mountViewer(sessionInfo: Record<string, unknown>) {
  setActivePinia(createPinia())
  return mount(TerminalViewer, {
    props: { sessionInfo, autoConnect: false, endReason: 'completed', hasScenario: true },
    global: {
      plugins: [createI18n({ legacy: false, locale: 'en', fallbackLocale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })],
      stubs: {
        SettingsCard: { template: '<div><slot name="headerActions" /><slot /></div>' },
        Button: true,
        RecordingIndicator: true,
        SessionCountdown: true,
        TerminalEndStateOverlay: true
      }
    }
  })
}

describe('TerminalViewer — continue after completion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('offers Continue on the completed overlay while the machine runs', () => {
    const wrapper = mountViewer(running())
    const overlay = wrapper.findComponent(TerminalEndStateOverlay)

    expect(overlay.exists()).toBe(true)
    expect(overlay.props('config').primary).toMatchObject({ kind: 'action', actionKey: 'continue' })
  })

  it('Continue dismisses the overlay and gives the console back', async () => {
    const wrapper = mountViewer(running())

    wrapper.findComponent(TerminalEndStateOverlay).vm.$emit('action', 'continue')
    await wrapper.vm.$nextTick()

    expect(wrapper.findComponent(TerminalEndStateOverlay).exists()).toBe(false)
  })

  it('brings the completed overlay back once the machine stops', async () => {
    const wrapper = mountViewer(running())
    wrapper.findComponent(TerminalEndStateOverlay).vm.$emit('action', 'continue')
    await wrapper.vm.$nextTick()

    await wrapper.setProps({ sessionInfo: stopped() })

    const overlay = wrapper.findComponent(TerminalEndStateOverlay)
    expect(overlay.exists()).toBe(true)
    expect(overlay.props('config').primary).toMatchObject({ kind: 'route', route: { name: 'MyScenarios' } })
  })

  it('does not offer Continue when the machine is no longer running', () => {
    const wrapper = mountViewer(stopped())

    expect(wrapper.findComponent(TerminalEndStateOverlay).props('config').primary.kind).toBe('route')
  })
})
