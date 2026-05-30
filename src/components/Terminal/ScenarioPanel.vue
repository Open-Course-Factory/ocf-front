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
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick, type Ref } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { useNotification } from '../../composables/useNotification'
import { renderKillercodaMarkdown, loadScenarioImages, revokeScenarioImageUrls } from '../../utils/killercodaMarkdown'
import { scenarioSessionService } from '../../services/domain/scenario'
import ScenarioElapsedTimer from './ScenarioElapsedTimer.vue'
import ScenarioVerifyResult from './ScenarioVerifyResult.vue'
import ScenarioFlagSubmit from './ScenarioFlagSubmit.vue'
import ScenarioQuizPanel from './ScenarioQuizPanel.vue'
import ScenarioHintPanel from './ScenarioHintPanel.vue'
import type {
  CurrentStepResponse,
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
      copyCode: 'Copy',
      codeCopied: 'Copied!',
      pasteToTerminal: 'Paste to terminal',
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
      copyCode: 'Copier',
      codeCopied: 'Copié !',
      pasteToTerminal: 'Coller dans le terminal',
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

// State
const isCollapsed = ref(false)
const isLoading = ref(false)
const loadError = ref(false)
const isSessionCompleted = ref(false)
const currentStep = ref<CurrentStepResponse | null>(null)
const totalSteps = ref(0)
const showHint = ref(false)

// Progressive hints state
const revealedHints = ref<Array<{ level: number; content: string }>>([])
const isRevealingHint = ref(false)

// Scenario metadata
const scenarioInfo = ref<ScenarioInfo | null>(null)

// Session timing (for completion summary)
const sessionStartedAt = ref<string | null>(null)

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

// Step review navigation state
const reviewingStep = ref<CurrentStepResponse | null>(null)
const isLoadingReview = ref(false)

// Ref for step content container (for copy-to-clipboard injection)
const stepContentRef = ref<HTMLElement | null>(null)

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

// Rendered finish_text (markdown) for the completion screen
const renderedFinishText = computed(() => {
  if (!scenarioInfo.value?.finish_text) return ''
  return renderKillercodaMarkdown(scenarioInfo.value.finish_text)
})

// The displayed step: either the review step or the current step
const displayedStep = computed(() => reviewingStep.value || currentStep.value)

// Rendered markdown for the displayed step
const renderedDisplayedStepText = computed(() => {
  if (!displayedStep.value?.text) return ''
  return renderKillercodaMarkdown(displayedStep.value.text)
})

const hasProgressiveHints = computed(() => {
  return displayedStep.value && displayedStep.value.hints_total_count > 0
})

// Resolve the step type with backward-compat for legacy data: when step_type is empty,
// fall back to has_flag-driven detection (flag vs terminal).
const resolvedStepType = computed<'terminal' | 'flag' | 'info' | 'quiz'>(() => {
  const st = displayedStep.value?.step_type
  if (st === 'terminal' || st === 'flag' || st === 'info' || st === 'quiz') return st
  return displayedStep.value?.has_flag ? 'flag' : 'terminal'
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

// Navigate to a specific step for review
async function navigateToStep(stepOrder: number) {
  // If clicking the current step, exit review mode
  if (currentStep.value && stepOrder === currentStep.value.step_order) {
    reviewingStep.value = null
    return
  }
  isLoadingReview.value = true
  try {
    const step = await scenarioSessionService.getStepByOrder(props.scenarioSessionId, stepOrder)
    if (step) {
      reviewingStep.value = step
      showHint.value = false
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
      // Load images and copy buttons after review step renders
      await nextTick()
      if (stepContentRef.value) {
        addCopyButtons(stepContentRef.value)
        revokeScenarioImageUrls()
        if (scenarioInfo.value?.id && step.step_order !== undefined) {
          const stepDir = `step${step.step_order + 1}`
          loadScenarioImages(stepContentRef.value, scenarioInfo.value.id, stepDir)
        }
      }
    }
  } catch (err) {
    console.warn('Could not load step for review:', err)
  } finally {
    isLoadingReview.value = false
  }
}

function backToCurrentStep() {
  reviewingStep.value = null
  showHint.value = false
}

// Load scenario metadata (name, description) from the API
async function loadScenarioInfo() {
  try {
    const session = await scenarioSessionService.getSessionInfo(props.scenarioSessionId)
    if (session?.started_at) {
      sessionStartedAt.value = session.started_at
    }
    if (session?.scenario_id) {
      scenarioInfo.value = await scenarioSessionService.getScenario(session.scenario_id)
      if (scenarioInfo.value) {
        emit('scenario-info-loaded', scenarioInfo.value)
      }
    }
  } catch (err) {
    // Non-critical: scenario name is a nice-to-have, fall back to generic title
    console.warn('Could not load scenario info:', err)
  }
}

// Handle clicks on {{exec}} commands (event delegation on markdown containers)
function handleExecClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (target.classList.contains('exec-command')) {
    const command = target.textContent?.trim()
    if (command) {
      emit('paste-command', command)
    }
  }
  if (target.classList.contains('copy-command')) {
    const text = target.textContent?.trim()
    if (text) {
      navigator.clipboard.writeText(text)
      target.classList.add('copied')
      setTimeout(() => target.classList.remove('copied'), 1500)
    }
  }
}

// Add copy-to-clipboard and paste-to-terminal buttons to <pre><code> blocks
function addCopyButtons(container: HTMLElement) {
  const preBlocks = container.querySelectorAll('pre')
  preBlocks.forEach(pre => {
    // Skip if already processed
    if (pre.parentElement?.classList.contains('code-block-wrapper')) return

    const wrapper = document.createElement('div')
    wrapper.className = 'code-block-wrapper'

    const code = pre.querySelector('code')
    const text = (code?.textContent || pre.textContent || '').trim()

    // Copy button
    const copyBtn = document.createElement('button')
    copyBtn.className = 'copy-code-btn'
    copyBtn.type = 'button'
    copyBtn.innerHTML = `<i class="fas fa-copy"></i> <span>${t('scenarioPanel.copyCode')}</span>`
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(text)
        copyBtn.innerHTML = `<i class="fas fa-check"></i> <span>${t('scenarioPanel.codeCopied')}</span>`
        copyBtn.classList.add('copied')
        setTimeout(() => {
          copyBtn.innerHTML = `<i class="fas fa-copy"></i> <span>${t('scenarioPanel.copyCode')}</span>`
          copyBtn.classList.remove('copied')
        }, 2000)
      } catch {
        console.warn('Clipboard API not available')
      }
    })

    // Paste-to-terminal button (for single-line commands, or exec-block marked blocks)
    const isExecBlock = pre.classList.contains('exec-block')
    const isSingleLine = !text.includes('\n')
    if ((isSingleLine || isExecBlock) && text.length > 0) {
      const pasteBtn = document.createElement('button')
      pasteBtn.className = 'paste-terminal-btn'
      pasteBtn.type = 'button'
      pasteBtn.innerHTML = `<i class="fas fa-terminal"></i>`
      pasteBtn.title = t('scenarioPanel.pasteToTerminal')
      pasteBtn.addEventListener('click', () => {
        emit('paste-command', text)
      })
      wrapper.appendChild(pasteBtn)
    }

    pre.parentNode?.insertBefore(wrapper, pre)
    wrapper.appendChild(pre)
    wrapper.appendChild(copyBtn)
  })
}

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
  if (!isTransitioning.value) {
    isLoading.value = true
  }
  loadError.value = false
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

  try {
    const step = await scenarioSessionService.getCurrentStep(props.scenarioSessionId)
    currentStep.value = step

    // Use total_steps from backend (fixed count, not client-side tracking)
    if (step.total_steps) {
      totalSteps.value = step.total_steps
    }

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

    // If the step status indicates session is completed
    if (step.status === 'completed' && !step.title) {
      isSessionCompleted.value = true
    }

    // Load scenario info once (for name/description display and image loading)
    if (!scenarioInfo.value) {
      await loadScenarioInfo()
    }

  } catch (err: any) {
    console.error('Failed to load scenario step:', err)
    // If 404 or specific status, might mean session is completed
    if (err.response?.status === 404 || err.response?.data?.status === 'completed') {
      isSessionCompleted.value = true
    } else {
      loadError.value = true
    }
  } finally {
    isLoading.value = false
    isTransitioning.value = false
    transitionPhase.value = null
  }

  // After loading spinner is hidden and step content is rendered,
  // inject copy buttons and load images
  await nextTick()
  if (stepContentRef.value) {
    addCopyButtons(stepContentRef.value)
    revokeScenarioImageUrls()
    if (scenarioInfo.value?.id && currentStep.value?.step_order !== undefined) {
      const stepDir = `step${currentStep.value.step_order + 1}`
      loadScenarioImages(stepContentRef.value, scenarioInfo.value.id, stepDir)
    }
  }

  // Start the hint-nudge timer for terminal steps that still have an unrevealed hint
  if (resolvedStepType.value === 'terminal' && hasProgressiveHints.value && revealedHints.value.length === 0) {
    startHintNudgeTimer()
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

// Navigate back to the previous step for review (info step "Previous" button)
async function goToPreviousStep() {
  if (!currentStep.value) return
  const targetOrder = currentStep.value.step_order - 1
  if (targetOrder < 0) return
  await navigateToStep(targetOrder)
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
  revokeScenarioImageUrls()
})

