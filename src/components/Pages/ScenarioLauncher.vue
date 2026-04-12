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

    <template v-else>
      <!-- Search bar -->
      <div class="search-bar">
        <div class="search-input-wrapper">
          <i class="fas fa-search"></i>
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            :placeholder="t('launcher.searchPlaceholder')"
          />
        </div>
      </div>

      <!-- No results message -->
      <div v-if="filteredScenarios.length === 0" class="empty-section">
        <i class="fas fa-search"></i>
        <p>{{ t('launcher.noMatchingScenarios') }}</p>
      </div>

      <div v-else class="scenario-grid">
        <div
          v-for="scenario in filteredScenarios"
          :key="scenario.id"
        class="scenario-card"
        :class="{ 'scenario-card--unavailable': !scenario.launchable && !getExistingSession(scenario), 'scenario-card--active': !!getExistingSession(scenario) }"
      >
        <div class="card-header">
          <div class="card-title-row">
            <h3 class="card-title">{{ scenario.title }}</h3>
            <AdminBadge v-if="scenario.admin_only" icon-only />
          </div>
          <span v-if="scenario.difficulty" class="difficulty-badge" :class="'difficulty-' + scenario.difficulty">
            {{ translateDifficulty(scenario.difficulty) }}
          </span>
        </div>
        <p v-if="scenario.description" class="card-description">{{ scenario.description }}</p>
        <div class="card-meta">
          <span v-if="scenario.estimated_time" class="meta-item">
            <i class="fas fa-clock"></i> {{ scenario.estimated_time }}
          </span>
          <span v-if="scenario.os_type" class="os-badge">
            <i class="fas fa-linux os-badge-icon"></i>
            {{ scenario.os_type }}
          </span>
          <span v-if="scenario.instance_type" class="os-badge">
            <i class="fas fa-microchip os-badge-icon"></i>
            {{ scenario.instance_type }}
          </span>
        </div>

        <!-- Unavailability explanation -->
        <div v-if="!scenario.launchable" class="unavailable-notice">
          <div class="unavailable-notice-content">
            <i :class="getScenarioBlockReason(scenario) === 'plan' ? 'fas fa-lock' : getScenarioBlockReason(scenario) === 'no_distribution' ? 'fas fa-exclamation-triangle' : 'fas fa-server'" class="unavailable-notice-icon"></i>
            <div class="unavailable-notice-text">
              <span class="unavailable-notice-title">{{ t('launcher.unavailableTitle') }}</span>
              <span class="unavailable-notice-detail">{{ getUnavailableReason(scenario) }}</span>
            </div>
          </div>
          <span v-if="getUnavailableHint(scenario)" class="unavailable-notice-hint">{{ getUnavailableHint(scenario) }}</span>
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
    </template>

    <!-- Provisioning overlay -->
    <ScenarioProvisioningOverlay
      v-if="provisioningMessage"
      :phase="provisioningPhase"
      :cancellable="!!provisioningSessionId"
      @cancel="handleCancelProvisioning"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { scenarioSessionService, pollProvisioningStatus } from '../../services/domain/scenario'
import { useOrganizationsStore } from '../../stores/organizations'
import { useSubscriptionsStore } from '../../stores/subscriptions'
import { useTranslations } from '../../composables/useTranslations'
import { useNotification } from '../../composables/useNotification'
import AdminBadge from '../Common/AdminBadge.vue'
import ScenarioProvisioningOverlay from '../Terminal/ScenarioProvisioningOverlay.vue'

const router = useRouter()
const { showError } = useNotification()
const organizationsStore = useOrganizationsStore()
const subscriptionsStore = useSubscriptionsStore()
const currentOrgId = computed(() => organizationsStore.currentOrganization?.id || '')

