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
      <div v-else-if="loadError" class="panel-error" data-testid="scenario-panel-error">
        <i class="fas fa-exclamation-triangle"></i>
        <span>{{ t('scenarioPanel.error') }}</span>
        <button class="retry-btn" @click="loadCurrentStep">
          <i class="fas fa-redo"></i>
          {{ t('scenarioPanel.retry') }}
        </button>
      </div>

      <!-- Next-step preparation failed. Deliberately not styled like the generic
           load error above: in a challenge scenario a broken-looking machine IS
           the exercise, so this state has to read as infrastructure rather than
           content, or learners keep hunting on a machine that cannot be solved.

           The retry re-runs the setup that failed — reloading the step would
           only re-fetch the description of a level whose environment was never
           built. -->
      <div v-else-if="provisioningError" class="panel-error panel-error--infra" data-testid="scenario-step-preparing-error">
        <i class="fas fa-server"></i>
        <p class="panel-error-title">{{ t('scenarioPanel.preparingFailedTitle') }}</p>
        <p class="panel-error-body">{{ t('scenarioPanel.preparingFailedBody') }}</p>
        <button
          class="retry-btn"
          data-testid="scenario-step-preparing-retry"
          :disabled="isRetryingProvisioning"
          @click="retryStepProvisioning"
        >
          <i class="fas" :class="isRetryingProvisioning ? 'fa-circle-notch fa-spin' : 'fa-redo'"></i>
          {{ isRetryingProvisioning ? t('scenarioPanel.preparingRetrying') : t('scenarioPanel.preparingRetry') }}
        </button>
      </div>

      <!-- Completed state -->
      <div v-else-if="isSessionCompleted" class="panel-completed" data-testid="scenario-completed">
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
        <template v-if="transitionState === 'validated'">
          <div class="transition-validated">
            <i class="fas fa-check-circle validated-icon"></i>
            <span class="validated-text">{{ t('scenarioPanel.stepValidated') }}</span>
          </div>
        </template>
        <!-- Phase 2 (async next step): preparing the environment -->
        <template v-else-if="transitionState === 'provisioning'">
          <div class="transition-provisioning" data-testid="scenario-step-preparing">
            <i class="fas fa-check-circle validated-icon"></i>
            <span class="transition-provisioning-title">{{ t('scenarioPanel.preparingNextStep') }}</span>
            <p class="transition-provisioning-hint">{{ t('scenarioPanel.preparingHint') }}</p>
            <ProvisioningPhaseList :phase="stepProvisioningPhase" :phases="['step_setup']" />
          </div>
        </template>
        <!-- Phase 3: Loading next step -->
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
          data-testid="scenario-step-type-chip"
          :class="`step-type-chip--${stepTypeMeta.key}`"
          :style="{ '--step-type-color': stepTypeMeta.color, '--step-type-bg': stepTypeMeta.bg } as any"
        >
          <i :class="stepTypeMeta.icon"></i>
          <span>{{ stepTypeMeta.label }}</span>
        </div>

        <!-- Review mode indicator -->
        <div v-if="reviewingStep" class="review-banner" data-testid="scenario-review-banner">
          <span class="review-label">
            <i class="fas fa-eye"></i>
            {{ t('scenarioPanel.reviewingStep', { step: stepPosition(reviewingStep) }) }}
          </span>
          <button class="back-to-current-btn" data-testid="scenario-back-to-current" @click="backToCurrentStep">
            <i class="fas fa-arrow-left"></i>
            {{ t('scenarioPanel.backToCurrent') }}
          </button>
        </div>

        <!-- Step content area -->
        <div
          ref="stepContentRef"
          class="step-content ocf-scroll-fade"
          :class="{ 'has-overflow': stepHasOverflow }"
          @click="handleExecClick"
          @scroll="checkStepFade"
        >
          <!-- Step title -->
          <div class="step-header">
            <span class="step-label">{{ t('scenarioPanel.step') }} {{ stepPosition(displayedStep) }}</span>
            <h4 class="step-title" data-testid="scenario-step-title">{{ displayedStep!.title }}</h4>
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

          <!-- Action area for the step types whose control belongs after the
               text (hidden when reviewing previous steps or in review mode).
               Terminal and flag controls live in the fixed footer instead. -->
          <template v-if="!reviewingStep && !isReviewMode">

            <!-- Info step -->
            <div v-if="resolvedStepType === 'info'" class="info-step">
              <p class="info-subtitle">
                <i class="fas fa-book-open"></i>
                {{ t('scenarioPanel.infoSubtitle') }}
              </p>
              <div class="info-actions">
                <button
                  v-if="currentPosition > 1"
                  class="btn-secondary"
                  @click="goToPreviousStep"
                >
                  <i class="fas fa-arrow-left"></i>
                  {{ t('scenarioPanel.previous') }}
                </button>
                <button
                  class="verify-btn"
                  data-testid="scenario-info-ack"
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

        <!-- Fixed step controls. They are not instructions, and keeping them in
             the scroll area pushed the step text down the panel and made the
             learner scroll past them to read. Out here they hold one position
             for the whole step, and the instructions start at the top. -->
        <div
          v-if="!reviewingStep && !isReviewMode && (resolvedStepType === 'terminal' || resolvedStepType === 'flag')"
          class="session-actions"
        >
          <div class="step-actions-row">
            <ScenarioVerifyResult
              v-if="resolvedStepType === 'terminal'"
              class="step-action-col"
              :is-active="isActive"
              :is-verifying="isVerifying"
              :result="verifyResult"
              @verify="handleVerify"
            />

            <ScenarioFlagSubmit
              v-else-if="resolvedStepType === 'flag'"
              class="step-action-col"
              v-model="flagValue"
              :is-active="isActive"
              :is-submitting="isSubmittingFlag"
              :result="flagResult"
              @submit="handleSubmitFlag"
            />

            <!-- The way out of a step the learner has made unwinnable: coins
                 deleted instead of moved, a timed mission missed, a file
                 mangled. Only the environment is rebuilt — earlier steps stand.
                 Quiz and info steps have no world to rebuild, so no button. -->
            <div class="step-reset step-action-col">
              <button
                class="step-reset-btn"
                :class="{ armed: resetArmed }"
                :disabled="!isActive || isResetting"
                data-testid="scenario-reset-step"
                :title="t('scenarioPanel.resetStepTitle')"
                @click="handleResetStep"
              >
                <i :class="isResetting ? 'fas fa-spinner fa-spin' : 'fas fa-rotate-left'"></i>
                <span>{{ isResetting ? t('scenarioPanel.resetting') : resetArmed ? t('scenarioPanel.resetConfirm') : t('scenarioPanel.resetStep') }}</span>
              </button>
              <!-- Reserved slot: the message must not push the controls around
                   when it appears. -->
              <p class="step-reset-note">{{ resetError || (resetArmed ? t('scenarioPanel.resetWarning') : '') }}</p>
            </div>
          </div>
        </div>

        <!-- Progress sits at the foot of the panel: it is a status line, not a
             heading, and it costs the instructions nothing there. -->
        <div class="progress-bar">
          <div class="progress-bar-top">
            <span class="progress-label">{{ stepCountLabel }}</span>
            <ScenarioElapsedTimer :started-at="sessionStartedAt" />
          </div>
          <div class="progress-dots" data-testid="scenario-progress-dots" role="status" :aria-label="stepCountLabel">
            <span
              v-for="n in totalSteps"
              :key="n"
              class="progress-dot"
              data-testid="scenario-progress-dot"
              :class="{
                completed: n < currentPosition,
                active: n === currentPosition,
                locked: n > currentPosition,
                clickable: n <= currentPosition,
                reviewing: reviewingStep && n === stepPosition(reviewingStep)
              }"
              @click="n <= currentPosition ? navigateToStep(orderForPosition(n)) : undefined"
            ></span>
          </div>
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
import ProvisioningPhaseList from './ProvisioningPhaseList.vue'
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
      preparingNextStep: 'Preparing the next step…',
      preparingHint: 'Installing what the next step needs. This usually takes a few seconds.',
      // Scenario-neutral on purpose: this panel serves every scenario, so the
      // copy says "step", never "level".
      preparingFailedTitle: 'The machine could not be prepared for this step.',
      preparingFailedBody: 'This is not a puzzle — setting up the step failed. Try again; if the error persists, report it to your trainer.',
      preparingRetry: 'Restart preparation',
      preparingRetrying: 'Preparing…',
      completionSummary: 'Your Results',
      stepsCompleted: 'Steps Completed',
      totalTime: 'Time Spent',
      resetStep: 'Reset step',
      resetConfirm: 'Reset — are you sure?',
      resetting: 'Rebuilding...',
      resetWarning: 'This rebuilds this step only. Earlier steps are kept.',
      resetFailed: 'Could not rebuild this step. Try again in a moment.',
      resetStepTitle: 'Rebuild this step if you have made it impossible to finish',
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
      preparingNextStep: 'Préparation de l\'étape suivante…',
      preparingHint: 'Installation des éléments nécessaires à l\'étape suivante. Cela prend généralement quelques secondes.',
      preparingFailedTitle: 'La machine n\'a pas pu être préparée pour cette étape.',
      preparingFailedBody: 'Ce n\'est pas une énigme — l\'installation de l\'étape a échoué. Réessayez ; si l\'erreur persiste, signalez-la à votre formateur.',
      preparingRetry: 'Relancer la préparation',
      preparingRetrying: 'Préparation…',
      completionSummary: 'Vos résultats',
      stepsCompleted: 'Étapes complétées',
      totalTime: 'Temps passé',
      resetStep: 'Réinitialiser étape',
      resetConfirm: 'Réinitialiser — c\'est sûr ?',
      resetting: 'Reconstruction...',
      resetWarning: 'Seule cette étape est reconstruite. Les précédentes sont conservées.',
      resetFailed: 'Reconstruction impossible. Réessayez dans un instant.',
      resetStepTitle: 'Reconstruire cette étape si vous l\'avez rendue impossible à terminer',
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
  stepHasOverflow,
  checkStepFade,
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


