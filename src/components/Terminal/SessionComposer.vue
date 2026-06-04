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
          v-for="dist in sortedDistributions"
          :key="dist.name"
          type="button"
          class="distribution-card"
          :class="{ selected: selectedDistribution?.name === dist.name, dedicated: !dist.is_global }"
          :disabled="disabled"
          @click="selectDistribution(dist)"
        >
          <div class="dist-icon">
            <i :class="getDistIcon(dist)" :style="getDistIconColor(dist)" />
          </div>
          <div class="dist-info">
            <strong>{{ dist.name }}</strong>
            <small>{{ dist.description }}</small>
          </div>
          <span v-if="!dist.is_global" class="dist-dedicated-badge" :title="t('sessionComposer.dedicatedEnv')">
            <i class="fas fa-server"></i>
          </span>
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
          <p v-if="remainingResourcesLabel" class="budget-resources">
            <i class="fas fa-server budget-summary-icon"></i>
            {{ remainingResourcesLabel }}
          </p>
          <!-- Unlimited plans carry no per-size budget — show an uncapped affordance. -->
          <p v-if="isUnlimited" class="budget-summary">
            <i class="fas fa-infinity budget-summary-icon"></i>
            {{ t('sessionComposer.budgetUnlimited') }}
          </p>
          <!-- Budget summary line — hidden when budget exhausted (handled by empty string). -->
          <p v-else-if="budgetSummary" class="budget-summary">
            <i class="fas fa-bolt budget-summary-icon"></i>
            {{ t('sessionComposer.youCanSpawn', { summary: budgetSummary }) }}
          </p>
          <p v-else class="budget-summary budget-summary-exhausted">
            <i class="fas fa-exclamation-triangle budget-summary-icon"></i>
            {{ t('sessionComposer.budgetAllExhausted') }}
          </p>
          <div class="size-pills">
            <button
              v-for="size in visibleSizes"
              :key="size.key"
              type="button"
              class="size-pill"
              :class="{
                selected: selectedSize?.key === size.key,
                disabled: !size.allowed,
                exhausted: isExhausted(size)
              }"
              :disabled="!size.allowed || disabled || isExhausted(size)"
              :title="getSizeUseCase(size.key) + ' — ' + getEffectiveCpuLabel(size) + ', ' + size.memory + (!size.allowed ? ' — ' + getReasonText(size.reason) : '')"
              @click="size.allowed && !isExhausted(size) && selectSize(size)"
            >
              {{ size.key.toUpperCase() }}
              <i v-if="size.key === selectedDistribution?.default_size_key" class="fas fa-star pill-recommended" :title="t('sessionComposer.recommended')"></i>
              <span
                v-if="isUnlimited"
                class="pill-badge"
                :title="t('sessionComposer.remainingUnlimited')"
              >×∞</span>
              <span
                v-else
                class="pill-badge"
                :class="{ 'pill-badge-zero': size.remaining_count === 0 }"
                :title="t('sessionComposer.remainingBadge', { n: size.remaining_count })"
              >×{{ size.remaining_count }}</span>
              <i v-if="!size.allowed" class="fas fa-lock pill-lock" />
            </button>
          </div>
          <span v-if="selectedSize" class="size-detail">
            {{ getSizeUseCase(selectedSize.key) }} · {{ getEffectiveCpuLabel(selectedSize) }}, {{ selectedSize.memory }}
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
              <span class="feature-chip-text">
                <span>{{ feature.name }}</span>
                <small v-if="feature.description" class="feature-chip-desc">{{ feature.description }}</small>
              </span>
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
import { terminalService } from '../../services/domain/terminal'
import { summarizeRemaining, capacityRank, formatMemoryMb } from '../../utils/quotaFormatters'
import { formatMcpuAsVcpu, effectiveCpuMcpu } from '../../utils/formatters'
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
      stepDistribution: 'Start your terminal',
      stepSize: 'Select resources',
      stepFeatures: 'Additional options',
      summary: 'Session summary',
      distribution: 'Environment',
      size: 'Resources',
      features: 'Features',
      noDistributions: 'No environments available.',
      dedicatedEnv: 'Dedicated to this server',
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
      unlockMore: 'Unlock more power',
      youCanSpawn: 'You can spawn {summary}',
      remainingResources: 'You have {cpu} and {mem} of RAM remaining',
      unlimitedCpu: 'unlimited CPU',
      unlimitedMem: 'unlimited RAM',
      or: 'OR',
      remainingBadge: '{n} remaining',
      remainingUnlimited: 'Unlimited',
      budgetUnlimited: 'Unlimited capacity — spawn any size.',
      reasonPlanRestriction: 'Restricted by your plan',
      reasonBudgetExhausted: 'No capacity left for this size right now — pick a smaller size or stop a session',
      budgetAllExhausted: 'No capacity left — stop a session to free up resources.',
    }
  },
  fr: {
    sessionComposer: {
      subtitle: 'Choisissez votre environnement et cliquez sur Cr\u00e9er \u2014 votre terminal sera pr\u00eat en 30 secondes environ.',
      stepDistribution: 'D\u00e9marrer votre terminal',
      stepSize: 'S\u00e9lectionnez les ressources',
      stepFeatures: 'Options suppl\u00e9mentaires',
      summary: 'R\u00e9sum\u00e9 de la session',
      distribution: 'Environnement',
      size: 'Ressources',
      features: 'Fonctionnalit\u00e9s',
      noDistributions: 'Aucun environnement disponible.',
      dedicatedEnv: 'D\u00e9di\u00e9 \u00e0 ce serveur',
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
      unlockMore: 'D\u00e9bloquer plus de puissance',
      youCanSpawn: 'Vous pouvez lancer {summary}',
      remainingResources: 'Il vous reste {cpu} et {mem} de RAM',
      unlimitedCpu: 'CPU illimité',
      unlimitedMem: 'RAM illimitée',
      or: 'OU',
      remainingBadge: '{n} restant(s)',
      remainingUnlimited: 'Illimité',
      budgetUnlimited: 'Capacité illimitée — lancez n\'importe quelle taille.',
      reasonPlanRestriction: 'Restreint par votre forfait',
      reasonBudgetExhausted: 'Plus de capacit\u00e9 pour cette taille \u2014 choisissez une taille plus petite ou arr\u00eatez une session',
      budgetAllExhausted: 'Plus de capacit\u00e9 disponible \u2014 arr\u00eatez une session pour lib\u00e9rer des ressources.',
    }
  }
})


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

