<template>
  <BaseModal
    :visible="visible"
    :title="t('jsonImport.title')"
    title-icon="fas fa-file-code"
    size="medium"
    @close="handleClose"
  >
    <!-- Upload form -->
    <div v-if="!importSuccess" class="scenario-upload">
      <p class="upload-description">
        {{ t('jsonImport.description') }}
      </p>

      <div
        class="dropzone"
        :class="{
          'is-dragging': isDragging,
          'has-file': selectedFile !== null,
          'has-error': !!errorMessage
        }"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
      >
        <input
          ref="fileInput"
          type="file"
          accept=".json"
          class="file-input"
          @change="handleFileSelect"
        />

        <div class="dropzone-content" @click="triggerFileSelect">
          <div v-if="!selectedFile" class="dropzone-prompt">
            <i class="fas fa-file-code dropzone-icon"></i>
            <div class="dropzone-text">
              <strong>{{ t('jsonImport.dragDrop') }}</strong>
              <span class="dropzone-hint">{{ t('jsonImport.acceptedFormats') }}</span>
            </div>
          </div>

          <div v-else class="file-info">
            <i class="fas fa-check-circle file-icon"></i>
            <div class="file-details">
              <div class="file-name">{{ selectedFile.name }}</div>
              <div class="file-size">{{ formatFileSize(selectedFile.size) }}</div>
            </div>
            <button
              type="button"
              class="btn-clear"
              @click.stop="clearFile"
              :title="t('jsonImport.clearFile')"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Preview -->
      <div v-if="parsedData" class="preview-info">
        <i class="fas fa-info-circle"></i>
        <span>{{ t('jsonImport.preview', { title: parsedData.title, steps: parsedData.steps?.length || 0 }) }}</span>
      </div>

      <div v-if="errorMessage" class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        {{ errorMessage }}
      </div>

      <!-- Progress -->
      <div v-if="isImporting" class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill indeterminate"></div>
        </div>
        <span class="progress-text">{{ t('jsonImport.importing') }}</span>
      </div>

      <!-- Footer buttons -->
      <div class="upload-footer">
        <button
          class="btn btn-primary"
          :disabled="!parsedData || isImporting"
          @click="handleImport"
        >
          <i class="fas fa-file-import"></i>
          {{ t('jsonImport.import') }}
        </button>
        <button
          class="btn btn-secondary"
          :disabled="isImporting"
          @click="handleClose"
        >
          {{ t('jsonImport.cancel') }}
        </button>
      </div>
    </div>

    <!-- Success state -->
    <div v-else class="upload-success">
      <div class="success-message">
        <i class="fas fa-check-circle"></i>
        {{ t('jsonImport.success') }}
      </div>
      <div class="upload-footer">
        <button class="btn btn-primary" @click="handleSuccessClose">
          {{ t('jsonImport.close') }}
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BaseModal from './BaseModal.vue'
import { useTranslations } from '../../composables/useTranslations'
import { teacherService } from '../../services/domain/scenario'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const props = defineProps<{
  visible: boolean
  groupId?: string
}>()

const emit = defineEmits<{
  close: []
  imported: [scenario: any]
}>()

const { t } = useTranslations({
  en: {
    jsonImport: {
      title: 'Import JSON Scenario',
      description: 'Upload a scenario JSON file exported from OCF. The file must contain a title and steps.',
      dragDrop: 'Drag & drop or click to select a file',
      acceptedFormats: 'Accepted format: .json (max 5 MB)',
      clearFile: 'Clear file',
      import: 'Import',
      cancel: 'Cancel',
      close: 'Close',
      importing: 'Importing...',
      success: 'Scenario imported successfully!',
      preview: 'Scenario: {title} — {steps} step(s)',
      invalidFile: 'Invalid file type. Please select a .json file.',
      fileTooLarge: 'File exceeds the 5 MB size limit.',
      invalidJson: 'Invalid JSON file. Could not parse the content.',
      missingFields: 'Invalid scenario file. Missing required fields: title and steps.',
      importError: 'An error occurred during import. Please try again.'
    }
  },
  fr: {
    jsonImport: {
      title: 'Importer un scénario JSON',
      description: 'Téléversez un fichier JSON de scénario exporté depuis OCF. Le fichier doit contenir un titre et des étapes.',
      dragDrop: 'Glisser-déposer ou cliquer pour sélectionner un fichier',
      acceptedFormats: 'Format accepté : .json (max 5 Mo)',
      clearFile: 'Effacer le fichier',
      import: 'Importer',
      cancel: 'Annuler',
      close: 'Fermer',
      importing: 'Importation...',
      success: 'Scénario importé avec succès !',
      preview: 'Scénario : {title} — {steps} étape(s)',
      invalidFile: 'Type de fichier invalide. Veuillez sélectionner un fichier .json.',
      fileTooLarge: 'Le fichier dépasse la limite de 5 Mo.',
      invalidJson: 'Fichier JSON invalide. Impossible de lire le contenu.',
      missingFields: 'Fichier de scénario invalide. Champs requis manquants : titre et étapes.',
      importError: 'Une erreur est survenue lors de l\'importation. Veuillez réessayer.'
    }
  }
})

