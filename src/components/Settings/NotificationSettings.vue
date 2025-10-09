<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <SettingsCard :title="t('userSettings.notifications.title')">
    <div class="form-group">
      <label class="checkbox-label">
        <input
          type="checkbox"
          v-model="localSettings.email_notifications"
          @change="saveSettings"
        />
        <span>{{ t('userSettings.notifications.emailNotifications') }}</span>
      </label>
      <small class="form-text">{{ t('userSettings.notifications.emailNotificationsHelp') }}</small>
    </div>
    <div class="form-group">
      <label class="checkbox-label">
        <input
          type="checkbox"
          v-model="localSettings.desktop_notifications"
          @change="saveSettings"
        />
        <span>{{ t('userSettings.notifications.desktopNotifications') }}</span>
      </label>
      <small class="form-text">{{ t('userSettings.notifications.desktopNotificationsHelp') }}</small>
    </div>
  </SettingsCard>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserSettingsStore } from '../../stores/userSettings'
import { useToast } from '../../composables/useToast'
import SettingsCard from '../UI/SettingsCard.vue'

const { t } = useI18n()
const settingsStore = useUserSettingsStore()
const toast = useToast()

const localSettings = ref({
  email_notifications: settingsStore.settings.email_notifications || false,
  desktop_notifications: settingsStore.settings.desktop_notifications || false
})

watch(() => settingsStore.settings, (newSettings) => {
  localSettings.value.email_notifications = newSettings.email_notifications || false
  localSettings.value.desktop_notifications = newSettings.desktop_notifications || false
}, { deep: true })

async function saveSettings() {
  try {
    await settingsStore.updateSettings({
      email_notifications: localSettings.value.email_notifications,
      desktop_notifications: localSettings.value.desktop_notifications
    })
    toast.success(t('userSettings.saveSuccess'))
  } catch (error) {
    console.error('Error saving notification settings:', error)
    toast.error(t('userSettings.saveError'))
  }
}
</script>

<style scoped>
.form-text {
  margin-left: 28px;
}
</style>
