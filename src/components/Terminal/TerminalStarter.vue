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

    <!-- Usage Overview Panel -->
    <div v-if="currentSubscription" class="panel panel-info usage-panel">
      <div class="panel-body">
        <div class="usage-header">
          <h4><i class="fas fa-chart-bar"></i> {{ t('terminals.currentUsage') }}</h4>
          <button
            @click="refreshUsage"
            :disabled="refreshingUsage"
            class="btn btn-sm btn-outline-primary refresh-btn"
            :title="t('terminals.refreshUsage')"
          >
            <i :class="refreshingUsage ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'"></i>
            {{ t('ui.refresh') }}
          </button>
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
        </div>
        <div class="usage-info">
          <small class="text-muted">
            <i class="fas fa-info-circle"></i>
            {{ t('terminals.autoRefreshInfo', { minutes: refreshIntervalMinutes }) }}
          </small>
        </div>
      </div>
    </div>

    <!-- Panneau de démarrage -->
    <div class="panel panel-warning" v-show="showStartPanel">
      <div class="panel-body">
        <h4><i class="fas fa-play"></i> {{ t('terminals.startNewSession') }}</h4>
        
        <div class="form-group">
          <label for="terms">{{ t('terminals.termsRequired') }}</label>
          <textarea 
            id="terms"
            v-model="termsInput"
            class="form-control"
            rows="3"
            placeholder="J'accepte les conditions d'utilisation..."
            required
          ></textarea>
          <small class="form-text text-muted">
            Vous devez accepter les conditions d'utilisation pour démarrer une session terminal.
          </small>
        </div>
        
        <div class="form-group">
          <label for="expiry">{{ t('terminals.expirySeconds') }}</label>
          <input
            id="expiry"
            v-model.number="expiryInput"
            type="number"
            class="form-control"
            min="60"
            :max="sessionDurationCap"
            :placeholder="`${sessionDurationCap} (${sessionDurationCap / 3600}h maximum pour votre plan)`"
          />
          <small class="form-text text-muted">
            Entre 60 secondes (1 min) et {{ sessionDurationCap }} secondes ({{ sessionDurationCap / 3600 }}h max).
            <span v-if="currentSubscription?.plan_features?.session_duration_hours" class="plan-restriction">
              Limité à {{ currentSubscription.plan_features.session_duration_hours }}h par votre plan {{ currentSubscription.plan_name }}.
            </span>
          </small>
        </div>

        <div class="form-group">
          <label for="instanceType">{{ t('terminals.instanceType') }}</label>

          <!-- Search/Filter for many instances -->
          <div v-if="instanceTypes.length > 6" class="instance-search">
            <input
              v-model="instanceSearchTerm"
              type="text"
              class="form-control"
              :placeholder="t('terminals.searchInstances')"
              @input="filterInstances"
            >
            <div class="instance-filters">
              <button
                v-for="filterOption in availableFilters"
                :key="filterOption.key"
                class="btn btn-sm"
                :class="activeFilter === filterOption.key ? 'btn-primary' : 'btn-outline-secondary'"
                @click="setFilter(filterOption.key)"
              >
                {{ filterOption.label }} ({{ filterOption.count }})
              </button>
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
              <h5>{{ t('terminals.noInstancesFound') }}</h5>
              <p v-if="instanceSearchTerm">
                {{ t('terminals.noMatchingInstances').replace('{searchTerm}', instanceSearchTerm) }}
              </p>
              <p v-else-if="activeFilter === 'available'">
                {{ t('terminals.noAvailableInstances') }}
              </p>
              <p v-else-if="activeFilter === 'restricted'">
                {{ t('terminals.allInstancesAvailable') }}
              </p>
              <button
                v-if="instanceSearchTerm || activeFilter !== 'all'"
                @click="clearFilters"
                class="btn btn-sm btn-primary"
              >
                {{ t('terminals.clearFilters') }}
              </button>
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
                    <i class="fas fa-check"></i> {{ t('terminals.availableInPlan') }}
                  </small>
                </div>
                <div v-else class="restricted-message">
                  <small class="text-warning">
                    <i class="fas fa-exclamation-triangle"></i> {{ t('terminals.requiresUpgrade') }}
                  </small>
                  <router-link to="/subscription-plans" class="btn btn-sm btn-outline-primary upgrade-btn">
                    <i class="fas fa-arrow-up"></i>
                    {{ t('terminals.upgrade') }}
                  </router-link>
                </div>
              </div>
            </div>
          </div>

          <small class="form-text text-muted">
            {{ t('terminals.selectEnvironmentType') }}
            <span v-if="allowedMachineSizes.length > 0" class="plan-restriction">
              {{ t('terminals.yourPlanAllows') }}: {{ allowedMachineSizes.join(', ') }}
            </span>
          </small>

        </div>


        <div class="form-actions">
          <button
            type="button"
            class="btn btn-primary btn-lg"
            @click="startNewSession"
            :disabled="!termsInput.trim() || !selectedInstanceType || isStarting"
          >
            <i v-if="isStarting" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-play"></i>
            {{ isStarting ? 'Démarrage...' : 'Démarrer le Terminal' }}
          </button>
          
          <button 
            type="button" 
            class="btn btn-secondary" 
            @click="resetForm" 
            :disabled="isStarting"
          >
            <i class="fas fa-undo"></i>
            Réinitialiser
          </button>
        </div>

        <div v-if="isStarting" class="progress-container">
          <div class="progress">
            <div class="progress-bar progress-bar-striped progress-bar-animated" 
                 role="progressbar" 
                 style="width: 100%">
            </div>
          </div>
          <p class="status-text">{{ startStatus }}</p>
        </div>
      </div>
    </div>

    <!-- Panneau d'information de session -->
    <div class="panel panel-info" v-show="showInfoPanel && sessionInfo">
      <div class="panel-heading">
        <div class="session-header">
          <span>
            <i class="fas fa-terminal"></i>
            Session Terminal: {{ sessionInfo?.session_id }}
          </span>
          <div class="session-actions">
            <span class="time-remaining" v-if="timeRemaining > 0">
              <i class="fas fa-clock"></i>
              Temps restant: {{ formatTime(timeRemaining) }}
            </span>
            <button 
              type="button" 
              class="btn btn-danger btn-sm" 
              @click="stopSession"
              :disabled="isStopping"
            >
              <i v-if="isStopping" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-stop"></i>
              Arrêter
            </button>
          </div>
        </div>
      </div>
      <div class="panel-body">
        <div class="session-details">
          <div class="detail-item" v-if="selectedInstanceInfo">
            <strong><i class="fas fa-server"></i> {{ t('terminals.instanceType') }}</strong>
            <span class="instance-info">
              {{ getTranslatedInstanceName(selectedInstanceInfo) }} - {{ getTranslatedInstanceDescription(selectedInstanceInfo) }}
              <small class="text-muted">({{ selectedInstanceInfo.prefix }})</small>
            </span>
          </div>
          <div class="detail-item">
            <strong><i class="fas fa-info-circle"></i> {{ t('terminals.status') }}</strong>
            <span :class="getStatusClass(sessionInfo?.status)">
              {{ sessionInfo?.status }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Panneau du terminal -->
    <div class="panel panel-primary" v-show="showTerminalPanel">
      <div class="panel-heading">
        <div class="terminal-header">
          <span>
            <i class="fas fa-terminal"></i>
            Console Terminal
          </span>
          <div class="terminal-controls">
            <button 
              class="btn btn-warning btn-sm" 
              @click="reconnectTerminal" 
              v-show="showReconnectButton"
            >
              <i class="fas fa-sync"></i>
              Reconnecter
            </button>
            
            <div class="connection-status">
              <span v-if="isConnected" class="status-connected">
                <i class="fas fa-circle"></i> Connecté
              </span>
              <span v-else class="status-disconnected">
                <i class="fas fa-circle"></i> Déconnecté
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="terminal-wrapper">
        <div ref="terminalRef" class="terminal-container"></div>
        <div v-if="!terminal" class="terminal-placeholder">
          <i class="fas fa-terminal fa-3x"></i>
          <p>{{ t('terminals.initializingTerminal') }}</p>
          <p v-if="terminalError" class="text-danger">{{ terminalError }}</p>
        </div>
      </div>
      
      <div class="terminal-footer">
        <div class="terminal-info">
          <small class="text-muted">
            Session: {{ sessionInfo?.session_id }} |
            Statut: {{ sessionInfo?.status }} |
            <span v-if="selectedInstanceInfo">Instance: {{ selectedInstanceInfo.name }} ({{ selectedInstanceInfo.prefix }}) | </span>
            <span v-if="isConnected" class="text-success">{{ t('terminals.websocketConnected') }}</span>
            <span v-else class="text-danger">{{ t('terminals.websocketDisconnected') }}</span>
          </small>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import { terminalService, instanceUtils } from '../../services/terminalService'
import { useSubscriptionsStore } from '../../stores/subscriptions'
import { useNotification } from '../../composables/useNotification'

// Définir les émissions
const emit = defineEmits(['session-started'])

// Stores
const subscriptionsStore = useSubscriptionsStore()

// i18n setup
const { t } = useI18n()
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

// État de l'application
const isStarting = ref(false)
const isStopping = ref(false)
const isConnected = ref(false)
const startStatus = ref('Préparation...')
const terminalError = ref('')

// Informations de session
const sessionInfo = ref(null)
const timeRemaining = ref(0)
let timerInterval = null
let usageRefreshInterval = null

// Usage refresh configuration
const USAGE_REFRESH_INTERVAL = 600000 // 10 minutes in milliseconds

// Formulaire
const termsInput = ref('J\'accepte les conditions d\'utilisation du service terminal.')
const expiryInput = ref(3600) // 1 heure par défaut
const selectedInstanceType = ref('')

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
    startStatus.value = 'Chargement des modules xterm.js...'

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
    terminalError.value = `Impossible de charger xterm.js: ${error.message}`
    showErrorNotification('Impossible de charger le terminal. Vérifiez que les dépendances xterm.js sont installées.', 'Erreur d\'initialisation')
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
      showWarning('Aucun type d\'instance disponible. Contactez l\'administrateur.', 'Aucune instance disponible')
      return
    }

    // Set default selection after data is loaded
    setDefaultInstanceSelection()
  } catch (error) {
    console.error('Failed to load instance types:', error)
    showErrorNotification(`Erreur lors du chargement des types d'instances: ${error.message || error}`, 'Erreur de chargement')
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
    const response = await axios.post('/terminal-sessions/sync-all')
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
  termsInput.value = 'J\'accepte les conditions d\'utilisation du service terminal.'
  expiryInput.value = 3600
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
  if (!termsInput.value.trim()) {
    showErrorNotification('Veuillez accepter les conditions d\'utilisation', 'Erreur de validation')
    return
  }

  if (!selectedInstanceType.value) {
    showErrorNotification('Veuillez sélectionner un type d\'instance', 'Erreur de validation')
    return
  }

  // Check usage limits before starting
  checkingUsage.value = true
  startStatus.value = 'Vérification des limites d\'utilisation...'

  try {
    // Check if user can create a new terminal
    const canCreateTerminal = await subscriptionsStore.checkUsageLimit('concurrent_terminals', 1)

    if (!canCreateTerminal) {
      showErrorNotification(
        'Vous avez atteint votre limite de terminaux simultanés. Veuillez arrêter un terminal existant ou mettre à niveau votre plan.',
        'Limite atteinte'
      )
      isStarting.value = false
      checkingUsage.value = false
      return
    }
  } catch (error) {
    console.error('Error checking usage limits:', error)
    if (error.response?.status === 403 && error.response?.data?.error_message?.includes('Maximum concurrent terminals')) {
      showErrorNotification(
        error.response.data.error_message + ' Veuillez mettre à niveau votre plan pour créer plus de terminaux.',
        'Limite atteinte'
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
        'L\'instance sélectionnée n\'est pas disponible avec votre plan actuel. Veuillez choisir une autre instance ou mettre à niveau votre plan.',
        'Instance non disponible'
      )
      isStarting.value = false
      return
    }
  }

  isStarting.value = true
  startStatus.value = 'Démarrage de la session terminal...'

  try {
    const sessionData = {
      terms: termsInput.value.trim(),
      ...(expiryInput.value && { expiry: expiryInput.value }),
      ...(selectedInstanceType.value && { instance_type: selectedInstanceType.value })
    }

    startStatus.value = 'Envoi de la requête au serveur...'

    const response = await axios.post('/terminal-sessions/start-session', sessionData)

    sessionInfo.value = {
      session_id: response.data.session_id,
      console_url: response.data.console_url,
      expires_at: response.data.expires_at,
      status: response.data.status
    }

    startStatus.value = 'Session créée, initialisation du terminal...'

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

    // Handle size-based restriction errors
    const errorMsg = error.response?.data?.error_message || error.message || 'Erreur lors du démarrage de la session'

    if (error.response?.status === 400 && errorMsg.includes('not allowed in your plan')) {
      // Extract instance name and sizes from error message
      const instanceMatch = errorMsg.match(/instance '([^']+)'/)
      const sizesMatch = errorMsg.match(/sizes \[([^\]]+)\]/)
      const allowedMatch = errorMsg.match(/Allowed sizes: \[([^\]]+)\]/)

      let enhancedError = errorMsg

      if (instanceMatch && sizesMatch && allowedMatch) {
        const instanceName = instanceMatch[1]
        const requiredSizes = sizesMatch[1].split('|').map(s => s.trim())
        const allowedSizes = allowedMatch[1].split(',').map(s => s.trim())

        enhancedError = `Instance non autorisée\n\nL'instance "${instanceName}" nécessite les tailles: ${requiredSizes.join(', ')}\nVotre plan autorise: ${allowedSizes.join(', ')}\n\nVeuillez choisir une autre instance ou mettre à niveau votre plan.`
      }

      showErrorNotification(enhancedError, 'Instance non autorisée')

      // Show upgrade suggestion
      setTimeout(async () => {
        const confirmed = await showConfirm(
          'Souhaitez-vous voir les plans disponibles pour débloquer cette instance ?',
          'Mettre à niveau le plan'
        )
        if (confirmed) {
          window.open('/subscription-plans', '_blank')
        }
      }, 2000)
    } else {
      showErrorNotification(errorMsg, 'Erreur de démarrage')
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
    const wsUrl = `${protocol}://${apiUrl}/api/v1/terminal-sessions/${sessionId}/console?width=${terminal ? terminal.cols : 80}&height=${terminal ? terminal.rows : 24}`

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
    showErrorNotification(`Impossible de se connecter au terminal: ${error.message}`, 'Erreur de connexion')
    isConnected.value = false
    showReconnectButton.value = true
  }
}

