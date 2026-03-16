<template>
  <div class="feedback-settings-page">
    <div class="page-header">
      <h1><i class="fas fa-comment-dots"></i> {{ t('feedbackSettings.title') }}</h1>
      <p class="page-description">{{ t('feedbackSettings.description') }}</p>
    </div>

    <div v-if="isLoading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      {{ t('feedbackSettings.loading') }}
    </div>

    <div v-else-if="loadError" class="error-state">
      <i class="fas fa-exclamation-triangle"></i>
      {{ loadError }}
    </div>

    <div v-else class="settings-card">
      <h2 class="section-title">{{ t('feedbackSettings.recipientsTitle') }}</h2>
      <p class="section-description">{{ t('feedbackSettings.recipientsDescription') }}</p>

      <!-- Current recipients list -->
      <div class="recipients-list">
        <div
          v-for="(email, index) in recipients"
          :key="index"
          class="recipient-item"
        >
          <span class="recipient-email">
            <i class="fas fa-envelope"></i>
            {{ email }}
          </span>
          <button
            class="btn-icon btn-danger-icon"
            :title="t('feedbackSettings.removeRecipient')"
            @click="removeRecipient(index)"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div v-if="recipients.length === 0" class="empty-state">
          {{ t('feedbackSettings.noRecipients') }}
        </div>
      </div>

      <!-- Add new recipient -->
      <div class="add-recipient">
        <input
          v-model="newEmail"
          type="email"
          class="form-input"
          :placeholder="t('feedbackSettings.emailPlaceholder')"
          @keydown.enter.prevent="addRecipient"
        />
        <button
          class="btn btn-primary btn-sm"
          :disabled="!isValidEmail"
          @click="addRecipient"
        >
          <i class="fas fa-plus"></i>
          {{ t('feedbackSettings.add') }}
        </button>
      </div>
      <p v-if="newEmail && !isValidEmail" class="validation-error">
        {{ t('feedbackSettings.invalidEmail') }}
      </p>

      <!-- Save button -->
      <div class="actions">
        <button
          class="btn btn-primary"
          :disabled="isSaving || !hasChanges"
          @click="saveRecipients"
        >
          <i v-if="isSaving" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-save"></i>
          {{ isSaving ? t('feedbackSettings.saving') : t('feedbackSettings.save') }}
        </button>
      </div>

      <div v-if="saveSuccess" class="save-success">
        <i class="fas fa-check-circle"></i>
        {{ t('feedbackSettings.saveSuccess') }}
      </div>
      <div v-if="saveError" class="save-error">
        <i class="fas fa-exclamation-triangle"></i>
        {{ saveError }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useTranslations } from '../../composables/useTranslations'

const { t } = useTranslations({
  en: {
    feedbackSettings: {
      title: 'Feedback Settings',
      description: 'Configure which email addresses receive user feedback.',
      loading: 'Loading settings...',
      recipientsTitle: 'Email Recipients',
      recipientsDescription: 'Feedback messages will be sent to these email addresses.',
      noRecipients: 'No recipients configured yet.',
      emailPlaceholder: 'Enter email address...',
      add: 'Add',
      removeRecipient: 'Remove recipient',
      invalidEmail: 'Please enter a valid email address.',
      save: 'Save',
      saving: 'Saving...',
      saveSuccess: 'Recipients saved successfully.',
      saveError: 'Failed to save recipients. Please try again.',
      loadError: 'Failed to load feedback settings.'
    }
  },
  fr: {
    feedbackSettings: {
      title: 'Paramètres de Feedback',
      description: 'Configurez les adresses e-mail qui reçoivent les retours utilisateurs.',
      loading: 'Chargement des paramètres...',
      recipientsTitle: 'Destinataires',
      recipientsDescription: 'Les messages de retour seront envoyés à ces adresses e-mail.',
      noRecipients: 'Aucun destinataire configuré.',
      emailPlaceholder: 'Entrer une adresse e-mail...',
      add: 'Ajouter',
      removeRecipient: 'Supprimer le destinataire',
      invalidEmail: 'Veuillez entrer une adresse e-mail valide.',
      save: 'Enregistrer',
      saving: 'Enregistrement...',
      saveSuccess: 'Destinataires enregistrés avec succès.',
      saveError: 'Échec de l\'enregistrement. Veuillez réessayer.',
      loadError: 'Échec du chargement des paramètres de feedback.'
    }
  }
})

