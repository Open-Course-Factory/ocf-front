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
        data-testid="scenario-card"
        :data-scenario-name="scenario.name || scenario.title"
        :class="{ 'scenario-card--unavailable': isBlocked(scenario) && !getExistingSession(scenario), 'scenario-card--active': !!getExistingSession(scenario) }"
      >
        <div class="card-header">
          <div class="card-title-row">
            <h3 class="card-title">{{ cardTitle(scenario) }}</h3>
            <AdminBadge v-if="scenario.admin_only" icon-only />
          </div>
          <span v-if="scenario.difficulty" class="difficulty-badge" :class="'difficulty-' + scenario.difficulty">
            {{ translateDifficulty(scenario.difficulty) }}
          </span>
        </div>
        <p v-if="cardDescription(scenario)" class="card-description">{{ cardDescription(scenario) }}</p>
        <div class="card-meta">
          <span v-if="formatMinutes(scenario.estimated_time_minutes, uiLocale)" class="meta-item">
            <i class="fas fa-clock"></i> {{ formatMinutes(scenario.estimated_time_minutes, uiLocale) }}
          </span>
          <span v-if="scenario.os_type" class="os-badge">
            <i class="fas fa-linux os-badge-icon"></i>
            {{ scenario.os_type }}
          </span>
          <span
            v-if="scenario.resolved_distribution"
            :class="['os-badge', { 'os-badge--muted': isBlocked(scenario) }]"
            :title="t('launcher.imageTitle')"
          >
            <i class="fas fa-compact-disc os-badge-icon" aria-hidden="true"></i>
            {{ scenario.resolved_distribution }}
          </span>
          <span
            v-if="scenario.resolved_size"
            :class="['os-badge', { 'os-badge--warning': isSizeSubstituted(scenario), 'os-badge--muted': isBlocked(scenario) }]"
            :title="isSizeSubstituted(scenario)
              ? t('launcher.sizeSubstituted', { declared: scenario.instance_type, resolved: scenario.resolved_size })
              : t('launcher.sizeTitle')"
          >
            <i
              :class="isSizeSubstituted(scenario) ? 'fas fa-exclamation-triangle os-badge-icon' : 'fas fa-microchip os-badge-icon'"
              aria-hidden="true"
            ></i>
            {{ scenario.resolved_size }}
          </span>
          <!-- Degraded mode: the backend could not resolve a launch (or predates
               resolved_*). Show what the scenario asked for, with no verdict on
               it — the unavailability notice below carries the explanation. -->
          <span v-else-if="scenario.instance_type" :class="['os-badge', { 'os-badge--muted': isBlocked(scenario) }]">
            <i class="fas fa-microchip os-badge-icon" aria-hidden="true"></i>
            {{ scenario.instance_type }}
          </span>
        </div>

        <!-- Unavailability explanation -->
        <div v-if="isBlocked(scenario)" class="unavailable-notice" data-testid="scenario-unavailable-notice">
          <div class="unavailable-notice-content">
            <i :class="getBlockReasonIcon(scenario)" class="unavailable-notice-icon"></i>
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
            <i :class="canResume(scenario) ? 'fas fa-play-circle' : 'fas fa-check-circle'" class="existing-session-icon"></i>
            <span class="existing-session-text">{{ getExistingSessionLabel(scenario) }}</span>
          </div>
        </div>

        <div class="card-actions">
          <!-- A scenario offered in more than one language lets the learner pick
               before starting. The world is built in that language and cannot be
               rebuilt afterwards, so this is a decision rather than a
               preference — which is why it sits next to the button that commits
               to it, and disappears once a run is under way.

               Above the branch chain rather than inside it: the choice belongs
               to the card, and threading it through each branch would put the
               same select in three places. -->
          <label
            v-if="showsLanguageChoice(scenario)"
            class="ocf-language-choice"
            :title="t('launcher.languageHint')"
          >
            <span class="ocf-language-label">{{ t('launcher.language') }}</span>
            <select
              class="ocf-language-select"
              data-testid="scenario-language-select"
              :value="localeFor(scenario)"
              :disabled="isLaunching"
              @change="selectedLocales[scenario.id] = ($event.target as HTMLSelectElement).value"
            >
              <option v-for="code in scenario.available_locales" :key="code" :value="code">
                {{ languageName(code) }}
              </option>
            </select>
          </label>

          <!-- Live run: resume -->
          <router-link
            v-if="canResume(scenario) && getExistingSession(scenario)?.terminal_session_id"
            :to="{ name: 'TerminalSessionView', params: { sessionId: getExistingSession(scenario).terminal_session_id } }"
            class="btn btn-primary launch-btn"
            data-testid="scenario-resume-btn"
          >
            <i class="fas fa-play"></i>
            {{ t('launcher.resume') }}
          </router-link>
          <!-- A past run: review it, and start another. The relaunch button is
               disabled rather than removed when something blocks it — a button
               that disappears leaves the card with no way forward and moves
               everything below it. -->
          <div v-else-if="getExistingSession(scenario)" class="card-actions-row">
            <router-link
              v-if="getExistingSession(scenario).terminal_session_id"
              :to="{ name: 'TerminalSessionView', params: { sessionId: getExistingSession(scenario).terminal_session_id } }"
              class="btn btn-secondary launch-btn"
              data-testid="scenario-review-btn"
            >
              <i class="fas fa-eye"></i>
              {{ t('launcher.review') }}
            </router-link>
            <button
              class="btn btn-primary launch-btn"
              data-testid="scenario-relaunch-btn"
              :disabled="isLaunching || !scenario.launchable"
              :title="scenario.launchable ? '' : getUnavailableReason(scenario)"
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
            data-testid="scenario-launch-btn"
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
import { useDunningRejection } from '../../composables/useDunningRejection'
import AdminBadge from '../Common/AdminBadge.vue'
import ScenarioProvisioningOverlay from '../Terminal/ScenarioProvisioningOverlay.vue'
import { isAssignedSubscription } from '../../utils/subscriptionHelpers'
import { getSavedLocale } from '../../services/core/storage'
import { formatMinutes } from '../../utils/formatters'

