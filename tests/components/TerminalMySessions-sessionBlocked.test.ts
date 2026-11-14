/**
 * A blocked learner resuming from "My sessions" is told why (#384).
 *
 * POST /terminals/:id/start refuses a blocked learner with
 * 403 { error_message: "session_start_blocked", scope, reason }. The page shows
 * the scope and the trainer's reason, not the raw code.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'

// ---- Mocks (must be before component imports) ----

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  }
}))

// terminalService is the source of truth for action calls
const mockStopSession = vi.fn()
const mockStartSession = vi.fn()
const mockDeleteSession = vi.fn()
vi.mock('../../src/services/domain/terminal', () => ({
  terminalService: {
    stopSession: (...args: any[]) => mockStopSession(...args),
    startSession: (...args: any[]) => mockStartSession(...args),
    deleteSession: (...args: any[]) => mockDeleteSession(...args),
    getDistributions: vi.fn().mockResolvedValue([])
  }
}))

// Notification confirms are not used by the trash flow, but the page imports
// useNotification for legacy paths (discardTerminal, hideAllInactiveSessions)
// `showError` is spied so failure-path tests can assert a notification fired.
const mockShowError = vi.fn()
vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showConfirm: vi.fn().mockResolvedValue(true),
    showError: (...args: any[]) => mockShowError(...args),
    showSuccess: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn(),
    showMessage: vi.fn(),
    showAlert: vi.fn(),
    showPrompt: vi.fn()
  })
}))

vi.mock('../../src/composables/useFormatters', () => ({
  useFormatters: () => ({
    formatDateTime: (s: string) => s
  })
}))

vi.mock('../../src/composables/useFeatureFlags', () => ({
  useFeatureFlags: () => ({
    isEnabled: () => false
  })
}))

vi.mock('../../src/stores/classGroups', () => ({
  useClassGroupsStore: () => ({
    entities: [],
    loadEntities: vi.fn()
  })
}))

import axios from 'axios'
import TerminalMySessions from '../../src/components/Pages/TerminalMySessions.vue'

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

type SessionFixture = {
  id: string
  session_id: string
  status?: string
  state?: 'running' | 'stopped' | 'deleted'
  idle_until?: string
  expires_at?: string
  name?: string
  // persistence_mode='persistent' enables the Stop button; default
  // (undefined) treats the session as ephemeral and disables Stop.
  persistence_mode?: 'ephemeral' | 'persistent'
}

function mountPage(sessions: SessionFixture[]) {
  setActivePinia(createPinia())
  ;(axios.get as any).mockResolvedValue({ data: sessions })
  ;(axios.post as any).mockResolvedValue({ data: {} })
  ;(axios.delete as any).mockResolvedValue({ data: {} })
  return mount(TerminalMySessions, {
    global: {
      plugins: [createTestI18n()],
      stubs: {
        // Avoid pulling vue-router into the test setup
        'router-link': {
          props: ['to'],
          template: '<a class="router-link-stub"><slot /></a>'
        },
        ErrorAlert: true
      }
    }
  })
}

describe('TerminalMySessions — a blocked learner resumes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('names the class and gives the reason', async () => {
    mockStartSession.mockRejectedValueOnce({
      response: {
        status: 403,
        data: { error_message: 'session_start_blocked', scope: 'group', reason: 'Exam in progress' }
      }
    })
    const wrapper = mountPage([
      { id: 'b', session_id: 'sess-stopped', state: 'stopped', persistence_mode: 'persistent' }
    ])
    await flushPromises()

    await wrapper.find('[data-testid="btn-start-sess-stopped"]').trigger('click')
    await flushPromises()

    expect(mockShowError).toHaveBeenCalledTimes(1)
    const shown = mockShowError.mock.calls[0].map(String).join(' ')
    expect(shown).toContain('Exam in progress')
    expect(shown).toMatch(/class/i)
    expect(shown).not.toContain('session_start_blocked')
  })
})
