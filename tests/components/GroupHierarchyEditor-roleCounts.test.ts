/**
 * Each line of the hierarchy shows its members by class role (its own and its
 * subgroups', like the existing total), each organisation line the sum of its
 * classes, and a global line the sum over every organisation shown. Archived
 * classes, hidden by default, count for nothing.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

vi.mock('axios', () => ({
  default: { get: vi.fn(), put: vi.fn(), delete: vi.fn() }
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() })
}))

vi.mock('../../src/composables/useAdminViewMode', () => ({
  useAdminViewMode: () => ({ isAdmin: ref(true), shouldFilterAsStandardUser: ref(false) })
}))

const ORG = { id: 'org-1', name: 'esitech', display_name: 'ESITECH', is_personal: false }

vi.mock('../../src/stores/organizations', () => ({
  useOrganizationsStore: () => ({
    organizations: [ORG],
    loadOrganizations: vi.fn().mockResolvedValue(undefined)
  })
}))

vi.mock('../../src/stores/permissions', () => ({
  usePermissionsStore: () => ({
    currentUser: { id: 'user-1', organization_memberships: [] },
    loadCurrentUser: vi.fn().mockResolvedValue(undefined)
  })
}))

import GroupHierarchyEditor from '../../src/components/Pages/GroupHierarchyEditor.vue'

function groupRow(overrides: Record<string, any> = {}) {
  return {
    id: 'class-open',
    organization_id: ORG.id,
    name: 'devops-2026',
    display_name: 'DevOps 2026',
    parent_group_id: null,
    member_count: 3,
    ...overrides
  }
}

async function mountEditor(rows: Record<string, any>[]) {
  setActivePinia(createPinia())
  vi.mocked(axios.get).mockResolvedValue({ data: rows })
  const wrapper = mount(GroupHierarchyEditor, {
    global: {
      plugins: [
        createI18n({ legacy: false, locale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })
      ],
      stubs: { AdminBadge: { template: '<span />', props: ['iconOnly'] }, RouterLink: RouterLinkStub }
    }
  })
  await flushPromises()
  // Nothing is expanded on mount; a user opens the tree with "Expand All".
  await wrapper.find('.expand-btn').trigger('click')
  return wrapper
}

const m = (role: string, n: number) => Array.from({ length: n }, (_, i) => ({ user_id: `${role}-${i}`, role }))

const PARENT = groupRow({ id: 'parent', display_name: 'Parent', member_count: 3, members: [...m('owner', 1), ...m('member', 2)] })
const CHILD = groupRow({ id: 'child', display_name: 'Child', parent_group_id: 'parent', member_count: 4, members: [...m('manager', 1), ...m('member', 3)] })
const ARCHIVED = groupRow({ id: 'old', display_name: 'Old', member_count: 9, members: m('member', 9), archived_at: '2026-06-30T00:00:00Z' })

// The counts shown on the tree row whose label is `label`.
const rowCounts = (wrapper: ReturnType<typeof mount>, label: string) => {
  const row = wrapper.findAll('.tree-node-header').find(h => h.find('.node-label').text() === label)
  expect(row, `row ${label}`).toBeTruthy()
  return countsIn(row!)
}

const countsIn = (el: ReturnType<ReturnType<typeof mount>['find']>) =>
  Object.fromEntries(el.findAll('[data-test^="role-count-"]').map(c => [c.attributes('data-test')!.replace('role-count-', ''), Number(c.text())]))

describe('GroupHierarchyEditor counts by role', () => {
  beforeEach(() => vi.clearAllMocks())

  it('asks for the members, which carry the roles', async () => {
    await mountEditor([PARENT])
    expect(axios.get).toHaveBeenCalledWith('/organizations/org-1/groups', { params: { includes: 'Members' } })
  })

  it('counts each line with its subgroups, the organisation, and the global total', async () => {
    const wrapper = await mountEditor([PARENT, CHILD, ARCHIVED])

    expect(rowCounts(wrapper, 'Child')).toEqual({ manager: 1, member: 3 })
    expect(rowCounts(wrapper, 'Parent')).toEqual({ owner: 1, manager: 1, member: 5 })
    expect(rowCounts(wrapper, 'ESITECH')).toEqual({ owner: 1, manager: 1, member: 5 })
    expect(countsIn(wrapper.find('[data-test="hierarchy-role-totals"]'))).toEqual({ owner: 1, manager: 1, member: 5 })
  })

  it('shows no global total when there is nothing to count', async () => {
    const wrapper = await mountEditor([groupRow({ members: [] , member_count: 0 })])
    expect(wrapper.find('[data-test="hierarchy-role-totals"]').text()).toBe('')
  })
})
