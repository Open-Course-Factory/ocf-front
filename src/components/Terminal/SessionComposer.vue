<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */
-->

<template>
  <div class="session-composer">
    <!-- Repeat Last Config -->
    <div v-if="lastConfig && distributions.length > 0" class="repeat-last-config">
      <button class="btn-repeat" :disabled="disabled" @click="repeatLastConfig">
        <i class="fas fa-redo"></i>
        {{ t('sessionComposer.repeatLast', { distribution: lastConfig.distribution, size: lastConfig.size.toUpperCase() }) }}
      </button>
    </div>

    <!-- Step 1: Distribution Selection -->
    <fieldset class="composer-step">
      <legend>{{ t('sessionComposer.stepDistribution') }}</legend>

      <!-- Skeleton during load -->
      <div v-if="loadingDistributions" class="skeleton-grid">
        <div v-for="i in 3" :key="i" class="skeleton-card" />
      </div>

      <!-- Distribution cards -->
      <div v-else-if="distributions.length" class="distribution-grid">
        <button
          v-for="dist in distributions"
          :key="dist.name"
          type="button"
          class="distribution-card"
          :class="{ selected: selectedDistribution?.name === dist.name }"
          :disabled="disabled"
          @click="selectDistribution(dist)"
        >
          <div class="dist-icon">
            <i :class="getOsIcon(dist.os_type)" />
          </div>
          <div class="dist-info">
            <strong>{{ dist.name }}</strong>
            <small>{{ dist.description }}</small>
          </div>
        </button>
      </div>

      <!-- Empty state -->
      <div v-else class="empty-state">
        <p>{{ t('sessionComposer.noDistributions') }}</p>
        <button type="button" class="btn-retry" @click="loadDistributions">
          {{ t('sessionComposer.retry') }}
        </button>
      </div>

      <!-- Size + Features (inside the environment fieldset) -->
      <div v-if="selectedDistribution" class="config-row">
        <hr class="config-divider" />

        <!-- Size pills -->
        <div v-if="loadingOptions" class="skeleton-sizes">
          <div v-for="i in 4" :key="i" class="skeleton-pill" />
        </div>
        <div v-else-if="sessionOptions" class="size-strip">
          <i class="fas fa-microchip config-icon"></i>
          <span class="config-label">{{ t('sessionComposer.size') }}</span>
          <div class="size-pills">
            <button
              v-for="size in visibleSizes"
              :key="size.key"
              type="button"
              class="size-pill"
              :class="{
                selected: selectedSize?.key === size.key,
                disabled: !size.allowed
              }"
              :disabled="!size.allowed || disabled"
              :title="getSizeUseCase(size.key) + ' — ' + size.cpu + ' CPU ' + size.cpu_allowance + ', ' + size.memory"
              @click="size.allowed && selectSize(size)"
            >
              {{ size.key.toUpperCase() }}
              <i v-if="size.key === selectedDistribution?.default_size_key" class="fas fa-star pill-recommended" :title="t('sessionComposer.recommended')"></i>
              <i v-if="!size.allowed" class="fas fa-lock pill-lock" />
            </button>
          </div>
          <span v-if="selectedSize" class="size-detail">
            {{ getSizeUseCase(selectedSize.key) }} · {{ selectedSize.cpu }} CPU, {{ selectedSize.memory }}
          </span>
        </div>

        <!-- Feature toggles inline -->
        <div v-if="selectedSize && availableFeatures.length > 0" class="feature-strip">
          <i class="fas fa-puzzle-piece config-icon"></i>
          <span class="config-label">{{ t('sessionComposer.stepFeatures') }}</span>
          <div class="feature-chips">
            <label
              v-for="feature in availableFeatures"
              :key="feature.key"
              class="feature-chip"
              :class="{ active: enabledFeatures[feature.key], disabled: !feature.allowed }"
              :title="!feature.allowed ? getReasonText(feature.reason) : feature.description"
            >
              <input
                type="checkbox"
                :checked="enabledFeatures[feature.key]"
                :disabled="!feature.allowed || disabled"
                @change="toggleFeature(feature.key, ($event.target as HTMLInputElement).checked)"
              />
              <i v-if="!feature.allowed" class="fas fa-lock" />
              <span>{{ feature.name }}</span>
            </label>
          </div>
        </div>

      </div>

      <!-- Unlock more power CTA (floating bottom-right, only for personal plans with locked items) -->
      <router-link v-if="hasLockedItems && !isAssignedSubscription" to="/subscription-plans" class="unlock-link">
        <i class="fas fa-bolt"></i>
        {{ t('sessionComposer.unlockMore') }}
      </router-link>
    </fieldset>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { useNotification } from '../../composables/useNotification'
