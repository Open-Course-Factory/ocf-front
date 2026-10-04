<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * The editor's right rail: what the health check found, the scenario's
 * settings in plain words, and the classes it is assigned to. Below ~1500px it
 * folds to an icon strip; any icon opens it again.
 */
-->

<template>
  <aside class="ocf-rail" :class="{ 'is-collapsed': collapsed }" data-testid="scenario-rail" :aria-label="t('scenarioEditor.railLabel')">
    <button
      type="button"
      class="ocf-rail-toggle"
      data-testid="rail-toggle"
      :aria-expanded="!collapsed"
      :aria-label="collapsed ? t('scenarioEditor.expandPanel') : t('scenarioEditor.collapsePanel')"
      @click="collapsed = !collapsed"
    >
      <i :class="collapsed ? 'fas fa-angles-left' : 'fas fa-angles-right'" aria-hidden="true"></i>
    </button>

    <div v-if="collapsed" class="ocf-rail-strip">
      <button v-if="healthAvailable" type="button" :title="t('scenarioEditor.railChecks')" @click="collapsed = false">
        <i class="fas fa-stethoscope" :class="statusClass" aria-hidden="true"></i>
      </button>
      <button type="button" :title="t('scenarioEditor.railSettings')" @click="collapsed = false">
        <i class="fas fa-sliders" aria-hidden="true"></i>
      </button>
      <button v-if="canManage" type="button" :title="t('scenarioEditor.railClasses')" @click="collapsed = false">
        <i class="fas fa-users" aria-hidden="true"></i>
      </button>
    </div>

    <div v-else class="ocf-rail-body">
      <section v-if="healthAvailable" class="ocf-rail-section" data-testid="rail-checks">
        <h3 class="ocf-rail-heading"><i class="fas fa-stethoscope" aria-hidden="true"></i> {{ t('scenarioEditor.railChecks') }}</h3>
        <p v-if="!findings.length" class="ocf-rail-finding is-ok">
          <i class="fas fa-circle-check" aria-hidden="true"></i> {{ t('scenarioEditor.noProblems') }}
        </p>
        <p
          v-for="(finding, index) in findings"
          :key="index"
          class="ocf-rail-finding"
          :class="finding.severity === 'blocking' ? 'is-blocking' : 'is-warning'"
          data-testid="rail-finding"
        >
          <i :class="finding.severity === 'blocking' ? 'fas fa-circle-xmark' : 'fas fa-triangle-exclamation'" aria-hidden="true"></i>
          <span>
            <span class="ocf-visually-hidden">{{ finding.severity === 'blocking' ? t('scenarioEditor.blocking') : t('scenarioEditor.warning') }}:</span>
            {{ sentence(finding) }}
          </span>
        </p>
      </section>

      <section class="ocf-rail-section" data-testid="rail-settings">
        <h3 class="ocf-rail-heading">
          <i class="fas fa-sliders" aria-hidden="true"></i> {{ t('scenarioEditor.railSettings') }}
          <button
            v-if="canManage"
            type="button"
            class="ocf-rail-edit"
            data-testid="rail-edit-settings"
            :aria-label="t('scenarioEditor.editSettings')"
            @click="emit('edit-settings')"
          ><i class="fas fa-pen" aria-hidden="true"></i></button>
        </h3>
        <dl class="ocf-rail-settings">
          <template v-for="row in settingRows" :key="row.label">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </template>
        </dl>
      </section>

      <ScenarioClassesPanel v-if="canManage" :scenario="scenario" />
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import ScenarioClassesPanel from './ScenarioClassesPanel.vue'
import { useScenarioEditorI18n } from '../../composables/useScenarioEditorI18n'
import { useScenarioHealthSentence, type ScenarioHealthFinding } from '../../composables/useScenarioHealthSentence'
import type { OutlineStep } from '../../utils/scenarioOutline'

const props = defineProps<{
  scenario: any
  steps: OutlineStep[]
  findings: ScenarioHealthFinding[]
  healthAvailable: boolean
  canManage: boolean
  orgName: string | null
}>()

const emit = defineEmits<{ 'edit-settings': [] }>()

const { t } = useScenarioEditorI18n()
const { sentence } = useScenarioHealthSentence()

// Folded by default on a screen too narrow for three columns.
const collapsed = ref(typeof window !== 'undefined' && window.innerWidth < 1500)

