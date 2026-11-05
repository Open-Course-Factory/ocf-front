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
import { teacherService, type LearnerParticipation, type ParticipationDay, type ParticipationReport } from '../../services/domain/scenario/teacherService'
import { formatDate, formatDateTime } from '../../utils/formatters'

const { groupId, group, reload } = useClassContext()

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
      saveDaysError: 'The course days could not be saved.',
      courseDays: 'Course days',
      courseDaysHelp: 'Tick the days that belong to the training. Only these days appear in the report, and the class remembers them. Each day shows how many learners were active.',
      addDay: 'Add a day',
      saveDays: 'Save the course days',
      showAllDays: 'Show every day with activity',
      otherDays: 'Other days of activity in this period, not shown in this report: {count}.',
      organization: 'Organization',
      period: 'Period',
      trainers: 'Trainers',
      generatedAt: 'Generated on',
      timezone: 'Times are shown in the {timezone} timezone.',
      disclaimer:
        'This report lists the activity recorded on the platform: commands typed in terminals and scenario steps. It shows when a learner was active, not the hours attended, and does not replace a signed attendance sheet for face-to-face sessions. Command history is kept for a time set by the plan and not every plan records it: "none recorded" does not prove that a learner did nothing.',
      commandsUnavailable: 'The terminal service did not answer, so commands and the activity they show are missing from this report: an empty day proves nothing. Generate it again later.',
      learner: 'Learner',
      commands: 'Commands',
      scenarios: 'Scenarios',
      noLearners: 'This class has no learners.',
      daysActive: 'Days active',
      noActivity: 'none',
      noneRecorded: 'None recorded',
      unknown: 'Unknown',
      hasLeft: 'Left the class',
      commandCount: '{count} cmd',
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
      saveDaysError: 'Les jours de formation n’ont pas pu être enregistrés.',
      courseDays: 'Jours de formation',
      courseDaysHelp: 'Cochez les jours qui appartiennent à la formation. Seuls ces jours figurent dans le rapport, et la classe les garde en mémoire. Chaque jour indique combien d’apprenants ont été actifs.',
      addDay: 'Ajouter un jour',
      saveDays: 'Enregistrer les jours de formation',
      showAllDays: 'Afficher tous les jours avec activité',
      otherDays: 'Autres jours d’activité sur la période, absents de ce rapport : {count}.',
      organization: 'Organisation',
      period: 'Période',
      trainers: 'Formateurs',
      generatedAt: 'Généré le',
      timezone: 'Les heures sont indiquées dans le fuseau {timezone}.',
      disclaimer:
        'Ce rapport liste l’activité enregistrée sur la plateforme : commandes saisies dans les terminaux et étapes de scénario. Il indique quand un apprenant a été actif, pas ses heures de présence, et ne remplace pas une feuille d’émargement signée pour les sessions en présentiel. L’historique des commandes est conservé pendant une durée fixée par le plan et tous les plans ne l’enregistrent pas : « aucune enregistrée » ne prouve pas qu’un apprenant n’a rien fait.',
      commandsUnavailable: 'Le service des terminaux n’a pas répondu : les commandes et l’activité qu’elles montrent manquent à ce rapport, et un jour vide ne prouve rien. Générez-le à nouveau plus tard.',
      learner: 'Apprenant',
      commands: 'Commandes',
      scenarios: 'Scénarios',
      noLearners: 'Cette classe n’a pas d’apprenants.',
      daysActive: 'Jours actifs',
      noActivity: 'aucune',
      noneRecorded: 'Aucune enregistrée',
      unknown: 'Inconnu',
      hasLeft: 'A quitté la classe',
      commandCount: '{count} cmd',
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

const savedCourseDays = group.value?.course_days ?? []
const from = ref(savedCourseDays[0] ?? calendarDay(daysAgo(DEFAULT_PERIOD_DAYS - 1)))
const to = ref(savedCourseDays[savedCourseDays.length - 1] ?? calendarDay(new Date()))
const selectedDays = ref([...savedCourseDays])
const showAllDays = ref(false)
const dayToAdd = ref('')
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
    const courseDays = showAllDays.value ? [] : selectedDays.value
    report.value = await teacherService.getParticipationReport(groupId.value, from.value, to.value, browserTimezone, courseDays)
  } catch {
    error.value = t('classParticipation.loadError')
  } finally {
    isLoading.value = false
  }
}

const learnersWithScenarios = computed(() => report.value?.learners.filter(learner => learner.scenarios.length > 0) ?? [])

// A course day with no activity must stay offered, or an absence could not be reported.
const offeredDays = computed(() => {
  const current = report.value
  if (!current) return []
  const days = new Set([...current.activity_days.map(day => day.date), ...selectedDays.value])
  return [...days].filter(day => current.from <= day && day <= current.to).sort()
})

function activeLearnersOn(day: string): number {
  return report.value?.activity_days.find(activityDay => activityDay.date === day)?.active_learners ?? 0
}

function addDay(): void {
  if (dayToAdd.value && !selectedDays.value.includes(dayToAdd.value)) {
    selectedDays.value.push(dayToAdd.value)
  }
  dayToAdd.value = ''
}

async function saveCourseDays(): Promise<void> {
  error.value = ''
  try {
    await teacherService.saveCourseDays(groupId.value, [...selectedDays.value].sort())
    await reload()
  } catch {
    error.value = t('classParticipation.saveDaysError')
    return
  }
  showAllDays.value = false
  await generateReport()
}

function activityOn(learner: LearnerParticipation, date: string): ParticipationDay | undefined {
  return learner.days.find(day => day.date === date)
}

function printReport(): void {
  window.print()
}

