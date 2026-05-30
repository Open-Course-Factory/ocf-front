/**
 * Tests for AssignmentResultsView — the inline results PANEL extracted from
 * GroupScenariosTab.vue (commit c5 of #244).
 *
 * Presentational + rendered INLINE (NOT a modal — that's Branch 2; behavior
 * frozen). The composable owns state + polling; export/detail orchestration
 * stays in the parent. The view re-emits the panel's actions.
 *
 * Source markup (parent lines 1137–1241). Event set the panel actually has:
 *   - close          (← back button @click="closeResults")
 *   - export-all     (← header export, disabled when results.length === 0)
 *   - export-selected(← bulk bar, shown when selectedResults.size > 0)
 *   - export-single  (← per-row download, with the row)
 *   - view-detail    (← per-row "view details", with the row)
 *   - toggle-result  (← per-row checkbox, with the session_id)
 *   - toggle-select-all (← header checkbox + bulk "clear" button)
 *
 * Row fields rendered: student name/email, status chip, grade
 * (Math.round+'%' or notGraded), progress bar (completed_steps/total_steps),
 * hints (total_hints_used), startedAt/completedAt, actions.
 *
 * i18n note: empty test messages → assert on DOM structure, prop-driven data
 * and emits, not translated chrome.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

import AssignmentResultsView from '../../src/components/Groups/AssignmentResultsView.vue'

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
  is_active: true,
  scenario: { id: 'scn-1', name: 'intro', title: 'Intro to Linux', difficulty: 'beginner' },
}

function makeResult(overrides: Record<string, any> = {}) {
  return {
    session_id: 's1',
    user_id: 'u1',
    user_name: 'Alice',
    user_email: 'alice@example.com',
    status: 'completed',
    grade: 86.4,
    correct_count: 3,
    total_correct_possible: 4,
    current_step: 5,
    total_steps: 5,
    completed_steps: 5,
    total_hints_used: 2,
    started_at: '2026-05-10T10:00:00.000Z',
    completed_at: '2026-05-10T11:00:00.000Z',
    ...overrides,
  }
}

function mountView(props: Record<string, unknown> = {}) {
  return mount(AssignmentResultsView, {
    props: {
      assignment,
      results: [makeResult()],
      loading: false,
      selectedResults: new Set<string>(),
      ...props,
    },
    global: { plugins: [createTestI18n()] },
  })
}

describe('AssignmentResultsView', () => {
  it('renders one table row per result', () => {
    const wrapper = mountView({
      results: [makeResult({ session_id: 's1', user_name: 'Alice' }), makeResult({ session_id: 's2', user_name: 'Bob' })],
    })
    const rows = wrapper.findAll('.results-table tbody tr')
    expect(rows.length).toBe(2)
    expect(rows[0].text()).toContain('Alice')
    expect(rows[1].text()).toContain('Bob')
  })

  it('renders the row fields: email, grade %, progress and hints', () => {
    const wrapper = mountView({ results: [makeResult()] })
    const row = wrapper.find('.results-table tbody tr')
    expect(row.text()).toContain('alice@example.com')
    expect(row.text()).toContain('86%')        // Math.round(86.4)
    expect(row.find('.progress-text').text()).toBe('5/5')
    expect(row.text()).toContain('2')          // total_hints_used
  })

  it('shows the loading spinner and no table while loading', () => {
    const wrapper = mountView({ loading: true, results: [] })
    expect(wrapper.find('.loading-state').exists()).toBe(true)
    expect(wrapper.find('.results-table').exists()).toBe(false)
  })

  it('shows the empty state when there are no results and not loading', () => {
    const wrapper = mountView({ loading: false, results: [] })
    expect(wrapper.find('.empty-state').exists()).toBe(true)
    expect(wrapper.find('.results-table').exists()).toBe(false)
  })

  it('emits close when the back button is clicked', async () => {
    const wrapper = mountView()
    await wrapper.find('.results-header .btn-outline').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emits export-all from the header export button (disabled when there are no results)', async () => {
    // Enabled with results.
    const wrapper = mountView({ results: [makeResult()] })
    const exportBtn = wrapper.findAll('.results-header button').at(-1)!
    expect(exportBtn.attributes('disabled')).toBeUndefined()
    await exportBtn.trigger('click')
    expect(wrapper.emitted('export-all')).toBeTruthy()

    // Disabled with no results.
    const empty = mountView({ results: [] })
    const emptyExportBtn = empty.findAll('.results-header button').at(-1)!
    expect(emptyExportBtn.attributes('disabled')).toBeDefined()
  })

  it('emits view-detail with the row when "view details" is clicked', async () => {
    const r = makeResult({ session_id: 's-detail' })
    const wrapper = mountView({ results: [r] })
    // First action button in the row is "view details".
    await wrapper.find('.results-table tbody tr .actions-cell button').trigger('click')

    const emitted = wrapper.emitted('view-detail')
    expect(emitted).toBeTruthy()
    expect((emitted![0][0] as any).session_id).toBe('s-detail')
  })

  it('emits export-single with the row from the per-row download button', async () => {
    const r = makeResult({ session_id: 's-dl' })
    const wrapper = mountView({ results: [r] })
    const rowButtons = wrapper.findAll('.results-table tbody tr .actions-cell button')
    await rowButtons[1].trigger('click') // second action = export-single
    const emitted = wrapper.emitted('export-single')
    expect(emitted).toBeTruthy()
    expect((emitted![0][0] as any).session_id).toBe('s-dl')
  })

  it('emits toggle-result with the session id from a row checkbox', async () => {
    const wrapper = mountView({ results: [makeResult({ session_id: 'row-1' })] })
    await wrapper.find('.results-table tbody tr td.checkbox-col input[type="checkbox"]').setValue(true)
    const emitted = wrapper.emitted('toggle-result')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toBe('row-1')
  })

  it('emits toggle-select-all from the header checkbox', async () => {
    const wrapper = mountView({ results: [makeResult()] })
    await wrapper.find('.results-table thead .checkbox-col input[type="checkbox"]').setValue(true)
    expect(wrapper.emitted('toggle-select-all')).toBeTruthy()
  })

  it('shows the bulk-actions bar and emits export-selected when some rows are selected', async () => {
    const wrapper = mountView({
      results: [makeResult({ session_id: 's1' }), makeResult({ session_id: 's2' })],
      selectedResults: new Set(['s1']),
    })
    const bar = wrapper.find('.bulk-actions-bar')
    expect(bar.exists()).toBe(true)
    await bar.find('.btn-primary').trigger('click')
    expect(wrapper.emitted('export-selected')).toBeTruthy()
  })
})
