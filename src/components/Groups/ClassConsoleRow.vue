<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * One class on the "Mes classes" console (issue #309): who is connected, what
 * is assigned, and the ways in.
 */
-->

<template>
  <article
    class="class-row"
    :class="{ 'is-muted': isMuted }"
    data-test="class-row"
    role="button"
    :tabindex="0"
    :aria-label="t('myClasses.openLive', { name: summary.display_name || summary.name })"
    @click="open('live')"
    @keydown.enter="open('live')"
    @keydown.space.prevent="open('live')"
  >
    <div class="class-identity">
      <h3 class="class-name">{{ summary.display_name || summary.name }}</h3>
      <div class="class-tags">
        <span v-if="organizationName" class="class-tag class-org" data-test="class-org">
          <i class="fas fa-building"></i>
          {{ organizationName }}
        </span>
        <span v-if="summary.caller_role === 'manager'" class="class-tag tag-role" data-test="role-badge">
          {{ t('myClasses.roleManager') }}
        </span>
        <span v-if="stateLabel" class="class-tag tag-state" data-test="state-badge">
          {{ stateLabel }}
        </span>
      </div>
    </div>

    <div class="class-live" :class="{ 'is-live': isLive }" data-test="live-count">
      <span class="live-dot" aria-hidden="true"></span>
      {{ liveLabel }}
    </div>

    <div class="class-assignments">
      <template v-if="summary.assignments.length">
        <div
          v-for="assignment in summary.assignments"
          :key="assignment.assignment_id"
          class="assignment"
          data-test="assignment"
        >
          <span class="assignment-title">{{ assignment.scenario_title }}</span>
          <span
            class="assignment-progress"
            data-test="assignment-progress"
            :title="t('myClasses.completionHelp')"
          >
            <span class="assignment-bar" aria-hidden="true">
              <span class="assignment-bar-fill" :style="{ width: completionBarWidth(assignment) }"></span>
            </span>
            {{ t('myClasses.completedOfClass', {
              completed: assignment.completed_count,
              total: summary.member_count
            }) }}
          </span>
          <span v-if="assignment.deadline" class="assignment-deadline" data-test="assignment-deadline">
            <i class="fas fa-hourglass-end"></i>
            {{ formatDeadline(assignment.deadline) }}
          </span>
        </div>
      </template>
      <span v-else class="no-assignment" data-test="no-assignment">
        {{ t('myClasses.noAssignment') }}
      </span>
    </div>

    <div class="class-actions">
      <button
        type="button"
        class="class-action"
        data-test="open-members"
        :title="t('myClasses.openMembers')"
        @click.stop="open('members')"
      >
        <i class="fas fa-user-friends"></i>
        <span class="class-action-label">{{ summary.member_count }}</span>
      </button>
      <button
        type="button"
        class="class-action"
        data-test="open-scenarios"
        :title="t('myClasses.openScenarios')"
        @click.stop="open('scenarios')"
      >
        <i class="fas fa-flask"></i>
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTranslations } from '../../composables/useTranslations'
import { formatDate } from '../../utils/formatters'
import type { TeacherGroupAssignment, TeacherGroupSummary } from '../../services/domain/scenario/teacherService'

const props = defineProps<{
  summary: TeacherGroupSummary
  // Resolved by the console from the organizations the session already holds;
  // absent when every class sits in the same organization and naming it would
  // only add noise.
  organizationName?: string
}>()

const router = useRouter()
const { locale } = useI18n()

const { t } = useTranslations({
  en: {
    myClasses: {
      roleManager: 'Manager',
      stateArchived: 'Archived',
      stateExpired: 'Expired',
      liveCountOne: '{live} online / {total}',
      liveCountMany: '{live} online / {total}',
      completedOfClass: '{completed}/{total} finished',
      completionHelp: 'Learners of the class who finished this scenario',
      noAssignment: 'No scenario assigned',
      openLive: 'Open the live sessions of {name}',
      openMembers: 'Members',
      openScenarios: 'Scenarios'
    }
  },
  fr: {
    myClasses: {
      roleManager: 'Gestionnaire',
      stateArchived: 'Archivée',
      stateExpired: 'Expirée',
      liveCountOne: '{live} connecté / {total}',
      liveCountMany: '{live} connectés / {total}',
      completedOfClass: '{completed}/{total} ont terminé',
      completionHelp: 'Apprenants de la classe ayant terminé ce scénario',
      noAssignment: 'Aucun scénario assigné',
      openLive: 'Ouvrir les sessions en direct de {name}',
      openMembers: 'Membres',
      openScenarios: 'Scénarios'
    }
  }
})