import { terminalService } from '../../services/domain/terminal'
import type { Distribution, SessionOptionSize, SessionOptionFeature, SessionOptionsResponse } from '../../types/terminal'

const props = defineProps<{
  backendId?: string
  organizationId?: string
  disabled?: boolean
  isAssignedSubscription?: boolean
}>()

const { t } = useTranslations({
  en: {
    sessionComposer: {
      subtitle: 'Pick your environment and click Create — your terminal will be ready in about 30 seconds.',
      stepDistribution: 'Choose your environment',
      stepSize: 'Select resources',
      stepFeatures: 'Additional options',
      summary: 'Session summary',
      distribution: 'Environment',
      size: 'Resources',
      features: 'Features',
      noDistributions: 'No environments available.',
      retry: 'Retry',
      requiresUpgrade: 'Requires plan upgrade',
      belowMinSize: 'Below minimum for this environment',
      notInPlan: 'Not available in your plan',
      notSupported: 'Not supported by this environment',
      sizeTooSmall: 'Requires a larger size',
      unavailable: 'Unavailable',
      recommended: 'Recommended',
      useCaseXS: 'Light practice, basic CLI',
      useCaseS: 'Standard exercises',
      useCaseM: 'Development environment',
      useCaseL: 'Multi-service, Docker',
      useCaseXL: 'Heavy workloads, clusters',
      repeatLast: 'Repeat last: {distribution} ({size})',
      repeatLastUnavailable: 'The previously used environment is no longer available. Please select a new one.',
      unlockMore: 'Unlock more power',
    }
  },
  fr: {
    sessionComposer: {
      subtitle: 'Choisissez votre environnement et cliquez sur Cr\u00e9er \u2014 votre terminal sera pr\u00eat en 30 secondes environ.',
      stepDistribution: 'Choisissez votre environnement',
      stepSize: 'S\u00e9lectionnez les ressources',
      stepFeatures: 'Options suppl\u00e9mentaires',
      summary: 'R\u00e9sum\u00e9 de la session',
      distribution: 'Environnement',
      size: 'Ressources',
      features: 'Fonctionnalit\u00e9s',
      noDistributions: 'Aucun environnement disponible.',
      retry: 'R\u00e9essayer',
      requiresUpgrade: 'N\u00e9cessite un plan sup\u00e9rieur',
      belowMinSize: 'En dessous du minimum pour cet environnement',
      notInPlan: 'Non disponible dans votre plan',
      notSupported: 'Non support\u00e9 par cet environnement',
      sizeTooSmall: 'N\u00e9cessite une taille sup\u00e9rieure',
      unavailable: 'Indisponible',
      recommended: 'Recommand\u00e9',
      useCaseXS: 'Pratique l\u00e9g\u00e8re, CLI basique',
      useCaseS: 'Exercices standards',
      useCaseM: 'Environnement de d\u00e9veloppement',
      useCaseL: 'Multi-service, Docker',
      useCaseXL: 'Charges lourdes, clusters',
      repeatLast: 'R\u00e9p\u00e9ter : {distribution} ({size})',
      repeatLastUnavailable: 'L\u0027environnement utilis\u00e9 pr\u00e9c\u00e9demment n\u0027est plus disponible. Veuillez en s\u00e9lectionner un nouveau.',
      unlockMore: 'D\u00e9bloquer plus de puissance',
    }
  }
})

const { showWarning } = useNotification()

// Last session config persistence
const LAST_CONFIG_KEY = 'ocf-last-session-config'

interface LastSessionConfig {
  distribution: string
  size: string
  features: Record<string, boolean>
}

// State
const distributions = ref<Distribution[]>([])
const selectedDistribution = ref<Distribution | null>(null)
const sessionOptions = ref<SessionOptionsResponse | null>(null)
const selectedSize = ref<SessionOptionSize | null>(null)
const enabledFeatures = ref<Record<string, boolean>>({})
const loadingDistributions = ref(false)
const loadingOptions = ref(false)
const lastConfig = ref<LastSessionConfig | null>(null)

// Computed
const availableFeatures = computed<SessionOptionFeature[]>(() => sessionOptions.value?.allowed_features ?? [])

const visibleSizes = computed(() => {
  if (!sessionOptions.value) return []
  if (props.isAssignedSubscription) {
    // Hide locked sizes for org-managed plans (students can't upgrade)
    return sessionOptions.value.allowed_sizes.filter(s => s.allowed)
  }
  return sessionOptions.value.allowed_sizes
})

const hasLockedItems = computed(() => {
  if (!sessionOptions.value) return false
  const hasLockedSizes = sessionOptions.value.allowed_sizes.some(s => !s.allowed)
  const hasLockedFeatures = availableFeatures.value.some(f => !f.allowed)
  return hasLockedSizes || hasLockedFeatures
})

