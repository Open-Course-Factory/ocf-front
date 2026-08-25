<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Compact bar shown above the terminal when no scenario is active.
 * Allows users to pick and start a scenario on their running terminal session.
 * Filters scenarios to only show ones compatible with the current machine.
 */
-->

<template>
  <!-- Rendered only once we know something is on offer. The component itself
       stays mounted either way: the parent holds a ref to it and calls
       abortProvisioning() through it, so it must not be v-if'd away up there. -->
  <div v-if="hasCompatibleScenarios" class="scenario-start-bar" data-testid="scenario-start-bar">
    <div v-if="!showPicker" class="start-prompt">
      <i class="fas fa-flag-checkered"></i>
      <span>{{ t('scenarioStart.noActive') }}</span>
      <button class="start-btn" data-testid="scenario-start-bar-btn" @click="showPicker = true">
        <i class="fas fa-play"></i>
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

      <div class="scenario-list" role="list">
        <button
          v-for="scenario in compatibleScenarios"
          :key="scenario.id"
          role="listitem"
          class="scenario-item"
          data-testid="scenario-picker-item"
          :disabled="isStarting"
          @click="startScenario(scenario)"
        >
          <div class="scenario-main">
            <div class="scenario-info">
              <span class="scenario-title">{{ scenario.title }}</span>
              <AdminBadge v-if="scenario.admin_only" icon-only />
              <span v-if="scenario.difficulty" class="scenario-difficulty">{{ translateDifficulty(scenario.difficulty) }}</span>
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
import { ref, computed, onMounted } from 'vue'
import { scenarioSessionService, pollProvisioningStatus } from '../../services/domain/scenario'
import { terminalService } from '../../services/domain/terminal'
import { useTranslations } from '../../composables/useTranslations'
import { useDifficultyLabel } from '../../composables/useDifficultyLabel'
import { useNotification } from '../../composables/useNotification'
import AdminBadge from '../Common/AdminBadge.vue'

interface Props {
  terminalSessionId: string
  terminalInstanceType?: string
  terminalMachineSize?: string
}

const props = withDefaults(defineProps<Props>(), {
  terminalInstanceType: '',
  terminalMachineSize: ''
})

const emit = defineEmits<{
  'scenario-started': [scenarioSessionId: string]
  'scenario-loading': [loading: boolean]
  'provisioning-phase': [phase: string]
  'provisioning-session-id': [sessionId: string]
}>()

let provisioningAbortController: AbortController | null = null

function abortProvisioning() {
  provisioningAbortController?.abort()
}

defineExpose({ abortProvisioning })

const { showError } = useNotification()

const { t } = useTranslations({
  en: {
    scenarioStart: {
      noActive: 'No scenario active on this terminal',
      start: 'Start a Scenario',
      choose: 'Choose a scenario',
      startError: 'Failed to start scenario.',
      setupFailed: 'Environment setup failed. Please try again.',
      provisioning: 'Setting up environment... This may take a few minutes.',
      closePicker: 'Close'
    }
  },
  fr: {
    scenarioStart: {
      noActive: 'Aucun scénario actif sur ce terminal',
      start: 'Démarrer un scénario',
      choose: 'Choisir un scénario',
      startError: 'Échec du démarrage du scénario.',
      setupFailed: 'La préparation de l\'environnement a échoué. Veuillez réessayer.',
      provisioning: 'Préparation de l\'environnement... Cela peut prendre quelques minutes.',
      closePicker: 'Fermer'
    }
  }
})

const translateDifficulty = useDifficultyLabel()

// Size ordering for "at least" comparison
const SIZE_ORDER: Record<string, number> = { 'XS': 1, 'S': 2, 'M': 3, 'L': 4, 'XL': 5, 'XXL': 6 }

const terminalOsType = ref('')

