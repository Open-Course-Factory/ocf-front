/**
 * Tests for TerminalSessionView's session-end state propagation.
 *
 * Bug being fixed: loadSession() rebuilt sessionInfo from a narrow allow-list
 * (session_id, expires_at, status, name, instance_type, machine_size), silently
 * dropping the new `state` field that ocf-core now returns. As a consequence,
 * getEffectiveSessionState() never saw the canonical state and fell back to the
 * legacy `status` branch, which maps 'stopped' → 'deleted' → 'expired' banner.
 * The user saw "Session expirée" instead of the existing stopped banner with
 * the Resume + Delete buttons.
 *
 * These tests exercise the loader seam (axios mock → component mount → assert
 * sessionInfo.value reflects the new fields) AND the user-visible behavior
 * (the resume-session-cta is rendered for state='stopped').
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

// Scenario service: no linked scenario in these tests
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

// currentUser store transitively imports the router; mock it so the
// component graph (TerminalViewer → currentUser → router) doesn't blow up
// when TerminalSessionView pulls in TerminalSessionPanel imports.
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

function mountView() {
  setActivePinia(createPinia())
  return mount(TerminalSessionView, {
    global: {
      plugins: [createTestI18n()],
      stubs: {
        TerminalSessionPanel: true,
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

describe('TerminalSessionView — stop state propagation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('preserves the `state` field returned by the backend on sessionInfo (loader does not drop it)', async () => {
    // Future expiry so getEffectiveSessionState honors `state` rather than the
    // expires_at invariant that forces 'deleted'.
    const futureExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    mockAxiosGet.mockResolvedValue({
      data: [
        {
          session_id: 'sess-test',
          status: 'stopped',
          state: 'stopped',
          expires_at: futureExpiry,
          persistence_mode: 'persistent',
          idle_until: futureExpiry,
          name: 'My stopped session',
          instance_type: 'ubuntu',
          machine_size: 'xs'
        }
      ]
    })

    const wrapper = mountView()
    await flushPromises()

    // The loader writes the explicit field set into sessionInfo; the `state`
    // field is the SSOT this MR restores.
    const vm = wrapper.vm as any
    expect(vm.sessionInfo).toBeTruthy()
    expect(vm.sessionInfo.state).toBe('stopped')
    expect(vm.sessionInfo.persistence_mode).toBe('persistent')
    // idle_until is included because future API additions read it from session
    // info (and the SSOT principle says we don't strip data the loader received).
    expect(vm.sessionInfo.idle_until).toBe(futureExpiry)
  })

  it('renders the stopped banner (resume-session-cta) when backend reports state=stopped', async () => {
    const futureExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    mockAxiosGet.mockResolvedValue({
      data: [
        {
          session_id: 'sess-test',
          status: 'stopped',
          state: 'stopped',
          expires_at: futureExpiry,
          // persistence_mode is required for the resume banner to render —
          // only persistent sessions can legitimately reach state='stopped'.
          // See TerminalSessionView-persistenceMode.test.ts for the gate.
          persistence_mode: 'persistent',
          name: 'My stopped session'
        }
      ]
    })

    const wrapper = mountView()
    await flushPromises()

    // The "stopped" branch of the template renders Resume + Delete CTAs.
    // The "expired" branch (the bug) renders a navigation-only banner without
    // these CTAs.
    expect(wrapper.find('[data-testid="resume-session-cta"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="delete-session-cta"]').exists()).toBe(true)
  })

  it('does NOT render the resume CTA when backend reports state=deleted (true expiry)', async () => {
    // Sanity check: the fix should not turn every end-state into "stopped".
    const pastExpiry = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    mockAxiosGet.mockResolvedValue({
      data: [
        {
          session_id: 'sess-test',
          status: 'expired',
          state: 'deleted',
          expires_at: pastExpiry
        }
      ]
    })

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.find('[data-testid="resume-session-cta"]').exists()).toBe(false)
  })
})
