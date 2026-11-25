<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Labinux
 */
-->

<template>
  <div class="card">
    <div class="card-header" :class="{ 'ocf-single-line-title': singleLineTitle }">
      <h2 :title="singleLineTitle ? title : undefined"><i v-if="icon" :class="icon"></i> {{ title }}</h2>
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
withDefaults(defineProps<{
  title: string
  icon?: string
  /** For titles of any length: one line, cut with an ellipsis, full text on hover.
   *  In a narrow card the header actions move below the title. */
  singleLineTitle?: boolean
}>(), {
  icon: undefined,
  singleLineTitle: false
})
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

/* A container query, not @media: the card can be narrow in a wide window
   (the session page splits the screen between the terminal and the scenario). */
.ocf-single-line-title {
  container-type: inline-size;
  flex-wrap: wrap;
  gap: var(--spacing-sm) var(--spacing-md);
}

.ocf-single-line-title h2 {
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ocf-single-line-title .header-actions {
  align-items: center;
  flex-wrap: wrap;
  row-gap: var(--spacing-xs);
}

@container (max-width: 720px) {
  .ocf-single-line-title h2 {
    flex-basis: 100%;
  }
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
