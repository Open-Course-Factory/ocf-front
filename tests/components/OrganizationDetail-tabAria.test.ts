/**
 * Tests for the OrganizationDetail tab bar as an assistive technology and a
 * keyboard user meet it.
 *
 * Same WAI-ARIA tabs pattern as the group page (both bars share `useTabList`);
 * what is pinned here is the wiring specific to this page — that the panel a tab
 * opens is the one it names, and that the manager-only tabs, which are absent
 * rather than disabled for a plain member, drop out of arrow navigation with the
 * rest of the bar still traversable.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { ref } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'

const loadOrganization = vi.fn()
const canManageOrganization = vi.fn()
const isOrganizationOwner = vi.fn()
const canDeleteOrganization = vi.fn()

vi.mock('../../src/stores/organizations', () => ({
  useOrganizationsStore: () => ({
    loadOrganization: (...args: unknown[]) => loadOrganization(...args),
    updateOrganization: vi.fn()
  })
}))

vi.mock('../../src/stores/permissions', () => ({
  usePermissionsStore: () => ({
    loadCurrentUser: vi.fn().mockResolvedValue(undefined),
    canManageOrganization: (id: string) => canManageOrganization(id),
    isOrganizationOwner: (id: string) => isOrganizationOwner(id),
    canDeleteOrganization: (id: string) => canDeleteOrganization(id)
  })
}))

vi.mock('../../src/composables/useAdminViewMode', () => ({
  useAdminViewMode: () => ({ isAdmin: ref(false) })
}))

import OrganizationDetail from '../../src/components/Pages/OrganizationDetail.vue'

const MANAGER_TABS = ['scenarios', 'student-sessions', 'settings']

function organizationPayload() {
  return {
    id: 'org-1',
    name: 'formatech',
    display_name: 'FormaTech',
    description: '',
    is_personal: false,
    member_count: 4,
    group_count: 2,
    max_members: 100,
    max_groups: 20
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

async function mountOrganizationDetail() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/organizations', name: 'Organizations', component: { template: '<div />' } },
      { path: '/organizations/:id', component: OrganizationDetail },
      { path: '/organizations/:id/import', name: 'BulkImport', component: { template: '<div />' } }
    ]
  })
  await router.push('/organizations/org-1')
  await router.isReady()

  const wrapper = mount(OrganizationDetail, {
    attachTo: document.body,
    global: {
      plugins: [createTestI18n(), router],
      stubs: {
        OrganizationModal: true,
        OrganizationMembersManager: true,
        OrganizationGroupsManager: true,
        OrganizationSubscriptionManager: true,
        OrganizationOverviewTab: true,
        OrganizationSettingsTab: true,
        OrganizationScenariosTab: true,
        OrganizationStudentSessionsTab: true,
        AdminBadge: true
      }
    }
  })
  await flushPromises()
  return wrapper
}

function tabs(wrapper: VueWrapper) {
  return wrapper.findAll('[role="tab"]')
}

/**
 * Tabs are identified by their generated id (`org-tab-<tab>`) rather than by their
 * visible label: the label wording is being revised separately, the id is the
 * stable handle, and asserting on it also pins the id scheme the ARIA references
 * are built from.
 */
function tabKey(tab: { attributes(name: string): string | undefined }) {
  return (tab.attributes('id') || '').replace(/^org-tab-/, '')
}

function tabKeys(wrapper: VueWrapper) {
  return tabs(wrapper).map(tabKey)
}

function tabFor(wrapper: VueWrapper, key: string) {
  return tabs(wrapper).find(t => tabKey(t) === key)!
}

function focusedKey(wrapper: VueWrapper) {
  const match = tabs(wrapper).find(t => t.element === document.activeElement)
  return match ? tabKey(match) : null
}

describe('OrganizationDetail tab bar — WAI-ARIA tabs pattern', () => {
  let wrapper: VueWrapper | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    loadOrganization.mockResolvedValue(organizationPayload())
    canManageOrganization.mockReturnValue(true)
    isOrganizationOwner.mockReturnValue(true)
    canDeleteOrganization.mockReturnValue(true)
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
  })

  it('exposes the bar as a labelled tablist of tabs', async () => {
    wrapper = await mountOrganizationDetail()

    const tablist = wrapper.find('[role="tablist"]')
    expect(tablist.exists()).toBe(true)
    expect(tablist.attributes('aria-label')).toBeTruthy()
    expect(tabKeys(wrapper)).toEqual([
      'overview', 'members', 'groups', 'scenarios', 'student-sessions', 'subscription', 'settings'
    ])
  })

  it('names the panel after the tab that opened it, and follows the selection', async () => {
    wrapper = await mountOrganizationDetail()

    const overview = tabFor(wrapper, 'overview')
    expect(overview.attributes('aria-selected')).toBe('true')
    expect(wrapper.find('[role="tabpanel"]').attributes('aria-labelledby')).toBe(
      overview.attributes('id')
    )

    await tabFor(wrapper, 'groups').trigger('click')

    const groups = tabFor(wrapper, 'groups')
    const panel = wrapper.find('[role="tabpanel"]')
    expect(groups.attributes('aria-selected')).toBe('true')
    expect(panel.attributes('aria-labelledby')).toBe(groups.attributes('id'))
    expect(groups.attributes('aria-controls')).toBe(panel.attributes('id'))
  })

  it('moves focus with Left and Right and jumps with Home and End', async () => {
    wrapper = await mountOrganizationDetail()
    const all = tabs(wrapper)

    ;(all[0].element as HTMLElement).focus()
    await all[0].trigger('keydown', { key: 'ArrowRight' })
    expect(focusedKey(wrapper)).toBe('members')

    await all[1].trigger('keydown', { key: 'End' })
    expect(focusedKey(wrapper)).toBe('settings')

    await all[all.length - 1].trigger('keydown', { key: 'Home' })
    expect(focusedKey(wrapper)).toBe('overview')
  })

  it('leaves the manager-only tabs out of the bar entirely for a plain member', async () => {
    canManageOrganization.mockReturnValue(false)
    isOrganizationOwner.mockReturnValue(false)
    canDeleteOrganization.mockReturnValue(false)

    wrapper = await mountOrganizationDetail()
    const keys = tabKeys(wrapper)

    expect(keys).toEqual(['overview', 'members', 'groups', 'subscription'])
    for (const managerTab of MANAGER_TABS) {
      expect(keys).not.toContain(managerTab)
    }

    // The shortened bar still wraps: Right from the last tab returns to the first.
    const all = tabs(wrapper)
    ;(all[all.length - 1].element as HTMLElement).focus()
    await all[all.length - 1].trigger('keydown', { key: 'ArrowRight' })
    expect(focusedKey(wrapper)).toBe('overview')
  })
})
