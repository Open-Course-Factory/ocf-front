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
  <div
    class="provisioning-overlay"
    :class="{ 'provisioning-overlay--fullscreen': fullscreen }"
    data-testid="scenario-provisioning-overlay"
  >
    <!-- Over the console, the console's own shape stands in for it while it
         is built: same frame and header as the live one, so the page keeps
         one kind of frame and the card reads as a stage of that console. -->
    <div v-if="!fullscreen" class="ocf-console-skeleton" aria-hidden="true">
      <div class="ocf-console-skeleton__header">
        <span class="ocf-console-skeleton__pill ocf-console-skeleton__pill--title"></span>
        <span class="ocf-console-skeleton__pill"></span>
        <span class="ocf-console-skeleton__pill"></span>
      </div>
      <div class="ocf-console-skeleton__body">
        <div class="ocf-console-skeleton__screen">
          <span v-for="w in SKELETON_LINES" :key="w" class="ocf-console-skeleton__line" :style="{ width: w }"></span>
        </div>
      </div>
    </div>

    <div class="provisioning-content">
      <template v-if="ready">
        <div class="provisioning-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <h3>{{ t('provisioning.ready') }}</h3>
        <slot name="ready-action"></slot>
      </template>

      <!-- No phase reported yet is the terminal being created: the first one. -->
      <template v-else>
        <h3>{{ t(phase === 'replay' ? 'provisioning.rebuildTitle' : 'provisioning.title') }}</h3>
        <p class="provisioning-detail">{{ t(phase === 'replay' ? 'provisioning.rebuildDetail' : 'provisioning.detail') }}</p>
        <ProvisioningPhaseList :phase="phase" :phases="phase === 'replay' ? REBUILD_PHASES : undefined" />
        <button
          v-if="cancellable"
          class="btn btn-cancel"
          data-testid="provisioning-cancel"
          :disabled="isCancelling"
          @click="handleCancel"
        >
          <i :class="isCancelling ? 'fas fa-spinner fa-spin' : 'fas fa-times'"></i>
          {{ isCancelling ? t('provisioning.cancelling') : t('provisioning.cancel') }}
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import ProvisioningPhaseList from './ProvisioningPhaseList.vue'

interface Props {
  ready?: boolean
  phase?: string // 'terminal_creation' (client-side only) | 'setup_script' | 'step_setup' | 'replay' (from backend) | ''
  cancellable?: boolean
  // Over the whole viewport instead of the positioned parent: a page that
  // scrolls would otherwise centre the card off-screen.
  fullscreen?: boolean
}

interface Emits {
  (e: 'cancel'): void
}

withDefaults(defineProps<Props>(), {
  ready: false,
  phase: '',
  cancellable: false,
  fullscreen: false
})

const emit = defineEmits<Emits>()

// A run rebuilt on a new terminal replays its setup up to the learner's step
// instead of the launch's setup_script / step_setup sequence.
const REBUILD_PHASES = ['terminal_creation', 'replay']
// Prompt-like line lengths for the console skeleton (unique: they key the loop).
const SKELETON_LINES = ['34%', '58%', '22%', '46%', '28%']
const isCancelling = ref(false)

function handleCancel() {
  isCancelling.value = true
  emit('cancel')
}

const { t } = useTranslations({
  en: {
    provisioning: {
      title: 'Setting up your environment...',
      detail: 'Creating terminal and preparing scenario. This may take a few minutes.',
      rebuildTitle: 'Rebuilding your environment...',
      rebuildDetail: 'Preparing a fresh machine at your step. This may take a few minutes.',
      ready: 'Your environment is ready!',
      cancel: 'Cancel',
      cancelling: 'Cancelling...'
    }
  },
  fr: {
    provisioning: {
      title: 'Préparation de votre environnement...',
      detail: 'Création du terminal et préparation du scénario. Cela peut prendre quelques minutes.',
      rebuildTitle: 'Reconstruction de votre environnement...',
      rebuildDetail: 'Préparation d\'une nouvelle machine à votre étape. Cela peut prendre quelques minutes.',
      ready: 'Votre environnement est prêt !',
      cancel: 'Annuler',
      cancelling: 'Annulation...'
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
}

.provisioning-overlay--fullscreen {
  position: fixed;
  z-index: var(--z-index-modal);
  padding: var(--spacing-md);
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 0;
}

.ocf-console-skeleton {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-primary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.ocf-console-skeleton__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  min-height: 2.75rem;
  background: var(--color-bg-secondary);
  border-bottom: var(--border-width-thin) solid var(--color-border-medium);
}

.ocf-console-skeleton__pill {
  width: 3.5rem;
  height: 0.75rem;
  border-radius: 999px;
  background: var(--color-border-light);
}

.ocf-console-skeleton__pill--title {
  width: 9rem;
  margin-right: auto;
}

.ocf-console-skeleton__body {
  flex: 1;
  min-height: 0;
  padding: var(--spacing-sm);
}

.ocf-console-skeleton__screen {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding: var(--spacing-md);
  border-radius: var(--border-radius-sm);
  background: var(--terminal-bg);
}

/* Faint prompt lines, with one slow sweep of light across them. */
.ocf-console-skeleton__line {
  height: 0.6rem;
  border-radius: 999px;
  background: linear-gradient(90deg,
    color-mix(in srgb, var(--terminal-fg) 10%, transparent) 0%,
    color-mix(in srgb, var(--terminal-fg) 20%, transparent) 50%,
    color-mix(in srgb, var(--terminal-fg) 10%, transparent) 100%);
  background-size: 200% 100%;
  animation: ocf-console-sweep 2.4s ease-in-out infinite;
}

@keyframes ocf-console-sweep {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .ocf-console-skeleton__line {
    animation: none;
  }
}

.provisioning-content {
  position: relative;
  background: var(--color-bg-primary);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-2xl);
  text-align: center;
  width: 100%;
  max-width: 440px;
  border: var(--border-width-thin) solid var(--color-border-light);
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

.btn-cancel {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-lg);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: transparent;
  color: var(--color-text-muted);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all 0.2s ease;
}

.btn-cancel:hover:not(:disabled) {
  color: var(--color-danger);
  border-color: var(--color-danger);
  background: var(--color-bg-secondary);
}

.btn-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
