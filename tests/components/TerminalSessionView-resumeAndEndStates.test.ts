/**
 * The small behaviours of TerminalSessionView that share one setup: resume
 * refusals (dunning, quota, blocked session), the back link, the
 * persistence-mode gating and the revoked end state. One describe per former
 * file; each keeps its notes.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'

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
const routeQuery: Record<string, string> = {}
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { sessionId: 'sess-test' }, query: routeQuery }),
  useRouter: () => ({ push: mockRouterPush }),
  createRouter: vi.fn(),
  createWebHistory: vi.fn()
}))

const showErrorSpy = vi.fn()
const showConfirmSpy = vi.fn().mockResolvedValue(true)
vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showConfirm: showConfirmSpy,
    showError: showErrorSpy,
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

const startSessionMock = vi.fn()
vi.mock('../../src/services/domain/terminal/terminalService', () => ({
  terminalService: {
    startSession: (...args: any[]) => startSessionMock(...args),
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

// `panelStub` replaces the bare TerminalSessionPanel stub when a case reads its props.
function mountView(panelStub: unknown = true) {
  setActivePinia(createPinia())
  return mount(TerminalSessionView, {
    global: {
      plugins: [createTestI18n()],
      stubs: {
        TerminalSessionPanel: panelStub,
        ScenarioPanel: true,
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

async function seedStoppedSession() {
  const futureExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString()
  mockAxiosGet.mockResolvedValue({
    data: [
      {
        session_id: 'sess-test',
        status: 'stopped',
        state: 'stopped',
        expires_at: futureExpiry,
        persistence_mode: 'persistent',
        name: 'My stopped session'
      }
    ]
  })
}

async function clickResume(wrapper: any) {
  const resumeBtn = wrapper.find('[data-testid="resume-session-cta"]')
  expect(resumeBtn.exists()).toBe(true)
  await resumeBtn.trigger('click')
  await flushPromises()
}

// What every former file started from; a describe overrides what it needs.
beforeEach(() => {
  mockAxiosGet.mockReset()
  mockAxiosPost.mockReset().mockResolvedValue({ data: {} })
  startSessionMock.mockReset()
  showConfirmSpy.mockReset().mockResolvedValue(true)
  for (const key of Object.keys(routeQuery)) delete routeQuery[key]
})

/**
 * RED — dunning (past-due) rejection UX on the resume flow
 * (issue #255 / MR !243).
 *
 * Backend contract (ocf-core !274): POST /terminals/:id/start (resume) can now
 * reject with HTTP 402 { error_code: 'subscription_past_due', source: 'dunning' }
 * when a past_due subscription is out of grace.
 *
 * Today `resumeSession()` maps any 403/402 `source` through
 * getLimitReachedMessage() and, for an unknown source like 'dunning', falls back
 * to the generic "reached your limit of concurrent terminals" copy via a plain
 * error toast — wrong cause, no way to fix it. Desired: a DEDICATED dunning
 * treatment that offers the subscription dashboard (same contract as the
 * composed-start flow), pinned loosely on the route target, not the copy.
 *
 * EXPECTED STATE against current code: RED — resume surfaces the concurrent-limit
 * message and never routes to the dashboard.
 *
 * The #guard pins that a 403 source=organization still localizes as before (via
 * an error toast, no dashboard redirect) so the dunning branch doesn't hijack
 * the existing limit-reached UX.
 */