// Methods
async function loadDistributions() {
  loadingDistributions.value = true
  try {
    distributions.value = await terminalService.getDistributions(props.backendId)
  } catch (e) {
    console.error('Failed to load distributions:', e)
    distributions.value = []
  } finally {
    loadingDistributions.value = false
  }
}

async function selectDistribution(dist: Distribution) {
  selectedDistribution.value = dist
  selectedSize.value = null
  enabledFeatures.value = {}
  sessionOptions.value = null

  loadingOptions.value = true
  try {
    sessionOptions.value = await terminalService.getSessionOptions(dist.name, props.backendId, props.organizationId)
    // Auto-select default size if allowed
    if (dist.default_size_key && sessionOptions.value) {
      const defaultSize = sessionOptions.value.allowed_sizes.find(
        s => s.key === dist.default_size_key && s.allowed
      )
      if (defaultSize) selectedSize.value = defaultSize
    }
    // Fallback: auto-select smallest allowed size if nothing selected
    if (!selectedSize.value && sessionOptions.value) {
      const firstAllowed = sessionOptions.value.allowed_sizes.find(s => s.allowed)
      if (firstAllowed) selectedSize.value = firstAllowed
    }
    // Auto-enable all allowed features by default
    if (sessionOptions.value) {
      const defaults: Record<string, boolean> = {}
      for (const f of sessionOptions.value.allowed_features) {
        if (f.allowed) {
          defaults[f.key] = true
        }
      }
      enabledFeatures.value = defaults
    }
  } catch (e) {
    console.error('Failed to load session options:', e)
  } finally {
    loadingOptions.value = false
  }
}

function selectSize(size: SessionOptionSize) {
  selectedSize.value = size
}

function toggleFeature(key: string, enabled: boolean) {
  enabledFeatures.value = { ...enabledFeatures.value, [key]: enabled }
}

function getSizeUseCase(key: string): string {
  const useCases: Record<string, string> = {
    xs: t('sessionComposer.useCaseXS'),
    s: t('sessionComposer.useCaseS'),
    m: t('sessionComposer.useCaseM'),
    l: t('sessionComposer.useCaseL'),
    xl: t('sessionComposer.useCaseXL'),
  }
  return useCases[key.toLowerCase()] || ''
}

function saveLastConfig() {
  if (selectedDistribution.value && selectedSize.value) {
    const config: LastSessionConfig = {
      distribution: selectedDistribution.value.name,
      size: selectedSize.value.key,
      features: { ...enabledFeatures.value }
    }
    localStorage.setItem(LAST_CONFIG_KEY, JSON.stringify(config))
  }
}

async function repeatLastConfig() {
  if (!lastConfig.value) return
  // Find the distribution
  const dist = distributions.value.find(d => d.name === lastConfig.value!.distribution)
  if (!dist) {
    // Distribution no longer available — clear the stored config and inform user
    localStorage.removeItem(LAST_CONFIG_KEY)
    lastConfig.value = null
    showWarning(t('sessionComposer.repeatLastUnavailable'))
    return
  }
  await selectDistribution(dist)
  // Select size
  if (sessionOptions.value) {
    const size = sessionOptions.value.allowed_sizes.find(
      s => s.key === lastConfig.value!.size && s.allowed
    )
    if (size) selectedSize.value = size
  }
  // Set features
  if (lastConfig.value.features) {
    enabledFeatures.value = { ...lastConfig.value.features }
  }
}

function getOsIcon(osType?: string): string {
  switch (osType) {
    case 'apk': return 'fab fa-linux'
    case 'deb': return 'fab fa-ubuntu'
    case 'rpm': return 'fab fa-redhat'
    default: return 'fab fa-linux'
  }
}

function getReasonText(reason?: string): string {
  switch (reason) {
    case 'plan_limit': return t('sessionComposer.requiresUpgrade')
    case 'min_size': return t('sessionComposer.belowMinSize')
    case 'plan_disabled': return t('sessionComposer.notInPlan')
    case 'not_supported': return t('sessionComposer.notSupported')
    case 'size_too_small': return t('sessionComposer.sizeTooSmall')
    default: return t('sessionComposer.unavailable')
  }
}

// Expose for parent
defineExpose({
  selectedDistribution,
  selectedSize,
  enabledFeatures,
  isReady: computed(() => !!selectedDistribution.value && !!selectedSize.value),
  loadDistributions,
  saveLastConfig
})

onMounted(() => {
  // Load last config from localStorage
  try {
    const stored = localStorage.getItem(LAST_CONFIG_KEY)
    if (stored) lastConfig.value = JSON.parse(stored)
  } catch (e) { /* ignore invalid stored data */ }
  loadDistributions()
})

