/**
 * Tests for useClassProgression — the derivations behind the exam view of a
 * class (#310): which assignment is watched, where each learner stands, how the
 * class spreads over the steps, and in which order rows are worth reading.
 *
 * Two invariants are load-bearing here and pinned below:
 *
 *   1. The distribution columns ADD UP to the class size. A learner who never
 *      opened the scenario gets their own column rather than being filed under
 *      step 1, so a teacher counting heads across the strip finds everybody.
 *   2. "Idle" is whatever the backend said. It is presence-plus-stale-progress
 *      (isLearnerIdle in ocf-core), never re-derived from timestamps here, and
 *      it is NOT the same state as being absent.
 */

import { describe, it, expect } from 'vitest'
import { ref } from 'vue'

import { useClassProgression } from '../../src/composables/useClassProgression'
import type {
  LearnerAssignmentProgress,
  LearnerLiveProgress
} from '../../src/services/domain/scenario/teacherService'

function assignment(overrides: Partial<LearnerAssignmentProgress> = {}): LearnerAssignmentProgress {
  return {
    assignment_id: 'a-1',
    scenario_id: 'sc-1',
    scenario_title: 'Docker — the basics',
    status: 'in_progress',
    current_step: 3,
    total_steps: 6,
    hints_used: 0,
    ...overrides
  }
}

function learner(overrides: Partial<LearnerLiveProgress> = {}): LearnerLiveProgress {
  return {
    user_id: 'u-1',
    user_name: 'Léa Simon',
    connected: true,
    idle: false,
    assignments: [assignment()],
    ...overrides
  }
}

function names(rows: { displayName: string }[]) {
  return rows.map(r => r.displayName)
}

describe('useClassProgression — the class roster', () => {
  it('gives every member a row, naming them by whatever identity arrived', () => {
    const learners = ref([
      learner({ user_id: 'u-1', user_name: 'Léa Simon' }),
      learner({ user_id: 'u-2', user_name: undefined, user_email: 'karim@example.org' }),
      learner({ user_id: 'u-3', user_name: undefined, user_email: undefined })
    ])

    const { rows } = useClassProgression(learners)

    expect(names(rows.value)).toEqual(['Léa Simon', 'karim@example.org', 'u-3'])
  })

  it('counts the learners who are connected', () => {
    const learners = ref([
      learner({ user_id: 'u-1', connected: true }),
      learner({ user_id: 'u-2', connected: false }),
      learner({ user_id: 'u-3', connected: true })
    ])

    const { connectedCount } = useClassProgression(learners)

    expect(connectedCount.value).toBe(2)
  })

  it('leaves a learner with no assignment entry on a presence-only row', () => {
    const learners = ref([learner({ assignments: [] })])

    const { rows, totalSteps, distribution } = useClassProgression(learners)

    expect(rows.value[0].assignment).toBeNull()
    expect(rows.value[0].connected).toBe(true)
    expect(totalSteps.value).toBe(0)
    expect(distribution.value).toEqual([])
  })
})

describe('useClassProgression — which assignment is watched', () => {
  const learners = ref([
    learner({
      assignments: [
        assignment({ assignment_id: 'a-1', scenario_title: 'Docker' }),
        assignment({ assignment_id: 'a-2', scenario_title: 'Linux', total_steps: 4 })
      ]
    })
  ])

  it('watches the first assignment until the teacher picks another', () => {
    const { selectedAssignment, requestedAssignmentId } = useClassProgression(learners)

    expect(selectedAssignment.value?.scenarioTitle).toBe('Docker')

    requestedAssignmentId.value = 'a-2'
    expect(selectedAssignment.value?.scenarioTitle).toBe('Linux')
  })

  it('falls back to an assignment that still exists when the watched one ends', () => {
    const rows = ref([learner()])
    const { requestedAssignmentId, selectedAssignment } = useClassProgression(rows)

    requestedAssignmentId.value = 'a-removed'

    // A poll that no longer lists the requested assignment must still show a
    // class rather than blank the view.
    expect(selectedAssignment.value?.assignmentId).toBe('a-1')
  })
})

