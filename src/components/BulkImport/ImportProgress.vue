<template>
  <div class="import-progress">
    <!-- Loading State -->
    <div v-if="isImporting" class="progress-state">
      <div class="progress-header">
        <h3>{{ t('progress.importing') }}</h3>
      </div>

      <div class="progress-bar-container">
        <div class="progress-bar">
          <div class="progress-bar-fill" :style="{ width: '50%' }"></div>
        </div>
      </div>

      <div class="progress-info">
        <p>{{ t('progress.pleaseWait') }}</p>
      </div>
    </div>

    <!-- Success State -->
    <div v-else-if="results && !hasErrors" class="success-state">
      <div class="status-header success">
        <div class="status-icon">✅</div>
        <h3>{{ t('progress.importComplete') }}</h3>
      </div>

      <div class="results-summary">
        <p class="processing-time">
          {{ t('progress.completedIn', { time: results.summary.processing_time }) }}
        </p>

        <h4>{{ t('progress.results') }}</h4>
        <ul class="results-list">
          <li v-if="results.summary.users_created > 0">
            {{ t('progress.usersCreated', { count: results.summary.users_created }) }}
          </li>
          <li v-if="results.summary.users_updated > 0">
            {{ t('progress.usersUpdated', { count: results.summary.users_updated }) }}
          </li>
          <li v-if="results.summary.groups_created > 0">
            {{ t('progress.groupsCreated', { count: results.summary.groups_created }) }}
          </li>
          <li v-if="results.summary.memberships_created > 0">
            {{ t('progress.membershipsCreated', { count: results.summary.memberships_created }) }}
          </li>
        </ul>

        <div v-if="results.warnings.length > 0" class="warnings-summary">
          <span class="icon">⚠️</span>
          <span>{{ t('progress.warningsCount', { count: results.warnings.length }) }}</span>
        </div>
      </div>

      <!-- Credentials Download -->
      <div v-if="credentials.length > 0" class="credentials-section">
        <div class="credentials-warning">
          <span class="warning-icon">&#x26A0;&#xFE0F;</span>
          <div class="warning-content">
            <strong>{{ t('progress.credentialsWarningTitle') }}</strong>
            <p>{{ t('progress.credentialsWarningMessage') }}</p>
          </div>
        </div>
        <button class="btn btn-warning" @click="downloadCredentials">
          {{ t('progress.downloadCredentials') }}
        </button>
      </div>

      <div class="success-actions">
        <button class="btn btn-secondary" @click="$emit('close')">
          {{ t('progress.close') }}
        </button>
        <button class="btn btn-primary" @click="$emit('viewOrganization')">
          {{ t('progress.viewOrganization') }}
        </button>
      </div>
    </div>

    <!-- Error State (with results) -->
    <div v-else-if="results && hasErrors" class="error-state">
      <div class="status-header error">
        <div class="status-icon">❌</div>
        <h3>{{ t('progress.importFailed') }}</h3>
      </div>

      <div class="error-summary">
        <p>{{ t('progress.foundErrors', { count: results.errors.length }) }}</p>

        <div class="errors-list">
          <div
            v-for="(error, index) in displayedErrors"
            :key="index"
            class="error-item"
          >
            <div class="error-header">
              <span class="error-location">
                {{ t('progress.row') }} {{ error.row }} ({{ error.file }})
              </span>
              <span v-if="error.field" class="error-field">
                {{ t('progress.field') }}: {{ error.field }}
              </span>
            </div>
            <div class="error-message">{{ error.message }}</div>
          </div>

          <button
            v-if="results.errors.length > maxDisplayedErrors && !showAllErrors"
            class="btn-show-more"
            @click="showAllErrors = true"
          >
            {{ t('progress.showMore', { count: results.errors.length - maxDisplayedErrors }) }}
          </button>
        </div>
      </div>

      <div class="error-actions">
        <button class="btn btn-secondary" @click="$emit('back')">
          {{ t('progress.fixAndRetry') }}
        </button>
        <button class="btn btn-tertiary" @click="$emit('close')">
          {{ t('progress.close') }}
        </button>
      </div>
    </div>

    <!-- Error State (without results - network error, etc) -->
    <div v-else class="error-state">
      <div class="status-header error">
        <div class="status-icon">❌</div>
        <h3>{{ t('progress.importFailed') }}</h3>
      </div>

      <div class="error-summary">
        <p>{{ t('progress.unexpectedError') }}</p>
      </div>

      <div class="error-actions">
        <button class="btn btn-secondary" @click="$emit('back')">
          {{ t('progress.fixAndRetry') }}
        </button>
        <button class="btn btn-tertiary" @click="$emit('close')">
          {{ t('progress.close') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ImportResponse, UserCredential } from '../../services/domain/bulkImport'
import { useTranslations } from '../../composables/useTranslations'

const translations = {
  en: {
    progress: {
      importing: 'Importing...',
      pleaseWait: 'Please wait, do not close this window.',
      importComplete: 'Import Complete!',
      completedIn: 'Successfully imported data in {time}',
      results: 'Results:',
      usersCreated: 'Users created: {count}',
      usersUpdated: 'Users updated: {count}',
      groupsCreated: 'Groups created: {count}',
      membershipsCreated: 'Memberships created: {count}',
      warningsCount: 'Warnings: {count} (view details)',
      close: 'Close',
      viewOrganization: 'View Organization',
      importFailed: 'Import Failed',
      foundErrors: 'Found {count} critical errors. No data was imported.',
      unexpectedError: 'An unexpected error occurred during import. Please try again.',
      row: 'Row',
      field: 'Field',
      showMore: 'Show {count} more errors',
      fixAndRetry: 'Fix & Retry',
      credentialsWarningTitle: 'Generated Credentials',
      credentialsWarningMessage: 'Passwords were auto-generated for users without a password. These credentials cannot be retrieved later. Download them now.',
      downloadCredentials: 'Download Credentials (CSV)',
    }
  },
  fr: {
    progress: {
      importing: 'Importation en cours...',
      pleaseWait: 'Veuillez patienter, ne fermez pas cette fenêtre.',
      importComplete: 'Importation terminée !',
      completedIn: 'Données importées avec succès en {time}',
      results: 'Résultats :',
      usersCreated: 'Utilisateurs créés : {count}',
      usersUpdated: 'Utilisateurs mis à jour : {count}',
      groupsCreated: 'Groupes créés : {count}',
      membershipsCreated: 'Adhésions créées : {count}',
      warningsCount: 'Avertissements : {count} (voir les détails)',
      close: 'Fermer',
      viewOrganization: 'Voir l\'organisation',
      importFailed: 'Échec de l\'importation',
      foundErrors: '{count} erreurs critiques trouvées. Aucune donnée n\'a été importée.',
      unexpectedError: 'Une erreur inattendue s\'est produite lors de l\'importation. Veuillez réessayer.',
      row: 'Ligne',
      field: 'Champ',
      showMore: 'Afficher {count} erreurs supplémentaires',
      fixAndRetry: 'Corriger et réessayer',
      credentialsWarningTitle: 'Identifiants générés',
      credentialsWarningMessage: 'Des mots de passe ont été générés automatiquement pour les utilisateurs sans mot de passe. Ces identifiants ne pourront pas être récupérés plus tard. Téléchargez-les maintenant.',
      downloadCredentials: 'Télécharger les identifiants (CSV)',
    }
  }
}

const { t } = useTranslations(translations)

interface Props {
  isImporting: boolean
  results: ImportResponse | null
}

const props = defineProps<Props>()

defineEmits<{
  'close': []
  'viewOrganization': []
  'back': []
}>()

const maxDisplayedErrors = 5
const showAllErrors = ref(false)

const credentials = computed<UserCredential[]>(() =>
  props.results?.credentials || []
)

const hasErrors = computed(() =>
  props.results ? props.results.errors.length > 0 : false
)

const displayedErrors = computed(() => {
  if (!props.results) return []
  if (showAllErrors.value) return props.results.errors
  return props.results.errors.slice(0, maxDisplayedErrors)
})

function downloadCredentials() {
  if (credentials.value.length === 0) return

  const header = 'email,password,name'
  const rows = credentials.value.map(c =>
    `${c.email},${c.password},"${c.name}"`
  )
  const csvContent = [header, ...rows].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `import_credentials_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.import-progress {
  min-height: 300px;
}

.progress-state,
.success-state,
.error-state {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.progress-header {
  text-align: center;
}

.progress-header h3 {
  margin: 0;
  color: var(--color-text-primary);
}

.progress-bar-container {
  padding: 0 var(--spacing-lg);
}

.progress-bar {
  height: 24px;
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  border: 1px solid var(--color-border-medium);
}

.progress-bar-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.3s ease;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.progress-info {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.status-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-md);
}

.status-header.success {
  background: var(--color-success-bg);
}

.status-header.error {
  background: var(--color-danger-bg);
}

.status-icon {
  font-size: 2.5rem;
}

.status-header h3 {
  margin: 0;
  color: var(--color-text-primary);
}

.results-summary,
.error-summary {
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
}

.processing-time {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.results-summary h4 {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--color-text-primary);
}

.results-list {
  list-style: none;
  padding: 0;
  margin: 0 0 var(--spacing-md) 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.results-list li {
  padding-left: var(--spacing-md);
  position: relative;
  color: var(--color-text-secondary);
}

.results-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--color-success);
}

.warnings-summary {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--color-warning-bg);
  border-radius: var(--border-radius-md);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.warnings-summary .icon {
  font-size: 1.25rem;
}

.error-summary p {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-text-primary);
}

.errors-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.error-item {
  padding: var(--spacing-md);
  background: var(--color-danger-bg);
  border-radius: var(--border-radius-md);
  border-left: 4px solid var(--color-danger);
}

.error-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
  font-size: var(--font-size-sm);
}

.error-location {
  font-weight: 600;
  color: var(--color-text-primary);
}

.error-field {
  color: var(--color-text-secondary);
}

.error-message {
  color: var(--color-text-primary);
}

.btn-show-more {
  padding: var(--spacing-sm);
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  transition: background 0.2s ease;
}

.btn-show-more:hover {
  background: var(--color-bg-secondary);
}

.credentials-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.credentials-warning {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-warning-bg);
  border-radius: var(--border-radius-md);
  border-left: 4px solid var(--color-warning);
}

.warning-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.warning-content {
  flex: 1;
}

.warning-content strong {
  display: block;
  margin-bottom: var(--spacing-xs);
  color: var(--color-text-primary);
}

.warning-content p {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.btn-warning {
  background: var(--color-warning);
  color: var(--color-text-primary);
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-base);
  font-weight: 600;
  transition: opacity 0.2s ease;
  align-self: flex-start;
}

.btn-warning:hover {
  opacity: 0.85;
}

.success-actions,
.error-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border-medium);
}

.btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-base);
  font-weight: 500;
  transition: opacity 0.2s ease;
}

.btn:hover {
  opacity: 0.8;
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-white);
}

.btn-secondary {
  background: var(--color-secondary);
  color: var(--color-white);
}

.btn-tertiary {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-medium);
}
</style>
