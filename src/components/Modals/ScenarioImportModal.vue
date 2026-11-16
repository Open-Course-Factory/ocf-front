<template>
  <BaseModal
    :visible="visible"
    :title="t(`scenarioImportModal.${format}.title`)"
    :title-icon="spec.titleIcon"
    size="medium"
    @close="handleClose"
  >
    <!-- Upload form -->
    <div v-if="!importSuccess" class="scenario-upload">
      <p class="upload-description">
        {{ t(`scenarioImportModal.${format}.description`) }}
      </p>

      <div
        class="dropzone"
        :class="{
          'is-dragging': isDragging,
          'has-file': selectedFile !== null,
          'has-error': !!errorMessage
        }"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
      >
        <input
          ref="fileInput"
          type="file"
          :accept="spec.accept"
          class="file-input"
          @change="handleFileSelect"
        />

        <div class="dropzone-content" @click="triggerFileSelect">
          <div v-if="!selectedFile" class="dropzone-prompt">
            <i :class="[spec.dropIcon, 'dropzone-icon']"></i>
            <div class="dropzone-text">
              <strong>{{ t('scenarioImportModal.dragDrop') }}</strong>
              <span class="dropzone-hint">{{ t(`scenarioImportModal.${format}.acceptedFormats`) }}</span>
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
              :title="t('scenarioImportModal.clearFile')"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Preview (JSON only: the archive is read by the server) -->
      <div v-if="parsedData" class="preview-info">
        <i class="fas fa-info-circle"></i>
        <span>{{ t('scenarioImportModal.preview', { title: parsedData.title, steps: parsedData.steps?.length || 0 }) }}</span>
      </div>

      <ScenarioImportProblems v-if="problems.length" :title="errorMessage || ''" :problems="problems" />
      <div v-else-if="errorMessage" class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        {{ errorMessage }}
      </div>

      <!-- Progress: the JSON post reports none, the archive upload a percentage -->
      <div v-if="isImporting" class="progress-container">
        <div class="progress-bar">
          <div v-if="format === 'json'" class="progress-fill indeterminate"></div>
          <div v-else class="progress-fill" :style="{ width: `${uploadProgress}%` }"></div>
        </div>
        <span class="progress-text">{{ format === 'json' ? t('scenarioImportModal.importing') : `${uploadProgress}%` }}</span>
      </div>

      <!-- Footer buttons -->
      <div class="upload-footer">
        <button
          class="btn btn-primary"
          :disabled="!canImport || isImporting"
          @click="handleImport"
        >
          <i class="fas fa-file-import"></i>
          {{ t('scenarioImportModal.import') }}
        </button>
        <button
          class="btn btn-secondary"
          :disabled="isImporting"
          @click="handleClose"
        >
          {{ t('scenarioImportModal.cancel') }}
        </button>
      </div>
    </div>

    <!-- Success state -->
    <div v-else class="upload-success">
      <div class="success-message">
        <i class="fas fa-check-circle"></i>
        {{ t('scenarioImportModal.success') }}
      </div>
      <div class="upload-footer">
        <button class="btn btn-primary" @click="handleSuccessClose">
          {{ t('scenarioImportModal.close') }}
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseModal from './BaseModal.vue'
import ScenarioImportProblems from '../ScenarioEditor/ScenarioImportProblems.vue'
import { useTranslations } from '../../composables/useTranslations'
import { useScenarioImportError } from '../../composables/useScenarioImportError'
import { teacherService } from '../../services/domain/scenario'
import { scenarioImportProblems } from '../../utils/scenarioImportProblems'

type ImportFormat = 'json' | 'archive'

const props = defineProps<{
  visible: boolean
  format: ImportFormat
  groupId?: string
  organizationId?: string
}>()

const emit = defineEmits<{
  close: []
  imported: [scenario: any]
}>()

const MB = 1024 * 1024
const FORMATS = {
  json: {
    titleIcon: 'fas fa-file-code',
    dropIcon: 'fas fa-file-code',
    accept: '.json',
    extensions: ['.json'],
    maxSize: 5 * MB,
  },
  archive: {
    titleIcon: 'fas fa-file-import',
    dropIcon: 'fas fa-cloud-upload-alt',
    accept: '.zip,.tar.gz,.tgz',
    extensions: ['.zip', '.tar.gz', '.tgz'],
    maxSize: 10 * MB,
  },
} as const
const spec = computed(() => FORMATS[props.format])

