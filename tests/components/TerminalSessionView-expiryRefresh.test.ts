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
 * Fix: after clearInterval at remaining<=0, poll the session silently with
 * increasing backoff so the BE auto-stop + ocf-core auto-sync race has time
 * to settle. The refresh must NOT flash the loading spinner, must stop as
 * soon as state transitions, and must give up after a capped number of
 * attempts to avoid polling forever.
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

// Helpers
function runningPayload(expiresAt: string) {
  return {
    data: [
      {
        session_id: 'sess-test',
        status: 'active',
        state: 'running',
        expires_at: expiresAt,
        persistence_mode: 'persistent',
        name: 'Persistent running session'
      }
    ]
  }
}

function stoppedPayload(expiresAt: string) {
  return {
    data: [
      {
        session_id: 'sess-test',
        status: 'stopped',
        state: 'stopped',
        expires_at: expiresAt,
        persistence_mode: 'persistent',
        name: 'Persistent running session'
      }
    ]
  }
}

function ephemeralRunningPayload(expiresAt: string) {
  return {
    data: [
      {
        session_id: 'sess-test',
        status: 'active',
        state: 'running',
        expires_at: expiresAt,
        persistence_mode: 'ephemeral',
        name: 'Ephemeral running session'
      }
    ]
  }
}

