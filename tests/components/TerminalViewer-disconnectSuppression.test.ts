/**
 * Tests for TerminalViewer's disconnect-indicator suppression.
 *
 * Bug being fixed: when the user clicks Stop, the WebSocket closes immediately
 * (isWsOpen → false) and the header showed a red "Déconnecté" indicator for
 * the brief window before the parent's loadSession() resolved and rendered
 * the end-state overlay. The user already knows they pressed Stop — that
 * indicator is noise (the orchestrator briefing called this out as "disconnect
 * indicator shown during intentional stop").
 *
 * The fix gates the "disconnected" status pill on:
 *   - props.isStopping === true (parent communicates an intentional stop), OR
 *   - activeEndState !== null (we're already rendering the end-state overlay,
 *     so the header indicator is redundant)
 *
 * Normal disconnects (network issue, server crash) must still surface the
 * indicator — the suppression is opt-in via those two signals.
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

// Stub the xterm dynamic imports so initXterm() doesn't try to load real DOM.
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
        // Render the default + headerActions slots so the status pill ends
        // up in wrapper.html() — the default `true` stub drops slot content.
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

describe('TerminalViewer — disconnect-indicator suppression', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('standalone mode (default)', () => {
    it('shows the "disconnected" indicator when the socket is closed and there is no intentional-stop signal', () => {
      const wrapper = mountViewer({
        sessionInfo: { session_id: 'sess-test', status: 'active' },
        isStopping: false,
        endReason: ''
      })

      // isWsOpen defaults to false on mount → isConnected is false.
      expect(wrapper.find('.status-disconnected').exists()).toBe(true)
    })

    it('hides the "disconnected" indicator while isStopping=true (user-initiated stop)', () => {
      const wrapper = mountViewer({
        sessionInfo: { session_id: 'sess-test', status: 'active' },
        isStopping: true,
        endReason: ''
      })

      expect(wrapper.find('.status-disconnected').exists()).toBe(false)
    })

    it('hides the "disconnected" indicator when an end-state overlay is active', () => {
      const wrapper = mountViewer({
        sessionInfo: { session_id: 'sess-test', status: 'stopped' },
        isStopping: false,
        endReason: 'stopped'
      })

      expect(wrapper.find('.status-disconnected').exists()).toBe(false)
    })
  })

  describe('SettingsCard mode', () => {
    // The SettingsCard branch renders the same status pill inside the card's
    // header slot. The component slots the action area into the stub; checking
    // for .status-disconnected confirms the gating applies symmetrically.
    it('shows "disconnected" by default (no intentional stop, no end-state)', () => {
      const wrapper = mountViewer({
        sessionInfo: { session_id: 'sess-test', status: 'active' },
        useSettingsCard: true,
        isStopping: false,
        endReason: ''
      })
      // SettingsCard is stubbed; the slot content still renders inside the stub.
      expect(wrapper.html()).toContain('status-disconnected')
    })

    it('hides "disconnected" when isStopping=true', () => {
      const wrapper = mountViewer({
        sessionInfo: { session_id: 'sess-test', status: 'active' },
        useSettingsCard: true,
        isStopping: true,
        endReason: ''
      })
      expect(wrapper.html()).not.toContain('status-disconnected')
    })

    it('hides "disconnected" when an end-state overlay is active', () => {
      const wrapper = mountViewer({
        sessionInfo: { session_id: 'sess-test', status: 'stopped' },
        useSettingsCard: true,
        isStopping: false,
        endReason: 'stopped'
      })
      expect(wrapper.html()).not.toContain('status-disconnected')
    })
  })
})