const router = useRouter()
const { showError, showConfirm } = useNotification()
const { isDunningRejection, getDunningCopy } = useDunningRejection()
const organizationsStore = useOrganizationsStore()
const subscriptionsStore = useSubscriptionsStore()
const currentOrgId = computed(() => organizationsStore.currentOrganization?.id || '')

const isAssigned = computed(() => isAssignedSubscription(subscriptionsStore.currentSubscription))

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
      language: 'Language',
      languageHint: 'The scenario runs in this language. It cannot be changed once started.',
      sessionActive: 'Scenario in progress',
      alreadyRunning: 'You are already running this scenario. Resume it from its card.',
      sessionCompleted: 'Scenario completed',
      sessionAbandoned: 'Scenario abandoned',
      sessionEnded: 'Previous run ended',
      sessionExists: 'Scenario already started',
      unavailableTitle: 'Scenario unavailable',
      unavailableNoDistribution: 'No compatible machine available for this scenario.',
      unavailableOffline: 'The required server is currently offline.',
      unavailablePlan: 'The required machine size is not included in your current plan.',
      unavailablePlanHint: 'Upgrade your plan to access larger machines.',
      unavailableOfflineHint: 'The required machines may be temporarily offline. Try again later.',
      unavailableNoDistributionHint: 'Contact your administrator to configure compatible machines.',
      unavailableBudget: 'Your resource budget is fully used by your current sessions.',
      unavailableBudgetHint: 'Stop a running session to free capacity, or upgrade your plan.',
      unavailableSize: 'This scenario needs a machine larger than your plan allows.',
      unavailableSizeHint: 'Upgrade your plan to run it — stopping a session will not free enough capacity.',
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
      noMatchingScenarios: 'No matching scenarios',
      imageTitle: 'Image this scenario will run on',
      sizeTitle: 'Machine size this scenario will run at',
      sizeSubstituted: 'This scenario asks for size "{declared}", which is not a machine size the platform offers. It will start at size "{resolved}".'
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
      language: 'Langue',
      languageHint: 'Le scénario se déroule dans cette langue. Elle ne peut plus être changée une fois lancé.',
      sessionActive: 'Scénario en cours',
      alreadyRunning: 'Vous avez déjà un scénario en cours. Reprenez-le depuis sa carte.',
      sessionCompleted: 'Scénario terminé',
      sessionAbandoned: 'Scénario abandonné',
      sessionEnded: 'Session précédente terminée',
      sessionExists: 'Scénario déjà lancé',
      unavailableTitle: 'Scénario indisponible',
      unavailableNoDistribution: 'Aucune machine compatible disponible pour ce scénario.',
      unavailableOffline: 'Le serveur requis est actuellement hors ligne.',
      unavailablePlan: 'La taille de machine requise n\'est pas incluse dans votre plan actuel.',
      unavailablePlanHint: 'Mettez à niveau votre plan pour accéder aux machines plus puissantes.',
      unavailableOfflineHint: 'Les machines requises sont peut-être temporairement hors ligne. Réessayez plus tard.',
      unavailableNoDistributionHint: 'Contactez votre administrateur pour configurer des machines compatibles.',
      unavailableBudget: 'Votre budget de ressources est entièrement utilisé par vos sessions en cours.',
      unavailableBudgetHint: 'Arrêtez une session en cours pour libérer de la capacité, ou mettez à niveau votre plan.',
      unavailableSize: 'Ce scénario demande une machine plus grande que ce que permet votre offre.',
      unavailableSizeHint: 'Passez à une offre supérieure pour le lancer — arrêter une session ne libérera pas assez de capacité.',
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
      noMatchingScenarios: 'Aucun scénario trouvé',
      imageTitle: 'Image sur laquelle ce scénario va démarrer',
      sizeTitle: 'Taille de machine sur laquelle ce scénario va démarrer',
      sizeSubstituted: 'Ce scénario demande la taille « {declared} », qui n\'est pas une taille de machine proposée par la plateforme. Il démarrera en taille « {resolved} ».'
    }
  }
})

