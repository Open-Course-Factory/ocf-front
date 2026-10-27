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

    <!-- Retention: readable by every manager, editable by the owner. The
         backend refuses a manager's PATCH; the disabled field mirrors it. -->
    <div class="ocf-retention-section">
      <h4>
        <i class="fas fa-hourglass-half"></i>
        {{ t('settings.retentionTitle') }}
      </h4>
      <p>{{ t('settings.retentionDescription') }}</p>
      <div class="ocf-retention-row">
        <label for="retention-days" class="form-label">{{ t('settings.retentionLabel') }}</label>
        <input
          id="retention-days"
          v-model="retentionInput"
          type="number"
          min="1"
          step="1"
          class="form-input ocf-retention-input"
          data-test="retention-days"
          :placeholder="t('settings.retentionPlaceholder', { days: PLATFORM_DEFAULT_RETENTION_DAYS })"
          :disabled="!isOwner || isSavingRetention"
        />
        <button
          v-if="isOwner"
          class="btn btn-primary"
          data-test="retention-save"
          :disabled="!isRetentionValid || !isRetentionChanged || isSavingRetention"
          @click="saveRetention"
        >
          <i :class="isSavingRetention ? 'fas fa-spinner fa-spin' : 'fas fa-save'"></i>
          {{ t('settings.retentionSave') }}
        </button>
      </div>
      <p v-if="!isOwner" class="permission-notice" data-test="retention-owner-only">
        <i class="fas fa-info-circle"></i>
        {{ t('settings.retentionOwnerOnly') }}
      </p>
      <p v-else class="form-help-text">
        <i class="fas fa-info-circle"></i>
        {{ t('settings.retentionHelp') }}
      </p>
    </div>

    <!-- AI assistant: the organization's own bring-your-own-key config,
         replacing the scenario editor's manual copy-prompt/paste-answer
         flow with a direct call when switched on. Reaching the Settings
         tab already implies canManage, so no extra owner gate here. -->
    <div class="ocf-ai-config-section">
      <h4>
        <i class="fas fa-wand-magic-sparkles"></i>
        {{ t('settings.aiConfigTitle') }}
      </h4>
      <p>{{ t('settings.aiConfigDescription') }}</p>

      <div v-if="aiConfigLoading" class="ocf-ai-config-loading">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
      <template v-else>
        <label class="checkbox-row">
          <input v-model="aiConfigForm.enabled" type="checkbox" data-test="ai-config-enabled" />
          {{ t('settings.aiConfigEnabled') }}
        </label>

        <div class="form-group">
          <label for="ai-config-endpoint">{{ t('settings.aiConfigEndpoint') }}</label>
          <input
            id="ai-config-endpoint"
            v-model="aiConfigForm.endpoint"
            type="text"
            class="form-control"
            data-test="ai-config-endpoint"
            placeholder="https://api.openai.com/v1/chat/completions"
          />
          <p class="form-help-text">{{ t('settings.aiConfigEndpointHelp') }}</p>
        </div>

        <div class="form-group">
          <label for="ai-config-model">{{ t('settings.aiConfigModel') }}</label>
          <input
            id="ai-config-model"
            v-model="aiConfigForm.model"
            type="text"
            class="form-control"
            data-test="ai-config-model"
            placeholder="gpt-4o-mini"
          />
        </div>

        <div class="form-group">
          <label for="ai-config-key">{{ t('settings.aiConfigApiKey') }}</label>
          <input
            id="ai-config-key"
            v-model="aiConfigKeyInput"
            type="password"
            autocomplete="new-password"
            class="form-control"
            data-test="ai-config-api-key"
            :placeholder="aiConfigHasKey ? t('settings.aiConfigKeyStoredPlaceholder') : t('settings.aiConfigKeyPlaceholder')"
          />
          <p class="form-help-text">
            {{ aiConfigHasKey ? t('settings.aiConfigKeyStoredHelp') : t('settings.aiConfigKeyHelp') }}
          </p>
        </div>

        <div class="ocf-ai-config-actions">
          <button
            class="btn btn-primary"
            data-test="ai-config-save"
            :disabled="isSavingAiConfig"
            @click="saveAiConfig"
          >
            <i :class="isSavingAiConfig ? 'fas fa-spinner fa-spin' : 'fas fa-save'"></i>
            {{ t('settings.aiConfigSave') }}
          </button>
        </div>

        <p v-if="aiConfigError" class="alert alert-danger" data-test="ai-config-error">
          <i class="fas fa-exclamation-triangle"></i>
          {{ aiConfigError }}
        </p>
      </template>
    </div>

    <div class="danger-zone">
      <h4>{{ t('settings.dangerZone') }}</h4>
      <p>{{ t('settings.deleteWarning') }}</p>
      <button v-if="canDelete" class="btn btn-danger" @click="confirmDelete">
        <i class="fas fa-trash"></i>
        {{ t('settings.deleteOrganization') }}
        <AdminBadge v-if="isAdminGranted" icon-only />
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
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BaseModal from '../Modals/BaseModal.vue'
import AdminBadge from '../Common/AdminBadge.vue'
import { useOrganizationsStore } from '../../stores/organizations'
import { useAdminViewMode } from '../../composables/useAdminViewMode'
import { useTranslations } from '../../composables/useTranslations'
import { useToast } from '../../composables/useToast'
import { PLATFORM_DEFAULT_RETENTION_DAYS, organizationService } from '../../services/domain/organization'
import { useAiAssistantError } from '../../composables/useAiAssistantError'
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
  (e: 'updated'): void
}>()