// Sort: dedicated (backend-specific) distributions grouped together at the end
const sortedDistributions = computed(() =>
  [...distributions.value].sort((a, b) => {
    if (a.is_global === b.is_global) return 0
    return a.is_global ? -1 : 1
  })
)

// Computed
// `persistence` was historically surfaced both here (as a feature chip) and
// in the launcher (as a dedicated radio). The radio is the canonical UI —
// filter the chip out so we don't render the same concept twice. The filter is
// a defensive no-op once the backend stops emitting the feature.
const availableFeatures = computed<SessionOptionFeature[]>(
  () => (sessionOptions.value?.allowed_features ?? []).filter(f => f.key !== 'persistence')
)

// Unlimited plans: the backend signals this with `quota.scope === 'unlimited'`
// and marks every size `allowed: true` with `remaining_count: 0`. That 0 means
// "uncapped, ignore the count" — NOT "exhausted". Consume the backend flag
// directly (SSOT) instead of inferring from max_cpu.
const isUnlimited = computed(() => sessionOptions.value?.quota?.scope === 'unlimited')

// A size is exhausted only in budget mode (scope user/organization). Under an
// unlimited plan, remaining_count === 0 is meaningless and must not lock pills.
function isExhausted(size: SessionOptionSize): boolean {
  return !isUnlimited.value && size.remaining_count === 0
}