function isScenarioCompatible(scenario: any): boolean {
  // Check OS type compatibility
  if (scenario.os_type && terminalOsType.value && scenario.os_type !== terminalOsType.value) {
    return false
  }

  // Check size: terminal size must be >= scenario required size
  const requiredSize = scenario.instance_type // e.g., "M"
  const machineSize = props.terminalMachineSize // e.g., "L"

  if (!requiredSize || !machineSize) return true

  const requiredOrder = SIZE_ORDER[requiredSize] ?? 0
  const machineOrder = SIZE_ORDER[machineSize] ?? 0

  if (requiredOrder === 0 || machineOrder === 0) return true // unknown size, show it

  return machineOrder >= requiredOrder
}

const showPicker = ref(false)
const scenarios = ref<any[]>([])
const isStarting = ref(false)

const compatibleScenarios = computed(() => {
  return scenarios.value.filter(s => {
    // Use backend launchable flag first (accounts for machine availability)
    if (s.launchable === false) return false
    // Then check compatibility with this specific terminal's OS and size
    return isScenarioCompatible(s)
  })
})

// Whether this terminal has anything worth offering. Gates the whole bar.
const hasCompatibleScenarios = computed(() => compatibleScenarios.value.length > 0)

async function resolveTerminalOsType() {
  if (!props.terminalInstanceType || terminalOsType.value) return
  try {
    const distributions = await terminalService.getDistributions()
    const match = distributions.find(d => d.prefix === props.terminalInstanceType)
    if (match?.os_type) {
      terminalOsType.value = match.os_type
    }
  } catch {
    // Best effort — filtering still works on size
  }
}

// Load once, on mount, because whether this bar should exist at all is a
// question about the data: a terminal with no compatible scenario has nothing
// to offer, and an empty picker behind a button is worse than no button.
//
// Costs one list request per terminal view. That is the price of knowing before
// rendering; the previous lazy load could only answer after the user had
// already clicked and been disappointed.
async function loadScenarios() {
  try {
    // Load scenarios and resolve terminal's OS type in parallel
    const [scenarioData] = await Promise.all([
      scenarioSessionService.listScenarios(),
      resolveTerminalOsType()
    ])
    scenarios.value = scenarioData
  } catch (err: any) {
    // Stay hidden and say nothing. The user never asked for scenarios, so a
    // toast on every terminal open during a backend hiccup would be noise —
    // and offering a picker we could not verify is worse than offering none.
    console.warn('Could not load scenarios for the start bar:', err)
    scenarios.value = []
  }
}

onMounted(loadScenarios)

async function startScenario(scenario: any) {
  isStarting.value = true
  emit('scenario-loading', true)
  emit('provisioning-phase', 'setup_script')

  const abortController = new AbortController()
  provisioningAbortController = abortController

  try {
    const session = await scenarioSessionService.startScenario(scenario.id, {
      terminal_session_id: props.terminalSessionId
    })
    emit('provisioning-session-id', session.id)
    emit('provisioning-phase', session.provisioning_phase || 'setup_script')

    if (abortController.signal.aborted) return

    // If session is provisioning, poll until setup completes
    if (session.status === 'provisioning') {
      await pollProvisioningStatus(session.id, (phase) => {
        emit('provisioning-phase', phase)
      }, abortController.signal)
    }

    if (abortController.signal.aborted) return

    emit('provisioning-phase', '')
    emit('scenario-started', session.id)
  } catch (err: any) {
    if (abortController.signal.aborted) return
    console.error('Failed to start scenario:', err)
    emit('provisioning-phase', '')
    emit('scenario-loading', false)
    const msg = err.message === 'SETUP_FAILED' ? t('scenarioStart.setupFailed')
      : err.message === 'SETUP_TIMEOUT' ? t('scenarioStart.startError')
      : err.response?.data?.error_message || err.response?.data?.message || t('scenarioStart.startError')
    showError(msg)
  } finally {
    isStarting.value = false
    provisioningAbortController = null
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

.start-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.scenario-item:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
</style>
