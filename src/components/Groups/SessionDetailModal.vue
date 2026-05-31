<template>
  <BaseModal
    :visible="visible"
    :title="t('groupScenarios.sessionDetail')"
    size="large"
    :show-default-footer="true"
    :confirm-text="t('groupScenarios.close')"
    @confirm="$emit('close')"
    @close="$emit('close')"
  >
    <div v-if="loadingDetail" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
    </div>
    <div v-else-if="sessionDetail">
      <div class="detail-header-info">
        <div><strong>{{ t('groupScenarios.student') }}:</strong> {{ sessionDetail.user_name || sessionDetail.user_id }}</div>
        <div><strong>{{ t('groupScenarios.status') }}:</strong>
          <span :class="['status-chip', getStatusClass(sessionDetail.status)]">{{ translateStatus(sessionDetail.status) }}</span>
        </div>
        <div v-if="sessionDetail.grade != null"><strong>{{ t('groupScenarios.grade') }}:</strong> {{ Math.round(sessionDetail.grade) }}%</div>
        <div v-if="sessionDetail.total_correct_possible">
          <strong>{{ t('groupScenarios.correctAnswers') }}:</strong>
          {{ sessionDetail.correct_count ?? 0 }}/{{ sessionDetail.total_correct_possible }}
        </div>
        <div><strong>{{ t('groupScenarios.startedAt') }}:</strong> {{ formatDate(sessionDetail.started_at) }}</div>
        <div v-if="sessionDetail.completed_at"><strong>{{ t('groupScenarios.completedAt') }}:</strong> {{ formatDate(sessionDetail.completed_at) }}</div>
      </div>

      <!-- Tabs -->
      <div
        class="detail-tabs"
        role="tablist"
        :aria-label="t('groupScenarios.tabsLabel')"
        @keydown="onDetailTabKeydown"
      >
        <button
          v-for="tab in detailTabs"
          :key="tab.key"
          :id="`detail-tab-${tab.key}`"
          class="detail-tab-btn"
          :class="{ active: detailActiveTab === tab.key }"
          role="tab"
          :aria-selected="detailActiveTab === tab.key"
          :aria-controls="`detail-panel-${tab.key}`"
          :tabindex="detailActiveTab === tab.key ? 0 : -1"
          type="button"
          @click="selectDetailTab(tab.key)"
        >
          {{ t(tab.labelKey) }}
        </button>
      </div>

      <!-- Steps panel -->
      <div
        v-if="detailActiveTab === 'steps'"
        id="detail-panel-steps"
        class="detail-tab-panel"
        role="tabpanel"
        aria-labelledby="detail-tab-steps"
      >
        <table class="steps-table">
          <thead>
            <tr>
              <th>{{ t('groupScenarios.stepOrder') }}</th>
              <th>{{ t('groupScenarios.stepTitle') }}</th>
              <th>{{ t('groupScenarios.stepType') }}</th>
              <th>{{ t('groupScenarios.stepStatus') }}</th>
              <th>{{ t('groupScenarios.stepResult') }}</th>
              <th>{{ t('groupScenarios.hintsUsed') }}</th>
              <th>{{ t('groupScenarios.timeSpent') }}</th>
              <th>{{ t('groupScenarios.completedAt') }}</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="step in sessionDetail.steps" :key="step.step_order">
              <tr>
                <td>{{ step.step_order + 1 }}</td>
                <td>{{ step.step_title }}</td>
                <td>
                  <span :class="['step-type-chip', `step-type-${normalizedStepType(step.step_type)}`]">
                    <i :class="stepTypeIcon(step.step_type)"></i>
                    <span class="step-type-label">{{ stepTypeLabel(step.step_type) }}</span>
                  </span>
                </td>
                <td>
                  <span :class="['status-chip', getStatusClass(step.status)]">{{ translateStatus(step.status) }}</span>
                </td>
                <td>
                  <template v-if="normalizedStepType(step.step_type) === 'quiz'">
                    <span
                      v-if="step.quiz_score != null"
                      :class="['quiz-score-badge', quizScoreClass(step.quiz_score)]"
                    >
                      {{ formatQuizScorePct(step.quiz_score) }}
                    </span>
                    <span v-else class="hints-none">&mdash;</span>
                    <button
                      v-if="step.questions && step.questions.length > 0"
                      type="button"
                      class="quiz-toggle-btn"
                      :aria-expanded="isQuizStepExpanded(step.step_order)"
                      :aria-controls="`quiz-questions-${step.step_order}`"
                      @click="toggleQuizStep(step.step_order)"
                    >
                      <i :class="isQuizStepExpanded(step.step_order) ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
                      {{ isQuizStepExpanded(step.step_order)
                        ? t('groupScenarios.hideQuestions')
                        : t('groupScenarios.showQuestions') }}
                    </button>
                  </template>
                  <template v-else-if="normalizedStepType(step.step_type) === 'info'">
                    <i v-if="step.status === 'completed'" class="fas fa-check" :title="t('groupScenarios.completed')"></i>
                    <span v-else class="hints-none">&mdash;</span>
                  </template>
                  <template v-else>
                    {{ t('groupScenarios.attemptsCount', { n: step.verify_attempts }) }}
                  </template>
                </td>
                <td>
                  <span v-if="step.hints_revealed > 0" class="hints-used-badge">
                    {{ step.hints_revealed }}
                  </span>
                  <span v-else class="hints-none">&mdash;</span>
                </td>
                <td>{{ formatDuration(step.time_spent_seconds) }}</td>
                <td class="date-cell">{{ step.completed_at ? formatDate(step.completed_at) : '—' }}</td>
              </tr>
              <tr
                v-if="normalizedStepType(step.step_type) === 'quiz'
                  && step.questions && step.questions.length > 0
                  && isQuizStepExpanded(step.step_order)"
                :key="`questions-${step.step_order}`"
                class="quiz-questions-row"
              >
                <td :colspan="8" :id="`quiz-questions-${step.step_order}`">
                  <QuizAnswerReview :step="step" />
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Commands panel -->
      <div
        v-if="detailActiveTab === 'commands'"
        id="detail-panel-commands"
        class="detail-tab-panel"
        role="tabpanel"
        aria-labelledby="detail-tab-commands"
      >
        <!-- Commands view mode segmented control -->
        <div class="commands-mode-bar" role="group" :aria-label="t('groupScenarios.tabCommands')">
          <button
            type="button"
            class="commands-mode-btn"
            :class="{ active: commandsViewMode === 'all' }"
            :aria-pressed="commandsViewMode === 'all'"
            @click="setCommandsViewMode('all')"
          >
            <i class="fas fa-list"></i>
            {{ t('groupScenarios.commandsModeAll') }}
          </button>
          <button
            type="button"
            class="commands-mode-btn"
            :class="{ active: commandsViewMode === 'per-step' }"
            :aria-pressed="commandsViewMode === 'per-step'"
            @click="setCommandsViewMode('per-step')"
          >
            <i class="fas fa-layer-group"></i>
            {{ t('groupScenarios.commandsModePerStep') }}
          </button>
        </div>

        <!-- All-commands view -->
        <template v-if="commandsViewMode === 'all'">
          <div v-if="commandsLoading" class="loading-state" role="status">
            <i class="fas fa-spinner fa-spin"></i>
            <span class="loading-label">{{ t('groupScenarios.commandsLoading') }}</span>
          </div>

          <div v-else-if="commandsNoTerminal" class="empty-state">
            <i class="fas fa-terminal"></i>
            <p>{{ t('groupScenarios.commandsNoTerminal') }}</p>
          </div>

          <div v-else-if="commandsError" class="empty-state empty-state-error">
            <i class="fas fa-exclamation-circle"></i>
            <p>{{ commandsError }}</p>
            <button class="btn btn-sm btn-primary" @click="fetchSessionCommands">
              <i class="fas fa-redo"></i> {{ t('groupScenarios.retry') }}
            </button>
          </div>

          <div v-else-if="commandsList.length === 0" class="empty-state">
            <i class="fas fa-terminal"></i>
            <p>{{ t('groupScenarios.commandsEmpty') }}</p>
          </div>

          <template v-else>
            <div class="commands-toolbar">
              <button
                class="btn btn-sm btn-outline"
                @click="exportCommandsCsv"
                :disabled="commandsTotal === 0"
              >
                <i class="fas fa-file-csv"></i>
                {{ t('groupScenarios.exportCommandsCsv') }}
              </button>
            </div>
            <table class="commands-table" :aria-label="t('groupScenarios.tabCommands')">
              <thead>
                <tr>
                  <th class="commands-col-seq">{{ t('groupScenarios.commandSequence') }}</th>
                  <th class="commands-col-cmd">{{ t('groupScenarios.command') }}</th>
                  <th class="commands-col-time">{{ t('groupScenarios.commandExecutedAt') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="cmd in commandsList" :key="`${cmd.session_uuid}-${cmd.sequence_num}`">
                  <td class="commands-col-seq">{{ cmd.sequence_num }}</td>
                  <td class="commands-col-cmd">
                    <code class="commands-cmd-text">{{ cmd.command_text }}</code>
                  </td>
                  <td class="commands-col-time">{{ formatExecutedAt(cmd.executed_at) }}</td>
                </tr>
              </tbody>
            </table>
            <div class="commands-pagination">
              <span class="commands-page-info">
                {{ t('groupScenarios.pageInfo', {
                  start: commandsPageStart,
                  end: commandsPageEnd,
                  total: commandsTotal
                }) }}
              </span>
              <div class="commands-page-buttons">
                <button
                  class="btn btn-sm btn-outline"
                  :disabled="!commandsHasPrev || commandsLoading"
                  @click="commandsPrevPage"
                >
                  <i class="fas fa-chevron-left"></i>
                  {{ t('groupScenarios.prevPage') }}
                </button>
                <button
                  class="btn btn-sm btn-outline"
                  :disabled="!commandsHasNext || commandsLoading"
                  @click="commandsNextPage"
                >
                  {{ t('groupScenarios.nextPage') }}
                  <i class="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </template>
        </template>

        <!-- Per-step view -->
        <template v-else>
          <div v-if="allCommandsLoading" class="loading-state" role="status">
            <i class="fas fa-spinner fa-spin"></i>
            <span class="loading-label">{{ t('groupScenarios.commandsLoading') }}</span>
          </div>

          <div v-else-if="commandsNoTerminal" class="empty-state">
            <i class="fas fa-terminal"></i>
            <p>{{ t('groupScenarios.commandsNoTerminal') }}</p>
          </div>

          <div v-else-if="allCommandsError" class="empty-state empty-state-error">
            <i class="fas fa-exclamation-circle"></i>
            <p>{{ allCommandsError }}</p>
            <button class="btn btn-sm btn-primary" @click="fetchAllSessionCommands">
              <i class="fas fa-redo"></i> {{ t('groupScenarios.retry') }}
            </button>
          </div>

          <template v-else>
            <div class="commands-toolbar">
              <button
                class="btn btn-sm btn-outline"
                @click="exportCommandsCsv"
                :disabled="allCommandsCache.length === 0"
              >
                <i class="fas fa-file-csv"></i>
                {{ t('groupScenarios.exportCommandsCsv') }}
              </button>
            </div>
            <div class="per-step-list">
              <div
                v-for="step in sessionDetail.steps"
                :key="`per-step-${step.step_order}`"
                class="per-step-item"
              >
                <button
                  type="button"
                  class="per-step-header"
                  :aria-expanded="isStepRowExpanded(step.step_order)"
                  :aria-controls="`per-step-body-${step.step_order}`"
                  @click="toggleStepRow(step.step_order)"
                >
                  <i :class="isStepRowExpanded(step.step_order) ? 'fas fa-chevron-down' : 'fas fa-chevron-right'"></i>
                  <span class="per-step-order">{{ step.step_order + 1 }}.</span>
                  <span class="per-step-title">{{ step.step_title }}</span>
                  <span :class="['step-type-chip', `step-type-${normalizedStepType(step.step_type)}`]">
                    <i :class="stepTypeIcon(step.step_type)"></i>
                    <span class="step-type-label">{{ stepTypeLabel(step.step_type) }}</span>
                  </span>
                  <span class="per-step-duration">
                    <i class="fas fa-clock"></i>
                    {{ formatDuration(step.time_spent_seconds) }}
                  </span>
                  <span class="per-step-count">
                    {{ t('groupScenarios.commandsCount', {
                      count: commandsForStep(step).length
                    }) }}
                  </span>
                </button>
                <div
                  v-if="isStepRowExpanded(step.step_order)"
                  :id="`per-step-body-${step.step_order}`"
                  class="per-step-body"
                >
                  <div v-if="commandsForStep(step).length === 0" class="per-step-empty">
                    <i class="fas fa-terminal"></i>
                    {{ t('groupScenarios.commandsNoneDuringStep') }}
                  </div>
                  <table v-else class="commands-table" :aria-label="t('groupScenarios.commandsDuringStep')">
                    <thead>
                      <tr>
                        <th class="commands-col-seq">{{ t('groupScenarios.commandSequence') }}</th>
                        <th class="commands-col-cmd">{{ t('groupScenarios.command') }}</th>
                        <th class="commands-col-time">{{ t('groupScenarios.commandExecutedAt') }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="cmd in commandsForStep(step)"
                        :key="`${cmd.session_uuid}-${cmd.sequence_num}`"
                      >
                        <td class="commands-col-seq">{{ cmd.sequence_num }}</td>
                        <td class="commands-col-cmd">
                          <code class="commands-cmd-text">{{ cmd.command_text }}</code>
                        </td>
                        <td class="commands-col-time">{{ formatExecutedAt(cmd.executed_at) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </template>
        </template>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import BaseModal from '../Modals/BaseModal.vue'
import QuizAnswerReview from './QuizAnswerReview.vue'
import { useSessionDetail } from '../../composables/useSessionDetail'
import { teacherService } from '../../services/domain/scenario'
import type { SessionCommand } from '../../services/domain/scenario'
import {
  getStatusClass,
  formatDate,
  formatDuration,
  formatExecutedAt,
  normalizedStepType,
  stepTypeIcon,
  quizScoreClass
} from '../../utils/scenarioDisplay'
import { buildCommandsCsv } from '../../utils/scenarioResultsCsv'
import { downloadCsv } from '../../utils/download'
import { useNotification } from '../../composables/useNotification'
import type { ScenarioResultItem } from '../../types/groupScenarios'

const props = defineProps<{
  visible: boolean
  result: ScenarioResultItem | null
  groupId: string
}>()

defineEmits<{
  close: []
}>()

const { t } = useTranslations({
  en: {
    groupScenarios: {
      sessionDetail: 'Session Detail',
      loadError: 'Failed to load scenario assignments',
      commandsError: 'Failed to load commands',
      close: 'Close',
      student: 'Learner',
      status: 'Status',
      grade: 'Grade',
      correctAnswers: 'Correct answers',
      startedAt: 'Started',
      completedAt: 'Completed',
      stepOrder: 'Step',
      stepTitle: 'Title',
      stepType: 'Type',
      stepStatus: 'Status',
      stepResult: 'Result',
      typeTerminal: 'Terminal',
      typeFlag: 'Flag',
      typeInfo: 'Reading',
      typeQuiz: 'Quiz',
      hintsUsed: 'Hints',
      timeSpent: 'Time',
      attemptsCount: '{n} attempt(s)',
      quizScorePct: '{score}%',
      completed: 'completed',
      activeStatus: 'active',
      in_progress: 'in progress',
      locked: 'locked',
      abandoned: 'abandoned',
      showQuestions: 'Show questions',
      hideQuestions: 'Hide questions',
      tabsLabel: 'Session detail tabs',
      tabSteps: 'Steps',
      tabCommands: 'Commands',
      commandsLoading: 'Loading commands...',
      commandsEmpty: 'No commands recorded yet',
      commandsNoTerminal: 'This session never started a terminal',
      retry: 'Retry',
      commandSequence: '#',
      command: 'Command',
      commandExecutedAt: 'Executed at',
      exportCommandsCsv: 'Export CSV',
      prevPage: 'Previous',
      nextPage: 'Next',
      pageInfo: '{start}-{end} of {total}',
      commandsModeAll: 'All commands',
      commandsModePerStep: 'Per step',
      commandsDuringStep: 'Commands during this step',
      commandsNoneDuringStep: 'No commands during this step',
      commandsCount: '{count} commands',
      csvStepOrder: 'Step',
      csvStepTitle: 'Step title',
      csvStepType: 'Step type'
    }
  },
  fr: {
    groupScenarios: {
      sessionDetail: 'Détail de la session',
      loadError: 'Échec du chargement des assignations',
      commandsError: 'Échec du chargement des commandes',
      close: 'Fermer',
      student: 'Apprenant(e)',
      status: 'Statut',
      grade: 'Note',
      correctAnswers: 'Réponses correctes',
      startedAt: 'Début',
      completedAt: 'Fin',
      stepOrder: 'Étape',
      stepTitle: 'Titre',
      stepType: 'Type',
      stepStatus: 'Statut',
      stepResult: 'Résultat',
      typeTerminal: 'Terminal',
      typeFlag: 'Drapeau',
      typeInfo: 'Lecture',
      typeQuiz: 'Quiz',
      hintsUsed: 'Indices',
      timeSpent: 'Temps',
      attemptsCount: '{n} tentative(s)',
      quizScorePct: '{score} %',
      completed: 'terminé',
      activeStatus: 'actif',
      in_progress: 'en cours',
      locked: 'verrouillé',
      abandoned: 'abandonné',
      showQuestions: 'Afficher les questions',
      hideQuestions: 'Masquer les questions',
      tabsLabel: 'Onglets du détail de session',
      tabSteps: 'Étapes',
      tabCommands: 'Commandes',
      commandsLoading: 'Chargement des commandes...',
      commandsEmpty: 'Aucune commande enregistrée',
      commandsNoTerminal: 'Cette session n\'a pas démarré de terminal',
      retry: 'Réessayer',
      commandSequence: 'N°',
      command: 'Commande',
      commandExecutedAt: 'Exécutée le',
      exportCommandsCsv: 'Exporter CSV',
      prevPage: 'Précédent',
      nextPage: 'Suivant',
      pageInfo: '{start}-{end} sur {total}',
      commandsModeAll: 'Toutes les commandes',
      commandsModePerStep: 'Par étape',
      commandsDuringStep: 'Commandes pendant cette étape',
      commandsNoneDuringStep: 'Aucune commande pendant cette étape',
      commandsCount: '{count} commandes',
      csvStepOrder: 'Étape',
      csvStepTitle: 'Titre de l\'étape',
      csvStepType: 'Type d\'étape'
    }
  }
})

const { showError: notifyError } = useNotification()

const {
  sessionDetail,
  loadingDetail,
  detailResult,
  detailActiveTab,
  commandsList,
  commandsTotal,
  commandsLoading,
  commandsError,
  commandsNoTerminal,
  commandsViewMode,
  allCommandsCache,
  allCommandsLoading,
  allCommandsError,
  loadDetail,
  fetchSessionCommands,
  selectDetailTab,
  commandsHasPrev,
  commandsHasNext,
  commandsPageStart,
  commandsPageEnd,
  commandsPrevPage,
  commandsNextPage,
  setCommandsViewMode,
  fetchAllSessionCommands,
  commandsForStep,
  toggleStepRow,
  isStepRowExpanded,
  toggleQuizStep,
  isQuizStepExpanded
} = useSessionDetail(() => props.groupId, () => notifyError(t('groupScenarios.loadError')))

// Load the detail whenever the modal opens with a result.
watch(() => props.visible, (v) => {
  if (v && props.result) {
    loadDetail(props.result)
  }
}, { immediate: true })

type DetailTab = 'steps' | 'commands'

const detailTabs: ReadonlyArray<{ key: DetailTab; labelKey: string }> = [
  { key: 'steps', labelKey: 'groupScenarios.tabSteps' },
  { key: 'commands', labelKey: 'groupScenarios.tabCommands' }
]

function onDetailTabKeydown(e: KeyboardEvent) {
  const keys: DetailTab[] = detailTabs.map(t_ => t_.key)
  const i = keys.indexOf(detailActiveTab.value)
  if (i === -1) return
  let next = i
  if (e.key === 'ArrowRight') next = (i + 1) % keys.length
  else if (e.key === 'ArrowLeft') next = (i - 1 + keys.length) % keys.length
  else if (e.key === 'Home') next = 0
  else if (e.key === 'End') next = keys.length - 1
  else return
  e.preventDefault()
  selectDetailTab(keys[next])
  requestAnimationFrame(() => {
    const el = document.getElementById(`detail-tab-${keys[next]}`) as HTMLElement | null
    el?.focus()
  })
}

function translateStatus(status: string): string {
  const statusMap: Record<string, string> = {
    completed: t('groupScenarios.completed'),
    active: t('groupScenarios.activeStatus'),
    in_progress: t('groupScenarios.in_progress'),
    locked: t('groupScenarios.locked'),
    abandoned: t('groupScenarios.abandoned')
  }
  return statusMap[status] || status
}

function stepTypeLabel(stepType?: string): string {
  switch (normalizedStepType(stepType)) {
    case 'flag': return t('groupScenarios.typeFlag')
    case 'info': return t('groupScenarios.typeInfo')
    case 'quiz': return t('groupScenarios.typeQuiz')
    default: return t('groupScenarios.typeTerminal')
  }
}

function formatQuizScorePct(score: number): string {
  return t('groupScenarios.quizScorePct', { score: Math.round(score * 100) })
}

async function exportCommandsCsv() {
  if (!detailResult.value) return
  // For a small page (≤100), the visible page is enough; if more pages exist
  // and we want a full export, fetch all pages on demand. Keep KISS: one shot of all pages.
  let allCommands: SessionCommand[] = []
  try {
    let offset = 0
    while (true) {
      const data = await teacherService.getSessionCommands(
        props.groupId,
        detailResult.value.session_id,
        100,
        offset
      )
      const batch = data.commands || []
      allCommands = allCommands.concat(batch)
      if (batch.length < 100 || allCommands.length >= (data.total || 0)) break
      offset += 100
    }
  } catch (err: any) {
    notifyError(err.response?.data?.error_message || t('groupScenarios.commandsError'))
    return
  }

  const result = detailResult.value
  const learner = result.user_name || result.user_email || result.user_id
  const perStep = commandsViewMode.value === 'per-step'
  const commandsLabels = {
    commandSequence: t('groupScenarios.commandSequence'),
    command: t('groupScenarios.command'),
    commandExecutedAt: t('groupScenarios.commandExecutedAt'),
    student: t('groupScenarios.student'),
    stepOrder: t('groupScenarios.csvStepOrder'),
    stepTitle: t('groupScenarios.csvStepTitle'),
    stepType: t('groupScenarios.csvStepType')
  }
  const csv = buildCommandsCsv(allCommands, commandsLabels, {
    learner,
    perStep,
    steps: sessionDetail.value?.steps,
    now: Date.now()
  })

  const safeLearner = learner.replace(/[^a-zA-Z0-9-_]/g, '_')
  const sessionShort = result.session_id.split('-')[0] || result.session_id.slice(0, 8)
  const suffix = perStep ? '-per-step' : ''
  downloadCsv(csv, `commands-${safeLearner}-${sessionShort}${suffix}.csv`)
}
</script>

<style scoped>
.loading-state {
  display: flex;
  justify-content: center;
  padding: var(--spacing-xl);
  color: var(--color-primary);
  font-size: var(--font-size-xl);
}

.loading-label {
  margin-left: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-2xl);
  color: var(--color-text-muted);
}

.empty-state-error {
  color: var(--color-danger);
}

.empty-state-error i {
  opacity: 1;
}

.detail-header-info {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md) var(--spacing-xl);
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.status-chip {
  padding: 2px 8px;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.status-completed {
  background-color: var(--color-success-bg);
  color: var(--color-success-text);
}

.status-active {
  background-color: var(--color-success-bg);
  color: var(--color-success-text);
}

.status-locked {
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-muted);
}

.status-abandoned {
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
}

/* Detail modal tabs */
.detail-tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid var(--color-border-light);
  margin: var(--spacing-md) 0;
}

.detail-tab-btn {
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  background: none;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: color var(--transition-fast), background-color var(--transition-fast), border-color var(--transition-fast);
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  font-family: inherit;
}

.detail-tab-btn:hover {
  color: var(--color-text-primary);
  background-color: var(--color-surface-hover);
}

.detail-tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}

.detail-tab-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}

.detail-tab-panel {
  padding-top: var(--spacing-sm);
}

.steps-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.steps-table th,
.steps-table td {
  padding: var(--spacing-sm) var(--spacing-md);
  text-align: left;
  border-bottom: 1px solid var(--color-border-light);
  color: var(--color-text-primary);
}

.steps-table th {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  background-color: var(--color-bg-secondary);
}

.steps-table tbody tr:hover {
  background-color: var(--color-bg-secondary);
}

.date-cell {
  font-size: var(--font-size-xs);
  white-space: nowrap;
}

.step-type-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 2px 8px;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
}

