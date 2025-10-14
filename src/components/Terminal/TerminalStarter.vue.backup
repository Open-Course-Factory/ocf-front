<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <div class="terminal-starter">
    <!-- Debug info en mode développement -->
    <div v-if="showDebug" class="debug-panel">
      <h4>Debug Info</h4>
      <p>showStartPanel: {{ showStartPanel }}</p>
      <p>showInfoPanel: {{ showInfoPanel }}</p>
      <p>showTerminalPanel: {{ showTerminalPanel }}</p>
      <p>isStarting: {{ isStarting }}</p>
      <p>terminal initialized: {{ !!terminal }}</p>
      <p>sessionInfo: {{ !!sessionInfo }}</p>
      <hr>
      <p>instanceTypes.length: {{ instanceTypes.length }}</p>
      <p>allowedInstanceTypes.length: {{ allowedInstanceTypes.length }}</p>
      <p>selectedInstanceType: {{ selectedInstanceType }}</p>
      <p>allowedMachineSizes: {{ allowedMachineSizes }}</p>
      <p>loadingInstanceTypes: {{ loadingInstanceTypes }}</p>
      <p>currentSubscription: {{ !!currentSubscription }}</p>
      <hr>
      <div>
        <strong>All Instances:</strong>
        <pre>{{ JSON.stringify(instanceTypes, null, 2) }}</pre>
      </div>
    </div>

    <!-- Panneau de démarrage -->
    <SettingsCard v-show="showStartPanel" :title="t('terminals.startNewSession')">
      <template #headerActions>
        <div class="header-actions-group">
          <!-- Compact Capacity Check -->
          <div v-if="selectedInstanceType" class="capacity-check-inline" :class="`status-${capacityStatusLevel}`">
            <i :class="capacityStatusIcon"></i>
            <span class="capacity-text">{{ capacityStatusText }}</span>
          </div>

          <Button
            type="button"
            variant="primary"
            size="md"
            :icon="isStarting ? 'fas fa-spinner fa-spin' : 'fas fa-rocket'"
            :disabled="!selectedInstanceType || isStarting"
            :loading="isStarting"
            @click="startNewSession"
          >
            {{ isStarting ? t('terminalStarter.buttonStarting') : t('terminalStarter.launchTerminal') }}
          </Button>
        </div>
      </template>

      <!-- Primary: Instance Type Selection -->
      <FormGroup
        :label="t('terminalStarter.instanceType')"
        id="instanceType"
        :help-text="t('terminalStarter.selectEnvironmentType')"
      >
        <!-- Search/Filter for many instances -->
        <div v-if="instanceTypes.length > 6" class="instance-search">
          <input
            v-model="instanceSearchTerm"
            type="text"
            :placeholder="t('terminalStarter.searchInstances')"
            @input="filterInstances"
          >
          <div class="instance-filters">
            <Button
              v-for="filterOption in availableFilters"
              :key="filterOption.key"
              size="sm"
              :variant="activeFilter === filterOption.key ? 'primary' : 'outline-secondary'"
              @click="setFilter(filterOption.key)"
            >
              {{ filterOption.label }} ({{ filterOption.count }})
            </Button>
          </div>
        </div>

        <!-- Instance Type Cards -->
        <div
          class="instance-types-grid"
          :class="{ 'compact': instanceTypes.length > 10 }"
        >
          <!-- Empty state when no instances match filters -->
          <div v-if="displayedInstanceTypes.length === 0" class="no-instances-found">
            <i class="fas fa-search"></i>
            <h5>{{ t('terminalStarter.noInstancesFound') }}</h5>
            <p v-if="instanceSearchTerm">
              {{ t('terminalStarter.noMatchingInstances', { searchTerm: instanceSearchTerm }) }}
            </p>
            <p v-else-if="activeFilter === 'available'">
              {{ t('terminalStarter.noAvailableInstances') }}
            </p>
            <p v-else-if="activeFilter === 'restricted'">
              {{ t('terminalStarter.allInstancesAvailable') }}
            </p>
            <Button
              v-if="instanceSearchTerm || activeFilter !== 'all'"
              size="sm"
              variant="primary"
              @click="clearFilters"
            >
              {{ t('terminalStarter.clearFilters') }}
            </Button>
          </div>

          <!-- Instance cards -->
          <div
            v-for="instance in displayedInstanceTypes"
            :key="instance.prefix"
            class="instance-card"
            :class="{
              'available': instanceAvailabilityMap.get(instance.prefix)?.available,
              'restricted': !instanceAvailabilityMap.get(instance.prefix)?.available,
              'selected': selectedInstanceType === instance.prefix
            }"
            @click="selectInstance(instance)"
          >
            <div class="instance-header">
              <div class="instance-info">
                <h5>{{ getTranslatedInstanceName(instance) }}</h5>
                <p>{{ getTranslatedInstanceDescription(instance) }}</p>
              </div>
              <div class="instance-status">
                <i v-if="instanceAvailabilityMap.get(instance.prefix)?.available"
                   class="fas fa-check-circle text-success"></i>
                <i v-else class="fas fa-lock text-warning"></i>
              </div>
            </div>

            <!-- Size badges -->
            <div class="size-badges">
              <span
                v-for="size in instanceUtils.getSizeDisplay(instance.size)"
                :key="size"
                class="size-badge"
                :class="{
                  'available': instanceUtils.isSizeAllowed(size, allowedMachineSizes),
                  'restricted': !instanceUtils.isSizeAllowed(size, allowedMachineSizes)
                }"
              >
                {{ size }}
              </span>
            </div>

            <!-- Availability message with upgrade button -->
            <div class="availability-message">
              <div v-if="instanceAvailabilityMap.get(instance.prefix)?.available"
                   class="available-message">
                <small class="text-success">
                  <i class="fas fa-check"></i> {{ t('terminalStarter.availableInPlan') }}
                </small>
              </div>
              <div v-else class="restricted-message">
                <small class="text-warning">
                  <i class="fas fa-exclamation-triangle"></i> {{ t('terminalStarter.requiresUpgrade') }}
                </small>
                <router-link to="/subscription-plans" class="upgrade-link">
                  <i class="fas fa-arrow-up"></i>
                  {{ t('terminalStarter.upgrade') }}
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </FormGroup>

      <div v-if="isStarting" class="progress-container">
        <div class="progress">
          <div class="progress-bar progress-bar-striped progress-bar-animated"
               role="progressbar"
               style="width: 100%">
          </div>
        </div>
        <p class="status-text">{{ startStatus }}</p>
      </div>

      <!-- Collapsible: Advanced Options -->
      <div class="collapsible-section">
        <button
          type="button"
          class="collapsible-header"
          @click="showAdvancedOptions = !showAdvancedOptions"
        >
          <i class="fas" :class="showAdvancedOptions ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
          {{ t('terminalStarter.advancedOptions') }}
        </button>
        <div v-show="showAdvancedOptions" class="collapsible-content">
          <FormGroup
            :label="t('terminalStarter.nameOptional')"
            id="terminalName"
            :help-text="t('terminalStarter.nameHelp')"
          >
            <input
              id="terminalName"
              v-model="nameInput"
              type="text"
              maxlength="255"
              :placeholder="t('terminalStarter.namePlaceholder')"
            />
            <small v-if="nameInput.length > 0" class="char-count">{{ nameInput.length }}/255</small>
          </FormGroup>

          <div class="form-actions">
            <Button
              type="button"
              variant="secondary"
              icon="fas fa-undo"
              size="sm"
              :disabled="isStarting"
              @click="resetForm"
            >
              {{ t('terminalStarter.buttonReset') }}
            </Button>
          </div>
        </div>
      </div>

      <!-- Collapsible: Usage & Quota -->
      <div v-if="currentSubscription" class="collapsible-section">
        <button
          type="button"
          class="collapsible-header"
          @click="showUsageDetails = !showUsageDetails"
        >
          <i class="fas" :class="showUsageDetails ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
          {{ t('terminals.currentUsage') }}
          <span class="usage-badge">{{ currentTerminalCount }}/{{ maxTerminals }}</span>
        </button>
        <div v-show="showUsageDetails" class="collapsible-content">
          <div class="usage-header">
            <Button
              size="sm"
              variant="outline-primary"
              :icon="refreshingUsage ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'"
              :disabled="refreshingUsage"
              :title="t('terminals.refreshUsage')"
              @click="refreshUsage"
            >
              {{ t('ui.refresh') }}
            </Button>
          </div>

          <div class="usage-stats">
            <div class="usage-item">
              <span class="usage-label">
                <i class="fas fa-terminal"></i>
                {{ t('terminals.concurrentTerminals').charAt(0).toUpperCase() + t('terminals.concurrentTerminals').slice(1) }}:
              </span>
              <span class="usage-value">
                <span v-if="loadingUsage || refreshingUsage" class="text-muted">
                  <i class="fas fa-spinner fa-spin"></i>
                </span>
                <span v-else>{{ currentTerminalCount }}</span>
                / {{ maxTerminals }}
                <small class="text-muted">({{ t('terminals.planLimit') }})</small>
              </span>
            </div>
            <div class="usage-item">
              <span class="usage-label">
                <i class="fas fa-clock"></i>
                {{ t('terminals.sessionDuration').charAt(0).toUpperCase() + t('terminals.sessionDuration').slice(1) }}:
              </span>
              <span class="usage-value">
                {{ currentSubscription.plan_features?.session_duration_hours || 1 }}h
              </span>
            </div>
            <div v-if="allowedMachineSizes.length > 0" class="usage-item">
              <span class="usage-label">
                <i class="fas fa-server"></i>
                {{ t('terminalStarter.allowedSizes') }}:
              </span>
              <span class="usage-value">
                {{ allowedMachineSizes.join(', ') }}
              </span>
            </div>
          </div>
          <div class="usage-info">
            <small class="text-muted">
              <i class="fas fa-info-circle"></i>
              {{ t('terminals.autoRefreshInfo', { minutes: refreshIntervalMinutes }) }}
            </small>
          </div>
        </div>
      </div>
    </SettingsCard>

    <!-- Panneau d'information de session -->
    <SettingsCard v-show="showInfoPanel && sessionInfo">
      <template #default>
        <div class="session-header">
          <span class="session-title">
            <i class="fas fa-terminal"></i>
            Session Terminal: {{ sessionInfo?.session_id }}
          </span>
          <div class="session-actions">
            <span class="time-remaining" v-if="timeRemaining > 0">
              <i class="fas fa-clock"></i>
              {{ t('terminalStarter.timeRemaining') }}: {{ formatTime(timeRemaining) }}
            </span>
            <Button
              variant="danger"
              size="sm"
              :icon="isStopping ? 'fas fa-spinner fa-spin' : 'fas fa-stop'"
              :disabled="isStopping"
              :loading="isStopping"
              @click="stopSession"
            >
              {{ t('terminalStarter.stop') }}
            </Button>
          </div>
        </div>

        <div class="session-details">
          <div class="detail-item" v-if="selectedInstanceInfo">
            <strong><i class="fas fa-server"></i> {{ t('terminalStarter.instanceType') }}</strong>
            <span class="instance-info">
              {{ getTranslatedInstanceName(selectedInstanceInfo) }} - {{ getTranslatedInstanceDescription(selectedInstanceInfo) }}
              <small class="text-muted">({{ selectedInstanceInfo.prefix }})</small>
            </span>
          </div>
          <div class="detail-item">
            <strong><i class="fas fa-info-circle"></i> {{ t('terminalStarter.status') }}</strong>
            <span :class="getStatusClass(sessionInfo?.status)">
              {{ sessionInfo?.status }}
            </span>
          </div>
        </div>
      </template>
    </SettingsCard>

    <!-- Panneau du terminal -->
    <SettingsCard v-show="showTerminalPanel" title="Console Terminal">
      <template #headerActions>
        <Button
          variant="warning"
          size="sm"
          icon="fas fa-sync"
          v-show="showReconnectButton"
          @click="reconnectTerminal"
        >
          {{ t('terminalStarter.reconnect') }}
        </Button>

        <div class="connection-status">
          <span v-if="isConnected" class="status-connected">
            <i class="fas fa-circle"></i> {{ t('terminalStarter.connected') }}
          </span>
          <span v-else class="status-disconnected">
            <i class="fas fa-circle"></i> {{ t('terminalStarter.disconnected') }}
          </span>
        </div>
      </template>

      <div class="terminal-wrapper">
        <div ref="terminalRef" class="terminal-container"></div>
        <div v-if="!terminal" class="terminal-placeholder">
          <i class="fas fa-terminal fa-3x"></i>
          <p>{{ t('terminalStarter.initializingTerminal') }}</p>
          <p v-if="terminalError" class="text-danger">{{ terminalError }}</p>
        </div>
      </div>

      <div class="terminal-footer">
        <div class="terminal-info">
          <small class="text-muted">
            Session: {{ sessionInfo?.session_id }} |
            Statut: {{ sessionInfo?.status }} |
            <span v-if="selectedInstanceInfo">Instance: {{ selectedInstanceInfo.name }} ({{ selectedInstanceInfo.prefix }}) | </span>
            <span v-if="isConnected" class="text-success">{{ t('terminalStarter.websocketConnected') }}</span>
            <span v-else class="text-danger">{{ t('terminalStarter.websocketDisconnected') }}</span>
          </small>
        </div>
      </div>
    </SettingsCard>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import axios from 'axios'
