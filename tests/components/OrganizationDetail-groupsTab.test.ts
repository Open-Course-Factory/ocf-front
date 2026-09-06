/**
 * The Groups tab of an organization page follows the backend's verdict on
 * "may this user run classes IN THIS organization?" — the same verdict the
 * sidebar reads for the Groups category (useClassroomEntitlement).
 *
 * It used to be shown to every member of every organization, whatever the plan:
 * a Découverte owner opened their personal organization and found a Groups tab
 * the sidebar had locked. The page asks for the organization it is showing,
 * not the one currently in context, because the two can differ.
 *
 * Absent verdict means not entitled, never "assume yes": a tab that appears
 * before the backend has answered invites the user into a page it will refuse.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { ref } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'

const loadOrganization = vi.fn()
const classroomVerdictFor = vi.fn()

vi.mock('../../src/stores/organizations', () => ({
  useOrganizationsStore: () => ({
    loadOrganization: (...args: unknown[]) => loadOrganization(...args),
    updateOrganization: vi.fn()
  })
}))

vi.mock('../../src/stores/permissions', () => ({
  usePermissionsStore: () => ({
    loadCurrentUser: vi.fn().mockResolvedValue(undefined),
    canManageOrganization: () => true,
    isOrganizationOwner: () => true,
    canDeleteOrganization: () => true,
    classroomVerdictFor: (id: string) => classroomVerdictFor(id)
  })
}))

vi.mock('../../src/composables/useAdminViewMode', () => ({
  useAdminViewMode: () => ({ isAdmin: ref(false) })
}))

import OrganizationDetail from '../../src/components/Pages/OrganizationDetail.vue'

function organizationPayload() {
  return {
    id: 'org-1',
    name: 'personal_owner',
    display_name: 'Personal',
    description: '',
    is_personal: true,
    member_count: 1,
    group_count: 0,
    max_members: 1,
    max_groups: 20
  }
}

async function mountOrganizationDetail(path = '/organizations/org-1') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/organizations', name: 'Organizations', component: { template: '<div />' } },
      { path: '/organizations/:id', component: OrganizationDetail },
      { path: '/organizations/:id/import', name: 'BulkImport', component: { template: '<div />' } }
    ]
  })
  await router.push(path)
  await router.isReady()

  const wrapper = mount(OrganizationDetail, {
    attachTo: document.body,
    global: {
      plugins: [
        createI18n({ legacy: false, locale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false }),
        router
      ],
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

function tabKeys(wrapper: VueWrapper) {
  return wrapper.findAll('[role="tab"]').map(t => (t.attributes('id') || '').replace(/^org-tab-/, ''))
}

function selectedTab(wrapper: VueWrapper) {
  const tab = wrapper.findAll('[role="tab"]').find(t => t.attributes('aria-selected') === 'true')
  return tab ? (tab.attributes('id') || '').replace(/^org-tab-/, '') : null
}

describe('OrganizationDetail — the Groups tab follows the classroom verdict', () => {
  let wrapper: VueWrapper | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    loadOrganization.mockResolvedValue(organizationPayload())
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
  })

  it('asks the verdict for the organization being shown, not the one in context', async () => {
    classroomVerdictFor.mockResolvedValue(false)
    wrapper = await mountOrganizationDetail()

    expect(classroomVerdictFor).toHaveBeenCalledWith('org-1')
  })

  it('hides the Groups tab when the backend refuses classrooms in this organization', async () => {
    classroomVerdictFor.mockResolvedValue(false)
    wrapper = await mountOrganizationDetail()

    expect(tabKeys(wrapper)).not.toContain('groups')
    expect(wrapper.find('#org-panel-groups').exists()).toBe(false)
  })

  it('shows the Groups tab when the backend allows classrooms in this organization', async () => {
    classroomVerdictFor.mockResolvedValue(true)
    wrapper = await mountOrganizationDetail()

    expect(tabKeys(wrapper)).toContain('groups')
  })

  it('lands on the overview when the URL names the Groups tab but the verdict refuses it', async () => {
    classroomVerdictFor.mockResolvedValue(false)
    wrapper = await mountOrganizationDetail('/organizations/org-1?tab=groups')

    expect(selectedTab(wrapper)).toBe('overview')
    expect(wrapper.find('#org-panel-groups').exists()).toBe(false)
  })

  it('treats a verdict that never arrives as a refusal', async () => {
    classroomVerdictFor.mockRejectedValue(new Error('network'))
    wrapper = await mountOrganizationDetail()

    expect(tabKeys(wrapper)).not.toContain('groups')
  })
})
