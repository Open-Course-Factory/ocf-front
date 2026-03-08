<template>
  <BaseModal
    :visible="visible"
    :title="t('scenarioUpload.title')"
    title-icon="fas fa-file-import"
    size="medium"
    @close="handleClose"
  >
    <!-- Upload form -->
    <div v-if="!uploadSuccess" class="scenario-upload">
      <p class="upload-description">
        {{ t('scenarioUpload.description') }}
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
          accept=".zip,.tar.gz,.tgz"
          class="file-input"
          @change="handleFileSelect"
        />

        <div class="dropzone-content" @click="triggerFileSelect">
          <div v-if="!selectedFile" class="dropzone-prompt">
            <i class="fas fa-cloud-upload-alt dropzone-icon"></i>
            <div class="dropzone-text">
              <strong>{{ t('scenarioUpload.dragDrop') }}</strong>
              <span class="dropzone-hint">{{ t('scenarioUpload.acceptedFormats') }}</span>
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
              :title="t('scenarioUpload.clearFile')"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>

      <div v-if="errorMessage" class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        {{ errorMessage }}
      </div>

      <!-- Progress bar -->
      <div v-if="isUploading" class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${uploadProgress}%` }"></div>
        </div>
        <span class="progress-text">{{ uploadProgress }}%</span>
      </div>

      <!-- Footer buttons -->
      <div class="upload-footer">
        <button
          class="btn btn-primary"
          :disabled="!selectedFile || isUploading"
          @click="handleUpload"
        >
          <i class="fas fa-file-import"></i>
          {{ t('scenarioUpload.import') }}
        </button>
        <button
          class="btn btn-secondary"
          :disabled="isUploading"
          @click="handleClose"
        >
          {{ t('scenarioUpload.cancel') }}
        </button>
      </div>
    </div>

    <!-- Success state -->
    <div v-else class="upload-success">
      <div class="success-message">
        <i class="fas fa-check-circle"></i>
        {{ t('scenarioUpload.success') }}
      </div>
      <div class="upload-footer">
        <button class="btn btn-primary" @click="handleSuccessClose">
          {{ t('scenarioUpload.close') }}
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'
import BaseModal from './BaseModal.vue'
import { useTranslations } from '../../composables/useTranslations'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

defineProps<{ visible: boolean }>()

const emit = defineEmits<{
  close: []
  uploaded: [scenario: any]
}>()

const { t } = useTranslations({
  en: {
    scenarioUpload: {
      title: 'Import KillerCoda Scenario',
      description: 'Upload a KillerCoda-compatible scenario archive (.zip or .tar.gz). The archive should contain the scenario structure with index.json, steps, and assets.',
      dragDrop: 'Drag & drop or click to select a file',
      acceptedFormats: 'Accepted formats: .zip, .tar.gz, .tgz (max 10 MB)',
      clearFile: 'Clear file',
      import: 'Import',
      cancel: 'Cancel',
      close: 'Close',
      success: 'Scenario imported successfully!',
      invalidFile: 'Invalid file type. Please select a .zip, .tar.gz, or .tgz file.',
      fileTooLarge: 'File exceeds the 10 MB size limit.',
      uploadError: 'An error occurred during upload. Please try again.'
    }
  },
  fr: {
    scenarioUpload: {
      title: 'Importer un scénario KillerCoda',
      description: 'Téléversez une archive de scénario compatible KillerCoda (.zip ou .tar.gz). L\'archive doit contenir la structure du scénario avec index.json, les étapes et les ressources.',
      dragDrop: 'Glisser-déposer ou cliquer pour sélectionner un fichier',
      acceptedFormats: 'Formats acceptés : .zip, .tar.gz, .tgz (max 10 Mo)',
      clearFile: 'Effacer le fichier',
      import: 'Importer',
      cancel: 'Annuler',
      close: 'Fermer',
      success: 'Scénario importé avec succès !',
      invalidFile: 'Type de fichier invalide. Veuillez sélectionner un fichier .zip, .tar.gz ou .tgz.',
      fileTooLarge: 'Le fichier dépasse la limite de 10 Mo.',
      uploadError: 'Une erreur est survenue lors du téléversement. Veuillez réessayer.'
    }
  }
})

const fileInput = ref<HTMLInputElement>()
const selectedFile = ref<File | null>(null)
const isDragging = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)
const errorMessage = ref<string | null>(null)
const uploadSuccess = ref(false)
const uploadedScenario = ref<any>(null)

function triggerFileSelect() {
  if (!isUploading.value) {
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

  const name = file.name.toLowerCase()
  const isValidType = name.endsWith('.zip') || name.endsWith('.tar.gz') || name.endsWith('.tgz')
  if (!isValidType) {
    errorMessage.value = t('scenarioUpload.invalidFile')
    return
  }

  if (file.size > MAX_FILE_SIZE) {
    errorMessage.value = t('scenarioUpload.fileTooLarge')
    return
  }

  selectedFile.value = file
}

function clearFile() {
  selectedFile.value = null
  errorMessage.value = null
  uploadProgress.value = 0
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

async function handleUpload() {
  if (!selectedFile.value) return

  isUploading.value = true
  uploadProgress.value = 0
  errorMessage.value = null

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)

    const response = await axios.post('/scenarios/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total) {
          uploadProgress.value = Math.round((e.loaded * 100) / e.total)
        }
      }
    })

    uploadedScenario.value = response.data
    uploadSuccess.value = true
  } catch (err: any) {
    errorMessage.value = err.response?.data?.error_message ||
      err.response?.data?.message ||
      t('scenarioUpload.uploadError')
  } finally {
    isUploading.value = false
  }
}

function handleClose() {
  if (!isUploading.value) {
    resetState()
    emit('close')
  }
}

function handleSuccessClose() {
  const scenario = uploadedScenario.value
  resetState()
  emit('uploaded', scenario)
}

function resetState() {
  selectedFile.value = null
  isDragging.value = false
  isUploading.value = false
  uploadProgress.value = 0
  errorMessage.value = null
  uploadSuccess.value = false
  uploadedScenario.value = null
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

.progress-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  min-width: 40px;
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