import { terminalService, instanceUtils } from '../../services/terminalService'
import { useSubscriptionsStore } from '../../stores/subscriptions'
import { useTerminalMetricsStore } from '../../stores/terminalMetrics'
import { useNotification } from '../../composables/useNotification'
import { useTranslations } from '../../composables/useTranslations'
import SettingsCard from '../UI/SettingsCard.vue'
import Button from '../UI/Button.vue'
import FormGroup from '../UI/FormGroup.vue'

// Définir les émissions
const emit = defineEmits(['session-started'])

// Stores
const subscriptionsStore = useSubscriptionsStore()
const metricsStore = useTerminalMetricsStore()

// i18n setup
const { t } = useTranslations({
  en: {
    terminalStarter: {
      launchTerminal: 'Launch Terminal',
      advancedOptions: 'Advanced Options',
      allowedSizes: 'Allowed Sizes',
      readyToLaunch: 'Ready to Launch',
      capacityIssue: 'Capacity Issue',
      checkingCapacity: 'Checking...',
      nameOptional: 'Terminal Name (Optional)',
      namePlaceholder: 'My terminal...',
      nameHelp: 'Give your terminal a custom name to easily find it. Maximum 255 characters.',
      termsRequired: 'Terms of Use (Mandatory)',
      termsPlaceholder: 'I accept the terms of use of the terminal service.',
      termsHelp: 'Optionally, you can specify custom terms of use for this terminal session.',
      expirySeconds: 'Session Duration (seconds)',
      expiryHelpBase: 'Between {min} seconds (1 min) and {max} seconds ({maxHours}h max).',
      expiryHelpPlanLimit: 'Limited to {planHours}h by your {planName} plan.',
      expiryPlaceholder: '{max} ({maxHours}h maximum for your plan)',
      instanceType: 'Instance Type',
      selectEnvironmentType: 'Select your terminal environment type.',
      yourPlanAllows: 'Your plan allows',
      searchInstances: 'Search instances...',
      noInstancesFound: 'No instances found',
      noMatchingInstances: 'No instances match "{searchTerm}"',
      noAvailableInstances: 'No instances available for your current plan.',
      allInstancesAvailable: 'All instances are available.',
      clearFilters: 'Clear filters',
      allInstances: 'All',
      availableInstances: 'Available',
      restrictedInstances: 'Restricted',
      availableInPlan: 'Available in your plan',
      requiresUpgrade: 'Requires plan upgrade',
      upgrade: 'Upgrade',
      buttonStarting: 'Starting...',
      buttonStart: 'Start Terminal',
      buttonReset: 'Reset',
      startingSession: 'Starting terminal session...',
      checkingLimits: 'Checking usage limits...',
      sendingRequest: 'Sending request to server...',
      sessionCreated: 'Session created, initializing terminal...',
      currentUsage: 'Current Usage',
      refreshUsage: 'Refresh usage',
      concurrentTerminals: 'concurrent terminals',
      sessionDuration: 'session duration',
      planLimit: 'plan limit',
      autoRefreshInfo: 'Usage data is automatically refreshed every {minutes} minutes.',
      initializingTerminal: 'Initializing terminal...',
      websocketConnected: 'WebSocket connected',
      websocketDisconnected: 'WebSocket disconnected',
      connected: 'Connected',
      disconnected: 'Disconnected',
      reconnect: 'Reconnect',
      timeRemaining: 'Time remaining',
      stop: 'Stop',
      status: 'Status',
      sessionExpired: 'Your terminal session has expired',
      sessionExpiredTitle: 'Session Expired',
      errorValidationInstance: 'Please select an instance type',
      errorLimitReached: 'You have reached your limit of concurrent terminals. Please stop an existing terminal or upgrade your plan.',
      errorLimitReachedTitle: 'Limit Reached',
      errorInstanceNotAvailable: 'The selected instance is not available with your current plan. Please choose another instance or upgrade your plan.',
      errorInstanceNotAvailableTitle: 'Instance Not Available',
      errorInstanceRestricted: 'Instance Not Allowed',
      errorInstanceRestrictedDetails: 'Instance Not Allowed\n\nInstance "{name}" requires sizes: {required}\nYour plan allows: {allowed}\n\nPlease choose another instance or upgrade your plan.',
      errorUpgradePrompt: 'Would you like to view available plans to unlock this instance?',
      errorUpgradePromptTitle: 'Upgrade Plan',
      errorStarting: 'Startup Error',
      errorLoading: 'Failed to load instance types. Contact the administrator.',
      errorLoadingTitle: 'No instances available',
      errorLoadingFormat: 'Invalid data format for instance types.',
      errorLoadingFormatTitle: 'Loading Error',
      loadingModules: 'Loading xterm.js modules...',
      preparingSession: 'Preparing...',
      errorInitialization: 'Initialization Error',
      errorInitializationMessage: 'Unable to load the terminal. Please check that xterm.js dependencies are installed.',
      errorInstanceRestrictedMessage: 'Instance "{name}" requires sizes: {required}\nYour plan allows: {allowed}\n\nPlease choose another instance or upgrade your plan.',
      errorWebsocket: 'Connection Error',
      errorWebsocketMessage: 'Unable to connect to the terminal: {message}',
      errorStopping: 'Error stopping',
      errorStoppingMessage: 'Error stopping the session',
      errorServerCapacity: 'Server at Capacity',
      errorServerCapacityMessage: 'The server does not have enough resources to create a new terminal session. Please try again in a few minutes or stop an existing terminal.'
    }
  },
  fr: {
    terminalStarter: {
      launchTerminal: 'Lancer le Terminal',
      advancedOptions: 'Options Avancées',
      allowedSizes: 'Tailles Autorisées',
      readyToLaunch: 'Prêt à Lancer',
      capacityIssue: 'Problème de Capacité',
      checkingCapacity: 'Vérification...',
      nameOptional: 'Nom du Terminal (Optionnel)',
      namePlaceholder: 'Mon terminal...',
      nameHelp: 'Donnez un nom personnalisé à votre terminal pour le retrouver facilement. Maximum 255 caractères.',
      termsRequired: 'Conditions d\'Utilisation (Obligatoire)',
      termsPlaceholder: 'J\'accepte les conditions d\'utilisation du service terminal.',
      termsHelp: 'Vous pouvez optionnellement spécifier des conditions d\'utilisation personnalisées pour cette session terminal.',
      expirySeconds: 'Durée de la Session (secondes)',
      expiryHelpBase: 'Entre {min} secondes (1 min) et {max} secondes ({maxHours}h max).',
      expiryHelpPlanLimit: 'Limité à {planHours}h par votre plan {planName}.',
      expiryPlaceholder: '{max} ({maxHours}h maximum pour votre plan)',
      instanceType: 'Type d\'Instance',
      selectEnvironmentType: 'Sélectionnez le type d\'environnement de votre terminal.',
      yourPlanAllows: 'Votre plan autorise',
      searchInstances: 'Rechercher des instances...',
      noInstancesFound: 'Aucune instance trouvée',
      noMatchingInstances: 'Aucune instance ne correspond à "{searchTerm}"',
      noAvailableInstances: 'Aucune instance disponible pour votre plan actuel.',
      allInstancesAvailable: 'Toutes les instances sont disponibles.',
      clearFilters: 'Effacer les filtres',
      allInstances: 'Toutes',
      availableInstances: 'Disponibles',
      restrictedInstances: 'Restreintes',
      availableInPlan: 'Disponible dans votre plan',
      requiresUpgrade: 'Nécessite une mise à niveau',
      upgrade: 'Mettre à niveau',
      buttonStarting: 'Démarrage...',
      buttonStart: 'Démarrer le Terminal',
      buttonReset: 'Réinitialiser',
      startingSession: 'Démarrage de la session terminal...',
      checkingLimits: 'Vérification des limites d\'utilisation...',
      sendingRequest: 'Envoi de la requête au serveur...',
      sessionCreated: 'Session créée, initialisation du terminal...',
      currentUsage: 'Utilisation Actuelle',
      refreshUsage: 'Actualiser l\'utilisation',
      concurrentTerminals: 'terminaux simultanés',
      sessionDuration: 'durée de session',
      planLimit: 'limite du plan',
      autoRefreshInfo: 'Les données d\'utilisation sont automatiquement actualisées toutes les {minutes} minutes.',
      initializingTerminal: 'Initialisation du terminal...',
      websocketConnected: 'WebSocket connecté',
      websocketDisconnected: 'WebSocket déconnecté',
      connected: 'Connecté',
      disconnected: 'Déconnecté',
      reconnect: 'Reconnecter',
      timeRemaining: 'Temps restant',
      stop: 'Arrêter',
      status: 'Statut',
      sessionExpired: 'Votre session terminal a expiré',
      sessionExpiredTitle: 'Session expirée',
      errorValidationInstance: 'Veuillez sélectionner un type d\'instance',
      errorLimitReached: 'Vous avez atteint votre limite de terminaux simultanés. Veuillez arrêter un terminal existant ou mettre à niveau votre plan.',
      errorLimitReachedTitle: 'Limite atteinte',
      errorInstanceNotAvailable: 'L\'instance sélectionnée n\'est pas disponible avec votre plan actuel. Veuillez choisir une autre instance ou mettre à niveau votre plan.',
      errorInstanceNotAvailableTitle: 'Instance non disponible',
      errorInstanceRestricted: 'Instance non autorisée',
      errorInstanceRestrictedDetails: 'Instance non autorisée\n\nL\'instance "{name}" nécessite les tailles: {required}\nVotre plan autorise: {allowed}\n\nVeuillez choisir une autre instance ou mettre à niveau votre plan.',
      errorUpgradePrompt: 'Souhaitez-vous voir les plans disponibles pour débloquer cette instance ?',
      errorUpgradePromptTitle: 'Mettre à niveau le plan',
      errorStarting: 'Erreur de démarrage',
      errorLoading: 'Aucun type d\'instance disponible. Contactez l\'administrateur.',
      errorLoadingTitle: 'Aucune instance disponible',
      errorLoadingFormat: 'Format de données invalide pour les types d\'instances.',
      errorLoadingFormatTitle: 'Erreur de chargement',
      loadingModules: 'Chargement des modules xterm.js...',
      preparingSession: 'Préparation...',
      errorInitialization: 'Erreur d\'initialisation',
      errorInitializationMessage: 'Impossible de charger le terminal. Vérifiez que les dépendances xterm.js sont installées.',
      errorInstanceRestrictedMessage: 'L\'instance "{name}" nécessite les tailles: {required}\nVotre plan autorise: {allowed}\n\nVeuillez choisir une autre instance ou mettre à niveau votre plan.',
      errorWebsocket: 'Erreur de connexion',
      errorWebsocketMessage: 'Impossible de se connecter au terminal: {message}',
      errorStopping: 'Erreur d\'arrêt',
      errorStoppingMessage: 'Erreur lors de l\'arrêt de la session',
      errorServerCapacity: 'Serveur à Capacité Maximale',
      errorServerCapacityMessage: 'Le serveur n\'a pas suffisamment de ressources pour créer une nouvelle session terminal. Veuillez réessayer dans quelques minutes ou arrêter un terminal existant.'
    }
  }
})
const { showConfirm, showError: showErrorNotification, showWarning } = useNotification()

