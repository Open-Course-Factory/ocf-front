/**
 * A blocked learner is told why (#384).
 *
 * Starting, resuming or launching while blocked is refused by ocf-core with
 * 403 { error_message: "session_start_blocked", scope: "group"|"org"|"global",
 * reason }. The learner sees one error naming the scope and the trainer's
 * reason, in their language — not the raw code, not the generic limit copy.
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
