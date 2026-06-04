/**
 * Tests for TerminalViewer's internet-access indicator in the status bar.
 *
 * The indicator lives alongside the recording / countdown badges and is driven
 * by the single source of truth `sessionHasNetwork(sessionInfo)`, which parses
 * the session's `composed_features` JSON string. A session with
 * `{"network":true}` renders the "on" badge (globe, success color); anything
 * else — undefined, malformed, or a different feature set — renders "off"
 * (crossed circle, muted). This must hold symmetrically in both the standalone
 * and SettingsCard render branches.
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

vi.mock('@xterm/xterm', () => ({ Terminal: class { open() {} loadAddon() {} dispose() {} onResize() {} focus() {} reset() {} cols = 80; rows = 24; element = null } }))
vi.mock('@xterm/addon-fit', () => ({ FitAddon: class { fit() {} dispose() {} } }))
vi.mock('@xterm/addon-attach', () => ({ AttachAddon: class { dispose() {} } }))

import TerminalViewer from '../../src/components/Terminal/TerminalViewer.vue'

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

function mountViewer(props: Record<string, unknown> = {}) {
  setActivePinia(createPinia())
  return mount(TerminalViewer, {
    props: {
      sessionInfo: { session_id: 'sess-test', status: 'active' },
      autoConnect: false,
      ...props
    },
    global: {
      plugins: [createTestI18n()],
      stubs: {
        SettingsCard: {
          template: '<div class="settings-card-stub"><slot name="headerActions" /><slot /></div>'
        },
        Button: true,
        RecordingIndicator: true,
        SessionCountdown: true,
        TerminalEndStateOverlay: true
      }
    }
  })
}

describe('TerminalViewer — internet-access indicator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('standalone mode (default)', () => {
    it('renders the "on" badge when composed_features enables network', () => {
      const wrapper = mountViewer({
        sessionInfo: { session_id: 'sess-test', composed_features: '{"network":true}' }
      })
      const badge = wrapper.find('.network-indicator')
      expect(badge.exists()).toBe(true)
      expect(badge.classes()).toContain('network-on')
      expect(badge.find('i').classes()).toContain('fa-globe')
    })

    it('renders the "off" badge when composed_features is absent', () => {
      const wrapper = mountViewer({
        sessionInfo: { session_id: 'sess-test' }
      })
      const badge = wrapper.find('.network-indicator')
      expect(badge.exists()).toBe(true)
      expect(badge.classes()).toContain('network-off')
      expect(badge.find('i').classes()).toContain('fa-ban')
    })

    it('renders the "off" badge when composed_features does not include network', () => {
      const wrapper = mountViewer({
        sessionInfo: { session_id: 'sess-test', composed_features: '{"docker":true}' }
      })
      const badge = wrapper.find('.network-indicator')
      expect(badge.classes()).toContain('network-off')
    })
  })

  describe('SettingsCard mode', () => {
    it('renders the "on" badge inside the card header when network is enabled', () => {
      const wrapper = mountViewer({
        useSettingsCard: true,
        sessionInfo: { session_id: 'sess-test', composed_features: '{"network":true}' }
      })
      const badge = wrapper.find('.network-indicator')
      expect(badge.exists()).toBe(true)
      expect(badge.classes()).toContain('network-on')
    })

    it('renders the "off" badge inside the card header when network is disabled', () => {
      const wrapper = mountViewer({
        useSettingsCard: true,
        sessionInfo: { session_id: 'sess-test' }
      })
      const badge = wrapper.find('.network-indicator')
      expect(badge.exists()).toBe(true)
      expect(badge.classes()).toContain('network-off')
    })
  })
})