// Importation différée de xterm.js pour éviter les erreurs SSR
let Terminal, FitAddon, AttachAddon
let terminal = null
let fitAddon = null
let attachAddon = null
let socket = null

// État des panneaux
const showStartPanel = ref(true)
const showInfoPanel = ref(false)
const showTerminalPanel = ref(false)
const showReconnectButton = ref(false)
//const showDebug = ref(process.env.NODE_ENV === 'development')
const showDebug = ref(false)

// État des sections repliables
const showAdvancedOptions = ref(false)
const showUsageDetails = ref(false)

// État de l'application
const isStarting = ref(false)
const isStopping = ref(false)
const isConnected = ref(false)
const startStatus = ref('')
const terminalError = ref('')

// Informations de session
const sessionInfo = ref(null)
const timeRemaining = ref(0)
let timerInterval = null
let usageRefreshInterval = null

// Usage refresh configuration
const USAGE_REFRESH_INTERVAL = 600000 // 10 minutes in milliseconds

// Formulaire
const selectedInstanceType = ref('')
const nameInput = ref('')

// Instance types
const instanceTypes = ref([])
const loadingInstanceTypes = ref(false)

// Search and filtering for scalability
const instanceSearchTerm = ref('')
const activeFilter = ref('all')
const filteredInstanceTypes = ref([])

