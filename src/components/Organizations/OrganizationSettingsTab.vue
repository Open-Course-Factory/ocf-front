<template>
  <div class="settings-card">
    <h3>
      <i class="fas fa-cog"></i>
      {{ t('settings.organizationSettings') }}
    </h3>

    <!-- Help Section -->
    <div class="help-section">
      <h4>
        <i class="fas fa-question-circle"></i>
        {{ t('settings.needHelp') }}
      </h4>
      <p>{{ t('settings.rolesHelpText') }}</p>
      <button class="btn btn-outline-primary" @click="goToRolesHelp">
        <i class="fas fa-book"></i>
        {{ t('settings.viewRolesGuide') }}
      </button>
    </div>

    <!-- Upgrade to Team Section - Only for Personal Organizations -->
    <div v-if="organization?.is_personal && isOwner" class="upgrade-section">
      <h4>
        <i class="fas fa-arrow-up"></i>
        {{ t('settings.upgradeToTeam') }}
      </h4>
      <p>{{ t('settings.upgradeToTeamDescription') }}</p>
      <div class="upgrade-benefits">
        <div class="benefit-item">
          <i class="fas fa-check-circle"></i>
          <span>{{ t('settings.benefitMembers') }}</span>
        </div>
        <div class="benefit-item">
          <i class="fas fa-check-circle"></i>
          <span>{{ t('settings.benefitGroups') }}</span>
        </div>
        <div class="benefit-item">
          <i class="fas fa-check-circle"></i>
          <span>{{ t('settings.benefitCollaboration') }}</span>
        </div>
        <div class="benefit-item">
          <i class="fas fa-check-circle"></i>
          <span>{{ t('settings.benefitBulkLicenses') }}</span>
        </div>
      </div>
      <button class="btn btn-success btn-lg" @click="confirmConvertToTeam">
        <i class="fas fa-building"></i>
        {{ t('settings.convertToTeamNow') }}
      </button>
    </div>

    <div class="danger-zone">
      <h4>{{ t('settings.dangerZone') }}</h4>
      <p>{{ t('settings.deleteWarning') }}</p>
      <button v-if="canDelete" class="btn btn-danger" @click="confirmDelete">
        <i class="fas fa-trash"></i>
        {{ t('settings.deleteOrganization') }}
      </button>
      <p v-else class="permission-notice">
        <i class="fas fa-info-circle"></i>
        {{ t('settings.deleteOwnerOnly') }}
      </p>
    </div>
  </div>

  <!-- Delete Organization Confirmation Modal -->
  <BaseModal
    :visible="showDeleteConfirm"
    :title="t('settings.deleteOrganization')"
    title-icon="fas fa-trash"
    size="small"
    showDefaultFooter
    :confirmText="t('settings.confirmDeleteBtn')"
    confirmIcon="fas fa-trash"
    :cancelText="t('settings.cancel')"
    :isLoading="isDeleting"
    :loadingText="t('settings.deleting')"
    @close="showDeleteConfirm = false"
    @confirm="deleteOrganization"
  >
    <p>{{ t('settings.deleteWarning') }}</p>
  </BaseModal>

  <!-- Convert to Team Confirmation Modal -->
  <BaseModal
    :visible="isConvertModalOpen"
    :isLoading="isConverting"
    :loadingText="t('settings.converting')"
    :successMessage="convertSuccess"
    :errorMessage="convertError"
    :title="t('settings.convertToTeamNow')"
    titleIcon="fas fa-building"
    size="medium"
    :showClose="!isConverting"
    :closeOnOverlayClick="!isConverting"
    showDefaultFooter
    :confirmText="t('settings.confirmConvert')"
    confirmIcon="fas fa-check"
    :confirmDisabled="isConverting || !isConvertFormValid"
    :cancelText="t('settings.cancel')"
    @close="closeConvertModal"
    @confirm="handleConvertToTeam"
  >
    <div class="convert-modal-content">
      <div class="warning-box">
        <i class="fas fa-exclamation-triangle"></i>
        <p>{{ t('settings.convertWarning') }}</p>
      </div>
      <p>{{ t('settings.convertConfirmMessage') }}</p>

      <!-- New Organization Name Input -->
      <div class="form-group">
        <label for="new-org-name" class="form-label">
          {{ t('settings.newOrganizationName') }}
          <span class="required">*</span>
        </label>
        <input
          id="new-org-name"
          v-model="newOrgName"
          type="text"
          class="form-input"
          :placeholder="t('settings.newOrganizationNamePlaceholder')"
          :disabled="isConverting"
          @keyup.enter="isConvertFormValid && handleConvertToTeam()"
        />
        <p class="form-help-text">
          <i class="fas fa-info-circle"></i>
          {{ t('settings.newOrganizationNameHelp') }}
        </p>
      </div>

      <div class="benefits-list">
        <h4>{{ t('settings.whatYouWillGet') }}:</h4>
        <ul>
          <li><i class="fas fa-check"></i> {{ t('settings.benefitMembers') }}</li>
          <li><i class="fas fa-check"></i> {{ t('settings.benefitGroups') }}</li>
          <li><i class="fas fa-check"></i> {{ t('settings.benefitCollaboration') }}</li>
          <li><i class="fas fa-check"></i> {{ t('settings.benefitBulkLicenses') }}</li>
        </ul>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseModal from '../Modals/BaseModal.vue'