// Verify state
const isVerifying = ref(false)
const resetError = ref('')
const verifyResult = ref<VerifyStepResponse | null>(null)

// Flag state
const flagValue = ref('')
const isSubmittingFlag = ref(false)
const flagResult = ref<SubmitFlagResponse | null>(null)

// ---- Step transition ----
//
// One variable, not three. The advance moves through a small sequence — the
// validated check, then either an environment wait or straight to the next
// step — and 'failed' is one of its outcomes rather than a separate flag. Three
// booleans to describe one position meant every transition had to write all of
// them, and the failure path in particular had to remember to clear two.
type TransitionState = 'idle' | 'validated' | 'provisioning' | 'loading' | 'failed'
const transitionState = ref<TransitionState>('idle')

// The full-panel transition covers everything except the terminal states.
const isTransitioning = computed(
  () => transitionState.value !== 'idle' && transitionState.value !== 'failed'
)
const provisioningError = computed(() => transitionState.value === 'failed')

// ---- Per-step provisioning (async next-step preparation) ----
const STEP_PROVISION_POLL_MS = 2_000
// Poll ceiling when the backend states no timeout of its own. It must sit above
// whatever the backend allows a step script, so that the backend reaches
// setup_failed — an honest error — before the panel gives up on its own.
//
// It is a floor for that rule, not a statement of it: a step can declare
// background_timeout_seconds freely, so no constant here can be guaranteed
// above it. When the backend states its timeout we use that plus a margin,
// which is the case that actually holds the invariant; this value only covers
// a response that carried none.
const STEP_PROVISION_FALLBACK_CEILING_MS = 120_000
// Margin added on top of a backend-stated timeout for the same reason.
const STEP_PROVISION_MARGIN_MS = 30_000