// Subscription and usage state
const checkingUsage = ref(false)
const usageCheckResult = ref(null)
const currentSubscription = computed(() => subscriptionsStore.currentSubscription)
const currentTerminalCount = ref(0)
const loadingUsage = ref(false)
const refreshingUsage = ref(false)

// Références DOM
const terminalRef = ref(null)

// Computed properties
const selectedInstanceInfo = computed(() => {
  if (!selectedInstanceType.value || !instanceTypes.value.length) {
    return null
  }
  return instanceTypes.value.find(instance => instance.prefix === selectedInstanceType.value)
})

// Get allowed machine sizes from subscription
const allowedMachineSizes = computed(() => {
  const sizes = currentSubscription.value?.subscription_plan?.allowed_machine_sizes || []

  // If no sizes are defined, default to allowing XS (basic free tier)
  if (sizes.length === 0) {
    return ['XS']
  }

  return sizes
})

// Get instance availability information
const instanceAvailabilityMap = computed(() => {
  const map = new Map()
  instanceTypes.value.forEach(instance => {
    const availability = instanceUtils.checkAvailability(instance, allowedMachineSizes.value)
    map.set(instance.prefix, availability)
  })
  return map
})

// Plan restrictions - filter instances that have at least one available size
const allowedInstanceTypes = computed(() => {
  if (allowedMachineSizes.value.length === 0) {
    return instanceTypes.value // No restrictions if no plan data
  }

  return instanceTypes.value.filter(instance => {
    const availability = instanceAvailabilityMap.value.get(instance.prefix)
    return availability?.available || false
  })
})

// Get instances that require upgrade
const restrictedInstanceTypes = computed(() => {
  if (allowedMachineSizes.value.length === 0) {
    return [] // No restrictions if no plan data
  }

  return instanceTypes.value.filter(instance => {
    const availability = instanceAvailabilityMap.value.get(instance.prefix)
    return availability && !availability.available
  })
})

const sessionDurationCap = computed(() => {
  return currentSubscription.value?.plan_features?.session_duration_hours ?
    currentSubscription.value.plan_features.session_duration_hours * 3600 : // Convert hours to seconds
    3600 // Default 1 hour
})

const maxTerminals = computed(() => {
  return currentSubscription.value?.plan_features?.concurrent_terminals || 1
})

// Computed for refresh interval display
const refreshIntervalMinutes = computed(() => {
  return Math.floor(USAGE_REFRESH_INTERVAL / 60000)
})

// Computed for expiry help text
const expiryHelpText = computed(() => {
  const min = 60
  const max = sessionDurationCap.value
  const maxHours = sessionDurationCap.value / 3600
  const planHours = currentSubscription.value?.plan_features?.session_duration_hours || ''
  const planName = currentSubscription.value?.plan_name || ''

  let baseText = t('terminalStarter.expiryHelpBase', { min, max, maxHours })

  if (planHours && planName) {
    baseText += ' ' + t('terminalStarter.expiryHelpPlanLimit', { planHours, planName })
  }

  return baseText
})

