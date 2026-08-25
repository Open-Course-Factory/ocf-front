<!--
  Open Course Factory - Front
  Copyright (C) 2023-2026 Solution Libre
-->
<template>
  <div class="ocf-translation-pane">
    <div class="ocf-pane-header">
      <label :for="fieldId">{{ label }}</label>
      <span v-if="stale" class="ocf-pane-stale">
        <i class="fas fa-exclamation-triangle"></i>
        {{ t('translationPane.stale') }}
      </span>
    </div>

    <div class="ocf-pane-columns">
      <!-- Source, read-only. Translating without seeing the original is how a
           translation comes to answer a different question than the one asked. -->
      <div class="ocf-pane-column">
        <span class="ocf-pane-caption">{{ t('translationPane.source', { locale: sourceLocaleLabel }) }}</span>
        <textarea
          v-if="multiline"
          class="form-control ocf-pane-source"
          :rows="rows"
          :value="source"
          readonly
          tabindex="-1"
        ></textarea>
        <input v-else type="text" class="form-control ocf-pane-source" :value="source" readonly tabindex="-1" />
      </div>

      <div class="ocf-pane-column">
        <span class="ocf-pane-caption">{{ t('translationPane.target', { locale: targetLocaleLabel }) }}</span>
        <textarea
          v-if="multiline"
          :id="fieldId"
          class="form-control"
          :rows="rows"
          :value="modelValue"
          :placeholder="placeholder"
          @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
        ></textarea>
        <input
          v-else
          :id="fieldId"
          type="text"
          class="form-control"
          :value="modelValue"
          :placeholder="placeholder"
          @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTranslations } from '../../composables/useTranslations'

/**
 * One translatable field, shown beside the original.
 *
 * An empty target is not an empty field: it means "not translated yet", and the
 * reader falls back to the source. Nothing here writes a blank over anything.
 */
defineProps<{
  label: string
  fieldId: string
  source: string
  modelValue: string
  sourceLocaleLabel: string
  targetLocaleLabel: string
  multiline?: boolean
  rows?: number
  placeholder?: string
  stale?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [string] }>()

const { t } = useTranslations({
  en: {
    translationPane: {
      source: 'Original ({locale})',
      target: 'Translation ({locale})',
      stale: 'The original changed after this was translated'
    }
  },
  fr: {
    translationPane: {
      source: 'Original ({locale})',
      target: 'Traduction ({locale})',
      stale: "L'original a changé depuis cette traduction"
    }
  }
})
</script>

<style scoped>
.ocf-translation-pane {
  margin-bottom: 1.25rem;
}

.ocf-pane-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.35rem;
}

.ocf-pane-header label {
  font-weight: 600;
  color: var(--color-text-primary);
}

.ocf-pane-stale {
  font-size: 0.8rem;
  color: var(--color-warning);
}

.ocf-pane-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.ocf-pane-column {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.ocf-pane-caption {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

/* The source is reference, not a field: dimmed and out of the tab order, so it
   never looks like somewhere to type. */
.ocf-pane-source {
  background: var(--color-background-secondary);
  color: var(--color-text-secondary);
  cursor: default;
}

@media (max-width: 60rem) {
  .ocf-pane-columns {
    grid-template-columns: 1fr;
  }
}
</style>
