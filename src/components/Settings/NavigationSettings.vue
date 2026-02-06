<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <SettingsCard :title="t('userSettings.navigation.title')">
    <div class="form-group">
      <label>{{ t('userSettings.navigation.defaultLandingPage') }}</label>
      <select
        v-model="localSettings.default_landing_page"
        @change="saveSettings"
        class="form-control"
      >
        <option v-for="page in settingsStore.availablePages" :key="page.value" :value="page.value">
          {{ page.label }}
        </option>
      </select>
      <small class="form-text">{{ t('userSettings.navigation.defaultLandingPageHelp') }}</small>
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

const defaultPage = () => settingsStore.availablePages[0]?.value || '/terminal-sessions'

const localSettings = ref({
  default_landing_page: settingsStore.settings.default_landing_page || defaultPage()
})

watch(() => settingsStore.settings, (newSettings) => {
  localSettings.value.default_landing_page = newSettings.default_landing_page || defaultPage()
}, { deep: true })

async function saveSettings() {
  try {
    await settingsStore.updateSettings({
      default_landing_page: localSettings.value.default_landing_page
    })
    toast.success(t('userSettings.saveSuccess'))
  } catch (error) {
    console.error('Error saving navigation settings:', error)
    toast.error(t('userSettings.saveError'))
  }
}
</script>
