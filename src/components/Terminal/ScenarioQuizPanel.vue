<template>
  <div class="quiz-step">
    <!-- Question entry view (shown until we have a result) -->
    <template v-if="!result && currentQuestion">
      <p v-if="isPartialScoring" class="ocf-quiz-rule" data-testid="quiz-scoring-rule">
        <i class="fas fa-info-circle" aria-hidden="true"></i>
        {{ t('scenarioPanel.partialScoringRule') }}
      </p>

      <!-- Fixed set of fixed-size buttons that wrap: state changes restyle
           them, never add or remove one, so nothing below moves. -->
      <nav class="ocf-quiz-navigator" :aria-label="t('scenarioPanel.questionNavigator')">
        <button
          v-for="(q, idx) in quizQuestions"
          :key="q.id"
          type="button"
          class="ocf-quiz-nav-item"
          data-testid="quiz-nav-item"
          :class="{
            'ocf-quiz-nav-item--current': idx === quizCurrentIndex,
            'ocf-quiz-nav-item--answered': isAnswered(q)
          }"
          :aria-current="idx === quizCurrentIndex ? 'step' : undefined"
          :aria-label="t(isAnswered(q) ? 'scenarioPanel.goToAnswered' : 'scenarioPanel.goToUnanswered', { n: idx + 1 })"
          @click="quizCurrentIndex = idx"
        >
          {{ idx + 1 }}
        </button>
      </nav>

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
            data-testid="quiz-option"
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
            data-testid="quiz-option"
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
            data-testid="quiz-option"
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
            data-testid="quiz-option"
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
            data-testid="quiz-free-input"
            v-model="quizAnswers[currentQuestion.id]"
            :placeholder="t('scenarioPanel.freeAnswerPlaceholder')"
          />
        </div>

        <!-- Every button always rendered (disabled at the bounds) so the
             row never reflows while the learner moves around. -->
        <div class="quiz-nav">
          <button
            type="button"
            class="btn-secondary"
            data-testid="quiz-previous"
            :disabled="quizCurrentIndex === 0"
            @click="quizCurrentIndex--"
          >
            <i class="fas fa-arrow-left"></i>
            {{ t('scenarioPanel.previous') }}
          </button>
          <button
            type="button"
            class="btn-secondary"
            data-testid="quiz-next"
            :disabled="quizCurrentIndex >= quizQuestions.length - 1"
            @click="quizCurrentIndex++"
          >
            {{ t('scenarioPanel.next') }}
            <i class="fas fa-arrow-right"></i>
          </button>
          <button
            type="button"
            class="verify-btn quiz-submit"
            data-testid="quiz-validate"
            :disabled="isSubmitting || !isActive"
            @click="showConfirm = true"
          >
            <i :class="isSubmitting ? 'fas fa-spinner fa-spin' : 'fas fa-check'"></i>
            {{ isSubmitting ? t('scenarioPanel.submitting') : t('scenarioPanel.submitQuiz') }}
          </button>
        </div>
      </div>

      <BaseModal
        :visible="showConfirm"
        :title="isExam ? t('scenarioPanel.confirmTitleExam') : t('scenarioPanel.confirmTitle')"
        size="small"
        @close="showConfirm = false"
      >
        <div class="ocf-quiz-confirm" data-testid="quiz-confirm">
          <p v-if="unansweredIndexes.length === 0">{{ t('scenarioPanel.confirmAllAnswered') }}</p>
          <template v-else>
            <p data-testid="quiz-confirm-unanswered">
              {{ t('scenarioPanel.confirmUnanswered', { n: unansweredIndexes.length, total: quizQuestions.length }) }}
            </p>
            <div class="ocf-quiz-confirm-list">
              <button
                v-for="idx in unansweredIndexes"
                :key="idx"
                type="button"
                class="ocf-quiz-nav-item"
                data-testid="quiz-confirm-goto"
                :aria-label="t('scenarioPanel.goToUnanswered', { n: idx + 1 })"
                @click="goBackTo(idx)"
              >
                {{ idx + 1 }}
              </button>
            </div>
          </template>
          <p
            class="ocf-quiz-confirm-warning"
            :class="{ 'ocf-quiz-confirm-warning--exam': isExam }"
            data-testid="quiz-confirm-warning"
          >
            <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
            {{ isExam ? t('scenarioPanel.confirmFinalExam') : t('scenarioPanel.confirmFinal') }}
          </p>
        </div>
        <template #footer>
          <button type="button" class="btn btn-secondary" @click="showConfirm = false">
            {{ t('scenarioPanel.keepAnswering') }}
          </button>
          <button
            type="button"
            class="btn btn-primary"
            data-testid="quiz-confirm-submit"
            :disabled="isSubmitting"
            @click="confirmSubmit"
          >
            <i class="fas fa-check"></i>
            {{ isExam ? t('scenarioPanel.confirmSubmitExam') : t('scenarioPanel.confirmSubmit') }}
          </button>
        </template>
      </BaseModal>
    </template>

    <!-- Quiz results -->
    <div v-else-if="result" class="quiz-results">
      <h4
        v-if="result.score !== undefined && result.score !== null"
        class="quiz-results-score"
        data-testid="quiz-results-score"
      >
        {{ t('scenarioPanel.quizScore', {
          score: Math.round(result.score * 100),
          correct: result.correct_count ?? 0,
          total: result.total
        }) }}
      </h4>
      <p v-else class="ocf-quiz-recorded" data-testid="quiz-recorded" role="status">
        <i class="fas fa-check-circle" aria-hidden="true"></i>
        {{ t('scenarioPanel.answersRecorded') }}
      </p>

      <ul v-if="result.per_question_results?.length" class="quiz-breakdown">
        <li
          v-for="r in result.per_question_results"
          :key="r.question_id"
          class="quiz-breakdown-item"
          data-testid="quiz-breakdown-item"
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

      <!--
        The learner moves on by hand whenever there is a breakdown to read:
        learning mode, or a teacher preview of an exam (the backend sends the
        breakdown there). A learner's exam run gets no breakdown; the parent
        then advances on its own. Same predicate on both sides:
        quizResultAwaitsReview.
      -->
      <div v-if="awaitsReview" class="quiz-results-actions">
        <button v-if="step.show_immediate_feedback" class="btn-secondary" @click="onTryAgain">
          <i class="fas fa-redo"></i>
          {{ t('scenarioPanel.tryQuizAgain') }}
        </button>
        <button
          v-if="result.next_step !== undefined && result.next_step !== null"
          class="verify-btn"
          data-testid="quiz-advance"
          @click="$emit('advance')"
        >
          {{ t('scenarioPanel.nextStepBtn') }}
          <i class="fas fa-arrow-right"></i>
        </button>
        <button
          v-else
          class="verify-btn"
          data-testid="quiz-finish"
          @click="$emit('finish')"
        >
          <i class="fas fa-flag-checkered"></i>
          {{ t('scenarioPanel.finishScenario') }}
        </button>
      </div>
    </div>

    <div v-if="submitError" class="verify-result failed" role="status" aria-live="polite">
      <div class="verify-result-header">
        <i class="fas fa-times-circle"></i>
        <span>{{ submitError }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import BaseModal from '../Modals/BaseModal.vue'
import { quizResultAwaitsReview } from '../../services/domain/scenario'
import type {
  CurrentStepResponse,
  CurrentStepQuestion,
  QuizQuestionResult,
  SubmitQuizResponse
} from '../../services/domain/scenario'

const props = withDefaults(defineProps<{
  step: CurrentStepResponse
  scenarioSessionId: string
  isActive: boolean
  isSubmitting: boolean
  result?: SubmitQuizResponse | null
  submitError?: string
}>(), {
  result: null,
  submitError: ''
})

const emit = defineEmits<{
  submit: [payload: Record<string, string>]
  advance: []
  finish: []
  retry: []
}>()

const { t } = useTranslations({
  en: {
    scenarioPanel: {
      quizPosition: 'Question {n} of {total}',
      submitQuiz: 'Submit my answers',
      questionNavigator: 'Questions',
      goToAnswered: 'Question {n}, answered',
      goToUnanswered: 'Question {n}, not answered',
      partialScoringRule: 'Wrong answers you tick cost points.',
      confirmTitle: 'Submit your answers?',
      confirmAllAnswered: 'You have answered every question.',
      confirmUnanswered: '{n} of {total} questions have no answer and will score 0:',
      confirmFinal: 'Once submitted, your answers can no longer be changed.',
      keepAnswering: 'Keep answering',
      confirmSubmit: 'Submit',
      confirmTitleExam: 'Submit your answers for good?',
      confirmFinalExam: "This is final: you won't be able to change your answers.",
      confirmSubmitExam: 'Submit for good',
      answersRecorded: 'Your answers have been recorded.',
      tryQuizAgain: 'Try the quiz again',
      nextStepBtn: 'Next step',
      finishScenario: 'Finish scenario',
      quizScore: 'Score: {score}% ({correct}/{total} correct)',
      quizSubmitError: 'Failed to submit your answers. Please try again.',
      correctAnswerWas: 'Correct answer:',
      freeAnswerPlaceholder: 'Type your answer...',
      true: 'True',
      false: 'False',
      previous: 'Previous',
      next: 'Next',
      submitting: 'Submitting...'
    }
  },
  fr: {
    scenarioPanel: {
      quizPosition: 'Question {n} sur {total}',
      submitQuiz: 'Valider mes réponses',
      questionNavigator: 'Questions',
      goToAnswered: 'Question {n}, répondue',
      goToUnanswered: 'Question {n}, sans réponse',
      partialScoringRule: 'Les mauvaises réponses cochées sont pénalisées.',
      confirmTitle: 'Valider vos réponses ?',
      confirmAllAnswered: 'Vous avez répondu à toutes les questions.',
      confirmUnanswered: '{n} questions sur {total} restent sans réponse et vaudront 0 :',
      confirmFinal: 'Une fois validées, vos réponses ne pourront plus être modifiées.',
      keepAnswering: 'Continuer à répondre',
      confirmSubmit: 'Valider',
      confirmTitleExam: 'Valider définitivement vos réponses ?',
      confirmFinalExam: 'Cette validation est définitive : vous ne pourrez plus modifier vos réponses.',
      confirmSubmitExam: 'Valider définitivement',
      answersRecorded: 'Vos réponses ont été enregistrées.',
      tryQuizAgain: 'Refaire le quiz',
      nextStepBtn: 'Étape suivante',
      finishScenario: 'Terminer le scénario',
      quizScore: 'Score : {score} % ({correct}/{total} bonnes réponses)',
      quizSubmitError: 'Échec de l\'envoi de vos réponses. Réessayez.',
      correctAnswerWas: 'Bonne réponse :',
      freeAnswerPlaceholder: 'Saisissez votre réponse...',
      true: 'Vrai',
      false: 'Faux',
      previous: 'Précédent',
      next: 'Suivant',
      submitting: 'Envoi...'
    }
  }
})

// Quiz answer state
const quizCurrentIndex = ref(0)
const quizAnswers = ref<Record<string, string>>({})
const multiAnswerSelections = ref<Record<string, number[]>>({})

// Quiz computeds
const quizQuestions = computed<CurrentStepQuestion[]>(() => {
  const list = props.step?.questions
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

function isAnswered(q: CurrentStepQuestion): boolean {
  if (q.question_type === 'multi_answer') {
    return (multiAnswerSelections.value[q.id]?.length ?? 0) > 0
  }
  return ((quizAnswers.value[q.id] || '') as string).toString().trim().length > 0
}

const unansweredIndexes = computed(() =>
  quizQuestions.value.flatMap((q, idx) => (isAnswered(q) ? [] : [idx]))
)

// Exam mode has no "Try again", so its confirmation must read as final.
const isExam = computed(() => !props.step.show_immediate_feedback)

// Empty mode means all_or_nothing (backend default).
const isPartialScoring = computed(() => props.step.quiz_scoring_mode === 'partial')

const awaitsReview = computed(() => !!props.result && quizResultAwaitsReview(props.step, props.result))

const showConfirm = ref(false)

function goBackTo(idx: number) {
  quizCurrentIndex.value = idx
  showConfirm.value = false
}

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
  if (!props.step) return ''
  return `ocf-quiz-${props.scenarioSessionId}-${props.step.step_order}`
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
      if (!Number.isNaN(idx) && idx >= 0 && idx < quizQuestions.value.length) {
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
  showConfirm.value = false
  quizCurrentIndex.value = 0
  quizAnswers.value = {}
  multiAnswerSelections.value = {}
}

// Reset + restore persisted answers whenever the session or step changes.
watch(
  () => [props.scenarioSessionId, props.step.step_order],
  () => {
    resetQuizState()
    loadQuizFromStorage()
  },
  { immediate: true }
)

// Clear persisted answers once the quiz has been graded.
watch(
  () => props.result,
  (result) => {
    if (result) clearQuizStorage()
  }
)

// Persist answers/index while the quiz is still unsubmitted.
watch(
  [quizAnswers, multiAnswerSelections, quizCurrentIndex],
  () => {
    if (!props.result) {
      saveQuizToStorage()
    }
  },
  { deep: true }
)

// Unanswered questions go out as "" (multi-answer: "[]") and score 0.
function confirmSubmit() {
  showConfirm.value = false
  if (props.isSubmitting || !props.isActive) return
  const payload: Record<string, string> = {}
  for (const q of quizQuestions.value) {
    if (q.question_type === 'multi_answer') {
      payload[q.id] = JSON.stringify(multiAnswerSelections.value[q.id] || [])
    } else {
      payload[q.id] = (quizAnswers.value[q.id] || '').toString()
    }
  }
  emit('submit', payload)
}

function onTryAgain() {
  emit('retry')
  resetQuizState()
}
</script>

<style scoped>
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
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}

.quiz-nav .quiz-submit {
  margin-left: auto;
}

.ocf-quiz-rule {
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.ocf-quiz-navigator,
.ocf-quiz-confirm-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

/* Fixed box: the border is always there (only its colour changes) so the
   current/answered states never resize a button. */
.ocf-quiz-nav-item {
  width: 2rem;
  height: 2rem;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  background: var(--color-bg-primary);
  border: 2px dashed var(--color-border-medium);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.ocf-quiz-nav-item:hover {
  border-color: var(--scenario-node-quiz);
}

.ocf-quiz-nav-item--answered {
  border-style: solid;
  border-color: var(--scenario-node-quiz);
  background: var(--scenario-node-quiz-bg);
  color: var(--scenario-node-quiz);
}

.ocf-quiz-nav-item--current {
  outline: 2px solid var(--scenario-node-quiz);
  outline-offset: 2px;
}

.ocf-quiz-confirm {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  color: var(--color-text-primary);
}

.ocf-quiz-confirm p {
  margin: 0;
}

.ocf-quiz-confirm-warning {
  display: flex;
  gap: var(--spacing-xs);
  align-items: baseline;
  font-weight: var(--font-weight-semibold);
  color: var(--color-warning);
}

.ocf-quiz-confirm-warning--exam {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-danger-bg);
  border: var(--border-width-thin) solid var(--color-danger-border);
  border-radius: var(--border-radius-md);
  color: var(--color-danger);
}

.ocf-quiz-recorded {
  margin: 0;
  padding: var(--spacing-md);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  background: var(--color-success-bg);
  border: var(--border-width-thin) solid var(--color-success-border);
  border-radius: var(--border-radius-md);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
}

.ocf-quiz-recorded i {
  color: var(--color-success);
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

.quiz-results-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
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
</style>
