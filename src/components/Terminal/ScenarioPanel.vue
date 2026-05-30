<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Collapsible right sidebar panel for scenario interaction during terminal sessions.
 * Displays step content, hints, verify button, flag input, and progress indicator.
 */
-->

<template>
  <div class="scenario-panel" :class="{ collapsed: isCollapsed }">
    <!-- Collapse/Expand toggle button -->
    <button
      class="collapse-toggle"
      :aria-expanded="!isCollapsed"
      :aria-label="isCollapsed ? t('scenarioPanel.expandPanel') : t('scenarioPanel.collapsePanel')"
      :title="isCollapsed ? t('scenarioPanel.expandPanel') : t('scenarioPanel.collapsePanel')"
      @click="toggleCollapse"
    >
      <i :class="isCollapsed ? 'fas fa-chevron-left' : 'fas fa-chevron-right'"></i>
    </button>

    <!-- Panel content (hidden when collapsed) -->
    <div v-show="!isCollapsed" class="panel-content">
      <!-- Panel header -->
      <div class="panel-header">
        <h3 class="panel-title">
          <i class="fas fa-flag-checkered"></i>
          {{ scenarioName || t('scenarioPanel.title') }}
        </h3>
      </div>

      <!-- Review mode banner -->
      <div v-if="isReviewMode" class="review-mode-banner">
        <i :class="props.sessionStatus === 'completed' ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
        <span>{{ props.sessionStatus === 'completed' ? t('scenarioPanel.sessionCompleted') : t('scenarioPanel.sessionAbandoned') }}</span>
      </div>

      <!-- Loading state -->
      <div v-if="isLoading" class="panel-loading">
        <i class="fas fa-spinner fa-spin"></i>
        <span>{{ t('scenarioPanel.loading') }}</span>
      </div>

      <!-- Error state -->
      <div v-else-if="loadError" class="panel-error">
        <i class="fas fa-exclamation-triangle"></i>
        <span>{{ t('scenarioPanel.error') }}</span>
        <button class="retry-btn" @click="loadCurrentStep">
          <i class="fas fa-redo"></i>
          {{ t('scenarioPanel.retry') }}
        </button>
      </div>

      <!-- Completed state -->
      <div v-else-if="isSessionCompleted" class="panel-completed">
        <div class="completed-icon">
          <i class="fas fa-trophy"></i>
        </div>
        <h4>{{ t('scenarioPanel.completed') }}</h4>
        <p>{{ t('scenarioPanel.completedMessage') }}</p>
        <div v-if="renderedFinishText" class="finish-text markdown-content" v-html="renderedFinishText" @click="handleExecClick"></div>
        <div class="completion-summary">
          <h5 class="completion-summary-title">{{ t('scenarioPanel.completionSummary') }}</h5>
          <div class="completion-summary-items">
            <div class="summary-item">
              <i class="fas fa-check-double"></i>
              <span class="summary-label">{{ t('scenarioPanel.stepsCompleted') }}</span>
              <span class="summary-value">{{ totalSteps }}/{{ totalSteps }}</span>
            </div>
            <div v-if="formattedElapsedTime" class="summary-item">
              <i class="fas fa-clock"></i>
              <span class="summary-label">{{ t('scenarioPanel.totalTime') }}</span>
              <span class="summary-value">{{ formattedElapsedTime }}</span>
            </div>
          </div>
        </div>
        <router-link to="/my-scenarios" class="btn btn-primary view-results-link">
          <i class="fas fa-list"></i>
          {{ t('scenarioPanel.viewMyScenarios') }}
        </router-link>
      </div>

      <!-- Step transition (full panel) -->
      <div v-else-if="isTransitioning" class="panel-transitioning">
        <!-- Phase 1: Step validated -->
        <template v-if="transitionPhase === 'validated'">
          <div class="transition-validated">
            <i class="fas fa-check-circle validated-icon"></i>
            <span class="validated-text">{{ t('scenarioPanel.stepValidated') }}</span>
          </div>
        </template>
        <!-- Phase 2: Loading next step -->
        <template v-else>
          <div class="transition-animation">
            <div class="transition-progress">
              <div class="transition-bar"></div>
            </div>
            <div class="transition-content">
              <i class="fas fa-arrow-right transition-icon"></i>
              <span class="transition-text">{{ t('scenarioPanel.nextStep') }}</span>
            </div>
          </div>
        </template>
      </div>

      <!-- Active step content -->
      <template v-else-if="currentStep">
        <!-- Step type indicator -->
        <div
          v-if="stepTypeMeta"
          class="step-type-chip"
          :class="`step-type-chip--${stepTypeMeta.key}`"
          :style="{ '--step-type-color': stepTypeMeta.color, '--step-type-bg': stepTypeMeta.bg } as any"
        >
          <i :class="stepTypeMeta.icon"></i>
          <span>{{ stepTypeMeta.label }}</span>
        </div>

        <!-- Progress indicator -->
        <div class="progress-bar">
          <div class="progress-bar-top">
            <span class="progress-label">{{ stepCountLabel }}</span>
            <ScenarioElapsedTimer :started-at="sessionStartedAt" />
          </div>
          <div class="progress-dots" role="status" :aria-label="stepCountLabel">
            <span
              v-for="n in totalSteps"
              :key="n"
              class="progress-dot"
              :class="{
                completed: (n - 1) < currentStep.step_order,
                active: (n - 1) === currentStep.step_order,
                locked: (n - 1) > currentStep.step_order,
                clickable: (n - 1) <= currentStep.step_order,
                reviewing: reviewingStep && (n - 1) === reviewingStep.step_order
              }"
              @click="(n - 1) <= currentStep.step_order ? navigateToStep(n - 1) : undefined"
            ></span>
          </div>
        </div>

        <!-- Review mode indicator -->
        <div v-if="reviewingStep" class="review-banner">
          <span class="review-label">
            <i class="fas fa-eye"></i>
            {{ t('scenarioPanel.reviewingStep', { step: reviewingStep.step_order + 1 }) }}
          </span>
          <button class="back-to-current-btn" @click="backToCurrentStep">
            <i class="fas fa-arrow-left"></i>
            {{ t('scenarioPanel.backToCurrent') }}
          </button>
        </div>

        <!-- Step content area -->
        <div ref="stepContentRef" class="step-content" @click="handleExecClick">
          <!-- Step title -->
          <div class="step-header">
            <span class="step-label">{{ t('scenarioPanel.step') }} {{ displayedStep!.step_order + 1 }}</span>
            <h4 class="step-title">{{ displayedStep!.title }}</h4>
          </div>

          <!-- Step text (rendered as markdown) -->
          <div v-if="displayedStep!.text" class="step-text markdown-content" v-html="renderedDisplayedStepText"></div>

          <ScenarioHintPanel
            :step="displayedStep"
            :has-progressive-hints="hasProgressiveHints"
            :revealed-hints="revealedHints"
            :is-revealing-hint="isRevealingHint"
            :show-hint="showHint"
            :hint-nudge-active="hintNudgeActive"
            :is-reviewing="!!reviewingStep"
            @reveal-next="handleRevealNextHint"
            @toggle-hint="showHint = !showHint"
          />

          <!-- Action area (hidden when reviewing previous steps or in review mode) -->
          <template v-if="!reviewingStep && !isReviewMode">

            <!-- Terminal step -->
            <template v-if="resolvedStepType === 'terminal'">
              <ScenarioVerifyResult
                :is-active="isActive"
                :is-verifying="isVerifying"
                :result="verifyResult"
                @verify="handleVerify"
              />
            </template>

            <!-- Flag step -->
            <ScenarioFlagSubmit
              v-else-if="resolvedStepType === 'flag'"
              v-model="flagValue"
              :is-active="isActive"
              :is-submitting="isSubmittingFlag"
              :result="flagResult"
              @submit="handleSubmitFlag"
            />

            <!-- Info step -->
            <div v-else-if="resolvedStepType === 'info'" class="info-step">
              <p class="info-subtitle">
                <i class="fas fa-book-open"></i>
                {{ t('scenarioPanel.infoSubtitle') }}
              </p>
              <div class="info-actions">
                <button
                  v-if="(currentStep!.step_order ?? 0) > 0"
                  class="btn-secondary"
                  @click="goToPreviousStep"
                >
                  <i class="fas fa-arrow-left"></i>
                  {{ t('scenarioPanel.previous') }}
                </button>
                <button
                  class="verify-btn"
                  :disabled="isVerifying || !isActive"
                  @click="ackInfoStep"
                >
                  <i :class="isVerifying ? 'fas fa-spinner fa-spin' : 'fas fa-check'"></i>
                  {{ isVerifying ? t('scenarioPanel.verifying') : t('scenarioPanel.infoAck') }}
                </button>
              </div>
              <div v-if="verifyResult && !verifyResult.passed" class="verify-result failed" role="status" aria-live="polite">
                <div class="verify-result-header">
                  <i class="fas fa-times-circle"></i>
                  <span>{{ verifyResult.output || t('scenarioPanel.failed') }}</span>
                </div>
              </div>
            </div>

            <!-- Quiz step -->
            <ScenarioQuizPanel
              v-else-if="resolvedStepType === 'quiz'"
              :step="currentStep!"
              :scenario-session-id="scenarioSessionId"
              :is-active="isActive"
              :is-submitting="isSubmittingQuiz"
              :result="quizResult"
              :submit-error="quizSubmitError"
              @submit="handleSubmitQuiz"
              @advance="advanceFromQuiz"
              @finish="finishFromQuiz"
              @retry="onQuizRetry"
            />

          </template>
        </div>

        <!-- Session actions (hidden when reviewing previous steps or in review mode) -->
        <div v-if="!reviewingStep && !isReviewMode" class="session-actions">
          <button
            class="abandon-btn"
            :disabled="!isActive"
            @click="handleAbandon"
          >
            <i class="fas fa-sign-out-alt"></i>
            {{ t('scenarioPanel.abandon') }}
          </button>
        </div>
      </template>

      <!-- No scenario state -->
      <div v-else class="panel-empty">
        <i class="fas fa-info-circle"></i>
        <span>{{ t('scenarioPanel.noScenario') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, type Ref } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { useNotification } from '../../composables/useNotification'
import { useScenarioSession } from '../../composables/useScenarioSession'
import { scenarioSessionService } from '../../services/domain/scenario'
import ScenarioElapsedTimer from './ScenarioElapsedTimer.vue'
import ScenarioVerifyResult from './ScenarioVerifyResult.vue'
import ScenarioFlagSubmit from './ScenarioFlagSubmit.vue'
import ScenarioQuizPanel from './ScenarioQuizPanel.vue'
import ScenarioHintPanel from './ScenarioHintPanel.vue'
import type {
  VerifyStepResponse,
  SubmitFlagResponse,
  SubmitQuizResponse,
  ScenarioInfo
} from '../../services/domain/scenario'

interface Props {
  scenarioSessionId: string
  isActive: boolean
  sessionStatus?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  sessionStatus: null
})

