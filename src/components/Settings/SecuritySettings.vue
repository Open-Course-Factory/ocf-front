<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
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
          <div class="info-item">
            <label>{{ t('userSettings.security.twoFactorEnabled') }}</label>
            <p>{{ settingsStore.settings.two_factor_enabled ? 'Yes' : 'No' }}</p>
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
          <button type="submit" class="btn-primary" :disabled="settingsStore.isLoading">
            <i class="fas fa-key"></i>
            {{ settingsStore.isLoading ? 'Changing...' : t('userSettings.security.changePassword') }}
          </button>
        </form>
      </div>
  </SettingsCard>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserSettingsStore } from '../../stores/userSettings'
import SettingsCard from '../UI/SettingsCard.vue'

const { t } = useI18n()
const settingsStore = useUserSettingsStore()

const passwordForm = ref({
  current_password: '',
  new_password: '',
  confirm_password: ''
})

const errorMessage = ref('')
const successMessage = ref('')

function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleDateString()
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
    errorMessage.value = error.response?.data?.message || 'Error changing password'
  }
}
</script>