const isMuted = computed(() => !props.summary.is_active || props.summary.is_expired)
const isLive = computed(() => props.summary.live_session_count > 0)

// Archived wins over expired: a class its owner closed is closed whatever its
// expiry says.
const stateLabel = computed(() => {
  if (!props.summary.is_active) return t('myClasses.stateArchived')
  if (props.summary.is_expired) return t('myClasses.stateExpired')
  return ''
})

const liveLabel = computed(() => {
  const key = props.summary.live_session_count === 1 ? 'myClasses.liveCountOne' : 'myClasses.liveCountMany'
  return t(key, {
    live: props.summary.live_session_count,
    total: props.summary.member_count
  })
})

// `completion_rate` here is completed ÷ CLASS SIZE, as a 0..1 fraction — the
// per-scenario analytics surfaces report completed ÷ started instead, on a
// 0..100 scale. The two answer different questions, so the row prints the
// fraction it was given ("3/12 ont terminé") rather than a bare percentage a
// reader could take for the other one; the bar only draws that same fraction.
function completionBarWidth(assignment: TeacherGroupAssignment): string {
  return `${Math.round((assignment.completion_rate || 0) * 100)}%`
}

function formatDeadline(deadline: string): string {
  return formatDate(deadline, locale.value === 'en' ? 'en-GB' : 'fr-FR')
}

function open(tab: 'live' | 'members' | 'scenarios') {
  router.push({
    name: 'GroupDetails',
    params: { id: props.summary.group_id },
    query: { tab }
  })
}
</script>

<style scoped>
.class-row {
  display: grid;
  grid-template-columns: minmax(0, 2fr) auto minmax(0, 3fr) auto;
  align-items: center;
  gap: var(--spacing-lg);
  /* Set by the console list so a row and its loading placeholder share one
     height; the fallback keeps the component usable on its own. */
  min-height: var(--class-row-min-height, 84px);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-bg-primary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
  cursor: pointer;
  transition: box-shadow var(--transition-base), border-color var(--transition-base);
}

.class-row:hover,
.class-row:focus-visible {
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
  outline: none;
}

.class-row.is-muted {
  opacity: 0.6;
  background: var(--color-bg-secondary);
}

.class-identity {
  min-width: 0;
}

.class-name {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.class-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs) var(--spacing-sm);
  margin-top: var(--spacing-xs);
}

.class-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.tag-role,
.tag-state {
  padding: 2px var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

.class-live {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  /* Reserved width: the label grows from "0" to "12" without moving anything. */
  min-width: 11ch;
  font-size: var(--font-size-sm);
  font-variant-numeric: tabular-nums;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.class-live.is-live {
  color: var(--color-success);
  font-weight: var(--font-weight-semibold);
}

.live-dot {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--color-gray-400);
}

.class-live.is-live .live-dot {
  background: var(--color-success);
  animation: live-pulse 2s ease-in-out infinite;
}

@keyframes live-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.35); }
}

@media (prefers-reduced-motion: reduce) {
  .class-live.is-live .live-dot {
    animation: none;
  }
}

.class-assignments {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  min-width: 0;
}

.assignment {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.assignment-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-text-primary);
}

.assignment-progress {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-left: auto;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.assignment-bar {
  display: inline-block;
  width: 64px;
  height: 6px;
  border-radius: 3px;
  background: var(--color-bg-tertiary);
  overflow: hidden;
}

.assignment-bar-fill {
  display: block;
  height: 100%;
  border-radius: 3px;
  background: var(--color-primary);
  transition: width var(--transition-slow);
}

.assignment-deadline {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  white-space: nowrap;
}

.no-assignment {
  font-size: var(--font-size-sm);
  font-style: italic;
  color: var(--color-text-muted);
}

.class-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.class-action {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  min-width: 44px;
  min-height: 36px;
  justify-content: center;
  padding: 0 var(--spacing-sm);
  background: var(--color-bg-tertiary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background var(--transition-base), color var(--transition-base);
}

.class-action:hover {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.class-action-label {
  font-size: var(--font-size-sm);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 900px) {
  .class-row {
    grid-template-columns: 1fr auto;
    grid-template-areas:
      'identity live'
      'assignments actions';
    min-height: 0;
  }

  .class-identity { grid-area: identity; }
  .class-live { grid-area: live; }
  .class-assignments { grid-area: assignments; }
  .class-actions { grid-area: actions; }
}
</style>
