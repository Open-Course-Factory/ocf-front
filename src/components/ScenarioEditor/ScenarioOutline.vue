<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * The scenario's steps as what they are: a numbered sequence. Select a step to
 * edit it beside the list; drag, or use the move buttons / Alt+arrows, to
 * reorder; insert a step between two others or add one at the end.
 *
 * Presentational: the page owns the list and the persistence, this emits
 * intents with list positions.
 */
-->

<template>
  <nav class="ocf-outline" :aria-label="t('scenarioEditor.outlineLabel')">
    <button
      type="button"
      class="ocf-outline-card"
      data-testid="outline-scenario-card"
      :title="canEditSettings ? t('scenarioEditor.editSettings') : t('scenarioEditor.viewSettings')"
      @click="emit('edit-settings')"
    >
      <span class="ocf-outline-card-title">{{ scenario.title || scenario.name }}</span>
      <span class="ocf-outline-chips">
        <span v-if="scenario.difficulty" class="ocf-chip">{{ difficultyLabel }}</span>
        <span v-if="scenario.estimated_time_minutes" class="ocf-chip">{{ durationLabel }}</span>
        <span v-if="scenario.instance_type" class="ocf-chip">{{ t('scenarioEditor.sizeChip', { size: scenario.instance_type }) }}</span>
        <span v-if="localeCodes.length" class="ocf-chip">{{ localeCodes.join(' · ') }}</span>
      </span>
    </button>

    <div class="ocf-outline-meta">
      <span v-if="editable || steps.length">{{ t('scenarioEditor.stepCount', { count: String(steps.length) }) }}</span>
      <span v-else data-testid="outline-steps-hidden">{{ t('scenarioEditor.stepsAfterDuplicate') }}</span>
      <span v-if="editable && steps.length > 1"><i class="fas fa-grip-lines" aria-hidden="true"></i> {{ t('scenarioEditor.dragToReorder') }}</span>
    </div>

    <ol class="ocf-outline-list" data-testid="outline-list" @dragleave.self="dropIndex = null">
      <li
        v-for="(step, index) in steps"
        :key="step.key"
        class="ocf-outline-item"
        :class="{
          'is-selected': step.key === selectedKey,
          'is-dragging': dragIndex === index,
          'is-drop-before': dropIndex === index && dragIndex !== index
        }"
        :draggable="editable"
        :data-testid="`outline-step-${index}`"
        @dragstart="onDragStart($event, index)"
        @dragover.prevent="onDragOver($event, index)"
        @drop.prevent="onDrop($event, index)"
        @dragend="resetDrag"
      >
        <!-- Overlay on the gap above the row: hovering reveals it, nothing moves. -->
        <button
          v-if="editable"
          type="button"
          class="ocf-outline-insert"
          :data-testid="`outline-insert-${index}`"
          :aria-label="t('scenarioEditor.insertStepAt', { n: String(index + 1) })"
          @click="openPicker(index)"
        >
          <i class="fas fa-plus" aria-hidden="true"></i>
        </button>

        <button
          type="button"
          class="ocf-outline-row"
          :aria-current="step.key === selectedKey ? 'step' : undefined"
          @click="emit('select', step.key)"
          @keydown.alt.up.prevent="move(index, index - 1)"
          @keydown.alt.down.prevent="move(index, index + 1)"
        >
          <span class="ocf-outline-number">{{ index + 1 }}</span>
          <span class="ocf-step-type-icon ocf-outline-type" :class="`is-${step.step_type}`" :title="typeLabel(step.step_type)">
            <i :class="TYPE_ICONS[step.step_type]" aria-hidden="true"></i>
          </span>
          <span class="ocf-outline-title">{{ step.title || t('scenarioEditor.untitledStep') }}</span>
          <span class="ocf-outline-indicators">
            <span v-if="!step.id" class="ocf-outline-draft">{{ t('scenarioEditor.draft') }}</span>
            <i v-if="step.hint_content" class="fas fa-lightbulb" :title="t('scenarioEditor.hasHints')" aria-hidden="true"></i>
            <i v-if="step.step_type === 'flag'" class="fas fa-key" :title="t('scenarioEditor.hasFlag')" aria-hidden="true"></i>
            <span v-if="step.step_type === 'quiz' && step.questions?.length" class="ocf-outline-qcount">
              {{ t('scenarioEditor.questionCount', { count: String(step.questions.length) }) }}
            </span>
            <span
              v-if="step.id && translationStates[step.id] && translationStates[step.id] !== 'translated'"
              class="ocf-outline-translation"
              :class="`is-${translationStates[step.id]}`"
              :title="t(`scenarioEditor.translation_${translationStates[step.id]}`)"
            ></span>
          </span>
        </button>

        <span v-if="editable" class="ocf-outline-move">
          <button
            type="button"
            :disabled="index === 0"
            :aria-label="t('scenarioEditor.moveUp', { title: step.title || String(index + 1) })"
            :data-testid="`outline-move-up-${index}`"
            @click="move(index, index - 1)"
          ><i class="fas fa-chevron-up" aria-hidden="true"></i></button>
          <button
            type="button"
            :disabled="index === steps.length - 1"
            :aria-label="t('scenarioEditor.moveDown', { title: step.title || String(index + 1) })"
            :data-testid="`outline-move-down-${index}`"
            @click="move(index, index + 1)"
          ><i class="fas fa-chevron-down" aria-hidden="true"></i></button>
        </span>

        <StepTypePicker v-if="pickerIndex === index" class="ocf-outline-picker" @pick="pick" @close="pickerIndex = null" />
      </li>
    </ol>

    <div
      v-if="editable"
      class="ocf-outline-add"
      :class="{ 'is-drop-target': dropIndex === steps.length }"
      @dragover.prevent="onDragOver($event, steps.length)"
      @dragleave="dropIndex = null"
      @drop.prevent="onDrop($event, steps.length)"
    >
      <button type="button" class="ocf-outline-add-btn" data-testid="outline-add-step" @click="openPicker(steps.length)">
        <i class="fas fa-plus" aria-hidden="true"></i> {{ t('scenarioEditor.addStep') }}
      </button>
      <StepTypePicker v-if="pickerIndex === steps.length" class="ocf-outline-picker" @pick="pick" @close="pickerIndex = null" />
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useScenarioEditorI18n } from '../../composables/useScenarioEditorI18n'
import { LIBRARY_DRAG_TYPE, TYPE_ICONS, type OutlineStep, type StepType } from '../../utils/scenarioOutline'
import StepTypePicker from './StepTypePicker.vue'