// Capacity-descending order (xl > l > m > s > xs) is provided by
// `capacityRank` from `utils/quotaFormatters.ts` — single source of truth.

const visibleSizes = computed(() => {
  if (!sessionOptions.value) return []
  // Always exclude sizes below distribution minimum — they don't exist for this distro
  let sizes = sessionOptions.value.allowed_sizes.filter(s => s.reason !== 'min_size')
  if (props.isAssignedSubscription) {
    // Hide locked sizes for org-managed plans (students can't upgrade)
    sizes = sizes.filter(s => s.allowed)
  }
  // Sort descending by capacity (xl, l, m, s, xs) so the largest available
  // size is visually first.
  return [...sizes].sort((a, b) => capacityRank(a.key) - capacityRank(b.key))
})

// Top-line size-count summary of remaining capacity.
const budgetSummary = computed(() => {
  if (!sessionOptions.value) return ''
  return summarizeRemaining(sessionOptions.value.allowed_sizes, t('sessionComposer.or'))
})

// Raw remaining CPU/RAM the user still has against the plan budget.
// Shown above the size-count summary so they can see why a size is exhausted.
const remainingResourcesLabel = computed(() => {
  const quota = sessionOptions.value?.quota
  if (!quota) return ''
  // Unlimited plans surface the uncapped affordance via the budget-summary line
  // instead — avoid a redundant "unlimited CPU and unlimited RAM" duplicate.
  if (isUnlimited.value) return ''
  const cpuPart = quota.max_cpu === 0
    ? t('sessionComposer.unlimitedCpu')
    : `${formatMcpuAsVcpu(quota.remaining_cpu)} vCPU`
  const memPart = quota.max_memory_mb === 0
    ? t('sessionComposer.unlimitedMem')
    : formatMemoryMb(quota.remaining_memory_mb)
  return t('sessionComposer.remainingResources', { cpu: cpuPart, mem: memPart })
})

const hasLockedItems = computed(() => {
  if (!sessionOptions.value) return false
  const hasLockedSizes = sessionOptions.value.allowed_sizes.some(s => !s.allowed && s.reason !== 'min_size')
  const hasLockedFeatures = availableFeatures.value.some(f => !f.allowed)
  return hasLockedSizes || hasLockedFeatures
})