defineExpose({
  toggleCollapse,
  isCollapsed
})
</script>

<style scoped>
.scenario-panel {
  position: relative;
  width: 350px;
  min-width: 350px;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-primary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  transition: width var(--transition-slow), min-width var(--transition-slow);
}

.scenario-panel.collapsed {
  width: 0 !important;
  min-width: 0 !important;
  border: none;
}

/* Collapse toggle button */
.collapse-toggle {
  position: absolute;
  top: 28%;
  left: 0;
  transform: translate(-50%, -50%);
  z-index: 10;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-primary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: var(--font-size-xs);
  transition: all var(--transition-fast);
}

.collapse-toggle:hover {
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border-color: var(--color-border-medium);
}

.collapsed .collapse-toggle {
  left: 0;
}


/* Panel content */
.panel-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border-radius: inherit;
}

/* Panel header */
.panel-header {
  padding: var(--spacing-sm) var(--spacing-md);
  min-height: var(--panel-header-min-height);
  display: flex;
  align-items: center;
  background: var(--color-bg-secondary);
  border-bottom: var(--border-width-thin) solid var(--color-border-light);
  flex-shrink: 0;
}

.panel-title {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.panel-title i {
  color: var(--color-primary);
  font-size: var(--font-size-sm);
}

/* Review mode banner */
.review-mode-banner {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border-bottom: var(--border-width-thin) solid var(--color-border-light);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.review-mode-banner .fa-check-circle {
  color: var(--color-success);
}

.review-mode-banner .fa-times-circle {
  color: var(--color-danger);
}

/* Progress bar wrapper */
.progress-bar {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  border-bottom: var(--border-width-thin) solid var(--color-border-light);
  flex-shrink: 0;
}

.progress-bar-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.progress-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
}

/* Progress dots */
.progress-dots {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.progress-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--border-radius-full);
  background: var(--color-gray-300);
  transition: all var(--transition-fast);
}

