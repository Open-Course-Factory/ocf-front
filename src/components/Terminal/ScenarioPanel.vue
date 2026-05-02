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
            <span v-if="liveElapsedTime" class="elapsed-timer" :title="t('scenarioPanel.elapsed')">
              <i class="fas fa-clock"></i>
              {{ liveElapsedTime }}
            </span>
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

          <!-- Transparency notice for hint tracking -->
          <div v-if="hasProgressiveHints && !reviewingStep" class="hint-transparency-notice">
            <i class="fas fa-eye"></i>
            <span>{{ t('scenarioPanel.hintTransparency') }}</span>
          </div>

          <!-- Progressive hints section -->
          <div v-if="hasProgressiveHints" class="hint-section">
            <!-- Hint counter -->
            <div class="hint-header">
              <i class="fas fa-lightbulb hint-icon"></i>
              <span class="hint-counter">
                {{ t('scenarioPanel.hintsAvailable', { used: revealedHints.length, total: displayedStep!.hints_total_count }) }}
              </span>
            </div>

            <!-- Already revealed hints (always visible, stacked) -->
            <div v-for="hint in revealedHints" :key="hint.level" class="hint-item">
              <div class="hint-level-label">{{ t('scenarioPanel.hintLevel', { level: hint.level }) }}</div>
              <div class="hint-content markdown-content" v-html="renderHintMarkdown(hint.content)"></div>
            </div>

            <!-- Reveal next hint button -->
            <button
              v-if="revealedHints.length < displayedStep!.hints_total_count"
              class="hint-toggle"
              :class="{ 'hint-nudge': hintNudgeActive }"
              :disabled="isRevealingHint"
              @click="handleRevealNextHint"
            >
              <i :class="isRevealingHint ? 'fas fa-spinner fa-spin' : 'fas fa-lightbulb'"></i>
              {{ isRevealingHint
                ? t('scenarioPanel.revealingHint')
                : t('scenarioPanel.revealNextHint', { level: revealedHints.length + 1 })
              }}
            </button>

            <!-- All hints used -->
            <div v-if="revealedHints.length > 0 && revealedHints.length >= displayedStep!.hints_total_count" class="hints-exhausted">
              <i class="fas fa-check-circle"></i>
              {{ t('scenarioPanel.allHintsRevealed') }}
            </div>
          </div>

          <!-- Legacy single hint (backward compat for old scenarios without progressive hints) -->
          <div v-else-if="displayedStep!.hint" class="hint-section">
            <button class="hint-toggle" @click="showHint = !showHint" :aria-expanded="showHint">
              <i :class="showHint ? 'fas fa-eye-slash' : 'fas fa-lightbulb'"></i>
              {{ showHint ? t('scenarioPanel.hideHint') : t('scenarioPanel.showHint') }}
            </button>
            <div v-if="showHint" class="hint-content markdown-content" v-html="renderedDisplayedHintText"></div>
          </div>

          <!-- Action area (hidden when reviewing previous steps or in review mode) -->
          <template v-if="!reviewingStep && !isReviewMode">

            <!-- Terminal step -->
            <template v-if="resolvedStepType === 'terminal'">
              <button
                class="verify-btn"
                :disabled="isVerifying || !isActive"
                @click="handleVerify"
              >
                <i :class="isVerifying ? 'fas fa-spinner fa-spin' : 'fas fa-check-circle'"></i>
                {{ isVerifying ? t('scenarioPanel.verifying') : t('scenarioPanel.verify') }}
              </button>

              <div v-if="verifyResult" class="verify-result" role="status" aria-live="polite" :class="{ passed: verifyResult.passed, failed: !verifyResult.passed }">
                <div class="verify-result-header">
                  <i :class="verifyResult.passed ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
                  <span>{{ verifyResult.passed ? t('scenarioPanel.passed') : t('scenarioPanel.failed') }}</span>
                </div>
                <div v-if="verifyResult.output" class="verify-output">
                  <span class="output-label">{{ t('scenarioPanel.output') }}</span>
                  <pre class="output-text">{{ verifyResult.output }}</pre>
                </div>
              </div>
            </template>

            <!-- Flag step -->
            <div v-else-if="resolvedStepType === 'flag'" class="flag-section">
              <div class="flag-input-row">
                <input
                  v-model="flagValue"
                  type="text"
                  class="flag-input"
                  :placeholder="t('scenarioPanel.flagPlaceholder')"
                  :disabled="isSubmittingFlag || !isActive"
                  @keyup.enter="handleSubmitFlag"
                />
                <button
                  class="flag-submit-btn"
                  :disabled="!flagValue.trim() || isSubmittingFlag || !isActive"
                  @click="handleSubmitFlag"
                >
                  <i :class="isSubmittingFlag ? 'fas fa-spinner fa-spin' : 'fas fa-paper-plane'"></i>
                  {{ isSubmittingFlag ? t('scenarioPanel.submitting') : t('scenarioPanel.submitFlag') }}
                </button>
              </div>
              <p class="flag-hint">{{ t('scenarioPanel.flagHint') }}</p>
              <div v-if="flagResult" class="flag-result" role="status" aria-live="polite" :class="{ correct: flagResult.correct, incorrect: !flagResult.correct }">
                <i :class="flagResult.correct ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
                <span>{{ flagResult.correct ? t('scenarioPanel.flagCorrect') : t('scenarioPanel.flagIncorrect') }}</span>
              </div>
            </div>

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
            <div v-else-if="resolvedStepType === 'quiz'" class="quiz-step">
              <!-- Question entry view (shown until we have a result) -->
              <template v-if="!quizResult && currentQuestion">
                <div class="quiz-position">
                  {{ t('scenarioPanel.quizPosition', { n: quizCurrentIndex + 1, total: quizQuestions.length }) }}
                </div>

                <div class="quiz-question">
                  <p class="quiz-question-text">{{ currentQuestion.question_text }}</p>

                  <!-- Multiple choice -->
                  <div v-if="currentQuestion.question_type === 'multiple_choice'" class="quiz-options">
                    <label
                      v-for="(opt, idx) in parsedOptions"
                      :key="idx"
                      class="quiz-option"
                      :class="{ 'quiz-option--checked': quizAnswers[currentQuestion.id] === String(idx) }"
                    >
                      <input
                        type="radio"
                        :name="`q-${currentQuestion.id}`"
                        :value="String(idx)"
                        v-model="quizAnswers[currentQuestion.id]"
                      />
                      <span>{{ opt }}</span>
                    </label>
                  </div>

                  <!-- Multi-answer -->
                  <div v-else-if="currentQuestion.question_type === 'multi_answer'" class="quiz-options">
                    <label
                      v-for="(opt, idx) in parsedOptions"
                      :key="idx"
                      class="quiz-option"
                      :class="{ 'quiz-option--checked': isMultiAnswerChecked(currentQuestion.id, idx) }"
                    >
                      <input
                        type="checkbox"
                        :checked="isMultiAnswerChecked(currentQuestion.id, idx)"
                        @change="toggleMultiAnswer(currentQuestion.id, idx)"
                      />
                      <span>{{ opt }}</span>
                    </label>
                  </div>

                  <!-- True/False -->
                  <div v-else-if="currentQuestion.question_type === 'true_false'" class="quiz-options quiz-tf">
                    <label
                      class="quiz-option"
                      :class="{ 'quiz-option--checked': quizAnswers[currentQuestion.id] === 'true' }"
                    >
                      <input
                        type="radio"
                        :name="`q-${currentQuestion.id}`"
                        value="true"
                        v-model="quizAnswers[currentQuestion.id]"
                      />
                      <span>{{ t('scenarioPanel.true') }}</span>
                    </label>
                    <label
                      class="quiz-option"
                      :class="{ 'quiz-option--checked': quizAnswers[currentQuestion.id] === 'false' }"
                    >
                      <input
                        type="radio"
                        :name="`q-${currentQuestion.id}`"
                        value="false"
                        v-model="quizAnswers[currentQuestion.id]"
                      />
                      <span>{{ t('scenarioPanel.false') }}</span>
                    </label>
                  </div>

                  <!-- Free text -->
                  <div v-else class="quiz-free">
                    <input
                      type="text"
                      class="quiz-free-input"
                      v-model="quizAnswers[currentQuestion.id]"
                      :placeholder="t('scenarioPanel.freeAnswerPlaceholder')"
                    />
                  </div>

                  <div class="quiz-nav">
                    <button
                      v-if="quizCurrentIndex > 0"
                      class="btn-secondary"
                      @click="quizCurrentIndex--"
                    >
                      <i class="fas fa-arrow-left"></i>
                      {{ t('scenarioPanel.previous') }}
                    </button>
                    <button
                      v-if="quizCurrentIndex < quizQuestions.length - 1"
                      class="verify-btn"
                      :disabled="!hasAnsweredCurrent"
                      @click="quizCurrentIndex++"
                    >
                      {{ t('scenarioPanel.next') }}
                      <i class="fas fa-arrow-right"></i>
                    </button>
                    <button
                      v-else
                      class="verify-btn quiz-submit"
                      :disabled="!allAnswered || isSubmittingQuiz"
                      @click="handleSubmitQuiz"
                    >
                      <i :class="isSubmittingQuiz ? 'fas fa-spinner fa-spin' : 'fas fa-check'"></i>
                      {{ isSubmittingQuiz ? t('scenarioPanel.submitting') : t('scenarioPanel.submitQuiz') }}
                    </button>
                  </div>
                </div>
              </template>

              <!-- Quiz results -->
              <div v-else-if="quizResult" class="quiz-results">
                <h4 class="quiz-results-score">
                  {{ t('scenarioPanel.quizScore', {
                    score: Math.round(quizResult.score * 100),
                    correct: quizResult.correct_count,
                    total: quizResult.total
                  }) }}
                </h4>

                <ul v-if="currentStep!.show_immediate_feedback && quizResult.per_question_results?.length" class="quiz-breakdown">
                  <li
                    v-for="r in quizResult.per_question_results"
                    :key="r.question_id"
                    class="quiz-breakdown-item"
                    :class="{ 'is-correct': r.correct, 'is-incorrect': !r.correct }"
                  >
                    <div class="qb-line">
                      <i :class="r.correct ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
                      <span class="qb-text">{{ findQuestionText(r.question_id) }}</span>
                    </div>
                    <div v-if="!r.correct && r.correct_answer" class="qb-correct">
                      <strong>{{ t('scenarioPanel.correctAnswerWas') }}</strong>
                      {{ formatCorrectAnswer(r) }}
                    </div>
                    <div v-if="r.explanation" class="qb-explanation">{{ r.explanation }}</div>
                  </li>
                </ul>

                <button
                  v-if="!quizResult.next_step"
                  class="btn-secondary"
                  @click="resetQuiz"
                >
                  <i class="fas fa-redo"></i>
                  {{ t('scenarioPanel.tryQuizAgain') }}
                </button>
              </div>

              <div v-if="quizSubmitError" class="verify-result failed" role="status" aria-live="polite">
                <div class="verify-result-header">
                  <i class="fas fa-times-circle"></i>
                  <span>{{ quizSubmitError }}</span>
                </div>
              </div>
            </div>

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
import type {
  CurrentStepResponse,
  CurrentStepQuestion,
  VerifyStepResponse,
  SubmitFlagResponse,
  SubmitQuizResponse,
  QuizQuestionResult,
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
      verify: 'Verify',
      verifying: 'Verifying...',
      passed: 'Step completed!',
      failed: 'Not quite right. Check the output and try again.',
      showHint: 'Show Hint',
      hideHint: 'Hide Hint',
      submitFlag: 'Submit Flag',
      submitting: 'Submitting...',
      flagCorrect: 'Correct!',
      flagIncorrect: 'Incorrect flag. Try again.',
      flagPlaceholder: 'Enter flag...',
      flagHint: "Flags look like FLAG{'{'} abc123...{'}'}. Find it in the terminal to submit.",
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
      output: 'Output',
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
      hintsAvailable: 'Hints: {used}/{total}',
      hintLevel: 'Hint {level}',
      revealNextHint: 'Show Hint {level}',
      revealingHint: 'Loading...',
      allHintsRevealed: 'All hints used',
      hintTransparency: 'Your instructor can see how many hints you use.',
      sessionCompleted: 'Scenario Completed',
      sessionAbandoned: 'Scenario Abandoned',
      elapsed: 'Elapsed',
      // Step type chips
      typeTerminal: 'Terminal',
      typeFlag: 'Flag',
      typeInfo: 'Reading',
      typeQuiz: 'Quiz',
      // Info step
      infoSubtitle: 'Reading — no exercise',
      infoAck: "I've read this, next",
      previous: 'Previous',
      next: 'Next',
      // Quiz step
      quizPosition: 'Question {n} of {total}',
      submitQuiz: 'Submit answers',
      tryQuizAgain: 'Try the quiz again',
      quizScore: 'Score: {score}% ({correct}/{total} correct)',
      quizSubmitError: 'Failed to submit your answers. Please try again.',
      correctAnswerWas: 'Correct answer:',
      freeAnswerPlaceholder: 'Type your answer...',
      true: 'True',
      false: 'False'
    }
  },
  fr: {
    scenarioPanel: {
      title: 'Scénario',
      step: 'Étape',
      verify: 'Vérifier',
      verifying: 'Vérification...',
      passed: 'Étape validée !',
      failed: 'Pas tout à fait. Vérifiez la sortie et réessayez.',
      showHint: 'Afficher l\'indice',
      hideHint: 'Masquer l\'indice',
      submitFlag: 'Soumettre le flag',
      submitting: 'Envoi...',
      flagCorrect: 'Correct !',
      flagIncorrect: 'Flag incorrect. Réessayez.',
      flagPlaceholder: 'Entrez le flag...',
      flagHint: "Les flags sont au format FLAG{'{'} abc123...{'}'}. Trouvez-le dans le terminal pour le soumettre.",
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
      output: 'Sortie',
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
      hintsAvailable: 'Indices : {used}/{total}',
      hintLevel: 'Indice {level}',
      revealNextHint: 'Révéler l\'indice {level}',
      revealingHint: 'Chargement...',
      allHintsRevealed: 'Tous les indices utilisés',
      hintTransparency: 'Votre formateur peut voir combien d\'indices vous utilisez.',
      sessionCompleted: 'Scénario terminé',
      sessionAbandoned: 'Scénario abandonné',
      elapsed: 'Temps écoulé',
      // Step type chips
      typeTerminal: 'Terminal',
      typeFlag: 'Drapeau',
      typeInfo: 'Lecture',
      typeQuiz: 'Quiz',
      // Info step
      infoSubtitle: 'Lecture — pas d\'exercice',
      infoAck: 'J\'ai lu, suivant',
      previous: 'Précédent',
      next: 'Suivant',
      // Quiz step
      quizPosition: 'Question {n} sur {total}',
      submitQuiz: 'Soumettre les réponses',
      tryQuizAgain: 'Refaire le quiz',
      quizScore: 'Score : {score} % ({correct}/{total} bonnes réponses)',
      quizSubmitError: 'Échec de l\'envoi de vos réponses. Réessayez.',
      correctAnswerWas: 'Bonne réponse :',
      freeAnswerPlaceholder: 'Saisissez votre réponse...',
      true: 'Vrai',
      false: 'Faux'
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

// Live elapsed timer
const liveElapsedTime = ref('')
const timerInterval: Ref<ReturnType<typeof setInterval> | null> = ref(null)

function formatElapsed(startDate: Date): string {
  const diffMs = Date.now() - startDate.getTime()
  const totalSeconds = Math.floor(diffMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
  return `${minutes}m ${seconds}s`
}

function startElapsedTimer() {
  stopElapsedTimer()
  if (!sessionStartedAt.value) return
  const start = new Date(sessionStartedAt.value)
  liveElapsedTime.value = formatElapsed(start)
  timerInterval.value = setInterval(() => {
    liveElapsedTime.value = formatElapsed(start)
  }, 1000)
}

function stopElapsedTimer() {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
}

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

// Quiz state
const quizCurrentIndex = ref(0)
const quizAnswers = ref<Record<string, string>>({})
const multiAnswerSelections = ref<Record<string, number[]>>({})
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

const renderedDisplayedHintText = computed(() => {
  if (!displayedStep.value?.hint) return ''
  return renderKillercodaMarkdown(displayedStep.value.hint)
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

// Quiz computeds
const quizQuestions = computed<CurrentStepQuestion[]>(() => {
  const list = currentStep.value?.questions
  return Array.isArray(list) ? list : []
})

const currentQuestion = computed(() => quizQuestions.value[quizCurrentIndex.value] || null)

const parsedOptions = computed<string[]>(() => {
  const q = currentQuestion.value
  if (!q) return []
  const opts = q.options
  if (!opts) return []
  if (Array.isArray(opts)) return opts as string[]
  try {
    const parsed = JSON.parse(String(opts))
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
})

function isMultiAnswerChecked(questionId: string, idx: number): boolean {
  return (multiAnswerSelections.value[questionId] || []).includes(idx)
}

function toggleMultiAnswer(questionId: string, idx: number) {
  const current = multiAnswerSelections.value[questionId] || []
  const pos = current.indexOf(idx)
  if (pos >= 0) {
    multiAnswerSelections.value[questionId] = current.filter(i => i !== idx)
  } else {
    multiAnswerSelections.value[questionId] = [...current, idx].sort((a, b) => a - b)
  }
}

const hasAnsweredCurrent = computed(() => {
  const q = currentQuestion.value
  if (!q) return false
  if (q.question_type === 'multi_answer') {
    return (multiAnswerSelections.value[q.id]?.length ?? 0) > 0
  }
  return ((quizAnswers.value[q.id] || '') as string).toString().trim().length > 0
})

const allAnswered = computed(() => {
  return quizQuestions.value.every(q => {
    if (q.question_type === 'multi_answer') {
      return (multiAnswerSelections.value[q.id]?.length ?? 0) > 0
    }
    return ((quizAnswers.value[q.id] || '') as string).toString().trim().length > 0
  })
})

function findQuestionText(questionId: string): string {
  const q = quizQuestions.value.find(x => x.id === questionId)
  return q?.question_text || ''
}

function formatCorrectAnswer(r: QuizQuestionResult): string {
  if (!r.correct_answer) return ''
  const q = quizQuestions.value.find(x => x.id === r.question_id)
  if (!q) return r.correct_answer
  // multiple_choice: backend returns the index as a string — translate into the option text
  if (q.question_type === 'multiple_choice') {
    const opts = parseQuestionOptions(q)
    const idx = Number(r.correct_answer)
    if (!Number.isNaN(idx) && opts[idx] !== undefined) return opts[idx]
    return r.correct_answer
  }
  // multi_answer: backend returns JSON array of indices — translate into joined option texts
  if (q.question_type === 'multi_answer') {
    try {
      const arr = JSON.parse(r.correct_answer)
      if (Array.isArray(arr)) {
        const opts = parseQuestionOptions(q)
        return arr.map((i: number) => opts[i]).filter(Boolean).join(', ')
      }
    } catch {
      // fall through
    }
    return r.correct_answer
  }
  return r.correct_answer
}

function parseQuestionOptions(q: CurrentStepQuestion): string[] {
  if (!q.options) return []
  if (Array.isArray(q.options)) return q.options as string[]
  try {
    const parsed = JSON.parse(String(q.options))
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// Persist quiz state across refresh — scoped per session+step
const quizStorageKey = computed(() => {
  if (!currentStep.value) return ''
  return `ocf-quiz-${props.scenarioSessionId}-${currentStep.value.step_order}`
})

function loadQuizFromStorage() {
  if (!quizStorageKey.value) return
  try {
    const raw = localStorage.getItem(quizStorageKey.value)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      quizAnswers.value = parsed.answers && typeof parsed.answers === 'object' ? parsed.answers : {}
      multiAnswerSelections.value = parsed.multi && typeof parsed.multi === 'object' ? parsed.multi : {}
      const idx = Number(parsed.idx)
      if (!Number.isNaN(idx) && idx >= 0) {
        quizCurrentIndex.value = idx
      }
    }
  } catch {
    // Ignore corrupt storage
  }
}

function saveQuizToStorage() {
  if (!quizStorageKey.value) return
  try {
    localStorage.setItem(quizStorageKey.value, JSON.stringify({
      answers: quizAnswers.value,
      multi: multiAnswerSelections.value,
      idx: quizCurrentIndex.value
    }))
  } catch {
    // Storage unavailable / quota — silently ignore
  }
}

function clearQuizStorage() {
  if (!quizStorageKey.value) return
  try {
    localStorage.removeItem(quizStorageKey.value)
  } catch {
    // ignore
  }
}

function resetQuizState() {
  quizCurrentIndex.value = 0
  quizAnswers.value = {}
  multiAnswerSelections.value = {}
  quizResult.value = null
  quizSubmitError.value = ''
}

watch(
  [quizAnswers, multiAnswerSelections, quizCurrentIndex],
  () => {
    if (resolvedStepType.value === 'quiz' && !quizResult.value) {
      saveQuizToStorage()
    }
  },
  { deep: true }
)

function renderHintMarkdown(content: string): string {
  return renderKillercodaMarkdown(content)
}

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
  resetQuizState()
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

  // Restore persisted quiz answers (if this step is a quiz and we have prior progress)
  if (resolvedStepType.value === 'quiz' && currentStep.value) {
    loadQuizFromStorage()
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

async function handleSubmitQuiz() {
  if (!allAnswered.value || isSubmittingQuiz.value || !props.isActive) return
  isSubmittingQuiz.value = true
  quizSubmitError.value = ''
  try {
    const payload: Record<string, string> = {}
    for (const q of quizQuestions.value) {
      if (q.question_type === 'multi_answer') {
        payload[q.id] = JSON.stringify(multiAnswerSelections.value[q.id] || [])
      } else {
        payload[q.id] = (quizAnswers.value[q.id] || '').toString()
      }
    }
    const result = await scenarioSessionService.submitQuiz(props.scenarioSessionId, payload)
    quizResult.value = result
    clearQuizStorage()

    // The backend advances the session pointer when next_step is set.
    // Mirror the verify-pass flow: brief "Step validated!" then load next.
    if (result.next_step !== undefined && result.next_step !== null) {
      isTransitioning.value = true
      transitionPhase.value = 'validated'
      setTimeout(() => {
        transitionPhase.value = 'loading'
        loadCurrentStep()
      }, 2000)
    } else {
      // Last step submitted — show completion (after a short delay so the
      // student can read their score/breakdown if displayed)
      setTimeout(() => {
        isSessionCompleted.value = true
        emit('session-completed')
      }, currentStep.value?.show_immediate_feedback ? 4000 : 2000)
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

function resetQuiz() {
  resetQuizState()
  clearQuizStorage()
}

// Start the elapsed timer when session start time becomes available
watch(sessionStartedAt, (val) => {
  if (val) {
    startElapsedTimer()
  } else {
    stopElapsedTimer()
  }
})

// Stop the timer when the session completes
watch(isSessionCompleted, (completed) => {
  if (completed) {
    stopElapsedTimer()
  }
})

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
  stopElapsedTimer()
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

.elapsed-timer {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

.elapsed-timer i {
  font-size: 0.7em;
  opacity: 0.8;
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

/* Hint section */
.hint-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.hint-toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-bg-secondary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  cursor: pointer;
  transition: all var(--transition-fast);
  align-self: flex-start;
}

.hint-toggle:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-secondary);
  border-color: var(--color-border-medium);
}

.hint-toggle i {
  color: var(--color-warning);
}

.hint-content {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-warning-bg);
  border: var(--border-width-thin) solid var(--color-warning-border);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  color: var(--color-warning-text);
  line-height: var(--line-height-relaxed);
}

.hint-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.hint-icon {
  color: var(--color-warning);
}

.hint-counter {
  font-weight: var(--font-weight-medium);
}

.hint-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2xs);
}

.hint-level-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-warning);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.hints-exhausted {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-style: italic;
}

.hints-exhausted i {
  color: var(--color-success);
}

.hint-transparency-notice {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-style: italic;
}

.hint-transparency-notice i {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

/* Verify button */
.verify-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.verify-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
  box-shadow: var(--shadow-sm);
}

.verify-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Verify result */
.verify-result {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
}

.verify-result.passed {
  background: var(--color-success-bg);
  border: var(--border-width-thin) solid var(--color-success-border);
  color: var(--color-success-text);
}

.verify-result.failed {
  background: var(--color-danger-bg);
  border: var(--border-width-thin) solid var(--color-danger-border);
  color: var(--color-danger-text);
}

.verify-result-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: var(--font-weight-medium);
}

.verify-result.passed .verify-result-header i {
  color: var(--color-success);
}

.verify-result.failed .verify-result-header i {
  color: var(--color-danger);
}

.verify-output {
  margin-top: var(--spacing-sm);
}

.output-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: inherit;
  opacity: 0.8;
}

.output-text {
  margin: var(--spacing-xs) 0 0;
  padding: var(--spacing-sm);
  background: var(--color-bg-tertiary);
  border-radius: var(--border-radius-sm);
  font-family: var(--font-family-monospace);
  font-size: var(--font-size-xs);
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--color-text-primary);
}

/* Flag section */
.flag-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.flag-input-row {
  display: flex;
  gap: var(--spacing-sm);
}

.flag-hint {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  line-height: var(--line-height-relaxed);
}

.flag-input {
  flex: 1;
  min-width: 0;
  padding: var(--spacing-xs) var(--spacing-sm);
  border: var(--border-width-thin) solid var(--color-border-medium);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-family: var(--font-family-monospace);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  transition: border-color var(--transition-fast);
}

.flag-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus-primary);
}

.flag-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.flag-submit-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.flag-submit-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.flag-submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.flag-result {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.flag-result.correct {
  background: var(--color-success-bg);
  color: var(--color-success-text);
}

.flag-result.correct i {
  color: var(--color-success);
}

.flag-result.incorrect {
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.flag-result.incorrect i {
  color: var(--color-danger);
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

.verify-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.flag-submit-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.abandon-btn:focus-visible {
  outline: 2px solid var(--color-danger);
  outline-offset: 2px;
}

.hint-toggle:focus-visible {
  outline: 2px solid var(--color-primary);
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

/* Hint-nudge pulse on the hint button (after 90s of inactivity on a terminal step) */
.hint-toggle.hint-nudge {
  animation: hint-nudge-pulse 2.4s ease-in-out infinite;
  border-color: var(--color-primary);
  color: var(--color-primary);
}

@keyframes hint-nudge-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 var(--color-primary-light);
  }
  50% {
    box-shadow: 0 0 0 6px var(--color-primary-light);
  }
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

.info-actions .btn-secondary {
  flex-shrink: 0;
}

.info-actions .verify-btn {
  flex: 1;
}

/* Generic secondary button (used in info + quiz nav) */
.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background: transparent;
  color: var(--color-text-secondary);
  border: var(--border-width-thin) solid var(--color-border-medium);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-bg-secondary);
  border-color: var(--color-border-medium);
  color: var(--color-text-primary);
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Quiz step */
.quiz-step {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.quiz-position {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.quiz-question {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.quiz-question-text {
  margin: 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  line-height: var(--line-height-relaxed);
}

.quiz-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.quiz-option {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--color-bg-primary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.quiz-option:hover {
  border-color: var(--scenario-node-quiz);
  background: var(--scenario-node-quiz-bg);
}

.quiz-option--checked {
  border-color: var(--scenario-node-quiz);
  background: var(--scenario-node-quiz-bg);
}

.quiz-option input[type="radio"],
.quiz-option input[type="checkbox"] {
  margin: 2px 0 0;
  flex-shrink: 0;
  accent-color: var(--scenario-node-quiz);
}

.quiz-option span {
  flex: 1;
  line-height: var(--line-height-relaxed);
}

.quiz-tf {
  flex-direction: row;
}

.quiz-tf .quiz-option {
  flex: 1;
}

.quiz-free-input {
  width: 100%;
  padding: var(--spacing-sm);
  border: var(--border-width-thin) solid var(--color-border-medium);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  transition: border-color var(--transition-fast);
}

.quiz-free-input:focus {
  outline: none;
  border-color: var(--scenario-node-quiz);
  box-shadow: 0 0 0 3px var(--scenario-node-quiz-bg);
}

.quiz-nav {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}

.quiz-nav .btn-secondary {
  flex-shrink: 0;
}

.quiz-nav .verify-btn {
  flex: 1;
}

.quiz-submit {
  background: var(--scenario-node-quiz);
}

.quiz-submit:hover:not(:disabled) {
  background: var(--scenario-node-quiz);
  filter: brightness(0.92);
}

.quiz-results {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.quiz-results-score {
  margin: 0;
  padding: var(--spacing-md);
  background: var(--scenario-node-quiz-bg);
  border: var(--border-width-thin) solid var(--scenario-node-quiz);
  border-radius: var(--border-radius-md);
  color: var(--scenario-node-quiz);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  text-align: center;
}

.quiz-breakdown {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.quiz-breakdown-item {
  padding: var(--spacing-sm);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  background: var(--color-bg-primary);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.quiz-breakdown-item.is-correct {
  border-color: var(--color-success-border);
  background: var(--color-success-bg);
}

.quiz-breakdown-item.is-incorrect {
  border-color: var(--color-danger-border);
  background: var(--color-danger-bg);
}

.qb-line {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.is-correct .qb-line i {
  color: var(--color-success);
}

.is-incorrect .qb-line i {
  color: var(--color-danger);
}

.qb-text {
  flex: 1;
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-relaxed);
}

.qb-correct {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  padding-left: calc(var(--font-size-sm) + var(--spacing-sm));
}

.qb-correct strong {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  margin-right: var(--spacing-xs);
}

.qb-explanation {
  font-size: var(--font-size-xs);
  font-style: italic;
  color: var(--color-text-secondary);
  padding-left: calc(var(--font-size-sm) + var(--spacing-sm));
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
