<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="['toast', `toast-${toast.type}`]"
      >
        <i :class="getIcon(toast.type)"></i>
        <span class="toast-message">{{ toast.message }}</span>
        <button
          v-if="toast.action"
          class="toast-action"
          @click="toast.action.callback(); remove(toast.id)"
        >
          {{ toast.action.label }}
        </button>
        <button class="toast-close" @click="remove(toast.id)">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '../../composables/useToast'

const { toasts, remove } = useToast()

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
.toast-container {
  position: fixed;
  bottom: var(--spacing-lg);
  right: var(--spacing-lg);
  z-index: var(--z-index-tooltip);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  max-width: 400px;
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: 12px 16px;
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-lg);
  color: var(--color-white);
  font-size: var(--font-size-sm);
  min-width: 300px;
  animation: slideInRight var(--transition-slow);
}

.toast i:first-child {
  font-size: var(--font-size-xl);
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
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
  .toast-container {
    left: var(--spacing-lg);
    right: var(--spacing-lg);
    max-width: none;
  }

  .toast {
    min-width: auto;
  }
}
</style>
