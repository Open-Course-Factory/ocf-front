<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * The four kinds of step, as a small menu. Escape or a click elsewhere closes it.
 */
-->

<template>
  <div ref="menuRef" class="ocf-type-picker" role="menu" data-testid="step-type-picker" @keydown.esc.stop="emit('close')">
    <button
      v-for="type in STEP_TYPES"
      :key="type"
      type="button"
      role="menuitem"
      class="ocf-type-picker-item"
      :data-testid="`step-type-${type}`"
      @click="emit('pick', type)"
    >
      <span class="ocf-step-type-icon ocf-type-picker-icon" :class="`is-${type}`"><i :class="TYPE_ICONS[type]" aria-hidden="true"></i></span>
      <span>
        <span class="ocf-type-picker-label">{{ t(`scenarioEditor.stepType_${type}`) }}</span>
        <span class="ocf-type-picker-hint">{{ t(`scenarioEditor.stepTypeHint_${type}`) }}</span>
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useScenarioEditorI18n } from '../../composables/useScenarioEditorI18n'
import { STEP_TYPES, TYPE_ICONS, type StepType } from '../../utils/scenarioOutline'

const emit = defineEmits<{
  pick: [type: StepType]
  close: []
}>()

const { t } = useScenarioEditorI18n()
const menuRef = ref<HTMLElement | null>(null)

function onDocumentClick(event: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) emit('close')
}

onMounted(() => {
  menuRef.value?.querySelector('button')?.focus()
  // Next tick: the click that opened the menu must not close it.
  setTimeout(() => document.addEventListener('click', onDocumentClick))
})
onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick))
</script>

<style scoped>
.ocf-type-picker {
  display: flex;
  flex-direction: column;
  min-width: 15rem;
  padding: var(--spacing-xs);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-dropdown);
}

.ocf-type-picker-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  border: none;
  border-radius: var(--border-radius-sm);
  background: none;
  color: var(--color-text-primary);
  text-align: left;
  cursor: pointer;
}

.ocf-type-picker-item:hover,
.ocf-type-picker-item:focus-visible {
  background: var(--color-surface-hover);
  outline: none;
}

.ocf-type-picker-icon {
  width: 1.75rem;
  height: 1.75rem;
}

.ocf-type-picker-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.ocf-type-picker-hint {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>