.step-type-chip i {
  font-size: var(--font-size-xs);
}

.step-type-terminal {
  background: var(--scenario-node-terminal-bg);
  color: var(--scenario-node-terminal);
}

.step-type-flag {
  background: var(--scenario-node-flag-bg);
  color: var(--scenario-node-flag);
}

.step-type-info {
  background: var(--scenario-node-info-bg);
  color: var(--scenario-node-info);
}

.step-type-quiz {
  background: var(--scenario-node-quiz-bg);
  color: var(--scenario-node-quiz);
}

.quiz-score-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

.quiz-score-success {
  background: var(--color-success-bg);
  color: var(--color-success-text);
}

.quiz-score-warning {
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
}

.quiz-score-danger {
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.hints-used-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5em;
  padding: 0.15em 0.4em;
  border-radius: var(--border-radius-sm);
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

.hints-none {
  color: var(--color-text-muted);
}

.quiz-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-left: var(--spacing-sm);
  padding: 2px 8px;
  background: transparent;
  border: 1px solid var(--color-border-medium);
  border-radius: var(--border-radius-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: var(--font-size-xs);
  font-family: inherit;
  transition: var(--transition-fast);
}

.quiz-toggle-btn:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.quiz-toggle-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.quiz-questions-row td {
  background: var(--color-bg-secondary);
  padding: var(--spacing-md) !important;
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--color-border-medium);
  color: var(--color-text-secondary);
}

