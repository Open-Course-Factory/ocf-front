<template>
  <BaseModal
    :visible="visible"
    :title="modalTitle"
    size="large"
    @close="emit('close')"
  >
    <div class="step-edit-form">
      <!-- Step type indicator -->
      <div class="step-type-indicator" :style="{ borderColor: stepTypeColor }">
        <span class="step-type-icon">{{ stepTypeIcon }}</span>
        <span class="step-type-label">{{ stepTypeLabel }}</span>
      </div>

      <!-- Tabs -->
      <div
        class="tabs"
        role="tablist"
        :aria-label="t('stepEdit.tabsLabel')"
        @keydown="onTabKeydown"
      >
        <button
          v-for="tab in visibleTabs"
          :key="tab.key"
          :id="`tab-${tab.key}`"
          class="tab-btn"
          :class="{ active: activeTab === tab.key }"
          role="tab"
          :aria-selected="activeTab === tab.key"
          :aria-controls="`panel-${tab.key}`"
          :tabindex="activeTab === tab.key ? 0 : -1"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab content -->
      <div class="tab-content">
        <!-- Content tab -->
        <div
          v-if="activeTab === 'content'"
          id="panel-content"
          class="tab-panel"
          role="tabpanel"
          aria-labelledby="tab-content"
        >
          <div class="form-group">
            <label for="step-title">{{ t('stepEdit.title') }}</label>
            <input
              id="step-title"
              v-model="formData.title"
              type="text"
              class="form-control"
              :placeholder="t('stepEdit.titlePlaceholder')"
            />
          </div>

          <div class="form-group">
            <label for="step-order">{{ t('stepEdit.order') }}</label>
            <input
              id="step-order"
              :value="formData.order"
              type="number"
              class="form-control"
              readonly
              disabled
            />
          </div>

          <div class="form-group">
            <label for="step-text-content">{{ t('stepEdit.textContent') }}</label>
            <textarea
              id="step-text-content"
              v-model="formData.text_content"
              class="form-control textarea-full"
              rows="10"
              :placeholder="t('stepEdit.textContentPlaceholder')"
            ></textarea>
          </div>
        </div>

        <!-- Hints tab -->
        <div
          v-if="activeTab === 'hints'"
          id="panel-hints"
          class="tab-panel"
          role="tabpanel"
          aria-labelledby="tab-hints"
        >
          <div class="form-group">
            <label for="step-hint-content">{{ t('stepEdit.hintContent') }}</label>
            <textarea
              id="step-hint-content"
              v-model="formData.hint_content"
              class="form-control textarea-full"
              rows="14"
              :placeholder="t('stepEdit.hintContentPlaceholder')"
            ></textarea>
          </div>
        </div>

        <!-- Verify Script tab -->
        <div
          v-if="activeTab === 'verify'"
          id="panel-verify"
          class="tab-panel"
          role="tabpanel"
          aria-labelledby="tab-verify"
        >
          <div class="form-group">
            <label for="step-verify-script">{{ t('stepEdit.verifyScript') }}</label>
            <textarea
              id="step-verify-script"
              v-model="formData.verify_script"
              class="form-control textarea-full script-textarea"
              rows="14"
              :placeholder="t('stepEdit.verifyScriptPlaceholder')"
            ></textarea>
          </div>
        </div>

        <!-- Background Script tab -->
        <div
          v-if="activeTab === 'background'"
          id="panel-background"
          class="tab-panel"
          role="tabpanel"
          aria-labelledby="tab-background"
        >
          <div class="form-group">
            <label for="step-background-script">{{ t('stepEdit.backgroundScript') }}</label>
            <textarea
              id="step-background-script"
              v-model="formData.background_script"
              class="form-control textarea-full script-textarea"
              rows="14"
              :placeholder="t('stepEdit.backgroundScriptPlaceholder')"
            ></textarea>
          </div>
        </div>

        <!-- Foreground Script tab -->
        <div
          v-if="activeTab === 'foreground'"
          id="panel-foreground"
          class="tab-panel"
          role="tabpanel"
          aria-labelledby="tab-foreground"
        >
          <div class="form-group">
            <label for="step-foreground-script">{{ t('stepEdit.foregroundScript') }}</label>
            <textarea
              id="step-foreground-script"
              v-model="formData.foreground_script"
              class="form-control textarea-full script-textarea"
              rows="14"
              :placeholder="t('stepEdit.foregroundScriptPlaceholder')"
            ></textarea>
          </div>
        </div>

        <!-- Questions tab (only shown when resolvedStepType === 'quiz') -->
        <div
          v-if="activeTab === 'questions'"
          id="panel-questions"
          class="tab-panel questions-tab"
          role="tabpanel"
          aria-labelledby="tab-questions"
        >
          <header class="questions-tab__header">
            <div class="questions-tab__title">
              <h3 id="questions-heading">{{ t('quizEdit.questions') }}</h3>
              <span
                v-if="formData.questions.length"
                class="questions-tab__count"
                :aria-label="t('quizEdit.questionsCount', { n: formData.questions.length })"
              >
                {{ formData.questions.length }}
              </span>
            </div>
            <div class="questions-tab__actions">
              <button class="btn btn-primary" @click="addQuestion">
                <span aria-hidden="true">+</span>
                {{ t('quizEdit.addQuestion') }}
              </button>
            </div>
          </header>

          <!-- Empty state -->
          <div
            v-if="formData.questions.length === 0"
            class="questions-tab__empty"
            role="status"
          >
            <p class="questions-tab__empty-text">{{ t('quizEdit.noQuestions') }}</p>
            <button class="add-question-btn" @click="addQuestion">
              <span class="add-question-btn__plus" aria-hidden="true">+</span>
              <span>{{ t('quizEdit.addFirstQuestion') }}</span>
            </button>
          </div>

          <!-- Question cards -->
          <!-- TODO: drag-reorder for questions and options once vue-draggable-plus is added -->
          <ul
            v-else
            class="questions-tab__list"
            role="list"
            aria-live="polite"
            aria-labelledby="questions-heading"
          >
            <li
              v-for="(question, qIdx) in formData.questions"
              :key="`q-${qIdx}`"
              class="question-card"
              :class="{ 'is-collapsed': collapsedQuestions.has(qIdx) }"
              :aria-labelledby="`q-title-${qIdx}`"
            >
              <header
                class="question-card__header"
                @click="toggleCollapse(qIdx)"
              >
                <button
                  class="question-card__handle"
                  :aria-label="t('quizEdit.dragToReorder', { n: qIdx + 1 })"
                  tabindex="0"
                  @click.stop
                >
                  <i class="fas fa-grip-vertical" aria-hidden="true"></i>
                </button>
                <span class="question-card__number" aria-hidden="true">{{ qIdx + 1 }}</span>
                <h4 :id="`q-title-${qIdx}`" class="question-card__title">
                  {{ question.question_text || t('quizEdit.untitledQuestion', { n: qIdx + 1 }) }}
                </h4>
                <span
                  class="question-card__type-chip"
                  :data-type="question.question_type"
                >{{ typeLabel(question.question_type) }}</span>
                <button
                  class="question-card__chevron"
                  :aria-expanded="!collapsedQuestions.has(qIdx)"
                  :aria-controls="`q-body-${qIdx}`"
                  :aria-label="collapsedQuestions.has(qIdx) ? t('quizEdit.expand') : t('quizEdit.collapse')"
                  @click.stop="toggleCollapse(qIdx)"
                >
                  <i
                    :class="collapsedQuestions.has(qIdx) ? 'fas fa-chevron-down' : 'fas fa-chevron-up'"
                    aria-hidden="true"
                  ></i>
                </button>
                <button
                  class="question-card__remove"
                  :aria-label="t('quizEdit.removeQuestion', { n: qIdx + 1 })"
                  @click.stop="removeQuestion(qIdx)"
                >
                  <i class="fas fa-trash" aria-hidden="true"></i>
                </button>
              </header>

              <div
                v-show="!collapsedQuestions.has(qIdx)"
                :id="`q-body-${qIdx}`"
                class="question-card__body"
              >
                <div class="form-group">
                  <label :for="`q-${qIdx}-text`">{{ t('quizEdit.questionText') }}</label>
                  <textarea
                    :id="`q-${qIdx}-text`"
                    v-model="question.question_text"
                    rows="2"
                    class="form-control"
                    :placeholder="t('quizEdit.questionTextPlaceholder')"
                  ></textarea>
                </div>

                <div class="form-group form-group--inline">
                  <label :for="`q-${qIdx}-type`">{{ t('quizEdit.questionType') }}</label>
                  <select
                    :id="`q-${qIdx}-type`"
                    :value="question.question_type"
                    class="form-control"
                    @change="onTypeChange(qIdx, ($event.target as HTMLSelectElement).value)"
                  >
                    <option value="multiple_choice">{{ t('quizEdit.typeMcq') }}</option>
                    <option value="multi_answer">{{ t('quizEdit.typeMulti') }}</option>
                    <option value="true_false">{{ t('quizEdit.typeTf') }}</option>
                    <option value="free_text">{{ t('quizEdit.typeFree') }}</option>
                  </select>
                </div>

                <fieldset
                  v-if="question.question_type === 'multiple_choice' || question.question_type === 'multi_answer'"
                  class="options-fieldset"
                >
                  <legend>{{ t('quizEdit.options') }}</legend>
                  <ul class="options-list" role="list">
                    <li
                      v-for="(_opt, oIdx) in question.options"
                      :key="`q-${qIdx}-o-${oIdx}`"
                      class="option-row"
                      :class="{ 'option-row--correct': isCorrect(question, oIdx) }"
                    >
                      <label class="option-row__correct">
                        <input
                          v-if="question.question_type === 'multiple_choice'"
                          type="radio"
                          :name="`q-${qIdx}-correct`"
                          :checked="isCorrect(question, oIdx)"
                          :aria-label="t('quizEdit.markCorrect', { n: oIdx + 1 })"
                          @change="setCorrectSingle(qIdx, oIdx)"
                        />
                        <input
                          v-else
                          type="checkbox"
                          :checked="isCorrect(question, oIdx)"
                          :aria-label="t('quizEdit.markCorrect', { n: oIdx + 1 })"
                          @change="toggleCorrectMulti(qIdx, oIdx)"
                        />
                        <span class="option-row__correct-mark" aria-hidden="true">
                          <i class="fas fa-check"></i>
                        </span>
                      </label>
                      <input
                        v-model="question.options[oIdx]"
                        type="text"
                        class="option-row__input"
                        :placeholder="t('quizEdit.optionPlaceholder', { n: oIdx + 1 })"
                        :aria-label="t('quizEdit.optionLabel', { n: oIdx + 1 })"
                      />
                      <button
                        class="option-row__remove"
                        :disabled="question.options.length <= 2"
                        :aria-label="t('quizEdit.removeOption', { n: oIdx + 1 })"
                        @click="removeOption(qIdx, oIdx)"
                      >
                        <i class="fas fa-times" aria-hidden="true"></i>
                      </button>
                    </li>
                  </ul>
                  <button class="add-option-btn" @click="addOption(qIdx)">
                    <span aria-hidden="true">+</span>
                    {{ t('quizEdit.addOption') }}
                  </button>
                  <p v-if="question.options.length < 2" class="field-error" role="alert">
                    <i class="fas fa-exclamation-circle" aria-hidden="true"></i>
                    {{ t('quizEdit.errorMinOptions') }}
                  </p>
                  <p v-else-if="!hasAnyCorrect(question)" class="field-error" role="alert">
                    <i class="fas fa-exclamation-circle" aria-hidden="true"></i>
                    {{ t('quizEdit.errorNoCorrect') }}
                  </p>
                </fieldset>

                <fieldset v-else-if="question.question_type === 'true_false'" class="tf-fieldset">
                  <legend>{{ t('quizEdit.correctAnswer') }}</legend>
                  <div
                    class="tf-options"
                    role="radiogroup"
                    :aria-label="t('quizEdit.correctAnswer')"
                  >
                    <label
                      class="tf-option"
                      :class="{ 'tf-option--selected': question.correct_answer === 'true' }"
                    >
                      <input
                        type="radio"
                        :name="`q-${qIdx}-tf`"
                        value="true"
                        v-model="question.correct_answer"
                      />
                      <span><i class="fas fa-check" aria-hidden="true"></i> {{ t('quizEdit.true') }}</span>
                    </label>
                    <label
                      class="tf-option"
                      :class="{ 'tf-option--selected': question.correct_answer === 'false' }"
                    >
                      <input
                        type="radio"
                        :name="`q-${qIdx}-tf`"
                        value="false"
                        v-model="question.correct_answer"
                      />
                      <span><i class="fas fa-times" aria-hidden="true"></i> {{ t('quizEdit.false') }}</span>
                    </label>
                  </div>
                </fieldset>

                <div v-else class="form-group">
                  <label :for="`q-${qIdx}-correct`">{{ t('quizEdit.expectedAnswer') }}</label>
                  <input
                    :id="`q-${qIdx}-correct`"
                    v-model="question.correct_answer"
                    type="text"
                    class="form-control"
                    :placeholder="t('quizEdit.expectedAnswerPlaceholder')"
                  />
                  <p class="form-hint">{{ t('quizEdit.freeTextHint') }}</p>
                </div>

                <details class="advanced-section">
                  <summary>
                    <i class="fas fa-sliders-h" aria-hidden="true"></i>
                    {{ t('quizEdit.advanced') }}
                  </summary>
                  <div class="advanced-section__body">
                    <div class="form-group">
                      <label :for="`q-${qIdx}-points`">{{ t('quizEdit.points') }}</label>
                      <input
                        :id="`q-${qIdx}-points`"
                        v-model.number="question.points"
                        type="number"
                        min="0"
                        class="form-control"
                      />
                    </div>
                    <div class="form-group">
                      <label :for="`q-${qIdx}-explanation`">{{ t('quizEdit.explanation') }}</label>
                      <textarea
                        :id="`q-${qIdx}-explanation`"
                        v-model="question.explanation"
                        rows="2"
                        class="form-control"
                        :placeholder="t('quizEdit.explanationPlaceholder')"
                      ></textarea>
                      <p class="form-hint">{{ t('quizEdit.explanationHint') }}</p>
                    </div>
                  </div>
                </details>
              </div>
            </li>
          </ul>

          <button
            v-if="formData.questions.length > 0"
            class="add-question-btn add-question-btn--inline"
            @click="addQuestion"
          >
            <span class="add-question-btn__plus" aria-hidden="true">+</span>
            <span>{{ t('quizEdit.addQuestion') }}</span>
          </button>
        </div>
      </div>

      <!-- Flag section (only for flag type) -->
      <div v-if="resolvedStepType === 'flag'" class="flag-section">
        <div class="form-group">
          <label for="step-flag-path">{{ t('stepEdit.flagPath') }}</label>
          <input
            id="step-flag-path"
            v-model="formData.flag_path"
            type="text"
            class="form-control"
            :placeholder="t('stepEdit.flagPathPlaceholder')"
          />
        </div>

        <div class="form-group">
          <label for="step-flag-level">{{ t('stepEdit.flagLevel') }}</label>
          <input
            id="step-flag-level"
            v-model.number="formData.flag_level"
            type="number"
            class="form-control"
            min="0"
          />
        </div>
      </div>

      <!-- Legacy flag section (for terminal type, backward compat) -->
      <div v-if="resolvedStepType === 'terminal'" class="flag-section">
        <div class="form-group-inline">
          <label class="checkbox-label">
            <input v-model="formData.has_flag" type="checkbox" />
            <span>{{ t('stepEdit.hasFlag') }}</span>
          </label>
        </div>

        <div v-if="formData.has_flag" class="flag-fields">
          <div class="form-group">
            <label for="step-terminal-flag-path">{{ t('stepEdit.flagPath') }}</label>
            <input
              id="step-terminal-flag-path"
              v-model="formData.flag_path"
              type="text"
              class="form-control"
              :placeholder="t('stepEdit.flagPathPlaceholder')"
            />
          </div>

          <div class="form-group">
            <label for="step-terminal-flag-level">{{ t('stepEdit.flagLevel') }}</label>
            <input
              id="step-terminal-flag-level"
              v-model.number="formData.flag_level"
              type="number"
              class="form-control"
              min="0"
            />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <button class="btn btn-secondary" @click="emit('close')">
        {{ t('stepEdit.cancel') }}
      </button>
      <button class="btn btn-primary" @click="handleSave">
        {{ t('stepEdit.save') }}
      </button>
    </template>
  </BaseModal>

  <!-- Confirm dialog for destructive type change -->
  <BaseModal
    :visible="!!pendingTypeChange"
    :title="t('quizEdit.confirmTypeChangeTitle')"
    size="small"
    :show-default-footer="true"
    :confirm-text="t('quizEdit.confirmTypeChangeConfirm')"
    :cancel-text="t('quizEdit.cancel')"
    @close="pendingTypeChange = null"
    @confirm="commitTypeChange"
  >
    <p>{{ t('quizEdit.confirmTypeChangeBody', { from: pendingTypeFromLabel, to: pendingTypeToLabel }) }}</p>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BaseModal from '../Modals/BaseModal.vue'
