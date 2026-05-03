<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Header bar of the Scenario Editor page. Shows the scenario picker, current
 * org/platform context, the read-only badge, and the action buttons (import,
 * export, copy, reset, save).
 *
 * The parent owns all state — the header is a pure presentational component
 * that emits intents. The selector uses v-model for two-way binding on the
 * selected id; everything else flows out via named emits.
 *
 * Extracted from ScenarioEditor.vue during the Wave 12 refactor — markup
 * preserved verbatim.
 */
-->

<template>
  <div class="editor-header">
    <!-- Left: title + selector -->
    <div class="header-primary">
      <span class="header-title">{{ t('scenarioEditor.title') }}</span>
      <select
        :value="selectedScenarioId"
        @change="onSelectChange"
        class="scenario-select"
      >
        <option :value="null">{{ t('scenarioEditor.selectScenario') }}</option>
        <option
          v-for="scenario in scenarios"
          :key="scenario.id"
          :value="scenario.id"
        >
          {{ scenario.name }} - {{ scenario.title }}
        </option>
      </select>
      <button
        v-if="canCreateScenario"
        @click="emit('create-new')"
        class="btn-icon btn-create"
        :title="t('scenarioEditor.createNew')"
      >
        <i class="fas fa-plus"></i>
      </button>
    </div>

    <!-- Center: context info -->
    <div class="header-context" v-if="currentScenario">
      <span class="org-tag" v-if="currentScenario.organization_id">
        <i class="fas fa-building"></i> {{ scenarioOrgName || '—' }}
      </span>
      <span class="org-tag platform-tag" v-else>
        <i class="fas fa-globe"></i> {{ t('scenarioEditor.platform') }}
        <AdminBadge v-if="isAdmin" icon-only />
      </span>
      <span class="debug-info" v-if="nodeCount > 0">
        {{ nodeCount }}n / {{ edgeCount }}e
      </span>
    </div>

    <!-- Read-only indicator -->
    <span v-if="currentScenario && !canEditScenario" class="readonly-badge">
      <i class="fas fa-lock"></i> {{ t('scenarioEditor.readOnly') }}
    </span>

    <!-- Right: actions -->
    <div class="header-actions">
      <!-- Secondary actions (icon-only) -->
      <template v-if="selectedScenarioId">
        <button
          v-if="canEditScenario"
          @click="emit('import')"
          class="btn-icon"
          :title="t('scenarioEditor.import')"
          :disabled="isImporting"
        >
          <i :class="isImporting ? 'fas fa-spinner fa-spin' : 'fas fa-file-import'"></i>
        </button>
        <button @click="emit('export-json')" class="btn-icon" :title="t('scenarioEditor.exportJSON')">
          <i class="fas fa-file-code"></i>
        </button>
        <button @click="emit('export-killercoda')" class="btn-icon" :title="t('scenarioEditor.exportKillerCoda')">
          <i class="fas fa-file-archive"></i>
        </button>
        <button v-if="canCopyToOrg" @click="emit('copy-to-org')" class="btn-icon" :title="t('scenarioEditor.copyToOrg')">
          <i class="fas fa-copy"></i>
        </button>
        <span class="header-divider"></span>
      </template>

      <!-- Primary actions -->
      <button v-if="canEditScenario" @click="emit('reset')" class="btn-icon" :title="t('scenarioEditor.reset')">
        <i class="fas fa-undo"></i>
      </button>
      <button
        v-if="canEditScenario"
        @click="emit('save')"
        class="btn-save"
        :disabled="!selectedScenarioId && nodeCount === 0"
      >
        <i class="fas fa-save"></i> {{ t('scenarioEditor.save') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import AdminBadge from '../Common/AdminBadge.vue'
import { useTranslations } from '../../composables/useTranslations'

interface Props {
  scenarios: any[]
  selectedScenarioId: string | null
  currentScenario: any | null
  scenarioOrgName: string | null
  canCreateScenario: boolean
  canEditScenario: boolean
  canCopyToOrg: boolean
  isImporting: boolean
  isAdmin: boolean
  nodeCount: number
  edgeCount: number
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:selectedScenarioId', id: string | null): void
  (e: 'select-change'): void
  (e: 'create-new'): void
  (e: 'import'): void
  (e: 'export-json'): void
  (e: 'export-killercoda'): void
  (e: 'copy-to-org'): void
  (e: 'reset'): void
  (e: 'save'): void
}>()

// Re-emit native <select> change as both v-model update + a select-change
// hook so the parent can run side effects (load the scenario) after the
// selected id has settled.
function onSelectChange(e: Event) {
  const target = e.target as HTMLSelectElement
  const value = target.value === '' ? null : target.value
  emit('update:selectedScenarioId', value as string | null)
  emit('select-change')
}

// Header doesn't register translations of its own — the parent ScenarioEditor
// already merges the entire scenarioEditor.* namespace into the global i18n
// instance, and useTranslations() with no messages still gives us a working `t`.
const { t } = useTranslations({ en: {}, fr: {} })
</script>

<style scoped>
.editor-header {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border-light);
  gap: 0.75rem;
  min-height: 3rem;
}

.header-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.header-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-text-primary);
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.scenario-select {
  flex: 1;
  max-width: 320px;
  min-width: 180px;
  padding: 0.35rem 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background);
  color: var(--color-text-primary);
  font-size: 0.8rem;
  cursor: pointer;
  transition: border-color 0.15s;
}

.scenario-select:hover {
  border-color: var(--color-primary);
}

.scenario-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-light);
}

.header-context {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.org-tag {
  font-size: 0.7rem;
  color: var(--color-text-secondary);
  padding: 0.2rem 0.5rem;
  background: var(--color-surface-variant);
  border-radius: 3px;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  white-space: nowrap;
}

.debug-info {
  font-size: 0.65rem;
  color: var(--color-text-secondary);
  opacity: 0.6;
  white-space: nowrap;
}

.readonly-badge {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-warning-text);
  background: var(--color-warning-bg);
  border: 1px solid var(--color-warning-border);
  padding: 0.2rem 0.5rem;
  border-radius: 3px;
  white-space: nowrap;
  flex-shrink: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.header-divider {
  width: 1px;
  height: 1.2rem;
  background: var(--color-border);
  margin: 0 0.25rem;
}

/* Icon buttons */
.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-icon:hover:not(:disabled) {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
  border-color: var(--color-border);
}

.btn-icon:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-icon.btn-create {
  color: var(--color-success);
}

.btn-icon.btn-create:hover {
  background: rgba(40, 167, 69, 0.1);
  border-color: var(--color-success);
}

/* Save button (primary, with label) */
.btn-save {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  border: none;
  border-radius: 4px;
  background: var(--color-primary);
  color: white;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.btn-save:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