const emit = defineEmits<{
  'session-completed': []
  'session-abandoned': []
  'session-abandon-failed': []
  'paste-command': [command: string]
  'scenario-info-loaded': [info: ScenarioInfo]
  'collapsed': [collapsed: boolean]
  'flag-validated': []
}>()

const isReviewMode = computed(() =>
  props.sessionStatus === 'completed' || props.sessionStatus === 'abandoned'
)

const { showConfirm, showError } = useNotification()

const { t } = useTranslations({
  en: {
    scenarioPanel: {
      title: 'Scenario',
      step: 'Step',
      verifying: 'Verifying...',
      failed: 'Not quite right. Check the output and try again.',
      abandon: 'Abandon Scenario',
      abandonConfirm: 'This session will be marked as abandoned. You can start a new attempt later.',
      abandonTitle: 'Abandon Scenario',
      confirmButtonText: 'Yes, abandon',
      abandonError: 'Failed to abandon scenario. The session is still active.',
      cancelButtonText: 'Cancel',
      completed: 'Scenario Completed!',
      completedMessage: 'Congratulations! You have completed all steps.',
      loading: 'Loading scenario...',
      error: 'Failed to load scenario data.',
      retry: 'Retry',
      noScenario: 'No active scenario',
      collapsePanel: 'Collapse panel',
      expandPanel: 'Expand panel',
      viewMyScenarios: 'View my scenarios',
      stepValidated: 'Step validated!',
      nextStep: 'Loading next step...',
      completionSummary: 'Your Results',
      stepsCompleted: 'Steps Completed',
      totalTime: 'Time Spent',
      reviewingStep: 'Reviewing step {step}',
      backToCurrent: 'Back to current step',
      sessionCompleted: 'Scenario Completed',
      sessionAbandoned: 'Scenario Abandoned',
      // Step type chips
      typeTerminal: 'Terminal',
      typeFlag: 'Flag',
      typeInfo: 'Reading',
      typeQuiz: 'Quiz',
      // Info step
      infoSubtitle: 'Reading — no exercise',
      infoAck: "I've read this, next",
      previous: 'Previous',
      // Quiz step
      quizSubmitError: 'Failed to submit your answers. Please try again.'
    }
  },
  fr: {
    scenarioPanel: {
      title: 'Scénario',
      step: 'Étape',
      verifying: 'Vérification...',
      failed: 'Pas tout à fait. Vérifiez la sortie et réessayez.',
      abandon: 'Abandonner le scénario',
      abandonConfirm: 'Cette session sera marquée comme abandonnée. Vous pourrez recommencer une nouvelle tentative plus tard.',
      abandonTitle: 'Abandonner le scénario',
      confirmButtonText: 'Oui, abandonner',
      abandonError: 'Échec de l\'abandon du scénario. La session est toujours active.',
      cancelButtonText: 'Annuler',
      completed: 'Scénario terminé !',
      completedMessage: 'Félicitations ! Vous avez terminé toutes les étapes.',
      loading: 'Chargement du scénario...',
      error: 'Échec du chargement des données du scénario.',
      retry: 'Réessayer',
      noScenario: 'Aucun scénario actif',
      collapsePanel: 'Replier le panneau',
      expandPanel: 'Déplier le panneau',
      viewMyScenarios: 'Voir mes scénarios',
      stepValidated: 'Étape validée !',
      nextStep: 'Chargement de l\'étape suivante...',
      completionSummary: 'Vos résultats',
      stepsCompleted: 'Étapes complétées',
      totalTime: 'Temps passé',
      reviewingStep: 'Révision de l\'étape {step}',
      backToCurrent: 'Retour à l\'étape en cours',
      sessionCompleted: 'Scénario terminé',
      sessionAbandoned: 'Scénario abandonné',
      // Step type chips
      typeTerminal: 'Terminal',
      typeFlag: 'Drapeau',
      typeInfo: 'Lecture',
      typeQuiz: 'Quiz',
      // Info step
      infoSubtitle: 'Lecture — pas d\'exercice',
      infoAck: 'J\'ai lu, suivant',
      previous: 'Précédent',
      // Quiz step
      quizSubmitError: 'Échec de l\'envoi de vos réponses. Réessayez.'
    }
  }
})

