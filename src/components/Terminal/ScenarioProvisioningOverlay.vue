<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Shared provisioning overlay shown while a scenario environment is being prepared.
 * Used by both ScenarioLauncher and TerminalSessionView.
 */
-->

<template>
  <div class="provisioning-overlay" :class="{ 'provisioning-overlay--fixed': fixed }">
    <div class="provisioning-content">
      <div class="provisioning-icon">
        <i v-if="!ready" class="fas fa-cog fa-spin"></i>
        <i v-else class="fas fa-check-circle"></i>
      </div>
      <h3>{{ ready ? t('provisioning.ready') : t('provisioning.title') }}</h3>
      <p v-if="!ready && message" class="provisioning-detail">{{ message }}</p>
      <slot v-if="ready" name="ready-action"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTranslations } from '../../composables/useTranslations'

interface Props {
  message?: string
  ready?: boolean
  fixed?: boolean
}

withDefaults(defineProps<Props>(), {
  message: '',
  ready: false,
  fixed: false
})

const { t } = useTranslations({
  en: {
    provisioning: {
      title: 'Setting up your environment...',
      ready: 'Your environment is ready!'
    }
  },
  fr: {
    provisioning: {
      title: 'Préparation de votre environnement...',
      ready: 'Votre environnement est prêt !'
    }
  }
})
</script>

<style scoped>
.provisioning-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: var(--border-radius-lg);
}

.provisioning-overlay--fixed {
  position: fixed;
  z-index: 1000;
  border-radius: 0;
}

.provisioning-content {
  background: var(--color-bg-primary);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-2xl);
  text-align: center;
  max-width: 400px;
  box-shadow: var(--shadow-lg);
}

.provisioning-icon {
  font-size: 3rem;
  color: var(--color-primary);
  margin-bottom: var(--spacing-md);
}

.provisioning-icon .fa-check-circle {
  color: var(--color-success);
}

.provisioning-content h3 {
  margin: 0 0 var(--spacing-sm);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.provisioning-detail {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.provisioning-content :deep(.btn) {
  margin-top: var(--spacing-lg);
}

.provisioning-content :deep(.btn i) {
  margin-right: var(--spacing-xs);
}
</style>