const isLoading = ref(true)
const loadError = ref('')
const isSaving = ref(false)
const saveSuccess = ref(false)
const saveError = ref('')
const newEmail = ref('')
const recipients = ref<string[]>([])
const originalRecipients = ref<string[]>([])
const featureId = ref<string>('')

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const isValidEmail = computed(() => {
  return emailRegex.test(newEmail.value) && !recipients.value.includes(newEmail.value)
})

const hasChanges = computed(() => {
  return JSON.stringify(recipients.value) !== JSON.stringify(originalRecipients.value)
})

function addRecipient() {
  if (!isValidEmail.value) return
  recipients.value.push(newEmail.value.trim())
  newEmail.value = ''
}

function removeRecipient(index: number) {
  recipients.value.splice(index, 1)
}

async function loadSettings() {
  isLoading.value = true
  loadError.value = ''

  try {
    const response = await axios.get('features')
    const features = response.data?.data || response.data || []
    const feedbackFeature = features.find(
      (f: any) => f.key === 'feedback_recipients'
    )

    if (feedbackFeature) {
      featureId.value = feedbackFeature.id || feedbackFeature.ID
      try {
        const parsed = JSON.parse(feedbackFeature.value || '[]')
        recipients.value = Array.isArray(parsed) ? parsed : []
      } catch {
        recipients.value = []
      }
      originalRecipients.value = [...recipients.value]
    }
  } catch (err: any) {
    loadError.value = err.response?.data?.error_message
      || err.response?.data?.message
      || t('feedbackSettings.loadError')
  } finally {
    isLoading.value = false
  }
}

async function saveRecipients() {
  if (isSaving.value || !featureId.value) return

  isSaving.value = true
  saveSuccess.value = false
  saveError.value = ''

  try {
    await axios.patch(`features/${featureId.value}`, {
      value: JSON.stringify(recipients.value)
    })

    originalRecipients.value = [...recipients.value]
    saveSuccess.value = true

    setTimeout(() => {
      saveSuccess.value = false
    }, 3000)
  } catch (err: any) {
    saveError.value = err.response?.data?.error_message
      || err.response?.data?.message
      || t('feedbackSettings.saveError')
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.feedback-settings-page {
  max-width: 700px;
  margin: 0 auto;
  padding: var(--spacing-lg);
}

.page-header {
  margin-bottom: var(--spacing-xl);
}

.page-header h1 {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-text-primary);
  font-size: var(--font-size-2xl);
  margin: 0 0 var(--spacing-xs) 0;
}

.page-description {
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  margin: 0;
}

.loading-state,
.error-state {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
  font-size: var(--font-size-base);
}

.loading-state {
  color: var(--color-text-secondary);
}

.error-state {
  color: var(--color-danger);
}

.settings-card {
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
}

.section-title {
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.section-description {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  margin: 0 0 var(--spacing-lg) 0;
}

.recipients-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
}

.recipient-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
}

.recipient-email {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.recipient-email i {
  color: var(--color-text-muted);
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--spacing-xs);
  border-radius: var(--border-radius-sm);
  transition: all 0.2s ease;
}

.btn-danger-icon {
  color: var(--color-text-muted);
}

.btn-danger-icon:hover {
  color: var(--color-danger);
  background-color: var(--color-bg-primary);
}

.empty-state {
  padding: var(--spacing-md);
  text-align: center;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-style: italic;
}

.add-recipient {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
}

.form-input {
  flex: 1;
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.validation-error {
  color: var(--color-danger);
  font-size: var(--font-size-xs);
  margin: 0 0 var(--spacing-sm) 0;
}

.actions {
  margin-top: var(--spacing-lg);
  display: flex;
  justify-content: flex-end;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-base);
  font-weight: 500;
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: var(--border-radius-md);
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-white);
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.btn-sm {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-sm);
}

.save-success {
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-success-bg);
  color: var(--color-success-text);
  border: 1px solid var(--color-success-border);
  border-radius: var(--border-radius-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
}

.save-error {
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
  border: 1px solid var(--color-danger-border);
  border-radius: var(--border-radius-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
}
</style>