// Re-fetch session options when org context changes (different plan)
watch(() => props.organizationId, () => {
  if (selectedDistribution.value) {
    selectDistribution(selectedDistribution.value)
  }
})
</script>

<style scoped>
.session-composer {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

/* Steps */
.composer-step {
  position: relative;
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  margin: 0;
}

.composer-step legend {
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
  padding: 0 var(--spacing-sm);
}

/* Skeleton loading */
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--spacing-sm);
}

.skeleton-card {
  height: 80px;
  background: var(--color-bg-tertiary);
  border-radius: var(--border-radius-md);
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.skeleton-sizes {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.skeleton-pill {
  width: 120px;
  height: 64px;
  background: var(--color-bg-tertiary);
  border-radius: var(--border-radius-md);
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Distribution grid */
.distribution-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--spacing-sm);
}

.distribution-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  background: var(--color-bg-secondary);
  border: var(--border-width-medium) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  cursor: pointer;
  transition: all var(--transition-base);
  text-align: left;
  width: 100%;
}

.distribution-card:hover:not(:disabled) {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.distribution-card.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
}

.distribution-card:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dist-icon {
  font-size: var(--font-size-2xl);
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.distribution-card.selected .dist-icon {
  color: var(--color-primary);
}

.dist-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.dist-info strong {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
}

.dist-info small {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  line-height: 1.3;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: var(--spacing-xl) var(--spacing-md);
  color: var(--color-text-muted);
}

.btn-retry {
  margin-top: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: background var(--transition-fast);
}

.btn-retry:hover {
  background: var(--color-primary-hover);
}

/* Config row: size + features inline */
.config-row {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-xs);
}

.config-divider {
  border: none;
  border-top: 1px solid var(--color-border-light);
  margin: var(--spacing-xs) 0;
}

.config-icon {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  width: 16px;
  text-align: center;
  flex-shrink: 0;
}

.config-label {
  font-size: var(--font-size-xs, 11px);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.unlock-link {
  position: absolute;
  bottom: var(--spacing-sm, 8px);
  right: var(--spacing-md, 16px);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-xs, 12px);
  color: var(--color-primary);
  text-decoration: none;
  font-weight: var(--font-weight-semibold);
  transition: opacity 0.15s;
}

.unlock-link:hover {
  opacity: 0.8;
}

.unlock-link .fa-bolt {
  color: var(--color-warning, #f6ad55);
}

/* Size pills — compact horizontal strip */
.size-strip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-sm);
}

.size-pills {
  display: flex;
  gap: 4px;
}

.size-pill {
  position: relative;
  padding: 6px 14px;
  border: 2px solid var(--color-border-light);
  border-radius: var(--border-radius-full, 999px);
  background: var(--color-bg-secondary);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.size-pill:hover:not(.disabled):not(:disabled) {
  border-color: var(--color-primary);
}

.size-pill.selected {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: white;
}

.size-pill.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pill-recommended {
  font-size: 8px;
  margin-left: 3px;
  color: var(--color-warning, #f6ad55);
  vertical-align: middle;
}

.size-pill.selected .pill-recommended {
  color: rgba(255, 255, 255, 0.85);
}

.pill-lock {
  font-size: 9px;
  margin-left: 3px;
  color: var(--color-warning);
}

.size-detail {
  font-size: var(--font-size-xs, 11px);
  color: var(--color-text-muted);
}

/* Feature chips — compact inline toggles */
.feature-strip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-sm);
}

.feature-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.feature-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border: 2px solid var(--color-border-light);
  border-radius: var(--border-radius-full, 999px);
  background: var(--color-bg-secondary);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.feature-chip input[type="checkbox"] {
  display: none;
}

.feature-chip:hover:not(.disabled) {
  border-color: var(--color-primary);
}

.feature-chip.active {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}

.feature-chip.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.feature-chip .fa-lock {
  font-size: 9px;
  color: var(--color-warning);
}

/* Repeat last config */
.repeat-last-config {
  margin-bottom: var(--spacing-md, 16px);
}

.btn-repeat {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--color-bg-tertiary, #f0f4f8);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--border-radius-md, 8px);
  color: var(--color-text-primary);
  cursor: pointer;
  font-size: var(--font-size-sm, 14px);
  transition: all 0.2s;
}

.btn-repeat:hover:not(:disabled) {
  background: var(--color-primary-bg, rgba(66, 153, 225, 0.1));
  border-color: var(--color-primary);
}

.btn-repeat:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}


/* Responsive */
@media (max-width: 768px) {
  .distribution-grid {
    grid-template-columns: 1fr;
  }

  .size-pills {
    flex-wrap: wrap;
  }

  .feature-chips {
    flex-wrap: wrap;
  }
}
</style>
