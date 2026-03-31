<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Scenario launcher page: browse and launch available scenarios.
 */
-->

<template>
  <div class="scenario-launcher">
    <div class="page-header">
      <h2>{{ t('launcher.title') }}</h2>
      <p class="page-subtitle">{{ t('launcher.subtitle') }}</p>
    </div>

    <div v-if="isLoading" class="loading-section">
      <i class="fas fa-spinner fa-spin"></i>
      <span>{{ t('launcher.loading') }}</span>
    </div>

    <div v-else-if="error" class="error-section">
      <i class="fas fa-exclamation-triangle"></i>
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="loadScenarios">{{ t('launcher.retry') }}</button>
    </div>

    <div v-else-if="scenarios.length === 0" class="empty-section">
      <i class="fas fa-flask"></i>
      <p>{{ t('launcher.empty') }}</p>
    </div>

    <div v-else class="scenario-grid">
      <div
        v-for="scenario in scenarios"
        :key="scenario.id"
        class="scenario-card"
        :class="{ 'scenario-card--unavailable': !scenario.launchable && !getExistingSession(scenario), 'scenario-card--active': !!getExistingSession(scenario) }"
      >
        <div class="card-header">
          <h3 class="card-title">{{ scenario.title }}</h3>
          <span v-if="scenario.difficulty" class="difficulty-badge" :class="'difficulty-' + scenario.difficulty">
            {{ translateDifficulty(scenario.difficulty) }}
          </span>
        </div>
        <p v-if="scenario.description" class="card-description">{{ scenario.description }}</p>
        <div class="card-meta">
          <span v-if="scenario.estimated_time" class="meta-item">
            <i class="fas fa-clock"></i> {{ scenario.estimated_time }}
          </span>
          <div v-if="scenario.compatible_instance_types?.length" class="os-badges">
            <span
              v-for="cit in scenario.compatible_instance_types"
              :key="cit.id"
              class="os-badge"
              :class="{ 'os-badge--missing': !isInstanceTypeAvailable(cit.instance_type, scenario) }"
              :title="isInstanceTypeAvailable(cit.instance_type, scenario) ? t('launcher.machineAvailable') : t('launcher.machineOffline')"
            >
              <i :class="isInstanceTypeAvailable(cit.instance_type, scenario) ? 'fas fa-check-circle' : 'fas fa-times-circle'" class="os-badge-icon"></i>
              {{ cit.instance_type }}
            </span>
          </div>
          <span v-else-if="scenario.instance_type" class="os-badge" :class="{ 'os-badge--missing': !scenario.launchable }">
            <i :class="scenario.launchable ? 'fas fa-check-circle' : 'fas fa-times-circle'" class="os-badge-icon"></i>
            {{ scenario.instance_type }}
          </span>
        </div>

        <!-- Unavailability explanation -->
        <div v-if="!scenario.launchable" class="unavailable-notice">
          <div class="unavailable-notice-content">
            <i :class="getScenarioBlockReason(scenario) === 'plan' ? 'fas fa-lock' : 'fas fa-server'" class="unavailable-notice-icon"></i>
            <div class="unavailable-notice-text">
              <span class="unavailable-notice-title">{{ t('launcher.unavailableTitle') }}</span>
              <span class="unavailable-notice-detail">{{ getUnavailableReason(scenario) }}</span>
            </div>
          </div>
          <span class="unavailable-notice-hint">{{ getUnavailableHint(scenario) }}</span>
        </div>

        <!-- Existing session notice -->
        <div v-if="getExistingSession(scenario)" class="existing-session-notice">
          <div class="existing-session-content">
            <i :class="getExistingSession(scenario).status === 'active' ? 'fas fa-play-circle' : 'fas fa-check-circle'" class="existing-session-icon"></i>
            <span class="existing-session-text">{{ getExistingSessionLabel(scenario) }}</span>
          </div>
        </div>

        <div class="card-actions">
          <!-- Active session: resume -->
          <router-link
            v-if="getExistingSession(scenario)?.terminal_session_id && getExistingSession(scenario).status === 'active'"
            :to="{ name: 'TerminalSessionView', params: { sessionId: getExistingSession(scenario).terminal_session_id } }"
            class="btn btn-primary launch-btn"
          >
            <i class="fas fa-play"></i>
            {{ t('launcher.resume') }}
          </router-link>
          <!-- Completed/abandoned session: review + relaunch -->
          <div v-else-if="getExistingSession(scenario)" class="card-actions-row">
            <router-link
              v-if="getExistingSession(scenario).terminal_session_id"
              :to="{ name: 'TerminalSessionView', params: { sessionId: getExistingSession(scenario).terminal_session_id } }"
              class="btn btn-secondary launch-btn"
            >
              <i class="fas fa-eye"></i>
              {{ t('launcher.review') }}
            </router-link>
            <button
              v-if="scenario.launchable"
              class="btn btn-primary launch-btn"
              :disabled="isLaunching"
              @click="handleLaunchScenario(scenario)"
            >
              <i :class="isLaunching && launchingScenarioId === scenario.id ? 'fas fa-spinner fa-spin' : 'fas fa-redo'"></i>
              {{ t('launcher.relaunch') }}
            </button>
          </div>
          <!-- No session + launchable -->
          <button
            v-else-if="scenario.launchable"
            class="btn btn-primary launch-btn"
            :disabled="isLaunching"
            @click="handleLaunchScenario(scenario)"
          >
            <i :class="isLaunching && launchingScenarioId === scenario.id ? 'fas fa-spinner fa-spin' : 'fas fa-rocket'"></i>
            {{ t('launcher.launch') }}
          </button>
          <!-- No session + not launchable -->
          <div v-else class="launch-btn-disabled" :title="t('launcher.unavailableTitle')">
            <i class="fas fa-ban"></i>
            {{ t('launcher.unavailable') }}
          </div>
        </div>
      </div>
    </div>

    <!-- Provisioning overlay -->
    <div v-if="provisioningMessage" class="provisioning-overlay">
      <div class="provisioning-content">
        <i class="fas fa-cog fa-spin provisioning-icon"></i>
        <h3>{{ t('launcher.provisioning') }}</h3>
        <p>{{ provisioningMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { scenarioSessionService } from '../../services/domain/scenario'
import { terminalService, instanceUtils } from '../../services/domain/terminal'
import { useSubscriptionsStore } from '../../stores/subscriptions'
import { useTranslations } from '../../composables/useTranslations'
import { useNotification } from '../../composables/useNotification'
import type { InstanceType } from '../../types'

const router = useRouter()
const { showError } = useNotification()
const subscriptionsStore = useSubscriptionsStore()

const { t } = useTranslations({
  en: {
    launcher: {
      title: 'Scenarios',
      subtitle: 'Browse and launch available scenarios',
      loading: 'Loading scenarios...',
      empty: 'No scenarios available yet. Scenarios will appear here once they are assigned to you.',
      retry: 'Retry',
      launch: 'Launch',
      resume: 'Resume',
      review: 'Review',
      relaunch: 'Relaunch',
      unavailable: 'Unavailable',
      sessionActive: 'Scenario in progress',
      sessionCompleted: 'Scenario completed',
      sessionAbandoned: 'Scenario abandoned',
      sessionExists: 'Scenario already started',
      unavailableTitle: 'No compatible machine available',
      unavailableNoTypes: 'This scenario requires machine types that are not currently online.',
      unavailableSpecific: 'Required: {types} — none are available right now.',
      unavailablePlan: 'The required machine size is not included in your current plan.',
      unavailablePlanHint: 'Upgrade your plan to access larger machines.',
      unavailableHint: 'The required machines may be temporarily offline. Try again later.',
      machineAvailable: 'Machine available',
      machineOffline: 'Machine offline or not configured',
      provisioning: 'Setting up your environment...',
      provisioningDetail: 'Creating terminal and preparing scenario. This may take a few minutes.',
      provisioningSetup: 'Running scenario setup scripts... This may take a few minutes.',
      setupFailed: 'Scenario setup failed. The environment could not be prepared.',
      setupTimeout: 'Scenario setup timed out. Please try again.',
      launchError: 'Failed to launch scenario.',
      difficultyBeginner: 'Beginner',
      difficultyIntermediate: 'Intermediate',
      difficultyAdvanced: 'Advanced'
    }
  },
  fr: {
    launcher: {
      title: 'Scenarios',
      subtitle: 'Parcourir et lancer les scenarios disponibles',
      loading: 'Chargement des scenarios...',
      empty: 'Aucun scenario disponible pour le moment. Les scenarios apparaitront ici une fois qu\'ils vous seront assignes.',
      retry: 'Reessayer',
      launch: 'Lancer',
      resume: 'Reprendre',
      review: 'Revoir',
      relaunch: 'Relancer',
      unavailable: 'Indisponible',
      sessionActive: 'Scenario en cours',
      sessionCompleted: 'Scenario termine',
      sessionAbandoned: 'Scenario abandonne',
      sessionExists: 'Scenario deja lance',
      unavailableTitle: 'Aucune machine compatible disponible',
      unavailableNoTypes: 'Ce scenario necessite des types de machines qui ne sont pas en ligne actuellement.',
      unavailableSpecific: 'Requis : {types} — aucun n\'est disponible pour le moment.',
      unavailablePlan: 'La taille de machine requise n\'est pas incluse dans votre plan actuel.',
      unavailablePlanHint: 'Mettez a niveau votre plan pour acceder aux machines plus puissantes.',
      unavailableHint: 'Les machines requises sont peut-etre temporairement hors ligne. Reessayez plus tard.',
      machineAvailable: 'Machine disponible',
      machineOffline: 'Machine hors ligne ou non configuree',
      provisioning: 'Preparation de votre environnement...',
      provisioningDetail: 'Creation du terminal et preparation du scenario. Cela peut prendre quelques minutes.',
      provisioningSetup: 'Execution des scripts de preparation du scenario... Cela peut prendre quelques minutes.',
      setupFailed: 'La preparation du scenario a echoue. L\'environnement n\'a pas pu etre configure.',
      setupTimeout: 'La preparation du scenario a expire. Veuillez reessayer.',
      launchError: 'Echec du lancement du scenario.',
      difficultyBeginner: 'Debutant',
      difficultyIntermediate: 'Intermediaire',
      difficultyAdvanced: 'Avance'
    }
  }
})

const scenarios = ref<any[]>([])
const instanceTypes = ref<InstanceType[]>([])
const mySessions = ref<any[]>([])
const isLoading = ref(false)
const error = ref('')
const isLaunching = ref(false)
const launchingScenarioId = ref('')
const provisioningMessage = ref('')

const allowedMachineSizes = computed(() => {
  const sizes = subscriptionsStore.currentSubscription?.subscription_plan?.allowed_machine_sizes || []
  return sizes.length === 0 ? ['XS'] : sizes
})

function translateDifficulty(difficulty: string): string {
  const map: Record<string, string> = {
    beginner: t('launcher.difficultyBeginner'),
    intermediate: t('launcher.difficultyIntermediate'),
    advanced: t('launcher.difficultyAdvanced')
  }
  return map[difficulty] || difficulty
}

function getExistingSession(scenario: any): any | null {
  return mySessions.value.find(s => s.scenario_id === scenario.id) || null
}

function getExistingSessionLabel(scenario: any): string {
  const session = getExistingSession(scenario)
  if (!session) return ''
  switch (session.status) {
    case 'active':
    case 'provisioning':
      return t('launcher.sessionActive')
    case 'completed':
      return t('launcher.sessionCompleted')
    case 'abandoned':
      return t('launcher.sessionAbandoned')
    default:
      return t('launcher.sessionExists')
  }
}

function isInstanceTypeAvailable(instanceType: string, scenario: any): boolean {
  return (scenario.available_instance_types || []).includes(instanceType)
}

function getScenarioBlockReason(scenario: any): 'plan' | 'offline' | null {
  if (scenario.launchable) return null

  // Check if any compatible instance type exists on the backend
  const requiredPrefixes = getRequiredPrefixes(scenario)
  const availablePrefixes = new Set((scenario.available_instance_types || []) as string[])

  // If some are available but launchable is false, it might be a plan issue
  // Check if any available instance type matches but has a restricted size
  for (const prefix of requiredPrefixes) {
    if (availablePrefixes.has(prefix)) {
      // Instance exists — check if user's plan covers it
      const inst = instanceTypes.value.find(i => i.prefix === prefix)
      if (inst) {
        const availability = instanceUtils.checkAvailability(inst, allowedMachineSizes.value)
        if (!availability.available) {
          return 'plan'
        }
      }
    }
  }
  return 'offline'
}

function getRequiredPrefixes(scenario: any): string[] {
  const types = scenario.compatible_instance_types?.map((c: any) => c.instance_type) || []
  if (types.length === 0 && scenario.instance_type) {
    types.push(scenario.instance_type)
  }
  return types
}

function getUnavailableReason(scenario: any): string {
  const reason = getScenarioBlockReason(scenario)
  if (reason === 'plan') {
    return t('launcher.unavailablePlan')
  }
  const requiredTypes = getRequiredPrefixes(scenario)
  if (requiredTypes.length === 0) {
    return t('launcher.unavailableNoTypes')
  }
  return t('launcher.unavailableSpecific').replace('{types}', requiredTypes.join(', '))
}

function getUnavailableHint(scenario: any): string {
  const reason = getScenarioBlockReason(scenario)
  if (reason === 'plan') {
    return t('launcher.unavailablePlanHint')
  }
  return t('launcher.unavailableHint')
}

async function loadScenarios() {
  isLoading.value = true
  error.value = ''
  try {
    const [scenarioData] = await Promise.all([
      scenarioSessionService.listScenarios(),
      scenarioSessionService.getMyScenarioSessions().then(sessions => { mySessions.value = sessions }).catch(() => {}),
      terminalService.getInstanceTypes().then(types => { instanceTypes.value = types }).catch(() => {}),
      subscriptionsStore.getCurrentSubscription().catch(() => {})
    ])
    scenarios.value = scenarioData
  } catch (err: any) {
    error.value = err.response?.data?.error_message || t('launcher.loading')
  } finally {
    isLoading.value = false
  }
}

async function handleLaunchScenario(scenario: any) {
  isLaunching.value = true
  launchingScenarioId.value = scenario.id
  provisioningMessage.value = t('launcher.provisioningDetail')
  try {
    const result = await scenarioSessionService.launchScenario(scenario.id)

    // Wait for scenario to be ready if still provisioning
    if (result.status === 'provisioning') {
      provisioningMessage.value = t('launcher.provisioningSetup')
      await waitForScenarioReady(result.scenario_session_id)
    }

    provisioningMessage.value = ''
    router.push({ name: 'TerminalSessionView', params: { sessionId: result.terminal_session_id } })
  } catch (err: any) {
    provisioningMessage.value = ''
    showError(err.response?.data?.error_message || err.message || t('launcher.launchError'))
  } finally {
    isLaunching.value = false
    launchingScenarioId.value = ''
  }
}

async function waitForScenarioReady(sessionId: string) {
  const maxAttempts = 120 // 6 minutes at 3s intervals
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 3000))
    try {
      const info = await scenarioSessionService.getSessionInfo(sessionId)
      if (info.status === 'setup_failed') {
        throw new Error(t('launcher.setupFailed'))
      }
      if (info.status !== 'provisioning') return
    } catch (err: any) {
      if (err.message === t('launcher.setupFailed')) throw err
    }
  }
  throw new Error(t('launcher.setupTimeout'))
}