.progress-dot.completed {
  background: var(--color-success);
}

.progress-dot.active {
  background: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
  animation: pulse-dot 2s ease-in-out infinite;
}

.progress-dot.locked {
  background: var(--color-gray-300);
}

.progress-dot.clickable {
  cursor: pointer;
}

.progress-dot.clickable:hover {
  transform: scale(1.4);
  box-shadow: 0 0 0 2px var(--color-primary-light);
}

.progress-dot.reviewing {
  box-shadow: 0 0 0 3px var(--color-info);
  animation: none;
}

@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 3px var(--color-primary-light); }
  50% { box-shadow: 0 0 0 5px var(--color-primary-light); }
}

/* Review mode banner */
.review-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--color-info-bg);
  border-bottom: var(--border-width-thin) solid var(--color-info-border);
  flex-shrink: 0;
}

.review-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-info-text);
}

.back-to-current-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 2px var(--spacing-sm);
  background: transparent;
  border: var(--border-width-thin) solid var(--color-info-border);
  border-radius: var(--border-radius-sm);
  color: var(--color-info-text);
  font-size: var(--font-size-xs);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.back-to-current-btn:hover {
  background: var(--color-info);
  color: var(--color-white);
}

/* Step content */
.step-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.step-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.step-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.step-title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.step-text {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
  color: var(--color-text-secondary);
}

