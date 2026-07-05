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

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
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
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { sessionId: 'sess-test' }, query: {} }),
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
})
