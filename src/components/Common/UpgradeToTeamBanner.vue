<template>
  <div v-if="shouldShowBanner" class="upgrade-banner">
    <div class="banner-content">
      <i class="fas fa-users-cog banner-icon"></i>
      <div class="banner-text">
        <h4>{{ t('upgradeToTeam.title') }}</h4>
        <p>{{ t('upgradeToTeam.description') }}</p>
      </div>
      <button class="btn btn-primary upgrade-btn" @click="showConvertDialog = true">
        <i class="fas fa-arrow-up"></i>
        {{ t('upgradeToTeam.buttonText') }}
      </button>
    </div>
  </div>

  <!-- Conversion Dialog -->
  <BaseModal
    :visible="showConvertDialog"
    :title="t('upgradeToTeam.dialogTitle')"
    :is-loading="isConverting"
    :loading-text="t('upgradeToTeam.converting')"
    :success-message="conversionSuccess"
    :error-message="conversionError"
    :show-close="true"
    :close-on-overlay-click="!isConverting"
    size="medium"
    :show-default-footer="false"
    @close="handleClose"
  >
    <div v-if="!conversionSuccess" class="convert-form">
      <p class="dialog-description">{{ t('upgradeToTeam.dialogDescription') }}</p>

      <div class="form-group">
        <label for="team-name" class="form-label">
          {{ t('upgradeToTeam.teamNameLabel') }}
        </label>
        <input
          id="team-name"
          v-model="newTeamName"
          type="text"
          class="form-control"
          :placeholder="t('upgradeToTeam.teamNamePlaceholder')"
          :disabled="isConverting"
          @keyup.enter="handleConvert"
        />
        <small class="form-text">{{ t('upgradeToTeam.teamNameHint') }}</small>
      </div>

      <div class="modal-actions">
        <button
          class="btn btn-primary"
          @click="handleConvert"
          :disabled="isConverting"
        >
          <i class="fas fa-check"></i>
          {{ t('upgradeToTeam.confirmButton') }}
        </button>
        <button
          class="btn btn-secondary"
          @click="handleClose"
          :disabled="isConverting"
        >
          <i class="fas fa-times"></i>
          {{ t('upgradeToTeam.cancelButton') }}
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useOrganizationsStore } from '../../stores/organizations'
import { useTranslations } from '../../composables/useTranslations'
import BaseModal from '../Modals/BaseModal.vue'

const orgStore = useOrganizationsStore()
const { isPersonalOrganization, currentOrganization } = storeToRefs(orgStore)

const { t } = useTranslations({
  en: {
    upgradeToTeam: {
      title: 'Want to collaborate?',
      description: 'Upgrade to a team organization to invite members and manage groups.',
      buttonText: 'Upgrade to Team',
      dialogTitle: 'Convert to Team Organization',
      dialogDescription: 'Your personal workspace will become a team organization. You can then invite members and collaborate together.',
      teamNameLabel: 'Team Name',
      teamNamePlaceholder: 'Enter your team name (optional)',
      teamNameHint: 'Leave empty to keep the current name',
      confirmButton: 'Convert to Team',
      cancelButton: 'Cancel',
      converting: 'Converting organization...',
      successMessage: 'Organization converted to team successfully!',
    }
  },
  fr: {
    upgradeToTeam: {
      title: 'Envie de collaborer ?',
      description: 'Passez à une organisation d\'équipe pour inviter des membres et gérer des groupes.',
      buttonText: 'Passer en équipe',
      dialogTitle: 'Convertir en organisation d\'équipe',
      dialogDescription: 'Votre espace personnel deviendra une organisation d\'équipe. Vous pourrez ensuite inviter des membres et collaborer ensemble.',
      teamNameLabel: 'Nom de l\'équipe',
      teamNamePlaceholder: 'Entrez le nom de votre équipe (optionnel)',
      teamNameHint: 'Laisser vide pour conserver le nom actuel',
      confirmButton: 'Convertir en équipe',
      cancelButton: 'Annuler',
      converting: 'Conversion en cours...',
      successMessage: 'Organisation convertie en équipe avec succès !',
    }
  }
})

const shouldShowBanner = computed(() => isPersonalOrganization.value)
const showConvertDialog = ref(false)
const newTeamName = ref('')
const isConverting = ref(false)
const conversionSuccess = ref('')
const conversionError = ref('')

const handleConvert = async () => {
  if (!currentOrganization.value) {
    conversionError.value = 'No organization selected'
    return
  }

  isConverting.value = true
  conversionError.value = ''
  conversionSuccess.value = ''

  try {
    await orgStore.convertToTeamOrganization(
      currentOrganization.value.id,
      newTeamName.value || undefined
    )

    conversionSuccess.value = t('upgradeToTeam.successMessage')

    // Close dialog after 2 seconds
    setTimeout(() => {
      handleClose()
    }, 2000)
  } catch (err: any) {
    conversionError.value = err.response?.data?.error_message ||
                            err.response?.data?.message ||
                            orgStore.t('organizations.convertError')
  } finally {
    isConverting.value = false
  }
}

const handleClose = () => {
  if (isConverting.value) return

  showConvertDialog.value = false
  newTeamName.value = ''
  conversionError.value = ''
  conversionSuccess.value = ''
}
</script>

<style scoped>
.upgrade-banner {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
  border: 1px solid var(--color-primary-hover);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  box-shadow: var(--shadow-md);
}

.banner-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.banner-icon {
  font-size: 2.5rem;
  color: var(--color-white);
  flex-shrink: 0;
}

.banner-text {
  flex: 1;
}

.banner-text h4 {
  margin: 0 0 var(--spacing-xs) 0;
  color: var(--color-white);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.banner-text p {
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: var(--font-size-base);
}

.upgrade-btn {
  flex-shrink: 0;
  background: var(--color-white);
  color: var(--color-primary);
  border: none;
  font-weight: var(--font-weight-semibold);
  padding: var(--spacing-md) var(--spacing-xl);
  white-space: nowrap;
}

.upgrade-btn:hover {
  background: var(--color-gray-100);
  color: var(--color-primary-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.upgrade-btn i {
  margin-right: var(--spacing-sm);
}

.convert-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.dialog-description {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  line-height: 1.6;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.form-label {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
}

.form-control {
  padding: var(--spacing-md);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-base);
  background: var(--color-background-primary);
  color: var(--color-text-primary);
  transition: border-color var(--transition-fast);
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
}

.form-control:disabled {
  background: var(--color-background-disabled);
  cursor: not-allowed;
}

.form-text {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
}

.modal-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
  margin-top: var(--spacing-md);
}

.modal-actions .btn {
  padding: var(--spacing-md) var(--spacing-xl);
}

.modal-actions .btn i {
  margin-right: var(--spacing-sm);
}

/* Responsive Design */
@media (max-width: 768px) {
  .banner-content {
    flex-direction: column;
    text-align: center;
  }

  .upgrade-btn {
    width: 100%;
  }

  .modal-actions {
    flex-direction: column-reverse;
  }

  .modal-actions .btn {
    width: 100%;
  }
}
</style>