const stepProvisioningPhase = ref('')
let stepProvisioningTimer: ReturnType<typeof setInterval> | null = null
let validatedHoldTimer: ReturnType<typeof setTimeout> | null = null

function stopStepProvisioningPoll() {
  if (stepProvisioningTimer) {
    clearInterval(stepProvisioningTimer)
    stepProvisioningTimer = null
  }
  if (validatedHoldTimer) {
    clearTimeout(validatedHoldTimer)
    validatedHoldTimer = null
  }
}

function startStepProvisioningPoll(timeoutSeconds?: number) {
  transitionState.value = 'provisioning'
  stepProvisioningPhase.value = 'step_setup'
  const ceiling = timeoutSeconds
    ? timeoutSeconds * 1000 + STEP_PROVISION_MARGIN_MS
    : STEP_PROVISION_FALLBACK_CEILING_MS
  const deadline = Date.now() + ceiling
  stopStepProvisioningPoll()
  stepProvisioningTimer = setInterval(async () => {
    let status: string | null = null
    try {
      const info = await scenarioSessionService.getSessionInfo(props.scenarioSessionId)
      status = info?.status ?? null
      if (info?.provisioning_phase) {
        stepProvisioningPhase.value = info.provisioning_phase
      }
    } catch {
      // Transient poll failure — the deadline below bounds retries
    }
    if (status === 'active') {
      stopStepProvisioningPoll()
      transitionState.value = 'loading'
      loadCurrentStep()
    } else if (status === 'setup_failed' || Date.now() > deadline) {
      stopStepProvisioningPoll()
      transitionState.value = 'failed'
    }
  }, STEP_PROVISION_POLL_MS)
}

