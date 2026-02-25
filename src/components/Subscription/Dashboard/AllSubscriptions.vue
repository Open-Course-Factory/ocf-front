<template>
  <div v-if="isAdmin" id="all-subscriptions" class="all-subscriptions">
    <div class="collapsible-header" @click="isExpanded = !isExpanded">
      <h3>
        <i class="fas fa-layer-group"></i>
        {{ t('subscriptionPlans.advancedDetails') }}
      </h3>
      <button class="collapse-toggle" :aria-expanded="isExpanded">
        <i :class="isExpanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
        {{ isExpanded ? t('subscriptionPlans.hideDetails') : t('subscriptionPlans.showDetails') }}
      </button>
    </div>

    <div v-if="isLoading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>{{ t('subscriptionPlans.loadingSubscriptions') }}</p>
    </div>

    <div v-else-if="!subscriptions || subscriptions.length === 0" class="empty-state">
      <i class="fas fa-inbox fa-2x"></i>
      <p>{{ t('subscriptionPlans.noSubscriptions') }}</p>
    </div>

    <div v-else-if="isExpanded" class="subscriptions-list">
      <!-- Info banner for stacked subscriptions -->
      <div v-if="subscriptions.length > 1" class="stacked-info-banner">
        <i class="fas fa-info-circle"></i>
        <p>{{ t('subscriptionPlans.stackedSubscriptionsExplanation') }}</p>
      </div>

      <!-- Subscription cards -->
      <div
        v-for="subscription in sortedSubscriptions"
        :key="subscription.id"
        :class="['subscription-item', { 'is-primary': subscription.is_primary }]"
      >
        <!-- Primary badge -->
        <div v-if="subscription.is_primary" class="primary-badge">
          <i class="fas fa-star"></i>
          <span>{{ t('subscriptionPlans.activePlan') }}</span>
        </div>

        <div class="subscription-content">
          <div class="subscription-left">
            <div class="plan-name-row">
              <h4>{{ getPlanName(subscription) }}</h4>
              <span :class="['type-badge', `type-${subscription.subscription_type || 'personal'}`]">
                <i :class="subscription.subscription_type === 'assigned' ? 'fas fa-users' : 'fas fa-user'"></i>
                {{ t(`subscriptionPlans.subscriptionType_${subscription.subscription_type || 'personal'}`) }}
              </span>
            </div>

            <!-- Priority indicator (admin only) -->
            <div class="plan-priority" v-if="subscription.subscription_plan?.priority !== undefined">
              <i class="fas fa-signal"></i>
              {{ t('subscriptionPlans.priorityLevel') }}: {{ subscription.subscription_plan.priority }}
            </div>

            <!-- Assigned info -->
            <div v-if="subscription.subscription_type === 'assigned' && subscription.batch_owner_name" class="assigned-info">
              <i class="fas fa-user-circle"></i>
              <span>{{ t('subscriptionPlans.providedBy') }}: {{ subscription.batch_owner_name }}</span>
            </div>

            <!-- Features summary -->
            <div v-if="subscription.plan_features" class="features-summary">
              <span v-if="subscription.plan_features.concurrent_terminals">
                <i class="fas fa-terminal"></i>
                {{ subscription.plan_features.concurrent_terminals }} {{ t('subscriptionPlans.terminals') }}
              </span>
              <span v-if="subscription.plan_features.session_duration_hours">
                <i class="fas fa-clock"></i>
                {{ subscription.plan_features.session_duration_hours }}h
              </span>
            </div>
          </div>

          <div class="subscription-right">
            <span :class="['status-badge', getStatusClass(subscription.status)]">
              <i :class="getStatusIcon(subscription.status)"></i>
              {{ getStatusText(subscription.status) }}
            </span>

            <!-- Fallback indicator (only when multiple subscriptions exist) -->
            <div v-if="!subscription.is_primary && subscriptions.length > 1" class="fallback-indicator">
              <i class="fas fa-layer-group"></i>
              <span>{{ t('subscriptionPlans.fallbackPlan') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSubscriptionTranslations } from '../composables/useSubscriptionTranslations'
import { useAdminViewMode } from '../../../composables/useAdminViewMode'

const { t } = useSubscriptionTranslations()
const { isAdmin } = useAdminViewMode()

const isExpanded = ref(false)

interface Props {
  subscriptions: any[]
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
})

// Sort subscriptions by priority (primary first, then by priority level)
const sortedSubscriptions = computed(() => {
  if (!props.subscriptions) return []

  return [...props.subscriptions].sort((a, b) => {
    // Primary subscription always first
    if (a.is_primary && !b.is_primary) return -1
    if (!a.is_primary && b.is_primary) return 1

    // Then sort by priority level (higher priority first)
    const aPriority = a.subscription_plan?.priority ?? 0
    const bPriority = b.subscription_plan?.priority ?? 0
    return bPriority - aPriority
  })
})