// The server sends days as plain dates: UTC keeps them on the same day everywhere.
function formatReportDay(day: string): string {
  return formatDate(day, locale.value, '-', 'UTC')
}

function formatColumnDay(day: string): string {
  return new Date(day).toLocaleDateString(locale.value, { day: '2-digit', month: '2-digit', timeZone: 'UTC' })
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

      <section v-if="report" class="ocf-participation-days" data-test="participation-course-days">
        <h3>{{ t('classParticipation.courseDays') }}</h3>
        <p class="ocf-participation-help">{{ t('classParticipation.courseDaysHelp') }}</p>
        <div class="ocf-participation-day-list">
          <label v-for="day in offeredDays" :key="day" class="ocf-participation-day-choice">
            <input v-model="selectedDays" type="checkbox" :value="day" data-test="participation-day-choice" />
            {{ formatReportDay(day) }} · {{ activeLearnersOn(day) }}/{{ report.learners.length }}
          </label>
        </div>
        <div class="ocf-participation-form">
          <label>
            {{ t('classParticipation.addDay') }}
            <input v-model="dayToAdd" type="date" class="form-control" :min="report.from" :max="report.to" data-test="participation-add-day" @change="addDay" />
          </label>
          <button type="button" class="btn btn-primary" :disabled="isLoading" data-test="participation-save-days" @click="saveCourseDays">
            {{ t('classParticipation.saveDays') }}
          </button>
          <label class="ocf-participation-day-choice">
            <input v-model="showAllDays" type="checkbox" data-test="participation-show-all" @change="generateReport" />
            {{ t('classParticipation.showAllDays') }}
          </label>
        </div>
      </section>
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

      <p v-if="report.other_activity_days > 0" data-test="participation-other-days">
        {{ t('classParticipation.otherDays', { count: report.other_activity_days }) }}
      </p>

      <p v-if="report.learners.length === 0">{{ t('classParticipation.noLearners') }}</p>

      <template v-else>
        <div class="ocf-participation-scroll">
          <table class="ocf-participation-table">
            <thead>
              <tr>
                <th>{{ t('classParticipation.learner') }}</th>
                <th v-for="day in report.days" :key="day" data-test="participation-day-column">{{ formatColumnDay(day) }}</th>
                <th>{{ t('classParticipation.daysActive') }}</th>
                <th>{{ t('classParticipation.commands') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="learner in report.learners" :key="learner.user_id" data-test="participation-learner">
                <td>
                  <strong>{{ learner.name || learner.user_id }}</strong>
                  <div class="ocf-participation-email">{{ learner.email }}</div>
                  <div v-if="learner.has_left" class="ocf-participation-left" data-test="participation-has-left">
                    {{ t('classParticipation.hasLeft') }}
                  </div>
                </td>
                <td v-for="date in report.days" :key="date" data-test="participation-day">
                  <template v-if="activityOn(learner, date)">
                    {{ formatClockTime(activityOn(learner, date)!.first_activity, report.timezone) }} –
                    {{ formatClockTime(activityOn(learner, date)!.last_activity, report.timezone) }}
                    <div class="ocf-participation-email">
                      {{ t('classParticipation.commandCount', { count: activityOn(learner, date)!.commands }) }}
                    </div>
                  </template>
                  <span v-else class="ocf-participation-none">
                    {{ report.commands_available ? t('classParticipation.noActivity') : t('classParticipation.unknown') }}
                  </span>
                </td>
                <td data-test="participation-days-active">{{ learner.days.length }}/{{ report.days.length }}</td>
                <td data-test="participation-commands">
                  <template v-if="!report.commands_available">{{ t('classParticipation.unknown') }}</template>
                  <template v-else-if="learner.commands > 0">{{ learner.commands }}</template>
                  <template v-else>{{ t('classParticipation.noneRecorded') }}</template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 v-if="learnersWithScenarios.length > 0">{{ t('classParticipation.scenarios') }}</h2>
        <table v-if="learnersWithScenarios.length > 0" class="ocf-participation-table">
          <tbody>
            <template v-for="learner in learnersWithScenarios" :key="learner.user_id">
              <tr v-for="(scenario, index) in learner.scenarios" :key="index" data-test="participation-scenario">
                <td>{{ learner.name || learner.user_id }}</td>
                <td><strong>{{ scenario.title }}</strong> ({{ statusLabel(scenario.status) }})</td>
                <td>
                  {{ t('classParticipation.steps', { completed: scenario.steps_completed, total: scenario.steps_total }) }}<template v-if="scenario.grade != null">, {{ t('classParticipation.grade', { grade: scenario.grade }) }}</template>,
                  {{ t('classParticipation.verifyAttempts', { count: scenario.verify_attempts }) }}
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </template>
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

.ocf-participation-scroll {
  overflow-x: auto;
}

.ocf-participation-days {
  margin-bottom: var(--spacing-lg);
}

.ocf-participation-day-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm) var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.ocf-participation-day-choice {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.ocf-participation-left {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-warning-text);
}
</style>

<!-- Not scoped: printing has to hide the whole application around the report. :has()
     limits it to this page, because the stylesheet outlives a visit to it. -->
<style>
/* A named page: a bare @page would turn every other page of the app landscape too. */
@page participation-report {
  size: A4 landscape;
}

@media print {
  body:has(.ocf-participation-report) *:not(.ocf-participation-report, .ocf-participation-report *) {
    visibility: hidden;
  }

  .ocf-participation-report {
    visibility: visible; /* it would inherit hidden from the page around it */
    position: absolute;
    inset: 0 0 auto 0;
  }

  .ocf-participation-report {
    page: participation-report;
  }

  .ocf-participation-report tr {
    break-inside: avoid;
  }
}
</style>
