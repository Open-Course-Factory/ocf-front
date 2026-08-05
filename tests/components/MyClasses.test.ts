/**
 * "Mes classes" — the teacher's console (issue #309), console v2 layout.
 *
 * One dense row per class, answering the three questions a teacher opens the
 * app with: who is connected right now, what is assigned, and where to click.
 * State is encoded in the left stripe before a single word is read, and the
 * classes that are over move into a fold rather than out of reach.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises, RouterLinkStub, type VueWrapper } from '@vue/test-utils'
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

// `can_create_organization` from /auth/permissions — the same verdict ocf-core
// applies when it decides whether to accept the organization (core #476). It
// decides whether the personal-context state invites the teacher to create one
// or to buy the plan that would let them. Null is the honest starting point: a
// page can mount before the payload lands, and the console needs an answer for
// that moment too.
const canCreateOrganization = ref<boolean | null>(null)
vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: () => ({
    get canCreateOrganization() { return canCreateOrganization.value },
    ensurePermissionsLoaded: vi.fn().mockResolvedValue([]),
    loadPermissions: vi.fn().mockResolvedValue([]),
  }),
}))

vi.mock('../../src/stores/permissions', () => ({
  usePermissionsStore: () => ({
    get effectiveFeatures() { return null },
    get allOrgFeatures() { return null },
    ensureEffectiveFeaturesLoaded: vi.fn().mockResolvedValue(null),
    loadEffectiveFeatures: vi.fn().mockResolvedValue(null),
  }),
}))

import axios from 'axios'
import i18n from '../../src/i18n'
import MyClasses from '../../src/components/Pages/MyClasses.vue'

const mockGet = vi.mocked(axios.get)

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

function inHours(hours: number): string {
  return new Date(Date.now() + hours * HOUR_MS).toISOString()
}

function inDays(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toISOString()
}

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

/** Types into the search box and waits out the shared composable's debounce. */
async function search(wrapper: VueWrapper<any>, query: string) {
  await wrapper.find('[data-test="class-search"]').setValue(query)
  await new Promise(resolve => setTimeout(resolve, 400))
  await flushPromises()
}

/** The class names rendered under `scope`, in the order they appear. */
function rowNames(scope: { findAll: (selector: string) => any[] }): string[] {
  return scope.findAll('[data-test="class-row"]').map(row => row.find('.class-name').text())
}

function taughtList(wrapper: VueWrapper<any>) {
  return wrapper.find('[data-test="class-list"]')
}

