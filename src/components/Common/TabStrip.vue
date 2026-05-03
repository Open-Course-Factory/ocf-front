<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Shared tab strip with WAI-ARIA tablist semantics and arrow-key navigation.
 *
 * Usage (v-model on a string key):
 *
 *   <TabStrip
 *     v-model="activeTab"
 *     :tabs="[{ key: 'general', label: 'General' }, ...]"
 *     :aria-label="'Scenario settings'"
 *   />
 *   <div v-if="activeTab === 'general'" :id="`panel-general`" role="tabpanel" aria-labelledby="tab-general">
 *     ...
 *   </div>
 *
 * Tab buttons render with id="tab-{key}" so panels can be associated via
 * aria-labelledby. Arrow Left/Right cycles through tabs, Home/End jumps to
 * the first/last. Focus follows the active tab.
 */
-->

<template>
  <div
    class="tab-strip"
    role="tablist"
    :aria-label="ariaLabel"
    @keydown="onKeydown"
  >
    <button
      v-for="tab in tabs"
      :key="tab.key"
      :id="`tab-${tab.key}`"
      type="button"
      class="tab-strip__btn"
      :class="{ active: modelValue === tab.key }"
      role="tab"
      :aria-selected="modelValue === tab.key"
      :aria-controls="`panel-${tab.key}`"
      :tabindex="modelValue === tab.key ? 0 : -1"
      @click="emit('update:modelValue', tab.key)"
    >
      <i v-if="tab.icon" :class="tab.icon" aria-hidden="true"></i>
      {{ tab.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
export interface TabDefinition {
  key: string
  label: string
  icon?: string
}

interface Props {
  tabs: TabDefinition[]
  modelValue: string
  ariaLabel?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', key: string): void
}>()

function onKeydown(e: KeyboardEvent) {
  const keys = props.tabs.map(t => t.key)
  const i = keys.indexOf(props.modelValue)
  if (i === -1) return
  let next = i
  if (e.key === 'ArrowRight') next = (i + 1) % keys.length
  else if (e.key === 'ArrowLeft') next = (i - 1 + keys.length) % keys.length
  else if (e.key === 'Home') next = 0
  else if (e.key === 'End') next = keys.length - 1
  else return
  e.preventDefault()
  emit('update:modelValue', keys[next])
  // Focus the newly active tab on the next frame
  requestAnimationFrame(() => {
    const el = document.getElementById(`tab-${keys[next]}`) as HTMLElement | null
    el?.focus()
  })
}
</script>

<style scoped>
.tab-strip {
  display: flex;
  border-bottom: 2px solid var(--color-border);
  gap: 0;
}

.tab-strip__btn {
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.tab-strip__btn:hover {
  color: var(--color-text-primary);
  background: var(--color-surface-hover);
}

.tab-strip__btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  font-weight: 600;
}

.tab-strip__btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}
</style>
