<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <SettingsCard :title="t('userSettings.ui.title')">
    <div class="form-group">
      <label>{{ t('userSettings.ui.theme') }}</label>
      <select
        v-model="localSettings.theme"
        @change="saveSettings"
        class="form-control"
      >
        <option v-for="theme in settingsStore.availableThemes" :key="theme.value" :value="theme.value">
          {{ theme.label }}
        </option>
      </select>
    </div>
    <div class="form-group">
      <label class="checkbox-label">
        <input
          type="checkbox"
          v-model="localSettings.compact_mode"
          @change="saveSettings"
        />
        <span>{{ t('userSettings.ui.compactMode') }}</span>
      </label>
      <small class="form-text">{{ t('userSettings.ui.compactModeHelp') }}</small>
    </div>
  </SettingsCard>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserSettingsStore } from '../../stores/userSettings'
import { useToast } from '../../composables/useToast'
import { useTheme } from '../../composables/useTheme'
import SettingsCard from '../UI/SettingsCard.vue'

const { t } = useI18n()
const settingsStore = useUserSettingsStore()
const toast = useToast()
const { setTheme } = useTheme()

const localSettings = ref({
  theme: settingsStore.settings.theme || 'light',
  compact_mode: settingsStore.settings.compact_mode || false
})

watch(() => settingsStore.settings, (newSettings) => {
  localSettings.value.theme = newSettings.theme || 'light'
  localSettings.value.compact_mode = newSettings.compact_mode || false
}, { deep: true })

async function saveSettings() {
  try {
    await settingsStore.updateSettings({
      theme: localSettings.value.theme,
      compact_mode: localSettings.value.compact_mode
    })

    // Apply theme immediately
    setTheme(localSettings.value.theme as 'light' | 'dark' | 'auto')

    toast.success(t('userSettings.saveSuccess'))
  } catch (error) {
    console.error('Error saving UI settings:', error)
    toast.error(t('userSettings.saveError'))
  }
}
</script>

<style scoped>
.form-text {
  margin-left: 28px;
}
</style>
