/**
 * The hierarchy view reads a class's archived state from `archived_at`
 * (ocf-core#491). It loads groups through `GET /organizations/:id/groups`,
 * a custom route that returns archived rows too, so hiding them is the
 * component's job: off by default, revealed by a "Show archived" toggle.
 *
 * The view is about structure only, so it carries no delete action; deleting
 * stays on the class settings page.
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

const OPEN = groupRow()
const ARCHIVED = groupRow({ id: 'class-archived', name: 'devops-2025', display_name: 'DevOps 2025', archived_at: '2026-06-30T00:00:00Z' })
const CHILD_OF_ARCHIVED = groupRow({ id: 'class-child', name: 'devops-2025-a', display_name: 'DevOps 2025 A', parent_group_id: ARCHIVED.id })

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

const showArchivedToggle = (wrapper: ReturnType<typeof mount>) =>
  wrapper.find('[data-test="hierarchy-show-archived"]')

describe('GroupHierarchyEditor archived groups', () => {
  beforeEach(() => vi.clearAllMocks())

  it('hides archived groups, and their subtree, by default', async () => {
    const wrapper = await mountEditor([OPEN, ARCHIVED, CHILD_OF_ARCHIVED])

    expect(wrapper.text()).toContain('DevOps 2026')
    expect(wrapper.text()).not.toContain('DevOps 2025')
    expect(wrapper.text()).not.toContain('DevOps 2025 A')
    expect((showArchivedToggle(wrapper).element as HTMLInputElement).checked).toBe(false)
  })

  it('reveals archived groups with an Archived badge when toggled', async () => {
    const wrapper = await mountEditor([OPEN, ARCHIVED])

    await showArchivedToggle(wrapper).setValue(true)
    await flushPromises()

    expect(wrapper.text()).toContain('DevOps 2025')
    const badges = wrapper.findAll('.archived-badge')
    expect(badges).toHaveLength(1)
    expect(badges[0].text()).toBe('Archived')
  })

  it('renders no delete action', async () => {
    const wrapper = await mountEditor([OPEN])

    // The group row is rendered, so the absence below is not vacuous.
    expect(wrapper.text()).toContain('DevOps 2026')
    expect(wrapper.find('.tree-action-button.delete').exists()).toBe(false)
    expect(wrapper.find('.fa-trash').exists()).toBe(false)
  })
})