// Computed for scalable instance display
const displayedInstanceTypes = computed(() => {
  let instances = instanceTypes.value

  // Apply search filter
  if (instanceSearchTerm.value.trim()) {
    const searchTerm = instanceSearchTerm.value.toLowerCase()
    instances = instances.filter(instance =>
      instance.name.toLowerCase().includes(searchTerm) ||
      instance.description.toLowerCase().includes(searchTerm) ||
      instance.prefix.toLowerCase().includes(searchTerm) ||
      getTranslatedInstanceName(instance).toLowerCase().includes(searchTerm) ||
      getTranslatedInstanceDescription(instance).toLowerCase().includes(searchTerm)
    )
  }

  // Apply category filter
  if (activeFilter.value === 'available') {
    instances = instances.filter(instance => {
      const availability = instanceAvailabilityMap.value.get(instance.prefix)
      return availability?.available || false
    })
  } else if (activeFilter.value === 'restricted') {
    instances = instances.filter(instance => {
      const availability = instanceAvailabilityMap.value.get(instance.prefix)
      return availability && !availability.available
    })
  }

  return instances
})

// Filter options for many instances
const availableFilters = computed(() => {
  const allCount = instanceTypes.value.length
  const availableCount = instanceTypes.value.filter(instance => {
    const availability = instanceAvailabilityMap.value.get(instance.prefix)
    return availability?.available || false
  }).length
  const restrictedCount = allCount - availableCount

  return [
    { key: 'all', label: t('terminals.allInstances'), count: allCount },
    { key: 'available', label: t('terminals.availableInstances'), count: availableCount },
    { key: 'restricted', label: t('terminals.restrictedInstances'), count: restrictedCount }
  ].filter(filter => filter.count > 0)
})

// Capacity Check - Inline version
const INSTANCE_RAM_REQUIREMENTS = {
  'alpine': 0.5,
  'debian': 1.0,
  'ubuntu': 1.0,
  'default': 1.0
}
const SYSTEM_RESERVE_GB = 0.6

const serverMetrics = computed(() => metricsStore.metrics)

const canLaunchInstance = computed(() => {
  if (!selectedInstanceType.value || !serverMetrics.value) return null

  // Check CPU - must be under 95%
  if (serverMetrics.value.cpu_percent > 95) {
    return false
  }

  // Check RAM
  const requiredRAM = getInstanceRAMRequirement(selectedInstanceType.value)
  const totalRequired = requiredRAM + SYSTEM_RESERVE_GB

  return serverMetrics.value.ram_available_gb >= totalRequired
})

const capacityStatusLevel = computed(() => {
  if (!selectedInstanceType.value) return 'neutral'
  if (canLaunchInstance.value === null) return 'checking'
  return canLaunchInstance.value ? 'ok' : 'error'
})

const capacityStatusIcon = computed(() => {
  switch (capacityStatusLevel.value) {
    case 'ok':
      return 'fas fa-check-circle'
    case 'error':
      return 'fas fa-exclamation-circle'
    case 'checking':
      return 'fas fa-spinner fa-spin'
    default:
      return 'fas fa-info-circle'
  }
})

const capacityStatusText = computed(() => {
  if (!selectedInstanceType.value) return ''
  if (canLaunchInstance.value === null) return t('terminalStarter.checkingCapacity')
  return canLaunchInstance.value
    ? t('terminalStarter.readyToLaunch')
    : t('terminalStarter.capacityIssue')
})

// Helper function for instance RAM requirements
function getInstanceRAMRequirement(instancePrefix) {
  const lowerPrefix = instancePrefix.toLowerCase()
  for (const key in INSTANCE_RAM_REQUIREMENTS) {
    if (lowerPrefix.includes(key)) {
      return INSTANCE_RAM_REQUIREMENTS[key]
    }
  }
  return INSTANCE_RAM_REQUIREMENTS['default']
}

// Helper functions for instance translation
function getTranslatedInstanceName(instance) {
  const key = `terminals.instances.${instance.name.toLowerCase()}.name`
  const translated = t(key)
  // If translation key doesn't exist, fall back to the original name with proper formatting
  return translated === key ? (instance.name.charAt(0).toUpperCase() + instance.name.slice(1)) : translated
}

function getTranslatedInstanceDescription(instance) {
  const key = `terminals.instances.${instance.name.toLowerCase()}.description`
  const translated = t(key)
  // If translation key doesn't exist, fall back to the original description
  return translated === key ? instance.description : translated
}

function getStatusClass(status) {
  switch (status?.toLowerCase()) {
    case 'running':
    case 'active':
      return 'text-success'
    case 'stopped':
    case 'inactive':
      return 'text-danger'
    case 'starting':
    case 'pending':
      return 'text-warning'
    default:
      return 'text-muted'
  }
}

// Initialisation dynamique des modules xterm
async function initXterm() {
  if (terminal) return // Déjà initialisé

  try {
    startStatus.value = t('terminalStarter.loadingModules')

    // Import dynamique pour éviter les erreurs SSR
    const [xtermModule, fitModule, attachModule] = await Promise.all([
      import('@xterm/xterm'),
      import('@xterm/addon-fit'),
      import('xterm-addon-attach')
    ])

    Terminal = xtermModule.Terminal
    FitAddon = fitModule.FitAddon
    AttachAddon = attachModule.AttachAddon


    // Créer le terminal
    terminal = new Terminal({
      cursorBlink: true,
      fontFamily: '"Cascadia Code", "Fira Code", "SF Mono", Monaco, "Inconsolata", "Roboto Mono", "Source Code Pro", Menlo, "DejaVu Sans Mono", "Lucida Console", monospace',
      fontSize: 14,
      rows: 24,
      cols: 80,
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
        selection: '#264f78',
        black: '#1e1e1e',
        red: '#f44747',
        green: '#6a9955',
        yellow: '#dcdcaa',
        blue: '#569cd6',
        magenta: '#c586c0',
        cyan: '#4ec9b0',
        white: '#d4d4d4',
        brightBlack: '#6a6a6a',
        brightRed: '#f44747',
        brightGreen: '#6a9955',
        brightYellow: '#dcdcaa',
        brightBlue: '#569cd6',
        brightMagenta: '#c586c0',
        brightCyan: '#4ec9b0',
        brightWhite: '#ffffff'
      }
    })

    fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)

    terminalError.value = ''
    return true
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de xterm.js:', error)
    terminalError.value = `${t('terminalStarter.errorInitializationMessage')}: ${error.message}`
    showErrorNotification(t('terminalStarter.errorInitializationMessage'), t('terminalStarter.errorInitialization'))
    return false
  }
}

async function loadInstanceTypes() {
  try {
    loadingInstanceTypes.value = true
    const loadedTypes = await terminalService.getInstanceTypes()

    // Ensure we have a valid array
    if (!Array.isArray(loadedTypes)) {
      instanceTypes.value = []
      showErrorNotification('Format de données invalide pour les types d\'instances.', 'Erreur de chargement')
      return
    }

    instanceTypes.value = loadedTypes

    if (instanceTypes.value.length === 0) {
      showWarning(t('terminalStarter.errorLoading'), t('terminalStarter.errorLoadingTitle'))
      return
    }

    // Set default selection after data is loaded
    setDefaultInstanceSelection()
  } catch (error) {
    console.error('Failed to load instance types:', error)
    showErrorNotification(`${t('terminalStarter.errorLoadingFormat')}: ${error.message || error}`, t('terminalStarter.errorLoadingFormatTitle'))
    // Initialize with empty array on error
    instanceTypes.value = []
    selectedInstanceType.value = ''
  } finally {
    loadingInstanceTypes.value = false
  }
}