/* Session actions */
.session-actions {
  padding: var(--spacing-md);
  border-top: var(--border-width-thin) solid var(--color-border-light);
  flex-shrink: 0;
}

.abandon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  width: 100%;
  padding: var(--spacing-xs) var(--spacing-md);
  background: transparent;
  color: var(--color-danger);
  border: var(--border-width-thin) solid var(--color-danger);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.abandon-btn:hover:not(:disabled) {
  background: var(--color-danger-bg);
  border-color: var(--color-danger-hover);
}

.abandon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Loading, error, empty, completed states */
.panel-loading,
.panel-error,
.panel-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-2xl) var(--spacing-md);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  text-align: center;
}

.panel-loading i {
  color: var(--color-primary);
  font-size: var(--font-size-lg);
}

.panel-error i {
  color: var(--color-danger);
  font-size: var(--font-size-lg);
}

.retry-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-md);
  background: transparent;
  color: var(--color-primary);
  border: var(--border-width-thin) solid var(--color-primary);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.retry-btn:hover {
  background: var(--color-primary);
  color: var(--color-white);
}

.retry-btn i {
  color: inherit;
  font-size: var(--font-size-sm);
}

.panel-empty i {
  font-size: var(--font-size-lg);
}

.panel-completed {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-2xl) var(--spacing-md);
  text-align: center;
}

.completed-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-success-bg);
  border-radius: var(--border-radius-full);
}

.completed-icon i {
  font-size: var(--font-size-2xl);
  color: var(--color-success);
}

.panel-completed h4 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-success);
}

.panel-completed p {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
}

.finish-text {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  text-align: left;
  width: 100%;
}

.completion-summary {
  width: 100%;
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  text-align: left;
}

.completion-summary-title {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.completion-summary-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.summary-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.summary-item i {
  color: var(--color-success);
  font-size: var(--font-size-sm);
  width: 16px;
  text-align: center;
  flex-shrink: 0;
}

.summary-label {
  flex: 1;
}

.summary-value {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.view-results-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--color-primary);
  color: var(--color-white);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  transition: all var(--transition-fast);
}

.view-results-link:hover {
  opacity: 0.9;
}

.abandon-btn:focus-visible {
  outline: 2px solid var(--color-danger);
  outline-offset: 2px;
}

.intro-toggle:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Copy-to-clipboard code block wrapper (injected via DOM after v-html render) */
.step-content :deep(.code-block-wrapper) {
  position: relative;
}

.step-content :deep(.copy-code-btn) {
  position: absolute;
  top: var(--spacing-xs);
  right: var(--spacing-xs);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px var(--spacing-xs);
  background: var(--color-bg-secondary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-sm);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  cursor: pointer;
  opacity: 0;
  transition: opacity var(--transition-fast), background var(--transition-fast);
  z-index: 1;
}

