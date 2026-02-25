<template>
  <div class="bulk-import-page">
    <div class="page-header">
      <h1>{{ t('bulkImport.title') }}</h1>
      <p class="page-subtitle">
        {{ t('bulkImport.subtitle') }}
        <span v-if="organizationName" class="organization-name">{{ organizationName }}</span>
      </p>
    </div>

    <!-- Step 1: Upload Files -->
    <div v-if="importStore.step === 'upload'" class="upload-step">
      <div class="step-header">
        <h2>📥 {{ t('bulkImport.step1Title') }}</h2>
      </div>

      <div class="file-uploads">
        <CSVFileUpload
          v-model="importStore.usersFile"
          :label="t('bulkImport.usersFileLabel')"
          :required="true"
          @preview="showPreview('users')"
        />

        <CSVFileUpload
          v-model="importStore.groupsFile"
          :label="t('bulkImport.groupsFileLabel')"
          @preview="showPreview('groups')"
        />

        <CSVFileUpload
          v-model="importStore.membershipsFile"
          :label="t('bulkImport.membershipsFileLabel')"
          @preview="showPreview('memberships')"
        />
      </div>

      <div class="import-options">
        <h3>⚙️ {{ t('bulkImport.step2Title') }}</h3>

        <div class="option-item">
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="importStore.updateExisting"
            />
            <span>{{ t('bulkImport.updateExistingLabel') }}</span>
          </label>
          <p class="option-hint">{{ t('bulkImport.updateExistingHint') }}</p>
        </div>

        <div class="option-item">
          <label class="select-label" for="targetGroup">
            {{ t('bulkImport.targetGroupLabel') }}
          </label>
          <select
            id="targetGroup"
            v-model="importStore.targetGroupId"
            class="target-group-select"
          >
            <option value="">{{ t('bulkImport.targetGroupNone') }}</option>
            <option
              v-for="group in organizationGroups"
              :key="group.id"
              :value="group.id"
            >
              {{ group.display_name || group.name }}
            </option>
          </select>
          <p class="option-hint">{{ t('bulkImport.targetGroupHint') }}</p>
        </div>
      </div>

      <div class="tips-section">
        <h4>💡 {{ t('bulkImport.tipsTitle') }}</h4>
        <ul class="tips-list">
          <li>{{ t('bulkImport.tip1') }}</li>
          <li>{{ t('bulkImport.tip2') }}</li>
          <li>{{ t('bulkImport.tip3') }}</li>
        </ul>
      </div>

      <div class="action-buttons">
        <button class="btn btn-link" @click="downloadTemplates">
          {{ t('bulkImport.downloadExamples') }}
        </button>
        <div class="action-buttons-right">
          <button class="btn btn-secondary" @click="handleCancel">
            {{ t('bulkImport.cancel') }}
          </button>
          <button
            class="btn btn-primary"
            :disabled="!importStore.hasFiles || importStore.isValidating"
            @click="handleValidate"
          >
            {{ importStore.isValidating ? t('bulkImport.validating') : t('bulkImport.validateImport') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Step 2: Validating -->
    <div v-else-if="importStore.step === 'validating'" class="validating-step">
      <div class="loading-state">
        <div class="spinner"></div>
        <h3>{{ t('bulkImport.validating') }}</h3>
        <p>{{ t('bulkImport.validatingHint') }}</p>
      </div>
    </div>

    <!-- Step 3: Validation Results -->
    <div v-else-if="importStore.step === 'validation-results'" class="validation-step">
      <ValidationResults
        v-if="importStore.validationResults"
        :results="importStore.validationResults"
        @back="importStore.goToStep('upload')"
        @proceed="handleImport"
      />
    </div>

    <!-- Step 4: Importing / Success / Error -->
    <div v-else-if="['importing', 'success', 'error'].includes(importStore.step)" class="import-step">
      <ImportProgress
        :is-importing="importStore.isImporting"
        :results="importStore.importResults"
        @close="handleClose"
        @viewOrganization="handleViewOrganization"
        @back="importStore.goToStep('upload')"
      />
    </div>

    <!-- CSV Preview Modal -->
    <CSVPreview
      :visible="previewModal.visible"
      :file="previewModal.file"
      :title="previewModal.title"
      @close="closePreview"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useBulkImportStore } from '../../stores/bulkImport'
import { useOrganizationsStore } from '../../stores/organizations'
import { useTranslations } from '../../composables/useTranslations'
import CSVFileUpload from '../BulkImport/CSVFileUpload.vue'
import CSVPreview from '../BulkImport/CSVPreview.vue'
import ValidationResults from '../BulkImport/ValidationResults.vue'
import ImportProgress from '../BulkImport/ImportProgress.vue'

const translations = {
  en: {
    bulkImport: {
      title: 'Bulk Import Users & Groups',
      subtitle: 'Organization:',
      step1Title: 'Step 1: Upload CSV Files',
      step2Title: 'Step 2: Import Options',
      usersFileLabel: '📄 Users CSV (Required)',
      groupsFileLabel: '📄 Groups CSV (Optional)',
      membershipsFileLabel: '📄 Memberships CSV (Optional)',
      updateExistingLabel: 'Update existing users if found',
      updateExistingHint: 'When enabled, existing users will be updated instead of skipped',
      targetGroupLabel: 'Target group (optional)',
      targetGroupNone: '— No target group —',
      targetGroupHint: 'All imported users will be added as members to this group',
      tipsTitle: 'Tips',
      tip1: 'Only email + name columns are required. Password and role are optional (auto-generated if missing)',
      tip2: 'Use the target group dropdown to automatically assign all imported users to a group',
      tip3: 'Download credentials after import — auto-generated passwords cannot be retrieved later',
      downloadExamples: 'Download Examples',
      cancel: 'Cancel',
      validateImport: 'Validate & Import',
      validating: 'Validating...',
      validatingHint: 'Please wait while we validate your files',
      loadError: 'Failed to load organization',
      permissionError: 'You do not have permission to import data for this organization'
    }
  },
  fr: {
    bulkImport: {
      title: 'Importation groupée d\'utilisateurs et de groupes',
      subtitle: 'Organisation :',
      step1Title: 'Étape 1 : Télécharger les fichiers CSV',
      step2Title: 'Étape 2 : Options d\'importation',
      usersFileLabel: '📄 CSV des utilisateurs (Requis)',
      groupsFileLabel: '📄 CSV des groupes (Optionnel)',
      membershipsFileLabel: '📄 CSV des adhésions (Optionnel)',
      updateExistingLabel: 'Mettre à jour les utilisateurs existants si trouvés',
      updateExistingHint: 'Lorsque activé, les utilisateurs existants seront mis à jour au lieu d\'être ignorés',
      targetGroupLabel: 'Groupe cible (optionnel)',
      targetGroupNone: '— Pas de groupe cible —',
      targetGroupHint: 'Tous les utilisateurs importés seront ajoutés comme membres de ce groupe',
      tipsTitle: 'Conseils',
      tip1: 'Seules les colonnes email + nom sont requises. Le mot de passe et le rôle sont optionnels (générés automatiquement si absents)',
      tip2: 'Utilisez le menu déroulant du groupe cible pour assigner automatiquement tous les utilisateurs importés à un groupe',
      tip3: 'Téléchargez les identifiants après l\'importation — les mots de passe générés automatiquement ne pourront pas être récupérés plus tard',
      downloadExamples: 'Télécharger des exemples',
      cancel: 'Annuler',
      validateImport: 'Valider et importer',
      validating: 'Validation en cours...',
      validatingHint: 'Veuillez patienter pendant la validation de vos fichiers',
      loadError: 'Échec du chargement de l\'organisation',
      permissionError: 'Vous n\'avez pas la permission d\'importer des données pour cette organisation'
    }
  }
}

const { t } = useTranslations(translations)

const route = useRoute()
const router = useRouter()
const importStore = useBulkImportStore()
const organizationsStore = useOrganizationsStore()

const organizationId = ref<string>('')
const organizationName = computed(() => {
  const org = organizationsStore.organizations.find(o => o.id === organizationId.value)
  return org?.display_name || org?.name || ''
})

const organizationGroups = ref<Array<{ id: string; name: string; display_name: string }>>([])

const previewModal = ref({
  visible: false,
  file: null as File | null,
  title: ''
})

onMounted(async () => {
  organizationId.value = route.params.id as string

  // Load organization details
  if (organizationsStore.organizations.length === 0) {
    await organizationsStore.loadOrganizations()
  }

  // Load organization groups for target group dropdown
  try {
    const groupsResponse = await axios.get(`/organizations/${organizationId.value}/groups`)
    organizationGroups.value = groupsResponse.data || []
  } catch (err) {
    console.warn('Could not load organization groups:', err)
  }

  // Reset import store
  importStore.reset()
})

function showPreview(type: 'users' | 'groups' | 'memberships') {
  let file: File | null = null
  let title = ''

  switch (type) {
    case 'users':
      file = importStore.usersFile
      title = t('bulkImport.usersFileLabel')
      break
    case 'groups':
      file = importStore.groupsFile
      title = t('bulkImport.groupsFileLabel')
      break
    case 'memberships':
      file = importStore.membershipsFile
      title = t('bulkImport.membershipsFileLabel')
      break
  }

  if (file) {
    previewModal.value = {
      visible: true,
      file,
      title
    }
  }
}

function closePreview() {
  previewModal.value.visible = false
}

async function handleValidate() {
  await importStore.validateImport(organizationId.value)
}

async function handleImport() {
  const success = await importStore.performImport(organizationId.value)
  if (success) {
    // Reload organization data
    await organizationsStore.loadOrganizations()
  }
}

function handleCancel() {
  router.push(`/organizations/${organizationId.value}`)
}

function handleClose() {
  importStore.reset()
  router.push(`/organizations/${organizationId.value}`)
}

function handleViewOrganization() {
  importStore.reset()
  router.push(`/organizations/${organizationId.value}`)
}

function downloadTemplates() {
  // Download example CSV templates
  const templates = {
    users_simple: {
      filename: 'users_simple_template.csv',
      content: `email,name
marie.dupont@school.fr,DUPONT Marie
jean.martin@school.fr,MARTIN Jean`
    },
    users: {
      filename: 'users_template.csv',
      content: `email,first_name,last_name,password,role,external_id,force_reset,update_existing
john.doe@school.fr,John,Doe,TempPass123!,member,student_001,true,false
jane.smith@school.fr,Jane,Smith,TempPass456!,supervisor,teacher_001,true,false`
    },
    groups: {
      filename: 'groups_template.csv',
      content: `group_name,display_name,description,parent_group,max_members,expires_at,external_id
m1_devops,M1 DevOps,Master 1 DevOps - All classes,,150,,dept_devops
m1_devops_a,M1 DevOps A,Master 1 DevOps - Class A,m1_devops,50,2026-06-30T23:59:59Z,class_a`
    },
    memberships: {
      filename: 'memberships_template.csv',
      content: `user_email,group_name,role
john.doe@school.fr,m1_devops_a,member
jane.smith@school.fr,m1_devops_a,admin`
    }
  }

  Object.values(templates).forEach(template => {
    const blob = new Blob([template.content], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = template.filename
    a.click()
    URL.revokeObjectURL(url)
  })
}
</script>

<style scoped>
.bulk-import-page {
  max-width: 900px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.page-header {
  margin-bottom: var(--spacing-xl);
}

.page-header h1 {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--color-text-primary);
}

.page-subtitle {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
}

.organization-name {
  font-weight: 600;
  color: var(--color-primary);
}

.upload-step {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.step-header h2 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-xl);
}

.file-uploads {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.import-options {
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
}

.import-options h3 {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
}

.option-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  color: var(--color-text-primary);
  font-weight: 500;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.option-hint {
  margin: 0;
  padding-left: calc(18px + var(--spacing-sm));
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.select-label {
  display: block;
  margin-bottom: var(--spacing-xs);
  font-weight: 500;
  color: var(--color-text-primary);
}

.target-group-select {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--border-radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  cursor: pointer;
}

.target-group-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-light);
}

.tips-section {
  padding: var(--spacing-lg);
  background: var(--color-info-bg);
  border-radius: var(--border-radius-md);
  border-left: 4px solid var(--color-info);
}

.tips-section h4 {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--color-text-primary);
}

.tips-list {
  margin: 0;
  padding-left: var(--spacing-lg);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.tips-list li {
  margin-bottom: var(--spacing-xs);
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border-medium);
}

.action-buttons-right {
  display: flex;
  gap: var(--spacing-md);
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

.btn:hover:not(:disabled) {
  opacity: 0.8;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-white);
}

.btn-secondary {
  background: var(--color-secondary);
  color: var(--color-white);
}

.btn-link {
  background: transparent;
  color: var(--color-primary);
  padding: var(--spacing-sm);
  text-decoration: underline;
}

.validating-step,
.validation-step,
.import-step {
  min-height: 400px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  gap: var(--spacing-md);
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid var(--color-border-medium);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state h3 {
  margin: 0;
  color: var(--color-text-primary);
}

.loading-state p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}
</style>
