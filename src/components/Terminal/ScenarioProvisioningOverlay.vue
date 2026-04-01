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
      <template v-if="ready">
        <div class="provisioning-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <h3>{{ t('provisioning.ready') }}</h3>
        <slot name="ready-action"></slot>
      </template>

      <template v-else-if="phase">
        <div class="provisioning-icon">
          <i class="fas fa-cog fa-spin"></i>
        </div>
        <h3>{{ t('provisioning.title') }}</h3>
        <p class="provisioning-detail">{{ t('provisioning.detail') }}</p>
        <div class="provisioning-steps">
          <div
            v-for="step in phaseSteps"
            :key="step.key"
            class="provisioning-step"
            :class="{ 'step--done': step.done, 'step--active': step.active }"
          >
            <div class="step-icon">
              <i v-if="step.done" class="fas fa-check-circle"></i>
              <i v-else-if="step.active" class="fas fa-circle-notch fa-spin"></i>
              <i v-else class="far fa-circle"></i>
            </div>
            <span class="step-label">{{ step.label }}</span>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="provisioning-icon">
          <i class="fas fa-cog fa-spin"></i>
        </div>
        <h3>{{ t('provisioning.title') }}</h3>
        <p class="provisioning-detail">{{ t('provisioning.detail') }}</p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTranslations } from '../../composables/useTranslations'

interface Props {
  ready?: boolean
  phase?: string // 'terminal_creation' | 'setup_script' | 'step_setup' | ''
}

const props = withDefaults(defineProps<Props>(), {
  ready: false,
  phase: ''
})

const { t } = useTranslations({
  en: {
    provisioning: {
      title: 'Setting up your environment...',
      detail: 'Creating terminal and preparing scenario. This may take a few minutes.',
      ready: 'Your environment is ready!',
      phases: {
        terminal_creation: 'Creating your terminal...',
        setup_script: 'Installing packages and configuring environment...',
        step_setup: 'Running scenario setup scripts...'
      }
    }
  },
  fr: {
    provisioning: {
      title: 'Préparation de votre environnement...',
      detail: 'Création du terminal et préparation du scénario. Cela peut prendre quelques minutes.',
      ready: 'Votre environnement est prêt !',
      phases: {
        terminal_creation: 'Création de votre terminal...',
        setup_script: 'Installation des paquets et configuration de l\'environnement...',
        step_setup: 'Exécution des scripts de configuration du scénario...'
      }
    }
  }
})

const phaseOrder = ['terminal_creation', 'setup_script', 'step_setup']

const phaseSteps = computed(() => {
  const currentIndex = props.phase ? phaseOrder.indexOf(props.phase) : -1
  return phaseOrder.map((key, index) => ({
    key,
    label: t(`provisioning.phases.${key}`),
    done: currentIndex > index,
    active: currentIndex === index
  }))
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

.provisioning-steps {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-lg);
  text-align: left;
}

.provisioning-step {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.step-icon {
  width: 1.25rem;
  text-align: center;
  flex-shrink: 0;
}

.step--done .step-icon {
  color: var(--color-success);
}

.step--active .step-icon {
  color: var(--color-primary);
}

.step--active .step-label {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}

.step--done .step-label {
  color: var(--color-text-secondary);
}
</style>