// Shared success path for verify / flag / quiz: show the full-panel check,
// then either load the next step directly or enter the provisioning wait when
// the backend left it running async.
//
// The hold is tracked so it can be cancelled. Untracked, leaving the scenario
// during those two seconds still fired the callback afterwards and started a
// polling interval on a torn-down component, which nothing was then left to
// stop.
function advanceAfterSuccess(
  result: {
    next_step_provisioning?: boolean
    provisioning_timeout_seconds?: number
    next_step_provisioning_failed?: boolean
  },
  validatedMs = 2000
) {
  stopStepProvisioningPoll()
  transitionState.value = 'validated'
  validatedHoldTimer = setTimeout(() => {
    validatedHoldTimer = null
    // The two flags are the backend's two failure shapes and never both true:
    // preparation left running reports next_step_provisioning and fails later
    // through the poll, while preparation that ran inline and failed reports
    // next_step_provisioning_failed on this very response and leaves the
    // session 'active'. That second case has nothing to poll, so reading the
    // flag here is the only way it can ever surface — without it the learner
    // lands on a step whose environment was never built and nothing says so.
    if (result.next_step_provisioning_failed) {
      transitionState.value = 'failed'
    } else if (result.next_step_provisioning) {
      startStepProvisioningPoll(result.provisioning_timeout_seconds)
    } else {
      transitionState.value = 'loading'
      loadCurrentStep()
    }
  }, validatedMs)
}

// The retry offered on a provisioning failure. Reloading the step was never a
// retry: it re-fetched the description of a step whose environment was never
// built, so the learner landed on an unsolvable level with no way out.
// reprovision-step re-runs the setup that failed, which is the only thing that
// can put the session back into a playable state.
const isRetryingProvisioning = ref(false)

async function retryStepProvisioning() {
  if (isRetryingProvisioning.value) return
  isRetryingProvisioning.value = true
  try {
    const result = await scenarioSessionService.reprovisionStep(props.scenarioSessionId)
    // The backend decides whether the retry runs inline or in the background;
    // 'provisioning' means poll again, anything else means it is already done.
    if (result.status === 'provisioning') {
      startStepProvisioningPoll()
    } else {
      transitionState.value = 'loading'
      await loadCurrentStep()
    }
  } catch (err) {
    console.error('Failed to reprovision step:', err)
    transitionState.value = 'failed'
  } finally {
    isRetryingProvisioning.value = false
  }
}

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

