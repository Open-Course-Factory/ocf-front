<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */
-->

<template>
  <SettingsCard :title="t('userSettings.security.title')">
      <div class="info-section">
        <div class="info-grid">
          <div class="info-item">
            <label>{{ t('userSettings.security.passwordLastChanged') }}</label>
            <p>{{ formatDate(settingsStore.settings.password_last_changed) }}</p>
          </div>
        </div>
      </div>

      <div class="password-change-section">
        <h3>{{ t('userSettings.security.changePassword') }}</h3>
        <form @submit.prevent="handleChangePassword">
          <div class="form-group">
            <label>{{ t('userSettings.security.currentPassword') }}</label>
            <input
              type="password"
              v-model="passwordForm.current_password"
              class="form-control"
              required
            />
          </div>
          <div class="form-group">
            <label>{{ t('userSettings.security.newPassword') }}</label>
            <input
              type="password"
              v-model="passwordForm.new_password"
              class="form-control"
              required
            />
          </div>
          <div class="form-group">
            <label>{{ t('userSettings.security.confirmPassword') }}</label>
            <input
              type="password"
              v-model="passwordForm.confirm_password"
              class="form-control"
              required
            />
          </div>
          <div v-if="errorMessage" class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            {{ errorMessage }}
          </div>
          <div v-if="successMessage" class="success-message">
            <i class="fas fa-check-circle"></i>
            {{ successMessage }}
          </div>
          <button type="submit" class="btn btn-primary" :disabled="settingsStore.isLoading">
            <i class="fas fa-key"></i>
            {{ settingsStore.isLoading ? t('userSettings.security.changing') : t('userSettings.security.changePassword') }}
          </button>
        </form>
      </div>

      <!-- Danger Zone: Account Deletion -->
      <div class="danger-zone-section">
        <h3>{{ t('userSettings.deleteAccount.title') }}</h3>
        <p class="danger-zone-description">{{ t('userSettings.deleteAccount.description') }}</p>
        <button type="button" class="btn btn-danger" @click="showDeleteModal = true">
          <i class="fas fa-trash-alt"></i>
          {{ t('userSettings.deleteAccount.button') }}
        </button>
      </div>
  </SettingsCard>

  <!-- Account Deletion Confirmation Modal -->
  <BaseModal
    :visible="showDeleteModal"
    :title="t('userSettings.deleteAccount.modalTitle')"
    title-icon="fas fa-exclamation-triangle"
    size="medium"
    :show-close="!isDeleting"
    @close="closeDeleteModal"
  >
    <div class="delete-modal-content">
      <div class="delete-warning">
        <i class="fas fa-exclamation-triangle"></i>
        {{ t('userSettings.deleteAccount.modalWarning') }}
      </div>

      <div class="delete-details">
        <h4>{{ t('userSettings.deleteAccount.willDelete') }}</h4>
        <ul>
          <li><i class="fas fa-terminal"></i> {{ t('userSettings.deleteAccount.willDeleteItems.terminalSessions') }}</li>
          <li><i class="fas fa-key"></i> {{ t('userSettings.deleteAccount.willDeleteItems.sshKeys') }}</li>
          <li><i class="fas fa-flag-checkered"></i> {{ t('userSettings.deleteAccount.willDeleteItems.scenarioHistory') }}</li>
          <li><i class="fas fa-users"></i> {{ t('userSettings.deleteAccount.willDeleteItems.memberships') }}</li>
        </ul>

        <h4>{{ t('userSettings.deleteAccount.willAnonymize') }}</h4>
        <ul>
          <li><i class="fas fa-file-invoice"></i> {{ t('userSettings.deleteAccount.willAnonymizeItems.invoices') }}</li>
          <li><i class="fas fa-credit-card"></i> {{ t('userSettings.deleteAccount.willAnonymizeItems.paymentRecords') }}</li>
        </ul>
      </div>

      <div class="delete-ownership-warning">
        <i class="fas fa-info-circle"></i>
        {{ t('userSettings.deleteAccount.mustTransfer') }}
      </div>

      <div v-if="deleteError" class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        {{ deleteError }}
      </div>

      <div class="form-group confirmation-input">
        <label>{{ t('userSettings.deleteAccount.typeConfirmation', { confirmText: CONFIRMATION_TEXT }) }}</label>
        <input
          type="text"
          v-model="confirmationInput"
          class="form-control"
          :placeholder="CONFIRMATION_TEXT"
          :disabled="isDeleting"
          autocomplete="off"
        />
      </div>
    </div>

    <template #footer>
      <button
        class="btn btn-danger"
        :disabled="!isConfirmationValid || isDeleting"
        @click="handleDeleteAccount"
      >
        <i :class="isDeleting ? 'fas fa-spinner fa-spin' : 'fas fa-trash-alt'"></i>
        {{ isDeleting ? t('userSettings.deleteAccount.deleting') : t('userSettings.deleteAccount.confirm') }}
      </button>
      <button class="btn btn-secondary" @click="closeDeleteModal" :disabled="isDeleting">
        {{ t('userSettings.deleteAccount.cancel') }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import { useUserSettingsStore } from '../../stores/userSettings'
import { useCurrentUserStore } from '../../stores/currentUser'
import { useFormatters } from '../../composables/useFormatters'
import SettingsCard from '../UI/SettingsCard.vue'
import BaseModal from '../Modals/BaseModal.vue'

const { t } = useI18n()
const settingsStore = useUserSettingsStore()
const currentUserStore = useCurrentUserStore()
const { formatDate: formatDateTz } = useFormatters()

const CONFIRMATION_TEXT = 'DELETE_MY_ACCOUNT'

const passwordForm = ref({
  current_password: '',
  new_password: '',
  confirm_password: ''
})

const errorMessage = ref('')
const successMessage = ref('')

// Account deletion state
const showDeleteModal = ref(false)
const confirmationInput = ref('')
const isDeleting = ref(false)
const deleteError = ref('')

const isConfirmationValid = computed(() => confirmationInput.value === CONFIRMATION_TEXT)

function formatDate(dateString: string | undefined): string {
  if (!dateString) return t('userSettings.security.never')
  return formatDateTz(dateString)
}

async function handleChangePassword() {
  errorMessage.value = ''
  successMessage.value = ''

  if (passwordForm.value.new_password !== passwordForm.value.confirm_password) {
    errorMessage.value = t('userSettings.security.passwordMismatch')
    return
  }

  if (passwordForm.value.new_password.length < 8) {
    errorMessage.value = t('userSettings.security.passwordWeak')
    return
  }

  try {
    await settingsStore.changePassword({
      current_password: passwordForm.value.current_password,
      new_password: passwordForm.value.new_password,
      confirm_password: passwordForm.value.confirm_password
    })
    successMessage.value = t('userSettings.security.passwordChanged')
    passwordForm.value = {
      current_password: '',
      new_password: '',
      confirm_password: ''
    }
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || t('userSettings.security.errorChangingPassword')
  }
}

function closeDeleteModal() {
  if (isDeleting.value) return
  showDeleteModal.value = false
  confirmationInput.value = ''
  deleteError.value = ''
}

async function handleDeleteAccount() {
  if (!isConfirmationValid.value) return

  isDeleting.value = true
  deleteError.value = ''

  try {
    await axios.delete('/users/me/account', {
      data: { confirmation: CONFIRMATION_TEXT }
    })
    // Account deleted: clear auth state and redirect
    currentUserStore.logout()
  } catch (error: any) {
    if (error.response?.status === 409) {
      // Ownership conflict: show the API error message
      deleteError.value = error.response.data?.message || error.response.data?.error_message || t('userSettings.deleteAccount.error')
    } else {
      deleteError.value = error.response?.data?.message || error.response?.data?.error_message || t('userSettings.deleteAccount.error')
    }
  } finally {
    isDeleting.value = false
  }
}
</script>

<style scoped>
/* Danger Zone Section */
.danger-zone-section {
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-xl);
  border-top: 2px solid var(--color-danger);
}

