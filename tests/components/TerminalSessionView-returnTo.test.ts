/**
 * The scenario editor's play-as-learner preview navigates to the session
 * view in the same tab (a noopener tab does not inherit the sessionStorage
 * JWT, so it used to land on the login screen). The trainer needs a way
 * back to the editor, so the view honours a `returnTo` query for its back
 * link instead of always pointing at My Sessions.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'

const mockAxiosGet = vi.fn()

vi.mock('axios', () => ({
  default: {
    get: (...args: any[]) => mockAxiosGet(...args),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } }
  }
}))

const routeQuery: Record<string, string> = {}
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { sessionId: 'sess-test' }, query: routeQuery }),
  useRouter: () => ({ push: vi.fn() }),
  createRouter: vi.fn(),
  createWebHistory: vi.fn()
}))

vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showConfirm: vi.fn().mockResolvedValue(true),
    showError: vi.fn(), showSuccess: vi.fn(), showInfo: vi.fn(),
    showWarning: vi.fn(), showMessage: vi.fn(), showAlert: vi.fn(), showPrompt: vi.fn()
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
    startSession: vi.fn(), stopSession: vi.fn(), deleteSession: vi.fn(), syncSession: vi.fn()
  }
}))

vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: () => ({
    userId: 'u-test', userName: 'test', userDisplayName: 'Test',
    userEmail: 'test@example.com', userRoles: ['Member'], secretToken: 'tok'
  })
}))

import TerminalSessionView from '../../src/components/Pages/TerminalSessionView.vue'

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
        TerminalSessionPanel: true, ScenarioPanel: true, ScenarioProvisioningOverlay: true,
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

  it('ignores a returnTo that is not an in-app path', async () => {
    const wrapper = await mountWithQuery({ returnTo: 'https://evil.example/phish' })
    expect(wrapper.findComponent(RouterLinkStub).props('to')).toEqual({ name: 'TerminalSessions' })
  })
})
