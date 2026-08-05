/**
 * Tests for the tab merge of #310: "Sessions en direct" and "Activité" became
 * the single "Classe en direct" tab, which kept the `live` key.
 *
 * The merge has to be invisible to whoever already had a link: a bookmark, a
 * console link or a browser-history entry pointing at the retired `?tab=activity`
 * must open the merged tab — and must not leave the retired key in the address
 * bar afterwards, or it would be bookmarked again from there.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { ref } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'

const getOne = vi.fn()

vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} })
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
  userService: { getUserById: vi.fn().mockResolvedValue({ id: 'u-teacher' }) }
}))

import GroupDetails from '../../src/components/Pages/GroupDetails.vue'

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
        ClassLiveView: { template: '<div class="live-view-stub" />' },
        AdminBadge: true
      }
    }
  })
  await flushPromises()
  return wrapper
}

function tabLabels(wrapper: Awaited<ReturnType<typeof mountAt>>) {
  return wrapper.findAll('.tab-button').map(b => b.text().replace(/\s*\d+$/, '').trim())
}

function selectedTab(wrapper: Awaited<ReturnType<typeof mountAt>>) {
  return wrapper
    .findAll('[role="tab"]')
    .filter(t => t.attributes('aria-selected') === 'true')
    .map(t => t.text().replace(/\s*\d+$/, '').trim())
}

describe('GroupDetails — the live and activity tabs merged into one', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getOne.mockResolvedValue({
      id: 'g-1',
      name: 'g-1',
      display_name: 'Promo A',
      owner_user_id: 'u-teacher',
      organization_id: '',
      max_members: 30,
      member_count: 0,
      is_active: true,
      is_expired: false,
      is_full: false,
      sub_groups: []
    })
  })

  it('offers one live-class tab where there used to be two', async () => {
    const wrapper = await mountAt(createTestRouter(), '/class-groups/g-1')

    const labels = tabLabels(wrapper)
    expect(labels).toContain('Live class')
    expect(labels).not.toContain('Activity')
    expect(labels).not.toContain('Live sessions')
  })

  it('opens the merged tab for a link that still says tab=activity', async () => {
    const wrapper = await mountAt(createTestRouter(), '/class-groups/g-1?tab=activity')

    expect(selectedTab(wrapper)).toEqual(['Live class'])
    expect(wrapper.find('.live-view-stub').exists()).toBe(true)
  })

  it('rewrites the retired key out of the address bar, in place', async () => {
    const router = createTestRouter()
    await router.push('/class-groups')
    const wrapper = await mountAt(router, '/class-groups/g-1?tab=activity')

    expect(router.currentRoute.value.query.tab).toBe('live')

    router.back()
    await flushPromises()

    // Rewritten with `replace`: Back leaves the class rather than returning to
    // the retired URL, which would bounce straight back here.
    expect(router.currentRoute.value.fullPath).toBe('/class-groups')
    expect(wrapper.exists()).toBe(true)
  })

  it('falls back to the overview for a tab key that means nothing', async () => {
    const router = createTestRouter()
    const wrapper = await mountAt(router, '/class-groups/g-1?tab=bogus')

    expect(selectedTab(wrapper)).toEqual(['Overview'])
    expect(router.currentRoute.value.query.tab).toBe('overview')
  })

  it('leaves a plain class link alone', async () => {
    const router = createTestRouter()
    const wrapper = await mountAt(router, '/class-groups/g-1')

    expect(selectedTab(wrapper)).toEqual(['Overview'])
    // No tab was asked for, so none is forced into the URL.
    expect(router.currentRoute.value.query.tab).toBeUndefined()
  })
})