import { useTranslations } from '../../composables/useTranslations'

const STEP_TYPES = ['terminal', 'flag', 'info', 'quiz'] as const
type StepType = typeof STEP_TYPES[number]

const { t } = useTranslations({
  en: {
    stepEdit: {
      editTitle: 'Edit Step',
      createTitle: 'Create Step',
      editTerminal: 'Edit Terminal Step',
      editFlag: 'Edit Flag Step',
      editInfo: 'Edit Info Step',
      editQuiz: 'Edit Quiz Step',
      createTerminal: 'Create Terminal Step',
      createFlag: 'Create Flag Step',
      createInfo: 'Create Info Step',
      createQuiz: 'Create Quiz Step',
      title: 'Title',
      titlePlaceholder: 'Enter step title...',
      order: 'Order',
      textContent: 'Text Content',
      textContentPlaceholder: 'Enter the step instructions...',
      hintContent: 'Hint Content',
      hintContentPlaceholder: 'Enter hints for the learner...',
      verifyScript: 'Verify Script',
      verifyScriptPlaceholder: '#!/bin/bash\n# Script to verify step completion...',
      backgroundScript: 'Background Script',
      backgroundScriptPlaceholder: '#!/bin/bash\n# Script to run in the background...',
      foregroundScript: 'Foreground Script',
      foregroundScriptPlaceholder: '#!/bin/bash\n# Script to run in the foreground...',
      hasFlag: 'Has Flag',
      flagPath: 'Flag Path',
      flagPathPlaceholder: '/tmp/flag.txt',
      flagLevel: 'Flag Level',
      save: 'Save',
      cancel: 'Cancel',
      tabContent: 'Content',
      tabHints: 'Hints',
      tabVerify: 'Verify',
      tabBackground: 'Background',
      tabForeground: 'Foreground',
      tabQuestions: 'Questions',
      tabsLabel: 'Step editor sections',
      // Step type labels
      typeTerminal: 'Terminal',
      typeFlag: 'Flag',
      typeInfo: 'Info',
      typeQuiz: 'Quiz'
    },
    quizEdit: {
      questions: 'Questions',
      questionsCount: '{n} question(s)',
      noQuestions: 'No questions yet — add one to get started.',
      addQuestion: 'Add question',
      addFirstQuestion: 'Add your first question',
      untitledQuestion: 'Question {n}',
      expand: 'Expand',
      collapse: 'Collapse',
      removeQuestion: 'Remove question {n}',
      dragToReorder: 'Drag to reorder question {n}',
      questionText: 'Question',
      questionTextPlaceholder: 'What does -v do?',
      questionType: 'Type',
      typeMcq: 'Multiple choice',
      typeMulti: 'Multi-answer',
      typeTf: 'True / False',
      typeFree: 'Free text',
      options: 'Options',
      optionLabel: 'Option {n}',
      optionPlaceholder: 'Option {n}',
      markCorrect: 'Mark option {n} as correct',
      addOption: 'Add option',
      removeOption: 'Remove option {n}',
      correctAnswer: 'Correct answer',
      expectedAnswer: 'Expected answer',
      expectedAnswerPlaceholder: 'Enter the expected answer',
      freeTextHint: 'Compared as exact match (case-insensitive).',
      true: 'True',
      false: 'False',
      errorMinOptions: 'A question needs at least 2 options.',
      errorNoCorrect: 'Mark at least one correct option.',
      advanced: 'Advanced',
      points: 'Points',
      explanation: 'Explanation',
      explanationPlaceholder: 'Shown to the student after they answer…',
      explanationHint: 'Helps students learn from wrong answers.',
      confirmTypeChangeTitle: 'Change question type?',
      confirmTypeChangeBody: 'Switching from {from} to {to} will discard your current options. This cannot be undone.',
      confirmTypeChangeConfirm: 'Yes, change type',
      cancel: 'Cancel'
    }
  },
  fr: {
    stepEdit: {
      editTitle: 'Modifier l’étape',
      createTitle: 'Créer une étape',
      editTerminal: 'Modifier l’étape Terminal',
      editFlag: 'Modifier l’étape Drapeau',
      editInfo: 'Modifier l’étape Information',
      editQuiz: 'Modifier l’étape Quiz',
      createTerminal: 'Créer une étape Terminal',
      createFlag: 'Créer une étape Drapeau',
      createInfo: 'Créer une étape Information',
      createQuiz: 'Créer une étape Quiz',
      title: 'Titre',
      titlePlaceholder: 'Saisir le titre de l’étape...',
      order: 'Ordre',
      textContent: 'Contenu texte',
      textContentPlaceholder: 'Saisir les instructions de l’étape...',
      hintContent: 'Contenu de l’indice',
      hintContentPlaceholder: 'Saisir les indices pour l’apprenant...',
      verifyScript: 'Script de vérification',
      verifyScriptPlaceholder: '#!/bin/bash\n# Script pour vérifier la complétion de l’étape...',
      backgroundScript: 'Script d’arrière-plan',
      backgroundScriptPlaceholder: '#!/bin/bash\n# Script à exécuter en arrière-plan...',
      foregroundScript: 'Script de premier plan',
      foregroundScriptPlaceholder: '#!/bin/bash\n# Script à exécuter en premier plan...',
      hasFlag: 'A un drapeau',
      flagPath: 'Chemin du drapeau',
      flagPathPlaceholder: '/tmp/flag.txt',
      flagLevel: 'Niveau du drapeau',
      save: 'Enregistrer',
      cancel: 'Annuler',
      tabContent: 'Contenu',
      tabHints: 'Indices',
      tabVerify: 'Vérification',
      tabBackground: 'Arrière-plan',
      tabForeground: 'Premier plan',
      tabQuestions: 'Questions',
      tabsLabel: 'Sections de l’éditeur d’étape',
      // Step type labels
      typeTerminal: 'Terminal',
      typeFlag: 'Drapeau',
      typeInfo: 'Information',
      typeQuiz: 'Quiz'
    },
    quizEdit: {
      questions: 'Questions',
      questionsCount: '{n} question(s)',
      noQuestions: 'Aucune question pour le moment.',
      addQuestion: 'Ajouter une question',
      addFirstQuestion: 'Ajouter une première question',
      untitledQuestion: 'Question {n}',
      expand: 'Déplier',
      collapse: 'Replier',
      removeQuestion: 'Supprimer la question {n}',
      dragToReorder: 'Glisser pour réordonner la question {n}',
      questionText: 'Question',
      questionTextPlaceholder: 'Que fait l’option -v ?',
      questionType: 'Type',
      typeMcq: 'Choix unique',
      typeMulti: 'Choix multiples',
      typeTf: 'Vrai / Faux',
      typeFree: 'Texte libre',
      options: 'Options',
      optionLabel: 'Option {n}',
      optionPlaceholder: 'Option {n}',
      markCorrect: 'Marquer l’option {n} comme correcte',
      addOption: 'Ajouter une option',
      removeOption: 'Supprimer l’option {n}',
      correctAnswer: 'Bonne réponse',
      expectedAnswer: 'Réponse attendue',
      expectedAnswerPlaceholder: 'Saisir la réponse attendue',
      freeTextHint: 'Comparé en correspondance exacte (insensible à la casse).',
      true: 'Vrai',
      false: 'Faux',
      errorMinOptions: 'Une question doit avoir au moins 2 options.',
      errorNoCorrect: 'Marquez au moins une option correcte.',
      advanced: 'Avancé',
      points: 'Points',
      explanation: 'Explication',
      explanationPlaceholder: 'Affiché à l’étudiant après sa réponse…',
      explanationHint: 'Aide les étudiants à apprendre de leurs erreurs.',
      confirmTypeChangeTitle: 'Changer le type de question ?',
      confirmTypeChangeBody: 'Passer de {from} à {to} effacera les options actuelles. Cette action est irréversible.',
      confirmTypeChangeConfirm: 'Oui, changer le type',
      cancel: 'Annuler'
    }
  }
})

