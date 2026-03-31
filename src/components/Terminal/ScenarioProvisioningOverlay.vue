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
  <div class="provisioning-overlay">
    <div class="provisioning-content">
      <div class="provisioning-icon">
        <i v-if="!ready" class="fas fa-cog fa-spin"></i>
        <i v-else class="fas fa-check-circle"></i>
      </div>
      <h3>{{ ready ? t('provisioning.ready') : t('provisioning.title') }}</h3>
      <p v-if="!ready" class="provisioning-detail">{{ t('provisioning.detail') }}</p>
      <slot v-if="ready" name="ready-action"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTranslations } from '../../composables/useTranslations'

interface Props {
  ready?: boolean
}

withDefaults(defineProps<Props>(), {
  ready: false
})

const { t } = useTranslations({
  en: {
    provisioning: {
      title: 'Setting up your environment...',
      detail: 'Creating terminal and preparing scenario. This may take a few minutes.',
      ready: 'Your environment is ready!'
    }
  },
  fr: {
    provisioning: {
      title: 'Préparation de votre environnement...',
      detail: 'Création du terminal et préparation du scénario. Cela peut prendre quelques minutes.',
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
  background-color: var(--color-bg-primary);
  border-radius: var(--border-radius-lg);
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
