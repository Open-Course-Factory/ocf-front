/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.

 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

/**
 * Derivations behind the "Progression" view of a class (issue #310): which
 * assignment is being watched, where each learner stands on it, how the class
 * spreads across the steps, and in which order the rows are worth reading.
 *
 * Everything here is a pure function of the rows the endpoint returned. In
 * particular the attention signal reuses the backend's `idle` flag rather than
 * comparing timestamps locally: "no scenario progress for too long" has a single
 * definition (isLearnerIdle in ocf-core teacherLiveProgressService.go), shared
 * with the "N inactifs" badge on the classes console.
 */

import { computed, ref, type Ref } from 'vue'
import type {
  LearnerAssignmentProgress,
  LearnerLiveProgress
} from '../services/domain/scenario/teacherService'

/**
 * Row orders the teacher can ask for. `step` is the default and sorts
 * ASCENDING: the least advanced learners are the ones an invigilator walks over
 * to, so they belong at the top of the list.
 */
export type ClassProgressionSort = 'step' | 'hints' | 'attention'

/** One assignment the class can be watched on. */
export interface ClassAssignmentOption {
  assignmentId: string
  scenarioTitle: string
  deadline?: string
  totalSteps: number
}

/** One learner's line in the progression table. */
export interface ClassProgressionRow {
  userId: string
  displayName: string
  connected: boolean
  idle: boolean
  terminalSessionId?: string
  /** Null when the class has no assignment at all — the row is presence-only. */
  assignment: LearnerAssignmentProgress | null
  /**
   * Amber-flagged: either idle (present but not progressing) or gone missing
   * from an attempt that is still open. Both are things to look at now; a
   * learner who simply has not started is not one of them.
   */
  needsAttention: boolean
}

/** One column of the step-distribution strip. */
export interface ClassStepBucket {
  key: string
  kind: 'not_started' | 'step' | 'done'
  /** 1-based step number, for `kind === 'step'` only. */
  step?: number
  /**
   * The step's title, known only for steps somebody is currently on: the
   * endpoint names a learner's current step, not the whole scenario outline.
   */
  title?: string
  count: number
}

function displayNameFor(learner: LearnerLiveProgress): string {
  return learner.user_name || learner.user_email || learner.user_id
}

function assignmentOf(
  learner: LearnerLiveProgress,
  assignmentId: string | null
): LearnerAssignmentProgress | null {
  if (!assignmentId) return null
  return learner.assignments.find(a => a.assignment_id === assignmentId) ?? null
}

/**
 * Where a learner sits on the progression axis, as a single comparable number:
 * before the first step (never opened), on step N, or past the last one (done).
 * Used both to sort rows and to pick the distribution column.
 */
function progressRank(assignment: LearnerAssignmentProgress | null, totalSteps: number): number {
  if (!assignment || assignment.status === 'not_started') return -1
  if (assignment.status === 'completed') return totalSteps + 1
  // An attempt that exists but has not reached step 1 yet still reads as "on
  // the first step" rather than as never opened.
  return Math.min(Math.max(assignment.current_step, 1), Math.max(totalSteps, 1))
}