describe('TerminalSessionView — dunning (past-due) resume handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    showConfirmSpy.mockResolvedValue(true)
  })

  it('offers the subscription dashboard (not the generic concurrent-limit toast) on a 402 dunning resume', async () => {
    await seedStoppedSession()
    startSessionMock.mockRejectedValue({
      response: {
        status: 402,
        data: {
          error_code: 'subscription_past_due',
          error_message: 'Subscription payment is past due',
          source: 'dunning'
        }
      }
    })

    const wrapper = mountView()
    await flushPromises()
    await clickResume(wrapper)

    // Dedicated dunning treatment routes the user to settle the overdue invoice.
    expect(mockRouterPush).toHaveBeenCalledWith('/subscription-dashboard')

    // The wrong generic copy ("reached your limit of concurrent terminals")
    // must NOT leak into a plain error toast on a dunning rejection.
    const errorMessages = showErrorSpy.mock.calls.map((c) => String(c[0]).toLowerCase())
    expect(errorMessages.some((m) => m.includes('concurrent terminal'))).toBe(false)
  })

  it('[guard] a 403 source=organization resume still localizes as an error toast, no dashboard redirect', async () => {
    await seedStoppedSession()
    startSessionMock.mockRejectedValue({
      response: {
        status: 403,
        data: {
          error_code: 403,
          error_message: 'Usage limit exceeded. Current: 1, Limit: 1',
          source: 'organization'
        }
      }
    })

    const wrapper = mountView()
    await flushPromises()
    await clickResume(wrapper)

    expect(showErrorSpy).toHaveBeenCalledTimes(1)
    expect(String(showErrorSpy.mock.calls[0][0]).toLowerCase()).toContain('organization')
    expect(mockRouterPush).not.toHaveBeenCalledWith('/subscription-dashboard')
  })

  it('shows the translated fallback, not the English axios text, when the request never got a response', async () => {
    await seedStoppedSession()
    startSessionMock.mockRejectedValue(new Error('Network Error'))

    const wrapper = mountView()
    await flushPromises()
    await clickResume(wrapper)

    expect(showErrorSpy).toHaveBeenCalledTimes(1)
    expect(showErrorSpy.mock.calls[0][0]).toBe('Resume failed')
    expect(showErrorSpy.mock.calls[0][0]).not.toContain('Network Error')
  })
})

/**
 * Pins TerminalSessionView's resume-error localization seam.
 *
 * Bug: when resumeSession() catches a 403 from POST /terminals/:id/start,
 * it always showed the raw English `error_message` from the backend.
 * The launcher already has localized strings for the same situation —
 * `terminalStarter.errorLimitReached{Org,Assigned}` — keyed off the
 * `source` field the backend returns. This MR extracts that mapping
 * into a shared composable and reuses it on the resume path.
 *
 * The backend fix (ocf-core) removes CheckLimit from POST /:id/start so
 * the most common 403 disappears. This test guards the SAFETY NET:
 * any future surface area that returns a 403-with-source from the
 * resume path will be localized, not surfaced in raw English.
 */
describe('TerminalSessionView — resume error localization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the localized org-limit message when resume returns 403 with source=organization', async () => {
    await seedStoppedSession()

    // Backend rejects with a 403-with-source. Source is the SSOT for the
    // localization branch — independent of what error_message says in
    // English.
    startSessionMock.mockRejectedValue({
      response: {
        status: 403,
        data: {
          error_code: 403,
          error_message: 'Usage limit exceeded. Current: 1, Limit: 1',
          source: 'organization'
        }
      }
    })

    const wrapper = mountView()
    await flushPromises()

    // Trigger the resume CTA → resumeSession() runs → catches the 403.
    const resumeBtn = wrapper.find('[data-testid="resume-session-cta"]')
    expect(resumeBtn.exists()).toBe(true)
    await resumeBtn.trigger('click')
    await flushPromises()

    expect(showErrorSpy).toHaveBeenCalledTimes(1)
    const shownMsg = String(showErrorSpy.mock.calls[0][0])

    // The toast must be the org-localized string, NOT the raw English.
    // We assert two things: the raw message did NOT bleed through, and
    // the localized one was shown. The exact wording lives in i18n; we
    // check distinguishing fragments to keep the test resilient to copy
    // edits.
    expect(shownMsg).not.toContain('Usage limit exceeded. Current')
    expect(shownMsg.toLowerCase()).toContain('organization')
  })

  it('falls back to the raw error_message when the 403 has no source field (non-quota 403)', async () => {
    // A 403 without `source` is not a quota rejection — could be RAM
    // (the other gate that stays on /:id/start), an ownership flap, or
    // any other future hook. The helper must NOT pretend it's a quota
    // error; it should pass the backend message through.
    await seedStoppedSession()

    const raw = 'Insufficient RAM on backend host'
    startSessionMock.mockRejectedValue({
      response: {
        status: 503,
        data: {
          error_code: 503,
          error_message: raw
          // no `source`
        }
      }
    })

    const wrapper = mountView()
    await flushPromises()

    await wrapper.find('[data-testid="resume-session-cta"]').trigger('click')
    await flushPromises()

    expect(showErrorSpy).toHaveBeenCalledTimes(1)
    expect(String(showErrorSpy.mock.calls[0][0])).toBe(raw)
  })
})

