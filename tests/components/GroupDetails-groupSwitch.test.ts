/**
 * Tests for GroupDetails when the teacher moves between groups and between tabs.
 *
 * Two user-visible contracts are pinned here:
 *
 *   1. Navigating from one group to another (subgroup / parent links in the
 *      Overview tab, or browser back/forward) must not leave the previously
 *      selected tab showing the previous group's rows. Only two of the seven tab
 *      components used to watch `groupId`; the rest kept whatever they loaded on
 *      their first mount.
 *
 *   2. Switching tabs must not push a browser-history entry. Walking through
 *      three tabs and then pressing Back should leave the group page, not
 *      replay the tab sequence backwards.
 *
 * GroupActivityTab is mounted for real (it only loads on mount, so it is the
 * sharpest probe for the stale-data bug); the other tabs are stubbed.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { ref } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'

const getGroupActivity = vi.fn()
const getOne = vi.fn()

vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} })
  }
}))

vi.mock('../../src/services/domain/scenario', () => ({
  teacherService: {
    getGroupActivity: (...args: unknown[]) => getGroupActivity(...args)
  }
}))

vi.mock('../../src/stores/classGroups', () => ({
  useClassGroupsStore: () => ({ getOne: (...args: unknown[]) => getOne(...args) })
}))

vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: () => ({ userId: 'u-teacher' })
}))

vi.mock('../../src/composables/useFeatureFlags', () => ({
  useFeatureFlags: () => ({ isEnabled: () => true })
}))

vi.mock('../../src/composables/useAdminViewMode', () => ({
  useAdminViewMode: () => ({ isAdmin: ref(false) })
}))

vi.mock('../../src/services/domain/user', () => ({
  userService: {
    getUserById: vi.fn().mockResolvedValue({ id: 'u-teacher', display_name: 'Teacher' })
  }
}))

import GroupDetails from '../../src/components/Pages/GroupDetails.vue'

function groupPayload(id: string, displayName: string) {
  return {
    id,
    name: id,
    display_name: displayName,
    owner_user_id: 'u-teacher',
    organization_id: '',
    max_members: 30,
    member_count: 0,
    is_active: true,
    is_expired: false,
    is_full: false,
    sub_groups: []
  }
}

function activitySession(userName: string, scenarioTitle: string) {
  return {
    user_id: userName.toLowerCase(),
    user_name: userName,
    scenario_id: 'sc-1',
    scenario_title: scenarioTitle,
    current_step: 1,
    total_steps: 4,
    started_at: new Date().toISOString(),
    status: 'active'
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
      { path: '/', component: { template: '<div />' } },
      { path: '/class-groups', component: { template: '<div class="groups-list" />' } },
      { path: '/class-groups/:id', component: GroupDetails },
      { path: '/terminal-sessions', component: { template: '<div />' } }
    ]
  })
}

async function mountAt(router: ReturnType<typeof createTestRouter>, location: string) {
  await router.push(location)
  await router.isReady()

  const wrapper = mount(GroupDetails, {
    global: {
      plugins: [createTestI18n(), router],
      stubs: {
        GroupOverviewTab: true,
        GroupMembersManager: true,
        GroupSettingsTab: true,
        GroupCommandHistory: true,
        GroupScenariosTab: true,
        GroupAnalyticsTab: true,
        GroupLiveSessionsTab: true,
        AdminBadge: true
      }
    }
  })

  await flushPromises()
  return wrapper
}

function tabButton(wrapper: ReturnType<typeof mount>, label: string) {
  const button = wrapper.findAll('.tab-button').find(b => b.text().includes(label))
  if (!button) throw new Error(`Tab button "${label}" not found`)
  return button
}

describe('GroupDetails — switching groups', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getOne.mockImplementation(async (id: string) =>
      groupPayload(id, id === 'g-1' ? 'Promo A' : 'Promo B')
    )
    getGroupActivity.mockImplementation(async (id: string) =>
      id === 'g-1'
        ? [activitySession('Alice', 'Scenario A')]
        : [activitySession('Bob', 'Scenario B')]
    )
  })

  it('shows the new group rows in the open tab after navigating to another group', async () => {
    const router = createTestRouter()
    const wrapper = await mountAt(router, '/class-groups/g-1?tab=activity')

    expect(wrapper.find('.sessions-table').text()).toContain('Alice')

    await router.push('/class-groups/g-2?tab=activity')
    await flushPromises()

    expect(wrapper.find('.group-detail-content').text()).toContain('Promo B')
    expect(wrapper.find('.sessions-table').text()).toContain('Bob')
    expect(wrapper.find('.sessions-table').text()).not.toContain('Alice')
  })

  it('keeps an empty group tab empty instead of showing the previous group rows', async () => {
    getGroupActivity.mockImplementation(async (id: string) =>
      id === 'g-1' ? [activitySession('Alice', 'Scenario A')] : []
    )

    const router = createTestRouter()
    const wrapper = await mountAt(router, '/class-groups/g-1?tab=activity')
    expect(wrapper.find('.sessions-table').text()).toContain('Alice')

    await router.push('/class-groups/g-2?tab=activity')
    await flushPromises()

    expect(wrapper.find('.sessions-table').exists()).toBe(false)
    expect(wrapper.find('.empty-state').exists()).toBe(true)
  })
})

describe('GroupDetails — tab changes and browser history', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getOne.mockImplementation(async (id: string) => groupPayload(id, 'Promo A'))
    getGroupActivity.mockResolvedValue([])
  })

  it('leaves the group page on Back instead of replaying the visited tabs', async () => {
    const router = createTestRouter()
    await router.push('/class-groups')
    const wrapper = await mountAt(router, '/class-groups/g-1')

    await tabButton(wrapper, 'Members').trigger('click')
    await flushPromises()
    await tabButton(wrapper, 'Activity').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.query.tab).toBe('activity')

    router.back()
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/class-groups')
  })
})
