/**
 * Tests for the class-group filter on /terminal-sessions (ocf-front#308).
 *
 * The backend (ocf-core!355) widened GET /terminals/user-sessions with
 * `group_id`: a manager/owner of that group gets its members' sessions, anyone
 * else gets 403. The rows keep the plain TerminalOutput shape, so `user_id` is
 * an opaque id and the page resolves names from the group roster.
 *
 * What is pinned here is what the teacher sees:
 *   - the selected class's sessions, each labelled with the learner's name;
 *   - a refusal panel, not an empty list, when they do not manage the class;
 *   - a class-specific empty state, distinct from "you have no sessions";
 *   - no action buttons on someone else's session;
 *   - a full return to the self view when the filter is cleared.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'

// ---- Mocks (must come before component import) ----

const mockAxiosGet = vi.fn()

vi.mock('axios', () => ({
  default: {
    get: (...args: any[]) => mockAxiosGet(...args),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  }
}))

vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showConfirm: vi.fn().mockResolvedValue(true),
    showError: vi.fn(),
    showSuccess: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn()
  })
}))

vi.mock('../../src/composables/useFeatureFlags', () => ({
  useFeatureFlags: () => ({
    isEnabled: (flag: string) => flag === 'class_groups'
  })
}))

const mockLoadEntities = vi.fn().mockResolvedValue([])
vi.mock('../../src/stores/classGroups', () => ({
  useClassGroupsStore: () => ({
    entities: [
      { id: 'group-1', name: 'devops-2026', display_name: 'DevOps 2026' },
      { id: 'group-2', name: 'linux-101', display_name: 'Linux 101' }
    ],
    loadEntities: mockLoadEntities
  })
}))

vi.mock('../../src/services/domain/terminal', () => ({
  terminalService: {
    getDistributions: vi.fn().mockResolvedValue([]),
    startSession: vi.fn(),
    stopSession: vi.fn(),
    deleteSession: vi.fn()
  }
}))

import TerminalMySessions from '../../src/components/Pages/TerminalMySessions.vue'

const GROUP_MEMBERS = [
  { id: 'gm-1', user_id: 'user-karim', role: 'member', user: { id: 'user-karim', email: 'karim@test.ocf', display_name: 'Karim Belkacem' } },
  { id: 'gm-2', user_id: 'user-lea', role: 'member', user: { id: 'user-lea', email: 'lea@test.ocf', username: 'lea' } }
]

function runningSession(overrides: Record<string, any> = {}) {
  return {
    id: 'term-1',
    session_id: 'sess-1',
    user_id: 'user-karim',
    status: 'active',
    state: 'running',
    name: 'Karim workspace',
    machine_size: 'm',
    persistence_mode: 'persistent',
    expires_at: new Date(Date.now() + 3600_000).toISOString(),
    created_at: new Date().toISOString(),
    ...overrides
  }
}

/**
 * Answers the two reads the page makes: the session listing and, in group mode,
 * the group roster. Mirrors the real endpoints closely enough that a wrong URL
 * or a missing group_id shows up as a failing assertion rather than a stub that
 * says yes to everything.
 */
function respondWith({ sessions, sessionsError }: { sessions?: any[]; sessionsError?: any } = {}) {
  mockAxiosGet.mockImplementation((url: string) => {
    if (url === '/group-members') {
      return Promise.resolve({ data: GROUP_MEMBERS })
    }
    if (url === '/terminals/user-sessions') {
      return sessionsError ? Promise.reject(sessionsError) : Promise.resolve({ data: sessions || [] })
    }
    return Promise.resolve({ data: [] })
  })
}

const forbidden = {
  response: { status: 403, data: { error_message: 'You are not a manager of this group' } }
}

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

function mountPage() {
  setActivePinia(createPinia())
  return mount(TerminalMySessions, {
    global: {
      plugins: [createTestI18n()],
      stubs: {
        BaseModal: true,
        ErrorAlert: {
          props: ['message'],
          template: '<div v-if="message" class="error-alert-stub">{{ message }}</div>'
        },
        'router-link': {
          props: ['to'],
          template: '<a class="router-link-stub" :href="typeof to === \'string\' ? to : JSON.stringify(to)"><slot /></a>'
        }
      }
    }
  })
}

/** Picks the class named by `label` in the group filter and waits for the reload. */
async function selectGroup(wrapper: ReturnType<typeof mountPage>, value: string) {
  const select = wrapper.find('.group-filter-select')
  await select.setValue(value)
  await flushPromises()
}

function sessionRequests() {
  return mockAxiosGet.mock.calls.filter(([url]) => url === '/terminals/user-sessions')
}