const router = useRouter()
const organizationsStore = useOrganizationsStore()
const toast = useToast()
const { isAdmin } = useAdminViewMode()
const isAdminGranted = computed(() => isAdmin.value && !props.isOwner)

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

// v-model on a number input hands back "" once cleared and a number
// otherwise; "" is "use the platform default", null on the wire, and must
// stay distinguishable from 0.
const retentionInput = ref<string | number>('')
const isSavingRetention = ref(false)

// AI assistant config. aiConfigKeyInput is deliberately separate from
// aiConfigForm: the real key never arrives from the backend (has_api_key is
// the only signal), so there is no "current value" to pre-fill — only
// typing something here means "replace the stored key". Left empty on an
// existing config, saving omits api_key entirely rather than sending "" and
// accidentally clearing it.
const aiConfigLoading = ref(true)
const aiConfigHasKey = ref(false)
const aiConfigKeyInput = ref('')
const aiConfigForm = ref({ enabled: false, endpoint: '', model: '' })
const isSavingAiConfig = ref(false)
const aiConfigError = ref('')
const { aiAssistantErrorMessage } = useAiAssistantError()

async function loadAiConfig() {
  aiConfigLoading.value = true
  aiConfigError.value = ''
  try {
    const cfg = await organizationService.getAiConfig(props.organizationId)
    aiConfigForm.value = { enabled: cfg.enabled, endpoint: cfg.endpoint, model: cfg.model }
    aiConfigHasKey.value = cfg.has_api_key
    aiConfigKeyInput.value = ''
  } catch (err: any) {
    aiConfigError.value = aiAssistantErrorMessage(err, t('settings.aiConfigLoadError'))
  } finally {
    aiConfigLoading.value = false
  }
}

onMounted(loadAiConfig)

async function saveAiConfig() {
  isSavingAiConfig.value = true
  aiConfigError.value = ''
  try {
    const cfg = await organizationService.updateAiConfig(props.organizationId, {
      ...aiConfigForm.value,
      // Only sent when the admin actually typed something — an empty
      // field means "leave the stored key untouched", not "clear it".
      ...(aiConfigKeyInput.value ? { api_key: aiConfigKeyInput.value } : {})
    })
    aiConfigHasKey.value = cfg.has_api_key
    aiConfigKeyInput.value = ''
    toast.success(t('settings.aiConfigSaved'))
  } catch (err: any) {
    aiConfigError.value = aiAssistantErrorMessage(err, t('settings.aiConfigSaveError'))
  } finally {
    isSavingAiConfig.value = false
  }
}

const storedRetentionAsText = (org: Organization | undefined) =>
  org?.retention_days == null ? '' : String(org.retention_days)

watch(() => props.organization, (org) => {
  retentionInput.value = storedRetentionAsText(org)
}, { immediate: true })

const retentionText = computed(() => String(retentionInput.value).trim())

const retentionValue = computed<number | null>(() =>
  retentionText.value === '' ? null : Number(retentionText.value)
)

const isRetentionValid = computed(() =>
  retentionValue.value === null || (Number.isInteger(retentionValue.value) && retentionValue.value >= 1)
)