import { useOrganizationsStore } from '../../stores/organizations'
import { useTranslations } from '../../composables/useTranslations'
import type { Organization } from '../../types'

const props = defineProps<{
  organization: Organization
  organizationId: string
  isOwner: boolean
  canDelete: boolean
}>()

const emit = defineEmits<{
  (e: 'deleted'): void
  (e: 'converted'): void
}>()

const router = useRouter()
const organizationsStore = useOrganizationsStore()

// Convert to Team modal state
const isConvertModalOpen = ref(false)
const isConverting = ref(false)
const convertSuccess = ref('')
const convertError = ref('')
const newOrgName = ref('')

const showDeleteConfirm = ref(false)
const isDeleting = ref(false)

const isConvertFormValid = computed(() => {
  return newOrgName.value.trim().length >= 3
})

const { t } = useTranslations({
  en: {
    settings: {
      organizationSettings: 'Organization Settings',
      needHelp: 'Need Help?',
      rolesHelpText: 'Learn about organization roles and what each role can do.',
      viewRolesGuide: 'View Roles & Permissions Guide',
      upgradeToTeam: 'Upgrade to Team Organization',
      upgradeToTeamDescription: 'Convert your personal organization to a team organization to unlock collaboration features.',
      benefitMembers: 'Up to 100 members (currently: 1 only)',
      benefitGroups: 'Unlimited groups and classes',
      benefitCollaboration: 'Full collaboration and sharing features',
      benefitBulkLicenses: 'Bulk license purchases for your team',
      convertToTeamNow: 'Convert to Team Organization',
      confirmConvert: 'Yes, Convert Now',
      cancel: 'Cancel',
      converting: 'Converting organization...',
      convertWarning: 'This action is permanent and cannot be undone.',
      convertConfirmMessage: 'Please provide a new name for your team organization. Names starting with "personal" are not appropriate for team organizations.',
      whatYouWillGet: 'What you will get',
      newOrganizationName: 'New Organization Name',
      newOrganizationNamePlaceholder: 'e.g., My Company, Acme Corp, CS101 Fall 2025',
      newOrganizationNameHelp: 'Choose a professional name that represents your team or organization (minimum 3 characters)',
      convertToTeamSuccess: 'Organization successfully converted to team!',
      convertToTeamError: 'Failed to convert organization to team',
      dangerZone: 'Danger Zone',
      deleteWarning: 'Deleting an organization is permanent and cannot be undone. All members, groups, and data will be lost.',
      deleteOrganization: 'Delete Organization',
      deleteOwnerOnly: 'Only organization owners can delete the organization.',
      confirmDeleteBtn: 'Delete permanently',
      deleting: 'Deleting organization...',
    }
  },
  fr: {
    settings: {
      organizationSettings: 'Paramètres de l\'organisation',
      needHelp: 'Besoin d\'aide ?',
      rolesHelpText: 'Apprenez-en plus sur les rôles d\'organisation et ce que chaque rôle peut faire.',
      viewRolesGuide: 'Voir le guide des rôles et permissions',
      upgradeToTeam: 'Passer à une organisation d\'équipe',
      upgradeToTeamDescription: 'Convertissez votre organisation personnelle en organisation d\'équipe pour débloquer les fonctionnalités de collaboration.',
      benefitMembers: 'Jusqu\'à 100 membres (actuellement : 1 seulement)',
      benefitGroups: 'Groupes et classes illimités',
      benefitCollaboration: 'Fonctionnalités de collaboration et partage complètes',
      benefitBulkLicenses: 'Achats de licences groupées pour votre équipe',
      convertToTeamNow: 'Convertir en organisation d\'équipe',
      confirmConvert: 'Oui, convertir maintenant',
      cancel: 'Annuler',
      converting: 'Conversion en cours...',
      convertWarning: 'Cette action est permanente et ne peut pas être annulée.',
      convertConfirmMessage: 'Veuillez fournir un nouveau nom pour votre organisation d\'équipe. Les noms commençant par "personnel" ne conviennent pas aux organisations d\'équipe.',
      whatYouWillGet: 'Ce que vous obtiendrez',
      newOrganizationName: 'Nouveau nom d\'organisation',
      newOrganizationNamePlaceholder: 'ex: Mon Entreprise, Acme Corp, INFO101 Automne 2025',
      newOrganizationNameHelp: 'Choisissez un nom professionnel qui représente votre équipe ou organisation (minimum 3 caractères)',
      convertToTeamSuccess: 'Organisation convertie en équipe avec succès !',
      convertToTeamError: 'Échec de la conversion de l\'organisation en équipe',
      dangerZone: 'Zone dangereuse',
      deleteWarning: 'La suppression d\'une organisation est permanente et ne peut pas être annulée. Tous les membres, groupes et données seront perdus.',
      deleteOrganization: 'Supprimer l\'organisation',
      deleteOwnerOnly: 'Seuls les propriétaires de l\'organisation peuvent la supprimer.',
      confirmDeleteBtn: 'Supprimer définitivement',
      deleting: 'Suppression de l\'organisation...',
    }
  }
})

