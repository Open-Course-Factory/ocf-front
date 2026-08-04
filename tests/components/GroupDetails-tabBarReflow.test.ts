/**
 * Tests for the GroupDetails tab bar while the caller's group role is still unknown.
 *
 * `canEditGroup` is derived from a scan of the members list, which is fetched
 * asynchronously *after* the page is already on screen. A manager who is not the
 * group owner therefore saw two tabs, and five more appeared a moment later —
 * under the cursor of anyone already reaching for one. Same for the header's
 * "Edit Group" button.
 *
 * Contract pinned here: the privileged slots are occupied from the first render,
 * as disabled placeholders, and become live in place once the role resolves.
 * Nothing the teacher could already click ever moves.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { ref } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'

const getOne = vi.fn()
const axiosGet = vi.fn()

vi.mock('axios', () => ({
  default: {
    get: (...args: unknown[]) => axiosGet(...args),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} })
  }
}))

vi.mock('../../src/stores/classGroups', () => ({
  useClassGroupsStore: () => ({ getOne: (...args: unknown[]) => getOne(...args) })
}))

vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: () => ({ userId: 'u-manager' })
}))

vi.mock('../../src/composables/useFeatureFlags', () => ({
  useFeatureFlags: () => ({ isEnabled: () => true })
}))

vi.mock('../../src/composables/useAdminViewMode', () => ({
  useAdminViewMode: () => ({ isAdmin: ref(false) })
}))

vi.mock('../../src/services/domain/user', () => ({
  userService: { getUserById: vi.fn().mockResolvedValue({ id: 'u-owner' }) }
}))

import GroupDetails from '../../src/components/Pages/GroupDetails.vue'

/** A promise whose resolution this test controls, standing in for the members fetch. */
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(r => { resolve = r })
  return { promise, resolve }
}

function groupPayload() {
  return {
    id: 'g-1',
    name: 'g-1',
    display_name: 'Promo A',
    // Owned by somebody else: the caller's rights can only come from the roster.
    owner_user_id: 'u-owner',
    organization_id: '',
    max_members: 30,
    member_count: 3,
    is_active: true,
    is_expired: false,
    is_full: false,
    sub_groups: []
  }
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

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/class-groups', component: { template: '<div />' } },
      { path: '/class-groups/:id', component: GroupDetails },
      { path: '/terminal-sessions', component: { template: '<div />' } }
    ]
  })
}

async function mountGroupDetails() {
  const router = createTestRouter()
  await router.push('/class-groups/g-1')
  await router.isReady()

  const wrapper = mount(GroupDetails, {
    global: {
      plugins: [createTestI18n(), router],
      stubs: {
        GroupOverviewTab: true,
        GroupMembersManager: true,
        // Stands in for saving the group from the Settings tab, which makes the page
        // reload the members list a second time.
        GroupSettingsTab: {
          emits: ['group-updated'],
          template: '<button class="save-group" @click="$emit(\'group-updated\')" />'
        },
        GroupCommandHistory: true,
        GroupScenariosTab: true,
        GroupAnalyticsTab: true,
        GroupActivityTab: true,
        GroupLiveSessionsTab: true,
        AdminBadge: true
      }
    }
  })
  await flushPromises()
  return wrapper
}

// The Members tab carries a trailing member-count badge; drop it so the labels compare cleanly.
function label(button: { text(): string }) {
  return button.text().replace(/\s*\d+$/, '').trim()
}

function tabLabels(wrapper: Awaited<ReturnType<typeof mountGroupDetails>>) {
  return wrapper.findAll('.tab-button').map(label)
}

function disabledTabLabels(wrapper: Awaited<ReturnType<typeof mountGroupDetails>>) {
  return wrapper
    .findAll('.tab-button')
    .filter(b => b.attributes('disabled') !== undefined)
    .map(label)
}

const ALL_TABS = [
  'Overview',
  'Members',
  'Scenarios',
  'Live sessions',
  'Activity',
  'Analytics',
  'Command History',
  'Settings'
]
const PRIVILEGED_TABS = ALL_TABS.filter(label => label !== 'Overview' && label !== 'Members')

describe('GroupDetails — tab bar while the caller role is still loading', () => {
  /** One entry per members fetch the page issues, in order, each resolvable on demand. */
  let memberFetches: ReturnType<typeof deferred<{ data: unknown }>>[]

  function asManager() {
    return { data: [{ id: 'm-1', user_id: 'u-manager', role: 'manager' }] }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    getOne.mockResolvedValue(groupPayload())
    memberFetches = []
    axiosGet.mockImplementation((url: string) => {
      if (url !== '/group-members') return Promise.resolve({ data: {} })
      const pending = deferred<{ data: unknown }>()
      memberFetches.push(pending)
      return pending.promise
    })
  })

  it('reserves every tab slot while the members list is loading', async () => {
    const wrapper = await mountGroupDetails()

    expect(tabLabels(wrapper)).toEqual(ALL_TABS)
    expect(disabledTabLabels(wrapper)).toEqual(PRIVILEGED_TABS)
  })

  it('keeps the reserved tabs in place and enables them when the caller turns out to be a manager', async () => {
    const wrapper = await mountGroupDetails()
    const before = tabLabels(wrapper)

    memberFetches[0].resolve(asManager())
    await flushPromises()

    expect(tabLabels(wrapper)).toEqual(before)
    expect(disabledTabLabels(wrapper)).toEqual([])
  })

  it('drops the reserved tabs without moving Overview and Members when the caller is a plain member', async () => {
    const wrapper = await mountGroupDetails()

    memberFetches[0].resolve({ data: [{ id: 'm-1', user_id: 'u-manager', role: 'member' }] })
    await flushPromises()

    expect(tabLabels(wrapper)).toEqual(['Overview', 'Members'])
  })

  it('reserves the header edit button and enables it once the manager role resolves', async () => {
    const wrapper = await mountGroupDetails()

    const editButton = wrapper.find('.header-actions button')
    expect(editButton.exists()).toBe(true)
    expect(editButton.attributes('disabled')).toBeDefined()

    memberFetches[0].resolve(asManager())
    await flushPromises()

    expect(wrapper.find('.header-actions button').attributes('disabled')).toBeUndefined()
  })

  it('keeps a known manager’s tabs live while the members list reloads after a group edit', async () => {
    const wrapper = await mountGroupDetails()
    memberFetches[0].resolve(asManager())
    await flushPromises()

    await wrapper.findAll('.tab-button').find(b => label(b) === 'Settings')!.trigger('click')
    await flushPromises()
    await wrapper.find('.save-group').trigger('click')
    await flushPromises()

    // The second members fetch is still in flight; the role is already known, so
    // nothing may grey out under the teacher.
    expect(memberFetches).toHaveLength(2)
    expect(disabledTabLabels(wrapper)).toEqual([])
  })

  it('does not reserve anything for the group owner, whose rights are known from the group payload', async () => {
    getOne.mockResolvedValue({ ...groupPayload(), owner_user_id: 'u-manager' })

    const wrapper = await mountGroupDetails()

    expect(tabLabels(wrapper)).toEqual(ALL_TABS)
    expect(disabledTabLabels(wrapper)).toEqual([])
  })
})