interface Props {
  visible: boolean
  stepData?: any
  isNew?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  stepData: undefined,
  isNew: false
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', data: any): void
}>()

const activeTab = ref('content')

const resolvedStepType = computed((): StepType => {
  const st = props.stepData?.step_type || props.stepData?.entityType
  if (st && STEP_TYPES.includes(st as StepType)) return st as StepType
  return 'terminal'
})

const stepTypeIcon = computed(() => {
  const icons: Record<StepType, string> = {
    terminal: '\u{1F5A5}️',
    flag: '\u{1F6A9}',
    info: '\u{1F4D6}',
    quiz: '\u{2753}'
  }
  return icons[resolvedStepType.value]
})

const stepTypeColor = computed(() => {
  const colors: Record<StepType, string> = {
    terminal: 'var(--scenario-node-terminal)',
    flag: 'var(--scenario-node-flag)',
    info: 'var(--scenario-node-info)',
    quiz: 'var(--scenario-node-quiz)'
  }
  return colors[resolvedStepType.value]
})

const stepTypeLabel = computed(() => {
  const labels: Record<StepType, string> = {
    terminal: t('stepEdit.typeTerminal'),
    flag: t('stepEdit.typeFlag'),
    info: t('stepEdit.typeInfo'),
    quiz: t('stepEdit.typeQuiz')
  }
  return labels[resolvedStepType.value]
})