const isAssignedSubscription = computed(() => {
  const sub = subscriptionsStore.currentSubscription
  return sub?.subscription_type === 'assigned' || !!sub?.subscription_batch_id
})

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
      unavailableTitle: 'Scenario unavailable',
      unavailableNoDistribution: 'No compatible machine available for this scenario.',
      unavailableOffline: 'The required server is currently offline.',
      unavailablePlan: 'The required machine size is not included in your current plan.',
      unavailablePlanHint: 'Upgrade your plan to access larger machines.',
      unavailableOfflineHint: 'The required machines may be temporarily offline. Try again later.',
      unavailableNoDistributionHint: 'Contact your administrator to configure compatible machines.',
      provisioning: 'Setting up your environment...',
      provisioningDetail: 'Creating terminal and preparing scenario. This may take a few minutes.',
      provisioningSetup: 'Running scenario setup scripts... This may take a few minutes.',
      setupFailed: 'Scenario setup failed. The environment could not be prepared.',
      setupTimeout: 'Scenario setup timed out. Please try again.',
      launchError: 'Failed to launch scenario.',
      difficultyBeginner: 'Beginner',
      difficultyIntermediate: 'Intermediate',
      difficultyAdvanced: 'Advanced',
      searchPlaceholder: 'Search scenarios...',
      noMatchingScenarios: 'No matching scenarios'
    }
  },
  fr: {
    launcher: {
      title: 'Scénarios',
      subtitle: 'Parcourir et lancer les scénarios disponibles',
      loading: 'Chargement des scénarios...',
      empty: 'Aucun scénario disponible pour le moment. Les scénarios apparaîtront ici une fois qu\'ils vous seront assignés.',
      retry: 'Réessayer',
      launch: 'Lancer',
      resume: 'Reprendre',
      review: 'Revoir',
      relaunch: 'Relancer',
      unavailable: 'Indisponible',
      sessionActive: 'Scénario en cours',
      sessionCompleted: 'Scénario terminé',
      sessionAbandoned: 'Scénario abandonné',
      sessionExists: 'Scénario déjà lancé',
      unavailableTitle: 'Scénario indisponible',
      unavailableNoDistribution: 'Aucune machine compatible disponible pour ce scénario.',
      unavailableOffline: 'Le serveur requis est actuellement hors ligne.',
      unavailablePlan: 'La taille de machine requise n\'est pas incluse dans votre plan actuel.',
      unavailablePlanHint: 'Mettez à niveau votre plan pour accéder aux machines plus puissantes.',
      unavailableOfflineHint: 'Les machines requises sont peut-être temporairement hors ligne. Réessayez plus tard.',
      unavailableNoDistributionHint: 'Contactez votre administrateur pour configurer des machines compatibles.',
      provisioning: 'Préparation de votre environnement...',
      provisioningDetail: 'Création du terminal et préparation du scénario. Cela peut prendre quelques minutes.',
      provisioningSetup: 'Exécution des scripts de préparation du scénario... Cela peut prendre quelques minutes.',
      setupFailed: 'La préparation du scénario a échoué. L\'environnement n\'a pas pu être configuré.',
      setupTimeout: 'La préparation du scénario a expiré. Veuillez réessayer.',
      launchError: 'Échec du lancement du scénario.',
      difficultyBeginner: 'Débutant',
      difficultyIntermediate: 'Intermédiaire',
      difficultyAdvanced: 'Avancé',
      searchPlaceholder: 'Rechercher des scénarios...',
      noMatchingScenarios: 'Aucun scénario trouvé'
    }
  }
})

const scenarios = ref<any[]>([])
const mySessions = ref<any[]>([])
const isLoading = ref(false)
const error = ref('')
const isLaunching = ref(false)
const launchingScenarioId = ref('')
const provisioningMessage = ref('')
const provisioningPhase = ref('')
const provisioningSessionId = ref('')
const provisioningAbortController = ref<AbortController | null>(null)
const searchQuery = ref('')

const sortedScenarios = computed(() => {
  return [...scenarios.value].sort((a, b) => {
    // Score: launchable (2), has session but not launchable (1), neither (0)
    const score = (s: any) => {
      if (s.launchable) return 2
      if (getExistingSession(s)) return 1
      return 0
    }
    return score(b) - score(a)
  })
})

