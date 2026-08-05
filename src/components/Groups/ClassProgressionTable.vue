<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
-->

<script setup lang="ts">
/**
 * One line per learner, joining what the two former tabs showed separately:
 * presence, position in the scenario, time on the current step, hints spent —
 * and the way through to that learner's terminal.
 *
 * Attention is encoded in the shape of the row (amber left edge and tint), not
 * in colour alone: the dot, the track label and the hint badge all say in text
 * what the tint hints at.
 */
import { computed } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { formatCompactDuration } from '../../utils/quotaFormatters'
import type { ClassProgressionRow } from '../../composables/useClassProgression'
import type { LearnerAssignmentProgress } from '../../services/domain/scenario/teacherService'

const props = defineProps<{
  rows: ClassProgressionRow[]
  totalSteps: number
  /** False when the class has no active assignment: the table is presence-only. */
  hasAssignment: boolean
}>()

const emit = defineEmits<{
  (event: 'watch-terminal', sessionId: string): void
}>()

const { t } = useTranslations({
  en: {
    classProgressionTable: {
      label: 'Progress by learner',
      columnPresence: 'Presence',
      columnLearner: 'Learner',
      columnPosition: 'Position in the scenario',
      columnOnStep: 'On the step',
      columnHints: 'Hints',
      columnActions: 'Actions',
      connected: 'Connected',
      disconnected: 'Disconnected',
      idleHint: 'No progress in the scenario for a while — this tracks scenario steps, not typing',
      notStarted: 'Not started',
      finished: '✓ Finished',
      finishedGraded: '✓ Finished · {grade}%',
      stepShort: 'S{step}',
      stepTitled: 'S{step} · {title}',
      stepPositionLabel: 'Step {step} of {total}',
      finishedLabel: 'Scenario finished',
      noSteps: 'No step',
      noHints: '—',
      hintCountOne: '{count} hint',
      hintCountMany: '{count} hints',
      watchTerminal: 'Watch this learner’s terminal',
      watchUnavailable: 'No live terminal to watch',
      sessionAbandoned: 'attempt abandoned',
      sessionSetupFailed: 'environment setup failed',
      sessionRaw: 'session: {status}'
    }
  },
  fr: {
    classProgressionTable: {
      label: 'Progression par apprenant',
      columnPresence: 'Présence',
      columnLearner: 'Apprenant',
      columnPosition: 'Position dans le scénario',
      columnOnStep: 'Sur l’étape',
      columnHints: 'Indices',
      columnActions: 'Actions',
      connected: 'Connecté',
      disconnected: 'Déconnecté',
      idleHint: 'Aucune progression dans le scénario depuis un moment — on suit les étapes du scénario, pas la frappe',
      notStarted: 'Non commencé',
      finished: '✓ Terminé',
      finishedGraded: '✓ Terminé · {grade} %',
      stepShort: 'É{step}',
      stepTitled: 'É{step} · {title}',
      stepPositionLabel: 'Étape {step} sur {total}',
      finishedLabel: 'Scénario terminé',
      noSteps: 'Aucune étape',
      noHints: '—',
      hintCountOne: '{count} indice',
      hintCountMany: '{count} indices',
      watchTerminal: 'Voir son terminal',
      watchUnavailable: 'Aucun terminal en direct à observer',
      sessionAbandoned: 'tentative abandonnée',
      sessionSetupFailed: 'échec de préparation de l’environnement',
      sessionRaw: 'session : {status}'
    }
  }
})

/** Segment indices, so the track can be drawn without an index-arithmetic loop. */
const segments = computed(() => Array.from({ length: props.totalSteps }, (_, i) => i + 1))

function segmentClass(assignment: LearnerAssignmentProgress | null, segment: number): string {
  if (!assignment || assignment.status === 'not_started') return ''
  if (assignment.status === 'completed') return 'ocf-seg-fill'
  if (segment < assignment.current_step) return 'ocf-seg-fill'
  return segment === assignment.current_step ? 'ocf-seg-current' : ''
}

function positionLabel(assignment: LearnerAssignmentProgress | null): string {
  if (!assignment || assignment.status === 'not_started') return t('classProgressionTable.notStarted')
  if (assignment.status === 'completed') {
    return assignment.grade == null
      ? t('classProgressionTable.finished')
      : t('classProgressionTable.finishedGraded', { grade: Math.round(assignment.grade) })
  }
  return assignment.current_step_title
    ? t('classProgressionTable.stepTitled', {
        step: assignment.current_step,
        title: assignment.current_step_title
      })
    : t('classProgressionTable.stepShort', { step: assignment.current_step })
}

