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
import { computed, ref } from 'vue'
import { useClassContext } from '../../composables/useClassContext'
import { useTranslations } from '../../composables/useTranslations'
import { teacherService, type ParticipationReport } from '../../services/domain/scenario/teacherService'
import { formatDate, formatDateTime } from '../../utils/formatters'

const { groupId } = useClassContext()

const { t, te, locale } = useTranslations({
  en: {
    classParticipation: {
      title: 'Participation report',
      intro: 'Recorded activity of each learner over a period, to keep as evidence of a training.',
      from: 'From',
      to: 'To',
      generate: 'Generate',
      print: 'Print',
      loadError: 'The report could not be generated.',
      organization: 'Organization',
      period: 'Period',
      trainers: 'Trainers',
      generatedAt: 'Generated on',
      timezone: 'Times are shown in the {timezone} timezone.',
      disclaimer:
        'This report lists the activity recorded on the platform: commands typed in terminals and scenario steps. It shows when a learner was active, not the hours attended, and does not replace a signed attendance sheet for face-to-face sessions.',
      commandsUnavailable: 'The terminal service did not answer, so commands are unknown for this report. Generate it again later.',
      learner: 'Learner',
      activity: 'Activity per day',
      commands: 'Commands',
      scenarios: 'Scenarios',
      noLearners: 'This class has no learners.',
      noActivity: 'No recorded activity',
      noScenario: 'None',
      unknown: 'Unknown',
      steps: '{completed}/{total} steps',
      grade: 'grade {grade}',
      verifyAttempts: 'checks: {count}',
      status: {
        provisioning: 'starting',
        active: 'in progress',
        in_progress: 'in progress',
        completed: 'completed',
        abandoned: 'abandoned',
        setup_failed: 'setup failed'
      }
    }
  },
  fr: {
    classParticipation: {
      title: 'Rapport de participation',
      intro: 'Activité enregistrée de chaque apprenant sur une période, à conserver comme preuve d’une formation.',
      from: 'Du',
      to: 'Au',
      generate: 'Générer',
      print: 'Imprimer',
      loadError: 'Le rapport n’a pas pu être généré.',
      organization: 'Organisation',
      period: 'Période',
      trainers: 'Formateurs',
      generatedAt: 'Généré le',
      timezone: 'Les heures sont indiquées dans le fuseau {timezone}.',
      disclaimer:
        'Ce rapport liste l’activité enregistrée sur la plateforme : commandes saisies dans les terminaux et étapes de scénario. Il indique quand un apprenant a été actif, pas ses heures de présence, et ne remplace pas une feuille d’émargement signée pour les sessions en présentiel.',
      commandsUnavailable: 'Le service des terminaux n’a pas répondu : le nombre de commandes est inconnu pour ce rapport. Générez-le à nouveau plus tard.',
      learner: 'Apprenant',
      activity: 'Activité par jour',
      commands: 'Commandes',
      scenarios: 'Scénarios',
      noLearners: 'Cette classe n’a pas d’apprenants.',
      noActivity: 'Aucune activité enregistrée',
      noScenario: 'Aucun',
      unknown: 'Inconnu',
      steps: '{completed}/{total} étapes',
      grade: 'note {grade}',
      verifyAttempts: 'vérifications : {count}',
      status: {
        provisioning: 'en démarrage',
        active: 'en cours',
        in_progress: 'en cours',
        completed: 'terminé',
        abandoned: 'abandonné',
        setup_failed: 'échec du démarrage'
      }
    }
  }
})

const DEFAULT_PERIOD_DAYS = 7

/** YYYY-MM-DD on the viewer's calendar, the format of a date input. */
function calendarDay(date: Date): string {
  return date.toLocaleDateString('en-CA')
}

