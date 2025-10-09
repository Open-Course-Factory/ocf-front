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
  border-left: var(--border-width-thick) solid #1e7e34;
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
  border-left: var(--border-width-thick) solid #117a8b;
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
