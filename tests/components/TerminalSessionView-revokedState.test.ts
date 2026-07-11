/**
 * Tests for TerminalSessionView's end-of-session reason mapping when the
 * backend reports a REVOKED session.
 *
 * Issue #272 / ocf-core #388: ocf-core now emits a distinct state='revoked' on
 * GET /terminals/user-sessions when a session is terminated for billing /
 * entitlement reasons (plan lapse, license revocation). Today the frontend
 * funnels this through the "unknown state" → 'deleted' → 'expired' path, so the
 * learner sees "Session Expired — you reached your time limit" — dishonest, and
 * high-stakes mid-exam. This pins the mapping contract:
 *   effectiveState 'revoked'  → terminalEndReason 'revoked'
 * and guards that a genuine TTL expiry (state='deleted') still maps to 'expired'.
 *
 * RED today: getEffectiveSessionState treats 'revoked' as unknown → 'deleted',
 * so effectiveState is 'deleted' and terminalEndReason is 'expired'.
 *
 * Harness mirrors TerminalSessionView-stopState.test.ts (loader seam:
 * axios mock → mount → assert exposed setup state).
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

describe('TerminalSessionView — revoked state maps to the revoked end reason', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("maps backend state='revoked' to effectiveState='revoked' (not 'deleted')", async () => {
    // Future expiry so the mapping is driven purely by the canonical `state`,
    // not by the expires_at invariant.
    const futureExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    mockAxiosGet.mockResolvedValue({
      data: [
        {
          session_id: 'sess-test',
          status: 'revoked',
          state: 'revoked',
          expires_at: futureExpiry,
          name: 'My revoked session'
        }
      ]
    })

    const wrapper = mountView()
    await flushPromises()

    const vm = wrapper.vm as any
    expect(vm.sessionInfo).toBeTruthy()
    expect(vm.sessionInfo.state).toBe('revoked')
    // RED today: unknown state falls through to 'deleted'.
    expect(vm.effectiveState).toBe('revoked')
  })

  it("maps a revoked session to terminalEndReason='revoked' (honest banner, not 'expired')", async () => {
    const futureExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    mockAxiosGet.mockResolvedValue({
      data: [
        {
          session_id: 'sess-test',
          status: 'revoked',
          state: 'revoked',
          expires_at: futureExpiry,
          name: 'My revoked session'
        }
      ]
    })

    const wrapper = mountView()
    await flushPromises()

    const vm = wrapper.vm as any
    // RED today: 'revoked' collapses to 'deleted' → mapped to 'expired'.
    expect(vm.terminalEndReason).toBe('revoked')
  })

  it("guard: a genuine TTL expiry (state='deleted') still maps to 'expired'", async () => {
    // The fix must not reclassify real expirations as revocations.
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

    const vm = wrapper.vm as any
    expect(vm.effectiveState).toBe('deleted')
    expect(vm.terminalEndReason).toBe('expired')
  })
})
