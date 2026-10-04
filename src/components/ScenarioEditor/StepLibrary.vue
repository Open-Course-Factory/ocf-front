<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * The step library: every scenario the user can see, with its steps, to reuse
 * one or several in the scenario being edited. Search, expand, preview a step
 * as the learner reads it, tick steps and insert them after the selected one —
 * or drag them onto the outline.
 *
 * Steps come from the scenario list for the user's own scenarios, and from
 * the read-only endpoint for the others, fetched when one is opened. The copy
 * itself happens server-side. Emits the ids to copy.
 */
-->

<template>
  <div class="ocf-library" data-testid="step-library">
    <input
      v-model="query"
      type="search"
      class="ocf-library-search"
      data-testid="step-library-search"
      :placeholder="t('scenarioEditor.librarySearch')"
      :aria-label="t('scenarioEditor.librarySearch')"
    />

    <!-- Up top: the bottom-right corner belongs to the app's feedback button. -->
    <div class="ocf-library-actions">
      <span class="ocf-library-picked">{{ t('scenarioEditor.libraryPicked', { count: String(picked.length) }) }}</span>
      <button
        type="button"
        class="ocf-library-insert"
        data-testid="step-library-insert"
        :disabled="!picked.length || busy"
        @click="emit('insert', [...picked])"
      >
        <i :class="busy ? 'fas fa-spinner fa-spin' : 'fas fa-arrow-turn-down'" aria-hidden="true"></i>
        {{ insertAfter ? t('scenarioEditor.libraryInsertAfter', { n: String(insertAfter) }) : t('scenarioEditor.libraryInsertFirst') }}
      </button>
    </div>

    <!-- Reserved line, so the list below never moves when it appears. -->
    <p class="ocf-library-notice" :class="{ 'is-hidden': !picked.length }" data-testid="step-library-notice">
      <i class="fas fa-triangle-exclamation" aria-hidden="true"></i> {{ t('scenarioEditor.libraryDependsOnSetup') }}
    </p>

    <div class="ocf-library-list">
      <p v-if="!groups.length" class="ocf-library-empty">{{ t('scenarioEditor.libraryEmpty') }}</p>
      <section v-for="group in groups" :key="group.key" class="ocf-library-group">
        <h4 class="ocf-library-group-title">{{ group.label }}</h4>
        <div v-for="scenario in group.scenarios" :key="scenario.id" class="ocf-library-scenario">
          <button
            type="button"
            class="ocf-library-scenario-toggle"
            :aria-expanded="isOpen(scenario.id)"
            :data-testid="`step-library-scenario-${scenario.id}`"
            @click="toggle(scenario.id)"
          >
            <i :class="isOpen(scenario.id) ? 'fas fa-chevron-down' : 'fas fa-chevron-right'" aria-hidden="true"></i>
            <span class="ocf-library-scenario-title">{{ scenario.title || scenario.name }}</span>
            <span class="ocf-library-count">{{ scenario.steps ? scenario.steps.length : '' }}</span>
          </button>
          <p v-if="isOpen(scenario.id) && loading.has(scenario.id)" class="ocf-library-empty">
            <i class="fas fa-spinner fa-spin" aria-hidden="true"></i>
          </p>
          <ul v-else-if="isOpen(scenario.id) && scenario.steps" class="ocf-library-steps">
            <li
              v-for="step in scenario.steps"
              :key="step.id"
              class="ocf-library-step"
              :class="{ 'is-previewed': previewed?.id === step.id }"
              draggable="true"
              @dragstart="onDragStart($event, step.id)"
            >
              <input
                type="checkbox"
                :checked="picked.includes(step.id)"
                :aria-label="t('scenarioEditor.libraryPick', { title: step.title })"
                :data-testid="`step-library-pick-${step.id}`"
                @change="togglePick(step.id)"
              />
              <span class="ocf-step-type-icon ocf-library-type" :class="`is-${step.step_type}`" aria-hidden="true">
                <i :class="TYPE_ICONS[step.step_type]"></i>
              </span>
              <button type="button" class="ocf-library-step-title" :data-testid="`step-library-preview-${step.id}`" @click="previewed = step">
                {{ step.title || t('scenarioEditor.untitledStep') }}
              </button>
            </li>
          </ul>
        </div>
      </section>
    </div>

    <!-- Reserved: the preview keeps its place, filled or not. -->
    <div class="ocf-library-preview">
      <StepLearnerPreview v-if="previewed" :title="previewed.title || ''" :text="previewed.text_content || ''" :translations="previewed.translations" />
      <p v-else class="ocf-library-empty">{{ t('scenarioEditor.libraryPreviewHint') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import StepLearnerPreview from './StepLearnerPreview.vue'
import { useScenarioEditorI18n } from '../../composables/useScenarioEditorI18n'
import { LIBRARY_DRAG_TYPE, TYPE_ICONS, toOutlineSteps, type OutlineStep } from '../../utils/scenarioOutline'
import { scenarioStepService } from '../../services/domain/scenario'

const props = defineProps<{
  scenarios: any[]
  // The scenario being edited: its own steps are not offered back to it.
  currentScenarioId: string
  // The 1-based step the copies go after; 0 puts them first.
  insertAfter: number
  busy: boolean
}>()

const emit = defineEmits<{ insert: [stepIds: string[]] }>()

const { t } = useScenarioEditorI18n()

const query = ref('')
const open = ref(new Set<string>())
const picked = ref<string[]>([])
const previewed = ref<OutlineStep | null>(null)

// A finished insert empties the selection; the page bumps `busy` around it.
watch(() => props.busy, (now, before) => { if (before && !now) picked.value = [] })

// Outlines fetched on opening a scenario whose steps the list did not carry.
const loaded = ref<Record<string, OutlineStep[]>>({})
const loading = ref(new Set<string>())

function knownSteps(scenario: any): OutlineStep[] | null {
  if (loaded.value[scenario.id]) return loaded.value[scenario.id]
  return Array.isArray(scenario.steps) && scenario.steps.length ? toOutlineSteps(scenario.steps) : null
}

const groups = computed(() => {
  const q = query.value.trim().toLowerCase()
  const matches = (text?: string) => !!text && text.toLowerCase().includes(q)
  const usable = props.scenarios
    .filter(s => s.id !== props.currentScenarioId)
    .map(s => {
      const steps = knownSteps(s)
      if (!q || matches(s.title) || matches(s.name)) return { ...s, steps }
      return { ...s, steps: steps ? steps.filter(step => matches(step.title)) : null }
    })
    // Searching keeps a scenario whose title or known steps match; a scenario
    // known to be empty has nothing to offer.
    .filter(s => (s.steps ? s.steps.length > 0 : !q || matches(s.title) || matches(s.name)))
  return [
    { key: 'mine', label: t('scenarioEditor.myScenarios'), scenarios: usable.filter(s => s.can_manage) },
    { key: 'org', label: t('scenarioEditor.libraryOrganization'), scenarios: usable.filter(s => !s.can_manage && s.organization_id) },
    { key: 'platform', label: t('scenarioEditor.platformScenarios'), scenarios: usable.filter(s => !s.can_manage && !s.organization_id) }
  ].filter(g => g.scenarios.length)
})

// A search opens what it found among the steps it knows.
const isOpen = (id: string) => open.value.has(id) || (!!query.value.trim() && !!loaded.value[id])

async function toggle(id: string) {
  const next = new Set(open.value)
  if (next.has(id)) {
    next.delete(id)
    open.value = next
    return
  }
  next.add(id)
  open.value = next
  const scenario = props.scenarios.find(s => s.id === id)
  if (!scenario || knownSteps(scenario)) return
  loading.value = new Set(loading.value).add(id)
  try {
    loaded.value = { ...loaded.value, [id]: toOutlineSteps((await scenarioStepService.loadReadOnly(id)).steps) }
  } catch {
    loaded.value = { ...loaded.value, [id]: [] }
  } finally {
    const done = new Set(loading.value)
    done.delete(id)
    loading.value = done
  }
}

function togglePick(id: string) {
  picked.value = picked.value.includes(id) ? picked.value.filter(p => p !== id) : [...picked.value, id]
}

// Dragging a ticked step carries every ticked step; an unticked one, itself.
function onDragStart(event: DragEvent, id: string) {
  if (!event.dataTransfer) return
  const ids = picked.value.includes(id) ? picked.value : [id]
  event.dataTransfer.effectAllowed = 'copy'
  event.dataTransfer.setData(LIBRARY_DRAG_TYPE, JSON.stringify(ids))
}
</script>

<style scoped>
.ocf-library {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  min-height: 0;
  height: 100%;
}

.ocf-library-search {
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  background: var(--color-background);
  color: var(--color-text-primary);
}

.ocf-library-list {
  flex: 1;
  min-height: 8rem;
  overflow-y: auto;
}

.ocf-library-group-title {
  margin: var(--spacing-sm) 0 var(--spacing-xs);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);
}

.ocf-library-scenario-toggle {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  width: 100%;
  padding: var(--spacing-xs);
  border: none;
  border-radius: var(--border-radius-sm);
  background: none;
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  text-align: left;
  cursor: pointer;
}

.ocf-library-scenario-toggle:hover {
  background: var(--color-surface-hover);
}

.ocf-library-scenario-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ocf-library-count,
.ocf-library-picked {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.ocf-library-steps {
  list-style: none;
  margin: 0;
  padding: 0 0 0 var(--spacing-md);
}

.ocf-library-step {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 2px var(--spacing-xs);
  border-radius: var(--border-radius-sm);
  cursor: grab;
}

.ocf-library-step.is-previewed {
  background: var(--color-primary-bg);
}

.ocf-library-type {
  width: 1.25rem;
  height: 1.25rem;
  font-size: 0.65rem;
}

.ocf-library-step-title {
  flex: 1;
  min-width: 0;
  padding: 0;
  border: none;
  background: none;
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.ocf-library-preview {
  height: 12rem;
  overflow-y: auto;
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-sm);
  background: var(--color-surface);
  font-size: var(--font-size-sm);
}

.ocf-library-notice {
  margin: 0;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
  font-size: var(--font-size-xs);
}

.ocf-library-notice.is-hidden {
  visibility: hidden;
}

.ocf-library-empty {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.ocf-library-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
}

.ocf-library-insert {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border: none;
  border-radius: var(--border-radius-md);
  background: var(--color-primary);
  color: var(--color-white);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.ocf-library-insert:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ocf-library button:focus-visible,
.ocf-library input:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}
</style>
