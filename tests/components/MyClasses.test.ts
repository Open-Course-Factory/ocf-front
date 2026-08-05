/**
 * "Mes classes" — the teacher's console (issue #309).
 *
 * One row per class the teacher owns or manages, answering the three questions
 * they open the app with: who is connected right now, what is assigned, and
 * where do I click to watch. Archived and expired classes stay listed, muted,
 * because a teacher who closed a class still needs to find it.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick, ref } from 'vue'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  },
}))

const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => ({ query: {} }),
}))

const ACTIVE_ORG = { id: 'org-a', display_name: 'FormaTech' }
const OTHER_ORG = { id: 'org-b', display_name: 'ESITECH' }

// Reactive like the real store's computed: switching organizations must
// invalidate whatever the console derived from it, which a plain variable
// could never do.
const activeOrganization = ref<{ id: string; display_name: string } | null>(ACTIVE_ORG)
const isPersonalContext = ref(false)
vi.mock('../../src/stores/organizations', () => ({
  useOrganizationsStore: () => ({
    get currentOrganization() {
      return activeOrganization.value
    },
    get isPersonalOrganizationContext() {
      return isPersonalContext.value
    },
  }),
}))

import axios from 'axios'
import i18n from '../../src/i18n'
import MyClasses from '../../src/components/Pages/MyClasses.vue'

const mockGet = vi.mocked(axios.get)

function classRow(overrides: Record<string, any> = {}) {
  return {
    group_id: 'group-1',
    name: 'devops-2026',
    display_name: 'DevOps 2026',
    organization_id: 'org-a',
    caller_role: 'owner',
    is_active: true,
    is_expired: false,
    member_count: 12,
    live_session_count: 0,
    assignments: [],
    ...overrides,
  }
}

function assignment(overrides: Record<string, any> = {}) {
  return {
    assignment_id: 'assign-1',
    scenario_id: 'scenario-1',
    scenario_title: 'Hardening SSH',
    started_count: 6,
    completed_count: 3,
    class_completion_rate: 25,
    avg_grade: 82,
    ...overrides,
  }
}

async function mountConsole(rows: any[] | Promise<any>) {
  setActivePinia(createPinia())
  if (rows instanceof Promise) {
    mockGet.mockReturnValueOnce(rows)
  } else {
    mockGet.mockResolvedValueOnce({ data: rows })
  }
  const wrapper = mount(MyClasses, {
    global: { plugins: [i18n], stubs: { 'router-link': RouterLinkStub } },
  })
  await flushPromises()
  return wrapper
}

describe('MyClasses console', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    i18n.global.locale.value = 'en'
    activeOrganization.value = ACTIVE_ORG
    isPersonalContext.value = false
  })

  it('renders one row per class the teacher manages', async () => {
    const wrapper = await mountConsole([
      classRow(),
      classRow({ group_id: 'group-2', display_name: 'Linux Basics' }),
    ])

    const rows = wrapper.findAll('[data-test="class-row"]')
    expect(rows).toHaveLength(2)
    expect(rows[0].text()).toContain('DevOps 2026')
    expect(rows[1].text()).toContain('Linux Basics')
  })

  it('asks the console endpoint once, not once per class', async () => {
    await mountConsole([classRow(), classRow({ group_id: 'group-2' })])

    expect(mockGet).toHaveBeenCalledTimes(1)
    expect(mockGet).toHaveBeenCalledWith('/teacher/groups')
  })

  it('shows how many learners are connected out of the class size', async () => {
    const wrapper = await mountConsole([
      classRow({ live_session_count: 3, member_count: 12 }),
    ])

    expect(wrapper.find('[data-test="live-count"]').text()).toBe('3 online / 12')
  })

  it('says it in French too', async () => {
    i18n.global.locale.value = 'fr'
    const wrapper = await mountConsole([
      classRow({ live_session_count: 3, member_count: 12 }),
    ])

    expect(wrapper.find('[data-test="live-count"]').text()).toBe('3 connectés / 12')
  })

  it('marks the live counter as live only while someone is connected', async () => {
    const wrapper = await mountConsole([
      classRow({ group_id: 'busy', live_session_count: 2 }),
      classRow({ group_id: 'quiet', live_session_count: 0 }),
    ])

    const counters = wrapper.findAll('[data-test="live-count"]')
    expect(counters[0].classes()).toContain('is-live')
    expect(counters[1].classes()).not.toContain('is-live')
  })

  it('keeps the live counter present at zero so nothing moves when it fills', async () => {
    const wrapper = await mountConsole([classRow({ live_session_count: 0 })])

    expect(wrapper.find('[data-test="live-count"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="live-count"]').text()).toBe('0 online / 12')
  })

  it('badges a class the teacher only manages, and leaves owned classes unbadged', async () => {
    const wrapper = await mountConsole([
      classRow({ group_id: 'managed', caller_role: 'manager' }),
      classRow({ group_id: 'owned', caller_role: 'owner' }),
    ])

    const rows = wrapper.findAll('[data-test="class-row"]')
    expect(rows[0].find('[data-test="role-badge"]').text()).toBe('Manager')
    expect(rows[1].find('[data-test="role-badge"]').exists()).toBe(false)
  })

  it('mutes an archived class and an expired one, not an active one', async () => {
    const wrapper = await mountConsole([
      classRow({ group_id: 'live-class' }),
      classRow({ group_id: 'archived', is_active: false }),
      classRow({ group_id: 'expired', is_expired: true }),
    ])

    const rows = wrapper.findAll('[data-test="class-row"]')
    expect(rows[0].classes()).not.toContain('is-muted')
    expect(rows[1].classes()).toContain('is-muted')
    expect(rows[2].classes()).toContain('is-muted')
  })

  it('still lists archived classes rather than hiding them', async () => {
    const wrapper = await mountConsole([
      classRow({ group_id: 'archived', display_name: 'Last year', is_active: false }),
    ])

    expect(wrapper.findAll('[data-test="class-row"]')).toHaveLength(1)
    expect(wrapper.text()).toContain('Last year')
    expect(wrapper.find('[data-test="state-badge"]').text()).toBe('Archived')
  })

  it('names the assigned scenario and how much of the class finished it', async () => {
    const wrapper = await mountConsole([
      classRow({ assignments: [assignment({ class_completion_rate: 25 })] }),
    ])

    const row = wrapper.find('[data-test="assignment"]')
    expect(row.text()).toContain('Hardening SSH')
    expect(row.text()).toContain('3/12 finished')
  })

  it('states progress as the fraction of the class, never as a bare percentage', async () => {
    // class_completion_rate counts distinct MEMBERS over the class size, while
    // ScenarioAnalytics.completion_rate counts completed SESSIONS over total
    // sessions. A naked "25%" would be readable as either metric, so the row
    // spells out the population it is talking about.
    const wrapper = await mountConsole([
      classRow({ member_count: 12, assignments: [assignment({ completed_count: 3, class_completion_rate: 25 })] }),
    ])

    const progress = wrapper.find('[data-test="assignment-progress"]')
    expect(progress.text()).toBe('3/12 finished')
    expect(progress.text()).not.toContain('%')
    expect(progress.attributes('title')).toBe('Learners of the class who finished this scenario')
  })

  it('spells the same fraction out in French', async () => {
    i18n.global.locale.value = 'fr'
    const wrapper = await mountConsole([
      classRow({ assignments: [assignment({ completed_count: 3, class_completion_rate: 25 })] }),
    ])

    expect(wrapper.find('[data-test="assignment-progress"]').text()).toBe('3/12 ont terminé')
  })

  it('draws the completed share of the class as the bar it fills', async () => {
    const wrapper = await mountConsole([
      classRow({ assignments: [assignment({ class_completion_rate: 25 })] }),
    ])

    expect(wrapper.find('.assignment-bar-fill').attributes('style')).toContain('width: 25%')
  })

  it('fills the bar completely for a class that all finished', async () => {
    // Mirror of the backend guard (TestGetManagedGroupsOverview_ClassCompletion
    // Rate_IsAPercentageNotAFraction): class_completion_rate is 0..100. Were it
    // ever normalised back to a 0..1 fraction, a finished class would draw a 1%
    // bar and this fails instead of quietly under-reporting by 100x.
    const wrapper = await mountConsole([
      classRow({
        member_count: 12,
        assignments: [assignment({ completed_count: 12, class_completion_rate: 100 })],
      }),
    ])

    expect(wrapper.find('[data-test="assignment-progress"]').text()).toBe('12/12 finished')
    expect(wrapper.find('.assignment-bar-fill').attributes('style')).toContain('width: 100%')
  })

  it('draws an empty bar for an assignment nobody finished', async () => {
    const wrapper = await mountConsole([
      classRow({
        assignments: [assignment({ completed_count: 0, class_completion_rate: 0, avg_grade: null })],
      }),
    ])

    expect(wrapper.find('[data-test="assignment-progress"]').text()).toBe('0/12 finished')
    expect(wrapper.find('.assignment-bar-fill').attributes('style')).toContain('width: 0%')
  })

  it('draws an empty bar rather than a broken one for an empty class', async () => {
    const wrapper = await mountConsole([
      classRow({
        member_count: 0,
        assignments: [assignment({ completed_count: 0, class_completion_rate: 0 })],
      }),
    ])

    expect(wrapper.find('[data-test="assignment-progress"]').text()).toBe('0/0 finished')
    expect(wrapper.find('.assignment-bar-fill').attributes('style')).toContain('width: 0%')
  })

  it('shows a deadline when the assignment has one', async () => {
    const wrapper = await mountConsole([
      classRow({ assignments: [assignment({ deadline: '2026-09-01T10:00:00Z' })] }),
    ])

    expect(wrapper.find('[data-test="assignment-deadline"]').exists()).toBe(true)
  })

  it('omits the deadline line entirely when there is none', async () => {
    const wrapper = await mountConsole([classRow({ assignments: [assignment()] })])

    expect(wrapper.find('[data-test="assignment-deadline"]').exists()).toBe(false)
  })

  it('tells the teacher when a class has nothing assigned', async () => {
    const wrapper = await mountConsole([classRow({ assignments: [] })])

    expect(wrapper.find('[data-test="no-assignment"]').text()).toBe('No scenario assigned')
  })

  it('opens the live tab of the class when its row is clicked', async () => {
    const wrapper = await mountConsole([classRow({ group_id: 'group-42' })])

    await wrapper.find('[data-test="class-row"]').trigger('click')

    expect(mockPush).toHaveBeenCalledWith({
      name: 'GroupDetails',
      params: { id: 'group-42' },
      query: { tab: 'live' },
    })
  })

  it('opens the live tab from the keyboard as well', async () => {
    const wrapper = await mountConsole([classRow({ group_id: 'group-42' })])

    await wrapper.find('[data-test="class-row"]').trigger('keydown.enter')

    expect(mockPush).toHaveBeenCalledWith({
      name: 'GroupDetails',
      params: { id: 'group-42' },
      query: { tab: 'live' },
    })
  })

  it('reaches the members and scenarios tabs without opening the live tab', async () => {
    const wrapper = await mountConsole([classRow({ group_id: 'group-42' })])

    await wrapper.find('[data-test="open-members"]').trigger('click')
    expect(mockPush).toHaveBeenLastCalledWith({
      name: 'GroupDetails',
      params: { id: 'group-42' },
      query: { tab: 'members' },
    })

    await wrapper.find('[data-test="open-scenarios"]').trigger('click')
    expect(mockPush).toHaveBeenLastCalledWith({
      name: 'GroupDetails',
      params: { id: 'group-42' },
      query: { tab: 'scenarios' },
    })
    expect(mockPush).toHaveBeenCalledTimes(2)
  })

  describe('personal organization', () => {
    // Teaching never happens in a personal organization: the plan is bought by
    // the person, the classes live in a team organization they create (#315,
    // enforced backend-side in core #475). The console's job there is to point
    // the way out, not to offer a list and a button the backend would refuse.

    it('offers to create an organization instead of listing classes', async () => {
      isPersonalContext.value = true
      const wrapper = await mountConsole([])

      expect(wrapper.find('[data-test="personal-org-state"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="create-organization-cta"]').exists()).toBe(true)
    })

    it('sends the call to action straight to the creation form', async () => {
      isPersonalContext.value = true
      const wrapper = await mountConsole([])

      expect(wrapper.findComponent(RouterLinkStub).props('to')).toBe('/organizations?create=1')
    })

    it('hides the create-class button, which the backend would refuse', async () => {
      isPersonalContext.value = true
      const wrapper = await mountConsole([])

      expect(wrapper.find('[data-test="create-class"]').exists()).toBe(false)
    })

    it('lists no class, even one that came back from the endpoint', async () => {
      isPersonalContext.value = true
      const wrapper = await mountConsole([classRow()])

      expect(wrapper.find('[data-test="class-row"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="empty-state"]').exists()).toBe(false)
    })

    it('says the plan lives here, not the classes', async () => {
      isPersonalContext.value = true
      const wrapper = await mountConsole([])

      const message = wrapper.find('[data-test="personal-org-message"]').text()
      expect(message).toContain('plan')
      // Nothing may suggest a class could live in the personal space.
      expect(wrapper.find('[data-test="personal-org-state"]').text())
        .not.toContain('personal organization')
    })

    it('says it in French too', async () => {
      isPersonalContext.value = true
      i18n.global.locale.value = 'fr'
      const wrapper = await mountConsole([])

      const state = wrapper.find('[data-test="personal-org-state"]')
      expect(state.text()).toContain('forfait')
      expect(state.text()).toContain('Créer mon organisation')
    })

    it('still points a teacher with classes elsewhere at the switcher', async () => {
      isPersonalContext.value = true
      const wrapper = await mountConsole([classRow({ organization_id: OTHER_ORG.id })])

      expect(wrapper.find('[data-test="classes-elsewhere-hint"]').text())
        .toContain('another organization')
    })

    it('leaves that hint out for someone who teaches nowhere yet', async () => {
      isPersonalContext.value = true
      const wrapper = await mountConsole([])

      expect(wrapper.find('[data-test="classes-elsewhere-hint"]').exists()).toBe(false)
    })

    it('stays out of the way in a team organization', async () => {
      const wrapper = await mountConsole([classRow()])

      expect(wrapper.find('[data-test="personal-org-state"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="create-class"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="class-row"]').exists()).toBe(true)
    })

    it('never assumes personal while the organization context is unknown', async () => {
      // `isPersonalOrganizationContext` is false with nothing loaded, so the
      // page must show its ordinary state rather than telling a teacher to
      // create an organization they may well already have.
      activeOrganization.value = null
      const wrapper = await mountConsole([classRow()])

      expect(wrapper.find('[data-test="personal-org-state"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="empty-state"]').exists()).toBe(true)
    })
  })

  describe('organization scoping', () => {
    it('lists only the classes of the active organization', async () => {
      const wrapper = await mountConsole([
        classRow({ group_id: 'a', display_name: 'Here', organization_id: ACTIVE_ORG.id }),
        classRow({ group_id: 'b', display_name: 'Elsewhere', organization_id: OTHER_ORG.id }),
      ])

      const rows = wrapper.findAll('[data-test="class-row"]')
      expect(rows).toHaveLength(1)
      expect(rows[0].text()).toContain('Here')
      expect(wrapper.text()).not.toContain('Elsewhere')
    })

    it('re-scopes on an organization switch without asking the backend again', async () => {
      const wrapper = await mountConsole([
        classRow({ group_id: 'a', display_name: 'Here', organization_id: ACTIVE_ORG.id }),
        classRow({ group_id: 'b', display_name: 'Elsewhere', organization_id: OTHER_ORG.id }),
      ])

      activeOrganization.value = OTHER_ORG
      await nextTick()

      const rows = wrapper.findAll('[data-test="class-row"]')
      expect(rows).toHaveLength(1)
      expect(rows[0].text()).toContain('Elsewhere')
      expect(mockGet).toHaveBeenCalledTimes(1)
    })

    it('names no organization on the rows, since they all share the active one', async () => {
      const wrapper = await mountConsole([classRow()])

      expect(wrapper.find('[data-test="class-org"]').exists()).toBe(false)
    })

    it('says the teacher has classes elsewhere rather than none at all', async () => {
      const wrapper = await mountConsole([
        classRow({ organization_id: OTHER_ORG.id }),
      ])

      const message = wrapper.find('[data-test="empty-message"]').text()
      expect(message).toContain('FormaTech')
      expect(message).toContain('another organization')
    })

    it('says it in French too', async () => {
      i18n.global.locale.value = 'fr'
      const wrapper = await mountConsole([classRow({ organization_id: OTHER_ORG.id })])

      const message = wrapper.find('[data-test="empty-message"]').text()
      expect(message).toContain('FormaTech')
      expect(message).toContain('autre organisation')
    })

    it('keeps the plain empty message when the teacher has no class anywhere', async () => {
      const wrapper = await mountConsole([])

      expect(wrapper.find('[data-test="empty-message"]').text())
        .toBe('You do not manage any class yet.')
    })

    it('shows the empty state rather than another org while the context is unknown', async () => {
      activeOrganization.value = null
      const wrapper = await mountConsole([classRow({ organization_id: ACTIVE_ORG.id })])

      expect(wrapper.find('[data-test="class-row"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="empty-state"]').exists()).toBe(true)
    })

    it('does not name a blank organization when there is no context to name', async () => {
      activeOrganization.value = null
      const wrapper = await mountConsole([classRow({ organization_id: ACTIVE_ORG.id })])

      expect(wrapper.find('[data-test="empty-message"]').text())
        .toBe('You do not manage any class yet.')
    })
  })

  it('offers to create a class in place when the teacher has none at all', async () => {
    const wrapper = await mountConsole([])

    expect(wrapper.find('[data-test="empty-state"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="class-row"]').exists()).toBe(false)

    // The CTA opens the creation modal right here — no detour through the
    // /class-groups entity page (the ask behind the header's create button too).
    expect(wrapper.find('[data-test="create-class"]').exists()).toBe(true)
    await wrapper.find('[data-test="empty-cta"]').trigger('click')
    expect(wrapper.findComponent({ name: 'EntityModal' }).exists()).toBe(true)
  })

  it('reserves the row heights with skeletons while the classes load', async () => {
    setActivePinia(createPinia())
    mockGet.mockReturnValueOnce(new Promise(() => {}))
    const wrapper = mount(MyClasses, { global: { plugins: [i18n], stubs: { 'router-link': RouterLinkStub } } })
    await nextTick()

    const skeletons = wrapper.findAll('[data-test="class-row-skeleton"]')
    expect(skeletons.length).toBeGreaterThan(0)
    // Same sizing rule as a real row, so nothing jumps when the data lands.
    expect(skeletons[0].classes()).toContain('class-row')
    expect(wrapper.find('[data-test="empty-state"]').exists()).toBe(false)
  })

  it('surfaces a load failure with a way to retry', async () => {
    setActivePinia(createPinia())
    mockGet.mockRejectedValueOnce({ response: { data: { error_message: 'Backend down' } } })
    const wrapper = mount(MyClasses, { global: { plugins: [i18n], stubs: { 'router-link': RouterLinkStub } } })
    await flushPromises()

    expect(wrapper.find('[data-test="load-error"]').text()).toContain('Backend down')
    expect(wrapper.find('[data-test="empty-state"]').exists()).toBe(false)

    mockGet.mockResolvedValueOnce({ data: [classRow()] })
    await wrapper.find('[data-test="retry"]').trigger('click')
    await flushPromises()

    expect(wrapper.findAll('[data-test="class-row"]')).toHaveLength(1)
  })

  it('refreshes the live counts on a timer while the tab is visible', async () => {
    vi.useFakeTimers()
    try {
      setActivePinia(createPinia())
      mockGet.mockResolvedValue({ data: [classRow({ live_session_count: 1 })] })
      const wrapper = mount(MyClasses, { global: { plugins: [i18n], stubs: { 'router-link': RouterLinkStub } } })
      await flushPromises()
      expect(mockGet).toHaveBeenCalledTimes(1)

      mockGet.mockResolvedValue({ data: [classRow({ live_session_count: 5 })] })
      await vi.advanceTimersByTimeAsync(30000)
      await flushPromises()

      expect(mockGet).toHaveBeenCalledTimes(2)
      expect(wrapper.find('[data-test="live-count"]').text()).toBe('5 online / 12')
    } finally {
      vi.useRealTimers()
    }
  })

  it('stops polling once the console is left', async () => {
    vi.useFakeTimers()
    try {
      setActivePinia(createPinia())
      mockGet.mockResolvedValue({ data: [classRow()] })
      const wrapper = mount(MyClasses, { global: { plugins: [i18n], stubs: { 'router-link': RouterLinkStub } } })
      await flushPromises()

      wrapper.unmount()
      await vi.advanceTimersByTimeAsync(90000)

      expect(mockGet).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })
})