const isRetentionChanged = computed(() =>
  retentionText.value !== storedRetentionAsText(props.organization)
)

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
      retentionTitle: 'Data retention',
      retentionDescription: 'When a member is offboarded, their account is kept for this many days, then erased.',
      retentionLabel: 'Retention delay (days)',
      retentionPlaceholder: 'Platform default ({days} days)',
      retentionSave: 'Save',
      retentionHelp: 'Leave empty to use the platform default. You are the data controller: set the delay your retention policy states.',
      retentionOwnerOnly: 'Only organization owners can change the retention delay.',
      retentionSaved: 'Retention delay saved',
      retentionError: 'The retention delay could not be saved',
      aiConfigTitle: 'AI assistant',
      aiConfigDescription: 'Bring your own AI assistant to the scenario editor\'s "Create/Improve with AI" flow. When on, writing a scenario calls your configured endpoint directly instead of asking you to copy a prompt into your own chat assistant and paste the answer back.',
      aiConfigEnabled: 'Use this endpoint instead of the manual copy/paste flow',
      aiConfigEndpoint: 'Endpoint URL',
      aiConfigEndpointHelp: 'An OpenAI-compatible "chat completions" URL — works with OpenAI itself, Mistral, or a self-hosted Ollama/vLLM instance exposing the same API shape.',
      aiConfigModel: 'Model',
      aiConfigApiKey: 'API key',
      aiConfigKeyPlaceholder: 'Enter an API key',
      aiConfigKeyStoredPlaceholder: 'Leave blank to keep the stored key',
      aiConfigKeyHelp: 'Stored encrypted, never shown again once saved.',
      aiConfigKeyStoredHelp: 'A key is already configured. Type a new one to replace it, or leave this blank to keep it.',
      aiConfigSave: 'Save',
      aiConfigSaved: 'AI assistant configuration saved',
      aiConfigLoadError: 'Failed to load the AI assistant configuration',
      aiConfigSaveError: 'The AI assistant configuration could not be saved',
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
      retentionTitle: 'Conservation des données',
      retentionDescription: 'Quand un membre est désinscrit, son compte est conservé pendant ce nombre de jours, puis effacé.',
      retentionLabel: 'Délai de conservation (jours)',
      retentionPlaceholder: 'Valeur par défaut de la plateforme ({days} jours)',
      retentionSave: 'Enregistrer',
      retentionHelp: 'Laissez vide pour utiliser la valeur par défaut de la plateforme. Vous êtes responsable du traitement : indiquez le délai prévu par votre politique de conservation.',
      retentionOwnerOnly: 'Seuls les propriétaires de l\'organisation peuvent modifier le délai de conservation.',
      retentionSaved: 'Délai de conservation enregistré',
      retentionError: 'Le délai de conservation n\'a pas pu être enregistré',
      aiConfigTitle: 'Assistant IA',
      aiConfigDescription: 'Apportez votre propre assistant IA au flux « Créer/Améliorer avec l\'IA » de l\'éditeur de scénario. Une fois activé, la rédaction d\'un scénario appelle directement votre endpoint configuré, au lieu de vous demander de copier un prompt dans votre assistant de discussion puis de coller la réponse.',
      aiConfigEnabled: 'Utiliser cet endpoint au lieu du copier-coller manuel',
      aiConfigEndpoint: 'URL de l\'endpoint',
      aiConfigEndpointHelp: 'Une URL « chat completions » compatible OpenAI — fonctionne avec OpenAI lui-même, Mistral, ou une instance Ollama/vLLM auto-hébergée exposant le même format d\'API.',
      aiConfigModel: 'Modèle',
      aiConfigApiKey: 'Clé API',
      aiConfigKeyPlaceholder: 'Saisissez une clé API',
      aiConfigKeyStoredPlaceholder: 'Laissez vide pour conserver la clé enregistrée',
      aiConfigKeyHelp: 'Stockée chiffrée, jamais réaffichée une fois enregistrée.',
      aiConfigKeyStoredHelp: 'Une clé est déjà configurée. Saisissez-en une nouvelle pour la remplacer, ou laissez ce champ vide pour la conserver.',
      aiConfigSave: 'Enregistrer',
      aiConfigSaved: 'Configuration de l\'assistant IA enregistrée',
      aiConfigLoadError: 'Échec du chargement de la configuration de l\'assistant IA',
      aiConfigSaveError: 'La configuration de l\'assistant IA n\'a pas pu être enregistrée',
    }
  }
})

const saveRetention = async () => {
  if (!isRetentionValid.value || !isRetentionChanged.value) return

  isSavingRetention.value = true
  try {
    await organizationsStore.updateRetentionDays(props.organizationId, retentionValue.value)
    toast.success(t('settings.retentionSaved'))
    emit('updated')
  } catch (err: any) {
    toast.error(err.response?.data?.error_message || err.message || t('settings.retentionError'))
  } finally {
    isSavingRetention.value = false
  }
}

const goToRolesHelp = () => {
  router.push({ name: 'Help_account_roles-and-permissions' })
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

.ocf-retention-section {
  padding: 1.5rem;
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  margin-bottom: 2rem;
}

.ocf-retention-section h4 {
  margin: 0 0 0.75rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ocf-retention-section h4 i {
  color: var(--color-primary);
}

.ocf-retention-section > p {
  margin: 0 0 1rem 0;
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  line-height: 1.5;
}

.ocf-retention-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}

.ocf-retention-row .form-label {
  margin: 0;
}

.ocf-retention-input {
  width: 8rem;
}

.ocf-ai-config-section {
  padding: 1.5rem;
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ocf-ai-config-section h4 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ocf-ai-config-section h4 i {
  color: var(--color-primary);
}

.ocf-ai-config-section > p {
  margin: -0.5rem 0 0;
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  line-height: 1.5;
}

.ocf-ai-config-loading {
  color: var(--color-text-secondary);
}

.ocf-ai-config-actions {
  display: flex;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  color: var(--color-text-primary);
  cursor: pointer;
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
