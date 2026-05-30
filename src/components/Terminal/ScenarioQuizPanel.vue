<template>
  <div class="quiz-step">
    <!-- Question entry view (shown until we have a result) -->
    <template v-if="!result && currentQuestion">
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
            :disabled="!allAnswered || isSubmitting"
            @click="submitQuiz"
          >
            <i :class="isSubmitting ? 'fas fa-spinner fa-spin' : 'fas fa-check'"></i>
            {{ isSubmitting ? t('scenarioPanel.submitting') : t('scenarioPanel.submitQuiz') }}
          </button>
        </div>
      </div>
    </template>

    <!-- Quiz results -->
    <div v-else-if="result" class="quiz-results">
      <h4 class="quiz-results-score">
        {{ t('scenarioPanel.quizScore', {
          score: Math.round(result.score * 100),
          correct: result.correct_count,
          total: result.total
        }) }}
      </h4>

      <ul v-if="step.show_immediate_feedback && result.per_question_results?.length" class="quiz-breakdown">
        <li
          v-for="r in result.per_question_results"
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

      <!--
        Learning mode (show_immediate_feedback=true): no auto-advance.
        The student reads the breakdown, then clicks Next / Finish.
        Optional "Try again" lets them retake before moving on.

        Exam mode (show_immediate_feedback=false): auto-advance fires
        in the parent; no buttons shown here (student saw their score
        during the 2s pause and the panel transitions).
      -->
      <div v-if="step.show_immediate_feedback" class="quiz-results-actions">
        <button class="btn-secondary" @click="onTryAgain">
          <i class="fas fa-redo"></i>
          {{ t('scenarioPanel.tryQuizAgain') }}
        </button>
        <button
          v-if="result.next_step !== undefined && result.next_step !== null"
          class="verify-btn"
          @click="$emit('advance')"
        >
          {{ t('scenarioPanel.nextStepBtn') }}
          <i class="fas fa-arrow-right"></i>
        </button>
        <button
          v-else
          class="verify-btn"
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
      submitQuiz: 'Submit answers',
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
      submitQuiz: 'Soumettre les réponses',
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

function submitQuiz() {
  if (!allAnswered.value || props.isSubmitting || !props.isActive) return
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
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
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