.step-content :deep(.code-block-wrapper:hover .copy-code-btn) {
  opacity: 1;
}

.step-content :deep(.copy-code-btn:hover) {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.step-content :deep(.copy-code-btn.copied) {
  color: var(--color-success);
  border-color: var(--color-success-border);
}

.step-content :deep(.paste-terminal-btn) {
  position: absolute;
  bottom: var(--spacing-xs);
  right: var(--spacing-xs);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: var(--color-primary);
  border: none;
  border-radius: var(--border-radius-sm);
  color: var(--color-white);
  font-size: var(--font-size-xs);
  cursor: pointer;
  opacity: 0;
  transition: opacity var(--transition-fast), background var(--transition-fast);
  z-index: 1;
}

.step-content :deep(.code-block-wrapper:hover .paste-terminal-btn) {
  opacity: 1;
}

.step-content :deep(.paste-terminal-btn:hover) {
  background: var(--color-primary-hover);
}

/* Markdown content styles (v-html requires :deep for scoped styles) */
.markdown-content :deep(p) {
  margin: var(--spacing-xs) 0;
}

.markdown-content :deep(p:first-child) {
  margin-top: 0;
}

.markdown-content :deep(p:last-child) {
  margin-bottom: 0;
}

.markdown-content :deep(pre) {
  background: var(--color-bg-tertiary, rgba(0, 0, 0, 0.2));
  border-radius: var(--border-radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  overflow-x: auto;
  margin: var(--spacing-sm) 0;
}

.markdown-content :deep(code) {
  font-family: var(--font-family-monospace, monospace);
  font-size: var(--font-size-xs);
}

/* KillerCoda {{exec}} clickable inline commands */
.markdown-content :deep(.exec-command) {
  cursor: pointer;
  border-bottom: 1px dashed var(--color-primary);
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.markdown-content :deep(.exec-command:hover) {
  background-color: var(--color-primary-light, rgba(0, 123, 255, 0.15));
  color: var(--color-primary);
}

.markdown-content :deep(.copy-command) {
  cursor: pointer;
  border-bottom: 1px dashed var(--color-text-secondary);
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.markdown-content :deep(.copy-command:hover) {
  background-color: var(--color-bg-tertiary, rgba(0, 0, 0, 0.15));
}

.markdown-content :deep(.copy-command.copied) {
  background-color: var(--color-success-light, rgba(40, 167, 69, 0.15));
  border-color: var(--color-success, #28a745);
}

.markdown-content :deep(p code),
.markdown-content :deep(li code) {
  background: var(--color-bg-tertiary, rgba(0, 0, 0, 0.2));
  padding: 2px 6px;
  border-radius: var(--border-radius-sm);
}

.markdown-content :deep(pre code) {
  background: none;
  padding: 0;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4) {
  margin: var(--spacing-sm) 0 var(--spacing-xs);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
}

.markdown-content :deep(h1) { font-size: var(--font-size-lg); }
.markdown-content :deep(h2) { font-size: var(--font-size-md); }
.markdown-content :deep(h3) { font-size: var(--font-size-sm); }
.markdown-content :deep(h4) { font-size: var(--font-size-sm); }

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: var(--spacing-xs) 0;
  padding-left: var(--spacing-lg);
}

.markdown-content :deep(li) {
  margin: var(--spacing-xs) 0;
}

.markdown-content :deep(a) {
  color: var(--color-primary);
  text-decoration: underline;
}

.markdown-content :deep(a:hover) {
  color: var(--color-primary-hover);
}

.markdown-content :deep(strong) {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.markdown-content :deep(em) {
  font-style: italic;
}

.markdown-content :deep(blockquote) {
  margin: var(--spacing-sm) 0;
  padding: var(--spacing-xs) var(--spacing-md);
  border-left: 3px solid var(--color-primary);
  background: var(--color-bg-tertiary, rgba(0, 0, 0, 0.1));
  border-radius: 0 var(--border-radius-sm) var(--border-radius-sm) 0;
}

.markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: var(--spacing-sm) 0;
  font-size: var(--font-size-xs);
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  padding: var(--spacing-xs) var(--spacing-sm);
  border: var(--border-width-thin) solid var(--color-border-light);
  text-align: left;
}

.markdown-content :deep(th) {
  background: var(--color-bg-secondary);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.markdown-content :deep(hr) {
  border: none;
  border-top: var(--border-width-thin) solid var(--color-border-light);
  margin: var(--spacing-sm) 0;
}

.markdown-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: var(--border-radius-sm);
}

/* Step transition — validated phase */
.transition-validated {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
}

.validated-icon {
  font-size: 2.5rem;
  color: var(--color-success);
  animation: validated-pop 0.4s ease-out;
}

@keyframes validated-pop {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

.validated-text {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-success);
}

/* Step transition — loading phase */
.panel-transitioning {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl) var(--spacing-md);
  flex: 1;
}

.transition-animation {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  width: 100%;
  max-width: 200px;
}

.transition-progress {
  width: 100%;
  height: 4px;
  background: var(--color-bg-tertiary);
  border-radius: var(--border-radius-full);
  overflow: hidden;
}

.transition-bar {
  height: 100%;
  width: 40%;
  background: var(--color-primary);
  border-radius: var(--border-radius-full);
  animation: transition-slide 1.2s ease-in-out infinite;
}

@keyframes transition-slide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(350%); }
}

.transition-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.transition-icon {
  color: var(--color-primary);
  animation: transition-bounce 1s ease-in-out infinite;
}

@keyframes transition-bounce {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(4px); }
}

