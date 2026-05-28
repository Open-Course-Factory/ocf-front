<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */
-->

<template>
  <div v-if="subscription" class="collapsible-section">
    <button
      type="button"
      class="collapsible-header"
      @click="isExpanded = !isExpanded"
    >
      <i class="fas" :class="isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
      {{ t('terminals.currentUsage') }}
      <span class="usage-badge">
        <i class="fas fa-coins"></i>
        {{ currentCount }}
      </span>
    </button>
    <div v-show="isExpanded" class="collapsible-content">
      <div class="usage-header">
        <Button
          size="sm"
          variant="outline-primary"
          :icon="refreshing ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'"
          :disabled="refreshing"
          :title="t('terminals.refreshUsage')"
          @click="$emit('refresh')"
        >
          {{ t('ui.refresh') }}
        </Button>
      </div>

      <div class="usage-stats">
        <div class="usage-item">
          <span class="usage-label">
            <i class="fas fa-id-badge"></i>
            {{ t('terminals.planSource') }}:
          </span>
          <span class="usage-value">
            {{ planName }}
            <small class="text-muted">({{ planSourceLabel }})</small>
          </span>
        </div>
        <div class="usage-item">
          <span class="usage-label">
            <i class="fas fa-server"></i>
            {{ t('terminals.capacity') }}:
          </span>
          <span class="usage-value">
            <span v-if="loading || refreshing" class="text-muted">
              <i class="fas fa-spinner fa-spin"></i>
            </span>
            <span v-else>{{ capacityLabel }}</span>
          </span>
        </div>
        <div class="usage-item">
          <span class="usage-label">
            <i class="fas fa-terminal"></i>
            {{ t('terminals.activeNow') }}:
          </span>
          <span class="usage-value">
            <span v-if="loading || refreshing" class="text-muted">
              <i class="fas fa-spinner fa-spin"></i>
            </span>
            <span v-else>{{ currentCount }}</span>
          </span>
        </div>
        <div class="usage-item">
          <span class="usage-label">
            <i class="fas fa-clock"></i>
            {{ capitalizeFirst(t('terminals.sessionDuration')) }}:
          </span>
          <span class="usage-value">
            {{ sessionDuration }}h
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
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import Button from '../UI/Button.vue'
import { formatBudgetAsSizes, CANONICAL_SIZE_CATALOG } from '../../utils/quotaFormatters'
import type { Subscription } from '../../types'

defineEmits<{
  refresh: []
}>()

const { t } = useTranslations({
  en: {
    terminals: {
      currentUsage: 'Current Usage',
      refreshUsage: 'Refresh usage',
      capacity: 'Capacity',
      activeNow: 'Active now',
      unlimited: 'Unlimited',
      or: 'OR',
      sessionDuration: 'session duration',
      planSource: 'Plan',
      sourcePersonal: 'personal',
      sourceOrganization: 'provided by {orgName}',
      autoRefreshInfo: 'Usage data is automatically refreshed every {minutes} minutes.'
    },
    ui: {
      refresh: 'Refresh'
    }
  },
  fr: {
    terminals: {
      currentUsage: 'Utilisation Actuelle',
      refreshUsage: 'Actualiser l\'utilisation',
      capacity: 'Capacité',
      activeNow: 'Actifs',
      unlimited: 'Illimité',
      or: 'OU',
      sessionDuration: 'durée de session',
      planSource: 'Plan',
      sourcePersonal: 'personnel',
      sourceOrganization: 'fourni par {orgName}',
      autoRefreshInfo: 'Les données d\'utilisation sont automatiquement actualisées toutes les {minutes} minutes.'
    },
    ui: {
      refresh: 'Actualiser'
    }
  }
})

interface Props {
  subscription: Subscription | null
  currentCount: number
  loading: boolean
  refreshing: boolean
  refreshIntervalMinutes: number
}

const props = defineProps<Props>()

const isExpanded = ref(false)

const planName = computed(() => {
  return props.subscription?.subscription_plan?.name ||
         props.subscription?.plan_name ||
         '—'
})

const isOrgSubscription = computed(() => {
  const sub = props.subscription
  return sub?.subscription_type === 'assigned' || !!sub?.subscription_batch_id
})

const planSourceLabel = computed(() => {
  if (isOrgSubscription.value) {
    const orgName = props.subscription?.batch_owner_name || ''
    return t('terminals.sourceOrganization', { orgName: orgName || '—' })
  }
  return t('terminals.sourcePersonal')
})

const sessionDuration = computed(() => {
  const planMinutes = props.subscription?.subscription_plan?.max_session_duration_minutes
  if (planMinutes && planMinutes > 0) {
    return planMinutes / 60
  }
  return props.subscription?.plan_features?.session_duration_hours || 1
})

// Customer-facing capacity: render the plan's CPU/RAM budget as a size-count
// summary (e.g. "3 L OR 6 M OR 12 S"). When the budget is 0/0 we treat that as
// "unlimited" since size-count language cannot meaningfully express "∞".
const capacityLabel = computed(() => {
  const plan = props.subscription?.subscription_plan
  if (!plan) return '—'
  const summary = formatBudgetAsSizes(plan, CANONICAL_SIZE_CATALOG, t('terminals.or'))
  return summary || t('terminals.unlimited')
})

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
</script>

<style scoped>
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
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.usage-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--spacing-md);
}

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

.text-muted {
  color: var(--color-text-muted);
}

@media (max-width: 768px) {
  .collapsible-header {
    font-size: var(--font-size-sm);
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .collapsible-content {
    padding: var(--spacing-md);
  }
}
</style>