// Session/step DATA, loading, review-navigation and DOM helpers live in the
// composable; transient interaction state (verify/flag/quiz/hint) stays here.
const session = useScenarioSession(
  () => props.scenarioSessionId,
  {
    paste: (cmd) => emit('paste-command', cmd),
    scenarioInfoLoaded: (info) => emit('scenario-info-loaded', info)
  }
)
const {
  isLoading,
  loadError,
  isSessionCompleted,
  currentStep,
  totalSteps,
  scenarioInfo,
  sessionStartedAt,
  reviewingStep,
  stepContentRef,
  displayedStep,
  renderedDisplayedStepText,
  resolvedStepType,
  hasProgressiveHints,
  renderedFinishText,
  navigateToStep,
  backToCurrentStep,
  goToPreviousStep,
  handleExecClick
} = session

// State
const isCollapsed = ref(false)
const showHint = ref(false)

// Progressive hints state
const revealedHints = ref<Array<{ level: number; content: string }>>([])
const isRevealingHint = ref(false)

// Track whether we already auto-expanded the hint for the current step
const hintAutoShown = ref(false)

// Verify state
const isVerifying = ref(false)
const verifyResult = ref<VerifyStepResponse | null>(null)

// Flag state
const flagValue = ref('')
const isSubmittingFlag = ref(false)
const flagResult = ref<SubmitFlagResponse | null>(null)

