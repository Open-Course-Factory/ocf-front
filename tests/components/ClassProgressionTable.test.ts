/**
 * Tests for ClassProgressionTable — the per-learner rows of the exam view
 * (#310), as the invigilating teacher meets them.
 *
 * What the row has to say, without the teacher clicking anything: is this
 * learner here, where are they in the scenario, how long have they been stuck
 * there, how many hints did it cost, and can I look at their terminal.
 *
 * i18n note: the test i18n bundle is empty, so assertions are on structure,
 * classes and prop-driven data (names, counts, segments) rather than on
 * translated chrome.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

import ClassProgressionTable from '../../src/components/Groups/ClassProgressionTable.vue'
import type { ClassProgressionRow } from '../../src/composables/useClassProgression'
import type { LearnerAssignmentProgress } from '../../src/services/domain/scenario/teacherService'

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

function assignment(overrides: Partial<LearnerAssignmentProgress> = {}): LearnerAssignmentProgress {
  return {
    assignment_id: 'a-1',
    scenario_id: 'sc-1',
    scenario_title: 'Docker — the basics',
    status: 'in_progress',
    current_step: 3,
    total_steps: 6,
    hints_used: 0,
    current_step_elapsed_seconds: 360,
    ...overrides
  }
}

function row(overrides: Partial<ClassProgressionRow> = {}): ClassProgressionRow {
  return {
    userId: 'u-1',
    displayName: 'Léa Simon',
    connected: true,
    idle: false,
    terminalSessionId: 'sess-1',
    assignment: assignment(),
    needsAttention: false,
    ...overrides
  }
}

function mountTable(rows: ClassProgressionRow[], props: Record<string, unknown> = {}) {
  return mount(ClassProgressionTable, {
    props: { rows, totalSteps: 6, hasAssignment: true, ...props },
    global: { plugins: [createTestI18n()] }
  })
}

/** Data rows only — the header carries the same role. */
function dataRows(wrapper: ReturnType<typeof mountTable>) {
  return wrapper.findAll('[role="row"]').filter(r => !r.classes('ocf-prog-head'))
}

describe('ClassProgressionTable — the roster', () => {
  it('renders one row per learner, named', () => {
    const wrapper = mountTable([
      row({ userId: 'u-1', displayName: 'Léa Simon' }),
      row({ userId: 'u-2', displayName: 'Karim Benali' })
    ])

    expect(dataRows(wrapper)).toHaveLength(2)
    expect(wrapper.findAll('.ocf-prog-name').map(n => n.text())).toEqual([
      'Léa Simon',
      'Karim Benali'
    ])
  })

  it('exposes itself as a table to assistive technology', () => {
    const wrapper = mountTable([row()])

    expect(wrapper.attributes('role')).toBe('table')
    expect(wrapper.attributes('aria-label')).toBeTruthy()
    expect(wrapper.findAll('[role="columnheader"]').length).toBeGreaterThan(0)
    expect(dataRows(wrapper)[0].findAll('[role="cell"]').length).toBeGreaterThan(0)
  })
})

describe('ClassProgressionTable — presence, which is not progress', () => {
  it('marks a connected learner differently from an absent one', () => {
    const wrapper = mountTable([
      row({ userId: 'u-1', connected: true }),
      row({ userId: 'u-2', connected: false, terminalSessionId: undefined })
    ])

    const dots = wrapper.findAll('.ocf-prog-dot')
    expect(dots[0].classes()).toContain('ocf-prog-dot-online')
    expect(dots[1].classes()).toContain('ocf-prog-dot-offline')
  })

  it('flags an idle learner without claiming they are gone', () => {
    const wrapper = mountTable([row({ idle: true, needsAttention: true })])

    const [line] = dataRows(wrapper)
    expect(line.classes()).toContain('ocf-prog-attention')
    // Idle means present-but-not-progressing: the dot still says connected.
    expect(line.find('.ocf-prog-dot').classes()).toContain('ocf-prog-dot-online')
    expect(line.find('.ocf-prog-time').classes()).toContain('ocf-prog-time-warn')
  })

  it('flags a learner who vanished mid-attempt, and does not call them idle', () => {
    const wrapper = mountTable([
      row({ connected: false, idle: false, needsAttention: true, terminalSessionId: undefined })
    ])

    const [line] = dataRows(wrapper)
    expect(line.classes()).toContain('ocf-prog-attention')
    expect(line.find('.ocf-prog-dot').classes()).toContain('ocf-prog-dot-offline')
    // The amber time reading belongs to idleness only.
    expect(line.find('.ocf-prog-time').classes()).not.toContain('ocf-prog-time-warn')
  })

  it('leaves a learner in the rhythm unflagged', () => {
    const wrapper = mountTable([row()])

    expect(dataRows(wrapper)[0].classes()).not.toContain('ocf-prog-attention')
  })
})