// Tabs vary by step type
const allTabs = computed(() => [
  { key: 'content', label: t('stepEdit.tabContent') },
  { key: 'hints', label: t('stepEdit.tabHints') },
  { key: 'questions', label: t('stepEdit.tabQuestions') },
  { key: 'verify', label: t('stepEdit.tabVerify') },
  { key: 'background', label: t('stepEdit.tabBackground') },
  { key: 'foreground', label: t('stepEdit.tabForeground') }
])

const visibleTabs = computed(() => {
  const tabMap: Record<StepType, string[]> = {
    terminal: ['content', 'hints', 'verify', 'background', 'foreground'],
    flag: ['content', 'hints', 'background'],
    info: ['content'],
    quiz: ['content', 'hints', 'questions']
  }
  const allowed = tabMap[resolvedStepType.value]
  return allTabs.value.filter(tab => allowed.includes(tab.key))
})

const modalTitle = computed(() => {
  if (props.isNew) {
    const createTitles: Record<StepType, string> = {
      terminal: t('stepEdit.createTerminal'),
      flag: t('stepEdit.createFlag'),
      info: t('stepEdit.createInfo'),
      quiz: t('stepEdit.createQuiz')
    }
    return createTitles[resolvedStepType.value]
  }
  const editTitles: Record<StepType, string> = {
    terminal: t('stepEdit.editTerminal'),
    flag: t('stepEdit.editFlag'),
    info: t('stepEdit.editInfo'),
    quiz: t('stepEdit.editQuiz')
  }
  return editTitles[resolvedStepType.value]
})