describe('MyClasses console', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    i18n.global.locale.value = 'en'
    activeOrganization.value = ACTIVE_ORG
    isPersonalContext.value = false
    canCreateOrganization.value = null
  })

  it('renders one row per class the teacher manages', async () => {
    const wrapper = await mountConsole([
      classRow(),
      classRow({ group_id: 'group-2', display_name: 'Linux Basics' }),
    ])

    expect(rowNames(wrapper).sort()).toEqual(['DevOps 2026', 'Linux Basics'])
  })

  it('asks the console endpoint once, not once per class', async () => {
    await mountConsole([classRow(), classRow({ group_id: 'group-2' })])

    expect(mockGet).toHaveBeenCalledTimes(1)
    expect(mockGet).toHaveBeenCalledWith('/teacher/groups')
  })

  describe('presence', () => {
    it('shows how many learners are connected out of the class size', async () => {
      const wrapper = await mountConsole([
        classRow({ live_session_count: 3, member_count: 12 }),
      ])

      expect(wrapper.find('[data-test="live-number"]').text()).toBe('3')
      expect(wrapper.find('[data-test="live-count"]').text()).toContain('/ 12 online')
    })

    it('says it in French too', async () => {
      i18n.global.locale.value = 'fr'
      const wrapper = await mountConsole([
        classRow({ live_session_count: 3, member_count: 12 }),
      ])

      expect(wrapper.find('[data-test="live-number"]').text()).toBe('3')
      expect(wrapper.find('[data-test="live-count"]').text()).toContain('/ 12 connectés')
    })

    it('marks the live counter as live only while someone is connected', async () => {
      const wrapper = await mountConsole([
        classRow({ group_id: 'busy', display_name: 'Busy', live_session_count: 2 }),
        classRow({ group_id: 'quiet', display_name: 'Quiet', live_session_count: 0 }),
      ])

      const counters = wrapper.findAll('[data-test="live-count"]')
      expect(counters[0].classes()).toContain('is-live')
      expect(counters[1].classes()).not.toContain('is-live')
    })

    it('keeps the live counter present at zero so nothing moves when it fills', async () => {
      const wrapper = await mountConsole([classRow({ live_session_count: 0 })])

      expect(wrapper.find('[data-test="live-number"]').text()).toBe('0')
      expect(wrapper.find('[data-test="live-count"]').text()).toContain('/ 12 online')
    })

    it('names the idle learners when the endpoint reports them', async () => {
      const wrapper = await mountConsole([
        classRow({ live_session_count: 7, idle_member_count: 3, idle_threshold_minutes: 10 }),
      ])

      expect(wrapper.find('[data-test="idle-count"]').text()).toBe('3 idle > 10 min')
    })

    it('quotes the window the backend actually measured, not a number of its own', async () => {
      // The threshold is core's to set (!360). Printing "> 10 min" beside a
      // count computed over fifteen would misreport the class.
      const wrapper = await mountConsole([
        classRow({ live_session_count: 7, idle_member_count: 2, idle_threshold_minutes: 15 }),
      ])

      expect(wrapper.find('[data-test="idle-count"]').text()).toBe('2 idle > 15 min')
    })

    it('falls back to the default window when only the count comes back', async () => {
      const wrapper = await mountConsole([
        classRow({ live_session_count: 7, idle_member_count: 1 }),
      ])

      expect(wrapper.find('[data-test="idle-count"]').text()).toBe('1 idle > 10 min')
    })

    it('explains that idle means stuck in the scenario, not disconnected', async () => {
      // The count is stale scenario progress — no step, verify, hint or quiz.
      // A learner reading a long instruction is idle; one who closed the tab is
      // not counted at all. The short label cannot carry that, the title can.
      const wrapper = await mountConsole([
        classRow({ live_session_count: 7, idle_member_count: 3, idle_threshold_minutes: 10 }),
      ])

      const help = wrapper.find('[data-test="idle-count"]').attributes('title')
      expect(help).toContain('no scenario progress')
      expect(help).toContain('10 min')
    })

    it('says it in French without calling them disconnected', async () => {
      i18n.global.locale.value = 'fr'
      const wrapper = await mountConsole([
        classRow({ live_session_count: 7, idle_member_count: 3, idle_threshold_minutes: 10 }),
      ])

      const idle = wrapper.find('[data-test="idle-count"]')
      expect(idle.text()).toBe('3 inactifs > 10 min')
      expect(idle.attributes('title')).toContain('progression dans le scénario')
      expect(idle.attributes('title')).not.toContain('déconnect')
    })

    it('says nothing at all when nobody is idle', async () => {
      // Core !360 always sends the field, so 0 is an answer, not a silence —
      // and the answer "nobody is stuck" is worth no pixels. A literal
      // "0 idle > 10 min" beside every healthy class would be noise on the one
      // line meant to catch the eye when something IS wrong.
      const wrapper = await mountConsole([
        classRow({ live_session_count: 7, idle_member_count: 0, idle_threshold_minutes: 10 }),
      ])

      expect(wrapper.find('[data-test="idle-count"]').text()).toBe('')
    })

    it('never states the idle count as a fraction of the class', async () => {
      // idle_member_count counts distinct people and is NOT the numerator of
      // live_session_count: a learner can hold two sessions, and the two
      // figures are computed over different populations. "3/7 inactifs" would
      // be arithmetic nobody performed.
      const wrapper = await mountConsole([
        classRow({
          member_count: 12,
          live_session_count: 7,
          idle_member_count: 3,
          idle_threshold_minutes: 10,
        }),
      ])

      expect(wrapper.find('[data-test="idle-count"]').text()).toBe('3 idle > 10 min')
      expect(wrapper.find('[data-test="idle-count"]').text()).not.toContain('/')
    })

    it('keeps the idle line reserved but empty while the endpoint stays silent', async () => {
      // The field is optional. Absent must not read as "nobody is idle", and
      // the line it will occupy has to exist already or the row grows the day
      // the counter appears.
      const wrapper = await mountConsole([classRow({ live_session_count: 7 })])

      const idle = wrapper.find('[data-test="idle-count"]')
      expect(idle.exists()).toBe(true)
      expect(idle.text()).toBe('')
      expect(idle.attributes('title')).toBe('')
    })
  })

  describe('status stripe', () => {
    // The stripe carries exactly one state, so the teacher sorts the list by
    // colour before reading a word.

    it('turns green while learners are connected', async () => {
      const wrapper = await mountConsole([classRow({ live_session_count: 4 })])

      expect(wrapper.find('[data-test="class-row"]').attributes('data-stripe')).toBe('live')
    })

    it('turns amber when an assignment is due within two days', async () => {
      const wrapper = await mountConsole([
        classRow({ assignments: [assignment({ deadline: inHours(6) })] }),
      ])

      expect(wrapper.find('[data-test="class-row"]').attributes('data-stripe')).toBe('deadline')
    })

    it('lets the near deadline outrank live presence', async () => {
      // Presence already has the big green number beside it; the deadline
      // would otherwise be a small chip three columns away.
      const wrapper = await mountConsole([
        classRow({ live_session_count: 5, assignments: [assignment({ deadline: inHours(6) })] }),
      ])

      expect(wrapper.find('[data-test="class-row"]').attributes('data-stripe')).toBe('deadline')
    })

    it('leaves a deadline further out alone', async () => {
      const wrapper = await mountConsole([
        classRow({ assignments: [assignment({ deadline: inDays(9) })] }),
      ])

      expect(wrapper.find('[data-test="class-row"]').attributes('data-stripe')).toBe('calm')
    })

    it('does not raise the stripe for a deadline already past', async () => {
      const wrapper = await mountConsole([
        classRow({ assignments: [assignment({ deadline: inHours(-3) })] }),
      ])

      expect(wrapper.find('[data-test="class-row"]').attributes('data-stripe')).toBe('calm')
    })

    it('stays neutral for a quiet class with nothing due', async () => {
      const wrapper = await mountConsole([classRow()])

      expect(wrapper.find('[data-test="class-row"]').attributes('data-stripe')).toBe('calm')
    })

    it('marks a closed class inactive whatever else is true of it', async () => {
      const wrapper = await mountConsole([
        classRow({
          is_active: false,
          live_session_count: 3,
          assignments: [assignment({ deadline: inHours(6) })],
        }),
      ])

      const row = wrapper.find('[data-test="class-row"]')
      expect(row.attributes('data-stripe')).toBe('inactive')
      expect(row.classes()).toContain('is-muted')
    })
  })

  describe('identity', () => {
    it('counts the learners of the class in the meta line', async () => {
      const wrapper = await mountConsole([classRow({ member_count: 12 })])

      expect(wrapper.find('[data-test="member-count"]').text()).toBe('12 learners')
    })

    it('counts a class of one in the singular', async () => {
      const wrapper = await mountConsole([classRow({ member_count: 1 })])

      expect(wrapper.find('[data-test="member-count"]').text()).toBe('1 learner')
    })

    it('names an expiry the teacher can still act on', async () => {
      const wrapper = await mountConsole([classRow({ expires_at: inDays(5) })])

      expect(wrapper.find('[data-test="class-expiry"]').exists()).toBe(true)
    })

    it('keeps a distant expiry out of the meta line', async () => {
      const wrapper = await mountConsole([classRow({ expires_at: inDays(90) })])

      expect(wrapper.find('[data-test="class-expiry"]').exists()).toBe(false)
    })

    it('says nothing about expiry for a class that has no end date', async () => {
      const wrapper = await mountConsole([classRow()])

      expect(wrapper.find('[data-test="class-expiry"]').exists()).toBe(false)
    })

    it('badges a class the teacher only manages, and leaves owned classes unbadged', async () => {
      const wrapper = await mountConsole([
        classRow({ group_id: 'managed', display_name: 'Managed', caller_role: 'manager' }),
        classRow({ group_id: 'owned', display_name: 'Owned', caller_role: 'owner' }),
      ])

      const rows = wrapper.findAll('[data-test="class-row"]')
      expect(rows[0].find('[data-test="role-badge"]').text()).toBe('Manager')
      expect(rows[1].find('[data-test="role-badge"]').exists()).toBe(false)
    })
  })

  describe('assigned work', () => {
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
        classRow({ assignments: [assignment({ deadline: inDays(20) })] }),
      ])

      expect(wrapper.find('[data-test="assignment-deadline"]').exists()).toBe(true)
    })

    it('omits the deadline chip entirely when there is none', async () => {
      const wrapper = await mountConsole([classRow({ assignments: [assignment()] })])

      expect(wrapper.find('[data-test="assignment-deadline"]').exists()).toBe(false)
    })

    it('turns an unassigned class into the action it is missing', async () => {
      const wrapper = await mountConsole([classRow({ assignments: [] })])

      const empty = wrapper.find('[data-test="no-assignment"]')
      expect(empty.text()).toContain('No scenario assigned')
      expect(empty.find('[data-test="assign-scenario"]').text()).toContain('Assign a scenario')
    })

    it('sends that call to action to the scenarios tab of the class', async () => {
      const wrapper = await mountConsole([classRow({ group_id: 'group-42', assignments: [] })])

      await wrapper.find('[data-test="assign-scenario"]').trigger('click')

      expect(mockPush).toHaveBeenCalledWith({
        name: 'GroupDetails',
        params: { id: 'group-42' },
        query: { tab: 'scenarios' },
      })
    })
  })

  describe('row actions', () => {
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

    it('offers the wall as the one filled button of the row', async () => {
      const wrapper = await mountConsole([classRow({ group_id: 'group-42' })])

      await wrapper.find('[data-test="open-wall"]').trigger('click')

      expect(mockPush).toHaveBeenCalledWith({
        name: 'GroupDetails',
        params: { id: 'group-42' },
        query: { tab: 'live' },
      })
    })

    it('reaches the learners, scenarios and settings tabs without opening the live tab', async () => {
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

      await wrapper.find('[data-test="open-settings"]').trigger('click')
      expect(mockPush).toHaveBeenLastCalledWith({
        name: 'GroupDetails',
        params: { id: 'group-42' },
        query: { tab: 'settings' },
      })
      expect(mockPush).toHaveBeenCalledTimes(3)
    })
  })

  describe('archived classes', () => {
    it('folds them away from the classes being taught', async () => {
      const wrapper = await mountConsole([
        classRow({ group_id: 'now', display_name: 'This term' }),
        classRow({ group_id: 'old', display_name: 'Last year', is_active: false }),
      ])

      const fold = wrapper.find('[data-test="archived-fold"]')
      expect(fold.exists()).toBe(true)
      // <details> without `open` is collapsed: reachable, never in the way.
      expect(fold.attributes('open')).toBeUndefined()
      expect(rowNames(taughtList(wrapper))).toEqual(['This term'])
      expect(rowNames(fold)).toEqual(['Last year'])
    })

    it('says how many are in there without opening it', async () => {
      const wrapper = await mountConsole([
        classRow({ group_id: 'now' }),
        classRow({ group_id: 'old', is_active: false }),
        classRow({ group_id: 'gone', is_expired: true }),
      ])

      expect(wrapper.find('[data-test="archived-summary"]').text()).toBe('Archived classes (2)')
    })

    it('says it in French too', async () => {
      i18n.global.locale.value = 'fr'
      const wrapper = await mountConsole([classRow({ is_active: false })])

      expect(wrapper.find('[data-test="archived-summary"]').text()).toBe('Classes archivées (1)')
    })

    it('still lists them rather than hiding them', async () => {
      const wrapper = await mountConsole([
        classRow({ group_id: 'archived', display_name: 'Last year', is_active: false }),
      ])

      const fold = wrapper.find('[data-test="archived-fold"]')
      expect(fold.findAll('[data-test="class-row"]')).toHaveLength(1)
      expect(fold.text()).toContain('Last year')
      expect(fold.find('[data-test="state-badge"]').text()).toBe('Archived')
    })

    it('counts an expired class as closed, the same way the row mutes it', async () => {
      const wrapper = await mountConsole([classRow({ group_id: 'gone', is_expired: true })])

      const fold = wrapper.find('[data-test="archived-fold"]')
      expect(fold.exists()).toBe(true)
      expect(fold.find('[data-test="class-row"]').classes()).toContain('is-muted')
      expect(fold.find('[data-test="state-badge"]').text()).toBe('Expired')
    })

    it('leaves the fold out when every class is still running', async () => {
      const wrapper = await mountConsole([classRow(), classRow({ group_id: 'group-2' })])

      expect(wrapper.find('[data-test="archived-fold"]').exists()).toBe(false)
    })

    it('offers analytics instead of a wall, which a finished class no longer has', async () => {
      const wrapper = await mountConsole([classRow({ group_id: 'old', is_active: false })])

      const row = wrapper.find('[data-test="class-row"]')
      expect(row.find('[data-test="open-wall"]').exists()).toBe(false)

      await row.find('[data-test="open-analytics"]').trigger('click')
      expect(mockPush).toHaveBeenCalledWith({
        name: 'GroupDetails',
        params: { id: 'old' },
        query: { tab: 'analytics' },
      })
    })
  })

  describe('filters', () => {
    it('starts on the classes being taught', async () => {
      const wrapper = await mountConsole([classRow()])

      expect(wrapper.find('[data-test="filter-active"]').attributes('aria-pressed')).toBe('true')
      expect(wrapper.find('[data-test="filter-all"]').attributes('aria-pressed')).toBe('false')
    })

    it('flattens the fold into the list when the teacher asks for all of them', async () => {
      const wrapper = await mountConsole([
        classRow({ group_id: 'now', display_name: 'This term' }),
        classRow({ group_id: 'old', display_name: 'Last year', is_active: false }),
      ])

      await wrapper.find('[data-test="filter-all"]').trigger('click')
      await nextTick()

      expect(wrapper.find('[data-test="archived-fold"]').exists()).toBe(false)
      // Closed classes sink below the ones still being taught.
      expect(rowNames(taughtList(wrapper))).toEqual(['This term', 'Last year'])
    })

    it('goes back to hiding them in the fold', async () => {
      const wrapper = await mountConsole([
        classRow({ group_id: 'now', display_name: 'This term' }),
        classRow({ group_id: 'old', display_name: 'Last year', is_active: false }),
      ])

      await wrapper.find('[data-test="filter-all"]').trigger('click')
      await nextTick()
      await wrapper.find('[data-test="filter-active"]').trigger('click')
      await nextTick()

      expect(wrapper.find('[data-test="archived-fold"]').exists()).toBe(true)
      expect(rowNames(taughtList(wrapper))).toEqual(['This term'])
    })

    it('stays out of the way when there is no class to filter', async () => {
      const wrapper = await mountConsole([])

      expect(wrapper.find('[data-test="class-filters"]').exists()).toBe(false)
    })
  })

  describe('search', () => {
    it('narrows the list to the classes that match', async () => {
      const wrapper = await mountConsole([
        classRow({ group_id: 'a', display_name: 'Docker Fundamentals' }),
        classRow({ group_id: 'b', display_name: 'Kubernetes Intro' }),
      ])

      await search(wrapper, 'docker')

      expect(rowNames(taughtList(wrapper))).toEqual(['Docker Fundamentals'])
    })

    it('finds a class whose accents the teacher did not type', async () => {
      const wrapper = await mountConsole([
        classRow({ group_id: 'a', display_name: 'Sécurité Linux' }),
        classRow({ group_id: 'b', display_name: 'Kubernetes Intro' }),
      ])

      await search(wrapper, 'securite')

      expect(rowNames(taughtList(wrapper))).toEqual(['Sécurité Linux'])
    })

    it('reaches into the archived fold as well', async () => {
      // Looking a class up by name must find it wherever it lives, or the fold
      // becomes a place classes disappear into.
      const wrapper = await mountConsole([
        classRow({ group_id: 'now', display_name: 'Docker September' }),
        classRow({ group_id: 'old', display_name: 'Docker June', is_active: false }),
      ])

      await search(wrapper, 'june')

      expect(wrapper.find('[data-test="archived-summary"]').text()).toBe('Archived classes (1)')
      expect(rowNames(taughtList(wrapper))).toEqual([])
    })

    it('says nothing matched rather than offering to create a class', async () => {
      const wrapper = await mountConsole([classRow({ display_name: 'DevOps 2026' })])

      await search(wrapper, 'zzz')

      expect(wrapper.find('[data-test="no-search-results"]').text()).toContain('zzz')
      expect(wrapper.find('[data-test="empty-state"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="class-row"]').exists()).toBe(false)
    })

    it('restores the whole list when the box is cleared', async () => {
      const wrapper = await mountConsole([
        classRow({ group_id: 'a', display_name: 'Docker Fundamentals' }),
        classRow({ group_id: 'b', display_name: 'Kubernetes Intro' }),
      ])

      await search(wrapper, 'docker')
      await search(wrapper, '')

      expect(rowNames(taughtList(wrapper))).toHaveLength(2)
    })
  })

  describe('ordering', () => {
    it('puts the classes with learners connected first, then sorts by name', async () => {
      const wrapper = await mountConsole([
        classRow({ group_id: 'z', display_name: 'Zebra', live_session_count: 0 }),
        classRow({ group_id: 'a', display_name: 'Alpha', live_session_count: 0 }),
        classRow({ group_id: 'm', display_name: 'Middle', live_session_count: 2 }),
      ])

      expect(rowNames(taughtList(wrapper))).toEqual(['Middle', 'Alpha', 'Zebra'])
    })
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

    it('offers neither filters nor an archived fold there', async () => {
      isPersonalContext.value = true
      const wrapper = await mountConsole([classRow({ is_active: false })])

      expect(wrapper.find('[data-test="class-filters"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="archived-fold"]').exists()).toBe(false)
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

    describe('when the plan does not cover teaching', () => {
      // Formateur is the teaching tier: Trial and Solo buy machines for one
      // person. Sending those two to a creation form the backend refuses (core
      // #476) wastes the click and explains nothing, so the funnel becomes the
      // upgrade — while the plan stays personal in the wording, because a
      // personal organization never holds classes whatever is bought.

      it('offers the plan instead of a form the backend would refuse', async () => {
        isPersonalContext.value = true
        canCreateOrganization.value = false
        const wrapper = await mountConsole([])

        expect(wrapper.find('[data-test="upgrade-plan-cta"]').exists()).toBe(true)
        expect(wrapper.find('[data-test="create-organization-cta"]').exists()).toBe(false)
      })

      it('sends that call to action to the plans page', async () => {
        isPersonalContext.value = true
        canCreateOrganization.value = false
        const wrapper = await mountConsole([])

        expect(wrapper.findComponent(RouterLinkStub).props('to')).toBe('/subscription-plans')
      })

      it('names the plan to buy, and still puts the classes in an organization', async () => {
        isPersonalContext.value = true
        canCreateOrganization.value = false
        const wrapper = await mountConsole([])

        const state = wrapper.find('[data-test="personal-org-state"]')
        expect(state.text()).toContain('Formateur')
        expect(state.text()).toContain('organization')
        expect(state.text()).not.toContain('personal organization')
      })

      it('says it in French too', async () => {
        isPersonalContext.value = true
        i18n.global.locale.value = 'fr'
        canCreateOrganization.value = false
        const wrapper = await mountConsole([])

        const state = wrapper.find('[data-test="personal-org-state"]')
        expect(state.text()).toContain('plan Formateur')
        expect(state.text()).toContain('organisme')
      })

      it('keeps the create call to action for a plan that does cover it', async () => {
        isPersonalContext.value = true
        canCreateOrganization.value = true
        const wrapper = await mountConsole([])

        expect(wrapper.find('[data-test="create-organization-cta"]').exists()).toBe(true)
        expect(wrapper.find('[data-test="upgrade-plan-cta"]').exists()).toBe(false)
      })

      it('does not sell an upgrade to someone whose plan has not loaded yet', async () => {
        // The empty-input case, and the one that decides the default. Quoting a
        // price to a teacher who already pays for Formateur — because their
        // features are still in flight, or never arrived — is worse than the one
        // extra click a refusal costs the teacher who does not.
        isPersonalContext.value = true
        canCreateOrganization.value = null
        const wrapper = await mountConsole([])

        expect(wrapper.find('[data-test="create-organization-cta"]').exists()).toBe(true)
        expect(wrapper.find('[data-test="upgrade-plan-cta"]').exists()).toBe(false)
      })

      it('builds both variants from the same slot, so nothing moves between them', async () => {
        isPersonalContext.value = true
        canCreateOrganization.value = true
        const ready = await mountConsole([])

        canCreateOrganization.value = false
        const locked = await mountConsole([])

        const shapeOf = (wrapper: any) =>
          wrapper.findAll('[data-test="personal-org-state"] > *').map((el: any) => el.element.tagName)
        expect(shapeOf(locked)).toEqual(shapeOf(ready))
      })
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

      expect(rowNames(wrapper)).toEqual(['Here'])
      expect(wrapper.text()).not.toContain('Elsewhere')
    })

    it('re-scopes on an organization switch without asking the backend again', async () => {
      const wrapper = await mountConsole([
        classRow({ group_id: 'a', display_name: 'Here', organization_id: ACTIVE_ORG.id }),
        classRow({ group_id: 'b', display_name: 'Elsewhere', organization_id: OTHER_ORG.id }),
      ])

      activeOrganization.value = OTHER_ORG
      await nextTick()

      expect(rowNames(wrapper)).toEqual(['Elsewhere'])
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
    // Nothing to filter yet either — the controls arrive with the classes.
    expect(wrapper.find('[data-test="class-filters"]').exists()).toBe(false)
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
      expect(wrapper.find('[data-test="live-number"]').text()).toBe('5')
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