function daysAgo(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

const from = ref(calendarDay(daysAgo(DEFAULT_PERIOD_DAYS - 1)))
const to = ref(calendarDay(new Date()))
const report = ref<ParticipationReport | null>(null)
const isLoading = ref(false)
const error = ref('')

// YYYY-MM-DD strings sort as dates do.
const isPeriodValid = computed(() => from.value !== '' && to.value !== '' && from.value <= to.value)

async function generateReport(): Promise<void> {
  isLoading.value = true
  error.value = ''
  report.value = null
  try {
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    report.value = await teacherService.getParticipationReport(groupId.value, from.value, to.value, browserTimezone)
  } catch (err: any) {
    error.value = err.response?.data?.error || t('classParticipation.loadError')
  } finally {
    isLoading.value = false
  }
}

function printReport(): void {
  window.print()
}

// The server sends days as plain dates: UTC keeps them on the same day everywhere.
function formatReportDay(day: string): string {
  return formatDate(day, locale.value, '-', 'UTC')
}

function formatClockTime(at: string, timezone: string): string {
  return new Date(at).toLocaleTimeString(locale.value, { hour: '2-digit', minute: '2-digit', timeZone: timezone })
}

function statusLabel(status: string): string {
  const key = `classParticipation.status.${status}`
  return te(key) ? t(key) : status
}
</script>

<template>
  <div class="ocf-participation-page">
    <div class="ocf-participation-controls">
      <h2>{{ t('classParticipation.title') }}</h2>
      <p class="ocf-participation-help">{{ t('classParticipation.intro') }}</p>

      <form class="ocf-participation-form" @submit.prevent="generateReport">
        <label>
          {{ t('classParticipation.from') }}
          <input v-model="from" type="date" class="form-control" :max="to" data-test="participation-from" />
        </label>
        <label>
          {{ t('classParticipation.to') }}
          <input v-model="to" type="date" class="form-control" :min="from" data-test="participation-to" />
        </label>
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="!isPeriodValid || isLoading"
          data-test="participation-generate"
        >
          <i class="fas fa-file-alt" aria-hidden="true"></i>
          {{ t('classParticipation.generate') }}
        </button>
        <button
          type="button"
          class="btn btn-secondary"
          :disabled="!report"
          data-test="participation-print"
          @click="printReport"
        >
          <i class="fas fa-print" aria-hidden="true"></i>
          {{ t('classParticipation.print') }}
        </button>
      </form>

      <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>
    </div>

    <article v-if="report" class="ocf-participation-report">
      <h1>{{ t('classParticipation.title') }} · {{ report.title }}</h1>

      <dl class="ocf-participation-facts">
        <template v-if="report.organization_name">
          <dt>{{ t('classParticipation.organization') }}</dt>
          <dd>{{ report.organization_name }}</dd>
        </template>
        <dt>{{ t('classParticipation.period') }}</dt>
        <dd>{{ formatReportDay(report.from) }} – {{ formatReportDay(report.to) }}</dd>
        <template v-if="report.trainers.length > 0">
          <dt>{{ t('classParticipation.trainers') }}</dt>
          <dd>{{ report.trainers.join(', ') }}</dd>
        </template>
        <dt>{{ t('classParticipation.generatedAt') }}</dt>
        <dd>{{ formatDateTime(report.generated_at, locale, '-', report.timezone) }}</dd>
      </dl>

      <p class="ocf-participation-disclaimer" data-test="participation-disclaimer">
        {{ t('classParticipation.disclaimer') }}
        {{ t('classParticipation.timezone', { timezone: report.timezone }) }}
      </p>

      <p v-if="!report.commands_available" class="alert alert-warning" data-test="participation-commands-warning">
        {{ t('classParticipation.commandsUnavailable') }}
      </p>

      <p v-if="report.learners.length === 0">{{ t('classParticipation.noLearners') }}</p>

      <table v-else class="ocf-participation-table">
        <thead>
          <tr>
            <th>{{ t('classParticipation.learner') }}</th>
            <th>{{ t('classParticipation.activity') }}</th>
            <th>{{ t('classParticipation.commands') }}</th>
            <th>{{ t('classParticipation.scenarios') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="learner in report.learners" :key="learner.user_id" data-test="participation-learner">
            <td>
              <strong>{{ learner.name || learner.user_id }}</strong>
              <div class="ocf-participation-email">{{ learner.email }}</div>
            </td>
            <td>
              <span v-if="learner.days.length === 0" class="ocf-participation-none">
                {{ t('classParticipation.noActivity') }}
              </span>
              <div v-for="day in learner.days" :key="day.date" data-test="participation-day">
                {{ formatReportDay(day.date) }} ·
                {{ formatClockTime(day.first_activity, report.timezone) }} –
                {{ formatClockTime(day.last_activity, report.timezone) }}
              </div>
            </td>
            <td data-test="participation-commands">
              {{ report.commands_available ? learner.commands : t('classParticipation.unknown') }}
            </td>
            <td>
              <span v-if="learner.scenarios.length === 0" class="ocf-participation-none">
                {{ t('classParticipation.noScenario') }}
              </span>
              <div v-for="scenario in learner.scenarios" :key="`${scenario.title}-${scenario.started_at}`">
                <strong>{{ scenario.title }}</strong> ({{ statusLabel(scenario.status) }}) ·
                {{ t('classParticipation.steps', { completed: scenario.steps_completed, total: scenario.steps_total }) }},
                <template v-if="scenario.grade != null">{{ t('classParticipation.grade', { grade: scenario.grade }) }}, </template>
                {{ t('classParticipation.verifyAttempts', { count: scenario.verify_attempts }) }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </article>
  </div>
</template>

<style scoped>
.ocf-participation-help,
.ocf-participation-email,
.ocf-participation-none {
  color: var(--color-text-secondary);
}

.ocf-participation-form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.ocf-participation-report h1 {
  font-size: var(--font-size-xl);
}

.ocf-participation-facts {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: var(--spacing-xs) var(--spacing-md);
}

.ocf-participation-facts dt {
  font-weight: var(--font-weight-semibold);
}

.ocf-participation-facts dd {
  margin: 0;
}

.ocf-participation-disclaimer {
  margin-top: var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.ocf-participation-table {
  width: 100%;
  border-collapse: collapse;
}

.ocf-participation-table th,
.ocf-participation-table td {
  padding: var(--spacing-sm) var(--spacing-md);
  text-align: left;
  vertical-align: top;
  border-bottom: 1px solid var(--color-border-light);
}

.ocf-participation-table th {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  background-color: var(--color-bg-secondary);
}

.alert {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-md);
}

.alert-danger {
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
  border: 1px solid var(--color-danger-border);
}

.alert-warning {
  background-color: var(--color-warning-bg);
  color: var(--color-warning-text);
  border: 1px solid var(--color-warning-border);
}
</style>

<!-- Not scoped: printing has to hide the whole application around the report. :has()
     limits it to this page, because the stylesheet outlives a visit to it. -->
<style>
@media print {
  body:has(.ocf-participation-report) *:not(.ocf-participation-report, .ocf-participation-report *) {
    visibility: hidden;
  }

  .ocf-participation-report {
    visibility: visible; /* it would inherit hidden from the page around it */
    position: absolute;
    inset: 0 0 auto 0;
  }

  .ocf-participation-report tr {
    break-inside: avoid;
  }
}
</style>