/**
 * A blocked learner is told why (#384).
 *
 * Starting, resuming or launching while blocked is refused by ocf-core with
 * 403 { error_message: "session_start_blocked", scope: "group"|"org"|"global",
 * reason }. The learner sees one error naming the scope and the trainer's
 * reason, in their language — not the raw code, not the generic limit copy.
 */
describe('TerminalSessionView — a blocked learner resumes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('names the scope and gives the reason', async () => {
    await seedStoppedSession()
    startSessionMock.mockRejectedValue({
      response: {
        status: 403,
        data: { error_message: 'session_start_blocked', scope: 'global', reason: 'Abuse report' }
      }
    })

    const wrapper = mountView()
    await flushPromises()
    await clickResume(wrapper)

    expect(showErrorSpy).toHaveBeenCalledTimes(1)
    const shown = showErrorSpy.mock.calls[0].map(String).join(' ')
    expect(shown).toContain('Abuse report')
    expect(shown).toMatch(/platform/i)
    expect(shown).not.toContain('session_start_blocked')
  })
})

/**
 * The scenario editor's play-as-learner preview navigates to the session
 * view in the same tab (a noopener tab does not inherit the sessionStorage
 * JWT, so it used to land on the login screen). The trainer needs a way
 * back to the editor, so the view honours a `returnTo` query for its back
 * link instead of always pointing at My Sessions.
 */
async function mountWithQuery(query: Record<string, string>) {
  for (const key of Object.keys(routeQuery)) delete routeQuery[key]
  Object.assign(routeQuery, query)
  // A failed load renders the error state, whose back link is the one under test.
  mockAxiosGet.mockRejectedValue(new Error('boom'))
  setActivePinia(createPinia())
  const wrapper = mount(TerminalSessionView, {
    global: {
      plugins: [createI18n({ legacy: false, locale: 'en', fallbackLocale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })],
      stubs: {
        TerminalSessionPanel: true, ScenarioPanel: true,
        CommandHistory: true, BaseModal: true,
        'router-link': RouterLinkStub
      }
    }
  })
  await flushPromises()
  return wrapper
}

describe('TerminalSessionView — back link', () => {
  beforeEach(() => vi.clearAllMocks())

  it('goes back to My Sessions by default', async () => {
    const wrapper = await mountWithQuery({})
    const link = wrapper.findComponent(RouterLinkStub)
    expect(link.props('to')).toEqual({ name: 'TerminalSessions' })
    expect(link.text()).toContain('Back to My Sessions')
  })

  it('goes back to the page named by returnTo, with a neutral label', async () => {
    const wrapper = await mountWithQuery({ returnTo: '/scenario-editor?scenarioId=abc' })
    const link = wrapper.findComponent(RouterLinkStub)
    expect(link.props('to')).toBe('/scenario-editor?scenarioId=abc')
    expect(link.text()).toContain('Back')
    expect(link.text()).not.toContain('My Sessions')
  })

  it.each([
    'https://evil.example/phish',
    '//example.com',
    '/\\example.com'
  ])('ignores a returnTo of %j, which is not an in-app path', async (returnTo) => {
    const wrapper = await mountWithQuery({ returnTo })
    expect(wrapper.findComponent(RouterLinkStub).props('to')).toEqual({ name: 'TerminalSessions' })
  })
})

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

const futureExpiry = () => new Date(Date.now() + 60 * 60 * 1000).toISOString()

describe('TerminalSessionView — persistence_mode gating', () => {
  const mountViewWithPanelProps = () => mountView(TerminalSessionPanelStub)

  beforeEach(() => {
    vi.clearAllMocks()
    startSessionMock.mockResolvedValue({})
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

    const wrapper = mountViewWithPanelProps()
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

    const wrapper = mountViewWithPanelProps()
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

    const wrapper = mountViewWithPanelProps()
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

    const wrapper = mountViewWithPanelProps()
    await flushPromises()

    expect(wrapper.find('[data-testid="resume-session-cta"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="delete-session-cta"]').exists()).toBe(false)
  })
})

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
describe('TerminalSessionView — revoked state maps to the revoked end reason', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    startSessionMock.mockResolvedValue({})
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