const statusClass = computed(() => {
  if (props.findings.some(f => f.severity === 'blocking')) return 'is-blocking'
  return props.findings.length ? 'is-warning' : 'is-ok'
})

const OS_LABELS: Record<string, string> = {
  deb: 'Debian (apt)',
  rpm: 'RPM (dnf/yum)',
  apk: 'Alpine (apk)',
  pacman: 'Arch (pacman)'
}

function featureList(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw
  if (typeof raw !== 'string' || !raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return raw.split(',').map(f => f.trim()).filter(Boolean)
  }
}

const settingRows = computed(() => {
  const s = props.scenario
  const flagSteps = props.steps.filter(step => step.step_type === 'flag').length
  const features = featureList(s.required_features)
  const rows = [
    { label: t('scenarioEditor.settingSystem'), value: OS_LABELS[s.os_type] || s.os_type || '—' },
    { label: t('scenarioEditor.settingSize'), value: s.instance_type || '—' },
    { label: t('scenarioEditor.settingFeatures'), value: features.length ? features.join(', ') : t('scenarioEditor.none') },
    { label: t('scenarioEditor.settingFlags'), value: flagSteps ? t('scenarioEditor.flagSteps', { count: String(flagSteps) }) : (s.flags_enabled ? t('scenarioEditor.enabled') : t('scenarioEditor.none')) },
    { label: t('scenarioEditor.settingVisibility'), value: s.is_public ? t('scenarioEditor.visibilityPublic') : (props.orgName || t('scenarioEditor.visibilityPrivate')) }
  ]
  // Only once the API carries it: absent is not "root".
  if (s.session_user !== undefined) {
    rows.splice(2, 0, { label: t('scenarioEditor.settingUser'), value: s.session_user ? `uid ${s.session_user}` : 'root' })
  }
  return rows
})
</script>

<style scoped>
.ocf-rail {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  border-left: 1px solid var(--color-border-light);
  background: var(--color-bg-secondary);
}

.ocf-rail-toggle {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  z-index: 1;
  width: 1.75rem;
  height: 1.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  cursor: pointer;
}

.ocf-rail.is-collapsed .ocf-rail-toggle {
  position: static;
  margin: var(--spacing-sm) auto 0;
}

.ocf-rail-strip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) 0;
}

.ocf-rail-strip button {
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: var(--border-radius-sm);
  background: none;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.ocf-rail-strip button:hover {
  background: var(--color-surface-hover);
}

.ocf-rail-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-md);
}

.ocf-rail-finding {
  display: flex;
  gap: var(--spacing-sm);
  align-items: flex-start;
  margin: 0 0 var(--spacing-xs);
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  background: var(--color-surface);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.ocf-rail-finding i {
  margin-top: 0.2rem;
}

.is-ok { color: var(--color-success); }
.is-warning { color: var(--color-warning); }
.is-blocking { color: var(--color-danger); }

.ocf-rail-finding.is-ok,
.ocf-rail-finding.is-warning,
.ocf-rail-finding.is-blocking {
  color: var(--color-text-primary);
}

.ocf-rail-finding.is-ok i { color: var(--color-success); }
.ocf-rail-finding.is-warning i { color: var(--color-warning); }
.ocf-rail-finding.is-blocking i { color: var(--color-danger); }

.ocf-rail-edit {
  margin-left: auto;
  border: none;
  background: none;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.ocf-rail-settings {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--spacing-xs) var(--spacing-md);
  margin: 0;
  font-size: var(--font-size-sm);
}

.ocf-rail-settings dt {
  font-weight: var(--font-weight-normal);
  color: var(--color-text-muted);
}

.ocf-rail-settings dd {
  margin: 0;
  color: var(--color-text-primary);
}

.ocf-visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.ocf-rail button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}
</style>

<!-- Shared with ScenarioClassesPanel; every selector is ocf-rail- prefixed. -->
<style>
.ocf-rail-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.ocf-rail-heading {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin: 0;
  padding-right: 2.25rem;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.ocf-rail-empty {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.ocf-rail-classes {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: var(--font-size-sm);
}

.ocf-rail-classes li {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-xs) 0;
}

.ocf-rail-class-name {
  color: var(--color-text-primary);
}

.ocf-rail-class-meta {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.ocf-rail-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.ocf-rail-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
}

.ocf-rail-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
