<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="['btn', `btn-${variant}`, `btn-${size}`, { 'btn-loading': loading }]"
    @click="$emit('click', $event)"
  >
    <i v-if="loading" class="fas fa-spinner fa-spin"></i>
    <i v-else-if="icon" :class="icon"></i>
    <span v-if="$slots.default" class="btn-text">
      <slot></slot>
    </span>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'info' | 'outline-primary' | 'outline-secondary'
  size?: 'sm' | 'md' | 'lg'
  icon?: string
  disabled?: boolean
  loading?: boolean
}>()

defineEmits(['click'])
</script>

<script lang="ts">
export default {
  name: 'Button'
}
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  font-family: var(--font-family-primary);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  cursor: pointer;
  border: var(--border-width-medium) solid transparent;
  border-radius: var(--border-radius-md);
  text-decoration: none;
  transition: all var(--transition-base);
  user-select: none;
}

.btn:hover:not(:disabled):not(.btn-loading) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn:active:not(:disabled):not(.btn-loading) {
  transform: translateY(0);
}

.btn:disabled,
.btn-loading {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus-primary);
}

/* Sizes */
.btn-sm {
  padding: 6px 12px;
  font-size: var(--font-size-sm);
  border-radius: var(--border-radius-sm);
}

.btn-md {
  padding: var(--btn-padding-md);
  font-size: var(--font-size-base);
}

.btn-lg {
  padding: var(--btn-padding-lg);
  font-size: var(--font-size-lg);
  border-radius: var(--border-radius-lg);
}

/* Variants */
.btn-primary {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-white);
}

.btn-primary:hover:not(:disabled):not(.btn-loading) {
  background-color: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

.btn-secondary {
  background-color: var(--color-secondary);
  border-color: var(--color-secondary);
  color: var(--color-white);
}

.btn-secondary:hover:not(:disabled):not(.btn-loading) {
  background-color: var(--color-secondary-hover);
  border-color: var(--color-secondary-hover);
}

.btn-danger {
  background-color: var(--color-danger);
  border-color: var(--color-danger);
  color: var(--color-white);
}

.btn-danger:hover:not(:disabled):not(.btn-loading) {
  background-color: var(--color-danger-hover);
  border-color: var(--color-danger-hover);
}

.btn-warning {
  background-color: var(--color-warning);
  border-color: var(--color-warning);
  color: var(--color-gray-900);
}

.btn-warning:hover:not(:disabled):not(.btn-loading) {
  background-color: var(--color-warning-hover);
  border-color: var(--color-warning-hover);
}

.btn-info {
  background-color: var(--color-info);
  border-color: var(--color-info);
  color: var(--color-white);
}

.btn-outline-primary {
  background-color: transparent;
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.btn-outline-primary:hover:not(:disabled):not(.btn-loading) {
  background-color: var(--color-primary);
  color: var(--color-white);
}

.btn-outline-secondary {
  background-color: transparent;
  border-color: var(--color-secondary);
  color: var(--color-secondary);
}

.btn-outline-secondary:hover:not(:disabled):not(.btn-loading) {
  background-color: var(--color-secondary);
  color: var(--color-white);
}
</style>