function getPlanName(subscription: any): string {
  return subscription.subscription_plan?.name || subscription.plan_name || t('subscriptionPlans.unknownPlan')
}

function getStatusClass(status: string) {
  switch (status?.toLowerCase()) {
    case 'active': return 'text-success'
    case 'trialing': return 'text-info'
    case 'canceled': return 'text-warning'
    case 'past_due': return 'text-danger'
    case 'unpaid': return 'text-danger'
    case 'incomplete': return 'text-muted'
    default: return 'text-secondary'
  }
}

function getStatusIcon(status: string) {
  switch (status?.toLowerCase()) {
    case 'active': return 'fas fa-check-circle'
    case 'trialing': return 'fas fa-gift'
    case 'canceled': return 'fas fa-times-circle'
    case 'past_due': return 'fas fa-exclamation-triangle'
    case 'unpaid': return 'fas fa-credit-card'
    case 'incomplete': return 'fas fa-hourglass-half'
    default: return 'fas fa-question-circle'
  }
}

function getStatusText(status: string) {
  return t(`subscriptionPlans.${status}`) || status
}
</script>

<style scoped>
.all-subscriptions {
  background: var(--color-bg-primary);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--color-gray-200);
  min-width: 600px;
}

@media (max-width: 768px) {
  .all-subscriptions {
    min-width: unset;
  }
}

.all-subscriptions h3 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  color: var(--color-gray-700);
  font-size: 1.25rem;
}

.collapsible-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 10px;
  margin: -10px -10px 20px -10px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.collapsible-header:hover {
  background-color: var(--color-gray-50);
}

.collapse-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.collapse-toggle:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.collapse-toggle i {
  font-size: 0.75rem;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--color-text-muted);
}

.loading-state i {
  font-size: 2rem;
  margin-bottom: 10px;
}

.empty-state i {
  opacity: 0.5;
  margin-bottom: 15px;
}

.stacked-info-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(13, 110, 253, 0.08) 0%, rgba(13, 110, 253, 0.04) 100%);
  border-left: 4px solid var(--color-info);
  border-radius: 8px;
  margin-bottom: 20px;
}

.stacked-info-banner i {
  color: var(--color-info);
  font-size: 1rem;
  margin-top: 2px;
}

.stacked-info-banner p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  line-height: 1.5;
}

.subscriptions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.subscription-item {
  border: 2px solid var(--color-border-light);
  border-radius: 12px;
  padding: 20px;
  background: var(--color-bg-primary);
  transition: all 0.3s ease;
  position: relative;
}

.subscription-item.is-primary {
  border-color: var(--color-primary);
  background: linear-gradient(135deg, rgba(13, 110, 253, 0.05) 0%, var(--color-bg-primary) 100%);
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.15);
}

.primary-badge {
  position: absolute;
  top: -12px;
  left: 20px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--color-primary);
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 8px rgba(13, 110, 253, 0.3);
}

.primary-badge i {
  font-size: 0.875rem;
}

.subscription-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.subscription-left {
  flex: 1;
}

.plan-name-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.plan-name-row h4 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 1.125rem;
}

.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.type-badge.type-personal {
  background-color: rgba(13, 110, 253, 0.1);
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
}

.type-badge.type-assigned {
  background-color: rgba(108, 117, 125, 0.1);
  color: var(--color-secondary);
  border: 1px solid var(--color-secondary);
}

.type-badge i {
  font-size: 0.7rem;
}

.plan-priority {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin-bottom: 8px;
}

.plan-priority i {
  color: var(--color-warning);
}

.assigned-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.assigned-info i {
  color: var(--color-secondary);
}

.features-summary {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 12px;
}

.features-summary span {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.features-summary i {
  color: var(--color-primary);
  opacity: 0.7;
}

.subscription-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.fallback-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  padding: 4px 10px;
  background: var(--color-bg-secondary);
  border-radius: 12px;
}

.fallback-indicator i {
  font-size: 0.7rem;
  opacity: 0.7;
}

/* Text color utilities */
.text-success {
  background-color: rgba(40, 167, 69, 0.1);
  color: var(--color-success);
}

.text-info {
  background-color: rgba(23, 162, 184, 0.1);
  color: var(--color-info);
}

.text-warning {
  background-color: rgba(255, 193, 7, 0.1);
  color: var(--color-warning);
}

.text-danger {
  background-color: rgba(220, 53, 69, 0.1);
  color: var(--color-danger);
}

.text-muted {
  background-color: rgba(108, 117, 125, 0.1);
  color: var(--color-text-muted);
}

.text-secondary {
  background-color: rgba(108, 117, 125, 0.1);
  color: var(--color-secondary);
}

/* Responsive */
@media (max-width: 768px) {
  .subscription-content {
    flex-direction: column;
  }

  .subscription-right {
    align-items: flex-start;
    width: 100%;
  }

  .features-summary {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