const scenarios = ref<any[]>([])
const mySessions = ref<any[]>([])

// True when the scenario's declared size is not the one it will run at, which
// happens when the declared value is not a machine size at all. Both values
// come from the backend, which owns the fallback rule — the comparison here is
// only about how to label the badge.
function isSizeSubstituted(scenario: any): boolean {
  const declared = scenario.instance_type
  const resolved = scenario.resolved_size
  if (!declared || !resolved) return false
  return declared.toUpperCase() !== resolved.toUpperCase()
}
const uiLocale = getSavedLocale()

// Which language each card is set to launch in. Keyed by scenario so switching
// one card never moves another.
const selectedLocales = ref<Record<string, string>>({})

/**
 * The language a card will launch in.
 *
 * Defaults to the interface language when the scenario offers it, because a
 * learner reading the app in French almost certainly wants the French world.
 * Otherwise it takes the first language the backend offered, which is the
 * scenario's own.
 *
 * The list itself is never computed here: the backend decides which languages
 * are complete enough to launch, and re-deciding that in a client is how one
 * rule comes to be written twice.
 */
function localeFor(scenario: any): string {
  const offered: string[] = scenario.available_locales || []
  if (!offered.length) return ''
  const chosen = selectedLocales.value[scenario.id]
  if (chosen && offered.includes(chosen)) return chosen
  return offered.includes(uiLocale) ? uiLocale : offered[0]
}

/**
 * Whether this card should offer a language choice.
 *
 * Only when more than one is on offer, and only while a launch is still
 * ahead: a session already running was built in one language and cannot be
 * rebuilt, so showing a picker over it would offer something that cannot
 * happen.
 */
function showsLanguageChoice(scenario: any): boolean {
  if (!scenario.launchable) return false
  if ((scenario.available_locales || []).length < 2) return false
  const session = getExistingSession(scenario)
  return !(session?.terminal_session_id && session.status === 'active')
}

/**
 * The card's words in the language the picker is set to.
 *
 * A learner changing that dropdown is choosing what they are about to read, so
 * the card has to show it — a French title above an English description would
 * make the choice look like it had not taken.
 *
 * The text for every offered language arrives with the card, so switching
 * costs nothing and never blanks while waiting on the server.
 */
