<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * The problems a refused scenario import lists, one per line, so an author
 * can fix them all in one pass. The default slot holds the caller's actions.
 */
-->

<template>
  <div class="ocf-import-problems" role="alert" data-testid="scenario-import-problems">
    <p class="ocf-import-problems-title">
      <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
      {{ title }}
    </p>
    <ul>
      <li v-for="(problem, index) in problems" :key="index">{{ problem }}</li>
    </ul>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  problems: string[]
}>()
</script>

<style scoped>
.ocf-import-problems {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-danger-bg);
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
}

.ocf-import-problems-title {
  margin: 0 0 var(--spacing-xs);
  font-weight: 600;
}

.ocf-import-problems ul {
  margin: 0;
  padding-left: 1.25rem;
  max-height: 12rem;
  overflow-y: auto;
  font-family: var(--font-family-monospace);
  color: var(--color-text-primary);
}
</style>