describe('TerminalSessionView — expiry timer refresh', () => {
  beforeEach(() => {
    // mockReset clears both call history AND any queued mockResolvedValueOnce /
    // mockReturnValueOnce implementations — critical here because tests use
    // hanging promises (`new Promise(() => {})`) that would otherwise bleed
    // into the next test's initial-load GET and leave it stuck on the loading
    // spinner forever. clearAllMocks() does NOT reset the implementation queue.
    mockAxiosGet.mockReset()
    mockAxiosPost.mockReset()
    mockAxiosPost.mockResolvedValue({ data: {} })
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
    mockAxiosGet.mockResolvedValueOnce(runningPayload(initialExpiry))
    // Second GET (after timer fires): backend has auto-stopped the session
    const stoppedExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    mockAxiosGet.mockResolvedValueOnce(stoppedPayload(stoppedExpiry))

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

  it('does not flip isLoading or show the loading spinner during the silent refresh after timer expiry', async () => {
    // The silent refresh path must NOT toggle the page into the loading
    // state, otherwise the whole view flashes to the spinner before the
    // stopped banner renders.
    const initialExpiry = new Date(Date.now() + 5 * 1000).toISOString()
    mockAxiosGet.mockResolvedValueOnce(runningPayload(initialExpiry))

    // For the silent refresh, return a controllable pending promise so we
    // can observe the in-flight state (when the buggy `isLoading=true`
    // would otherwise be visible).
    let resolveRefresh: ((value: any) => void) | null = null
    mockAxiosGet.mockReturnValueOnce(
      new Promise((res) => {
        resolveRefresh = res
      })
    )

    const wrapper = mountView()
    await flushPromises()

    // Sanity: after the initial load, spinner is gone.
    expect(wrapper.find('.loading-section').exists()).toBe(false)

    // Advance past the in-page countdown so the timer fires and the
    // refresh setTimeout is scheduled.
    await vi.advanceTimersByTimeAsync(6 * 1000)
    // Fire the scheduled refresh setTimeout — its body calls axios.get,
    // which we've made hang. If the buggy code is still in place
    // (`isLoading.value = true` runs synchronously before the await),
    // the spinner becomes visible right now.
    await vi.advanceTimersByTimeAsync(2500)
    // Do NOT resolve the pending promise yet — we want to inspect the DOM
    // while the silent fetch is in flight. flushPromises() only resolves
    // already-settled promises; it won't resolve our hanging one.
    await flushPromises()

    // CRITICAL: during the in-flight silent refresh, the spinner must
    // NOT have replaced the page content.
    expect(wrapper.find('.loading-section').exists()).toBe(false)

    // Resolve and clean up so unmount doesn't dangle.
    resolveRefresh!(runningPayload(initialExpiry))
    await flushPromises()
    wrapper.unmount()
  })

  it('polls multiple times when the backend still reports state=running, until it transitions', async () => {
    // BE has a race: persistent auto-stop fires async; ocf-core's sync
    // can take 5+ seconds before GET reflects state='stopped'. A single
    // setTimeout is too brittle. We must retry with backoff.
    const initialExpiry = new Date(Date.now() + 5 * 1000).toISOString()
    mockAxiosGet.mockResolvedValueOnce(runningPayload(initialExpiry))
    // Refresh #1 — still running
    mockAxiosGet.mockResolvedValueOnce(runningPayload(initialExpiry))
    // Refresh #2 — still running
    mockAxiosGet.mockResolvedValueOnce(runningPayload(initialExpiry))
    // Refresh #3 — stopped (finally)
    const stoppedExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    mockAxiosGet.mockResolvedValueOnce(stoppedPayload(stoppedExpiry))

    const wrapper = mountView()
    await flushPromises()
    expect(mockAxiosGet).toHaveBeenCalledTimes(1)

    // Advance past the countdown.
    await vi.advanceTimersByTimeAsync(6 * 1000)

    // Advance well past the third retry's scheduled delay. With the
    // backoff schedule [2s, 3s, 4s, 5s, 6s, 8s], three refreshes land at
    // 2s, 5s, 9s. Advance 12s to be safe.
    await vi.advanceTimersByTimeAsync(12 * 1000)
    await flushPromises()

    // Resume CTA should be rendered because eventually the backend
    // returned state='stopped'.
    expect(wrapper.find('[data-testid="resume-session-cta"]').exists()).toBe(true)
  })

  it('stops polling after a capped number of attempts even if the backend never transitions', async () => {
    // Otherwise we'd poll forever — which the user might not notice but
    // still bleeds network and battery.
    const initialExpiry = new Date(Date.now() + 5 * 1000).toISOString()
    mockAxiosGet.mockResolvedValueOnce(runningPayload(initialExpiry))
    // Stuck "running" forever
    mockAxiosGet.mockResolvedValue(runningPayload(initialExpiry))

    const wrapper = mountView()
    await flushPromises()
    expect(mockAxiosGet).toHaveBeenCalledTimes(1)

    // Advance past the countdown.
    await vi.advanceTimersByTimeAsync(6 * 1000)
    // Advance WAY past the worst-case cap. Backoff schedule sums to ~28s,
    // so 60s is more than enough to exhaust all attempts.
    await vi.advanceTimersByTimeAsync(60 * 1000)
    await flushPromises()

    // Cap is 6 retries (after the initial load). Anything more means the
    // polling never stopped — anything less than 3 means the polling
    // didn't really happen (the buggy code does a single retry).
    expect(mockAxiosGet.mock.calls.length).toBeLessThanOrEqual(1 + 6)
    // At least 3 retries (initial + 3) must have run — a single retry is
    // the existing buggy behavior and is not enough.
    expect(mockAxiosGet.mock.calls.length).toBeGreaterThanOrEqual(1 + 3)

    // Advance another minute — call count must stay frozen.
    const callsBefore = mockAxiosGet.mock.calls.length
    await vi.advanceTimersByTimeAsync(60 * 1000)
    await flushPromises()
    expect(mockAxiosGet.mock.calls.length).toBe(callsBefore)

    wrapper.unmount()
  })

  it('clears the scheduled refresh on unmount (no GET after the component is gone)', async () => {
    // Defensive: if the user navigates away during the grace window, the
    // pending setTimeouts must ALL be cancelled — otherwise we issue
    // axios calls against a torn-down component and leak promises.
    const initialExpiry = new Date(Date.now() + 5 * 1000).toISOString()
    mockAxiosGet.mockResolvedValueOnce(runningPayload(initialExpiry))
    // Any subsequent call: stay running (we want every scheduled timeout
    // to fire so we can detect leaks).
    mockAxiosGet.mockResolvedValue(runningPayload(initialExpiry))

    const wrapper = mountView()
    await flushPromises()
    expect(mockAxiosGet).toHaveBeenCalledTimes(1)

    // Advance past the countdown — first refresh is scheduled.
    await vi.advanceTimersByTimeAsync(6 * 1000)
    // Let the first retry fire so the second retry has been scheduled.
    await vi.advanceTimersByTimeAsync(2500)
    await flushPromises()

    const callsBeforeUnmount = mockAxiosGet.mock.calls.length
    wrapper.unmount()
    // Advance well past every remaining scheduled retry — none should fire.
    await vi.advanceTimersByTimeAsync(60 * 1000)
    await flushPromises()
    expect(mockAxiosGet.mock.calls.length).toBe(callsBeforeUnmount)
  })

  // ----------------------------------------------------------------------
  // Optimistic-state-on-timer-zero: prevents visual flash through the
  // "Session expirée" branch while the silent poll is still in flight.
  // ----------------------------------------------------------------------

  it('persistent session: shows the stopped banner immediately at timer-zero, before any poll completes', async () => {
    // The buggy code path: countdown hits 0, state is still 'running'
    // locally + expires_at is now past => getEffectiveSessionState returns
    // 'deleted' => the "Session expirée" banner is rendered until the
    // first poll resolves and overwrites state with 'stopped'. The fix is
    // to predict the backend transition (persistent -> stopped) and apply
    // it locally the instant the timer fires, BEFORE the poll completes.
    const initialExpiry = new Date(Date.now() + 5 * 1000).toISOString()
    mockAxiosGet.mockResolvedValueOnce(runningPayload(initialExpiry))
    // The silent refresh axios call must NOT resolve during this test —
    // we want to inspect the DOM in the window between timer-zero and the
    // first poll response. A never-resolving promise simulates that.
    mockAxiosGet.mockReturnValueOnce(new Promise(() => {}))

    const wrapper = mountView()
    await flushPromises()
    expect(mockAxiosGet).toHaveBeenCalledTimes(1)

    // Advance past expiry but NOT through the post-expiry refresh delay,
    // so the silent poll has been scheduled and even started, but its
    // response is still pending (hung axios promise).
    await vi.advanceTimersByTimeAsync(6 * 1000)
    await flushPromises()

    // CRITICAL: the page must already render the stopped banner with the
    // Resume CTA — the optimistic local transition fires synchronously
    // inside the interval tick that hits remaining<=0.
    expect(wrapper.find('[data-testid="resume-session-cta"]').exists()).toBe(true)
    // The "expired" notice (state='deleted' branch) must NOT be visible.
    expect(wrapper.find('.session-expired-notice').exists()).toBe(false)

    wrapper.unmount()
  })

  it('ephemeral session: shows the expired banner immediately at timer-zero, never a stuck state', async () => {
    // Mirror case for ephemeral persistence: backend WILL destroy the
    // session at expiry => predicted state is 'deleted' => the expired
    // banner is the correct one. The Resume CTA must NOT appear.
    const initialExpiry = new Date(Date.now() + 5 * 1000).toISOString()
    mockAxiosGet.mockResolvedValueOnce(ephemeralRunningPayload(initialExpiry))
    mockAxiosGet.mockReturnValueOnce(new Promise(() => {}))

    const wrapper = mountView()
    await flushPromises()
    expect(mockAxiosGet).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(6 * 1000)
    await flushPromises()

    expect(wrapper.find('[data-testid="resume-session-cta"]').exists()).toBe(false)
    // Ephemeral sessions must NOT render the stopped end-banner — the
    // backend destroys them at expiry, so the correct banner is the
    // 'expired' tone (warning), not the 'stopped' tone (info). A future
    // mutation that flips the optimistic state for ephemeral sessions to
    // 'stopped' would otherwise sneak past a generic "any end banner"
    // assertion.
    expect(wrapper.find('.session-end-banner.end-banner--info').exists()).toBe(false)
    // Either the warning-tone expired banner OR the fallback notice (if
    // useEndStateConfig is otherwise stubbed in tests) is acceptable.
    const hasWarningBanner = wrapper.find('.session-end-banner.end-banner--warning').exists()
    const hasFallbackNotice = wrapper.find('.session-expired-notice').exists()
    expect(hasWarningBanner || hasFallbackNotice).toBe(true)

    wrapper.unmount()
  })

  it('does not regress to running banner when poll temporarily reports running after timer-zero (persistent)', async () => {
    // Backend race: ocf-core auto-sync hasn't caught up yet, so the first
    // poll returns state='running'. WITHOUT a guard, the optimistic
    // 'stopped' state we just set would get overwritten back to 'running'
    // with a past expires_at, dropping us into the 'deleted' branch and
    // flashing the "Session expirée" banner. WITH the guard, the optimistic
    // state is preserved until the backend confirms a terminal state.
    const initialExpiry = new Date(Date.now() + 5 * 1000).toISOString()
    mockAxiosGet.mockResolvedValueOnce(runningPayload(initialExpiry))
    // First post-expiry poll: backend still reports 'running' (race).
    mockAxiosGet.mockResolvedValueOnce(runningPayload(initialExpiry))
    // Subsequent polls: keep returning running so we never accidentally
    // transition through a real 'stopped' response.
    mockAxiosGet.mockResolvedValue(runningPayload(initialExpiry))

    const wrapper = mountView()
    await flushPromises()
    expect(mockAxiosGet).toHaveBeenCalledTimes(1)

    // Advance past countdown.
    await vi.advanceTimersByTimeAsync(6 * 1000)
    // Advance through the first scheduled refresh (2s).
    await vi.advanceTimersByTimeAsync(2500)
    await flushPromises()

    // Even though the poll returned state='running', the page should NOT
    // regress to showing the expired banner — the optimistic stopped
    // state must hold until a terminal state arrives from the backend.
    expect(wrapper.find('[data-testid="resume-session-cta"]').exists()).toBe(true)
    expect(wrapper.find('.session-expired-notice').exists()).toBe(false)

    wrapper.unmount()
  })
})
