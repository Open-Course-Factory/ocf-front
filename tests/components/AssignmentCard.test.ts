/**
 * Tests for AssignmentCard — the redesigned (Branch 2) presentational
 * assignment row for GroupScenariosTab (#244 results-discoverability UX),
 * REWRITTEN to CONSUME the design system instead of hand-rolling primitives.
 *
 * DS pieces the card now uses (all real children — NOT stubbed):
 *   - root chrome: `.card` (DS) + a thin local layout class.
 *   - difficulty + status: DS `.badge` (status = `.badge.badge-success` when
 *     active, `.badge.badge-secondary` when inactive). Replaces the old
 *     `.status-chip.status-active/-inactive`.
 *   - progress: <ProgressBar :value :max :variant> → renders `.progress >
 *     .progress-bar` with the fill width. The card still renders the `12/20`
 *     count + `avg 78%` text alongside.
 *   - no-attempts: a DS `.text-muted` line (replaces `.no-attempts`).
 *   - primary action: `.btn.btn-primary` "View results" → emits `view-results`.
 *   - overflow: <DropdownMenu> (default trigger `.btn-icon`) → `.dropdown-menu`
 *     of `.dropdown-item` buttons carrying the same `data-test` attrs.
 *
 * i18n note: empty test messages → assert on DOM structure, prop-driven data
 * (title, dates, progress numbers) and emits, not translated chrome. Status is
 * asserted by badge variant class, not text.
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
    // ProgressBar + DropdownMenu are real DS children (not stubbed) so we
    // exercise the actual rendered bar fill and the real open/close behavior.
    global: { plugins: [createTestI18n()] },
  })
}

// The secondary actions live behind the ⋯ overflow (DropdownMenu's default
// trigger is a .btn-icon). Open it before reaching the items.
async function openMenu(wrapper: ReturnType<typeof mountCard>) {
  await wrapper.find('.btn-icon').trigger('click')
}

describe('AssignmentCard', () => {
  describe('info block', () => {
    it('uses the DS card chrome and renders the title, a difficulty badge, the status badge and dates', () => {
      const wrapper = mountCard()
      // DS card container.
      expect(wrapper.find('.card').exists()).toBe(true)

      expect(wrapper.text()).toContain('Intro to Linux')
      // Difficulty is a DS badge.
      expect(wrapper.find('.badge').exists()).toBe(true)
      // Active assignment → success-variant status badge.
      expect(wrapper.find('.badge.badge-success').exists()).toBe(true)

      // Both dates rendered (formatDate of the ISO start/deadline).
      expect(wrapper.find('.start-date-text').exists()).toBe(true)
      expect(wrapper.find('.deadline-text').exists()).toBe(true)
    })

    it('shows the secondary-variant status badge when the assignment is not active', () => {
      const wrapper = mountCard({ assignment: { ...assignment, is_active: false } })
      expect(wrapper.find('.badge.badge-secondary').exists()).toBe(true)
      expect(wrapper.find('.badge.badge-success').exists()).toBe(false)
    })

    it('shows the org badge for an org-sourced scenario', () => {
      const wrapper = mountCard()
      expect(wrapper.find('.org-badge').exists()).toBe(true)
    })
  })

  describe('progress section', () => {
    it('renders the DS ProgressBar at the right fill, plus the x/y text and the avg chip', () => {
      const wrapper = mountCard({
        progress: { scenario_id: 'scn-1', total_count: 20, completed_count: 12, avg_grade: 78 },
      })

      // DS ProgressBar renders `.progress > .progress-bar` with the fill width.
      const fill = wrapper.find('.progress .progress-bar')
      expect(fill.exists()).toBe(true)
      // 12/20 = 60%.
      expect(fill.attributes('style') || '').toMatch(/width:\s*60%/)

      expect(wrapper.find('.assignment-progress-text').text()).toContain('12/20')

      const avg = wrapper.find('.assignment-progress-avg')
      expect(avg.exists()).toBe(true)
      expect(avg.text()).toContain('78%')

      // Not the empty state.
      expect(wrapper.find('.text-muted').exists()).toBe(false)
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
      expect(wrapper.find('.progress .progress-bar').exists()).toBe(true)
      expect(wrapper.find('.assignment-progress-avg').exists()).toBe(false)
    })

    it('shows the muted "no attempts" line and no bar when progress is null', () => {
      const wrapper = mountCard({ progress: null })
      expect(wrapper.find('.text-muted').exists()).toBe(true)
      // No DS ProgressBar rendered.
      expect(wrapper.find('.progress .progress-bar').exists()).toBe(false)
    })

    it('shows the muted "no attempts" line and no bar when total_count is 0', () => {
      const wrapper = mountCard({
        progress: { scenario_id: 'scn-1', total_count: 0, completed_count: 0, avg_grade: null },
      })
      expect(wrapper.find('.text-muted').exists()).toBe(true)
      expect(wrapper.find('.progress .progress-bar').exists()).toBe(false)
    })
  })

  describe('primary view-results action', () => {
    it('renders a prominent primary button that emits view-results on click', async () => {
      const wrapper = mountCard()
      const primary = wrapper.find('.btn.btn-primary')
      expect(primary.exists()).toBe(true)

      await primary.trigger('click')
      expect(wrapper.emitted('view-results')).toBeTruthy()
      expect(wrapper.emitted('view-results')!.length).toBe(1)
    })
  })

  describe('overflow menu (DropdownMenu)', () => {
    it('hides the secondary actions until the ⋯ trigger is clicked', async () => {
      const wrapper = mountCard()
      // Closed initially: DropdownMenu renders no menu yet.
      expect(wrapper.find('.dropdown-menu').exists()).toBe(false)

      await openMenu(wrapper)
      expect(wrapper.find('.dropdown-menu').exists()).toBe(true)
      // Five secondary items.
      expect(wrapper.findAll('.dropdown-menu .dropdown-item').length).toBe(5)
    })

    it('emits each secondary action exactly once from its menu item', async () => {
      const wrapper = mountCard()
      await openMenu(wrapper)

      // DropdownMenu auto-closes on item click, so re-open before each next item.
      await wrapper.find('[data-test="action-bulk-start"]').trigger('click')
      await openMenu(wrapper)
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
      expect(wrapper.find('.btn-primary').exists()).toBe(false)
      expect(wrapper.find('.btn-icon').exists()).toBe(false)
    })
  })
})