// Load current terminal usage count
async function loadCurrentTerminalUsage() {
  try {
    loadingUsage.value = true

    // Get usage metrics from subscription store
    const usageMetrics = await subscriptionsStore.getUsageMetrics()

    // Find concurrent terminals metric
    const terminalMetric = usageMetrics.find(metric =>
      metric.metric_type === 'concurrent_terminals' ||
      metric.name === 'concurrent_terminals'
    )

    if (terminalMetric) {
      // The current terminal count is in current_value property
      currentTerminalCount.value = terminalMetric.current_value || 0
    } else {
      // Fallback: default to 0 if metric not found
      currentTerminalCount.value = 0
    }
  } catch (error) {
    console.error('Failed to load terminal usage:', error)
    // Don't show error to user, just default to 0
    currentTerminalCount.value = 0
  } finally {
    loadingUsage.value = false
  }
}

// Synchronize all terminal sessions with the backend
async function syncAllSessions() {
  try {
    const response = await axios.post('/terminals/sync-all')
    console.log('All sessions synchronized:', response.data)
    return response.data
  } catch (error) {
    console.error('Failed to sync sessions:', error)
    throw error
  }
}

// Manual refresh of usage data
async function refreshUsage() {
  try {
    refreshingUsage.value = true

    // First, sync all terminal sessions with the API to get current status
    try {
      await syncAllSessions()
    } catch (syncError) {
      console.error('Failed to sync sessions:', syncError)
      // Continue anyway to try loading current usage
    }

    // Then load the updated usage data
    await loadCurrentTerminalUsage()
  } catch (error) {
    console.error('Failed to refresh usage:', error)
  } finally {
    refreshingUsage.value = false
  }
}

// Set default instance selection based on availability
function setDefaultInstanceSelection() {
  // If we have instances, always select the first one
  // The availability checking will happen when trying to start the session
  if (instanceTypes.value.length > 0) {
    // Prefer allowed instances if any
    if (allowedInstanceTypes.value.length > 0) {
      selectedInstanceType.value = allowedInstanceTypes.value[0].prefix
    } else {
      // If no instances are "allowed" but we have instances, select the first one
      // This handles cases where subscription data isn't loaded yet or plan has no restrictions
      selectedInstanceType.value = instanceTypes.value[0].prefix
    }
  } else {
    selectedInstanceType.value = ''
  }
}

onMounted(async () => {
  // Pré-charger xterm.js
  await initXterm()
  // Charger les types d'instances, les données d'abonnement et l'utilisation actuelle
  await Promise.all([
    loadInstanceTypes(),
    subscriptionsStore.getCurrentSubscription(),
    loadCurrentTerminalUsage()
  ])

  // Set default selection after both instances and subscription are loaded
  await nextTick(() => {
    setDefaultInstanceSelection()
  })

  // Start periodic refresh of usage metrics to handle expired terminals
  usageRefreshInterval = setInterval(async () => {
    try {
      await loadCurrentTerminalUsage()
    } catch (error) {
      // Silently handle refresh errors to avoid disrupting user experience
    }
  }, USAGE_REFRESH_INTERVAL)

  // Load initial metrics for capacity check
  metricsStore.refreshMetrics()

  // Watch for instance type changes to refresh metrics
  watch(selectedInstanceType, (newInstance) => {
    if (newInstance) {
      metricsStore.refreshMetrics()
    }
  })

  // Periodic refresh of metrics (every 30 seconds)
  const metricsRefreshInterval = setInterval(() => {
    if (selectedInstanceType.value) {
      metricsStore.refreshMetrics()
    }
  }, 30000)

  // Clean up on unmount
  onBeforeUnmount(() => {
    clearInterval(metricsRefreshInterval)
  })
})

onBeforeUnmount(() => {
  cleanup()
})

function cleanup() {
  if (socket) {
    socket.close()
    socket = null
  }

  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }

  if (usageRefreshInterval) {
    clearInterval(usageRefreshInterval)
    usageRefreshInterval = null
  }

  if (terminal) {
    terminal.dispose()
    terminal = null
  }

  fitAddon = null
  attachAddon = null
}

function resetForm() {
  nameInput.value = ''
  // Reset to default available instance type
  setDefaultInstanceSelection()
  terminalError.value = ''
}

// Search and filter methods for scalability
function filterInstances() {
  // The filtering is handled by displayedInstanceTypes computed property
  // This method exists for future enhancements if needed
}

function setFilter(filterKey) {
  activeFilter.value = filterKey
}

function clearFilters() {
  instanceSearchTerm.value = ''
  activeFilter.value = 'all'
}

// Select instance function
function selectInstance(instance) {
  const availability = instanceAvailabilityMap.value.get(instance.prefix)

  // Always allow selection (the real check will happen when starting the session)
  selectedInstanceType.value = instance.prefix

  // Show warning for restricted instances but still allow selection
  if (availability && !availability.available) {
    // Instance may require plan upgrade but allow selection for later validation
  }
}

