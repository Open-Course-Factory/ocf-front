/**
 * GroupAnalyticsTab — per-scenario analytics fan-out (#306).
 *
 * The tab fetches the group's assignments, then one analytics call per assigned
 * scenario. Two defects pinned here:
 *
 *   1. The calls ran serially inside an `await` loop, and each failure was
 *      swallowed into console.error. A scenario whose analytics 500s simply
 *      vanished from the table — and from the CSV export, so a teacher could
 *      hand an incomplete report to their Qualiopi auditor without ever seeing
 *      a warning.
 *   2. The response was read with field names the backend does not send
 *      (`started_count`, `avg_time_seconds`), so "Started" and "Avg Time" were
 *      permanently 0, which also pinned the overall completion rate at 0%.
 *      The backend contract is services.ScenarioAnalytics in ocf-core:
 *      { total_sessions, completed_count, completion_rate, avg_grade,
 *        avg_completion_time_seconds }.
 *
 * Assertions are on rendered rows, visible warning text and the exported file.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { nextTick } from 'vue'

const getGroupAssignments = vi.fn()
const getScenarioAnalytics = vi.fn()
const showConfirm = vi.fn()

vi.mock('../../src/services/domain/scenario/teacherService', () => ({
  teacherService: {
    getGroupAssignments: (...args: unknown[]) => getGroupAssignments(...args),
    getScenarioAnalytics: (...args: unknown[]) => getScenarioAnalytics(...args)
  }
}))

vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showConfirm: (...args: unknown[]) => showConfirm(...args),
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showWarning: vi.fn(),
    showInfo: vi.fn(),
    showMessage: vi.fn(),
    showAlert: vi.fn(),
    showPrompt: vi.fn()
  })
}))

import GroupAnalyticsTab from '../../src/components/Groups/GroupAnalyticsTab.vue'

const ASSIGNMENTS = [
  { id: 'a1', scenario_id: 'sc-1', group_id: 'grp-1', scenario: { title: 'Bash basics', difficulty: 'beginner' } },
  { id: 'a2', scenario_id: 'sc-2', group_id: 'grp-1', scenario: { title: 'Systemd units', difficulty: 'intermediate' } },
  { id: 'a3', scenario_id: 'sc-3', group_id: 'grp-1', scenario: { title: 'LVM rescue', difficulty: 'advanced' } }
]

/** Mirror of services.ScenarioAnalytics (ocf-core). */
function analyticsFor(sessions: number, completed: number) {
  return {
    total_sessions: sessions,
    completed_count: completed,
    completion_rate: sessions > 0 ? Math.round((completed / sessions) * 100) : 0,
    avg_grade: 14.5,
    avg_completion_time_seconds: 1800
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

function mountTab() {
  return mount(GroupAnalyticsTab, {
    props: { groupId: 'grp-1', canEditGroup: true },
    global: { plugins: [createTestI18n()] }
  })
}

async function flushPromises() {
  await new Promise(resolve => setTimeout(resolve, 0))
  await nextTick()
}

/** Titles of the scenario rows currently rendered in the table. */
function renderedScenarios(wrapper: any): string[] {
  return wrapper.findAll('.analytics-table tbody tr .scenario-name').map((td: any) => td.text())
}

let exportedBlobs: Blob[] = []
let exportedFilenames: string[] = []

describe('GroupAnalyticsTab — per-scenario analytics fan-out (#306)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    exportedBlobs = []
    exportedFilenames = []
    getGroupAssignments.mockResolvedValue(ASSIGNMENTS)
    showConfirm.mockResolvedValue(true)

    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn((blob: Blob) => {
        exportedBlobs.push(blob)
        return 'blob:mock'
      }),
      revokeObjectURL: vi.fn()
    })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      exportedFilenames.push(this.download)
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe('all scenarios load', () => {
    beforeEach(() => {
      getScenarioAnalytics.mockImplementation(async (_groupId: string, scenarioId: string) => {
        const sessions = { 'sc-1': 10, 'sc-2': 8, 'sc-3': 4 }[scenarioId] ?? 0
        return analyticsFor(sessions, sessions / 2)
      })
    })

    it('renders one row per assigned scenario with no failure warning', async () => {
      const wrapper = mountTab()
      await flushPromises()

      expect(renderedScenarios(wrapper)).toEqual(['Bash basics', 'Systemd units', 'LVM rescue'])
      expect(wrapper.find('.analytics-warning').exists()).toBe(false)
    })

    it('shows the session counts the backend actually returns instead of zeros', async () => {
      const wrapper = mountTab()
      await flushPromises()

      const firstRowCells = wrapper.findAll('.analytics-table tbody tr')[0].findAll('td')
      expect(firstRowCells[2].text()).toBe('10') // Started — from total_sessions
      expect(firstRowCells[3].text()).toBe('5')  // Completed
      expect(firstRowCells[6].text()).toBe('30m') // Avg Time — from avg_completion_time_seconds

      // Summary totals are built from the same numbers.
      const summaryValues = wrapper.findAll('.summary-value').map((el: any) => el.text())
      expect(summaryValues[0]).toBe('22')
      expect(summaryValues[1]).toBe('11')
      expect(summaryValues[2]).toBe('50%')
    })

    it('requests every scenario in parallel rather than one after the other', async () => {
      const release: Array<(value: any) => void> = []
      getScenarioAnalytics.mockImplementation(
        () => new Promise(resolve => { release.push(resolve) })
      )

      mountTab()
      await flushPromises()

      // All three are in flight while none has resolved — impossible with an
      // `await` inside the loop.
      expect(getScenarioAnalytics).toHaveBeenCalledTimes(3)
      release.forEach(resolve => resolve(analyticsFor(1, 1)))
    })

    it('exports every row under the plain filename', async () => {
      const wrapper = mountTab()
      await flushPromises()

      await wrapper.find('.tab-header button').trigger('click')
      await flushPromises()

      expect(showConfirm).not.toHaveBeenCalled()
      expect(exportedFilenames).toEqual(['analytics-group-grp-1.csv'])
      expect(await exportedBlobs[0].text()).toContain('Bash basics')
    })
  })

  describe('some scenarios fail to load', () => {
    beforeEach(() => {
      getScenarioAnalytics.mockImplementation(async (_groupId: string, scenarioId: string) => {
        if (scenarioId === 'sc-2') throw new Error('boom')
        return analyticsFor(10, 5)
      })
    })

    it('keeps the scenarios that loaded and names the one that did not', async () => {
      const wrapper = mountTab()
      await flushPromises()

      expect(renderedScenarios(wrapper)).toEqual(['Bash basics', 'LVM rescue'])

      const warning = wrapper.find('.analytics-warning')
      expect(warning.exists()).toBe(true)
      expect(warning.text()).toContain('Systemd units')
      expect(warning.text()).not.toContain('Bash basics')
    })

    it('lets the teacher retry loading without leaving the tab', async () => {
      const wrapper = mountTab()
      await flushPromises()
      expect(wrapper.find('.analytics-warning').exists()).toBe(true)

      getScenarioAnalytics.mockImplementation(async () => analyticsFor(10, 5))
      await wrapper.find('.analytics-warning button').trigger('click')
      await flushPromises()

      expect(renderedScenarios(wrapper)).toEqual(['Bash basics', 'Systemd units', 'LVM rescue'])
      expect(wrapper.find('.analytics-warning').exists()).toBe(false)
    })

    it('warns before exporting and marks the file as incomplete', async () => {
      const wrapper = mountTab()
      await flushPromises()

      await wrapper.find('.tab-header button').trigger('click')
      await flushPromises()

      expect(showConfirm).toHaveBeenCalledTimes(1)
      expect(String(showConfirm.mock.calls[0][0])).toContain('Systemd units')
      expect(exportedFilenames).toEqual(['analytics-group-grp-1-incomplete.csv'])
    })

    it('exports nothing when the teacher declines the incomplete export', async () => {
      showConfirm.mockResolvedValue(false)

      const wrapper = mountTab()
      await flushPromises()

      await wrapper.find('.tab-header button').trigger('click')
      await flushPromises()

      expect(exportedFilenames).toEqual([])
      expect(exportedBlobs).toEqual([])
    })
  })

  describe('every scenario fails to load', () => {
    beforeEach(() => {
      getScenarioAnalytics.mockRejectedValue(new Error('boom'))
    })

    it('names them all instead of claiming there is no data yet', async () => {
      const wrapper = mountTab()
      await flushPromises()

      const warning = wrapper.find('.analytics-warning')
      expect(warning.exists()).toBe(true)
      expect(warning.text()).toContain('Bash basics')
      expect(warning.text()).toContain('Systemd units')
      expect(warning.text()).toContain('LVM rescue')
      expect(wrapper.find('.empty-state').exists()).toBe(false)
    })
  })

  describe('the group has no assigned scenarios', () => {
    it('shows the empty state and asks the backend for nothing', async () => {
      getGroupAssignments.mockResolvedValue([])

      const wrapper = mountTab()
      await flushPromises()

      expect(getScenarioAnalytics).not.toHaveBeenCalled()
      expect(wrapper.find('.empty-state').exists()).toBe(true)
      expect(wrapper.find('.analytics-warning').exists()).toBe(false)
    })
  })

  describe('the assignments list itself fails', () => {
    it('shows the load error and no warning banner', async () => {
      getGroupAssignments.mockRejectedValue({
        response: { data: { error_message: 'Group not found' } }
      })

      const wrapper = mountTab()
      await flushPromises()

      expect(wrapper.find('.alert-danger').text()).toContain('Group not found')
      expect(wrapper.find('.analytics-warning').exists()).toBe(false)
    })
  })
})