onMounted(loadScenarios)
</script>

<style scoped>
.scenario-launcher {
  padding: var(--spacing-lg);
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
}

.page-header {
  margin-bottom: var(--spacing-lg);
}

.page-header h2 {
  margin: 0;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.page-subtitle {
  margin: var(--spacing-xs) 0 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

/* Loading, error, empty states */
.loading-section,
.error-section,
.empty-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-2xl);
  color: var(--color-text-muted);
  text-align: center;
}

.loading-section i,
.error-section i,
.empty-section i {
  font-size: var(--font-size-2xl);
}

.error-section i {
  color: var(--color-danger);
}

.error-section p {
  color: var(--color-danger-text);
}

/* Scenario grid */
.scenario-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--spacing-md);
}

/* Scenario card */
.scenario-card {
  display: flex;
  flex-direction: column;
  background: var(--color-bg-primary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  transition: box-shadow var(--transition-fast), border-color var(--transition-fast);
}

.scenario-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.scenario-card--unavailable {
  opacity: 0.85;
}

.scenario-card--unavailable:hover {
  border-color: var(--color-border-medium);
  box-shadow: none;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-bottom: var(--border-width-thin) solid var(--color-border-light);
}

.card-title {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.difficulty-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px var(--spacing-sm);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
  flex-shrink: 0;
}

.difficulty-beginner {
  background: var(--color-success-bg);
  color: var(--color-success-text);
}

.difficulty-intermediate {
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
}

.difficulty-advanced {
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.card-description {
  padding: var(--spacing-sm) var(--spacing-md) 0;
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  flex: 1;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  flex-wrap: wrap;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.os-badges {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.os-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px var(--spacing-sm);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  background: var(--color-success-bg);
  color: var(--color-success-text);
  border: 1px solid var(--color-success-border);
}

.os-badge-icon {
  font-size: 9px;
}

.os-badge--missing {
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
  border-color: var(--color-danger-border);
}

/* Unavailability notice */
.unavailable-notice {
  margin: var(--spacing-xs) var(--spacing-md) 0;
  padding: var(--spacing-sm);
  background: var(--color-warning-bg);
  border: 1px solid var(--color-warning-border);
  border-radius: var(--border-radius-sm);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.unavailable-notice-content {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
}

.unavailable-notice-icon {
  color: var(--color-warning-text);
  font-size: var(--font-size-sm);
  margin-top: 1px;
  flex-shrink: 0;
}

.unavailable-notice-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.unavailable-notice-title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-warning-text);
}

.unavailable-notice-detail {
  font-size: var(--font-size-xs);
  color: var(--color-warning-text);
  line-height: var(--line-height-normal);
}

.unavailable-notice-hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-style: italic;
}

/* Active session card */
.scenario-card--active {
  border-color: var(--color-primary);
}

/* Existing session notice */
.existing-session-notice {
  margin: var(--spacing-xs) var(--spacing-md) 0;
  padding: var(--spacing-sm);
  background: var(--color-info-bg);
  border: 1px solid var(--color-info-border);
  border-radius: var(--border-radius-sm);
}

.existing-session-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.existing-session-icon {
  color: var(--color-info-text);
  font-size: var(--font-size-sm);
  flex-shrink: 0;
}

.existing-session-text {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-info-text);
}

.card-actions-row {
  display: flex;
  gap: var(--spacing-sm);
}

.card-actions-row .launch-btn {
  flex: 1;
}

/* Card actions */
.card-actions {
  padding: var(--spacing-sm) var(--spacing-md) var(--spacing-md);
}

.launch-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  width: 100%;
  justify-content: center;
}

.launch-btn-disabled {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  background: var(--color-bg-tertiary);
  color: var(--color-text-disabled);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: not-allowed;
  border: 1px solid var(--color-border-light);
}

/* Provisioning overlay */
.provisioning-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
}

.provisioning-content {
  background: var(--color-bg-primary);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-2xl);
  text-align: center;
  max-width: 400px;
  box-shadow: var(--shadow-lg);
}

.provisioning-icon {
  font-size: 3rem;
  color: var(--color-primary);
  margin-bottom: var(--spacing-md);
}

.provisioning-content h3 {
  margin: 0 0 var(--spacing-sm);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.provisioning-content p {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

/* Responsive */
@media (max-width: 768px) {
  .scenario-launcher {
    padding: var(--spacing-md);
  }

  .scenario-grid {
    grid-template-columns: 1fr;
  }
}
</style>