.transition-text {
  font-weight: var(--font-weight-medium);
}

/* Step type chip */
.step-type-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin: var(--spacing-sm) var(--spacing-md) 0;
  padding: 2px var(--spacing-sm);
  background: var(--step-type-bg, var(--color-bg-secondary));
  color: var(--step-type-color, var(--color-text-muted));
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  align-self: flex-start;
  width: fit-content;
}

.step-type-chip i {
  font-size: 0.85em;
}

/* Info step */
.info-step {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.info-subtitle {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin: 0;
  font-size: var(--font-size-xs);
  font-style: italic;
  color: var(--color-text-muted);
}

.info-subtitle i {
  color: var(--scenario-node-info);
}

.info-actions {
  display: flex;
  gap: var(--spacing-sm);
  align-items: stretch;
}

/* Responsive breakpoints */
@media (max-width: 768px) {
  .scenario-panel {
    width: 250px;
    min-width: 250px;
  }

  .collapse-toggle {
    width: 28px;
    height: 28px;
  }
}

@media (max-width: 480px) {
  .scenario-panel {
    width: 100% !important;
    min-width: 100% !important;
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 20;
    border-radius: 0;
  }

  .scenario-panel.collapsed {
    /* When collapsed on mobile, fully hide the overlay */
    width: 0 !important;
    min-width: 0 !important;
  }

  .collapse-toggle {
    /* Make the toggle more prominent on mobile overlay */
    width: 36px;
    height: 36px;
    font-size: var(--font-size-sm);
    background-color: var(--color-primary);
    color: var(--color-white);
    border-color: var(--color-primary);
    box-shadow: var(--shadow-md);
  }

  .collapse-toggle:hover {
    background-color: var(--color-primary-hover);
    color: var(--color-white);
    border-color: var(--color-primary-hover);
  }

  .panel-header {
    padding: var(--spacing-sm) var(--spacing-md);
    padding-right: var(--spacing-xs);
  }
}
</style>

<!-- Shared scenario-panel styles (unscoped; every selector is prefixed with
     `.scenario-panel ` so it stays contained to the panel subtree). -->
<style src="./scenarioPanel.shared.css"></style>
