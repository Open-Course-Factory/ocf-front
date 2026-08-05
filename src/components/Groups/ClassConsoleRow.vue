<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * One class on the "Mes classes" console (issue #309): who is connected, what
 * is assigned, and the ways in.
 *
 * Four zones behind a status stripe — identity, presence, work, actions — in
 * that reading order, because the question the teacher opens the page with is
 * "who is working, where are they?" and everything else is configuration.
 */
-->

<template>
  <article
    class="class-row"
    :class="[`stripe-${stripeState}`, { 'is-muted': isInactive }]"
    data-test="class-row"
    :data-stripe="stripeState"
    role="button"
    :tabindex="0"
    :aria-label="t('myClasses.openLive', { name: className })"
    @click="open('live')"
    @keydown.enter="open('live')"
    @keydown.space.prevent="open('live')"
  >
    <span class="class-stripe" data-test="class-stripe" aria-hidden="true"></span>

    <div class="class-identity">
      <h3 class="class-name">{{ className }}</h3>
      <div class="class-meta">
        <span data-test="member-count">{{ memberCountLabel }}</span>
        <span v-if="expiryLabel" data-test="class-expiry">{{ expiryLabel }}</span>
        <span v-if="summary.caller_role === 'manager'" class="class-tag tag-role" data-test="role-badge">
          {{ t('myClasses.roleManager') }}
        </span>
        <span v-if="stateLabel" class="class-tag tag-state" data-test="state-badge">
          {{ stateLabel }}
        </span>
      </div>
    </div>

    <div class="class-presence" :class="{ 'is-live': isLive }" data-test="live-count">
      <span class="presence-count">
        <span class="live-dot" aria-hidden="true"></span>
        <span class="presence-number" data-test="live-number">{{ summary.live_session_count }}</span>
        <small class="presence-total">{{ t('myClasses.liveOutOf', { total: summary.member_count }) }}</small>
      </span>
      <!-- Always rendered, empty until the endpoint serves the counter: the
           line keeps its height so a row never grows when the number lands. -->
      <span class="presence-idle" data-test="idle-count">{{ idleLabel }}</span>
    </div>

    <div class="class-work">
      <template v-if="summary.assignments.length">
        <div
          v-for="assignment in summary.assignments"
          :key="assignment.assignment_id"
          class="assignment"
          data-test="assignment"
        >
          <div class="assignment-head">
            <span class="assignment-title">{{ assignment.scenario_title }}</span>
            <span v-if="assignment.deadline" class="assignment-deadline" data-test="assignment-deadline">
              <i class="fas fa-hourglass-end" aria-hidden="true"></i>
              {{ formatDeadline(assignment.deadline) }}
            </span>
          </div>
          <div
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
          </div>
        </div>
      </template>
      <div v-else class="no-assignment" data-test="no-assignment">
        <span>{{ t('myClasses.noAssignment') }}</span>
        <button
          type="button"
          class="assign-link"
          data-test="assign-scenario"
          @click.stop="open('scenarios')"
        >
          {{ t('myClasses.assignScenario') }}
        </button>
      </div>
    </div>

    <div class="class-actions">
      <!-- A closed class has no wall left to watch; what is still wanted of it
           is what the cohort achieved. -->
      <button
        v-if="isInactive"
        type="button"
        class="action-analytics"
        data-test="open-analytics"
        @click.stop="open('analytics')"
      >
        {{ t('myClasses.openAnalytics') }}
      </button>
      <template v-else>
        <button
          type="button"
          class="action-wall"
          data-test="open-wall"
          @click.stop="open('live')"
        >
          <i class="fas fa-play" aria-hidden="true"></i>
          <span>{{ t('myClasses.openWall') }}</span>
        </button>
        <button
          type="button"
          class="class-action"
          data-test="open-members"
          :title="t('myClasses.openMembers')"
          :aria-label="t('myClasses.openMembers')"
          @click.stop="open('members')"
        >
          <i class="fas fa-user-friends" aria-hidden="true"></i>
        </button>
        <button
          type="button"
          class="class-action"
          data-test="open-scenarios"
          :title="t('myClasses.openScenarios')"
          :aria-label="t('myClasses.openScenarios')"
          @click.stop="open('scenarios')"
        >
          <i class="fas fa-flask" aria-hidden="true"></i>
        </button>
      </template>
      <button
        type="button"
        class="class-action"
        data-test="open-settings"
        :title="t('myClasses.openSettings')"
        :aria-label="t('myClasses.openSettings')"
        @click.stop="open('settings')"
      >
        <i class="fas fa-cog" aria-hidden="true"></i>
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
import {
  classDisplayName,
  isInactiveClass,
  type TeacherGroupAssignment,
  type TeacherGroupSummary
} from '../../services/domain/scenario/teacherService'

/**
 * A deadline is "near" within two days: the window in which the teacher can
 * still act on it — squeeze in a session, send a reminder. Past that, the chip
 * carries the date and the stripe stays quiet.
 */
const DEADLINE_SOON_MS = 48 * 60 * 60 * 1000

/**
 * An expiry earns a line in the meta only once it is a couple of weeks out.
 * Every class has one; naming it year-round would turn the line into noise.
 */
const EXPIRY_SOON_MS = 14 * 24 * 60 * 60 * 1000

/** Mirrors the backend's idle threshold, so the count reads unambiguously. */
const IDLE_THRESHOLD_MINUTES = 10

// No organization prop: every row on the console belongs to the active
// organization, which the page and the organization switcher already name.
const props = defineProps<{
  summary: TeacherGroupSummary
}>()

const router = useRouter()
const { locale } = useI18n()

const { t } = useTranslations({
  en: {
    myClasses: {
      roleManager: 'Manager',
      stateArchived: 'Archived',
      stateExpired: 'Expired',
      memberCountOne: '{count} learner',
      memberCountMany: '{count} learners',
      expiresOn: 'expires {date}',
      liveOutOf: '/ {total} online',
      idleCountOne: '{count} idle > {minutes} min',
      idleCountMany: '{count} idle > {minutes} min',
      completedOfClass: '{completed}/{total} finished',
      completionHelp: 'Learners of the class who finished this scenario',
      noAssignment: 'No scenario assigned',
      assignScenario: 'Assign a scenario →',
      openLive: 'Open the live sessions of {name}',
      openWall: 'Open the wall',
      openAnalytics: 'Analytics',
      openMembers: 'Learners',
      openScenarios: 'Scenarios',
      openSettings: 'Settings'
    }
  },
  fr: {
    myClasses: {
      roleManager: 'Gestionnaire',
      stateArchived: 'Archivée',
      stateExpired: 'Expirée',
      memberCountOne: '{count} apprenant',
      memberCountMany: '{count} apprenants',
      expiresOn: 'expire le {date}',
      liveOutOf: '/ {total} connectés',
      idleCountOne: '{count} inactif > {minutes} min',
      idleCountMany: '{count} inactifs > {minutes} min',
      completedOfClass: '{completed}/{total} ont terminé',
      completionHelp: 'Apprenants de la classe ayant terminé ce scénario',
      noAssignment: 'Aucun scénario assigné',
      assignScenario: 'Assigner un scénario →',
      openLive: 'Ouvrir les sessions en direct de {name}',
      openWall: 'Ouvrir le mur',
      openAnalytics: 'Analytiques',
      openMembers: 'Apprenants',
      openScenarios: 'Scénarios',
      openSettings: 'Réglages'
    }
  }
})

const className = computed(() => classDisplayName(props.summary))
const isInactive = computed(() => isInactiveClass(props.summary))
const isLive = computed(() => props.summary.live_session_count > 0)

const hasDeadlineSoon = computed(() =>
  props.summary.assignments.some(assignment => {
    const remaining = millisecondsUntil(assignment.deadline)
    // A deadline already past is history, not urgency; an unparseable date
    // yields NaN and fails both comparisons, which is the answer we want.
    return remaining !== null && remaining >= 0 && remaining <= DEADLINE_SOON_MS
  })
)

/**
 * The stripe is the pre-attentive sort key of the list, so it carries exactly
 * one state. A near deadline outranks live presence because presence is spelled
 * out right beside it — a big green number and a pulsing dot — while a deadline
 * would otherwise be a small chip three columns away.
 */
const stripeState = computed<'inactive' | 'deadline' | 'live' | 'calm'>(() => {
  if (isInactive.value) return 'inactive'
  if (hasDeadlineSoon.value) return 'deadline'
  if (isLive.value) return 'live'
  return 'calm'
})

// Archived wins over expired: a class its owner closed is closed whatever its
// expiry says.
const stateLabel = computed(() => {
  if (!props.summary.is_active) return t('myClasses.stateArchived')
  if (props.summary.is_expired) return t('myClasses.stateExpired')
  return ''
})

const memberCountLabel = computed(() => {
  const key = props.summary.member_count === 1 ? 'myClasses.memberCountOne' : 'myClasses.memberCountMany'
  return t(key, { count: props.summary.member_count })
})

// Only an expiry the teacher can still act on. A class already past it says so
// in its state badge, where repeating the date would add nothing.
const expiryLabel = computed(() => {
  if (isInactive.value || !props.summary.expires_at) return ''
  const remaining = millisecondsUntil(props.summary.expires_at)
  if (remaining === null || !(remaining >= 0 && remaining <= EXPIRY_SOON_MS)) return ''
  return t('myClasses.expiresOn', { date: formatDeadline(props.summary.expires_at) })
})

// Absent is not zero: a class with nobody idle and a class the endpoint cannot
// tell us about both stay silent here, which is why this reads the raw field
// rather than defaulting it.
const idleLabel = computed(() => {
  const idle = props.summary.idle_session_count
  if (!idle || idle <= 0) return ''
  const key = idle === 1 ? 'myClasses.idleCountOne' : 'myClasses.idleCountMany'
  return t(key, { count: idle, minutes: IDLE_THRESHOLD_MINUTES })
})

/** Milliseconds from now until `date`, or null when there is no date at all. */
function millisecondsUntil(date?: string): number | null {
  if (!date) return null
  return new Date(date).getTime() - Date.now()
}

// `class_completion_rate` is distinct MEMBERS who completed over class size —
// a different metric from ScenarioAnalytics.completion_rate, which counts
// completed SESSIONS over total sessions. The row therefore prints the
// fraction it was given ("3/12 ont terminé") rather than a bare percentage a
// reader could take for the other one; the bar only draws that same share.
function completionBarWidth(assignment: TeacherGroupAssignment): string {
  return `${Math.round(assignment.class_completion_rate || 0)}%`
}

function formatDeadline(deadline: string): string {
  return formatDate(deadline, locale.value === 'en' ? 'en-GB' : 'fr-FR')
}

function open(tab: 'live' | 'members' | 'scenarios' | 'settings' | 'analytics') {
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
  grid-template-columns: 4px minmax(0, 1.1fr) 150px minmax(0, 1.4fr) auto;
  align-items: center;
  gap: var(--spacing-md);
  /* Set by the console list so a row and its loading placeholder share one
     height; the fallback keeps the component usable on its own. */
  min-height: var(--class-row-min-height, 84px);
  padding: var(--spacing-md) var(--spacing-md) var(--spacing-md) 0;
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
  opacity: 0.62;
  background: var(--color-bg-secondary);
}

/* The status stripe: one colour, one state, read before a single word. */
.class-stripe {
  align-self: stretch;
  border-radius: var(--border-radius-lg) 0 0 var(--border-radius-lg);
  background: var(--color-border-light);
}

.stripe-live .class-stripe {
  background: var(--color-success);
}

.stripe-deadline .class-stripe {
  background: var(--color-warning-amber);
}

.class-identity {
  min-width: 0;
}

.class-name {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.class-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-xs) var(--spacing-sm);
  margin-top: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.class-tag {
  display: inline-flex;
  align-items: center;
  padding: 1px var(--spacing-sm);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

.tag-role {
  background: var(--color-purple-bg);
  color: var(--color-purple);
}

.tag-state {
  background: var(--color-bg-tertiary);
  color: var(--color-text-muted);
}

.class-presence {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-variant-numeric: tabular-nums;
  color: var(--color-text-muted);
}

.presence-count {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-sm);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  white-space: nowrap;
}

.presence-total {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-normal);
  color: var(--color-text-muted);
}