type StoredCorrectAnswer = number | number[] | string
type QuestionType = 'multiple_choice' | 'multi_answer' | 'true_false' | 'free_text'

interface QuestionData {
  id?: string
  question_text: string
  question_type: QuestionType
  options: string[]
  correct_answer: StoredCorrectAnswer
  explanation: string
  points: number
}

const formData = ref<Record<string, any>>({
  title: '',
  order: 1,
  text_content: '',
  hint_content: '',
  verify_script: '',
  background_script: '',
  foreground_script: '',
  has_flag: false,
  flag_path: '',
  flag_level: 0,
  questions: [] as QuestionData[]
})

const collapsedQuestions = ref(new Set<number>())
const pendingTypeChange = ref<{ qIdx: number; from: QuestionType; to: QuestionType } | null>(null)

// Deserialize correct_answer from backend string format → in-memory typed value
const deserializeCorrectAnswer = (q: any): StoredCorrectAnswer => {
  const t_ = (q.question_type as QuestionType) || 'multiple_choice'
  const raw = q.correct_answer
  if (raw === undefined || raw === null || raw === '') return ''
  if (t_ === 'multiple_choice' && typeof raw === 'string') {
    const n = Number(raw)
    return Number.isNaN(n) ? '' : n
  }
  if (t_ === 'multi_answer' && typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'number') : []
    } catch {
      return []
    }
  }
  return raw
}