describe('TerminalMySessions — class-group filter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends group_id and labels each session with the learner name', async () => {
    respondWith({ sessions: [runningSession(), runningSession({ id: 'term-2', session_id: 'sess-2', user_id: 'user-lea', name: 'Lea workspace' })] })

    const wrapper = mountPage()
    await flushPromises()
    await selectGroup(wrapper, 'group-1')

    const lastRequest = sessionRequests().at(-1)
    expect(lastRequest?.[1]?.params).toMatchObject({ group_id: 'group-1' })

    // Cards are ordered by recency, which is not what this test is about.
    const badges = wrapper.findAll('.learner-badge').map(badge => badge.text())
    expect(badges).toHaveLength(2)
    expect(badges).toContain('Karim Belkacem')
    // No display_name on this member — the username is the next best label.
    expect(badges).toContain('lea')
  })

  it('reads the group roster once, not once per session', async () => {
    respondWith({
      sessions: [
        runningSession(),
        runningSession({ id: 'term-2', session_id: 'sess-2', user_id: 'user-lea' }),
        runningSession({ id: 'term-3', session_id: 'sess-3', user_id: 'user-karim' })
      ]
    })

    const wrapper = mountPage()
    await flushPromises()
    await selectGroup(wrapper, 'group-1')

    const rosterReads = mockAxiosGet.mock.calls.filter(([url]) => url === '/group-members')
    expect(rosterReads).toHaveLength(1)
  })

  it('shows a refusal message instead of an empty list when the teacher does not manage the class', async () => {
    respondWith({ sessionsError: forbidden })

    const wrapper = mountPage()
    await flushPromises()
    await selectGroup(wrapper, 'group-1')

    const denied = wrapper.find('[data-testid="group-access-denied"]')
    expect(denied.exists()).toBe(true)
    expect(denied.text()).toContain('not a manager')
    expect(wrapper.find('.session-card').exists()).toBe(false)
    // The generic dismissible alert must not double up on the refusal.
    expect(wrapper.find('.error-alert-stub').exists()).toBe(false)
  })

  it('returns to the self view from the refusal panel', async () => {
    respondWith({ sessionsError: forbidden })

    const wrapper = mountPage()
    await flushPromises()
    await selectGroup(wrapper, 'group-1')

    respondWith({ sessions: [runningSession({ user_id: 'me' })] })
    await wrapper.find('[data-testid="back-to-my-sessions"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="group-access-denied"]').exists()).toBe(false)
    expect(sessionRequests().at(-1)?.[1]?.params).not.toHaveProperty('group_id')
    expect(wrapper.find('.session-card').exists()).toBe(true)
  })

  it('distinguishes an empty class from an empty personal listing', async () => {
    respondWith({ sessions: [] })

    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="empty-personal"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="empty-group"]').exists()).toBe(false)

    await selectGroup(wrapper, 'group-1')

    const emptyGroup = wrapper.find('[data-testid="empty-group"]')
    expect(emptyGroup.exists()).toBe(true)
    expect(emptyGroup.text()).toContain('DevOps 2026')
    expect(wrapper.find('[data-testid="empty-personal"]').exists()).toBe(false)
  })

  it('offers no controls over a learner session', async () => {
    respondWith({ sessions: [runningSession()] })

    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="btn-stop-sess-1"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="btn-trash-sess-1"]').exists()).toBe(true)
    expect(wrapper.find('.btn-edit-name').exists()).toBe(true)

    await selectGroup(wrapper, 'group-1')

    expect(wrapper.find('[data-testid="btn-stop-sess-1"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="btn-trash-sess-1"]').exists()).toBe(false)
    expect(wrapper.find('.btn-edit-name').exists()).toBe(false)
    expect(wrapper.find('.dropdown-container').exists()).toBe(false)
  })

  it('points the teacher at the live page of the selected class', async () => {
    respondWith({ sessions: [runningSession()] })

    const wrapper = mountPage()
    await flushPromises()
    await selectGroup(wrapper, 'group-1')

    const superviseLink = wrapper.find('[data-testid="supervise-class"]')
    expect(superviseLink.exists()).toBe(true)
    expect(superviseLink.attributes('href')).toContain('/classes/group-1/live')
  })

  it('restores the self view when the filter is cleared', async () => {
    respondWith({ sessions: [runningSession()] })

    const wrapper = mountPage()
    await flushPromises()
    await selectGroup(wrapper, 'group-1')
    expect(wrapper.find('.learner-badge').exists()).toBe(true)

    await selectGroup(wrapper, 'all')

    expect(sessionRequests().at(-1)?.[1]?.params).not.toHaveProperty('group_id')
    expect(wrapper.find('.learner-badge').exists()).toBe(false)
    expect(wrapper.find('[data-testid="group-context-bar"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="btn-stop-sess-1"]').exists()).toBe(true)
  })

  it('labels sessions by id rather than failing when the roster cannot be read', async () => {
    mockAxiosGet.mockImplementation((url: string) => {
      if (url === '/group-members') return Promise.reject(forbidden)
      if (url === '/terminals/user-sessions') return Promise.resolve({ data: [runningSession()] })
      return Promise.resolve({ data: [] })
    })

    const wrapper = mountPage()
    await flushPromises()
    await selectGroup(wrapper, 'group-1')

    expect(wrapper.find('.session-card').exists()).toBe(true)
    expect(wrapper.find('.learner-badge').text()).toContain('user-karim')
  })

  it('keeps the last selected class when the user switches quickly', async () => {
    let resolveFirstRoster: (value: any) => void = () => {}
    mockAxiosGet.mockImplementation((url: string, config: any) => {
      if (url === '/group-members') {
        if (config?.params?.group_id === 'group-1') {
          return new Promise(resolve => { resolveFirstRoster = resolve })
        }
        return Promise.resolve({ data: [{ id: 'gm-9', user_id: 'user-karim', role: 'member', user: { display_name: 'Second class name' } }] })
      }
      return Promise.resolve({ data: [runningSession()] })
    })

    const wrapper = mountPage()
    await flushPromises()

    await wrapper.find('.group-filter-select').setValue('group-1')
    await wrapper.find('.group-filter-select').setValue('group-2')
    await flushPromises()

    // The first class's roster lands late; it must not relabel the second class.
    resolveFirstRoster({ data: GROUP_MEMBERS })
    await flushPromises()

    expect(wrapper.find('.learner-badge').text()).toContain('Second class name')
  })
})