// Display position of a step (1-based). Orders are data-driven (0- or
// 1-based by authoring path), so `step_order + 1` reads "Étape 3 / 2" on
// 1-based scenarios — always prefer the backend-provided position and only
// fall back to the old arithmetic against an older backend.
function stepPosition(step: { position?: number; step_order: number } | null | undefined): number {
  if (!step) return 0
  return step.position || step.step_order + 1
}

// Display position of the current step; drives the counter and the dots.
const currentPosition = computed(() => stepPosition(currentStep.value))

// Maps a display position (1-based) back to the step order to navigate to.
function orderForPosition(position: number): number {
  const orders = currentStep.value?.step_orders
  return orders && orders.length >= position ? orders[position - 1] : position - 1
}

// Step counter label (e.g. "Step 2 / 5" or "Étape 2 / 5")
const stepCountLabel = computed(() => {
  if (!currentStep.value) return ''
  return `${t('scenarioPanel.step')} ${currentPosition.value} / ${totalSteps.value}`
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
  revealedHints.value = []
  reviewingStep.value = null
  quizResult.value = null
  quizSubmitError.value = ''
  hintNudgeDismissed.value = false
  stopHintNudgeTimer()
  stopStepProvisioningPoll()

  // The composable owns the step DATA load + DOM refresh and returns the step.
  const step = await session.loadStepData({ skipSpinner: isTransitioning.value })
  transitionState.value = 'idle'

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

// Resetting destroys whatever the learner built in this step, so the button
// arms first and acts on the second click. A modal for something this small
// would be heavier than the mistake it prevents.
const isResetting = ref(false)
const resetArmed = ref(false)
let resetDisarmTimer: ReturnType<typeof setTimeout> | null = null

function disarmReset() {
  resetArmed.value = false
  if (resetDisarmTimer) {
    clearTimeout(resetDisarmTimer)
    resetDisarmTimer = null
  }
}

async function handleResetStep() {
  if (isResetting.value || !props.isActive) return

  if (!resetArmed.value) {
    resetArmed.value = true
    resetDisarmTimer = setTimeout(disarmReset, 5000)
    return
  }
  disarmReset()

  isResetting.value = true
  try {
    await scenarioSessionService.reprovisionStep(props.scenarioSessionId)
    // loadCurrentStep already clears every transient bit of interaction state,
    // so a stale "Not quite right" cannot outlive the world it judged.
    await loadCurrentStep()
  } catch (err) {
    resetError.value = t('scenarioPanel.resetFailed')
    console.error('Failed to reset step:', err)
  } finally {
    isResetting.value = false
  }
}

async function handleVerify() {
  if (isVerifying.value || !props.isActive) return

  isVerifying.value = true
  verifyResult.value = null

  try {
    const result = await scenarioSessionService.verifyStep(props.scenarioSessionId)
    verifyResult.value = result

    // A failed check does not open a hint. Revealing one is the learner's
    // decision: it is recorded server-side, so spending it for them both
    // takes the choice away and scores them as having asked. The hint button
    // still pulses after 90s of no progress — a nudge, not a reveal.

    if (result.passed) {
      if (result.next_step) {
        advanceAfterSuccess(result)
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

    if (result.correct) {
      emit('flag-validated')
      if (result.next_step !== undefined && result.next_step !== null) {
        advanceAfterSuccess(result)
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

// Single owner of "can this scenario still be abandoned". The button itself
// lives in the page's nav row; the rule and the API call stay here, with the
// session state they describe.
const canAbandon = computed(() =>
  props.isActive && !isReviewMode.value && !isSessionCompleted.value
)

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
      advanceAfterSuccess(result)
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
  advanceAfterSuccess(quizResult.value, 600)
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
  stopStepProvisioningPoll()
})

defineExpose({
  toggleCollapse,
  isCollapsed,
  // The abandon button lives in the page's nav row now; the confirm flow and
  // the API call stay here, with the session state they belong to.
  abandon: handleAbandon,
  canAbandon
})
</script>

<style scoped src="./scenarioPanel.css"></style>

<!-- Shared scenario-panel styles (unscoped; every selector is prefixed with
     `.scenario-panel ` so it stays contained to the panel subtree). -->
<style src="./scenarioPanel.shared.css"></style>