// Step transition state
const isTransitioning = ref(false)
const transitionPhase = ref<'validated' | 'loading' | null>(null)

// Quiz state (submit orchestration; answer state lives in ScenarioQuizPanel)
const isSubmittingQuiz = ref(false)
const quizResult = ref<SubmitQuizResponse | null>(null)
const quizSubmitError = ref<string>('')

// Hint-nudge state (terminal step only): pulse hint button after 90s idle
const HINT_NUDGE_DELAY_MS = 90000
const hintNudgeActive = ref(false)
const hintNudgeTimer: Ref<ReturnType<typeof setTimeout> | null> = ref(null)
const hintNudgeDismissed = ref(false)

function startHintNudgeTimer() {
  stopHintNudgeTimer()
  hintNudgeActive.value = false
  if (hintNudgeDismissed.value) return
  hintNudgeTimer.value = setTimeout(() => {
    // Only pulse if a hint is still available and the user has not revealed any
    if (
      !hintNudgeDismissed.value &&
      hasProgressiveHints.value &&
      revealedHints.value.length === 0
    ) {
      hintNudgeActive.value = true
    }
  }, HINT_NUDGE_DELAY_MS)
}

function stopHintNudgeTimer() {
  if (hintNudgeTimer.value) {
    clearTimeout(hintNudgeTimer.value)
    hintNudgeTimer.value = null
  }
  hintNudgeActive.value = false
}