function positionAriaLabel(assignment: LearnerAssignmentProgress | null): string {
  if (!assignment || assignment.status === 'not_started') return t('classProgressionTable.notStarted')
  if (assignment.status === 'completed') return t('classProgressionTable.finishedLabel')
  return t('classProgressionTable.stepPositionLabel', {
    step: assignment.current_step,
    total: props.totalSteps
  })
}

/**
 * The raw session status, shown only when it says something the three-value
 * standing cannot: an abandoned or failed attempt still reads as "in progress"
 * on its own, which would mislead an invigilator.
 */
const PLAIN_SESSION_STATUSES = ['active', 'provisioning', 'completed']

function sessionAnnotation(assignment: LearnerAssignmentProgress | null): string {
  const raw = assignment?.session_status
  if (!raw || PLAIN_SESSION_STATUSES.includes(raw)) return ''
  if (raw === 'abandoned') return t('classProgressionTable.sessionAbandoned')
  if (raw === 'setup_failed') return t('classProgressionTable.sessionSetupFailed')
  return t('classProgressionTable.sessionRaw', { status: raw })
}

/**
 * Time on the current step while the attempt runs, total time once it is over.
 * Both come from the server: `current_step_elapsed_seconds` is computed at
 * fetch time and is never ticked locally, so it cannot drift from the row it
 * arrived with.
 */
function timeLabel(assignment: LearnerAssignmentProgress | null): string {
  if (!assignment) return '—'
  if (assignment.status === 'completed') {
    const started = Date.parse(assignment.started_at ?? '')
    const completed = Date.parse(assignment.completed_at ?? '')
    if (!Number.isFinite(started) || !Number.isFinite(completed) || completed < started) return '—'
    return formatCompactDuration((completed - started) / 1000, '—')
  }
  if (assignment.current_step_elapsed_seconds == null) return '—'
  return formatCompactDuration(assignment.current_step_elapsed_seconds, '—')
}

function hintLabel(assignment: LearnerAssignmentProgress | null): string {
  const hints = assignment?.hints_used ?? 0
  if (hints === 0) return t('classProgressionTable.noHints')
  const key = hints === 1 ? 'hintCountOne' : 'hintCountMany'
  return t(`classProgressionTable.${key}`, { count: hints })
}
</script>

<template>
  <div class="ocf-prog-table" role="table" :aria-label="t('classProgressionTable.label')">
    <!--
      The presence and action columns carry their name as an attribute rather
      than as hidden text: every header cell is a grid item, so taking one out
      of the flow to hide it would slide the remaining labels off their columns.
    -->
    <div class="ocf-prog-row ocf-prog-head" role="row">
      <span role="columnheader" :aria-label="t('classProgressionTable.columnPresence')"></span>
      <span role="columnheader">{{ t('classProgressionTable.columnLearner') }}</span>
      <span role="columnheader">{{ t('classProgressionTable.columnPosition') }}</span>
      <span role="columnheader">{{ t('classProgressionTable.columnOnStep') }}</span>
      <span role="columnheader">{{ t('classProgressionTable.columnHints') }}</span>
      <span role="columnheader" :aria-label="t('classProgressionTable.columnActions')"></span>
    </div>

    <div
      v-for="row in rows"
      :key="row.userId"
      class="ocf-prog-row"
      :class="{
        'ocf-prog-attention': row.needsAttention,
        'ocf-prog-done': row.assignment?.status === 'completed'
      }"
      role="row"
    >
      <span
        role="cell"
        class="ocf-prog-presence"
        :aria-label="row.connected ? t('classProgressionTable.connected') : t('classProgressionTable.disconnected')"
      >
        <span
          class="ocf-prog-dot"
          :class="row.connected ? 'ocf-prog-dot-online' : 'ocf-prog-dot-offline'"
          :title="row.connected ? t('classProgressionTable.connected') : t('classProgressionTable.disconnected')"
        ></span>
      </span>

      <span role="cell" class="ocf-prog-name">{{ row.displayName }}</span>

      <span role="cell" class="ocf-prog-position">
        <span
          v-if="hasAssignment && totalSteps > 0"
          class="ocf-prog-track"
          :aria-label="positionAriaLabel(row.assignment)"
        >
          <span
            v-for="segment in segments"
            :key="segment"
            class="ocf-prog-seg"
            :class="segmentClass(row.assignment, segment)"
          ></span>
        </span>
        <span class="ocf-prog-position-label">{{
          hasAssignment ? positionLabel(row.assignment) : t('classProgressionTable.noSteps')
        }}</span>
        <span v-if="sessionAnnotation(row.assignment)" class="ocf-prog-session-note">
          {{ sessionAnnotation(row.assignment) }}
        </span>
      </span>

      <span
        role="cell"
        class="ocf-prog-time"
        :class="{ 'ocf-prog-time-warn': row.idle }"
        :title="row.idle ? t('classProgressionTable.idleHint') : undefined"
      >{{ timeLabel(row.assignment) }}</span>

      <span role="cell">
        <span
          class="ocf-prog-hints"
          :class="{
            'ocf-prog-hints-warn': (row.assignment?.hints_used ?? 0) > 0,
            'ocf-prog-hints-zero': (row.assignment?.hints_used ?? 0) === 0
          }"
        >{{ hintLabel(row.assignment) }}</span>
      </span>

      <span role="cell" class="ocf-prog-actions">
        <button
          type="button"
          class="ocf-prog-icon-btn"
          :disabled="!row.terminalSessionId"
          :title="row.terminalSessionId
            ? t('classProgressionTable.watchTerminal')
            : t('classProgressionTable.watchUnavailable')"
          :aria-label="`${t('classProgressionTable.watchTerminal')} — ${row.displayName}`"
          @click="row.terminalSessionId && emit('watch-terminal', row.terminalSessionId)"
        >
          <i class="fas fa-eye" aria-hidden="true"></i>
        </button>
      </span>
    </div>
  </div>
