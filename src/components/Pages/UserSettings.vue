<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <div class="user-settings-page">
    <h1>{{ t('userSettings.pageTitle') }}</h1>

    <div v-if="settingsStore.isLoading" class="loading">
      <i class="fas fa-spinner fa-spin"></i> {{ t('loading') }}
    </div>

    <div v-else class="settings-sections">
      <!-- Navigation Section -->
      <section class="settings-card">
        <NavigationSettings />
      </section>

      <!-- Localization Section -->
      <section class="settings-card">
        <LocalizationSettings />
      </section>

      <!-- UI Section -->
      <section class="settings-card">
        <UISettings />
      </section>

      <!-- Notifications Section -->
      <section class="settings-card">
        <NotificationSettings />
      </section>

      <!-- Security Section -->
      <section class="settings-card">
        <SecuritySettings />
      </section>

      <!-- SSH Keys Section -->
      <section class="settings-card">
        <SSHKeysSettings />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserSettingsStore } from '../../stores/userSettings'
import { useTranslations } from '../../composables/useTranslations'
import NavigationSettings from '../Settings/NavigationSettings.vue'
import LocalizationSettings from '../Settings/LocalizationSettings.vue'
import UISettings from '../Settings/UISettings.vue'
import NotificationSettings from '../Settings/NotificationSettings.vue'
import SecuritySettings from '../Settings/SecuritySettings.vue'
import SSHKeysSettings from '../Settings/SSHKeysSettings.vue'

const { t } = useTranslations({
  en: {
    loading: 'Loading...'
  },
  fr: {
    loading: 'Chargement...'
  }
})

const settingsStore = useUserSettingsStore()

onMounted(async () => {
  await settingsStore.loadSettings()
})
</script>

<style scoped>
.user-settings-page {
  padding: 20px;
}

.user-settings-page h1 {
  font-size: 2rem;
  margin-bottom: 30px;
  color: #333;
}

.loading {
  text-align: center;
  padding: 40px;
  font-size: 1.1rem;
  color: #666;
}

.loading i {
  margin-right: 10px;
}

.settings-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1200px;
}

.settings-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 25px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
}

.settings-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transition: box-shadow 0.3s ease;
}

/* Responsive */
@media (max-width: 768px) {
  .user-settings-page {
    padding: 10px;
  }

  .user-settings-page h1 {
    font-size: 1.5rem;
    margin-bottom: 20px;
  }

  .settings-card {
    padding: 15px;
  }
}
</style>
