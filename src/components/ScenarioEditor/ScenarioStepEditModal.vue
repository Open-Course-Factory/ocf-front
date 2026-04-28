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
      <div class="tabs">
        <button
          v-for="tab in visibleTabs"
          :key="tab.key"
          class="tab-btn"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab content -->
      <div class="tab-content">
        <!-- Content tab -->
        <div v-if="activeTab === 'content'" class="tab-panel">
          <div class="form-group">
            <label>{{ t('stepEdit.title') }}</label>
            <input
              v-model="formData.title"
              type="text"
              class="form-control"
              :placeholder="t('stepEdit.titlePlaceholder')"
            />
          </div>

          <div class="form-group">
            <label>{{ t('stepEdit.order') }}</label>
            <input
              :value="formData.order"
              type="number"
              class="form-control"
              readonly
              disabled
            />
          </div>

          <div class="form-group">
            <label>{{ t('stepEdit.textContent') }}</label>
            <textarea
              v-model="formData.text_content"
              class="form-control textarea-full"
              rows="10"
              :placeholder="t('stepEdit.textContentPlaceholder')"
            ></textarea>
          </div>
        </div>

        <!-- Hints tab -->
        <div v-if="activeTab === 'hints'" class="tab-panel">
          <div class="form-group">
            <label>{{ t('stepEdit.hintContent') }}</label>
            <textarea
              v-model="formData.hint_content"
              class="form-control textarea-full"
              rows="14"
              :placeholder="t('stepEdit.hintContentPlaceholder')"
            ></textarea>
          </div>
        </div>

        <!-- Verify Script tab -->
        <div v-if="activeTab === 'verify'" class="tab-panel">
          <div class="form-group">
            <label>{{ t('stepEdit.verifyScript') }}</label>
            <textarea
              v-model="formData.verify_script"
              class="form-control textarea-full script-textarea"
              rows="14"
              :placeholder="t('stepEdit.verifyScriptPlaceholder')"
            ></textarea>
          </div>
        </div>

        <!-- Background Script tab -->
        <div v-if="activeTab === 'background'" class="tab-panel">
          <div class="form-group">
            <label>{{ t('stepEdit.backgroundScript') }}</label>
            <textarea
              v-model="formData.background_script"
              class="form-control textarea-full script-textarea"
              rows="14"
              :placeholder="t('stepEdit.backgroundScriptPlaceholder')"
            ></textarea>
          </div>
        </div>

        <!-- Foreground Script tab -->
        <div v-if="activeTab === 'foreground'" class="tab-panel">
          <div class="form-group">
            <label>{{ t('stepEdit.foregroundScript') }}</label>
            <textarea
              v-model="formData.foreground_script"
              class="form-control textarea-full script-textarea"
              rows="14"
              :placeholder="t('stepEdit.foregroundScriptPlaceholder')"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Flag section (only for flag type) -->
      <div v-if="resolvedStepType === 'flag'" class="flag-section">
        <div class="form-group">
          <label>{{ t('stepEdit.flagPath') }}</label>
          <input
            v-model="formData.flag_path"
            type="text"
            class="form-control"
            :placeholder="t('stepEdit.flagPathPlaceholder')"
          />
        </div>

        <div class="form-group">
          <label>{{ t('stepEdit.flagLevel') }}</label>
          <input
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
            <label>{{ t('stepEdit.flagPath') }}</label>
            <input
              v-model="formData.flag_path"
              type="text"
              class="form-control"
              :placeholder="t('stepEdit.flagPathPlaceholder')"
            />
          </div>

          <div class="form-group">
            <label>{{ t('stepEdit.flagLevel') }}</label>
            <input
              v-model.number="formData.flag_level"
              type="number"
              class="form-control"
              min="0"
            />
          </div>
        </div>
      </div>

      <!-- Questions section (only for quiz type) -->
      <div v-if="resolvedStepType === 'quiz'" class="questions-section">
        <div class="section-header">
          <h3>{{ t('stepEdit.questions') }}</h3>
          <button class="btn-add-question" @click="addQuestion">
            + {{ t('stepEdit.addQuestion') }}
          </button>
        </div>

        <div v-if="formData.questions.length === 0" class="empty-questions">
          {{ t('stepEdit.noQuestions') }}
        </div>

        <div
          v-for="(question, qIdx) in formData.questions"
          :key="qIdx"
          class="question-card"
        >
          <div class="question-card-header">
            <span class="question-number">{{ t('stepEdit.questionNumber', { n: String(qIdx + 1) }) }}</span>
            <button class="btn-remove-question" @click="removeQuestion(qIdx)" :title="t('stepEdit.removeQuestion')">
              &#x2715;
            </button>
          </div>

          <div class="question-card-body">
            <div class="form-group">
              <label>{{ t('stepEdit.questionText') }}</label>
              <textarea
                v-model="question.question_text"
                class="form-control"
                rows="2"
                :placeholder="t('stepEdit.questionTextPlaceholder')"
              ></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>{{ t('stepEdit.questionType') }}</label>
                <select v-model="question.question_type" class="form-control">
                  <option value="multiple_choice">{{ t('stepEdit.multipleChoice') }}</option>
                  <option value="free_text">{{ t('stepEdit.freeText') }}</option>
                  <option value="true_false">{{ t('stepEdit.trueFalse') }}</option>
                </select>
              </div>

              <div class="form-group">
                <label>{{ t('stepEdit.points') }}</label>
                <input
                  v-model.number="question.points"
                  type="number"
                  class="form-control"
                  min="0"
                />
              </div>
            </div>

            <!-- Options (for multiple choice) -->
            <div v-if="question.question_type === 'multiple_choice'" class="form-group">
              <label>{{ t('stepEdit.options') }}</label>
              <div class="options-list">
                <div
                  v-for="(option, oIdx) in question.options"
                  :key="oIdx"
                  class="option-row"
                >
                  <input
                    v-model="question.options[oIdx]"
                    type="text"
                    class="form-control option-input"
                    :placeholder="t('stepEdit.optionPlaceholder', { n: String(oIdx + 1) })"
                  />
                  <button class="btn-remove-option" @click="removeOption(qIdx, oIdx)" :title="t('stepEdit.removeOption')">
                    &#x2715;
                  </button>
                </div>
                <button class="btn-add-option" @click="addOption(qIdx)">
                  + {{ t('stepEdit.addOption') }}
                </button>
              </div>
            </div>

            <div class="form-group">
              <label>{{ t('stepEdit.correctAnswer') }}</label>
              <input
                v-model="question.correct_answer"
                type="text"
                class="form-control"
                :placeholder="t('stepEdit.correctAnswerPlaceholder')"
              />
            </div>

            <div class="form-group">
              <label>{{ t('stepEdit.explanation') }}</label>
              <textarea
                v-model="question.explanation"
                class="form-control"
                rows="2"
                :placeholder="t('stepEdit.explanationPlaceholder')"
              ></textarea>
            </div>
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
      // Step type labels
      typeTerminal: 'Terminal',
      typeFlag: 'Flag',
      typeInfo: 'Info',
      typeQuiz: 'Quiz',
      // Quiz
      questions: 'Questions',
      addQuestion: 'Add Question',
      noQuestions: 'No questions yet. Add one to get started.',
      questionNumber: 'Question #{n}',
      removeQuestion: 'Remove question',
      questionText: 'Question',
      questionTextPlaceholder: 'Enter the question...',
      questionType: 'Type',
      multipleChoice: 'Multiple Choice',
      freeText: 'Free Text',
      trueFalse: 'True / False',
      points: 'Points',
      options: 'Options',
      optionPlaceholder: 'Option {n}',
      addOption: 'Add Option',
      removeOption: 'Remove option',
      correctAnswer: 'Correct Answer',
      correctAnswerPlaceholder: 'Enter the correct answer...',
      explanation: 'Explanation',
      explanationPlaceholder: 'Explain the correct answer...'
    }
  },
  fr: {
    stepEdit: {
      editTitle: 'Modifier l\'Etape',
      createTitle: 'Creer une Etape',
      editTerminal: 'Modifier l\'Etape Terminal',
      editFlag: 'Modifier l\'Etape Drapeau',
      editInfo: 'Modifier l\'Etape Information',
      editQuiz: 'Modifier l\'Etape Quiz',
      createTerminal: 'Creer une Etape Terminal',
      createFlag: 'Creer une Etape Drapeau',
      createInfo: 'Creer une Etape Information',
      createQuiz: 'Creer une Etape Quiz',
      title: 'Titre',
      titlePlaceholder: 'Saisir le titre de l\'etape...',
      order: 'Ordre',
      textContent: 'Contenu texte',
      textContentPlaceholder: 'Saisir les instructions de l\'etape...',
      hintContent: 'Contenu de l\'indice',
      hintContentPlaceholder: 'Saisir les indices pour l\'apprenant...',
      verifyScript: 'Script de verification',
      verifyScriptPlaceholder: '#!/bin/bash\n# Script pour verifier la completion de l\'etape...',
      backgroundScript: 'Script d\'arriere-plan',
      backgroundScriptPlaceholder: '#!/bin/bash\n# Script a executer en arriere-plan...',
      foregroundScript: 'Script de premier plan',
      foregroundScriptPlaceholder: '#!/bin/bash\n# Script a executer en premier plan...',
      hasFlag: 'A un drapeau',
      flagPath: 'Chemin du drapeau',
      flagPathPlaceholder: '/tmp/flag.txt',
      flagLevel: 'Niveau du drapeau',
      save: 'Enregistrer',
      cancel: 'Annuler',
      tabContent: 'Contenu',
      tabHints: 'Indices',
      tabVerify: 'Verification',
      tabBackground: 'Arriere-plan',
      tabForeground: 'Premier plan',
      // Step type labels
      typeTerminal: 'Terminal',
      typeFlag: 'Drapeau',
      typeInfo: 'Information',
      typeQuiz: 'Quiz',
      // Quiz
      questions: 'Questions',
      addQuestion: 'Ajouter une question',
      noQuestions: 'Aucune question. Ajoutez-en une pour commencer.',
      questionNumber: 'Question n\u00B0{n}',
      removeQuestion: 'Supprimer la question',
      questionText: 'Question',
      questionTextPlaceholder: 'Saisir la question...',
      questionType: 'Type',
      multipleChoice: 'Choix multiple',
      freeText: 'Texte libre',
      trueFalse: 'Vrai / Faux',
      points: 'Points',
      options: 'Options',
      optionPlaceholder: 'Option {n}',
      addOption: 'Ajouter une option',
      removeOption: 'Supprimer l\'option',
      correctAnswer: 'Reponse correcte',
      correctAnswerPlaceholder: 'Saisir la reponse correcte...',
      explanation: 'Explication',
      explanationPlaceholder: 'Expliquer la reponse correcte...'
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
    terminal: '\u{1F5A5}\uFE0F',
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
  { key: 'verify', label: t('stepEdit.tabVerify') },
  { key: 'background', label: t('stepEdit.tabBackground') },
  { key: 'foreground', label: t('stepEdit.tabForeground') }
])