// Methods
async function loadDistributions() {
  loadingDistributions.value = true
  try {
    distributions.value = await terminalService.getDistributions(props.backendId)
    // Auto-restore last used config if available
    if (lastConfig.value && distributions.value.length > 0) {
      await restoreLastConfig()
    }
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
    // A size is selectable when the plan allows it AND it isn't exhausted.
    // Under an unlimited plan remaining_count is always 0 but the size is still
    // selectable, so `isExhausted` (which honors quota.scope) is the gate.
    const isSelectable = (s: SessionOptionSize) =>
      s.allowed && !isExhausted(s)
    // Auto-select default size if selectable
    if (dist.default_size_key && sessionOptions.value) {
      const defaultSize = sessionOptions.value.allowed_sizes.find(
        s => s.key === dist.default_size_key && isSelectable(s)
      )
      if (defaultSize) selectedSize.value = defaultSize
    }
    // Fallback: auto-select first selectable size if nothing selected
    if (!selectedSize.value && sessionOptions.value) {
      const firstAllowed = sessionOptions.value.allowed_sizes.find(isSelectable)
      if (firstAllowed) selectedSize.value = firstAllowed
    }
    // Auto-enable all allowed features by default. We deliberately skip
    // `persistence` because that concept is owned by the launcher's
    // persistence_mode radio — auto-toggling it as a feature would either be
    // a no-op (BE ignores it) or fight the radio (if BE wires both).
    if (sessionOptions.value) {
      const defaults: Record<string, boolean> = {}
      for (const f of sessionOptions.value.allowed_features) {
        if (f.allowed && f.key !== 'persistence') {
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

// Effective vCPU per size from the mCPU SSOT, formatted as a float.
// tt-backend's raw `size.cpu` is the cpuset count BEFORE applying cpu_allowance
// (XS reports `cpu=1, cpu_allowance='50%'` — the effective limit is 0.5 vCPU).
// The budget engine charges the effective value (500 mCPU for XS), so the
// picker must surface the same number, not the raw cpuset count.
// Prefers the backend `cpu_mcpu` field; falls back to CANONICAL_SIZE_CATALOG
// when the backend didn't populate it (via `effectiveCpuMcpu`).
function getEffectiveCpuLabel(size: { key: string; cpu_mcpu?: number }): string {
  const mcpu = effectiveCpuMcpu(size)
  if (mcpu === 0) return ''
  return `${formatMcpuAsVcpu(mcpu)} vCPU`
}

function saveLastConfig() {
  if (selectedDistribution.value && selectedSize.value) {
    // Merge with any existing fields so we don't clobber user preferences from
    // sibling controls. `persistence_mode` is intentionally stripped — the
    // launcher no longer persists that choice across mounts (any value written
    // by older builds is a stale artefact we clean up here).
    let existing: Record<string, unknown> = {}
    try {
      const stored = localStorage.getItem(LAST_CONFIG_KEY)
      if (stored) existing = JSON.parse(stored) || {}
    } catch { existing = {} }
    delete existing.persistence_mode
    const config = {
      ...existing,
      distribution: selectedDistribution.value.name,
      size: selectedSize.value.key,
      features: { ...enabledFeatures.value }
    }
    localStorage.setItem(LAST_CONFIG_KEY, JSON.stringify(config))
  }
}

async function restoreLastConfig() {
  if (!lastConfig.value) return
  const dist = distributions.value.find(d => d.name === lastConfig.value!.distribution)
  if (!dist) {
    // Distribution no longer available — silently clear
    localStorage.removeItem(LAST_CONFIG_KEY)
    lastConfig.value = null
    return
  }
  await selectDistribution(dist)
  // Restore size if still allowed
  if (sessionOptions.value && lastConfig.value) {
    const size = sessionOptions.value.allowed_sizes.find(
      s => s.key === lastConfig.value!.size && s.allowed
    )
    if (size) selectedSize.value = size
  }
  // Restore features
  if (lastConfig.value?.features) {
    enabledFeatures.value = { ...lastConfig.value.features }
  }
}

// FontAwesome brand icons by distribution name, then os_type fallback, then generic
// Icons from FontAwesome 6.7.2 (loaded via CDN in index.html)
// Distributions without a specific icon fall back to generic Linux penguin
const DIST_ICONS: Record<string, string> = {
  ubuntu: 'fab fa-ubuntu',
  debian: 'fab fa-debian',
  fedora: 'fab fa-fedora',
  redhat: 'fab fa-redhat',
  suse: 'fab fa-suse',
}
const OS_TYPE_ICONS: Record<string, string> = {
  rpm: 'fab fa-redhat',
}
// Brand colors per distribution (applied even when using fallback icon)
const DIST_COLORS: Record<string, string> = {
  ubuntu: '#E95420',
  debian: '#A80030',
  fedora: '#51A2DA',
  redhat: '#EE0000',
  almalinux: '#0F4266',
  rocky: '#10B981',
  suse: '#73BA25',
  alpine: '#0D597F',
}

function getDistIcon(dist: Distribution): string {
  // Match by name (check if any key is a substring of the dist name)
  const nameLower = dist.name.toLowerCase()
  for (const [key, icon] of Object.entries(DIST_ICONS)) {
    if (nameLower.includes(key)) return icon
  }
  // Fallback to os_type
  if (dist.os_type && OS_TYPE_ICONS[dist.os_type]) return OS_TYPE_ICONS[dist.os_type]
  // Generic Linux
  return 'fab fa-linux'
}

function getDistIconColor(dist: Distribution): Record<string, string> {
  const nameLower = dist.name.toLowerCase()
  for (const [key, color] of Object.entries(DIST_COLORS)) {
    if (nameLower.includes(key)) return { color }
  }
  return {}
}

function getReasonText(reason?: string): string {
  switch (reason) {
    case 'plan_limit': return t('sessionComposer.requiresUpgrade')
    case 'min_size': return t('sessionComposer.belowMinSize')
    case 'plan': return t('sessionComposer.notInPlan')
    case 'plan_disabled': return t('sessionComposer.notInPlan')
    case 'plan_restriction': return t('sessionComposer.reasonPlanRestriction')
    case 'not_supported': return t('sessionComposer.notSupported')
    case 'size_too_small': return t('sessionComposer.sizeTooSmall')
    // The backend reports the granular cause (CPU vs memory) so it can act on
    // it, but the user only needs to know "the size won't fit right now" —
    // both reasons collapse to the same customer-facing message to keep the UX
    // in size-count language (see memory entry `feedback_quota_ux_size_count.md`).
    case 'budget_cpu_exceeded':
    case 'budget_memory_exceeded':
      return t('sessionComposer.reasonBudgetExhausted')
    default: return t('sessionComposer.unavailable')
  }
}

// Expose for parent
defineExpose({
  selectedDistribution,
  selectedSize,
  enabledFeatures,
  isReady: computed(() => !!selectedDistribution.value && !!selectedSize.value),
  loadingOptions,
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
  position: relative;
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

.distribution-card.dedicated {
  border-left: 3px solid var(--color-info, #4299e1);
}

.distribution-card.dedicated.selected {
  border-left-color: var(--color-primary);
}

.distribution-card:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dist-dedicated-badge {
  position: absolute;
  top: 4px;
  right: 6px;
  font-size: 9px;
  color: var(--color-info, #4299e1);
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
  display: inline-flex;
  align-items: center;
  gap: 3px;
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

.size-pill.exhausted {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Budget summary line shown above the size pills */
.budget-summary {
  width: 100%;
  margin: 0;
  padding: 4px 8px;
  font-size: var(--font-size-xs, 12px);
  color: var(--color-text-secondary);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.budget-resources {
  width: 100%;
  margin: 0;
  padding: 4px 8px;
  font-size: var(--font-size-xs, 12px);
  color: var(--color-text-primary);
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.budget-summary-icon {
  color: var(--color-primary);
  font-size: 11px;
}

.budget-summary-exhausted {
  color: var(--color-warning-text, var(--color-warning));
}

.budget-summary-exhausted .budget-summary-icon {
  color: var(--color-warning);
}

/* Per-pill "×N remaining" badge — small, dimmed when zero */
.pill-badge {
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
  padding: 1px 6px;
  border-radius: var(--border-radius-full, 999px);
  background: var(--color-bg-tertiary, var(--color-surface-variant));
  color: var(--color-text-secondary);
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
  line-height: 1.2;
}

.size-pill.selected .pill-badge {
  /* On the strong-primary background of a selected pill, a translucent white
   * overlay reads cleanly in both light and dark themes. */
  background: var(--overlay-white-25);
  color: var(--color-white, #fff);
}

.pill-badge-zero {
  opacity: 0.55;
}

.pill-recommended {
  font-size: 7px;
  color: var(--color-warning, #f6ad55);
}

.size-pill.selected .pill-recommended {
  color: var(--color-warning, #f6ad55);
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

.feature-chip-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.feature-chip-desc {
  font-size: var(--font-size-xs, 10px);
  color: var(--color-text-muted);
  font-weight: var(--font-weight-normal);
}

.feature-chip.active .feature-chip-desc {
  color: var(--color-primary);
  opacity: 0.7;
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
