<template>
  <div class="scenario-step-list-panel">
    <div class="panel-header">
      <h3>{{ t('stepList.title') }}</h3>
      <button @click="refreshScenarios" class="btn-refresh" :disabled="isLoading">
        <span class="refresh-icon">🔄</span>
      </button>
    </div>

    <div class="panel-content">
      <div v-if="isLoading" class="loading-state">
        <span class="loading-spinner">⏳</span>
        <p>{{ t('stepList.loading') }}</p>
      </div>

      <div v-else-if="scenarios.length === 0" class="empty-state">
        <span class="empty-icon">📭</span>
        <p>{{ t('stepList.noScenarios') }}</p>
      </div>

      <div v-else class="tree-container">
        <div
          v-for="scenario in scenarios"
          :key="scenario.id"
          class="scenario-item"
        >
          <div
            class="scenario-header"
            @click="toggleScenario(scenario.id)"
          >
            <span class="expand-icon">{{ expandedScenarios[scenario.id] ? '▼' : '▶' }}</span>
            <span class="scenario-icon">🧪</span>
            <span class="scenario-name">{{ scenario.title || scenario.name }}</span>
            <span v-if="scenario.difficulty" class="difficulty-badge" :class="`difficulty-${scenario.difficulty}`">
              {{ difficultyLabel(scenario.difficulty) }}
            </span>
          </div>

          <div v-if="expandedScenarios[scenario.id]" class="steps-list">
            <div
              v-for="step in getOrderedSteps(scenario)"
              :key="step.id"
              class="step-item"
              draggable="true"
              @dragstart="handleStepDragStart($event, step, scenario)"
            >
              <span class="step-order">{{ step.order || '?' }}</span>
              <span class="step-title">{{ step.title }}</span>
              <div class="step-badges">
                <span v-if="step.verify_script || step.verify_script_id" class="step-badge badge-verify" title="Verify">✓</span>
                <span v-if="step.has_flag" class="step-badge badge-flag" title="Flag">🚩</span>
                <span v-if="step.hint_content || step.hint_file_id" class="step-badge badge-hint" title="Hint">💡</span>
              </div>
            </div>
            <div v-if="getOrderedSteps(scenario).length === 0" class="no-steps">
              {{ t('stepList.noSteps') }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useScenariosStore } from '../../stores/scenarios'
import { useTranslations } from '../../composables/useTranslations'
import { useDifficultyLabel } from '../../composables/useDifficultyLabel'

const { t } = useTranslations({
  en: {
    stepList: {
      title: 'Scenarios & Steps',
      loading: 'Loading scenarios...',
      noScenarios: 'No scenarios available',
      noSteps: 'No steps in this scenario',
      refresh: 'Refresh'
    }
  },
  fr: {
    stepList: {
      title: 'Scénarios & Étapes',
      loading: 'Chargement des scénarios...',
      noScenarios: 'Aucun scénario disponible',
      noSteps: 'Aucune étape dans ce scénario',
      refresh: 'Actualiser'
    }
  }
})

const difficultyLabel = useDifficultyLabel()

interface Props {
  scenarios?: any[]
}

const props = defineProps<Props>()

const scenariosStore = useScenariosStore()
const isLoading = ref(false)
const expandedScenarios = reactive<Record<string, boolean>>({})

const scenarios = computed(() => {
  return props.scenarios || scenariosStore.entities
})

onMounted(async () => {
  if (!props.scenarios && scenariosStore.entities.length === 0) {
    await refreshScenarios()
  }
})

const refreshScenarios = async () => {
  isLoading.value = true
  try {
    await scenariosStore.loadEntities('/scenarios?include=scenarioSteps')
  } finally {
    isLoading.value = false
  }
}

const toggleScenario = (scenarioId: string) => {
  expandedScenarios[scenarioId] = !expandedScenarios[scenarioId]
}

const getOrderedSteps = (scenario: any): any[] => {
  const steps = scenario.scenario_steps || scenario.scenarioSteps || scenario.steps || []
  return [...steps].sort((a, b) => (a.order || 0) - (b.order || 0))
}

const handleStepDragStart = (event: DragEvent, step: any, scenario: any) => {
  if (!event.dataTransfer) return

  event.dataTransfer.effectAllowed = 'copy'
  event.dataTransfer.setData('application/vueflow', JSON.stringify({
    type: 'step',
    entityId: step.id,
    label: step.title,
    isNewNode: false,
    scenarioId: scenario.id,
    ...step
  }))
}

defineExpose({ refreshScenarios })
</script>

<style scoped>
.scenario-step-list-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-surface);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.panel-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.btn-refresh {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-refresh:hover:not(:disabled) {
  background: var(--color-surface-hover);
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-icon {
  font-size: 1.25rem;
  display: inline-block;
}

.btn-refresh:not(:disabled):hover .refresh-icon {
  animation: spin 0.6s linear;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
  color: var(--color-text-secondary);
}

.loading-spinner,
.empty-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.loading-state p,
.empty-state p {
  margin: 0;
  font-size: 0.875rem;
}

.tree-container {
  padding: 0.5rem 0;
}

.scenario-item {
  border-bottom: 1px solid var(--color-border);
}

.scenario-item:last-child {
  border-bottom: none;
}

.scenario-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  cursor: pointer;
  transition: background 0.15s;
  user-select: none;
}

.scenario-header:hover {
  background: var(--color-surface-hover);
}

.expand-icon {
  font-size: 0.6rem;
  color: var(--color-text-secondary);
  width: 0.75rem;
  flex-shrink: 0;
}

.scenario-icon {
  font-size: 0.9rem;
  flex-shrink: 0;
}

.scenario-name {
  flex: 1;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.difficulty-badge {
  font-size: 0.55rem;
  font-weight: 600;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  text-transform: capitalize;
  flex-shrink: 0;
}

.difficulty-beginner {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.difficulty-intermediate {
  background: var(--color-warning-bg);
  color: var(--color-orange);
}

.difficulty-advanced {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

.steps-list {
  padding: 0 0.5rem 0.5rem 1.75rem;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.5rem;
  border-radius: 4px;
  cursor: grab;
  transition: all 0.15s;
  user-select: none;
  border-left: 2px solid var(--scenario-node-step);
  margin-bottom: 0.25rem;
  background: var(--scenario-node-step-bg);
}

.step-item:active {
  cursor: grabbing;
}

.step-item:hover {
  transform: translateX(2px);
  box-shadow: var(--shadow-sm);
}

.step-order {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--scenario-node-step);
  min-width: 1.25rem;
  text-align: center;
  flex-shrink: 0;
}

.step-title {
  flex: 1;
  font-size: 0.75rem;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.step-badges {
  display: flex;
  gap: 0.2rem;
  flex-shrink: 0;
}

.step-badge {
  font-size: 0.6rem;
  opacity: 0.7;
}

.badge-verify {
  color: var(--color-success);
  font-weight: 700;
}

.no-steps {
  font-size: 0.7rem;
  color: var(--color-text-secondary);
  padding: 0.5rem;
  font-style: italic;
}
</style>
