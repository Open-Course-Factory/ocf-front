<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */
-->

<template>
  <SettingsCard :title="t('userSettings.localization.title')">
    <div class="form-group">
      <label>{{ t('userSettings.localization.preferredLanguage') }}</label>
      <select
        v-model="localSettings.preferred_language"
        @change="saveSettings"
        class="form-control"
      >
        <option v-for="lang in settingsStore.availableLanguages" :key="lang.value" :value="lang.value">
          {{ lang.label }}
        </option>
      </select>
    </div>
    <div class="form-group">
      <label>{{ t('userSettings.localization.timezone') }}</label>
      <select
        v-model="localSettings.timezone"
        @change="saveSettings"
        class="form-control"
      >
        <option value="">{{ t('userSettings.localization.timezoneAuto', { zone: browserTimezone }) }}</option>
        <option v-for="tz in settingsStore.availableTimezones" :key="tz.value" :value="tz.value">
          {{ tz.label }}
        </option>
      </select>
    </div>
  </SettingsCard>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserSettingsStore } from '../../stores/userSettings'
import { useToast } from '../../composables/useToast'
import { useLocale } from '../../composables/useLocale'
import SettingsCard from '../UI/SettingsCard.vue'
import { getBrowserTimezone } from '../../utils/formatters'

const { t } = useI18n()
const settingsStore = useUserSettingsStore()
const toast = useToast()
const { setLocale } = useLocale()

// An empty timezone means "follow the machine" — the same rule useFormatters applies.
const browserTimezone = getBrowserTimezone()

const localSettings = ref({
  preferred_language: settingsStore.settings.preferred_language || 'en',
  timezone: settingsStore.settings.timezone || ''
})

watch(() => settingsStore.settings, (newSettings) => {
  localSettings.value.preferred_language = newSettings.preferred_language || 'en'
  localSettings.value.timezone = newSettings.timezone || ''
}, { deep: true })

async function saveSettings() {
  try {
    await settingsStore.updateSettings({
      preferred_language: localSettings.value.preferred_language,
      timezone: localSettings.value.timezone
    })

    // Apply language change immediately
    setLocale(localSettings.value.preferred_language)

    toast.success(t('userSettings.saveSuccess'))
  } catch (error) {
    console.error('Error saving localization settings:', error)
    toast.error(t('userSettings.saveError'))
  }
}
</script>
