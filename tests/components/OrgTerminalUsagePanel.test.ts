/**
 * Tests for OrgTerminalUsagePanel — per-member view.
 *
 * Org plans apply their CPU/RAM budget PER MEMBER, not as a pooled org-wide
 * quota. The panel therefore renders:
 *   - a per-member-limit subheader (or an "unlimited per member" line), and
 *   - one row per active user, each showing that user's CPU/RAM usage against
 *     the per-member cap plus their occupying-slot count.
 *
 * The old pooled framing (budget summary, per-size remaining table, advanced
 * vCPU/RAM org totals, "no remaining capacity") was intentionally removed in
 * 6f93f5a — these tests guard against it being reintroduced.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import type { OrgTerminalUsage } from '../../src/types/terminal'

// Mock the terminal service so we control what the panel "fetches".
// Mock the barrel (canonical import path) so test setup matches sibling test files.
const getOrgTerminalUsageMock = vi.fn()
vi.mock('../../src/services/domain/terminal', () => ({
  terminalService: {
    getOrgTerminalUsage: (...args: unknown[]) => getOrgTerminalUsageMock(...args)
  }
}))

// Mock the permissions store — the panel hides itself unless the user can manage the org
vi.mock('../../src/stores/permissions', () => ({
  usePermissionsStore: () => ({
    canManageOrganization: () => true
  })
}))

import OrgTerminalUsagePanel from '../../src/components/Terminal/OrgTerminalUsagePanel.vue'

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

function mountPanel(): VueWrapper {
  return mount(OrgTerminalUsagePanel, {
    props: { organizationId: 'org-1' },
    global: {
      plugins: [createTestI18n()]
    }
  })
}

// Mount the panel, expand it, and flush the mocked fetch.
async function mountExpanded(): Promise<VueWrapper> {
  const wrapper = mountPanel()
  await flushPromises()
  await wrapper.find('.collapsible-header').trigger('click')
  await flushPromises()
  return wrapper
}

// Capped per-member plan: 4 vCPU (4000 mCPU) · 8 GiB per member.
// CPU is transported in millicores (1000 mCPU = 1 vCPU).
const CAPPED_USAGE: OrgTerminalUsage = {
  organization_id: 'org-1',
  plan_name: 'School',
  is_fallback: false,
  occupying_slots: 3,
  quota: {
    max_cpu: 4000,
    max_memory_mb: 8192, // 8 GiB
    used_cpu: 3000,
    used_memory_mb: 6144,
    remaining_cpu: 1000,
    remaining_memory_mb: 2048,
    scope: 'organization'
  },
  remaining_by_size: [],
  users: [
    {
      user_id: 'u1',
      display_name: 'Alice',
      email: 'alice@example.com',
      active_count: 2,
      occupying_slots: 2,
      active_cpu: 2000, // 2 vCPU
      active_memory_mb: 4096 // 4 GiB
    },
    {
      user_id: 'u2',
      display_name: 'Bob',
      email: 'bob@example.com',
      active_count: 1,
      occupying_slots: 1,
      active_cpu: 1000, // 1 vCPU
      active_memory_mb: 2048 // 2 GiB
    }
  ]
}

// Unlimited per-member plan: max_cpu / max_memory_mb both 0 (server convention).
const UNLIMITED_USAGE: OrgTerminalUsage = {
  ...CAPPED_USAGE,
  plan_name: 'Enterprise',
  quota: {
    max_cpu: 0,
    max_memory_mb: 0,
    used_cpu: 3000,
    used_memory_mb: 6144,
    remaining_cpu: 0,
    remaining_memory_mb: 0,
    scope: 'unlimited'
  }
}

describe('OrgTerminalUsagePanel', () => {
  beforeEach(() => {
    getOrgTerminalUsageMock.mockReset()
  })

  describe('per-member view', () => {
    it('renders the per-member-limit subheader with the plan cap (capped plan)', async () => {
      getOrgTerminalUsageMock.mockResolvedValue(CAPPED_USAGE)
      const wrapper = await mountExpanded()

      const subheader = wrapper.find('[data-testid="per-member-limit"]')
      expect(subheader.exists()).toBe(true)
      const text = subheader.text()
      // Plan name, the per-member CPU cap (4 vCPU) and RAM cap (8 GiB) are shown.
      expect(text).toContain('School')
      expect(text).toMatch(/4\s*vCPU/i)
      expect(text).toMatch(/8(?:\.0)?\s*GiB/i)
      // It must NOT advertise an unlimited per-member allowance.
      expect(text.toLowerCase()).not.toContain('unlimited')
    })

    it('shows the "unlimited per member" copy when the plan cap is 0', async () => {
      getOrgTerminalUsageMock.mockResolvedValue(UNLIMITED_USAGE)
      const wrapper = await mountExpanded()

      const subheader = wrapper.find('[data-testid="per-member-limit"]')
      expect(subheader.exists()).toBe(true)
      expect(subheader.text().toLowerCase()).toContain('unlimited')

      // No per-member cap bars are rendered when there is no cap to fill.
      expect(wrapper.find('[data-testid="user-cpu-bar-fill"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="user-mem-bar-fill"]').exists()).toBe(false)
    })

    it('renders one row per active user with their used-vs-cap CPU/RAM', async () => {
      getOrgTerminalUsageMock.mockResolvedValue(CAPPED_USAGE)
      const wrapper = await mountExpanded()

      const rows = wrapper.findAll('.user-row')
      expect(rows.length).toBe(2)

      // Both users appear by name.
      expect(rows[0].text()).toContain('Alice')
      expect(rows[1].text()).toContain('Bob')

      const cpuCells = wrapper.findAll('[data-testid="user-active-cpu"]')
      const memCells = wrapper.findAll('[data-testid="user-active-memory"]')
      expect(cpuCells.length).toBe(2)
      expect(memCells.length).toBe(2)

      // Alice: 2 / 4 vCPU · 4.0 GiB / 8.0 GiB
      expect(cpuCells[0].text()).toMatch(/2\s*\/\s*4\s*vCPU/i)
      expect(memCells[0].text()).toMatch(/4(?:\.0)?\s*GiB\s*\/\s*8(?:\.0)?\s*GiB/i)

      // Bob: 1 / 4 vCPU · 2.0 GiB / 8.0 GiB — distinct numbers from Alice.
      expect(cpuCells[1].text()).toMatch(/1\s*\/\s*4\s*vCPU/i)
      expect(memCells[1].text()).toMatch(/2(?:\.0)?\s*GiB\s*\/\s*8(?:\.0)?\s*GiB/i)
    })

    it('renders each user\'s occupying-slot count', async () => {
      getOrgTerminalUsageMock.mockResolvedValue(CAPPED_USAGE)
      const wrapper = await mountExpanded()

      const counts = wrapper.findAll('.user-count')
      expect(counts.length).toBe(2)
      expect(counts[0].text()).toContain('2') // Alice
      expect(counts[1].text()).toContain('1') // Bob
    })

    it('does not render the removed pooled-budget UI (summary / size table / advanced totals)', async () => {
      getOrgTerminalUsageMock.mockResolvedValue(CAPPED_USAGE)
      const wrapper = await mountExpanded()

      // The org-pooled framing was removed — none of these must come back.
      expect(wrapper.find('[data-testid="budget-summary"]').exists()).toBe(false)
      expect(wrapper.find('.budget-summary').exists()).toBe(false)
      expect(wrapper.find('[data-testid="size-table"]').exists()).toBe(false)
      expect(wrapper.findAll('[data-testid="size-row"]').length).toBe(0)
      expect(wrapper.find('[data-testid="advanced-quota"]').exists()).toBe(false)
      expect(wrapper.find('.advanced-quota').exists()).toBe(false)
      expect(wrapper.find('.progress-section').exists()).toBe(false)
    })
  })
})
