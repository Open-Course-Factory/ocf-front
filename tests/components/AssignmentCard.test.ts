/**
 * Tests for AssignmentCard — the redesigned (Branch 2) presentational
 * assignment row for GroupScenariosTab (#244 results-discoverability UX).
 *
 * This is a behavior CHANGE, not a frozen extraction:
 *   - NEW progress section (bar + "x/y done" + avg chip) driven by the new
 *     `progress` prop (per-assignment progress from the new ocf-core endpoint).
 *   - The 6 flat action buttons become a PRIMARY "View results →" button plus a
 *     ⋯ overflow dropdown holding the 5 secondary actions.
 *
 * The card is presentational: it emits payload-less events; the parent binds
 * per-row in its v-for. Dropdown pattern mirrors TerminalMySessions.vue
 * (toggle on ⋯ click, close on outside click).
 *
 * i18n note: empty test messages → assert on DOM structure, prop-driven data
 * (title, dates, progress numbers) and emits — not translated chrome. Status
 * chip presence is asserted by class, not text.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

import AssignmentCard from '../../src/components/Groups/AssignmentCard.vue'

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false,
  })
}

const assignment = {
  id: 'a1',
  scenario_id: 'scn-1',
  group_id: 'g1',
  scope: 'group',
  start_date: '2026-06-01T00:00:00.000Z',
  deadline: '2026-06-30T00:00:00.000Z',
  is_active: true,
  scenario: {
    id: 'scn-1',
    name: 'intro',
    title: 'Intro to Linux',
    difficulty: 'beginner',
    organization_id: 'org-1',
  },
}

function mountCard(props: Record<string, unknown> = {}) {
  return mount(AssignmentCard, {
    props: {
      assignment,
      progress: null,
      canEditGroup: true,
      bulkStarting: false,
      ...props,
    },
    global: { plugins: [createTestI18n()] },
  })
}

// The secondary actions live behind the ⋯ overflow; open it first.
async function openMenu(wrapper: ReturnType<typeof mountCard>) {
  await wrapper.find('.assignment-actions .btn-icon').trigger('click')
}

describe('AssignmentCard', () => {
  describe('info block', () => {
    it('renders the scenario title, difficulty badge, status chip and dates', () => {
      const wrapper = mountCard()
      expect(wrapper.text()).toContain('Intro to Linux')
      expect(wrapper.find('.difficulty-badge').exists()).toBe(true)
      // Active assignment → status-active chip.
      expect(wrapper.find('.status-chip.status-active').exists()).toBe(true)
      // Both dates rendered (formatDate of the ISO start/deadline).
      expect(wrapper.find('.start-date-text').exists()).toBe(true)
      expect(wrapper.find('.deadline-text').exists()).toBe(true)
    })

    it('shows the inactive chip when the assignment is not active', () => {
      const wrapper = mountCard({ assignment: { ...assignment, is_active: false } })
      expect(wrapper.find('.status-chip.status-inactive').exists()).toBe(true)
      expect(wrapper.find('.status-chip.status-active').exists()).toBe(false)
    })

    it('shows the org badge for an org-sourced scenario', () => {
      const wrapper = mountCard()
      expect(wrapper.find('.org-badge').exists()).toBe(true)
    })
  })

  describe('progress section', () => {
    it('renders a progress bar at the right fill, the x/y text and the avg chip', () => {
      const wrapper = mountCard({
        progress: { scenario_id: 'scn-1', total_count: 20, completed_count: 12, avg_grade: 78 },
      })

      const fill = wrapper.find('.progress-bar-fill')
      expect(fill.exists()).toBe(true)
      // 12/20 = 60%.
      expect(fill.attributes('style') || '').toMatch(/width:\s*60%/)

      expect(wrapper.find('.assignment-progress-text').text()).toContain('12/20')

      const avg = wrapper.find('.assignment-progress-avg')
      expect(avg.exists()).toBe(true)
      expect(avg.text()).toContain('78%')

      // Not the empty state.
      expect(wrapper.find('.no-attempts').exists()).toBe(false)
    })

    it('rounds the average grade', () => {
      const wrapper = mountCard({
        progress: { scenario_id: 'scn-1', total_count: 10, completed_count: 3, avg_grade: 86.4 },
      })
      expect(wrapper.find('.assignment-progress-avg').text()).toContain('86%')
    })

    it('omits the avg chip when avg_grade is null', () => {
      const wrapper = mountCard({
        progress: { scenario_id: 'scn-1', total_count: 10, completed_count: 4, avg_grade: null },
      })
      expect(wrapper.find('.progress-bar-fill').exists()).toBe(true)
      expect(wrapper.find('.assignment-progress-avg').exists()).toBe(false)
    })

    it('shows the "no attempts" line and no bar when progress is null', () => {
      const wrapper = mountCard({ progress: null })
      expect(wrapper.find('.no-attempts').exists()).toBe(true)
      expect(wrapper.find('.progress-bar-fill').exists()).toBe(false)
    })

    it('shows the "no attempts" line and no bar when total_count is 0', () => {
      const wrapper = mountCard({
        progress: { scenario_id: 'scn-1', total_count: 0, completed_count: 0, avg_grade: null },
      })
      expect(wrapper.find('.no-attempts').exists()).toBe(true)
      expect(wrapper.find('.progress-bar-fill').exists()).toBe(false)
    })
  })

  describe('primary view-results action', () => {
    it('renders a prominent primary button that emits view-results on click', async () => {
      const wrapper = mountCard()
      const primary = wrapper.find('.assignment-actions .btn-primary')
      expect(primary.exists()).toBe(true)

      await primary.trigger('click')
      expect(wrapper.emitted('view-results')).toBeTruthy()
      expect(wrapper.emitted('view-results')!.length).toBe(1)
    })
  })

  describe('overflow menu', () => {
    it('hides the secondary actions until the ⋯ is clicked', async () => {
      const wrapper = mountCard()
      // Closed initially: no dropdown menu rendered.
      expect(wrapper.find('.dropdown-menu').exists()).toBe(false)

      await openMenu(wrapper)
      expect(wrapper.find('.dropdown-menu').exists()).toBe(true)
      // Five secondary items.
      expect(wrapper.findAll('.dropdown-menu .dropdown-item').length).toBe(5)
    })

    it('emits each secondary action exactly once from its menu item', async () => {
      const wrapper = mountCard()
      await openMenu(wrapper)

      const items = wrapper.findAll('.dropdown-menu .dropdown-item')
      // Order in the menu: bulk-start, reset, export-json, export-archive, remove.
      await wrapper.find('[data-test="action-bulk-start"]').trigger('click')
      await openMenu(wrapper) // menu may close after a click; reopen for the next
      await wrapper.find('[data-test="action-reset"]').trigger('click')
      await openMenu(wrapper)
      await wrapper.find('[data-test="action-export-json"]').trigger('click')
      await openMenu(wrapper)
      await wrapper.find('[data-test="action-export-archive"]').trigger('click')
      await openMenu(wrapper)
      await wrapper.find('[data-test="action-remove"]').trigger('click')

      expect(wrapper.emitted('bulk-start')!.length).toBe(1)
      expect(wrapper.emitted('reset')!.length).toBe(1)
      expect(wrapper.emitted('export-json')!.length).toBe(1)
      expect(wrapper.emitted('export-archive')!.length).toBe(1)
      expect(wrapper.emitted('remove')!.length).toBe(1)
      // The fixture expects exactly 5 secondary items.
      expect(items.length).toBe(5)
    })

    it('shows the spinner and disables the start item while bulkStarting', async () => {
      const wrapper = mountCard({ bulkStarting: true })
      await openMenu(wrapper)
      const start = wrapper.find('[data-test="action-bulk-start"]')
      expect(start.attributes('disabled')).toBeDefined()
      expect(start.find('i.fa-spinner.fa-spin').exists()).toBe(true)
    })
  })

  describe('permissions', () => {
    it('renders no actions when canEditGroup is false', () => {
      const wrapper = mountCard({ canEditGroup: false })
      expect(wrapper.find('.assignment-actions').exists()).toBe(false)
      expect(wrapper.find('.btn-primary').exists()).toBe(false)
      expect(wrapper.find('.btn-icon').exists()).toBe(false)
    })
  })
})