describe('useClassProgression — step distribution', () => {
  it('spreads the class over the steps, with finished in its own column', () => {
    const learners = ref([
      learner({ user_id: 'u-1', assignments: [assignment({ current_step: 3 })] }),
      learner({ user_id: 'u-2', assignments: [assignment({ current_step: 4 })] }),
      learner({ user_id: 'u-3', assignments: [assignment({ current_step: 4 })] }),
      learner({ user_id: 'u-4', assignments: [assignment({ status: 'completed', current_step: 6 })] })
    ])

    const { distribution } = useClassProgression(learners)

    expect(distribution.value.map(b => [b.key, b.count])).toEqual([
      ['step-1', 0],
      ['step-2', 0],
      ['step-3', 1],
      ['step-4', 2],
      ['step-5', 0],
      ['step-6', 0],
      ['done', 1]
    ])
  })

  it('gives learners who never opened the scenario their own column', () => {
    const learners = ref([
      learner({ user_id: 'u-1', assignments: [assignment({ status: 'not_started', current_step: 0 })] }),
      learner({ user_id: 'u-2', assignments: [assignment({ current_step: 2 })] })
    ])

    const { distribution } = useClassProgression(learners)

    expect(distribution.value[0]).toMatchObject({ kind: 'not_started', count: 1 })
    // Everybody is somewhere: the columns account for the whole class.
    expect(distribution.value.reduce((sum, b) => sum + b.count, 0)).toBe(2)
  })

  it('omits the not-started column when everybody has started', () => {
    const learners = ref([learner({ assignments: [assignment({ current_step: 2 })] })])

    const { distribution } = useClassProgression(learners)

    expect(distribution.value.some(b => b.kind === 'not_started')).toBe(false)
  })

  it('names a step column after the step the learners on it are doing', () => {
    const learners = ref([
      learner({ assignments: [assignment({ current_step: 3, current_step_title: 'Containers' })] })
    ])

    const { distribution } = useClassProgression(learners)

    expect(distribution.value.find(b => b.key === 'step-3')?.title).toBe('Containers')
  })

  it('draws no strip for a scenario that declares no step', () => {
    const learners = ref([learner({ assignments: [assignment({ total_steps: 0, current_step: 0 })] })])

    const { distribution, totalSteps } = useClassProgression(learners)

    expect(totalSteps.value).toBe(0)
    expect(distribution.value).toEqual([])
  })
})

describe('useClassProgression — attention', () => {
  it('flags a learner the backend reported idle', () => {
    const learners = ref([learner({ idle: true })])

    const { rows } = useClassProgression(learners)

    expect(rows.value[0].needsAttention).toBe(true)
  })

  it('flags a learner who dropped off an attempt that is still open', () => {
    const learners = ref([learner({ connected: false, idle: false })])

    const { rows } = useClassProgression(learners)

    expect(rows.value[0].needsAttention).toBe(true)
    // Absent is not idle: the backend never marks a disconnected learner idle,
    // and the row must keep the two distinguishable.
    expect(rows.value[0].idle).toBe(false)
  })

  it('leaves an absent learner who never started, or who finished, unflagged', () => {
    const learners = ref([
      learner({ user_id: 'u-1', connected: false, assignments: [assignment({ status: 'not_started' })] }),
      learner({ user_id: 'u-2', connected: false, assignments: [assignment({ status: 'completed' })] })
    ])

    const { rows } = useClassProgression(learners)

    expect(rows.value.map(r => r.needsAttention)).toEqual([false, false])
  })
})

describe('useClassProgression — row order', () => {
  const learners = ref([
    learner({ user_id: 'u-1', user_name: 'Karim', assignments: [assignment({ current_step: 4, hints_used: 1 })] }),
    learner({ user_id: 'u-2', user_name: 'Nadia', assignments: [assignment({ status: 'completed', hints_used: 0 })] }),
    learner({ user_id: 'u-3', user_name: 'Léa', assignments: [assignment({ current_step: 2, hints_used: 3 })] }),
    learner({
      user_id: 'u-4',
      user_name: 'Jean',
      connected: false,
      assignments: [assignment({ status: 'not_started', current_step: 0, hints_used: 0 })]
    })
  ])

  it('puts the least advanced learners first by default', () => {
    const { sortedRows, sort } = useClassProgression(learners)

    expect(sort.value).toBe('step')
    expect(names(sortedRows.value)).toEqual(['Jean', 'Léa', 'Karim', 'Nadia'])
  })

  it('puts the biggest hint consumers first when sorting by hints', () => {
    const { sortedRows, sort } = useClassProgression(learners)
    sort.value = 'hints'

    expect(names(sortedRows.value).slice(0, 2)).toEqual(['Léa', 'Karim'])
  })

  it('brings the learners to look at to the top when sorting by inactivity', () => {
    const roster = ref([
      learner({ user_id: 'u-1', user_name: 'Karim', assignments: [assignment({ current_step: 1 })] }),
      learner({ user_id: 'u-2', user_name: 'Nadia', idle: true, assignments: [assignment({ current_step: 5 })] })
    ])
    const { sortedRows, sort } = useClassProgression(roster)
    sort.value = 'attention'

    expect(names(sortedRows.value)).toEqual(['Nadia', 'Karim'])
  })

  it('keeps equal rows in a stable order, so a refresh does not reshuffle them', () => {
    const roster = ref([
      learner({ user_id: 'u-1', user_name: 'Zoé', assignments: [assignment({ current_step: 2 })] }),
      learner({ user_id: 'u-2', user_name: 'Adam', assignments: [assignment({ current_step: 2 })] })
    ])
    const { sortedRows } = useClassProgression(roster)

    expect(names(sortedRows.value)).toEqual(['Adam', 'Zoé'])

    // Same values, opposite arrival order — the table must not move.
    roster.value = [roster.value[1], roster.value[0]] as typeof roster.value
    expect(names(sortedRows.value)).toEqual(['Adam', 'Zoé'])
  })
})