</template>

<style scoped>
.ocf-prog-table {
  display: grid;
  gap: var(--spacing-xs);
}

.ocf-prog-row {
  display: grid;
  grid-template-columns: 22px minmax(120px, 0.7fr) minmax(220px, 1.5fr) 90px 100px auto;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-md);
  /* Held on every row so flagging one cannot shift the column grid sideways. */
  border-left: 3px solid transparent;
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.ocf-prog-row:not(.ocf-prog-head):hover {
  background: var(--color-surface-hover);
}

.ocf-prog-head {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.ocf-prog-attention {
  border-left-color: var(--color-warning-amber);
  background: var(--color-warning-amber-bg);
}

.ocf-prog-done {
  opacity: 0.7;
}

.ocf-prog-presence {
  display: flex;
  justify-content: center;
}

.ocf-prog-dot {
  width: 9px;
  height: 9px;
  border-radius: var(--border-radius-full);
}

.ocf-prog-dot-online {
  background: var(--color-success);
}

/* Absent is not a paler version of present: the ring makes it a different
   shape, readable without relying on the colour difference. */
.ocf-prog-dot-offline {
  background: var(--color-border-medium);
  outline: 2px solid var(--color-danger);
  outline-offset: 1px;
}

.ocf-prog-name {
  font-weight: var(--font-weight-semibold);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ocf-prog-position {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-width: 0;
}

.ocf-prog-track {
  display: flex;
  align-items: center;
  gap: 3px;
  min-width: 0;
}

.ocf-prog-seg {
  flex: 1;
  min-width: 8px;
  max-width: 26px;
  height: 7px;
  border-radius: var(--border-radius-full);
  background: var(--color-bg-tertiary);
}

.ocf-prog-seg.ocf-seg-fill {
  background: var(--color-primary);
  opacity: 0.55;
}

.ocf-prog-seg.ocf-seg-current {
  background: var(--color-primary);
}

.ocf-prog-done .ocf-prog-seg.ocf-seg-fill {
  background: var(--color-success);
  opacity: 0.6;
}

.ocf-prog-position-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ocf-prog-session-note {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-style: italic;
  white-space: nowrap;
}

.ocf-prog-time {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

.ocf-prog-time-warn {
  color: var(--color-warning-amber);
  font-weight: var(--font-weight-bold);
}

.ocf-prog-hints {
  display: inline-flex;
  padding: 1px var(--spacing-sm);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.ocf-prog-hints-warn {
  background: var(--color-warning-amber-bg);
  color: var(--color-warning-amber);
  border: var(--border-width-thin) solid var(--color-warning-amber-border);
}

.ocf-prog-hints-zero {
  background: transparent;
  color: var(--color-text-muted);
  font-weight: var(--font-weight-normal);
}

.ocf-prog-actions {
  display: flex;
  gap: var(--spacing-xs);
  justify-content: flex-end;
}

.ocf-prog-icon-btn {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  border-radius: var(--border-radius-md);
  cursor: pointer;
}

.ocf-prog-icon-btn:hover:not(:disabled) {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.ocf-prog-icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.ocf-prog-icon-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

@media (max-width: 860px) {
  .ocf-prog-row {
    grid-template-columns: 22px 1fr auto;
  }

  .ocf-prog-position {
    grid-column: 2 / -1;
  }
}
</style>