const describeImportError = useScenarioImportError()
const { t } = useTranslations({
  en: {
    scenarioImportModal: {
      json: {
        title: 'Import JSON Scenario',
        description: 'Upload a scenario JSON file exported from Labinux. The file must contain a title and steps.',
        acceptedFormats: 'Accepted format: .json (max 5 MB)',
        invalidFile: 'Invalid file type. Please select a .json file.',
        fileTooLarge: 'File exceeds the 5 MB size limit.'
      },
      archive: {
        title: 'Import KillerCoda Scenario',
        description: 'Upload a KillerCoda-compatible scenario archive (.zip or .tar.gz). The archive should contain the scenario structure with index.json, steps, and assets.',
        acceptedFormats: 'Accepted formats: .zip, .tar.gz, .tgz (max 10 MB)',
        invalidFile: 'Invalid file type. Please select a .zip, .tar.gz, or .tgz file.',
        fileTooLarge: 'File exceeds the 10 MB size limit.'
      },
      dragDrop: 'Drag & drop or click to select a file',
      clearFile: 'Clear file',
      import: 'Import',
      cancel: 'Cancel',
      close: 'Close',
      importing: 'Importing...',
      success: 'Scenario imported successfully!',
      preview: 'Scenario: {title} — {steps} step(s)',
      invalidJson: 'Invalid JSON file. Could not parse the content.',
      missingFields: 'Invalid scenario file. Missing required fields: title and steps.',
      importError: 'An error occurred during import. Please try again.'
    }
  },
  fr: {
    scenarioImportModal: {
      json: {
        title: 'Importer un scénario JSON',
        description: 'Téléversez un fichier JSON de scénario exporté depuis Labinux. Le fichier doit contenir un titre et des étapes.',
        acceptedFormats: 'Format accepté : .json (max 5 Mo)',
        invalidFile: 'Type de fichier invalide. Veuillez sélectionner un fichier .json.',
        fileTooLarge: 'Le fichier dépasse la limite de 5 Mo.'
      },
      archive: {
        title: 'Importer un scénario KillerCoda',
        description: 'Téléversez une archive de scénario compatible KillerCoda (.zip ou .tar.gz). L\'archive doit contenir la structure du scénario avec index.json, les étapes et les ressources.',
        acceptedFormats: 'Formats acceptés : .zip, .tar.gz, .tgz (max 10 Mo)',
        invalidFile: 'Type de fichier invalide. Veuillez sélectionner un fichier .zip, .tar.gz ou .tgz.',
        fileTooLarge: 'Le fichier dépasse la limite de 10 Mo.'
      },
      dragDrop: 'Glisser-déposer ou cliquer pour sélectionner un fichier',
      clearFile: 'Effacer le fichier',
      import: 'Importer',
      cancel: 'Annuler',
      close: 'Fermer',
      importing: 'Import en cours…',
      success: 'Scénario importé avec succès !',
      preview: 'Scénario : {title} — {steps} étape(s)',
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
const uploadProgress = ref(0)
const errorMessage = ref<string | null>(null)
const problems = ref<string[]>([])
const importSuccess = ref(false)
const importedScenario = ref<any>(null)

// JSON is sent parsed, so it needs a readable file; an archive goes as is.
const canImport = computed(() => props.format === 'json' ? !!parsedData.value : !!selectedFile.value)

function triggerFileSelect() {
  if (!isImporting.value) {
    fileInput.value?.click()
  }
}

function handleFileSelect(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) validateAndSetFile(file)
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  const file = event.dataTransfer?.files[0]
  if (file) validateAndSetFile(file)
}

async function validateAndSetFile(file: File) {
  clearFile()

  const name = file.name.toLowerCase()
  if (!spec.value.extensions.some(ext => name.endsWith(ext))) {
    errorMessage.value = t(`scenarioImportModal.${props.format}.invalidFile`)
    return
  }
  if (file.size > spec.value.maxSize) {
    errorMessage.value = t(`scenarioImportModal.${props.format}.fileTooLarge`)
    return
  }

  selectedFile.value = file
  if (props.format === 'json') await readAndParseFile(file)
}

async function readAndParseFile(file: File) {
  try {
    const data = JSON.parse(await file.text())
    if (!data.title || !data.steps) {
      errorMessage.value = t('scenarioImportModal.missingFields')
      return
    }
    parsedData.value = data
  } catch {
    errorMessage.value = t('scenarioImportModal.invalidJson')
  }
}

function clearMessages() {
  errorMessage.value = null
  problems.value = []
}

function clearFile() {
  selectedFile.value = null
  parsedData.value = null
  uploadProgress.value = 0
  clearMessages()
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function sendFile() {
  const file = selectedFile.value!
  if (props.format === 'json') {
    return teacherService.importScenarioJSONInto(
      { groupId: props.groupId, organizationId: props.organizationId },
      parsedData.value
    )
  }
  const onProgress = (percent: number) => { uploadProgress.value = percent }
  if (props.groupId) return teacherService.groupUploadScenario(props.groupId, file, onProgress)
  if (props.organizationId) return teacherService.orgUploadScenario(props.organizationId, file, onProgress)
  return teacherService.uploadScenario(file, onProgress)
}

async function handleImport() {
  if (!canImport.value) return

  isImporting.value = true
  uploadProgress.value = 0
  clearMessages()

  try {
    importedScenario.value = await sendFile()
    importSuccess.value = true
  } catch (err: any) {
    problems.value = scenarioImportProblems(err)
    errorMessage.value = describeImportError(err, t('scenarioImportModal.importError'))
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
  clearFile()
  isDragging.value = false
  isImporting.value = false
  importSuccess.value = false
  importedScenario.value = null
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < MB) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / MB).toFixed(1)} MB`
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
