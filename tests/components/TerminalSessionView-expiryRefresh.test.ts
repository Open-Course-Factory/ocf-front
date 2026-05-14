/**
 * Tests for TerminalSessionView refreshing session state when the in-page
 * expiration countdown timer reaches zero.
 *
 * Bug being fixed: when the countdown timer hits 0 on a persistent session,
 * the page flips to the "expired" banner because:
 *   1. The interval clears itself but never re-fetches.
 *   2. Downstream computeds (`effectiveState`, `terminalEndReason`) keep
 *      reading the stale sessionInfo (state='running') combined with the
 *      now-past expires_at, which maps to terminalEndReason='expired'.
 *   3. Server-side, the session has been auto-stopped (persistent) — so the
 *      correct UI is the "Session arrêtée" banner with Resume + Delete CTAs,
 *      not the "Session expirée" banner.
 *
 * Fix: after clearInterval at remaining<=0, schedule a single delayed
 * loadSession() (~2s) so the backend has time to finish its auto-stop and
 * ocf-core's auto-sync surfaces state='stopped' to the next GET.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
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

describe('TerminalSessionView — expiry timer refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Fake the clock so we can fast-forward past the in-page countdown
    // without actually waiting. setSystemTime locks Date.now() for the
    // component's timestamp math (expires_at - Date.now()).
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-13T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('re-fetches the session from the server after the countdown timer reaches zero', async () => {
    // First GET (on mount): running, expires in 5s
    const initialExpiry = new Date(Date.now() + 5 * 1000).toISOString()
    mockAxiosGet.mockResolvedValueOnce({
      data: [
        {
          session_id: 'sess-test',
          status: 'active',
          state: 'running',
          expires_at: initialExpiry,
          persistence_mode: 'persistent',
          name: 'Persistent running session'
        }
      ]
    })
    // Second GET (after timer fires): backend has auto-stopped the session
    const stoppedExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    mockAxiosGet.mockResolvedValueOnce({
      data: [
        {
          session_id: 'sess-test',
          status: 'stopped',
          state: 'stopped',
          expires_at: stoppedExpiry,
          persistence_mode: 'persistent',
          name: 'Persistent running session'
        }
      ]
    })

    const wrapper = mountView()
    await flushPromises()

    // After mount: one GET call (initial load)
    expect(mockAxiosGet).toHaveBeenCalledTimes(1)

    // Advance the countdown past expiry: 6 seconds of interval ticks should
    // bring `remaining` to 0 and self-clear the interval.
    await vi.advanceTimersByTimeAsync(6 * 1000)
    // Advance through the post-timer refresh delay (2s upper bound for the
    // BE auto-stop → ocf-core auto-sync race) plus a small margin.
    await vi.advanceTimersByTimeAsync(2500)
    await flushPromises()

    // The server-side state should now be reflected on the page: the user
    // sees the "Session arrêtée" banner with Resume + Delete CTAs instead
    // of the "Session expirée" banner.
    expect(wrapper.find('[data-testid="resume-session-cta"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="delete-session-cta"]').exists()).toBe(true)
  })

  it('clears the scheduled refresh on unmount (no GET after the component is gone)', async () => {
    // Defensive: if the user navigates away during the 2s grace window, the
    // pending setTimeout must be cancelled — otherwise we issue an axios
    // call against a torn-down component and leak a promise.
    const initialExpiry = new Date(Date.now() + 5 * 1000).toISOString()
    mockAxiosGet.mockResolvedValueOnce({
      data: [
        {
          session_id: 'sess-test',
          status: 'active',
          state: 'running',
          expires_at: initialExpiry,
          persistence_mode: 'persistent',
          name: 'Persistent running session'
        }
      ]
    })

    const wrapper = mountView()
    await flushPromises()
    expect(mockAxiosGet).toHaveBeenCalledTimes(1)

    // Advance just past the countdown (timer fires, refresh is scheduled)
    // but unmount BEFORE the 2s grace window elapses.
    await vi.advanceTimersByTimeAsync(6 * 1000)
    wrapper.unmount()
    // Now let the would-be refresh fire — it must NOT call axios.
    await vi.advanceTimersByTimeAsync(5 * 1000)
    await flushPromises()

    expect(mockAxiosGet).toHaveBeenCalledTimes(1)
  })
})