// Step counter label (e.g. "Step 2 / 5" or "Étape 2 / 5")
const stepCountLabel = computed(() => {
  if (!currentStep.value) return ''
  const current = currentStep.value.step_order + 1
  const total = totalSteps.value
  return `${t('scenarioPanel.step')} ${current} / ${total}`
})

// Scenario name for the panel header (falls back to generic title)
const scenarioName = computed(() => scenarioInfo.value?.title || scenarioInfo.value?.name || '')
// Formatted elapsed time for the completion summary
const formattedElapsedTime = computed(() => {
  if (!sessionStartedAt.value) return null
  const start = new Date(sessionStartedAt.value)
  const now = new Date()
  const diffMs = now.getTime() - start.getTime()
  const totalMinutes = Math.floor(diffMs / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0) return `${hours}h ${minutes}m`
  const seconds = Math.floor((diffMs % 60000) / 1000)
  return `${totalMinutes}m ${seconds}s`
})


interface StepTypeMeta {
  key: 'terminal' | 'flag' | 'info' | 'quiz'
  icon: string
  label: string
  color: string
  bg: string
}

const stepTypeMeta = computed<StepTypeMeta | null>(() => {
  if (!displayedStep.value) return null
  const map: Record<StepTypeMeta['key'], StepTypeMeta> = {
    terminal: {
      key: 'terminal',
      icon: 'fas fa-terminal',
      label: t('scenarioPanel.typeTerminal'),
      color: 'var(--scenario-node-terminal)',
      bg: 'var(--scenario-node-terminal-bg)'
    },
    flag: {
      key: 'flag',
      icon: 'fas fa-flag',
      label: t('scenarioPanel.typeFlag'),
      color: 'var(--scenario-node-flag)',
      bg: 'var(--scenario-node-flag-bg)'
    },
    info: {
      key: 'info',
      icon: 'fas fa-book-open',
      label: t('scenarioPanel.typeInfo'),
      color: 'var(--scenario-node-info)',
      bg: 'var(--scenario-node-info-bg)'
    },
    quiz: {
      key: 'quiz',
      icon: 'fas fa-question-circle',
      label: t('scenarioPanel.typeQuiz'),
      color: 'var(--scenario-node-quiz)',
      bg: 'var(--scenario-node-quiz-bg)'
    }
  }
  return map[resolvedStepType.value]
})

async function handleRevealNextHint() {
  if (isRevealingHint.value || !displayedStep.value) return
  isRevealingHint.value = true
  try {
    const nextLevel = revealedHints.value.length + 1
    const result = await scenarioSessionService.revealHint(
      props.scenarioSessionId,
      displayedStep.value.step_order,
      nextLevel
    )
    revealedHints.value.push({ level: result.level, content: result.content })
    // Dismiss the hint-nudge for the rest of the session once a hint has been revealed
    hintNudgeDismissed.value = true
    stopHintNudgeTimer()
  } catch (err: any) {
    console.error('Failed to reveal hint:', err)
  } finally {
    isRevealingHint.value = false
  }
}