async function startNewSession() {
  if (!selectedInstanceType.value) {
    showErrorNotification(t('terminalStarter.errorValidationInstance'), t('terminalStarter.errorStarting'))
    return
  }

  // Check usage limits before starting
  checkingUsage.value = true
  startStatus.value = t('terminalStarter.checkingLimits')

  try {
    // Check if user can create a new terminal
    const canCreateTerminal = await subscriptionsStore.checkUsageLimit('concurrent_terminals', 1)

    if (!canCreateTerminal) {
      showErrorNotification(
        t('terminalStarter.errorLimitReached'),
        t('terminalStarter.errorLimitReachedTitle')
      )
      isStarting.value = false
      checkingUsage.value = false
      return
    }
  } catch (error) {
    console.error('Error checking usage limits:', error)
    if (error.response?.status === 403 && error.response?.data?.error_message?.includes('Maximum concurrent terminals')) {
      showErrorNotification(
        error.response.data.error_message + ' ' + t('terminalStarter.errorLimitReached'),
        t('terminalStarter.errorLimitReachedTitle')
      )
      isStarting.value = false
      checkingUsage.value = false
      return
    }
    // Continue if it's just a check error, don't block terminal creation
  }

  checkingUsage.value = false

  // Check if selected instance is available
  if (selectedInstanceType.value) {
    const availability = instanceAvailabilityMap.value.get(selectedInstanceType.value)
    if (!availability?.available) {
      showWarning(
        t('terminalStarter.errorInstanceNotAvailable'),
        t('terminalStarter.errorInstanceNotAvailableTitle')
      )
      isStarting.value = false
      return
    }
  }

  isStarting.value = true
  startStatus.value = t('terminalStarter.startingSession')

  try {
    const sessionData = {
      terms: 'J\'accepte les conditions d\'utilisation du service terminal.',
      expiry: sessionDurationCap.value,
      ...(selectedInstanceType.value && { instance_type: selectedInstanceType.value }),
      ...(nameInput.value.trim() && { name: nameInput.value.trim() })
    }

    startStatus.value = t('terminalStarter.sendingRequest')

    const response = await axios.post('/terminals/start-session', sessionData)

    sessionInfo.value = {
      session_id: response.data.session_id,
      console_url: response.data.console_url,
      expires_at: response.data.expires_at,
      status: response.data.status
    }

    startStatus.value = t('terminalStarter.sessionCreated')

    // Cacher le panneau de démarrage et afficher les panneaux de session
    showStartPanel.value = false
    showInfoPanel.value = true
    showTerminalPanel.value = true

    // Démarrer le timer d'expiration
    if (response.data.expires_at) {
      startExpirationTimer(response.data.expires_at)
    }

    // Émettre l'événement pour informer le parent
    emit('session-started')

    // Refresh terminal count after starting a new session
    await loadCurrentTerminalUsage()

    // Initialiser le terminal
    await initializeTerminal()

  } catch (error) {
    console.error('Erreur lors du démarrage:', error)

    // Handle different error statuses
    const errorMsg = error.response?.data?.error_message || error.message || 'Erreur lors du démarrage de la session'

    // Handle 503 Server at Capacity error
    if (error.response?.status === 503) {
      showErrorNotification(
        errorMsg,
        t('terminalStarter.errorServerCapacity')
      )
    }
    // Handle size-based restriction errors (400)
    else if (error.response?.status === 400 && errorMsg.includes('not allowed in your plan')) {
      // Extract instance name and sizes from error message
      const instanceMatch = errorMsg.match(/instance '([^']+)'/)
      const sizesMatch = errorMsg.match(/sizes \[([^\]]+)\]/)
      const allowedMatch = errorMsg.match(/Allowed sizes: \[([^\]]+)\]/)

      let enhancedError = errorMsg

      if (instanceMatch && sizesMatch && allowedMatch) {
        const instanceName = instanceMatch[1]
        const requiredSizes = sizesMatch[1].split('|').map(s => s.trim())
        const allowedSizes = allowedMatch[1].split(',').map(s => s.trim())

        enhancedError = t('terminalStarter.errorInstanceRestrictedMessage', {
          name: instanceName,
          required: requiredSizes.join(', '),
          allowed: allowedSizes.join(', ')
        })
      }

      showErrorNotification(enhancedError, t('terminalStarter.errorInstanceRestricted'))

      // Show upgrade suggestion
      setTimeout(async () => {
        const confirmed = await showConfirm(
          t('terminalStarter.errorUpgradePrompt'),
          t('terminalStarter.errorUpgradePromptTitle')
        )
        if (confirmed) {
          window.open('/subscription-plans', '_blank')
        }
      }, 2000)
    } else {
      showErrorNotification(errorMsg, t('terminalStarter.errorStarting'))
    }

    showStartPanel.value = true
    showInfoPanel.value = false
    showTerminalPanel.value = false
  } finally {
    isStarting.value = false
    startStatus.value = ''
  }
}

async function initializeTerminal() {
  if (!terminal) {
    const success = await initXterm()
    if (!success) {
      return
    }
  }

  if (!sessionInfo.value) {
    return
  }

  await nextTick()

  if (!terminalRef.value) {
    return
  }

  // Ouvrir le terminal dans le DOM
  if (!terminal.element) {
    terminal.open(terminalRef.value)

    // Ajuster la taille après un délai
    setTimeout(() => {
      if (fitAddon && terminal) {
        fitAddon.fit()
      }
    }, 200)
  }

  // Établir la connexion WebSocket
  await connectWebSocket()
}

async function connectWebSocket() {
  if (!sessionInfo.value || !sessionInfo.value.session_id) {
    return
  }

  try {
    // Extraire l'ID de session
    const sessionId = sessionInfo.value.session_id

    // Construire l'URL WebSocket
    const protocol = import.meta.env.VITE_PROTOCOL === 'https' ? 'wss' : 'ws'
    const apiUrl = import.meta.env.VITE_API_URL
    const wsUrl = `${protocol}://${apiUrl}/api/v1/terminals/${sessionId}/console?width=${terminal ? terminal.cols : 80}&height=${terminal ? terminal.rows : 24}`

    socket = new WebSocket(wsUrl)

    socket.onopen = () => {
      isConnected.value = true
      showReconnectButton.value = false

      // Attacher le socket au terminal
      if (terminal && AttachAddon) {
        attachAddon = new AttachAddon(socket)
        terminal.loadAddon(attachAddon)
      }
    }

    socket.onclose = (event) => {
      isConnected.value = false
      showReconnectButton.value = true
    }

    socket.onerror = (error) => {
      console.error('Erreur WebSocket:', error)
      isConnected.value = false
      showReconnectButton.value = true
    }

  } catch (error) {
    console.error('Erreur lors de la connexion WebSocket:', error)
    showErrorNotification(t('terminalStarter.errorWebsocketMessage', { message: error.message }), t('terminalStarter.errorWebsocket'))
    isConnected.value = false
    showReconnectButton.value = true
  }
}

async function stopSession() {
  if (!sessionInfo.value) return

  isStopping.value = true

  try {
    const sessionId = sessionInfo.value.session_id
    await axios.post(`/terminals/${sessionId}/stop`)

    // Refresh terminal count after stopping a session
    await loadCurrentTerminalUsage()

    // Reset de l'interface
    resetToStart()

  } catch (error) {
    console.error('Erreur lors de l\'arrêt:', error)
    const errorMsg = error.response?.data?.error_message || error.message || t('terminalStarter.errorStoppingMessage')
    showErrorNotification(errorMsg, t('terminalStarter.errorStopping'))
  } finally {
    isStopping.value = false
  }
}

function reconnectTerminal() {
  if (socket) {
    socket.close()
  }
  connectWebSocket()
}

function resetToStart() {
  cleanup()

  // Reset de l'état
  sessionInfo.value = null
  timeRemaining.value = 0
  isConnected.value = false
  terminalError.value = ''

  // Reset des panneaux
  showStartPanel.value = true
  showInfoPanel.value = false
  showTerminalPanel.value = false
  showReconnectButton.value = false

  // Reset du formulaire
  resetForm()
}

function startExpirationTimer(expiresAt) {
  const expirationTime = new Date(expiresAt).getTime()

  if (timerInterval) {
    clearInterval(timerInterval)
  }

  timerInterval = setInterval(() => {
    const now = Date.now()
    const remaining = Math.max(0, Math.floor((expirationTime - now) / 1000))

    timeRemaining.value = remaining

    if (remaining <= 0) {
      clearInterval(timerInterval)
      showWarning(t('terminalStarter.sessionExpired'), t('terminalStarter.sessionExpiredTitle'))
      showTerminalPanel.value = false
      showInfoPanel.value = false
    }
  }, 1000)
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }
}
</script>

<style scoped>
.terminal-starter {
  max-width: 100%;
  margin: 0 auto;
}

/* Debug Panel */
.debug-panel {
  background: var(--color-bg-secondary);
  border: var(--border-width-thin) solid var(--color-border-medium);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  font-family: var(--font-family-monospace);
  font-size: var(--font-size-sm);
}

.debug-panel h4 {
  margin-top: 0;
  color: var(--color-text-secondary);
}

/* Usage Stats */
.usage-stats {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.usage-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  border: var(--border-width-thin) solid var(--color-border-light);
}

.usage-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.usage-value {
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
}

.usage-info {
  padding-top: var(--spacing-sm);
  border-top: var(--border-width-thin) solid var(--color-border-light);
}