function cardText(scenario: any): { title?: string; description?: string } {
  const text = scenario.localised_text || {}
  return text[localeFor(scenario)] || {}
}

function cardTitle(scenario: any): string {
  return cardText(scenario).title || scenario.title
}

function cardDescription(scenario: any): string {
  return cardText(scenario).description || scenario.description || ''
}

/**
 * A language's name in its own language — "Français", not "French".
 *
 * Capitalised on the way out: French does not capitalise its language names, so
 * Intl returns "français", which reads as a mistake sitting under a "Language"
 * label beside "English". The list is a set of labels here, not running prose.
 */
function languageName(locale: string): string {
  let name = locale
  try {
    name = new Intl.DisplayNames([locale], { type: 'language' }).of(locale) || locale
  } catch {
    return locale
  }
  return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1)
}

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

// Index mySessions by scenario_id once per reactive change.
// The template calls getExistingSession() several times per card and the
// sort/filter computeds also hit it per scenario, so a linear scan over
// mySessions inside the helper was O(N·M) per render — the dominant cost
// when the launcher has many scenarios.
const existingSessionByScenario = computed(() => {
  const map = new Map<string, any>()
  for (const s of mySessions.value) {
    if (s?.scenario_id) map.set(s.scenario_id, s)
  }
  return map
})

function getExistingSession(scenario: any): any | null {
  // The availability response reports the live run using the same rule the
  // launch path applies, in the same request that produced this card. Prefer it
  // over the separately fetched session list, which is a second read of the
  // same fact and can predate the page: a stale list is how a card came to
  // offer Launch for a scenario the learner was already running, and the launch
  // then failed.
  if (scenario.block_reason === 'session_exists' && scenario.active_session_id) {
    return {
      id: scenario.active_session_id,
      scenario_id: scenario.id,
      terminal_session_id: scenario.active_terminal_session_id,
      status: 'active',
      resumable: true
    }
  }
  return existingSessionByScenario.value.get(scenario.id) || null
}

// Whether the learner can return to a past run — the backend's verdict, never
// re-derived from `status`. A session stays "active" in the database until
// something notices its terminal is gone, so reading the status here offered a
// Resume button into a container deleted the day before, and hid every way to
// start the scenario again.
function canResume(scenario: any): boolean {
  return getExistingSession(scenario)?.resumable === true
}

// A scenario the learner is already running is not unavailable — it is waiting
// for them. Only the reasons that genuinely stop a run should dim the card,
// mute its badges, or raise the unavailability notice.
function isBlocked(scenario: any): boolean {
  return !scenario.launchable && scenario.block_reason !== 'session_exists'
}

