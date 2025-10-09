<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <div class="form-group">
    <label v-if="label" :for="id" class="form-label">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>
    <slot></slot>
    <small v-if="helpText" class="form-text">{{ helpText }}</small>
    <small v-if="error" class="form-error">{{ error }}</small>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label?: string
  id?: string
  helpText?: string
  error?: string
  required?: boolean
}>()
</script>

<script lang="ts">
export default {
  name: 'FormGroup'
}
</script>

<style scoped>
.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-label {
  display: block;
  margin-bottom: var(--spacing-sm);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
}

.required {
  color: var(--color-danger);
  margin-left: var(--spacing-xs);
}

.form-text {
  display: block;
  margin-top: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  line-height: var(--line-height-normal);
}

.form-error {
  display: block;
  margin-top: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-danger);
}

/* Style for form controls inside this component */
.form-group :deep(input),
.form-group :deep(select),
.form-group :deep(textarea) {
  display: block;
  width: 100%;
  padding: var(--input-padding);
  font-size: var(--font-size-base);
  font-family: var(--font-family-primary);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
  background-color: var(--color-bg-primary);
  border: var(--input-border);
  border-radius: var(--border-radius-md);
  box-sizing: border-box;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.form-group :deep(input:focus),
.form-group :deep(select:focus),
.form-group :deep(textarea:focus) {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus-primary);
}

.form-group :deep(input:disabled),
.form-group :deep(select:disabled),
.form-group :deep(textarea:disabled) {
  background-color: var(--color-bg-secondary);
  color: var(--color-text-disabled);
  cursor: not-allowed;
}

.form-group :deep(textarea) {
  resize: vertical;
  min-height: 80px;
}
</style>