const props = withDefaults(defineProps<{
  scenario: any
  steps: OutlineStep[]
  selectedKey: string | null
  editable: boolean
  canEditSettings: boolean
  translationStates?: Record<string, string>
}>(), {
  translationStates: () => ({})
})

const emit = defineEmits<{
  select: [key: string]
  move: [from: number, to: number]
  insert: [index: number, type: StepType]
  // Steps dragged in from the step library, to copy at `index`.
  'insert-copies': [index: number, stepIds: string[]]
  'edit-settings': []
}>()

const { t } = useScenarioEditorI18n()

const difficultyLabel = computed(() => t(`scenarioEditor.${props.scenario.difficulty}`))

const durationLabel = computed(() => {
  const minutes = Number(props.scenario.estimated_time_minutes) || 0
  const hours = Math.floor(minutes / 60)
  if (!hours) return `${minutes} min`
  return minutes % 60 ? `${hours} h ${String(minutes % 60).padStart(2, '0')}` : `${hours} h`
})

const localeCodes = computed<string[]>(() => {
  const raw = props.scenario.locales
  try {
    const list = typeof raw === 'string' ? (raw ? JSON.parse(raw) : []) : (raw || [])
    return Array.isArray(list) ? list.map((code: string) => code.toUpperCase()) : []
  } catch {
    return []
  }
})

function typeLabel(type: StepType): string {
  return t(`scenarioEditor.stepType_${type}`)
}

function move(from: number, to: number) {
  if (to < 0 || to >= props.steps.length) return
  emit('move', from, to)
}

// Insert picker: the index the new step will take.
const pickerIndex = ref<number | null>(null)

function openPicker(index: number) {
  pickerIndex.value = pickerIndex.value === index ? null : index
}

function pick(type: StepType) {
  if (pickerIndex.value !== null) emit('insert', pickerIndex.value, type)
  pickerIndex.value = null
}

// Native drag and drop: dropping on a row puts the dragged step at that row's place.
const dragIndex = ref<number | null>(null)
const dropIndex = ref<number | null>(null)

function onDragStart(event: DragEvent, index: number) {
  if (!props.editable || !event.dataTransfer) return
  dragIndex.value = index
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/x-ocf-step-index', String(index))
}

const fromLibrary = (event: DragEvent) => !!event.dataTransfer?.types.includes(LIBRARY_DRAG_TYPE)

function onDragOver(event: DragEvent, index: number) {
  if (dragIndex.value !== null || (props.editable && fromLibrary(event))) dropIndex.value = index
}