.class-presence.is-live {
  color: var(--color-success-text);
}

/* Reserved line: empty until the endpoint reports idle learners, so the row
   never grows the day it starts to. */
.presence-idle {
  min-height: 1.2em;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.live-dot {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  align-self: center;
  border-radius: 50%;
  background: var(--color-gray-400);
}

.class-presence.is-live .live-dot {
  background: var(--color-success);
  animation: live-pulse 2s ease-in-out infinite;
}

@keyframes live-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.35); }
}

@media (prefers-reduced-motion: reduce) {
  .class-presence.is-live .live-dot {
    animation: none;
  }
}

.class-work {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  min-width: 0;
  font-size: var(--font-size-sm);
}

.assignment-head {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-width: 0;
}

.assignment-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.assignment-deadline {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-shrink: 0;
  padding: 1px var(--spacing-sm);
  border: var(--border-width-thin) solid var(--color-warning-amber-border);
  border-radius: var(--border-radius-full);
  background: var(--color-warning-amber-bg);
  color: var(--color-warning-amber);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
}

.assignment-progress {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: 3px;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.assignment-bar {
  flex: 1;
  max-width: 190px;
  height: 6px;
  border-radius: var(--border-radius-full);
  background: var(--color-bg-tertiary);
  overflow: hidden;
}

.assignment-bar-fill {
  display: block;
  height: 100%;
  border-radius: var(--border-radius-full);
  background: var(--color-primary);
  transition: width var(--transition-slow);
}

/* An empty work zone is an action waiting, not a blank. */
.no-assignment {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.assign-link {
  padding: 0;
  border: none;
  background: none;
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}

.assign-link:hover {
  text-decoration: underline;
}

.class-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

/* The one filled affordance of the row. */
.action-wall {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  border-radius: var(--border-radius-md);
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
  cursor: pointer;
  transition: background var(--transition-base), color var(--transition-base);
}

.action-wall:hover {
  background: var(--color-primary);
  color: var(--color-white);
}

.action-analytics {
  padding: var(--spacing-sm) var(--spacing-md);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  white-space: nowrap;
  cursor: pointer;
}

.action-analytics:hover {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.class-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  min-height: 36px;
  border: none;
  border-radius: var(--border-radius-md);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background var(--transition-base), color var(--transition-base);
}

.class-action:hover {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

@media (max-width: 900px) {
  .class-row {
    grid-template-columns: 4px minmax(0, 1fr) auto;
    grid-template-areas:
      'stripe identity presence'
      'stripe work work'
      'stripe actions actions';
    row-gap: var(--spacing-sm);
    min-height: 0;
  }

  .class-stripe { grid-area: stripe; }
  .class-identity { grid-area: identity; }
  .class-presence { grid-area: presence; }
  .class-work { grid-area: work; }
  .class-actions { grid-area: actions; }
}
</style>
