<template>
  <div class="csv-file-upload">
    <div
      class="upload-area"
      :class="{
        'has-file': modelValue !== null,
        'is-dragging': isDragging,
        'has-error': errorMessage
      }"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <input
        ref="fileInput"
        type="file"
        accept=".csv"
        @change="handleFileSelect"
        class="file-input"
      />

      <div class="upload-content" @click="triggerFileSelect">
        <div v-if="!modelValue" class="upload-prompt">
          <span class="upload-icon">📄</span>
          <div class="upload-text">
            <strong>{{ label }}</strong>
            <span class="upload-hint">{{ t('fileUpload.dragDropOrClick') }}</span>
          </div>
        </div>

        <div v-else class="file-info">
          <span class="file-icon">✓</span>
          <div class="file-details">
            <div class="file-name">{{ modelValue.name }}</div>
            <div class="file-stats" v-if="rowCount !== null">
              {{ rowCount }} {{ t('fileUpload.rowsFound') }}
            </div>
          </div>
          <button
            type="button"
            class="btn-clear"
            @click.stop="clearFile"
            :title="t('fileUpload.clearFile')"
          >
            ✕
          </button>
        </div>
      </div>

      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
    </div>

    <div v-if="modelValue" class="upload-actions">
      <button
        type="button"
        class="btn-preview"
        @click="$emit('preview')"
      >
        {{ t('fileUpload.preview') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTranslations } from '../../composables/useTranslations'

const translations = {
  en: {
    fileUpload: {
      dragDropOrClick: 'Drag & drop or click to select',
      rowsFound: 'rows found',
      clearFile: 'Clear file',
      preview: 'Preview',
      invalidFile: 'File must be a CSV (.csv)',
      fileTooLarge: 'File exceeds 10MB limit',
      parseError: 'Failed to parse CSV file'
    }
  },
  fr: {
    fileUpload: {
      dragDropOrClick: 'Glisser-déposer ou cliquer pour sélectionner',
      rowsFound: 'lignes trouvées',
      clearFile: 'Effacer le fichier',
      preview: 'Aperçu',
      invalidFile: 'Le fichier doit être un CSV (.csv)',
      fileTooLarge: 'Le fichier dépasse la limite de 10 Mo',
      parseError: 'Échec de l\'analyse du fichier CSV'
    }
  }
}

const { t } = useTranslations(translations)

interface Props {
  modelValue: File | null
  label: string
  required?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [file: File | null]
  'preview': []
}>()

const fileInput = ref<HTMLInputElement>()
const isDragging = ref(false)
const errorMessage = ref<string | null>(null)
const rowCount = ref<number | null>(null)

function triggerFileSelect() {
  fileInput.value?.click()
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    validateAndSetFile(file)
  }
}

function handleDragOver() {
  isDragging.value = true
}

function handleDragLeave() {
  isDragging.value = false
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  const file = event.dataTransfer?.files[0]
  if (file) {
    validateAndSetFile(file)
  }
}

function validateAndSetFile(file: File) {
  errorMessage.value = null

  // Validate file type
  if (!file.name.toLowerCase().endsWith('.csv')) {
    errorMessage.value = t('fileUpload.invalidFile')
    return
  }

  // Validate file size (10MB)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    errorMessage.value = t('fileUpload.fileTooLarge')
    return
  }

  emit('update:modelValue', file)
  parseCSVRowCount(file)
}

function clearFile() {
  emit('update:modelValue', null)
  rowCount.value = null
  errorMessage.value = null

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

async function parseCSVRowCount(file: File) {
  try {
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    // Subtract 1 for header row
    rowCount.value = Math.max(0, lines.length - 1)
  } catch (err) {
    console.error('Failed to parse CSV:', err)
    rowCount.value = null
  }
}

// Re-parse row count if file changes externally
watch(() => props.modelValue, (newFile) => {
  if (newFile) {
    parseCSVRowCount(newFile)
  } else {
    rowCount.value = null
  }
}, { immediate: true })
</script>

<style scoped>
.csv-file-upload {
  margin-bottom: var(--spacing-md);
}

.upload-area {
  border: 2px dashed var(--color-border-medium);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  transition: all 0.2s ease;
  cursor: pointer;
}

.upload-area:hover {
  border-color: var(--color-primary);
  background: var(--color-bg-tertiary);
}

.upload-area.is-dragging {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.upload-area.has-file {
  border-style: solid;
  border-color: var(--color-success);
  cursor: default;
}

.upload-area.has-error {
  border-color: var(--color-danger);
}

.file-input {
  display: none;
}

.upload-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.upload-prompt {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  width: 100%;
}

.upload-icon {
  font-size: 2rem;
}

.upload-text {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.upload-hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.file-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  width: 100%;
}

.file-icon {
  font-size: 1.5rem;
  color: var(--color-success);
}

.file-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.file-name {
  font-weight: 500;
  color: var(--color-text-primary);
}

.file-stats {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.btn-clear {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-danger);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-lg);
  line-height: 1;
  transition: opacity 0.2s ease;
}

.btn-clear:hover {
  opacity: 0.8;
}

.error-message {
  margin-top: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--color-danger-bg);
  color: var(--color-danger);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
}

.upload-actions {
  margin-top: var(--spacing-sm);
  display: flex;
  justify-content: flex-end;
}

.btn-preview {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-secondary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: opacity 0.2s ease;
}

.btn-preview:hover {
  opacity: 0.8;
}
</style>