const fileInput = ref<HTMLInputElement>()
const selectedFile = ref<File | null>(null)
const parsedData = ref<any>(null)
const isDragging = ref(false)
const isImporting = ref(false)
const errorMessage = ref<string | null>(null)
const importSuccess = ref(false)
const importedScenario = ref<any>(null)

function triggerFileSelect() {
  if (!isImporting.value) {
    fileInput.value?.click()
  }
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
  parsedData.value = null

  const name = file.name.toLowerCase()
  if (!name.endsWith('.json')) {
    errorMessage.value = t('jsonImport.invalidFile')
    return
  }

  if (file.size > MAX_FILE_SIZE) {
    errorMessage.value = t('jsonImport.fileTooLarge')
    return
  }

  selectedFile.value = file
  readAndParseFile(file)
}

async function readAndParseFile(file: File) {
  try {
    const text = await file.text()
    const data = JSON.parse(text)

    if (!data.title || !data.steps) {
      errorMessage.value = t('jsonImport.missingFields')
      return
    }

    parsedData.value = data
  } catch {
    errorMessage.value = t('jsonImport.invalidJson')
  }
}

function clearFile() {
  selectedFile.value = null
  parsedData.value = null
  errorMessage.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

async function handleImport() {
  if (!parsedData.value) return

  isImporting.value = true
  errorMessage.value = null

  try {
    let response
    if (props.groupId) {
      response = await teacherService.groupImportScenarioJSON(props.groupId, parsedData.value)
    } else {
      response = await teacherService.importScenarioJSON(parsedData.value)
    }

    importedScenario.value = response
    importSuccess.value = true
  } catch (err: any) {
    errorMessage.value = err.response?.data?.error_message ||
      err.response?.data?.message ||
      t('jsonImport.importError')
  } finally {
    isImporting.value = false
  }
}

function handleClose() {
  if (!isImporting.value) {
    resetState()
    emit('close')
  }
}

function handleSuccessClose() {
  const scenario = importedScenario.value
  resetState()
  emit('imported', scenario)
}

function resetState() {
  selectedFile.value = null
  parsedData.value = null
  isDragging.value = false
  isImporting.value = false
  errorMessage.value = null
  importSuccess.value = false
  importedScenario.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<style scoped>
.scenario-upload {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.upload-description {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  margin: 0;
  line-height: 1.5;
}

.dropzone {
  border: 2px dashed var(--color-border-medium);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  transition: all 0.2s ease;
  cursor: pointer;
}

.dropzone:hover {
  border-color: var(--color-primary);
  background: var(--color-bg-tertiary);
}

.dropzone.is-dragging {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.dropzone.has-file {
  border-style: solid;
  border-color: var(--color-success);
  cursor: default;
}

.dropzone.has-error {
  border-color: var(--color-danger);
}

.file-input {
  display: none;
}

.dropzone-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.dropzone-prompt {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  width: 100%;
}

.dropzone-icon {
  font-size: 2rem;
  color: var(--color-text-secondary);
}

.dropzone-text {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.dropzone-hint {
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

.file-size {
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
  font-size: var(--font-size-base);
  line-height: 1;
  transition: opacity 0.2s ease;
}

.btn-clear:hover {
  opacity: 0.8;
}

.preview-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--color-primary-light, var(--color-bg-tertiary));
  color: var(--color-primary);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
}

.error-message {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--color-danger-bg);
  color: var(--color-danger);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
}

.progress-container {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: var(--color-bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-fill.indeterminate {
  width: 30%;
  animation: indeterminate 1.5s infinite ease-in-out;
}

@keyframes indeterminate {
  0% { margin-left: 0; }
  50% { margin-left: 70%; }
  100% { margin-left: 0; }
}

.progress-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  min-width: 80px;
  text-align: right;
}

.upload-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
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

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-dark, var(--color-primary-hover));
}

.btn-secondary {
  background-color: var(--color-secondary, var(--color-gray-600));
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-secondary-dark, var(--color-secondary-hover));
}

.upload-success {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.success-message {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--color-success-bg);
  color: var(--color-success-text);
  border: 1px solid var(--color-success-border);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
}

.success-message i {
  font-size: var(--font-size-xl);
}
</style>
