<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */
-->

<template>
  <div class="session-composer">
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
    </fieldset>

    <!-- Step 2: Size Selection (shown after distribution selected) -->
    <fieldset v-if="selectedDistribution" class="composer-step">
      <legend>{{ t('sessionComposer.stepSize') }}</legend>

      <div v-if="loadingOptions" class="skeleton-sizes">
        <div v-for="i in 5" :key="i" class="skeleton-pill" />
      </div>

      <div v-else-if="sessionOptions" class="size-selector">
        <button
          v-for="size in sessionOptions.allowed_sizes"
          :key="size.key"
          type="button"
          class="size-option"
          :class="{
            selected: selectedSize?.key === size.key,
            disabled: !size.allowed
          }"
          :disabled="!size.allowed || disabled"
          @click="size.allowed && selectSize(size)"
        >
          <div class="size-label">{{ size.key.toUpperCase() }}</div>
          <div class="size-specs">{{ size.cpu }} CPU {{ size.cpu_allowance }} &bull; {{ size.memory }}</div>
          <div v-if="!size.allowed" class="size-reason">
            <i class="fas fa-lock" />
            {{ getReasonText(size.reason) }}
          </div>
        </button>
      </div>
    </fieldset>

    <!-- Step 3: Features (shown after size selected) -->
    <fieldset v-if="selectedSize && availableFeatures.length > 0" class="composer-step">
      <legend>{{ t('sessionComposer.stepFeatures') }}</legend>

      <div class="features-list">
        <div
          v-for="feature in availableFeatures"
          :key="feature.key"
          class="feature-toggle"
          :class="{ disabled: !feature.allowed }"
        >
          <label class="feature-label">
            <input
              type="checkbox"
              :checked="enabledFeatures[feature.key]"
              :disabled="!feature.allowed || disabled"
              @change="toggleFeature(feature.key, ($event.target as HTMLInputElement).checked)"
            />
            <span class="toggle-track"><span class="toggle-thumb" /></span>
            <span class="feature-info">
              <strong>{{ feature.name }}</strong>
              <small v-if="feature.description">{{ feature.description }}</small>
            </span>
          </label>
          <div v-if="!feature.allowed" class="feature-reason">
            <i class="fas fa-lock" />
            {{ getReasonText(feature.reason) }}
          </div>
        </div>
      </div>
    </fieldset>

    <!-- Live Summary -->
    <div v-if="selectedDistribution" class="composer-summary">
      <h4>{{ t('sessionComposer.summary') }}</h4>
      <div class="summary-items">
        <div class="summary-item">
          <span class="summary-label">{{ t('sessionComposer.distribution') }}</span>
          <span class="summary-value">{{ selectedDistribution.description || selectedDistribution.name }}</span>
        </div>
        <div v-if="selectedSize" class="summary-item">
          <span class="summary-label">{{ t('sessionComposer.size') }}</span>
          <span class="summary-value">
            {{ selectedSize.key.toUpperCase() }} — {{ selectedSize.cpu }} CPU, {{ selectedSize.memory }} RAM, {{ selectedSize.disk }}
          </span>
        </div>
        <div v-if="activeFeatureNames.length" class="summary-item">
          <span class="summary-label">{{ t('sessionComposer.features') }}</span>
          <span class="summary-value">{{ activeFeatureNames.join(', ') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { terminalService } from '../../services/domain/terminal'
import type { Distribution, SessionOptionSize, SessionOptionFeature, SessionOptionsResponse } from '../../types/terminal'

const props = defineProps<{
  backendId?: string
  disabled?: boolean
}>()

const { t } = useTranslations({
  en: {
    sessionComposer: {
      stepDistribution: 'Choose your environment',
      stepSize: 'Select resources',
      stepFeatures: 'Enable features',
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
    }
  },
  fr: {
    sessionComposer: {
      stepDistribution: 'Choisissez votre environnement',
      stepSize: 'S\u00e9lectionnez les ressources',
      stepFeatures: 'Activez les fonctionnalit\u00e9s',
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
    }
  }
})

// State
const distributions = ref<Distribution[]>([])
const selectedDistribution = ref<Distribution | null>(null)
const sessionOptions = ref<SessionOptionsResponse | null>(null)
const selectedSize = ref<SessionOptionSize | null>(null)
const enabledFeatures = ref<Record<string, boolean>>({})
const loadingDistributions = ref(false)
const loadingOptions = ref(false)

// Computed
const availableFeatures = computed<SessionOptionFeature[]>(() => sessionOptions.value?.allowed_features ?? [])
const activeFeatureNames = computed(() =>
  availableFeatures.value
    .filter(f => enabledFeatures.value[f.key])
    .map(f => f.name)
)

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
    sessionOptions.value = await terminalService.getSessionOptions(dist.name, props.backendId)
    // Auto-select default size if allowed
    if (dist.default_size_key && sessionOptions.value) {
      const defaultSize = sessionOptions.value.allowed_sizes.find(
        s => s.key === dist.default_size_key && s.allowed
      )
      if (defaultSize) selectedSize.value = defaultSize
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
  loadDistributions
})

onMounted(loadDistributions)
</script>

<style scoped>
.session-composer {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* Steps */
.composer-step {
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
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

/* Size selector */
.size-selector {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.size-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 110px;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-secondary);
  border: var(--border-width-medium) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
  text-align: center;
}

.size-option:hover:not(.disabled):not(:disabled) {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.size-option.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
}

.size-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.size-label {
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
}

.size-option.selected .size-label {
  color: var(--color-primary);
}

.size-specs {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  white-space: nowrap;
}

.size-reason {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: var(--color-warning-text);
  margin-top: 2px;
}

.size-reason i {
  font-size: 10px;
  color: var(--color-warning);
}

/* Features */
.features-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.feature-toggle {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  border: var(--border-width-thin) solid var(--color-border-light);
}

.feature-toggle.disabled {
  opacity: 0.5;
}

.feature-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  cursor: pointer;
}

.feature-toggle.disabled .feature-label {
  cursor: not-allowed;
}

.feature-label input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-track {
  position: relative;
  width: 40px;
  height: 22px;
  background: var(--color-gray-300);
  border-radius: var(--border-radius-full);
  transition: background var(--transition-fast);
  flex-shrink: 0;
}

.feature-label input[type="checkbox"]:checked + .toggle-track {
  background: var(--color-primary);
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  background: var(--color-white);
  border-radius: 50%;
  transition: transform var(--transition-fast);
  box-shadow: var(--shadow-xs);
}

.feature-label input[type="checkbox"]:checked + .toggle-track .toggle-thumb {
  transform: translateX(18px);
}

.feature-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.feature-info strong {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
}

.feature-info small {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.feature-reason {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: var(--color-warning-text);
  padding-left: calc(40px + var(--spacing-md));
}

.feature-reason i {
  font-size: 10px;
  color: var(--color-warning);
}

/* Summary */
.composer-summary {
  background: var(--color-bg-secondary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-md) var(--spacing-lg);
}

.composer-summary h4 {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.summary-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xs) 0;
}

.summary-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  font-weight: var(--font-weight-medium);
}

.summary-value {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  text-align: right;
}

/* Responsive */
@media (max-width: 768px) {
  .distribution-grid {
    grid-template-columns: 1fr;
  }

  .size-selector {
    flex-direction: column;
  }

  .size-option {
    width: 100%;
  }

  .summary-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }

  .summary-value {
    text-align: left;
  }
}
</style>
