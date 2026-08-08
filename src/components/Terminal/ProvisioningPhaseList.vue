<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Phase checklist shown while a scenario environment (or its next step) is
 * being prepared. Extracted from ScenarioProvisioningOverlay so the in-panel
 * step-transition state can reuse it: pass `phases` to scope the list (the
 * session-start overlay shows all three; a per-step wait shows only
 * step_setup — the terminal already exists there).
 */
-->

<template>
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

<script setup lang="ts">
import { computed } from 'vue'
import { useTranslations } from '../../composables/useTranslations'

interface Props {
  /** Current backend phase key ('' = not started yet). */
  phase?: string
  /** Ordered phase keys to display. Defaults to the session-start sequence. */
  phases?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  phase: '',
  phases: () => ['terminal_creation', 'setup_script', 'step_setup']
})

const { t } = useTranslations({
  en: {
    provisioningPhases: {
      terminal_creation: 'Creating your terminal...',
      setup_script: 'Installing packages and configuring environment...',
      step_setup: 'Running scenario setup scripts...'
    }
  },
  fr: {
    provisioningPhases: {
      terminal_creation: 'Création de votre terminal...',
      setup_script: 'Installation des paquets et configuration de l\'environnement...',
      step_setup: 'Exécution des scripts de configuration du scénario...'
    }
  }
})

const phaseSteps = computed(() => {
  // A phase the caller does not list — a backend phase this list was not scoped
  // to, or one added later — used to leave indexOf at -1, which rendered every
  // row idle: no tick, no spinner, a checklist that looked stalled while the
  // work was in fact running. Fall back to the first row being active, so the
  // list always shows motion while it is on screen.
  const index = props.phases.indexOf(props.phase)
  const currentIndex = index === -1 ? 0 : index

  return props.phases.map((key, i) => ({
    key,
    label: t(`provisioningPhases.${key}`),
    done: currentIndex > i,
    active: currentIndex === i
  }))
})
</script>

<style scoped>
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