const goToRolesHelp = () => {
  router.push({ name: 'HelpRolesAndPermissions' })
}

const confirmConvertToTeam = () => {
  convertSuccess.value = ''
  convertError.value = ''
  newOrgName.value = ''
  isConvertModalOpen.value = true
}

const closeConvertModal = () => {
  if (isConverting.value) return
  isConvertModalOpen.value = false
  convertSuccess.value = ''
  convertError.value = ''
  newOrgName.value = ''
}

const handleConvertToTeam = async () => {
  if (!props.organization || !isConvertFormValid.value) return

  isConverting.value = true
  convertSuccess.value = ''
  convertError.value = ''

  try {
    await organizationsStore.convertToTeamOrganization(props.organization.id, newOrgName.value.trim())
    convertSuccess.value = t('settings.convertToTeamSuccess')
    emit('converted')

    setTimeout(() => {
      closeConvertModal()
    }, 2000)
  } catch (err: any) {
    convertError.value = err.response?.data?.error_message || err.message || t('settings.convertToTeamError')
  } finally {
    isConverting.value = false
  }
}

const confirmDelete = () => {
  showDeleteConfirm.value = true
}

const deleteOrganization = async () => {
  isDeleting.value = true
  try {
    await organizationsStore.deleteOrganization(props.organizationId)
    showDeleteConfirm.value = false
    emit('deleted')
  } catch (err: any) {
    showDeleteConfirm.value = false
    console.error('Failed to delete organization:', err)
  } finally {
    isDeleting.value = false
  }
}
</script>

