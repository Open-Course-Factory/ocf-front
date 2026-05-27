/**
 * Tests for OrgTerminalUsagePanel — both legacy (count) and budget modes.
 *
 * - Count mode: legacy single-bar UI (active_terminals / max_terminals)
 * - Budget mode: per-size remaining capacity + optional advanced vCPU/RAM toggle
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

const COUNT_MODE_USAGE: OrgTerminalUsage = {
  organization_id: 'org-1',
  plan_name: 'Trainer',
  is_fallback: false,
  active_terminals: 3,
  max_terminals: 10,
  users: [
    {
      user_id: 'u1',
      display_name: 'Alice',
      email: 'alice@example.com',
      active_count: 2
    },
    {
      user_id: 'u2',
      display_name: 'Bob',
      email: 'bob@example.com',
      active_count: 1
    }
  ]
}

const BUDGET_MODE_USAGE: OrgTerminalUsage = {
  organization_id: 'org-1',
  plan_name: 'School',
  is_fallback: false,
  active_terminals: 3,
  max_terminals: 0, // unused in budget mode
  quota: {
    max_cpu: 12,
    max_memory_mb: 24576, // 24 GiB
    used_cpu: 5,
    used_memory_mb: 6144, // 6 GiB used
    remaining_cpu: 7,
    remaining_memory_mb: 18432, // 18 GiB remaining
    scope: 'organization'
  },
  remaining_by_size: [
    { key: 'xl', cpu: 8, memory_mb: 16384, remaining_count: 1 },
    { key: 'l', cpu: 4, memory_mb: 8192, remaining_count: 1 },
    { key: 'm', cpu: 2, memory_mb: 4096, remaining_count: 4 },
    { key: 's', cpu: 1, memory_mb: 2048, remaining_count: 9 },
    { key: 'xs', cpu: 1, memory_mb: 1024, remaining_count: 18 }
  ],
  users: [
    {
      user_id: 'u1',
      display_name: 'Alice',
      email: 'alice@example.com',
      active_count: 2,
      active_cpu: 3,
      active_memory_mb: 4096
    },
    {
      user_id: 'u2',
      display_name: 'Bob',
      email: 'bob@example.com',
      active_count: 1,
      active_cpu: 2,
      active_memory_mb: 2048
    }
  ]
}

describe('OrgTerminalUsagePanel', () => {
  beforeEach(() => {
    getOrgTerminalUsageMock.mockReset()
  })

  describe('count mode (legacy)', () => {
    it('renders the legacy progress bar with active/max counts', async () => {
      getOrgTerminalUsageMock.mockResolvedValue(COUNT_MODE_USAGE)
      const wrapper = mountPanel()
      await flushPromises()

      // Expand
      await wrapper.find('.collapsible-header').trigger('click')
      await flushPromises()

      expect(wrapper.find('.progress-section').exists()).toBe(true)
      expect(wrapper.find('.progress-fill').exists()).toBe(true)

      // Budget-specific summary should NOT render
      expect(wrapper.find('[data-testid="budget-summary"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="size-table"]').exists()).toBe(false)
    })

    it('hides the per-user CPU/RAM columns in count mode', async () => {
      getOrgTerminalUsageMock.mockResolvedValue(COUNT_MODE_USAGE)
      const wrapper = mountPanel()
      await flushPromises()
      await wrapper.find('.collapsible-header').trigger('click')
      await flushPromises()

      expect(wrapper.find('[data-testid="user-active-cpu"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="user-active-memory"]').exists()).toBe(false)
    })
  })

  describe('budget mode', () => {
    it('renders the budget summary line with top remaining sizes', async () => {
      getOrgTerminalUsageMock.mockResolvedValue(BUDGET_MODE_USAGE)
      const wrapper = mountPanel()
      await flushPromises()
      await wrapper.find('.collapsible-header').trigger('click')
      await flushPromises()

      const summary = wrapper.find('[data-testid="budget-summary"]')
      expect(summary.exists()).toBe(true)
      // The largest size with remaining capacity is XL (1 remaining)
      expect(summary.text()).toMatch(/1\s*XL/i)
    })

    it('renders one size row per catalog size, ordered XL -> XS', async () => {
      getOrgTerminalUsageMock.mockResolvedValue(BUDGET_MODE_USAGE)
      const wrapper = mountPanel()
      await flushPromises()
      await wrapper.find('.collapsible-header').trigger('click')
      await flushPromises()

      const sizeTable = wrapper.find('[data-testid="size-table"]')
      expect(sizeTable.exists()).toBe(true)

      const rows = wrapper.findAll('[data-testid="size-row"]')
      expect(rows.length).toBe(5)

      // First row should be the largest (XL)
      expect(rows[0].text().toUpperCase()).toContain('XL')
    })

    it('hides the legacy progress bar in budget mode', async () => {
      getOrgTerminalUsageMock.mockResolvedValue(BUDGET_MODE_USAGE)
      const wrapper = mountPanel()
      await flushPromises()
      await wrapper.find('.collapsible-header').trigger('click')
      await flushPromises()

      expect(wrapper.find('.progress-section').exists()).toBe(false)
    })

    it('keeps the advanced (vCPU / RAM) section collapsed by default', async () => {
      getOrgTerminalUsageMock.mockResolvedValue(BUDGET_MODE_USAGE)
      const wrapper = mountPanel()
      await flushPromises()
      await wrapper.find('.collapsible-header').trigger('click')
      await flushPromises()

      const advanced = wrapper.find('[data-testid="advanced-quota"]')
      expect(advanced.exists()).toBe(true)
      // <details> defaults to closed (no `open` attribute)
      expect(advanced.attributes('open')).toBeUndefined()
    })

    it('renders per-user CPU and RAM columns in budget mode', async () => {
      getOrgTerminalUsageMock.mockResolvedValue(BUDGET_MODE_USAGE)
      const wrapper = mountPanel()
      await flushPromises()
      await wrapper.find('.collapsible-header').trigger('click')
      await flushPromises()

      const cpuCells = wrapper.findAll('[data-testid="user-active-cpu"]')
      const memCells = wrapper.findAll('[data-testid="user-active-memory"]')
      expect(cpuCells.length).toBe(2)
      expect(memCells.length).toBe(2)
      expect(cpuCells[0].text()).toMatch(/3/)
      // formatMemoryMb renders 4096 MiB as either "4 GiB" or "4.0 GiB" depending on precision.
      expect(memCells[0].text()).toMatch(/4(?:\.0)?\s*GiB/i)
    })

    it('shows the "no remaining capacity" message when every size is full', async () => {
      const exhausted: OrgTerminalUsage = {
        ...BUDGET_MODE_USAGE,
        remaining_by_size: (BUDGET_MODE_USAGE.remaining_by_size || []).map(s => ({
          ...s,
          remaining_count: 0
        }))
      }
      getOrgTerminalUsageMock.mockResolvedValue(exhausted)
      const wrapper = mountPanel()
      await flushPromises()
      await wrapper.find('.collapsible-header').trigger('click')
      await flushPromises()

      const summary = wrapper.find('[data-testid="budget-summary"]')
      expect(summary.exists()).toBe(true)
      expect(summary.text().toLowerCase()).toContain('no remaining')
    })

    it('renders count mode when usage has no quota field (count-mode plans)', async () => {
      // Budget mode is signalled structurally by the presence of the `quota`
      // block. Count-mode plans omit it entirely — there is no `scope:
      // "unlimited"` sentinel anymore (see MR !237 / C8).
      const noQuota: OrgTerminalUsage = {
        ...BUDGET_MODE_USAGE,
        // Drop both budget fields so the response matches a real count-mode payload.
        quota: undefined,
        remaining_by_size: undefined,
        max_terminals: 10
      }
      getOrgTerminalUsageMock.mockResolvedValue(noQuota)
      const wrapper = mountPanel()
      await flushPromises()
      await wrapper.find('.collapsible-header').trigger('click')
      await flushPromises()

      // Should render the legacy progress bar — and none of the budget-mode UI.
      expect(wrapper.find('.progress-section').exists()).toBe(true)
      expect(wrapper.find('[data-testid="size-table"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="budget-summary"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="advanced-quota"]').exists()).toBe(false)
    })
  })
})