// When entering review of a past step, reset the hint UI and load that step's
// already-revealed hints (the composable owns the step fetch + DOM refresh;
// hint state stays here). Clearing review (back to current) just hides the hint.
watch(reviewingStep, async (step) => {
  showHint.value = false
  if (!step) return
  revealedHints.value = []
  if (step.hints_total_count > 0 && step.hints_revealed > 0) {
    for (let level = 1; level <= step.hints_revealed; level++) {
      try {
        const hint = await scenarioSessionService.revealHint(
          props.scenarioSessionId, step.step_order, level
        )
        revealedHints.value.push({ level: hint.level, content: hint.content })
      } catch {
        break
      }
    }
  }
})

// Load collapse state from localStorage
const COLLAPSE_KEY = 'scenario_panel_collapsed'
const savedCollapsed = localStorage.getItem(COLLAPSE_KEY)
if (savedCollapsed !== null) {
  isCollapsed.value = savedCollapsed === 'true'
}

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
  localStorage.setItem(COLLAPSE_KEY, String(isCollapsed.value))
  emit('collapsed', isCollapsed.value)
}


async function loadCurrentStep() {
  // Transient interaction state lives in the component — reset it here.
  verifyResult.value = null
  flagResult.value = null
  flagValue.value = ''
  showHint.value = false
  hintAutoShown.value = false
  revealedHints.value = []
  reviewingStep.value = null
  quizResult.value = null
  quizSubmitError.value = ''
  hintNudgeDismissed.value = false
  stopHintNudgeTimer()

  // The composable owns the step DATA load + DOM refresh and returns the step.
  const step = await session.loadStepData({ skipSpinner: isTransitioning.value })
  isTransitioning.value = false
  transitionPhase.value = null

  if (step) {
    // Load already-revealed progressive hints
    if (step.hints_total_count > 0 && step.hints_revealed > 0) {
      for (let level = 1; level <= step.hints_revealed; level++) {
        try {
          const hint = await scenarioSessionService.revealHint(
            props.scenarioSessionId, step.step_order, level
          )
          revealedHints.value.push({ level: hint.level, content: hint.content })
        } catch {
          break
        }
      }
    }

    // Start the hint-nudge timer for terminal steps that still have an unrevealed hint
    if (resolvedStepType.value === 'terminal' && hasProgressiveHints.value && revealedHints.value.length === 0) {
      startHintNudgeTimer()
    }
  }
}

async function handleVerify() {
  if (isVerifying.value || !props.isActive) return

  isVerifying.value = true
  verifyResult.value = null

  try {
    const result = await scenarioSessionService.verifyStep(props.scenarioSessionId)
    verifyResult.value = result

    // Auto-reveal first hint on first failure
    if (!result.passed && !hintAutoShown.value) {
      if (hasProgressiveHints.value && revealedHints.value.length === 0) {
        handleRevealNextHint()
        hintAutoShown.value = true
      } else if (currentStep.value?.hint) {
        showHint.value = true
        hintAutoShown.value = true
      }
    }

    if (result.passed) {
      if (result.next_step) {
        // Show full-panel "Step validated!" then load next step
        isTransitioning.value = true
        transitionPhase.value = 'validated'
        setTimeout(() => {
          transitionPhase.value = 'loading'
          loadCurrentStep()
        }, 2000)
      } else {
        // No next step means scenario is completed
        isSessionCompleted.value = true
        emit('session-completed')
      }
    }
  } catch (err: any) {
    console.error('Verify step failed:', err)
    verifyResult.value = {
      passed: false,
      output: err.response?.data?.error_message || err.message
    }
  } finally {
    isVerifying.value = false
  }
}

async function handleSubmitFlag() {
  if (!flagValue.value.trim() || isSubmittingFlag.value || !props.isActive) return

  isSubmittingFlag.value = true
  flagResult.value = null

  try {
    const result = await scenarioSessionService.submitFlag(props.scenarioSessionId, flagValue.value.trim())
    flagResult.value = result

    // Auto-reveal first hint on first failure
    if (!result.correct && !hintAutoShown.value) {
      if (hasProgressiveHints.value && revealedHints.value.length === 0) {
        handleRevealNextHint()
        hintAutoShown.value = true
      } else if (currentStep.value?.hint) {
        showHint.value = true
        hintAutoShown.value = true
      }
    }

    if (result.correct) {
      emit('flag-validated')
      if (result.next_step !== undefined && result.next_step !== null) {
        // Show full-panel "Step validated!" then load next step
        isTransitioning.value = true
        transitionPhase.value = 'validated'
        setTimeout(() => {
          transitionPhase.value = 'loading'
          loadCurrentStep()
        }, 2000)
      } else {
        // Last step completed — show completion screen
        isSessionCompleted.value = true
        emit('session-completed')
      }
    }
  } catch (err: any) {
    console.error('Submit flag failed:', err)
    flagResult.value = {
      correct: false,
      message: err.response?.data?.error_message || err.message
    }
  } finally {
    isSubmittingFlag.value = false
  }
}

