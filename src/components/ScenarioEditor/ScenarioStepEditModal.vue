<template>
  <BaseModal
    :visible="visible"
    :title="modalTitle"
    size="large"
    @close="emit('close')"
  >
    <div class="step-edit-form">
      <!-- Tabs -->
      <div class="tabs">
        <button
          v-for="tab in tabs"
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

      <!-- Flag section (below tabs, always visible) -->
      <div class="flag-section">
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

const { t } = useTranslations({
  en: {
    stepEdit: {
      editTitle: 'Edit Step',
      createTitle: 'Create Step',
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
      tabForeground: 'Foreground'
    }
  },
  fr: {
    stepEdit: {
      editTitle: 'Modifier l\'Étape',
      createTitle: 'Créer une Étape',
      title: 'Titre',
      titlePlaceholder: 'Saisir le titre de l\'étape...',
      order: 'Ordre',
      textContent: 'Contenu texte',
      textContentPlaceholder: 'Saisir les instructions de l\'étape...',
      hintContent: 'Contenu de l\'indice',
      hintContentPlaceholder: 'Saisir les indices pour l\'apprenant...',
      verifyScript: 'Script de vérification',
      verifyScriptPlaceholder: '#!/bin/bash\n# Script pour vérifier la complétion de l\'étape...',
      backgroundScript: 'Script d\'arrière-plan',
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
      tabForeground: 'Premier plan'
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

const tabs = computed(() => [
  { key: 'content', label: t('stepEdit.tabContent') },
  { key: 'hints', label: t('stepEdit.tabHints') },
  { key: 'verify', label: t('stepEdit.tabVerify') },
  { key: 'background', label: t('stepEdit.tabBackground') },
  { key: 'foreground', label: t('stepEdit.tabForeground') }
])

const modalTitle = computed(() => {
  return props.isNew ? t('stepEdit.createTitle') : t('stepEdit.editTitle')
})

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
  flag_level: 0
})

// Reset form when step data changes or modal opens
watch(() => [props.visible, props.stepData], () => {
  if (props.visible) {
    activeTab.value = 'content'
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
        flag_level: props.stepData.flag_level || 0
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
        flag_level: 0
      }
    }
  }
}, { immediate: true })

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

.flag-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
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