.btn-outline:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-border-dark);
}

/* Commands view-mode toggle (segmented control) */
.commands-mode-bar {
  display: inline-flex;
  border: 1px solid var(--color-border-medium);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  margin-bottom: var(--spacing-md);
  background: var(--color-bg-primary);
}

.commands-mode-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-md);
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-family: inherit;
  transition: var(--transition-fast);
}

.commands-mode-btn + .commands-mode-btn {
  border-left: 1px solid var(--color-border-medium);
}

.commands-mode-btn:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.commands-mode-btn.active {
  background: var(--color-primary);
  color: var(--color-white);
}

.commands-mode-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Commands tab */
.commands-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--spacing-sm);
}

.commands-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.commands-table thead th {
  padding: var(--spacing-sm) var(--spacing-md);
  text-align: left;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  background-color: var(--color-bg-secondary);
  border-bottom: 2px solid var(--color-border-light);
  white-space: nowrap;
}

.commands-table tbody tr {
  transition: background-color var(--transition-fast);
}

.commands-table tbody tr:hover {
  background-color: var(--color-bg-secondary);
}

.commands-table tbody td {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border-light);
  vertical-align: top;
}

.commands-col-seq {
  width: 60px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: var(--color-text-muted);
}

.commands-col-cmd {
  min-width: 200px;
}