const visibleTabs = computed(() => {
  const tabMap: Record<StepType, string[]> = {
    terminal: ['content', 'hints', 'verify', 'background', 'foreground'],
    flag: ['content', 'hints', 'background'],
    info: ['content'],
    quiz: ['content', 'hints']
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

interface QuestionData {
  question_text: string
  question_type: 'multiple_choice' | 'free_text' | 'true_false'
  options: string[]
  correct_answer: string
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

// Reset form when step data changes or modal opens
watch(() => [props.visible, props.stepData], () => {
  if (props.visible) {
    // Reset to first available tab
    const firstTab = visibleTabs.value[0]
    activeTab.value = firstTab?.key || 'content'

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
          question_text: q.question_text || '',
          question_type: q.question_type || 'multiple_choice',
          options: Array.isArray(q.options) ? [...q.options] : [],
          correct_answer: q.correct_answer || '',
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

// Quiz question helpers
const addQuestion = () => {
  formData.value.questions.push({
    question_text: '',
    question_type: 'multiple_choice',
    options: ['', ''],
    correct_answer: '',
    explanation: '',
    points: 1
  })
}

const removeQuestion = (index: number) => {
  formData.value.questions.splice(index, 1)
}

const addOption = (questionIndex: number) => {
  formData.value.questions[questionIndex].options.push('')
}

const removeOption = (questionIndex: number, optionIndex: number) => {
  formData.value.questions[questionIndex].options.splice(optionIndex, 1)
}

const handleSave = () => {
  emit('save', { ...formData.value })
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
}

.form-group label {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-text-primary);
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

/* Questions section */
.questions-section {
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.section-header h3 {
  margin: 0;
  font-size: 1rem;
  color: var(--color-text-primary);
}

.btn-add-question {
  padding: 0.35rem 0.75rem;
  border: 1px solid var(--scenario-node-quiz);
  border-radius: 4px;
  background: var(--scenario-node-quiz-bg);
  color: var(--scenario-node-quiz);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add-question:hover {
  background: var(--scenario-node-quiz);
  color: var(--color-white);
}

.empty-questions {
  text-align: center;
  padding: 1.5rem;
  color: var(--color-text-secondary);
  font-size: 0.85rem;
  font-style: italic;
  background: var(--color-surface-variant);
  border-radius: 6px;
}

.question-card {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  margin-bottom: 0.75rem;
  overflow: hidden;
}

.question-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: var(--color-surface-variant);
  border-bottom: 1px solid var(--color-border);
}

.question-number {
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--scenario-node-quiz);
}

.btn-remove-question {
  border: none;
  background: none;
  color: var(--color-danger);
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  transition: background 0.2s;
}

.btn-remove-question:hover {
  background: var(--color-danger-bg);
}

.question-card-body {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.form-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 0.75rem;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.option-row {
  display: flex;
  gap: 0.35rem;
  align-items: center;
}

.option-input {
  flex: 1;
}

.btn-remove-option {
  border: none;
  background: none;
  color: var(--color-danger);
  cursor: pointer;
  font-size: 0.75rem;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  flex-shrink: 0;
  transition: background 0.2s;
}

.btn-remove-option:hover {
  background: var(--color-danger-bg);
}

.btn-add-option {
  padding: 0.25rem 0.5rem;
  border: 1px dashed var(--color-border);
  border-radius: 4px;
  background: none;
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  align-self: flex-start;
}

.btn-add-option:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

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
