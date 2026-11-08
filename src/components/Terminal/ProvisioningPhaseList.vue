<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Progress path shown while a scenario environment (or its next step) is
 * being prepared: the running phase in a sentence, then one dot per phase on a
 * rail that fills as they complete. Shared by ScenarioProvisioningOverlay and
 * the in-panel step transition: pass `phases` to scope it (the session-start
 * overlay shows all three; a per-step wait shows only step_setup — the
 * terminal already exists there — and a single phase needs no path).
 */
-->

<template>
  <div class="ocf-progress-path">
    <p class="ocf-progress-path__now" role="status" aria-live="polite">
      <span v-if="phaseSteps.length === 1" class="ocf-progress-path__beat" aria-hidden="true"></span>
      {{ activeStep.sentence }}
    </p>

    <div v-if="phaseSteps.length > 1" class="ocf-progress-path__track" :style="{ '--ocf-path-n': phaseSteps.length }">
      <span class="ocf-progress-path__rail" aria-hidden="true">
        <span class="ocf-progress-path__fill" :style="{ inlineSize: fillPercent }"></span>
      </span>
      <ol
        class="ocf-progress-path__nodes"
        role="progressbar"
        aria-valuemin="0"
        :aria-valuemax="phaseSteps.length"
        :aria-valuenow="activeIndex + 1"
        :aria-valuetext="activeStep.sentence"
      >
        <li
          v-for="(step, i) in phaseSteps"
          :key="step.key"
          class="provisioning-step"
          :class="{ 'step--done': step.done, 'step--active': step.active }"
        >
          <span class="ocf-progress-path__dot" aria-hidden="true">
            <i v-if="step.done" class="fas fa-check"></i>
            <template v-else>{{ i + 1 }}</template>
          </span>
          <span class="step-label">{{ step.label }}</span>
        </li>
      </ol>
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
      step_setup: 'Running scenario setup scripts...',
      replay: 'Rebuilding your environment up to your step...'
    },
    provisioningPhaseNames: {
      terminal_creation: 'Terminal',
      setup_script: 'Environment',
      step_setup: 'Scenario',
      replay: 'Rebuild'
    }
  },
  fr: {
    provisioningPhases: {
      terminal_creation: 'Création de votre terminal...',
      setup_script: 'Installation des paquets et configuration de l\'environnement...',
      step_setup: 'Exécution des scripts de configuration du scénario...',
      replay: 'Reconstruction de votre environnement jusqu\'à votre étape...'
    },
    provisioningPhaseNames: {
      terminal_creation: 'Terminal',
      setup_script: 'Environnement',
      step_setup: 'Scénario',
      replay: 'Reconstruction'
    }
  }
})

// A phase the caller does not list — a backend phase this list was not scoped
// to, or one added later — falls back to the first being active, so the path
// always shows motion while it is on screen rather than looking stalled.
const activeIndex = computed(() => Math.max(0, props.phases.indexOf(props.phase)))

const phaseSteps = computed(() =>
  props.phases.map((key, i) => ({
    key,
    label: t(`provisioningPhaseNames.${key}`),
    sentence: t(`provisioningPhases.${key}`),
    done: activeIndex.value > i,
    active: activeIndex.value === i
  }))
)

const activeStep = computed(() => phaseSteps.value[activeIndex.value])

// The rail runs from the first dot to the last; it fills up to the active one.
const fillPercent = computed(() => `${(activeIndex.value / (props.phases.length - 1)) * 100}%`)
</script>

<style scoped>
.ocf-progress-path {
  display: grid;
  gap: var(--spacing-lg);
  margin-top: var(--spacing-lg);
}

.ocf-progress-path__now {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  margin: 0;
  min-height: calc(2 * var(--line-height-normal, 1.5) * 1em);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-primary);
}

/* A lone phase has no path: a beating dot beside its sentence says it runs. */
.ocf-progress-path__beat {
  flex-shrink: 0;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--color-primary);
  animation: ocf-path-beat 1.4s ease-in-out infinite;
}

.ocf-progress-path__track {
  position: relative;
}

/* Centred on the dots (2rem tall), from the first dot's centre to the last's:
   each node owns 1/n of the width, its dot sits in the middle of it. */
.ocf-progress-path__rail {
  position: absolute;
  top: calc(1rem - 2px);
  inset-inline: calc(100% / (2 * var(--ocf-path-n)));
  height: 4px;
  border-radius: 999px;
  background: var(--color-border-light);
  overflow: hidden;
}

.ocf-progress-path__fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-primary);
  transition: inline-size 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.ocf-progress-path__nodes {
  position: relative;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  margin: 0;
  padding: 0;
  list-style: none;
}

.provisioning-step {
  display: grid;
  justify-items: center;
  gap: var(--spacing-xs);
  text-align: center;
}

.ocf-progress-path__dot {
  position: relative;
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  border: 2px solid var(--color-border-light);
  background: var(--color-bg-primary);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  font-variant-numeric: tabular-nums;
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
}

.step--done .ocf-progress-path__dot {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-white);
}

.step--active .ocf-progress-path__dot {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* The phase at work: a ring that keeps leaving the dot. */
.step--active .ocf-progress-path__dot::after {
  content: '';
  position: absolute;
  inset: -0.35rem;
  border-radius: 50%;
  border: 2px solid var(--color-primary);
  opacity: 0;
  pointer-events: none;
  animation: ocf-path-pulse 1.8s ease-out infinite;
}

.step-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.step--done .step-label,
.step--active .step-label {
  color: var(--color-text-primary);
}

.step--active .step-label {
  font-weight: var(--font-weight-semibold);
}

@keyframes ocf-path-pulse {
  0% { transform: scale(0.75); opacity: 0.7; }
  100% { transform: scale(1.35); opacity: 0; }
}

@keyframes ocf-path-beat {
  0%, 100% { opacity: 0.35; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .ocf-progress-path__fill,
  .ocf-progress-path__dot {
    transition: none;
  }

  .step--active .ocf-progress-path__dot::after,
  .ocf-progress-path__beat {
    animation: none;
  }

  .step--active .ocf-progress-path__dot::after {
    opacity: 0.5;
  }
}
</style>