// Reset form when step data changes or modal opens
watch(() => [props.visible, props.stepData], () => {
  if (props.visible) {
    // Reset to first available tab
    const firstTab = visibleTabs.value[0]
    activeTab.value = firstTab?.key || 'content'

    // Reset collapse state and pending type-change confirmation
    collapsedQuestions.value = new Set<number>()
    pendingTypeChange.value = null

    if (props.stepData) {
      formData.value = {
        title: props.stepData.title || '',
        order: props.stepData.order || 1,
        text_content: props.stepData.text_content || '',
        hint_content: props.stepData.hint_content || '',
        verify_script: props.stepData.verify_script || '',
        background_script: props.stepData.background_script || '',
        foreground_script: props.stepData.foreground_script || '',
        has_flag: props.stepData.has_flag || false,
        flag_path: props.stepData.flag_path || '',
        flag_level: props.stepData.flag_level || 0,
        questions: (props.stepData.questions || []).map((q: any) => ({
          id: q.id,
          question_text: q.question_text || '',
          question_type: (q.question_type as QuestionType) || 'multiple_choice',
          options: Array.isArray(q.options) ? [...q.options] : [],
          correct_answer: deserializeCorrectAnswer(q),
          explanation: q.explanation || '',
          points: q.points || 1
        }))
      }
    } else {
      formData.value = {
        title: '',
        order: 1,
        text_content: '',
        hint_content: '',
        verify_script: '',
        background_script: '',
        foreground_script: '',
        has_flag: false,
        flag_path: '',
        flag_level: 0,
        questions: []
      }
    }
  }
}, { immediate: true })

// Tab keyboard navigation (WAI-ARIA tab pattern)
const onTabKeydown = (e: KeyboardEvent) => {
  const keys = visibleTabs.value.map(t_ => t_.key)
  const i = keys.indexOf(activeTab.value)
  if (i === -1) return
  let next = i
  if (e.key === 'ArrowRight') next = (i + 1) % keys.length
  else if (e.key === 'ArrowLeft') next = (i - 1 + keys.length) % keys.length
  else if (e.key === 'Home') next = 0
  else if (e.key === 'End') next = keys.length - 1
  else return
  e.preventDefault()
  activeTab.value = keys[next]
  // Move focus to the newly active tab on next tick
  requestAnimationFrame(() => {
    const el = document.getElementById(`tab-${keys[next]}`) as HTMLElement | null
    el?.focus()
  })
}

// Quiz question helpers
const addQuestion = () => {
  formData.value.questions.push({
    question_text: '',
    question_type: 'multiple_choice',
    options: ['', ''],
    correct_answer: '',
    explanation: '',
    points: 1
  } as QuestionData)
}

const removeQuestion = (index: number) => {
  formData.value.questions.splice(index, 1)
  // Shift collapsed indices that were past the removed index
  const next = new Set<number>()
  collapsedQuestions.value.forEach((i) => {
    if (i < index) next.add(i)
    else if (i > index) next.add(i - 1)
  })
  collapsedQuestions.value = next
}

const addOption = (questionIndex: number) => {
  formData.value.questions[questionIndex].options.push('')
}

const removeOption = (questionIndex: number, optionIndex: number) => {
  const q = formData.value.questions[questionIndex] as QuestionData
  q.options.splice(optionIndex, 1)
  // Re-align correct answer references after option removal
  if (q.question_type === 'multiple_choice') {
    if (typeof q.correct_answer === 'number') {
      if (q.correct_answer === optionIndex) q.correct_answer = ''
      else if (q.correct_answer > optionIndex) q.correct_answer = q.correct_answer - 1
    }
  } else if (q.question_type === 'multi_answer') {
    if (Array.isArray(q.correct_answer)) {
      q.correct_answer = (q.correct_answer as number[])
        .filter((i) => i !== optionIndex)
        .map((i) => (i > optionIndex ? i - 1 : i))
    }
  }
}

const toggleCollapse = (idx: number) => {
  if (collapsedQuestions.value.has(idx)) collapsedQuestions.value.delete(idx)
  else collapsedQuestions.value.add(idx)
  // trigger reactivity for Set
  collapsedQuestions.value = new Set(collapsedQuestions.value)
}

const isCorrect = (q: QuestionData, oIdx: number): boolean => {
  if (q.question_type === 'multiple_choice') return Number(q.correct_answer) === oIdx
  if (q.question_type === 'multi_answer') {
    const arr = Array.isArray(q.correct_answer) ? q.correct_answer : []
    return arr.includes(oIdx)
  }
  return false
}

const hasAnyCorrect = (q: QuestionData): boolean => {
  if (q.question_type === 'multiple_choice') {
    return q.correct_answer !== '' && q.correct_answer != null
  }
  if (q.question_type === 'multi_answer') {
    return Array.isArray(q.correct_answer) && q.correct_answer.length > 0
  }
  return true
}

const setCorrectSingle = (qIdx: number, oIdx: number) => {
  formData.value.questions[qIdx].correct_answer = oIdx
}

const toggleCorrectMulti = (qIdx: number, oIdx: number) => {
  const q = formData.value.questions[qIdx] as QuestionData
  if (!Array.isArray(q.correct_answer)) q.correct_answer = []
  const arr = q.correct_answer as number[]
  const i = arr.indexOf(oIdx)
  if (i >= 0) arr.splice(i, 1)
  else arr.push(oIdx)
}