export function useClassProgression(learners: Ref<LearnerLiveProgress[]>) {
  /**
   * The assignment the teacher picked. Held as a request rather than as the
   * answer: the poll refreshes the assignment list every 30s, and an assignment
   * that disappears must fall back to a valid one instead of blanking the view.
   */
  const requestedAssignmentId = ref<string | null>(null)
  const sort = ref<ClassProgressionSort>('step')

  // Assignments are identical on every row, so the first learner carrying any
  // describes the whole class.
  const assignments = computed<ClassAssignmentOption[]>(() => {
    const byId = new Map<string, ClassAssignmentOption>()
    for (const learner of learners.value) {
      for (const assignment of learner.assignments) {
        const known = byId.get(assignment.assignment_id)
        if (known) {
          // Guard against a row reporting an empty scenario: the class's step
          // count is the largest anybody was told about.
          known.totalSteps = Math.max(known.totalSteps, assignment.total_steps)
          continue
        }
        byId.set(assignment.assignment_id, {
          assignmentId: assignment.assignment_id,
          scenarioTitle: assignment.scenario_title,
          deadline: assignment.deadline,
          totalSteps: assignment.total_steps
        })
      }
    }
    return Array.from(byId.values())
  })

  const selectedAssignment = computed<ClassAssignmentOption | null>(() =>
    assignments.value.find(a => a.assignmentId === requestedAssignmentId.value)
      ?? assignments.value[0]
      ?? null
  )

  const totalSteps = computed(() => selectedAssignment.value?.totalSteps ?? 0)

  const rows = computed<ClassProgressionRow[]>(() =>
    learners.value.map(learner => {
      const assignment = assignmentOf(learner, selectedAssignment.value?.assignmentId ?? null)
      return {
        userId: learner.user_id,
        displayName: displayNameFor(learner),
        connected: learner.connected,
        idle: learner.idle,
        terminalSessionId: learner.terminal_session_id,
        assignment,
        needsAttention: learner.idle || (!learner.connected && assignment?.status === 'in_progress')
      }
    })
  )

  /**
   * Rows in the asked-for order. Every comparison ends on the display name so
   * the table cannot reshuffle between two polls that returned equal values.
   */
  const sortedRows = computed<ClassProgressionRow[]>(() => {
    const byName = (a: ClassProgressionRow, b: ClassProgressionRow) =>
      a.displayName.localeCompare(b.displayName)
    const byProgress = (a: ClassProgressionRow, b: ClassProgressionRow) =>
      progressRank(a.assignment, totalSteps.value) - progressRank(b.assignment, totalSteps.value)

    const compare: Record<ClassProgressionSort, (a: ClassProgressionRow, b: ClassProgressionRow) => number> = {
      step: (a, b) => byProgress(a, b) || byName(a, b),
      hints: (a, b) => (b.assignment?.hints_used ?? 0) - (a.assignment?.hints_used ?? 0) || byName(a, b),
      attention: (a, b) =>
        Number(b.needsAttention) - Number(a.needsAttention) || byProgress(a, b) || byName(a, b)
    }
    return [...rows.value].sort(compare[sort.value])
  })

  /**
   * How the class spreads over the steps of the selected assignment: one column
   * per step, a trailing "finished" column, and a leading "not started" column
   * only when somebody is in it — so the columns always add up to the class
   * size and nobody is quietly filed under step 1.
   *
   * Empty when the scenario declares no step: there is no axis to spread over.
   */
  const distribution = computed<ClassStepBucket[]>(() => {
    if (!selectedAssignment.value || totalSteps.value <= 0) return []

    const titleByStep = new Map<number, string>()
    let notStarted = 0
    let done = 0
    const perStep = new Array<number>(totalSteps.value).fill(0)

    for (const row of rows.value) {
      const rank = progressRank(row.assignment, totalSteps.value)
      if (rank < 0) {
        notStarted++
      } else if (rank > totalSteps.value) {
        done++
      } else {
        perStep[rank - 1]++
        if (row.assignment?.current_step_title && !titleByStep.has(rank)) {
          titleByStep.set(rank, row.assignment.current_step_title)
        }
      }
    }

    const buckets: ClassStepBucket[] = []
    if (notStarted > 0) {
      buckets.push({ key: 'not-started', kind: 'not_started', count: notStarted })
    }
    for (let step = 1; step <= totalSteps.value; step++) {
      buckets.push({
        key: `step-${step}`,
        kind: 'step',
        step,
        title: titleByStep.get(step),
        count: perStep[step - 1]
      })
    }
    buckets.push({ key: 'done', kind: 'done', count: done })
    return buckets
  })

  const connectedCount = computed(() => learners.value.filter(l => l.connected).length)

  return {
    requestedAssignmentId,
    sort,
    assignments,
    selectedAssignment,
    totalSteps,
    rows,
    sortedRows,
    distribution,
    connectedCount
  }
}
