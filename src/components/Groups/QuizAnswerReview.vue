<template>
  <div class="quiz-questions-block">
    <div class="quiz-questions-summary">
      {{ t('groupScenarios.questionsCorrect', {
        correct: quizCorrectCount(step),
        total: quizQuestionTotal(step)
      }) }}
    </div>
    <ol class="quiz-questions-list">
      <li
        v-for="(q, qIdx) in (step.questions || [])"
        :key="q.id || qIdx"
        class="quiz-question-item"
        :class="q.is_correct ? 'quiz-q-correct' : 'quiz-q-incorrect'"
      >
        <div class="quiz-question-header">
          <span class="quiz-question-label">
            {{ t('groupScenarios.question') }} {{ q.order != null ? q.order + 1 : qIdx + 1 }}
          </span>
          <span :class="['quiz-question-indicator', q.is_correct ? 'indicator-correct' : 'indicator-incorrect']">
            <i :class="q.is_correct ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
            {{ q.is_correct
              ? t('groupScenarios.correctIndicator')
              : t('groupScenarios.incorrectIndicator') }}
          </span>
        </div>
        <div class="quiz-question-text">{{ q.question_text }}</div>
        <div
          v-if="q.question_type === 'multiple_choice' && parseQuizOptions(q.options).length > 0"
          class="quiz-question-options"
        >
          <div
            v-for="(opt, optIdx) in parseQuizOptions(q.options)"
            :key="optIdx"
            class="quiz-question-option"
            :class="optionRoleClass(optIdx, q)"
          >
            <span class="quiz-option-label">{{ opt }}</span>
            <span
              v-if="optionRole(optIdx, q)"
              class="quiz-option-tag"
              :class="'tag-' + optionRole(optIdx, q)"
            >
              <i :class="optionRoleIcon(optIdx, q)"></i>
              {{ optionRoleText(optIdx, q) }}
            </span>
          </div>
          <!-- If the student's submitted value cannot be resolved as an
               index OR a literal option (legacy data, edited options,
               etc.), surface the raw value so the trainer still sees
               what was actually submitted. -->
          <div
            v-if="isOrphanStudentAnswer(q, parseQuizOptions(q.options))"
            class="quiz-answer-line"
          >
            <span class="quiz-answer-label">{{ t('groupScenarios.yourAnswer') }}:</span>
            <span class="quiz-answer-value quiz-answer-wrong">
              {{ displayAnswer(q.student_answer) }}
            </span>
          </div>
        </div>
        <div v-else class="quiz-question-answers">
          <div class="quiz-answer-line">
            <span class="quiz-answer-label">{{ t('groupScenarios.yourAnswer') }}:</span>
            <span
              class="quiz-answer-value"
              :class="q.is_correct ? 'quiz-answer-correct' : 'quiz-answer-wrong'"
            >
              {{ displayAnswer(q.student_answer) || t('groupScenarios.noAnswer') }}
            </span>
          </div>
          <div class="quiz-answer-line">
            <span class="quiz-answer-label">{{ t('groupScenarios.correctAnswer') }}:</span>
            <span class="quiz-answer-value quiz-answer-correct">{{ q.correct_answer }}</span>
          </div>
        </div>
        <div v-if="q.explanation" class="quiz-question-explanation">
          <i class="fas fa-info-circle"></i>
          {{ q.explanation }}
        </div>
      </li>
    </ol>
  </div>
</template>

<script setup lang="ts">
import { useTranslations } from '../../composables/useTranslations'
import {
  optionRole,
  optionRoleClass,
  optionRoleIcon,
  displayAnswer,
  isOrphanStudentAnswer,
  parseQuizOptions,
  quizCorrectCount,
  quizQuestionTotal
} from '../../utils/scenarioDisplay'
import type { SessionStepDetail, SessionStepQuestionDetail } from '../../services/domain/scenario'

defineProps<{
  step: SessionStepDetail
}>()

const { t } = useTranslations({
  en: {
    groupScenarios: {
      question: 'Question',
      yourAnswer: 'Student answer',
      correctAnswer: 'Correct answer',
      studentAnswerCorrect: 'Student answer (correct)',
      correctIndicator: 'Correct',
      incorrectIndicator: 'Incorrect',
      noAnswer: 'No answer',
      questionsCorrect: '{correct}/{total} correct'
    }
  },
  fr: {
    groupScenarios: {
      question: 'Question',
      yourAnswer: 'Réponse de l\'apprenant',
      correctAnswer: 'Bonne réponse',
      studentAnswerCorrect: 'Réponse de l\'apprenant (correcte)',
      correctIndicator: 'Correcte',
      incorrectIndicator: 'Incorrecte',
      noAnswer: 'Pas de réponse',
      questionsCorrect: '{correct}/{total} correctes'
    }
  }
})

function optionRoleText(optIdx: number, q: SessionStepQuestionDetail): string {
  switch (optionRole(optIdx, q)) {
    case 'student-correct': return t('groupScenarios.studentAnswerCorrect')
    case 'correct':         return t('groupScenarios.correctAnswer')
    case 'student-wrong':   return t('groupScenarios.yourAnswer')
    default:                return ''
  }
}
</script>

<style scoped>
.quiz-questions-block {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.quiz-questions-summary {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.quiz-questions-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.quiz-question-item {
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-primary);
}

.quiz-q-correct {
  border-left: 3px solid var(--color-success);
}

.quiz-q-incorrect {
  border-left: 3px solid var(--color-danger);
}

.quiz-question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.quiz-question-label {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.quiz-question-indicator {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  padding: 2px 8px;
  border-radius: var(--border-radius-sm);
}

.indicator-correct {
  background: var(--color-success-bg);
  color: var(--color-success-text);
}

.indicator-incorrect {
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.quiz-question-text {
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-size-sm);
}

.quiz-question-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.quiz-question-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--color-border-light);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.quiz-question-option {
  justify-content: space-between;
}

/* Student picked the right answer */
.option-student-correct {
  background: var(--color-success-bg);
  border-color: var(--color-success-text);
  color: var(--color-success-text);
}

/* Right answer (student picked something else) */
.option-correct {
  background: var(--color-success-bg);
  border-color: var(--color-success-text);
  color: var(--color-success-text);
}

/* Student picked the wrong answer */
.option-student-wrong {
  background: var(--color-danger-bg);
  border-color: var(--color-danger-text);
  color: var(--color-danger-text);
}

.quiz-option-label {
  flex: 1;
}

.quiz-option-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 2px 8px;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
}

.quiz-option-tag.tag-student-correct {
  background: var(--color-success-text);
  color: var(--color-bg-primary);
}

.quiz-option-tag.tag-correct {
  background: var(--color-success-text);
  color: var(--color-bg-primary);
}

.quiz-option-tag.tag-student-wrong {
  background: var(--color-danger-text);
  color: var(--color-bg-primary);
}

.quiz-answer-wrong {
  color: var(--color-danger-text);
  font-weight: var(--font-weight-semibold);
}

.quiz-question-answers {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.quiz-answer-line {
  display: flex;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
}

.quiz-answer-label {
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
  min-width: 8em;
}

.quiz-answer-value {
  color: var(--color-text-primary);
  font-family: var(--font-family-monospace);
  word-break: break-word;
}

.quiz-answer-correct {
  color: var(--color-success-text);
}

.quiz-question-explanation {
  margin-top: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-info-bg);
  color: var(--color-info);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  display: flex;
  gap: var(--spacing-xs);
  align-items: flex-start;
}
</style>