async function handleAbandon() {
  if (!props.isActive) return

  const confirmed = await showConfirm(
    t('scenarioPanel.abandonConfirm'),
    t('scenarioPanel.abandonTitle'),
    {
      type: 'warning',
      confirmButtonText: t('scenarioPanel.confirmButtonText'),
      cancelButtonText: t('scenarioPanel.cancelButtonText')
    }
  )

  if (!confirmed) return

  try {
    // Emit before the API call so the parent sets the end-state before
    // the backend stops the terminal (which closes the WebSocket)
    emit('session-abandoned')
    await scenarioSessionService.abandonSession(props.scenarioSessionId)
  } catch (err: any) {
    // Revert: re-emit to restore active state since abandon failed
    emit('session-abandon-failed')
    showError(err.response?.data?.error_message || err.message || t('scenarioPanel.abandonError'))
  }
}

// Info step: acknowledgement is handled by the existing verify endpoint —
// the backend now auto-advances info steps on verify.
async function ackInfoStep() {
  if (isVerifying.value || !props.isActive) return
  await handleVerify()
}

async function handleSubmitQuiz(payload: Record<string, string>) {
  if (isSubmittingQuiz.value || !props.isActive) return
  isSubmittingQuiz.value = true
  quizSubmitError.value = ''
  try {
    const result = await scenarioSessionService.submitQuiz(props.scenarioSessionId, payload)
    quizResult.value = result

    // Auto-advance only in exam mode (show_immediate_feedback=false).
    // In learning mode the student stays on the results screen and clicks
    // "Next step" or "Finish" themselves so they can read the breakdown.
    if (currentStep.value?.show_immediate_feedback) {
      return
    }

    if (result.next_step !== undefined && result.next_step !== null) {
      isTransitioning.value = true
      transitionPhase.value = 'validated'
      setTimeout(() => {
        transitionPhase.value = 'loading'
        loadCurrentStep()
      }, 2000)
    } else {
      // Last step submitted in exam mode — show completion after a brief
      // pause so the student can read their score.
      setTimeout(() => {
        isSessionCompleted.value = true
        emit('session-completed')
      }, 2000)
    }
  } catch (err: any) {
    console.error('Submit quiz failed:', err)
    quizSubmitError.value =
      err.response?.data?.error_message ||
      err.response?.data?.message ||
      err.message ||
      t('scenarioPanel.quizSubmitError')
  } finally {
    isSubmittingQuiz.value = false
  }
}

// Learning-mode quiz: student retakes the quiz (child resets its own answer
// state + storage on retry); the parent just clears the graded result.
function onQuizRetry() {
  quizResult.value = null
  quizSubmitError.value = ''
}

// Learning-mode quiz: student manually advances after reading the breakdown.
function advanceFromQuiz() {
  if (!quizResult.value) return
  isTransitioning.value = true
  transitionPhase.value = 'validated'
  setTimeout(() => {
    transitionPhase.value = 'loading'
    loadCurrentStep()
  }, 600)
}

function finishFromQuiz() {
  isSessionCompleted.value = true
  emit('session-completed')
}

// Watch for session ID changes to reload
watch(() => props.scenarioSessionId, () => {
  if (props.scenarioSessionId) {
    loadCurrentStep()
  }
})

onMounted(() => {
  if (props.scenarioSessionId) {
    loadCurrentStep()
  }
})

onBeforeUnmount(() => {
  stopHintNudgeTimer()
})

defineExpose({
  toggleCollapse,
  isCollapsed
})
</script>

<style scoped src="./scenarioPanel.css"></style>

<!-- Shared scenario-panel styles (unscoped; every selector is prefixed with
     `.scenario-panel ` so it stays contained to the panel subtree). -->
<style src="./scenarioPanel.shared.css"></style>
