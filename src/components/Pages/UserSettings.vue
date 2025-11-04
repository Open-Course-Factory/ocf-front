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
      <!-- Upgrade to Team Banner -->
      <UpgradeToTeamBanner />

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

      <!-- Version Section -->
      <section class="settings-card version-section">
        <h3>{{ t('version.title') }}</h3>
        <p class="version-info">
          <span class="version-label">{{ t('version.label') }}:</span>
          <span class="version-value">{{ appVersion }}</span>
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useUserSettingsStore } from '../../stores/userSettings'
import { useTranslations } from '../../composables/useTranslations'
import UpgradeToTeamBanner from '../Common/UpgradeToTeamBanner.vue'
import NavigationSettings from '../Settings/NavigationSettings.vue'
import LocalizationSettings from '../Settings/LocalizationSettings.vue'
import UISettings from '../Settings/UISettings.vue'
import NotificationSettings from '../Settings/NotificationSettings.vue'
import SecuritySettings from '../Settings/SecuritySettings.vue'
import SSHKeysSettings from '../Settings/SSHKeysSettings.vue'

const { t } = useTranslations({
  en: {
    loading: 'Loading...',
    version: {
      title: 'Application Version',
      label: 'Version'
    }
  },
  fr: {
    loading: 'Chargement...',
    version: {
      title: 'Version de l\'application',
      label: 'Version'
    }
  }
})

const settingsStore = useUserSettingsStore()
const appVersion = computed(() => __APP_VERSION__)

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
  color: var(--color-text-primary);
}

.loading {
  text-align: center;
  padding: 40px;
  font-size: 1.1rem;
  color: var(--color-text-muted);
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
  background-color: var(--color-white);
  border-radius: 8px;
  padding: 25px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--color-border-light);
}

.settings-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transition: box-shadow 0.3s ease;
}

.version-section {
  text-align: center;
  background-color: var(--color-background-secondary);
}

.version-section h3 {
  font-size: 1.2rem;
  color: var(--color-text-primary);
  margin-bottom: 10px;
}

.version-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.95rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.version-label {
  font-weight: 500;
  color: var(--color-text-muted);
}

.version-value {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: var(--color-primary);
  background-color: var(--color-background-primary);
  padding: 2px 8px;
  border-radius: 4px;
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