function getExistingSessionLabel(scenario: any): string {
  const session = getExistingSession(scenario)
  if (!session) return ''
  // A run that cannot be resumed is a past run, whatever the row still says.
  if (!session.resumable && (session.status === 'active' || session.status === 'provisioning')) {
    return t('launcher.sessionEnded')
  }
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

function getBlockReasonIcon(scenario: any): string {
  switch (getScenarioBlockReason(scenario)) {
    case 'budget_exhausted':
      return 'fas fa-battery-quarter'
    case 'size_over_plan':
      return 'fas fa-lock'
    case 'plan':
      return 'fas fa-lock'
    case 'no_distribution':
      return 'fas fa-exclamation-triangle'
    default:
      return 'fas fa-server'
  }
}

// The backend emits block_reason 'no_distribution', 'budget_exhausted' and
// 'size_over_plan' (scenarioLaunchController). 'plan' and 'offline' are kept as
// defensive fallbacks only — without a budget branch, an out-of-budget student
// used to be told the server was down.
//
// 'size_over_plan' exists because the budget message is a lie for it: a machine
// bigger than the plan can ever host does not become available by stopping
// something, and a learner running nothing was told their budget was "fully
// used by your current sessions".
function getUnavailableReason(scenario: any): string {
  const reason = getScenarioBlockReason(scenario)
  switch (reason) {
    case 'budget_exhausted':
      return t('launcher.unavailableBudget')
    case 'size_over_plan':
      return t('launcher.unavailableSize')
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
    case 'budget_exhausted':
      // Org-managed subscribers can't upgrade — the stop-a-session half of
      // the hint still applies, so keep it either way.
      return t('launcher.unavailableBudgetHint')
    case 'size_over_plan':
      // Stopping a session cannot help here, so the hint must not suggest it.
      if (isAssigned.value) return ''
      return t('launcher.unavailableSizeHint')
    case 'plan':
      // Org-managed subscribers can't upgrade — show nothing
      if (isAssigned.value) return ''
      return t('launcher.unavailablePlanHint')
    case 'no_distribution':
      return t('launcher.unavailableNoDistributionHint')
    case 'offline':
    default:
      return t('launcher.unavailableOfflineHint')
  }
}

// Discard out-of-order responses. onMounted + watch(currentOrgId) can both
// fire loadScenarios concurrently; without this guard, a slower earlier
// request can overwrite the result of a newer one, flashing stale data and
// triggering an extra re-render.
let loadGeneration = 0

async function loadScenarios() {
  const gen = ++loadGeneration
  isLoading.value = true
  error.value = ''
  try {
    const [scenarioData] = await Promise.all([
      scenarioSessionService.listScenarios(currentOrgId.value || undefined),
      scenarioSessionService.getMyScenarioSessions()
        .then(sessions => { if (gen === loadGeneration) mySessions.value = sessions })
        .catch(() => {})
    ])
    if (gen !== loadGeneration) return
    scenarios.value = scenarioData
  } catch (err: any) {
    if (gen !== loadGeneration) return
    error.value = err.response?.data?.error_message || t('launcher.loading')
  } finally {
    if (gen === loadGeneration) isLoading.value = false
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
      organization_id: currentOrgId.value || undefined,
      locale: localeFor(scenario) || undefined
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
    // Dunning (past-due) 402: offer the subscription dashboard so the user can
    // settle the overdue invoice, instead of toasting the raw backend text.
    if (isDunningRejection(err)) {
      const copy = getDunningCopy()
      const confirmed = await showConfirm(copy.message, copy.title, {
        confirmButtonText: copy.action,
        cancelButtonText: copy.dismiss
      })
      if (confirmed) {
        Promise.resolve(router.push('/subscription-dashboard')).catch(() => {})
      }
      return
    }
    // Budget rejection at launch time (structured 403, source=budget): reuse
    // the same copy the card shows for block_reason=budget_exhausted, so the
    // two surfaces cannot tell the user two different stories.
    if (err.response?.status === 403 && err.response?.data?.source === 'budget') {
      showError(`${t('launcher.unavailableBudget')} ${t('launcher.unavailableBudgetHint')}`)
      return
    }
    // 409: the learner already has a run of this scenario. That is not a
    // failure to report — the card simply predates the run. Reload so it turns
    // into Resume, and say so.
    if (err.response?.status === 409 && err.response?.data?.reason === 'session_exists') {
      showError(t('launcher.alreadyRunning'))
      await loadScenarios()
      return
    }
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

onMounted(() => {
  loadScenarios()
})

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

/* A badge states what the scenario will run on. That is a fact, not a verdict,
   so it carries no status colour: painting it success-green made an unaffordable
   size read as available, contradicting the unavailability notice on the same
   card. Colour here is reserved for the two cases that genuinely deviate —
   a substituted size (warning) and a scenario the reader cannot launch (muted). */
.os-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px var(--spacing-sm);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border-medium);
}

.os-badge-icon {
  font-size: 9px;
}

/* Applied when the backend says the scenario is not launchable, so the badge
   agrees with the notice below it instead of competing with it. */
.os-badge--muted {
  opacity: 0.6;
}

.os-badge--warning {
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
  border-color: var(--color-warning-border);
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

.ocf-language-choice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.6rem;
  font-size: 0.85rem;
}

.ocf-language-label {
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.ocf-language-select {
  flex: 1;
  min-width: 0;
  padding: 0.3rem 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background);
  color: var(--color-text-primary);
  font-size: 0.85rem;
}

.ocf-language-select:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}

.ocf-language-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