/* Header Actions Group */
.header-actions-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

/* Inline Capacity Check */
.capacity-check-inline {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-fast);
}

.capacity-check-inline.status-ok {
  background-color: var(--color-success-bg);
  color: var(--color-success-text);
}

.capacity-check-inline.status-ok i {
  color: var(--color-success);
}

.capacity-check-inline.status-error {
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.capacity-check-inline.status-error i {
  color: var(--color-danger);
}

.capacity-check-inline.status-checking {
  background-color: var(--color-info-bg);
  color: var(--color-info-text);
}

.capacity-check-inline.status-checking i {
  color: var(--color-info);
}

.capacity-check-inline .capacity-text {
  white-space: nowrap;
}

/* Collapsible Sections */
.collapsible-section {
  margin-top: var(--spacing-lg);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  background: var(--color-bg-secondary);
}

.collapsible-header {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-bg-secondary);
  border: none;
  text-align: left;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  transition: background-color var(--transition-fast);
}

.collapsible-header:hover {
  background: var(--color-bg-tertiary);
}

.collapsible-header i {
  color: var(--color-primary);
  transition: transform var(--transition-fast);
}

.collapsible-content {
  padding: var(--spacing-lg);
  background: var(--color-bg-primary);
  border-top: var(--border-width-thin) solid var(--color-border-light);
}

.usage-badge {
  margin-left: auto;
  padding: 4px 12px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.usage-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--spacing-md);
}

/* Form Actions */
.form-actions {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
  margin-top: var(--spacing-md);
}

/* Progress Container */
.progress-container {
  margin-top: var(--spacing-lg);
}

.progress {
  height: 20px;
  background-color: var(--color-gray-200);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: var(--color-primary);
  transition: width var(--transition-slow);
}

.progress-bar-striped {
  background-image: linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent);
  background-size: 1rem 1rem;
}

.progress-bar-animated {
  animation: progress-bar-stripes 1s linear infinite;
}

@keyframes progress-bar-stripes {
  from {
    background-position: 1rem 0;
  }
  to {
    background-position: 0 0;
  }
}

.status-text {
  text-align: center;
  margin-top: var(--spacing-sm);
  font-style: italic;
  color: var(--color-text-muted);
}

/* Session Details */
.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.session-title {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.session-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.time-remaining {
  font-weight: var(--font-weight-semibold);
  color: var(--color-info-text);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.session-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.detail-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border-radius: var(--border-radius-sm);
  border-left: var(--border-width-thick) solid var(--color-info);
}

.detail-item strong {
  min-width: 140px;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.instance-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: var(--font-weight-medium);
}

.instance-info small {
  background-color: var(--color-gray-200);
  padding: 2px 6px;
  border-radius: var(--border-radius-sm);
  font-family: var(--font-family-monospace);
}

/* Terminal Wrapper */
.terminal-wrapper {
  min-height: 500px;
  background-color: #1e1e1e;
  position: relative;
  border: var(--border-width-medium) solid #333;
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.terminal-container {
  width: 100%;
  height: 100%;
  min-height: 500px;
}

.terminal-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 500px;
  color: var(--color-text-muted);
}

.terminal-placeholder i {
  margin-bottom: var(--spacing-lg);
  opacity: 0.5;
}

.terminal-footer {
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border-top: var(--border-width-thin) solid var(--color-border-medium);
  margin-top: var(--spacing-md);
  border-radius: 0 0 var(--border-radius-md) var(--border-radius-md);
}

.terminal-info {
  font-family: var(--font-family-monospace);
  font-size: var(--font-size-sm);
}

.connection-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
}

.status-connected {
  color: var(--color-success);
}

.status-disconnected {
  color: var(--color-danger);
}

/* Text Utilities */
.text-success {
  color: var(--color-success);
}

.text-danger {
  color: var(--color-danger);
}

.text-muted {
  color: var(--color-text-muted);
}

.text-warning {
  color: var(--color-warning-text);
}

/* Instance Search */
.instance-search {
  margin-bottom: var(--spacing-lg);
}

.instance-search input {
  margin-bottom: var(--spacing-sm);
}

.instance-filters {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

/* Instance Types Grid */
.instance-types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  max-height: 400px;
  overflow-y: auto;
  padding: var(--spacing-sm);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
}

.instance-types-grid.compact {
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--spacing-xs);
}

.instance-card {
  border: var(--border-width-medium) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
  transition: all var(--transition-base);
  background: var(--color-bg-primary);
}

.instance-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}

.instance-card.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.instance-card.available {
  border-left: var(--border-width-thick) solid var(--color-success);
}

.instance-card.restricted {
  border-left: var(--border-width-thick) solid var(--color-warning);
  opacity: 0.8;
}

.instance-card.restricted:hover {
  border-color: var(--color-warning);
  cursor: not-allowed;
}

.instance-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-xs);
}

.instance-info h5 {
  margin: 0 0 2px 0;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.instance-info p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  line-height: 1.3;
}

.instance-status {
  font-size: var(--font-size-lg);
  line-height: 1;
}

/* Size Badges */
.size-badges {
  display: flex;
  gap: 4px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.size-badge {
  padding: 2px 6px;
  border-radius: var(--border-radius-full);
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  line-height: 1.2;
}

.size-badge.available {
  background: var(--color-success-bg);
  color: var(--color-success-text);
  border: var(--border-width-thin) solid var(--color-success);
}

.size-badge.restricted {
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
  border: var(--border-width-thin) solid var(--color-warning);
}

/* Availability Messages */
.availability-message {
  margin-top: 6px;
}

.availability-message small {
  font-size: 11px;
  line-height: 1.2;
}

.restricted-message {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-xs);
}

.upgrade-link {
  padding: 2px 6px;
  font-size: 10px;
  border-radius: var(--border-radius-sm);
  text-decoration: none;
  white-space: nowrap;
  background-color: var(--color-primary);
  color: var(--color-white);
  border: var(--border-width-thin) solid var(--color-primary);
  transition: all var(--transition-fast);
}

.upgrade-link:hover {
  background-color: var(--color-primary-hover);
  text-decoration: none;
}

/* Empty State */
.no-instances-found {
  text-align: center;
  padding: var(--spacing-2xl) var(--spacing-lg);
  color: var(--color-text-muted);
  border: var(--border-width-medium) dashed var(--color-border-light);
  border-radius: var(--border-radius-lg);
}

.no-instances-found i {
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

/* Character counter for name input */
.char-count {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 4px;
  display: block;
  text-align: right;
}

/* Responsive */
@media (max-width: 768px) {
  .session-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .terminal-wrapper {
    min-height: 300px;
  }

  .terminal-container {
    min-height: 300px;
  }

  .terminal-placeholder {
    height: 300px;
  }

  .header-actions-group {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-sm);
    width: 100%;
  }

  .capacity-check-inline {
    justify-content: center;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions :deep(.btn) {
    width: 100%;
    justify-content: center;
  }

  .instance-types-grid {
    grid-template-columns: 1fr;
    max-height: 300px;
  }

  .instance-header {
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .instance-filters {
    flex-direction: column;
  }

  .instance-filters :deep(.btn) {
    width: 100%;
  }

  .collapsible-header {
    font-size: var(--font-size-sm);
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .collapsible-content {
    padding: var(--spacing-md);
  }
}
</style>