function onDrop(event: DragEvent, index: number) {
  const from = dragIndex.value
  resetDrag()
  if (from !== null) {
    if (from !== index && index < props.steps.length) emit('move', from, index)
    return
  }
  if (!props.editable || !fromLibrary(event)) return
  try {
    const ids = JSON.parse(event.dataTransfer!.getData(LIBRARY_DRAG_TYPE))
    if (Array.isArray(ids) && ids.length) emit('insert-copies', index, ids)
  } catch {
    // Not a library drag after all: nothing to insert.
  }
}

function resetDrag() {
  dragIndex.value = null
  dropIndex.value = null
}
</script>

<style scoped>
.ocf-outline {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  min-height: 0;
}

.ocf-outline-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  text-align: left;
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  background: var(--color-surface);
  color: var(--color-text-primary);
  cursor: pointer;
}


.ocf-outline-card:hover {
  border-color: var(--color-primary);
}

.ocf-outline-card-title {
  font-weight: var(--font-weight-semibold);
}

.ocf-outline-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.ocf-chip {
  padding: 0.1rem 0.5rem;
  border-radius: var(--border-radius-full);
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.ocf-outline-meta {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  padding: 0 var(--spacing-xs);
}

.ocf-outline-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.ocf-outline-item {
  position: relative;
  display: flex;
  align-items: center;
  border-radius: var(--border-radius-sm);
  border-left: 3px solid transparent;
}

.ocf-outline-item.is-selected {
  background: var(--color-primary-bg);
  border-left-color: var(--color-primary);
}

.ocf-outline-item.is-dragging {
  opacity: 0.5;
}

.ocf-outline-item.is-drop-before {
  box-shadow: inset 0 2px 0 var(--color-primary);
}

.ocf-outline-row {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 0.45rem var(--spacing-xs);
  border: none;
  background: none;
  color: var(--color-text-primary);
  text-align: left;
  cursor: pointer;
  font-size: var(--font-size-sm);
}

.ocf-outline-item:not(.is-selected):hover {
  background: var(--color-surface-hover);
}

.ocf-outline-number {
  width: 1.5rem;
  flex-shrink: 0;
  text-align: right;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.ocf-outline-type {
  width: 1.5rem;
  height: 1.5rem;
  font-size: 0.75rem;
}


.ocf-outline-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Reserved width, so an indicator appearing never pushes the title. */
.ocf-outline-indicators {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.3rem;
  min-width: 2.5rem;
  flex-shrink: 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.ocf-outline-draft {
  font-style: italic;
}

.ocf-outline-translation {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--color-text-muted);
}

.ocf-outline-translation.is-stale {
  background: var(--color-warning);
}

/* Move buttons sit over the indicators' right edge only while the row is
   hovered or focused: always laid out, never displacing anything. */
.ocf-outline-move {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 2px;
  opacity: 0;
  pointer-events: none;
  background: var(--color-surface);
  border-radius: var(--border-radius-sm);
}

.ocf-outline-item:hover .ocf-outline-move,
.ocf-outline-item:focus-within .ocf-outline-move {
  opacity: 1;
  pointer-events: auto;
}

.ocf-outline-move button {
  width: 1.5rem;
  height: 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 0.7rem;
  cursor: pointer;
}

.ocf-outline-move button:disabled {
  opacity: 0.4;
  cursor: default;
}

/* The insert target straddles the gap above the row, drawn over it. */
.ocf-outline-insert {
  position: absolute;
  left: 50%;
  top: 0;
  transform: translate(-50%, -50%);
  z-index: 2;
  width: 1.25rem;
  height: 1.25rem;
  border: 1px solid var(--color-primary);
  border-radius: 50%;
  background: var(--color-surface);
  color: var(--color-primary);
  font-size: 0.6rem;
  opacity: 0;
  cursor: pointer;
}

.ocf-outline-item:hover .ocf-outline-insert,
.ocf-outline-insert:focus-visible {
  opacity: 1;
}

.ocf-outline-add {
  position: relative;
}

.ocf-outline-add-btn {
  width: 100%;
  padding: var(--spacing-sm);
  border: 1px dashed var(--color-border);
  border-radius: var(--border-radius-md);
  background: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: var(--font-size-sm);
}

.ocf-outline-add.is-drop-target .ocf-outline-add-btn {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
}

.ocf-outline-add-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.ocf-outline-picker {
  position: absolute;
  left: 2rem;
  top: 0.75rem;
  z-index: var(--z-index-dropdown);
}

.ocf-outline-add .ocf-outline-picker {
  top: calc(100% + 4px);
}

.ocf-outline button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}
</style>