.danger-zone-section h3 {
  font-size: var(--font-size-xl);
  margin-bottom: var(--spacing-md);
  color: var(--color-danger);
  font-weight: var(--font-weight-semibold);
}

.danger-zone-description {
  margin-bottom: var(--spacing-lg);
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--btn-padding-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  border: 1px solid transparent;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-danger {
  background-color: var(--color-danger);
  border-color: var(--color-danger);
  color: var(--color-white);
}

.btn-danger:hover:not(:disabled) {
  background-color: var(--color-danger-hover);
  border-color: var(--color-danger-hover);
}

.btn-secondary {
  background-color: var(--color-secondary);
  border-color: var(--color-secondary);
  color: var(--color-white);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-secondary-hover);
  border-color: var(--color-secondary-hover);
}

/* Modal Content */
.delete-modal-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.delete-warning {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
  border: 1px solid var(--color-danger-border);
  border-radius: var(--border-radius-md);
  font-weight: var(--font-weight-medium);
}

.delete-warning i {
  color: var(--color-danger);
  font-size: var(--font-size-lg);
}

.delete-details h4 {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
  margin-top: var(--spacing-md);
}

.delete-details h4:first-child {
  margin-top: 0;
}

.delete-details ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.delete-details ul li {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.delete-details ul li i {
  width: 16px;
  text-align: center;
  color: var(--color-text-muted);
}

.delete-ownership-warning {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.delete-ownership-warning i {
  color: var(--color-primary);
  margin-top: 2px;
}

.confirmation-input {
  margin-bottom: 0;
}

.confirmation-input label {
  display: block;
  margin-bottom: var(--spacing-sm);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.confirmation-input .form-control {
  width: 100%;
  padding: var(--input-padding);
  background-color: var(--color-bg-primary);
  border: var(--input-border);
  border-radius: var(--border-radius-sm);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  font-family: monospace;
}

.confirmation-input .form-control:focus {
  outline: none;
  border-color: var(--color-danger);
  box-shadow: 0 0 0 3px var(--color-danger-bg);
}

.error-message {
  padding: var(--spacing-md);
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
  border: 1px solid var(--color-danger);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}
</style>