const filteredScenarios = computed(() => {
  if (!searchQuery.value.trim()) return sortedScenarios.value
  const q = searchQuery.value.toLowerCase()
  return sortedScenarios.value.filter(
    s => (s.title || '').toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q)
  )
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

function getScenarioBlockReason(scenario: any): string | null {
  if (scenario.launchable) return null
  return scenario.block_reason || 'offline'
}

function getUnavailableReason(scenario: any): string {
  const reason = getScenarioBlockReason(scenario)
  switch (reason) {
    case 'plan':
      return t('launcher.unavailablePlan')
    case 'no_distribution':
      return t('launcher.unavailableNoDistribution')
    case 'offline':
    default:
      return t('launcher.unavailableOffline')
  }
}

function getUnavailableHint(scenario: any): string {
  const reason = getScenarioBlockReason(scenario)
  switch (reason) {
    case 'plan':
      // Org-managed subscribers can't upgrade — show nothing
      if (isAssignedSubscription.value) return ''
      return t('launcher.unavailablePlanHint')
    case 'no_distribution':
      return t('launcher.unavailableNoDistributionHint')
    case 'offline':
    default:
      return t('launcher.unavailableOfflineHint')
  }
}

async function loadScenarios() {
  isLoading.value = true
  error.value = ''
  try {
    const [scenarioData] = await Promise.all([
      scenarioSessionService.listScenarios(currentOrgId.value || undefined),
      scenarioSessionService.getMyScenarioSessions().then(sessions => { mySessions.value = sessions }).catch(() => {})
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
  provisioningPhase.value = 'terminal_creation'
  provisioningSessionId.value = ''

  const abortController = new AbortController()
  provisioningAbortController.value = abortController

  try {
    const result = await scenarioSessionService.launchScenario(scenario.id, {
      organization_id: currentOrgId.value || undefined
    })
    provisioningSessionId.value = result.scenario_session_id
    provisioningPhase.value = result.provisioning_phase || ''

    if (abortController.signal.aborted) return

    // Wait for scenario to be ready if still provisioning
    if (result.status === 'provisioning') {
      await pollProvisioningStatus(result.scenario_session_id, (phase) => {
        provisioningPhase.value = phase
      }, abortController.signal)
    }

    if (abortController.signal.aborted) return

    provisioningMessage.value = ''
    provisioningPhase.value = ''
    provisioningSessionId.value = ''
    router.push({ name: 'TerminalSessionView', params: { sessionId: result.terminal_session_id } })
  } catch (err: any) {
    if (abortController.signal.aborted) return
    provisioningMessage.value = ''
    provisioningPhase.value = ''
    provisioningSessionId.value = ''
    const msg = err.message === 'SETUP_FAILED' ? t('launcher.setupFailed')
      : err.message === 'SETUP_TIMEOUT' ? t('launcher.setupTimeout')
      : err.response?.data?.error_message || err.message || t('launcher.launchError')
    showError(msg)
  } finally {
    isLaunching.value = false
    launchingScenarioId.value = ''
    provisioningAbortController.value = null
  }
}

async function handleCancelProvisioning() {
  const sessionId = provisioningSessionId.value
  // Abort the polling loop
  provisioningAbortController.value?.abort()

  // Reset UI state
  provisioningMessage.value = ''
  provisioningPhase.value = ''
  provisioningSessionId.value = ''
  isLaunching.value = false
  launchingScenarioId.value = ''

  // Abandon the session on the backend
  if (sessionId) {
    try {
      await scenarioSessionService.abandonSession(sessionId)
    } catch {
      // Best-effort — session may already be cleaned up
    }
  }

  // Reload scenarios to refresh session states
  await loadScenarios()
}

onMounted(loadScenarios)

// Re-fetch scenarios when org context changes (different plan = different availability)
watch(currentOrgId, () => {
  loadScenarios()
})
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

.card-title-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  min-width: 0;
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

/* Search bar */
.search-bar {
  margin-bottom: var(--spacing-lg);
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input-wrapper i {
  position: absolute;
  left: var(--spacing-md);
  color: var(--color-text-muted);
}

.search-input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md) var(--spacing-sm) var(--spacing-2xl);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--border-radius-md);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.search-input::placeholder {
  color: var(--color-text-muted);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
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
