<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */
-->

<template>
  <!-- ocf- prefix: Bootstrap's .toast/.toast-container (loaded from index.html) would hide and restyle these -->
  <!-- Persistent polite live region: a role on each inserted toast is often not announced -->
  <div class="ocf-toast-container" aria-live="polite">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="['ocf-toast', `toast-${toast.type}`]"
        :role="toast.type === 'error' ? 'alert' : undefined"
      >
        <i :class="getIcon(toast.type)"></i>
        <div class="toast-text">
          <strong v-if="toast.title" class="toast-title">{{ toast.title }}</strong>
          <span class="toast-message">{{ toast.message }}</span>
        </div>
        <button
          v-if="toast.action"
          class="toast-action"
          @click="toast.action.callback(); remove(toast.id)"
        >
          {{ toast.action.label }}
        </button>
        <button class="toast-close" :aria-label="t('toast.close')" @click="remove(toast.id)">
          <i class="fas fa-times" aria-hidden="true"></i>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '../../composables/useToast'
import { useTranslations } from '../../composables/useTranslations'

const { toasts, remove } = useToast()
const { t } = useTranslations({
  en: { toast: { close: 'Close notification' } },
  fr: { toast: { close: 'Fermer la notification' } },
})

function getIcon(type: string): string {
  switch (type) {
    case 'success':
      return 'fas fa-check-circle'
    case 'error':
      return 'fas fa-exclamation-circle'
    case 'warning':
      return 'fas fa-exclamation-triangle'
    case 'info':
    default:
      return 'fas fa-info-circle'
  }
}
</script>

<style scoped>
.ocf-toast-container {
  position: fixed;
  /* the padding keeps the toasts' shadow inside the scroll box; toasts stay --spacing-lg from the edges */
  top: 0;
  right: 0;
  padding: var(--spacing-lg);
  z-index: var(--z-index-tooltip);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  max-width: calc(400px + 2 * var(--spacing-lg));
  /* persistent errors can pile up: scroll instead of running off-screen */
  max-height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
  /* the gaps between toasts must not swallow clicks on the page */
  pointer-events: none;
}

.ocf-toast {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: 12px 16px;
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-lg);
  color: var(--color-white);
  font-size: var(--font-size-sm);
  min-width: 300px;
  pointer-events: auto;
  animation: slideInRight var(--transition-slow);
}

.ocf-toast > i:first-child {
  font-size: var(--font-size-xl);
  flex-shrink: 0;
}

.toast-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  overflow-wrap: anywhere;
}

.toast-title {
  font-weight: var(--font-weight-semibold);
}

.toast-action {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: var(--color-white);
  cursor: pointer;
  padding: 4px 10px;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background var(--transition-base);
}

.toast-action:hover {
  background: rgba(255, 255, 255, 0.35);
}

.toast-warning .toast-action {
  color: var(--color-black);
  border-color: rgba(0, 0, 0, 0.3);
  background: rgba(0, 0, 0, 0.1);
}

.toast-warning .toast-action:hover {
  background: rgba(0, 0, 0, 0.2);
}

.toast-close {
  background: none;
  border: none;
  color: var(--color-white);
  cursor: pointer;
  padding: 0;
  font-size: var(--font-size-md);
  opacity: 0.7;
  transition: opacity var(--transition-base);
  flex-shrink: 0;
}

.toast-close:hover {
  opacity: 1;
}

.toast-success {
  background-color: var(--color-success);
  border-left: var(--border-width-thick) solid var(--color-success-hover);
}

.toast-error {
  background-color: var(--color-danger);
  border-left: var(--border-width-thick) solid var(--color-danger-hover);
}

.toast-warning {
  background-color: var(--color-warning);
  border-left: var(--border-width-thick) solid var(--color-warning-hover);
  color: var(--color-black);
}

.toast-warning .toast-close {
  color: var(--color-black);
}

.toast-info {
  background-color: var(--color-info);
  border-left: var(--border-width-thick) solid var(--color-info-hover);
}

/* Transition animations */
.toast-enter-active,
.toast-leave-active {
  transition: all var(--transition-slow);
}

.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .ocf-toast-container {
    left: 0;
    right: 0;
    max-width: none;
  }

  .ocf-toast {
    min-width: auto;
  }
}
</style>