async function stopSession() {
  if (!sessionInfo.value) return

  isStopping.value = true

  try {
    const sessionId = sessionInfo.value.session_id
    await axios.post(`/terminal-sessions/${sessionId}/stop`)

    // Refresh terminal count after stopping a session
    await loadCurrentTerminalUsage()

    // Reset de l'interface
    resetToStart()

  } catch (error) {
    console.error('Erreur lors de l\'arrêt:', error)
    const errorMsg = error.response?.data?.error_message || error.message || 'Erreur lors de l\'arrêt de la session'
    showErrorNotification(errorMsg, 'Erreur d\'arrêt')
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
      showWarning('Votre session terminal a expiré', 'Session expirée')
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

.debug-panel {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 20px;
  font-family: monospace;
  font-size: 12px;
}

.debug-panel h4 {
  margin-top: 0;
  color: #495057;
}

.panel {
  margin-bottom: 20px;
  background-color: #fff;
  border: 1px solid transparent;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,.1);
  overflow: hidden;
}

.panel-warning {
  border-color: #ffc107;
}

.panel-info {
  border-color: #17a2b8;
}

.panel-primary {
  border-color: #007bff;
}

.panel-danger {
  border-color: #dc3545;
}

.panel-heading {
  padding: 15px 20px;
  border-bottom: 1px solid transparent;
  border-top-left-radius: 7px;
  border-top-right-radius: 7px;
  font-weight: 600;
}

.panel-warning > .panel-heading {
  background-color: #fff3cd;
  border-color: #ffeaa7;
  color: #856404;
}

.panel-info > .panel-heading {
  background-color: #d1ecf1;
  border-color: #bee5eb;
  color: #0c5460;
}

.panel-primary > .panel-heading {
  background-color: #cce7ff;
  border-color: #b3d7ff;
  color: #004085;
}

.panel-danger > .panel-heading {
  background-color: #f8d7da;
  border-color: #f5c6cb;
  color: #721c24;
}

.panel-body {
  padding: 20px;
}

.session-header, .terminal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.session-actions, .terminal-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.time-remaining {
  font-weight: bold;
  color: #0c5460;
  display: flex;
  align-items: center;
  gap: 5px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #495057;
}

.form-control {
  display: block;
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  line-height: 1.5;
  color: #495057;
  background-color: #fff;
  border: 2px solid #ced4da;
  border-radius: 6px;
  box-sizing: border-box;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus {
  outline: 0;
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.form-text {
  display: block;
  margin-top: 5px;
  font-size: 12px;
}

.form-actions {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.terminal-wrapper {
  min-height: 500px;
  background-color: #1e1e1e;
  position: relative;
  border: 2px solid #333;
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
  color: #6c757d;
}

.terminal-placeholder i {
  margin-bottom: 20px;
  opacity: 0.5;
}

.terminal-footer {
  padding: 10px 15px;
  background-color: #f8f9fa;
  border-top: 1px solid #dee2e6;
}

.terminal-info {
  font-family: monospace;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.status-connected {
  color: #28a745;
}

.status-disconnected {
  color: #dc3545;
}

.progress-container {
  margin-top: 20px;
}

.progress {
  height: 20px;
  background-color: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: #007bff;
  transition: width 0.3s ease;
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
  margin-top: 10px;
  font-style: italic;
  color: #6c757d;
}


.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.2s ease-in-out;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-lg {
  padding: 12px 24px;
  font-size: 18px;
  border-radius: 8px;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
  border-radius: 4px;
}

.btn-primary {
  background-color: #007bff;
  border-color: #007bff;
  color: #fff;
}

.btn-secondary {
  background-color: #6c757d;
  border-color: #6c757d;
  color: #fff;
}

.btn-danger {
  background-color: #dc3545;
  border-color: #dc3545;
  color: #fff;
}

.btn-warning {
  background-color: #ffc107;
  border-color: #ffc107;
  color: #212529;
}

.btn-info {
  background-color: #17a2b8;
  border-color: #17a2b8;
  color: #fff;
}

.text-success {
  color: #28a745;
}

.text-danger {
  color: #dc3545;
}

.text-muted {
  color: #6c757d;
}

.text-warning {
  color: #ffc107;
}

.session-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border-left: 4px solid #17a2b8;
}

.detail-item strong {
  min-width: 140px;
  color: #495057;
  display: flex;
  align-items: center;
  gap: 6px;
}

.instance-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.instance-info small {
  background-color: #e9ecef;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
}

/* Responsive */
@media (max-width: 768px) {
  .session-header, .terminal-header {
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
  
  .form-actions, .error-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}

/* Usage Panel Styles */
.usage-panel {
  margin-bottom: 20px;
}

.usage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 10px;
}

.usage-header h4 {
  margin: 0;
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  font-size: 12px;
  white-space: nowrap;
}

.usage-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 15px;
}

.usage-info {
  padding-top: 10px;
  border-top: 1px solid #e9ecef;
}

.usage-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.usage-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #495057;
}

.usage-value {
  font-weight: 600;
  color: #007bff;
}

/* Plan Restriction Styles */
.plan-restriction {
  color: #856404;
  font-weight: 500;
}

.restricted-instances {
  margin-top: 8px;
  padding: 8px 12px;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
}

.upgrade-link {
  color: #e17055;
  text-decoration: none;
  font-weight: 500;
}

.upgrade-link:hover {
  text-decoration: underline;
}

/* Instance Types Grid - Scalable Layout */
.instance-types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 15px;
  margin-bottom: 15px;
  max-height: 400px; /* Limit height for many instances */
  overflow-y: auto; /* Enable scrolling for many items */
  padding: 10px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
}

.instance-card {
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.instance-card:hover {
  border-color: #007bff;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.1);
}

.instance-card.selected {
  border-color: #007bff;
  background: #f8f9ff;
}

.instance-card.available {
  border-left: 4px solid #28a745;
}

.instance-card.restricted {
  border-left: 4px solid #ffc107;
  opacity: 0.8;
}

.instance-card.restricted:hover {
  border-color: #ffc107;
  cursor: not-allowed;
}

.instance-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.instance-info h5 {
  margin: 0 0 4px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.instance-info p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.instance-status {
  font-size: 1.2rem;
}

.size-badges {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.size-badge {
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.size-badge.available {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.size-badge.restricted {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.availability-message {
  margin-top: 8px;
}

.restricted-message {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.upgrade-btn {
  padding: 2px 8px;
  font-size: 11px;
  border-radius: 4px;
  text-decoration: none;
  white-space: nowrap;
}

.upgrade-btn:hover {
  text-decoration: none;
}



/* Search and Filter Styles */
.instance-search {
  margin-bottom: 20px;
}

.instance-search .form-control {
  margin-bottom: 10px;
}

.instance-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.instance-filters .btn-sm {
  padding: 4px 12px;
  font-size: 12px;
  border-radius: 4px;
}

.btn-outline-secondary {
  border-color: #6c757d;
  color: #6c757d;
  background-color: transparent;
}

.btn-outline-secondary:hover {
  background-color: #6c757d;
  color: #fff;
}

/* Empty state for filtered results */
.no-instances-found {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
  border: 2px dashed #e9ecef;
  border-radius: 8px;
}

.no-instances-found i {
  font-size: 3rem;
  margin-bottom: 15px;
  opacity: 0.5;
}

/* Compact view for many instances */
.instance-types-grid.compact {
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.instance-types-grid.compact .instance-card {
  padding: 12px;
}

.instance-types-grid.compact .instance-info h5 {
  font-size: 1rem;
  margin-bottom: 2px;
}

.instance-types-grid.compact .instance-info p {
  font-size: 0.8rem;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .instance-types-grid {
    grid-template-columns: 1fr;
    max-height: 300px; /* Smaller height on mobile */
  }

  .instance-header {
    flex-direction: column;
    gap: 8px;
  }

  .instance-filters {
    flex-direction: column;
  }

  .instance-filters .btn {
    width: 100%;
  }
}
</style>