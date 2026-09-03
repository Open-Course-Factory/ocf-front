/**
 * The organization's groups list reads a class's archived state from
 * `archived_at` (ocf-core#491). The route emits a derived `is_active` too,
 * but that field is transitional and no front reader may branch on it.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { createRouter, createMemoryHistory } from 'vue-router'

vi.mock('axios', () => ({
  default: { get: vi.fn() }
}))

vi.mock('../../src/composables/useAdminViewMode', () => ({
  useAdminViewMode: () => ({ isAdmin: ref(false) })
}))

import OrganizationGroupsManager from '../../src/components/Organizations/OrganizationGroupsManager.vue'

function classRow(overrides: Record<string, any> = {}) {
  return {
    id: 'class-1',
    organization_id: 'org-1',
    name: 'devops-2026',
    display_name: 'DevOps 2026',
    member_count: 3,
    max_members: 30,
    is_active: true,
    ...overrides
  }
}

async function mountManager(rows: Record<string, any>[]) {
  setActivePinia(createPinia())
  vi.mocked(axios.get).mockResolvedValue({ data: rows })
  const wrapper = mount(OrganizationGroupsManager, {
    props: { organizationId: 'org-1', canManage: true },
    global: {
      plugins: [
        createI18n({ legacy: false, locale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false }),
        createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: { template: '<div />' } }] })
      ],
      stubs: { AdminBadge: { template: '<span />', props: ['iconOnly'] } }
    }
  })
  await flushPromises()
  return wrapper
}

describe('OrganizationGroupsManager archived badge', () => {
  beforeEach(() => vi.clearAllMocks())

  it('flags an archived class', async () => {
    const wrapper = await mountManager([classRow({ archived_at: '2026-06-30T00:00:00Z', is_active: false })])

    expect(wrapper.find('.status-badge.inactive').text()).toBe('Archived')
    expect(wrapper.find('.status-badge.active').exists()).toBe(false)
  })

  it('shows an open class active, whatever the transitional is_active says', async () => {
    const wrapper = await mountManager([classRow({ is_active: false })])

    expect(wrapper.find('.status-badge.inactive').exists()).toBe(false)
    expect(wrapper.find('.status-badge.active').exists()).toBe(true)
  })
})
