<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * One row above the scenario editor: which scenario, where it lives, whether it
 * is ready to play, whether the open step is saved, and what can be done with
 * it. Presentational: the page owns the state, this emits intents.
 *
 * Every indicator sits in a reserved slot, so nothing in the row moves when a
 * status changes.
 */
-->

<template>
  <div class="ocf-editor-header">
    <div class="ocf-header-primary">
      <label class="ocf-visually-hidden" for="scenario-picker">{{ t('scenarioEditor.pickScenario') }}</label>
      <span class="ocf-picker-icon" aria-hidden="true"><i class="fas fa-flask"></i></span>
      <select
        id="scenario-picker"
        class="ocf-scenario-picker"
        data-testid="scenario-picker"
        :value="selectedScenarioId ?? ''"
        @change="onSelectChange"
      >
        <option value="">{{ t('scenarioEditor.selectScenario') }}</option>
        <optgroup v-for="group in scenarioGroups" :key="group.label" :label="group.label">
          <option v-for="scenario in group.scenarios" :key="scenario.id" :value="scenario.id">
            {{ scenario.title || scenario.name }}
          </option>
        </optgroup>
      </select>
      <button
        v-if="canCreateScenario"
        type="button"
        class="btn-icon btn-create"
        data-testid="scenario-create-btn"
        :title="t('scenarioEditor.createNew')"
        :aria-label="t('scenarioEditor.createNew')"
        @click="emit('create-new')"
      >
        <i class="fas fa-plus" aria-hidden="true"></i>
      </button>

      <template v-if="currentScenario">
        <span v-if="currentScenario.organization_id" class="ocf-header-chip">
          <i class="fas fa-building" aria-hidden="true"></i> {{ scenarioOrgName || '—' }}
        </span>
        <span v-else class="ocf-header-chip">
          <i class="fas fa-globe" aria-hidden="true"></i> {{ t('scenarioEditor.platform') }}
          <AdminBadge v-if="isAdmin" icon-only />
        </span>
        <span v-if="healthAvailable" class="ocf-header-chip ocf-status-chip" :class="statusClass" data-testid="scenario-status">
          <i :class="statusIcon" aria-hidden="true"></i> {{ statusLabel }}
        </span>
        <span v-if="!canEditScenario" class="ocf-header-chip readonly-badge">
          <i class="fas fa-lock" aria-hidden="true"></i> {{ t('scenarioEditor.readOnly') }}
        </span>
      </template>
    </div>

    <div class="ocf-header-actions">
      <!-- Reserved: empty while there is no step to save, never collapsed. -->
      <span class="ocf-save-state" :class="`is-${saveState || 'none'}`" data-testid="save-state" aria-live="polite">
        <template v-if="saveState === 'saved'"><i class="fas fa-check" aria-hidden="true"></i> {{ t('scenarioEditor.saved') }}</template>
        <template v-else-if="saveState === 'dirty'"><i class="fas fa-circle" aria-hidden="true"></i> {{ t('scenarioEditor.unsaved') }}</template>
        <template v-else-if="saveState === 'saving'"><i class="fas fa-spinner fa-spin" aria-hidden="true"></i> {{ t('scenarioEditor.saving') }}</template>
      </span>

      <!-- Import / Export stay in place whatever is selected: Export is
           disabled with a reason rather than hidden, so the row never shifts.
           The import and AI controls are the parent's (they need its scopes). -->
      <slot name="import" />
      <ScenarioExportMenu
        :disabled="!currentScenario || !canExport"
        :disabled-reason="currentScenario ? t('scenarioEditor.exportNeedsManager') : t('scenarioEditor.exportNeedsScenario')"
        @export="format => format === 'json' ? emit('export-json') : emit('export-killercoda')"
      />
      <slot name="ai" />

      <div v-if="currentScenario && (canCopyToOrg || canRetire)" ref="actionsMenuRef" class="dropdown-container">
        <button
          type="button"
          class="btn-icon"
          data-testid="scenario-more-actions"
          :title="t('scenarioEditor.moreActions')"
          :aria-label="t('scenarioEditor.moreActions')"
          :aria-expanded="showActionsMenu"
          aria-haspopup="true"
          @click.stop="showActionsMenu = !showActionsMenu"
        >
          <i class="fas fa-ellipsis-h" aria-hidden="true"></i>
        </button>
        <div v-if="showActionsMenu" class="ocf-header-menu" @click.stop>
          <button v-if="canCopyToOrg" class="ocf-header-menu-item" @click="emit('copy-to-org'); showActionsMenu = false">
            <i class="fas fa-copy" aria-hidden="true"></i>
            <span>{{ t('scenarioEditor.copyToOrg') }}</span>
          </button>
          <button
            v-if="canRetire"
            class="ocf-header-menu-item"
            @click="emit('archive'); showActionsMenu = false"
          >
            <i class="fas fa-box-archive" aria-hidden="true"></i>
            <span>{{ t('scenarioEditor.archive') }}</span>
          </button>
          <button
            v-if="canRetire"
            class="ocf-header-menu-item is-danger"
            data-testid="scenario-delete"
            @click="emit('delete'); showActionsMenu = false"
          >
            <i class="fas fa-trash" aria-hidden="true"></i>
            <span>{{ t('scenarioEditor.deleteScenario') }}</span>
          </button>
        </div>
      </div>

      <button
        type="button"
        class="ocf-btn-play"
        data-testid="scenario-play-btn"
        :disabled="!canPreview || isPreviewLoading"
        :title="canPreview ? undefined : (playDisabledReason || t('scenarioEditor.playNeedsSteps'))"
        @click="emit('preview')"
      >
        <i :class="isPreviewLoading ? 'fas fa-spinner fa-spin' : 'fas fa-play'" aria-hidden="true"></i>
        {{ t('scenarioEditor.playAsStudent') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import AdminBadge from '../Common/AdminBadge.vue'
import ScenarioExportMenu from './ScenarioExportMenu.vue'
import { useScenarioEditorI18n } from '../../composables/useScenarioEditorI18n'

interface Props {
  scenarios: any[]
  selectedScenarioId: string | null
  currentScenario: any | null
  scenarioOrgName: string | null
  canCreateScenario: boolean
  canEditScenario: boolean
  canCopyToOrg: boolean
  /** Export reaches further than editing (an org's teachers export colleagues' labs). */
  canExport?: boolean
  /** Archive, restore and delete: the author or an org manager. */
  canRetire?: boolean
  isAdmin: boolean
  canPreview: boolean
  /** Why Play is disabled, when it is not for want of steps. */
  playDisabledReason?: string
  isPreviewLoading: boolean
  healthAvailable?: boolean
  blockingCount?: number
  warningCount?: number
  /** The open step's state; null when no step is open. */
  saveState?: 'saved' | 'dirty' | 'saving' | null
}

const props = withDefaults(defineProps<Props>(), {
  playDisabledReason: '',
  canExport: false,
  canRetire: false,
  healthAvailable: false,
  blockingCount: 0,
  warningCount: 0,
  saveState: null
})

const emit = defineEmits<{
  (e: 'select', id: string | null): void
  (e: 'create-new'): void
  (e: 'export-json'): void
  (e: 'export-killercoda'): void
  (e: 'copy-to-org'): void
  (e: 'archive'): void
  (e: 'delete'): void
  (e: 'preview'): void
}>()

const { t } = useScenarioEditorI18n()

// Scenarios the user may edit first, then the ones they can only read — the
// platform's catalogue apart from anything else they happen to see.
const scenarioGroups = computed(() => {
  const groups = [
    { label: t('scenarioEditor.myScenarios'), scenarios: props.scenarios.filter(s => s.can_manage) },
    { label: t('scenarioEditor.platformScenarios'), scenarios: props.scenarios.filter(s => !s.can_manage && !s.organization_id) },
    { label: t('scenarioEditor.otherScenarios'), scenarios: props.scenarios.filter(s => !s.can_manage && s.organization_id) }
  ]
  return groups.filter(group => group.scenarios.length)
})

const statusClass = computed(() => {
  if (props.blockingCount) return 'is-blocking'
  return props.warningCount ? 'is-warning' : 'is-ok'
})

const statusIcon = computed(() => ({
  'is-blocking': 'fas fa-circle-xmark',
  'is-warning': 'fas fa-triangle-exclamation',
  'is-ok': 'fas fa-circle-check'
})[statusClass.value])

const statusLabel = computed(() => {
  if (props.blockingCount) return t('scenarioEditor.blockingCount', { count: String(props.blockingCount) })
  if (props.warningCount) return t('scenarioEditor.warningCount', { count: String(props.warningCount) })
  return t('scenarioEditor.readyToPlay')
})

function onSelectChange(event: Event) {
  const select = event.target as HTMLSelectElement
  const value = select.value || null
  // The page may refuse (unsaved edits): show the selection it keeps, not the click.
  select.value = props.selectedScenarioId ?? ''
  emit('select', value)
}

const showActionsMenu = ref(false)
const actionsMenuRef = ref<HTMLElement | null>(null)

const handleDocumentClick = (event: MouseEvent) => {
  if (showActionsMenu.value && actionsMenuRef.value && !actionsMenuRef.value.contains(event.target as Node)) {
    showActionsMenu.value = false
  }
}

onMounted(() => document.addEventListener('click', handleDocumentClick))
onUnmounted(() => document.removeEventListener('click', handleDocumentClick))
</script>

<style scoped>
.ocf-editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border-light);
  min-height: 3.5rem;
}