.commands-cmd-text {
  font-family: var(--font-family-monospace);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  background-color: var(--color-bg-tertiary);
  padding: 2px var(--spacing-xs);
  border-radius: var(--border-radius-sm);
  word-break: break-all;
}

.commands-col-time {
  white-space: nowrap;
  width: 200px;
  color: var(--color-text-secondary);
}

.commands-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--spacing-md);
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.commands-page-info {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.commands-page-buttons {
  display: flex;
  gap: var(--spacing-sm);
}

/* Per-step accordion */
.per-step-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.per-step-item {
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  background: var(--color-bg-primary);
  overflow: hidden;
}

.per-step-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-secondary);
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  text-align: left;
  transition: var(--transition-fast);
}

.per-step-header:hover {
  background: var(--color-surface-hover, var(--color-bg-tertiary));
}

.per-step-header:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}

.per-step-order {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  min-width: 2em;
}

.per-step-title {
  flex: 1;
  font-weight: var(--font-weight-medium);
}

.per-step-duration {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  white-space: nowrap;
}

.per-step-count {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--border-radius-sm);
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  white-space: nowrap;
}

.per-step-body {
  padding: var(--spacing-md);
  border-top: 1px solid var(--color-border-light);
}

.per-step-empty {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  padding: var(--spacing-sm) 0;
}
</style>
