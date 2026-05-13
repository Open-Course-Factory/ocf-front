/**
 * Tests for TerminalSessionView gating Stop/Resume on persistence_mode.
 *
 * Product model (clarified by the PO):
 *   - persistent session → can Stop (preserves disk) AND Destroy
 *   - ephemeral session  → only Destroy. Stop is not a meaningful action,
 *                          because at auto-expiry the backend destroys the
 *                          ephemeral instance outright (no resumable state).
 *
 * UI mirror:
 *   - When a session is running:
 *       * persistent → TerminalSessionPanel receives show-stop-button=true
 *       * ephemeral  → TerminalSessionPanel receives show-stop-button=false
 *   - When a session reaches state='stopped':
 *       * persistent → "Session arrêtée" banner with Resume + Destroy CTAs
 *       * ephemeral  → defensive guard: do NOT show the Resume banner (an
 *                      ephemeral session should never legitimately reach
 *                      stopped; if it does via stale data or corruption, we
 *                      must not offer Resume).
 *
 * SSOT note: persistence_mode now flows from the backend through
 * loadSession() → sessionInfo.persistence_mode. This file pins the contract
 * so any future template change that drops the gate (or re-adds the bare
 * `show-stop-button` literal) breaks here.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'

// ---- Mocks (must come before component import) ----

const mockAxiosGet = vi.fn()
const mockAxiosPost = vi.fn().mockResolvedValue({ data: {} })

vi.mock('axios', () => ({
  default: {
    get: (...args: any[]) => mockAxiosGet(...args),
    post: (...args: any[]) => mockAxiosPost(...args),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  }
}))

const mockRouterPush = vi.fn()
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { sessionId: 'sess-test' }, query: {} }),
  useRouter: () => ({ push: mockRouterPush }),
  createRouter: vi.fn(),
  createWebHistory: vi.fn()
}))

vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showConfirm: vi.fn().mockResolvedValue(true),
    showError: vi.fn(),
    showSuccess: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn(),
    showMessage: vi.fn(),
    showAlert: vi.fn(),
    showPrompt: vi.fn()
  })
}))

vi.mock('../../src/services/domain/scenario', () => ({
  scenarioSessionService: {
    getSessionByTerminal: vi.fn().mockResolvedValue(null),
    abandonSession: vi.fn().mockResolvedValue(undefined)
  }
}))

vi.mock('../../src/services/domain/terminal/terminalService', () => ({
  terminalService: {
    startSession: vi.fn().mockResolvedValue({}),
    stopSession: vi.fn().mockResolvedValue({}),
    deleteSession: vi.fn().mockResolvedValue({}),
    syncSession: vi.fn().mockResolvedValue({})
  }
}))

vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: () => ({
    userId: 'u-test',
    userName: 'test',
    userDisplayName: 'Test',
    userEmail: 'test@example.com',
    userRoles: ['Member'],
    secretToken: 'tok'
  })
}))

import TerminalSessionView from '../../src/components/Pages/TerminalSessionView.vue'

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

/**
 * Custom stub for TerminalSessionPanel that records the show-stop-button
 * prop so we can assert on it. The default `true` stub hides props from
 * wrapper.html().
 */
const TerminalSessionPanelStub = {
  name: 'TerminalSessionPanel',
  props: ['sessionInfo', 'isActive', 'isRecording', 'showStopButton', 'isStopping', 'showHistory', 'scenarioSessionId', 'scenarioFlagsEnabled', 'endReason', 'hasScenario'],
  template: '<div class="tsp-stub" :data-show-stop-button="String(showStopButton)"></div>'
}

function mountView() {
  setActivePinia(createPinia())
  return mount(TerminalSessionView, {
    global: {
      plugins: [createTestI18n()],
      stubs: {
        TerminalSessionPanel: TerminalSessionPanelStub,
        ScenarioPanel: true,
        ScenarioStartBar: true,
        ScenarioProvisioningOverlay: true,
        CommandHistory: true,
        BaseModal: true,
        'router-link': {
          props: ['to'],
          template: '<a class="router-link-stub"><slot /></a>'
        }
      }
    }
  })
}

const futureExpiry = () => new Date(Date.now() + 60 * 60 * 1000).toISOString()

describe('TerminalSessionView — persistence_mode gating', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('persistent + running → TerminalSessionPanel receives show-stop-button=true', async () => {
    mockAxiosGet.mockResolvedValue({
      data: [
        {
          session_id: 'sess-test',
          status: 'active',
          state: 'running',
          expires_at: futureExpiry(),
          persistence_mode: 'persistent',
          name: 'Persistent running session'
        }
      ]
    })

    const wrapper = mountView()
    await flushPromises()

    const panel = wrapper.find('.tsp-stub')
    expect(panel.exists()).toBe(true)
    expect(panel.attributes('data-show-stop-button')).toBe('true')
  })

  it('ephemeral + running → TerminalSessionPanel receives show-stop-button=false', async () => {
    mockAxiosGet.mockResolvedValue({
      data: [
        {
          session_id: 'sess-test',
          status: 'active',
          state: 'running',
          expires_at: futureExpiry(),
          persistence_mode: 'ephemeral',
          name: 'Ephemeral running session'
        }
      ]
    })

    const wrapper = mountView()
    await flushPromises()

    const panel = wrapper.find('.tsp-stub')
    expect(panel.exists()).toBe(true)
    expect(panel.attributes('data-show-stop-button')).toBe('false')
  })

  it('persistent + stopped → "Session arrêtée" banner with Resume CTA is rendered', async () => {
    mockAxiosGet.mockResolvedValue({
      data: [
        {
          session_id: 'sess-test',
          status: 'stopped',
          state: 'stopped',
          expires_at: futureExpiry(),
          persistence_mode: 'persistent',
          name: 'Persistent stopped session'
        }
      ]
    })

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.find('[data-testid="resume-session-cta"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="delete-session-cta"]').exists()).toBe(true)
  })

  it('ephemeral + stopped (defensive) → Resume banner is hidden; falls through to generic end banner', async () => {
    // In production, ephemeral sessions should never reach state='stopped':
    // the backend destroys them at expiry. But if a stale row or backend bug
    // produces this shape, we must NOT offer Resume — the underlying instance
    // is gone and tapping Resume would either error or (worse) imply that
    // ephemeral sessions have a "paused" state they don't have.
    mockAxiosGet.mockResolvedValue({
      data: [
        {
          session_id: 'sess-test',
          status: 'stopped',
          state: 'stopped',
          expires_at: futureExpiry(),
          persistence_mode: 'ephemeral',
          name: 'Ephemeral stopped (should not happen)'
        }
      ]
    })

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.find('[data-testid="resume-session-cta"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="delete-session-cta"]').exists()).toBe(false)
  })
})
