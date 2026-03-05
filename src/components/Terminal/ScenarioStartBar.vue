<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Compact bar shown above the terminal when no scenario is active.
 * Allows users to pick and start a scenario on their running terminal session.
 */
-->

<template>
  <div class="scenario-start-bar">
    <div v-if="!showPicker" class="start-prompt">
      <i class="fas fa-flag-checkered"></i>
      <span>{{ t('scenarioStart.noActive') }}</span>
      <button class="start-btn" @click="loadAndShowPicker" :disabled="isLoading">
        <i :class="isLoading ? 'fas fa-spinner fa-spin' : 'fas fa-play'"></i>
        {{ t('scenarioStart.start') }}
      </button>
    </div>

    <div v-else class="scenario-picker">
      <div class="picker-header">
        <span>{{ t('scenarioStart.choose') }}</span>
        <button class="close-btn" @click="showPicker = false" :aria-label="t('scenarioStart.closePicker')">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div v-if="scenarios.length === 0" class="no-scenarios">
        {{ t('scenarioStart.none') }}
      </div>

      <div v-else class="scenario-list" role="list">
        <button
          v-for="scenario in scenarios"
          :key="scenario.id"
          role="listitem"
          class="scenario-item"
          :disabled="isStarting"
          @click="startScenario(scenario)"
        >
          <div class="scenario-main">
            <div class="scenario-info">
              <span class="scenario-title">{{ scenario.title }}</span>
              <span v-if="scenario.difficulty" class="scenario-difficulty">{{ scenario.difficulty }}</span>
            </div>
            <p v-if="scenario.description" class="scenario-description">{{ scenario.description }}</p>
          </div>
          <span v-if="scenario.estimated_time" class="scenario-time">
            <i class="fas fa-clock"></i> {{ scenario.estimated_time }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { scenarioSessionService } from '../../services/domain/scenario'
import { useTranslations } from '../../composables/useTranslations'
import { useNotification } from '../../composables/useNotification'

interface Props {
  terminalSessionId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'scenario-started': [scenarioSessionId: string]
}>()

const { showError } = useNotification()

const { t } = useTranslations({
  en: {
    scenarioStart: {
      noActive: 'No scenario active on this terminal',
      start: 'Start a Scenario',
      choose: 'Choose a scenario',
      none: 'No scenarios available. Ask your instructor to create one.',
      startError: 'Failed to start scenario.',
      loadError: 'Failed to load scenarios.',
      closePicker: 'Close'
    }
  },
  fr: {
    scenarioStart: {
      noActive: 'Aucun scénario actif sur ce terminal',
      start: 'Démarrer un scénario',
      choose: 'Choisir un scénario',
      none: 'Aucun scénario disponible. Demandez à votre formateur d\'en créer un.',
      startError: 'Échec du démarrage du scénario.',
      loadError: 'Échec du chargement des scénarios.',
      closePicker: 'Fermer'
    }
  }
})

const showPicker = ref(false)
const scenarios = ref<any[]>([])
const isLoading = ref(false)
const isStarting = ref(false)

async function loadAndShowPicker() {
  isLoading.value = true
  try {
    scenarios.value = await scenarioSessionService.listScenarios()
    showPicker.value = true
  } catch (err: any) {
    console.error('Failed to load scenarios:', err)
    showError(
      err.response?.data?.error_message ||
      err.response?.data?.message ||
      t('scenarioStart.loadError')
    )
  } finally {
    isLoading.value = false
  }
}

async function startScenario(scenario: any) {
  isStarting.value = true
  try {
    const session = await scenarioSessionService.startScenario(scenario.id, {
      terminal_session_id: props.terminalSessionId
    })
    emit('scenario-started', session.id)
  } catch (err: any) {
    console.error('Failed to start scenario:', err)
    showError(
      err.response?.data?.error_message ||
      err.response?.data?.message ||
      t('scenarioStart.startError')
    )
  } finally {
    isStarting.value = false
  }
}
</script>

<style scoped>
.scenario-start-bar {
  margin-bottom: var(--spacing-sm);
  background-color: var(--color-bg-secondary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
}

.start-prompt {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.start-prompt > i {
  color: var(--color-text-muted);
}

.start-btn {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-md);
  background-color: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.start-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.start-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.scenario-picker {
  padding: var(--spacing-sm) var(--spacing-md);
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: none;
  border: none;
  border-radius: var(--border-radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.close-btn:hover {
  background-color: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.no-scenarios {
  padding: var(--spacing-sm);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  text-align: center;
}

.scenario-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.scenario-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  background: none;
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  text-align: left;
  transition: all var(--transition-fast);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.scenario-item:hover:not(:disabled) {
  background-color: var(--color-surface-hover);
}

.scenario-item:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.scenario-main {
  flex: 1;
  min-width: 0;
}

.scenario-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.scenario-description {
  margin: 2px 0 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  line-height: var(--line-height-normal);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scenario-title {
  font-weight: var(--font-weight-medium);
}

.scenario-difficulty {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  padding: 2px var(--spacing-xs);
  background-color: var(--color-bg-tertiary, var(--color-bg-secondary));
  border-radius: var(--border-radius-sm);
}

.scenario-time {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  white-space: nowrap;
}

.scenario-time i {
  margin-right: 2px;
}
</style>
