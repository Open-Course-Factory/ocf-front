/**
 * Pins TerminalSessionView's resume-error localization seam.
 *
 * Bug: when resumeSession() catches a 403 from POST /terminals/:id/start,
 * it always showed the raw English `error_message` from the backend
 * ("Usage limit exceeded for concurrent_terminals. Current: 1, Limit: 1").
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

const showErrorSpy = vi.fn()
vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showConfirm: vi.fn().mockResolvedValue(true),
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

// terminalService.startSession is the call that fails in the resume flow.
// We control its rejection from each test case.
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

// Seed: one stopped session, exactly the row the component will load.
async function seedStoppedSession() {
  const futureExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString()
  mockAxiosGet.mockResolvedValue({
    data: [
      {
        session_id: 'sess-test',
        status: 'stopped',
        state: 'stopped',
        expires_at: futureExpiry,
        name: 'My stopped session'
      }
    ]
  })
}

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
          error_message: 'Usage limit exceeded for concurrent_terminals. Current: 1, Limit: 1',
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
    expect(shownMsg).not.toContain('Usage limit exceeded for concurrent_terminals')
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
