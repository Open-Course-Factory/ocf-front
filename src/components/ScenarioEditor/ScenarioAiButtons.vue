<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * "Create with AI" and "Improve with AI", next to Import. Both stay in place
 * whatever is selected: Improve is disabled with a reason rather than hidden,
 * so the header row never shifts. Emits `imported` with the created or
 * updated scenario.
 */
-->

<template>
  <button
    type="button"
    class="ocf-btn-outline"
    data-testid="scenario-ai-create-btn"
    :title="t('scenarioAi.createTitleAttr')"
    @click="mode = 'create'"
  >
    <i class="fas fa-wand-magic-sparkles" aria-hidden="true"></i>
    <span>{{ t('scenarioAi.create') }}</span>
  </button>
  <button
    v-if="!createOnly"
    type="button"
    class="ocf-btn-outline"
    data-testid="scenario-ai-improve-btn"
    :disabled="!!improveDisabledReason"
    :title="improveDisabledReason || t('scenarioAi.improveTitleAttr')"
    @click="mode = 'improve'"
  >
    <i class="fas fa-pen-nib" aria-hidden="true"></i>
    <span>{{ t('scenarioAi.improve') }}</span>
  </button>

  <ScenarioAiModal
    :visible="mode !== null"
    :mode="mode || 'create'"
    :scenario="scenario"
    @close="mode = null"
    @imported="onImported"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ScenarioAiModal from './ScenarioAiModal.vue'
import { useScenarioAiTranslations } from '../../composables/useScenarioAiTranslations'
import { useScenarioCreateScopes } from '../../composables/useScenarioCreateScopes'

const props = defineProps<{
  scenario: { id: string; title: string; organization_id?: string | null } | null
  /** The scenario's `can_manage` verdict, as the editor computes it. */
  canManage: boolean
  // The editor's empty state offers creating only: there is nothing to improve.
  createOnly?: boolean
}>()

const emit = defineEmits<{
  imported: [scenario: { id: string }, mode: 'create' | 'improve']
}>()

const { t } = useScenarioAiTranslations()
const { scopeKeyForScenario } = useScenarioCreateScopes()

const mode = ref<'create' | 'improve' | null>(null)

const improveDisabledReason = computed(() => {
  if (!props.scenario) return t('scenarioAi.improveNeedsScenario')
  if (!props.canManage || !scopeKeyForScenario(props.scenario)) return t('scenarioAi.improveNeedsManager')
  return ''
})

function onImported(scenario: { id: string }) {
  const done = mode.value || 'create'
  mode.value = null
  emit('imported', scenario, done)
}
</script>