.ocf-header-primary,
.ocf-header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-width: 0;
}

/* On a narrow screen the chips go to a second line rather than under the actions. */
.ocf-header-primary {
  flex: 1 1 auto;
  flex-wrap: wrap;
}

.ocf-header-actions {
  flex-shrink: 0;
}

.ocf-picker-icon {
  color: var(--color-success);
}

.ocf-scenario-picker {
  min-width: 14rem;
  max-width: 26rem;
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  background: var(--color-background);
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  text-overflow: ellipsis;
  cursor: pointer;
}

.ocf-scenario-picker:hover {
  border-color: var(--color-primary);
}

.ocf-scenario-picker:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}

.ocf-header-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.55rem;
  border-radius: var(--border-radius-full);
  background: var(--color-surface-variant);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  white-space: nowrap;
}

.ocf-status-chip.is-ok {
  background: var(--color-success-bg);
  color: var(--color-success-text);
}

.ocf-status-chip.is-warning {
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
}

.ocf-status-chip.is-blocking {
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.readonly-badge {
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
}

/* Reserved width: the longest of the three states fits, so the buttons to
   its right never move when it changes. */
.ocf-save-state {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.3rem;
  min-width: 11rem;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  white-space: nowrap;
}

.ocf-save-state.is-dirty {
  color: var(--color-warning-text);
}

.ocf-save-state.is-dirty i {
  font-size: 0.5rem;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid transparent;
  border-radius: var(--border-radius-sm);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.btn-icon:hover:not(:disabled) {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
  border-color: var(--color-border);
}

.btn-icon.btn-create {
  color: var(--color-success);
}

.ocf-btn-play {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.9rem;
  border: none;
  border-radius: var(--border-radius-md);
  background: var(--color-primary);
  color: var(--color-white);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
  cursor: pointer;
}

.ocf-btn-play:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.ocf-btn-play:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ocf-editor-header button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}

.dropdown-container {
  position: relative;
}

.ocf-header-menu {
  position: absolute;
  top: calc(100% + 0.25rem);
  right: 0;
  min-width: 220px;
  padding: 0.25rem 0;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-index-dropdown);
}

.ocf-header-menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.5rem 0.85rem;
  background: none;
  border: none;
  text-align: left;
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.ocf-header-menu-item.is-danger {
  color: var(--color-danger);
}

.ocf-header-menu-item:hover {
  background: var(--color-bg-secondary);
  color: var(--color-primary);
}

.ocf-visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

/* Narrower still, the actions take a line of their own. */
@media (max-width: 1100px) {
  .ocf-editor-header {
    flex-wrap: wrap;
  }
}

/* Narrow screens: button labels give way to their icons. Each keeps its name
   in aria-label and its explanation in a title tooltip. */
@media (max-width: 1500px) {
  .ocf-header-actions :deep(.ocf-btn-outline span) {
    display: none;
  }

  .ocf-scenario-picker {
    min-width: 10rem;
    max-width: 18rem;
  }
}
</style>