<style scoped>
.settings-card {
  background: var(--color-bg-secondary);
  border-radius: 8px;
  padding: 1.5rem;
}

.settings-card h3 {
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.help-section {
  padding: 1.5rem;
  background: linear-gradient(135deg, var(--color-org-personal-bg-subtle) 0%, var(--color-org-team-bg-subtle) 100%);
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  margin-bottom: 2rem;
}

.help-section h4 {
  margin: 0 0 0.75rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.help-section h4 i {
  color: var(--color-primary);
}

.help-section p {
  margin: 0 0 1rem 0;
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  line-height: 1.5;
}

.upgrade-section {
  padding: 1.5rem;
  background: linear-gradient(135deg, var(--color-org-team-bg) 0%, var(--color-org-team-bg-subtle) 100%);
  border: 2px solid var(--color-org-team-border);
  border-radius: 10px;
  margin-bottom: 2rem;
}

.upgrade-section h4 {
  margin: 0 0 0.75rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.upgrade-section h4 i {
  color: var(--color-success);
}

.upgrade-section > p {
  margin: 0 0 1.5rem 0;
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  line-height: 1.5;
}

.upgrade-benefits {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--color-bg-primary);
  border-radius: 8px;
  border: 1px solid var(--color-org-team-bg-emphasis);
}

.benefit-item i {
  color: var(--color-success);
  font-size: 1.125rem;
  flex-shrink: 0;
}

.benefit-item span {
  font-size: 0.9375rem;
  color: var(--color-text-primary);
  font-weight: 500;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-outline-primary {
  background: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
}

.btn-outline-primary:hover {
  background: var(--color-primary-light);
}

.btn-success {
  background: var(--color-success);
  color: white;
  box-shadow: 0 4px 12px var(--color-org-team-border);
}

.btn-success:hover {
  background: var(--color-success-hover);
  box-shadow: 0 6px 16px var(--color-org-team-border);
  transform: translateY(-1px);
}

.btn-lg {
  padding: 1rem 2rem;
  font-size: 1.125rem;
  font-weight: 600;
}

.btn-danger {
  background: var(--color-danger);
  color: white;
}

.btn-danger:hover {
  background: var(--color-danger-dark);
}

.danger-zone {
  border: 2px solid var(--color-danger);
  border-radius: 8px;
  padding: 1.5rem;
  background: var(--color-danger-light);
}

.danger-zone h4 {
  margin: 0 0 0.5rem 0;
  color: var(--color-danger);
}

.danger-zone p {
  margin: 0 0 1rem 0;
  color: var(--color-text-secondary);
}

.permission-notice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--color-bg-tertiary);
  border-radius: 6px;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  margin: 0;
}

.permission-notice i {
  color: var(--color-info);
}

/* Convert Modal Styles */
.convert-modal-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.warning-box {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, var(--color-warning-amber-bg) 0%, var(--color-warning-amber-bg) 100%);
  border: 2px solid var(--color-warning-amber-border);
  border-radius: 8px;
}

.warning-box i {
  font-size: 1.5rem;
  color: var(--color-warning);
  flex-shrink: 0;
  margin-top: 2px;
}

.warning-box p {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.convert-modal-content > p {
  margin: 0;
  font-size: 1rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.benefits-list h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.benefits-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.benefits-list li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
}

.benefits-list li i {
  color: var(--color-success);
  font-size: 1rem;
  flex-shrink: 0;
}

/* Form Styles in Modal */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.form-label .required {
  color: var(--color-danger);
  font-size: 1rem;
}

.form-input {
  padding: 0.75rem 1rem;
  font-size: 0.9375rem;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  transition: all 0.2s ease;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-org-personal-bg);
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-input::placeholder {
  color: var(--color-text-muted);
}

.form-help-text {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-help-text i {
  color: var(--color-primary);
  font-size: 0.875rem;
}
</style>
