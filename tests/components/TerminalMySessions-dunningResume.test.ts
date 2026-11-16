/**
 * Resuming from "My sessions" handles rejections like the session view (#390).
 *
 * POST /terminals/:id/start can reject with:
 *  - 402 { error_code: 'subscription_past_due', source: 'dunning' } — the
 *    English error_message must never be shown; offer the subscription dashboard.
 *  - 403 with a quota `source` (e.g. 'organization') — localized limit copy.
 *  - 403 { source: 'budget', reason: 'budget_exhausted' } — quota-full copy (guard).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent } from 'vue'

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

const mockRouterPush = vi.fn()
// Keep the real module (the app router is built at import time); only the
// page's own router is faked.
vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRoute: () => ({ params: {}, query: {} }),
  useRouter: () => ({ push: mockRouterPush })
}))

const mockStartSession = vi.fn()
const mockGetMyUsage = vi.fn()
vi.mock('../../src/services/domain/terminal', () => ({
  terminalService: {
    stopSession: vi.fn(),
    startSession: (...args: any[]) => mockStartSession(...args),
    deleteSession: vi.fn(),
    getMyUsage: (...args: any[]) => mockGetMyUsage(...args),
    getDistributions: vi.fn().mockResolvedValue([])
  }
}))

const mockShowError = vi.fn()
const mockShowConfirm = vi.fn()
vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showConfirm: (...args: any[]) => mockShowConfirm(...args),
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
  useFormatters: () => ({ formatDateTime: (s: string) => s })
}))

vi.mock('../../src/composables/useFeatureFlags', () => ({
  useFeatureFlags: () => ({ isEnabled: () => false })
}))

vi.mock('../../src/stores/classGroups', () => ({
  useClassGroupsStore: () => ({ entities: [], loadEntities: vi.fn() })
}))

import axios from 'axios'
import TerminalMySessions from '../../src/components/Pages/TerminalMySessions.vue'
import { useDunningRejection } from '../../src/composables/useDunningRejection'

const testI18n = () =>
  createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false
  })

// getDunningCopy() needs a setup context (useI18n).
function dunningCopy() {
  let copy: ReturnType<ReturnType<typeof useDunningRejection>['getDunningCopy']> | undefined
  mount(defineComponent({ setup() { copy = useDunningRejection().getDunningCopy(); return () => null } }), {
    global: { plugins: [testI18n()] }
  })
  return copy!
}

function mountPage() {
  setActivePinia(createPinia())
  ;(axios.get as any).mockResolvedValue({
    data: [{ id: 'b', session_id: 'sess-stopped', state: 'stopped', persistence_mode: 'persistent' }]
  })
  ;(axios.post as any).mockResolvedValue({ data: {} })
  return mount(TerminalMySessions, {
    global: {
      plugins: [testI18n()],
      stubs: {
        'router-link': { props: ['to'], template: '<a class="router-link-stub"><slot /></a>' },
        ErrorAlert: true
      }
    }
  })
}

async function resumeRejectedWith(response: any) {
  return resumeRejectedWithError({ response })
}

async function resumeRejectedWithError(err: any) {
  mockStartSession.mockRejectedValueOnce(err)
  const wrapper = mountPage()
  await flushPromises()
  await wrapper.find('[data-testid="btn-start-sess-stopped"]').trigger('click')
  await flushPromises()
  return wrapper
}

const shownErrors = () => mockShowError.mock.calls.map((c) => c.map(String).join(' '))

describe('TerminalMySessions — resume rejections', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockShowConfirm.mockResolvedValue(true)
  })

  it('offers the subscription dashboard on a 402 dunning rejection, without the raw backend message', async () => {
    await resumeRejectedWith({
      status: 402,
      data: {
        error_code: 'subscription_past_due',
        error_message: 'Subscription payment is past due',
        source: 'dunning'
      }
    })

    const copy = dunningCopy()
    expect(mockShowConfirm).toHaveBeenCalledTimes(1)
    expect(mockShowConfirm.mock.calls[0][0]).toBe(copy.message)
    expect(mockShowConfirm.mock.calls[0][1]).toBe(copy.title)
    expect(shownErrors().some((m) => m.includes('Subscription payment is past due'))).toBe(false)
    expect(mockRouterPush).toHaveBeenCalledWith('/subscription-dashboard')
  })

  it('localizes a 403 with source=organization instead of the raw backend message', async () => {
    await resumeRejectedWith({
      status: 403,
      data: {
        error_code: 403,
        error_message: 'Usage limit exceeded. Current: 1, Limit: 1',
        source: 'organization'
      }
    })

    expect(mockShowError).toHaveBeenCalledTimes(1)
    const shown = shownErrors()[0]
    expect(shown).not.toContain('Usage limit exceeded')
    expect(shown.toLowerCase()).toContain('organization')
  })

  it('[guard] quota full still names the running machines to stop', async () => {
    mockGetMyUsage.mockResolvedValueOnce({
      active_sessions: [{ session_id: 'sess-run', name: 'Web lab', size_key: 's', counts_toward_quota: true }]
    })
    await resumeRejectedWith({
      status: 403,
      data: { error_code: 403, error_message: 'quota', source: 'budget', reason: 'budget_exhausted' }
    })

    expect(mockShowError).toHaveBeenCalledTimes(1)
    expect(shownErrors()[0]).toContain('Web lab (S)')
    expect(mockRouterPush).not.toHaveBeenCalled()
  })

  it('stays on the page when the dunning dialog is dismissed', async () => {
    mockShowConfirm.mockResolvedValueOnce(false)
    await resumeRejectedWith({
      status: 402,
      data: { error_code: 'subscription_past_due', error_message: 'Subscription payment is past due', source: 'dunning' }
    })

    expect(mockShowConfirm).toHaveBeenCalledTimes(1)
    expect(mockRouterPush).not.toHaveBeenCalled()
    expect(mockShowError).not.toHaveBeenCalled()
  })

  it('shows the network error message when the request never got a response', async () => {
    await resumeRejectedWithError(new Error('Network Error'))

    expect(mockShowConfirm).not.toHaveBeenCalled()
    expect(mockShowError).toHaveBeenCalledTimes(1)
    expect(mockShowError.mock.calls[0][0]).toBe('Network Error')
  })

  it('falls back to the page copy when the rejection carries no message', async () => {
    await resumeRejectedWith({ status: 500, data: {} })

    expect(mockShowError).toHaveBeenCalledTimes(1)
    const [message, title] = mockShowError.mock.calls[0]
    expect(message).toBeTruthy()
    expect(message).toBe(title) // fallbackMessage and title are both terminalMySessions.startFailed
  })
})
