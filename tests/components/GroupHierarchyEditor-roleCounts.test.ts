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
  useAdminViewMode: () => ({ isAdmin: ref(viewer.isAdmin), shouldFilterAsStandardUser: ref(false) })
}))

const ORG = { id: 'org-1', name: 'esitech', display_name: 'ESITECH', is_personal: false }
// Who is looking: a platform admin by default, as every count test assumes.
const viewer = { isAdmin: true, orgs: [ORG] as Record<string, any>[], roles: {} as Record<string, string> }

vi.mock('../../src/stores/organizations', () => ({
  useOrganizationsStore: () => ({
    organizations: viewer.orgs,
    loadOrganizations: vi.fn().mockResolvedValue(undefined)
  })
}))

vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: () => ({ userId: 'user-1' })
}))

vi.mock('../../src/stores/userMemberships', () => ({
  useUserMembershipsStore: () => ({
    getOrgRole: (id: string) => viewer.roles[id] ?? null,
    ensureLoaded: vi.fn().mockResolvedValue(undefined)
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
  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(viewer, { isAdmin: true, orgs: [ORG], roles: {} })
  })

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

describe('GroupHierarchyEditor for a user who is not a platform admin', () => {
  beforeEach(() => vi.clearAllMocks())

  it('offers only the organizations the user belongs to or owns', async () => {
    const OTHER = { id: 'org-2', name: 'other', display_name: 'OTHER SCHOOL', is_personal: false }
    const OWNED = { id: 'org-3', name: 'mine', display_name: 'MINE', is_personal: false, owner_user_id: 'user-1' }
    Object.assign(viewer, { isAdmin: false, orgs: [ORG, OTHER, OWNED], roles: { 'org-1': 'member' } })

    const wrapper = await mountEditor([])
    const labels = wrapper.findAll('.node-label').map(l => l.text())

    expect(labels).toEqual(expect.arrayContaining(['ESITECH', 'MINE']))
    expect(labels).not.toContain('OTHER SCHOOL')
    expect(axios.get).not.toHaveBeenCalledWith('/organizations/org-2/groups', expect.anything())
  })
})