describe('ClassProgressionTable — position in the scenario', () => {
  it('fills the track up to the step the learner is on', () => {
    const wrapper = mountTable([row({ assignment: assignment({ current_step: 3 }) })])

    const segments = wrapper.findAll('.ocf-prog-seg')
    expect(segments).toHaveLength(6)
    expect(segments.slice(0, 2).every(s => s.classes().includes('ocf-seg-fill'))).toBe(true)
    expect(segments[2].classes()).toContain('ocf-seg-current')
    expect(segments.slice(3).every(s => s.classes().length === 1)).toBe(true)
  })

  it('shows a finished learner as done, with their grade', () => {
    const wrapper = mountTable([
      row({
        assignment: assignment({
          status: 'completed',
          grade: 91.4,
          started_at: '2026-08-04T09:00:00.000Z',
          completed_at: '2026-08-04T09:52:00.000Z'
        })
      })
    ])

    const [line] = dataRows(wrapper)
    expect(line.classes()).toContain('ocf-prog-done')
    expect(line.find('.ocf-prog-position-label').text()).toContain('91')
    expect(line.findAll('.ocf-seg-fill')).toHaveLength(6)
    // Time on a finished attempt is how long the whole run took.
    expect(line.find('.ocf-prog-time').text()).toBe('52m')
  })

  it('leaves the track empty for a learner who never opened the scenario', () => {
    const wrapper = mountTable([
      row({ assignment: assignment({ status: 'not_started', current_step: 0, current_step_elapsed_seconds: undefined }) })
    ])

    expect(wrapper.findAll('.ocf-seg-fill')).toHaveLength(0)
    expect(wrapper.findAll('.ocf-seg-current')).toHaveLength(0)
    expect(wrapper.find('.ocf-prog-time').text()).toBe('—')
  })

  it('draws no track for a scenario with no step, instead of an empty box', () => {
    const wrapper = mountTable(
      [row({ assignment: assignment({ total_steps: 0, current_step: 0 }) })],
      { totalSteps: 0 }
    )

    expect(wrapper.find('.ocf-prog-track').exists()).toBe(false)
    expect(dataRows(wrapper)).toHaveLength(1)
  })

  it('lists a learner on presence alone when the class has no assignment', () => {
    const wrapper = mountTable([row({ assignment: null })], { totalSteps: 0, hasAssignment: false })

    expect(dataRows(wrapper)).toHaveLength(1)
    expect(wrapper.find('.ocf-prog-name').text()).toBe('Léa Simon')
    expect(wrapper.find('.ocf-prog-track').exists()).toBe(false)
  })

  it('says an attempt was abandoned rather than passing it off as in progress', () => {
    const wrapper = mountTable([
      row({ assignment: assignment({ status: 'in_progress', session_status: 'abandoned' }) })
    ])

    expect(wrapper.find('.ocf-prog-session-note').exists()).toBe(true)
  })

  it('adds no annotation to an attempt that is simply running', () => {
    const wrapper = mountTable([
      row({ assignment: assignment({ session_status: 'active' }) })
    ])

    expect(wrapper.find('.ocf-prog-session-note').exists()).toBe(false)
  })
})

describe('ClassProgressionTable — hints and actions', () => {
  it('highlights spent hints and keeps a quiet dash at zero', () => {
    const wrapper = mountTable([
      row({ userId: 'u-1', assignment: assignment({ hints_used: 2 }) }),
      row({ userId: 'u-2', assignment: assignment({ hints_used: 0 }) })
    ])

    const badges = wrapper.findAll('.ocf-prog-hints')
    expect(badges[0].classes()).toContain('ocf-prog-hints-warn')
    expect(badges[0].text()).toContain('2')
    expect(badges[1].classes()).toContain('ocf-prog-hints-zero')
    expect(badges[1].text()).toBe('—')
  })

  it('asks to watch the learner’s terminal by session', async () => {
    const wrapper = mountTable([row({ terminalSessionId: 'sess-42' })])

    await wrapper.find('.ocf-prog-icon-btn').trigger('click')

    expect(wrapper.emitted('watch-terminal')).toEqual([['sess-42']])
  })

  it('offers no terminal to watch when the learner has none live', () => {
    const wrapper = mountTable([row({ connected: false, terminalSessionId: undefined })])

    const button = wrapper.find('.ocf-prog-icon-btn')
    // Present but disabled: the actions column keeps its width whoever is in it.
    expect(button.exists()).toBe(true)
    expect(button.attributes('disabled')).toBeDefined()
  })
})