const onTypeChange = (qIdx: number, newType: string) => {
  const q = formData.value.questions[qIdx] as QuestionData
  const oldType = q.question_type
  if (oldType === newType) return
  const wouldLoseData =
    (oldType === 'multiple_choice' || oldType === 'multi_answer') &&
    (newType === 'free_text' || newType === 'true_false') &&
    q.options.some((o: string) => o.trim().length > 0)
  if (wouldLoseData) {
    pendingTypeChange.value = { qIdx, from: oldType, to: newType as QuestionType }
    return
  }
  applyTypeChange(qIdx, newType as QuestionType)
}

const commitTypeChange = () => {
  if (!pendingTypeChange.value) return
  applyTypeChange(pendingTypeChange.value.qIdx, pendingTypeChange.value.to)
  pendingTypeChange.value = null
}

const applyTypeChange = (qIdx: number, newType: QuestionType) => {
  const q = formData.value.questions[qIdx] as QuestionData
  q.question_type = newType
  if (newType === 'multiple_choice' || newType === 'multi_answer') {
    if (!q.options || q.options.length < 2) q.options = ['', '']
    q.correct_answer = newType === 'multi_answer' ? [] : ''
  } else {
    q.options = []
    q.correct_answer = ''
  }
}

const typeLabel = (qt: string): string => {
  const labels: Record<string, string> = {
    multiple_choice: t('quizEdit.typeMcq'),
    multi_answer: t('quizEdit.typeMulti'),
    true_false: t('quizEdit.typeTf'),
    free_text: t('quizEdit.typeFree')
  }
  return labels[qt] || qt
}

const pendingTypeFromLabel = computed(() =>
  pendingTypeChange.value ? typeLabel(pendingTypeChange.value.from) : ''
)
const pendingTypeToLabel = computed(() =>
  pendingTypeChange.value ? typeLabel(pendingTypeChange.value.to) : ''
)

const handleSave = () => {
  const cleaned = {
    ...formData.value,
    questions: (formData.value.questions as QuestionData[]).map((q) => {
      let ca: string
      if (q.question_type === 'multiple_choice') {
        ca = q.correct_answer === '' || q.correct_answer == null ? '' : String(q.correct_answer)
      } else if (q.question_type === 'multi_answer') {
        ca = JSON.stringify(Array.isArray(q.correct_answer) ? q.correct_answer : [])
      } else {
        ca = String(q.correct_answer ?? '')
      }
      return { ...q, correct_answer: ca }
    })
  }
  emit('save', cleaned)
}
</script>

<style scoped>
.step-edit-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.step-type-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-left: 3px solid;
  background: var(--color-surface-variant);
  border-radius: 0 4px 4px 0;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.step-type-icon {
  font-size: 1rem;
}

.step-type-label {
  font-weight: 600;
}

.tabs {
  display: flex;
  border-bottom: 2px solid var(--color-border);
  gap: 0;
}

.tab-btn {
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}

.tab-btn:hover {
  color: var(--color-text-primary);
  background: var(--color-surface-hover);
}

.tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  font-weight: 600;
}

.tab-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}

.tab-content {
  min-height: 300px;
}

.tab-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  /* Override forms-common.css margin-bottom — we use flex gap instead */
  margin-bottom: 0;
}

.form-group label {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  /* forms-common.css sets display:block + margin-bottom — neutralize for flex layout */
  margin-bottom: 0;
}

.form-group--inline {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 0.75rem;
}

.form-control {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background);
  color: var(--color-text-primary);
  font-size: 0.875rem;
  font-family: inherit;
  transition: border-color 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
}

.form-control:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-control::placeholder {
  color: var(--color-text-secondary);
  opacity: 0.6;
}

.form-hint {
  margin: 0;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  font-style: italic;
}

.textarea-full {
  resize: vertical;
  min-height: 80px;
  width: 100%;
}

.script-textarea {
  font-family: monospace;
  font-size: 0.85rem;
  line-height: 1.4;
  tab-size: 2;
}

.flag-section {
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.flag-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group-inline {
  margin-bottom: 0.75rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.checkbox-label input[type="checkbox"] {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
}

/* === Questions tab (quiz authoring) === */

.questions-tab {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.questions-tab__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border-light);
}

.questions-tab__title {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-sm);
}

.questions-tab__title h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--color-text-primary);
}

.questions-tab__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  background: var(--scenario-node-quiz-bg);
  color: var(--scenario-node-quiz);
  font-size: 0.7rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.questions-tab__actions {
  display: flex;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

.questions-tab__empty {
  text-align: center;
  padding: calc(var(--spacing-xl) * 1.5) var(--spacing-lg);
  border: 2px dashed var(--color-border-light);
  border-radius: var(--border-radius-md);
  background: var(--color-surface);
}

.questions-tab__empty-text {
  margin: 0 0 var(--spacing-md);
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.questions-tab__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin: 0;
  padding: 0;
  list-style: none;
}

.question-card {
  position: relative;
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.question-card:hover {
  border-color: var(--color-border);
}

.question-card:focus-within {
  border-color: var(--scenario-node-quiz);
  box-shadow: var(--shadow-focus-primary, 0 0 0 3px var(--scenario-node-quiz-bg));
}

.question-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--scenario-node-quiz);
  opacity: 0.18;
  transition: opacity 0.2s;
}

.question-card:focus-within::before {
  opacity: 1;
}

.question-card__header {
  display: grid;
  grid-template-columns: auto auto 1fr auto auto auto;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid var(--color-border-light);
}

.is-collapsed .question-card__header {
  border-bottom-color: transparent;
}

.question-card__handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border: 0;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: grab;
  opacity: 0.4;
  transition: opacity 0.15s;
}

.question-card:hover .question-card__handle,
.question-card__handle:focus-visible {
  opacity: 1;
}

