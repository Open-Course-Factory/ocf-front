<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <div class="card">
    <div class="card-header">
      <h2>{{ title }}</h2>
      <div v-if="$slots.headerActions" class="header-actions">
        <slot name="headerActions"></slot>
      </div>
    </div>
    <div class="card-body">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: var(--spacing-md);
}

/* Deep selectors for content inside the card body */
.card-body :deep(.info-section) {
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-xl);
  border-bottom: var(--border-width-medium) solid var(--color-border-light);
}

.card-body :deep(.info-grid) {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
}

.card-body :deep(.info-item label) {
  display: block;
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-secondary);
}

.card-body :deep(.info-item p) {
  margin: 0;
  padding: 12px 16px;
  background-color: var(--color-bg-secondary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
}

.card-body :deep(.password-change-section h3) {
  font-size: var(--font-size-xl);
  margin-bottom: var(--spacing-lg);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
}
</style>