.question-card__number {
  font-size: 1.5rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--scenario-node-quiz);
  line-height: 1;
  letter-spacing: -0.03em;
  min-width: 1.5rem;
  text-align: right;
}

.question-card__title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.question-card__type-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.18rem 0.6rem;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: var(--color-surface-variant);
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.question-card__type-chip[data-type="multiple_choice"],
.question-card__type-chip[data-type="multi_answer"] {
  background: var(--scenario-node-quiz-bg);
  color: var(--scenario-node-quiz);
}

.question-card__chevron,
.question-card__remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border: 0;
  border-radius: var(--border-radius-sm);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.question-card__chevron:hover,
.question-card__remove:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.question-card__remove:hover {
  color: var(--color-danger);
  background: var(--color-danger-bg);
}

.question-card__body {
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.options-fieldset,
.tf-fieldset {
  border: 0;
  margin: 0;
  padding: 0;
}

.options-fieldset legend,
.tf-fieldset legend {
  padding: 0 0 var(--spacing-xs);
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin: 0 0 var(--spacing-sm);
  padding: 0;
  list-style: none;
}

.option-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 0.45rem 0.6rem;
  border-radius: var(--border-radius-sm);
  border: 1px solid transparent;
  background: var(--color-background);
  transition: background 0.15s, border-color 0.15s;
}

.option-row:focus-within {
  border-color: var(--color-border);
  background: var(--color-surface);
}

.option-row--correct {
  background: var(--scenario-node-quiz-bg);
  border-color: var(--scenario-node-quiz);
}

.option-row__correct {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  position: relative;
  padding: 0.2rem;
}

.option-row__correct input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.option-row__correct-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.4rem;
  height: 1.4rem;
  border: 1.5px solid var(--color-border);
  border-radius: 50%;
  background: var(--color-surface);
  color: transparent;
  font-size: 0.7rem;
  transition: all 0.15s;
}

.option-row__correct input[type="checkbox"] ~ .option-row__correct-mark {
  border-radius: var(--border-radius-sm);
}

.option-row__correct input:checked ~ .option-row__correct-mark {
  background: var(--scenario-node-quiz);
  border-color: var(--scenario-node-quiz);
  color: var(--color-surface);
}

.option-row__correct input:focus-visible ~ .option-row__correct-mark {
  box-shadow: 0 0 0 3px var(--scenario-node-quiz-bg);
}

.option-row__input {
  border: 0;
  padding: 0.3rem 0;
  background: transparent;
  font-size: 0.9rem;
  color: var(--color-text-primary);
  outline: none;
  font-family: inherit;
}

.option-row__input::placeholder {
  color: var(--color-text-secondary);
  font-style: italic;
}

.option-row__remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border: 0;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: var(--border-radius-sm);
  opacity: 0;
  transition: opacity 0.15s, color 0.15s, background 0.15s;
}

.option-row:hover .option-row__remove,
.option-row:focus-within .option-row__remove {
  opacity: 0.7;
}

.option-row__remove:hover:not(:disabled) {
  opacity: 1;
  color: var(--color-danger);
  background: var(--color-danger-bg);
}

.option-row__remove:disabled {
  cursor: not-allowed;
  opacity: 0.25 !important;
}

.add-option-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem 0.75rem;
  border: 1px dashed var(--color-border);
  border-radius: var(--border-radius-sm);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s;
}

.add-option-btn:hover {
  border-color: var(--scenario-node-quiz);
  color: var(--scenario-node-quiz);
  background: var(--scenario-node-quiz-bg);
}

.tf-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-sm);
}

.tf-option {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: var(--spacing-md);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-weight: 600;
  color: var(--color-text-primary);
  background: var(--color-surface);
  transition: all 0.15s;
  user-select: none;
}

.tf-option:hover {
  background: var(--color-surface-hover);
}

.tf-option input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.tf-option--selected {
  border-color: var(--scenario-node-quiz);
  background: var(--scenario-node-quiz-bg);
  color: var(--scenario-node-quiz);
}

.tf-option:focus-within {
  box-shadow: 0 0 0 3px var(--scenario-node-quiz-bg);
}

.advanced-section {
  border-top: 1px dashed var(--color-border-light);
  padding-top: var(--spacing-md);
}

.advanced-section summary {
  cursor: pointer;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  list-style: none;
  user-select: none;
}

.advanced-section summary::-webkit-details-marker {
  display: none;
}

.advanced-section summary::before {
  content: '\25B8';
  font-size: 0.7rem;
  transition: transform 0.15s;
}

.advanced-section[open] summary::before {
  transform: rotate(90deg);
}

.advanced-section__body {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: var(--spacing-md);
  padding-top: var(--spacing-sm);
}

@media (max-width: 600px) {
  .advanced-section__body {
    grid-template-columns: 1fr;
  }
}

.field-error {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin: var(--spacing-xs) 0 0;
  padding: 0.35rem 0.6rem;
  border-radius: var(--border-radius-sm);
  background: var(--color-danger-bg);
  color: var(--color-danger);
  font-size: 0.75rem;
  font-weight: 500;
}

.add-question-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  align-self: flex-start;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1.5px dashed var(--scenario-node-quiz);
  border-radius: var(--border-radius-md);
  background: transparent;
  color: var(--scenario-node-quiz);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s;
}

.add-question-btn:hover {
  background: var(--scenario-node-quiz-bg);
  border-style: solid;
}

.add-question-btn--inline {
  margin-top: var(--spacing-xs);
}

.add-question-btn__plus {
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1;
}

/* === Buttons === */

.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--btn-padding-md);
  font-size: var(--font-size-base);
  font-weight: 500;
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: var(--border-radius-md);
  transition: all var(--transition-fast);
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.btn-secondary {
  background-color: var(--color-secondary);
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-secondary-hover);
}
</style>
