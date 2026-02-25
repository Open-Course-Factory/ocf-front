<template>
  <div class="subscription-overview">
    <h3>
      <i class="fas fa-credit-card"></i>
      {{ t('subscriptionPlans.current_subscription_plan') }}
    </h3>

    <!-- Cas : Aucun abonnement -->
    <div v-if="!hasActiveSubscription" class="no-subscription-card">
      <div class="no-subscription-content">
        <i class="fas fa-plus-circle fa-3x"></i>
        <h4>{{ t('subscriptionPlans.no_active_subscription') }}</h4>
        <p>{{ t('subscriptionPlans.subscribe_to_start') }}</p>

        <div class="subscription-actions">
          <button
            class="btn btn-success btn-lg"
            @click="$emit('activateFreePlan')"
            :disabled="isActivatingFreePlan"
          >
            <i :class="isActivatingFreePlan ? 'fas fa-spinner fa-spin' : 'fas fa-gift'"></i>
            {{ isActivatingFreePlan ? t('subscriptionPlans.activating') : t('subscriptionPlans.startFreeTrial') }}
          </button>

          <router-link to="/subscription-plans" class="btn btn-outline-primary btn-lg">
            <i class="fas fa-rocket"></i>
            {{ t('subscriptionPlans.view_plans') }}
          </router-link>

          <button
            v-if="lastCanceledSubscription"
            class="btn btn-outline-primary"
            @click="$emit('reactivate')"
          >
            <i class="fas fa-undo"></i>
            {{ t('subscriptionPlans.reactivate_subscription') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Cas : Abonnement actif -->
    <div v-else class="subscription-card">
      <div class="subscription-header">
        <div class="plan-info">
          <div class="plan-title-row">
            <h4>{{ planName }}</h4>
            <!-- Subscription Type Badge -->
            <span v-if="subscription?.subscription_type" :class="['type-badge', `type-${subscription.subscription_type}`]">
              <i :class="subscription.subscription_type === 'personal' ? 'fas fa-user' : 'fas fa-users'"></i>
              {{ t(`subscriptionPlans.subscriptionType_${subscription.subscription_type}`) }}
            </span>
          </div>
          <div class="plan-price" v-if="!isBulkLicense && (currentPlan?.price_amount || subscription?.plan_price)">
            {{ formatPrice(currentPlan?.price_amount || subscription?.plan_price, currentPlan?.currency || subscription?.currency) }}
            <span class="billing-period">/ {{ currentPlan?.billing_interval || subscription?.billing_interval }}</span>
          </div>
        </div>

        <div class="subscription-status">
          <span :class="['status-badge', getStatusClass(subscription?.status)]">
            <i :class="getStatusIcon(subscription?.status)"></i>
            {{ getStatusText(subscription?.status) }}
          </span>
        </div>
      </div>

      <div class="subscription-details">
        <!-- Bulk License Assignment Info -->
        <div v-if="isBulkLicense" class="bulk-license-info">
          <div class="bulk-license-card">
            <i class="fas fa-users text-primary"></i>
            <div class="bulk-license-details">
              <strong>{{ t('subscriptionPlans.bulkLicenseAssigned') }}</strong>
              <div class="bulk-license-meta">
                <span v-if="subscription?.batch_owner_name">
                  {{ t('subscriptionPlans.providedBy') }}: <strong>{{ subscription.batch_owner_name }}</strong>
                </span>
                <span v-else-if="subscription?.batch_owner_email">
                  {{ t('subscriptionPlans.providedBy') }}: <strong>{{ subscription.batch_owner_email }}</strong>
                </span>
                <span v-if="subscription?.assigned_at" class="assigned-date">
                  • {{ t('subscriptionPlans.assignedOn') }} {{ formatDate(subscription.assigned_at) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Période d'essai -->
        <div v-if="isTrialing" class="trial-info">
          <div class="trial-card">
            <i class="fas fa-gift text-info"></i>
            <div>
              <strong>{{ t('subscriptionPlans.trialActive') }}</strong>
              <div class="trial-remaining">
                <span v-if="subscription?.trial_end">
                  {{ t('subscriptionPlans.trialEndsOn') }} {{ formatDate(subscription.trial_end) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Abonnement annulé -->
        <div v-else-if="isCanceled" class="cancellation-info">
          <div class="cancellation-card">
            <i class="fas fa-exclamation-triangle text-warning"></i>
            <div>
              <strong>{{ t('subscriptionPlans.subscriptionWillCancel') }}</strong>
              <div class="cancellation-date">
                {{ t('subscriptionPlans.accessUntil') }} {{ formatDate(subscription?.current_period_end) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Plan limits and features -->
        <div v-if="subscription?.plan_features" class="plan-features">
          <h5>
            <i class="fas fa-list"></i>
            {{ t('subscriptionPlans.planFeatures') }}
          </h5>
          <div class="features-grid">
            <div v-if="subscription.plan_features.concurrent_terminals" class="feature-item">
              <i class="fas fa-terminal"></i>
              <span>{{ subscription.plan_features.concurrent_terminals }} {{ t('subscriptionPlans.concurrentTerminals') }}</span>
            </div>
            <div v-if="subscription.plan_features.session_duration_hours" class="feature-item">
              <i class="fas fa-clock"></i>
              <span>{{ subscription.plan_features.session_duration_hours }}h {{ t('subscriptionPlans.sessionDuration') }}</span>
            </div>
            <div v-if="subscription.plan_features.allowed_machine_sizes" class="feature-item">
              <i class="fas fa-server"></i>
              <span>{{ subscription.plan_features.allowed_machine_sizes.join(', ') }} {{ t('subscriptionPlans.allowedSizes') }}</span>
            </div>
            <div v-if="subscription.plan_features.storage_gb" class="feature-item">
              <i class="fas fa-hdd"></i>
              <span>{{ subscription.plan_features.storage_gb }}GB {{ t('subscriptionPlans.storage') }}</span>
            </div>
            <div v-if="subscription.plan_features.network_access" class="feature-item">
              <i class="fas fa-network-wired"></i>
              <span>{{ t('subscriptionPlans.networkAccess') }}</span>
            </div>
          </div>
        </div>

        <!-- Prochaine facturation - Hide for bulk licenses -->
        <div v-else-if="subscription?.current_period_end && !isBulkLicense" class="billing-info">
          <div class="detail-row">
            <span class="label">
              <i class="fas fa-calendar-alt"></i>
              {{ t('subscriptionPlans.nextBilling') }}:
            </span>
            <span class="value">{{ formatDate(subscription.current_period_end) }}</span>
          </div>
        </div>

        <!-- Actions rapides -->
        <div v-if="!isBulkLicense" class="subscription-actions">
          <!-- Manage Subscription - Only for paid plans -->
          <button
            v-if="!isFreePlan && isPersonalSubscription"
            class="btn btn-primary"
            @click="$emit('manage')"
            :disabled="isManaging"
          >
            <i :class="isManaging ? 'fas fa-spinner fa-spin' : 'fas fa-cog'"></i>
            {{ t('subscriptionPlans.manageSubscription') }}
          </button>

          <!-- Change Plan - Only for personal subscriptions -->
          <router-link v-if="isPersonalSubscription" to="/subscription-plans" class="btn btn-outline-primary">
            <i class="fas fa-exchange-alt"></i>
            {{ t('subscriptionPlans.changePlan') }}
          </router-link>

          <!-- Cancel Subscription - Only for personal paid plans that aren't already canceled -->
          <button
            v-if="!isFreePlan && !isCanceled && isPersonalSubscription"
            class="btn btn-outline-warning"
            @click="$emit('cancel')"
          >
            <i class="fas fa-times"></i>
            {{ t('subscriptionPlans.cancelSubscription') }}
          </button>

          <!-- Reactivate Subscription - Only for personal paid plans that are canceled -->
          <button
            v-if="!isFreePlan && isCanceled && isPersonalSubscription"
            class="btn btn-success"
            @click="$emit('reactivate')"
            :disabled="isReactivating"
          >
            <i :class="isReactivating ? 'fas fa-spinner fa-spin' : 'fas fa-undo'"></i>
            {{ t('subscriptionPlans.reactivateSubscription') }}
          </button>
        </div>

        <!-- Assigned License Info - Read-only with option to start personal subscription -->
        <div v-else class="bulk-license-actions">
          <div class="info-message">
            <i class="fas fa-info-circle"></i>
            <p>{{ t('subscriptionPlans.bulkLicenseReadOnly') }}</p>
          </div>

          <!-- Allow free trial if user never purchased anything -->
          <div v-if="neverPurchasedPersonal" class="personal-subscription-option">
            <p class="option-description">{{ t('subscriptionPlans.canStartPersonalSubscription') }}</p>
            <router-link to="/subscription-plans" class="btn btn-outline-primary">
              <i class="fas fa-plus-circle"></i>
              {{ t('subscriptionPlans.viewPlans') }}
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useSubscriptionPlansStore } from '../../../stores/subscriptionPlans'
import { useSubscriptionTranslations } from '../composables/useSubscriptionTranslations'

const { t } = useSubscriptionTranslations()

interface Props {
  subscription: any | null
  hasActiveSubscription: boolean
  lastCanceledSubscription: any | null
  allSubscriptions?: any[]
  isManaging?: boolean
  isReactivating?: boolean
  isActivatingFreePlan?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isManaging: false,
  isReactivating: false,
  isActivatingFreePlan: false,
  allSubscriptions: () => []
})

const emit = defineEmits<{
  manage: []
  cancel: []
  reactivate: []
  activateFreePlan: []
}>()

const subscriptionPlansStore = useSubscriptionPlansStore()

// Ensure plans are loaded when component mounts
onMounted(async () => {
  try {
    await subscriptionPlansStore.ensurePlansLoaded()
  } catch (error) {
    console.warn('Failed to load subscription plans for dashboard:', error)
  }
})

// Computed
const formatPrice = computed(() => subscriptionPlansStore.formatPrice)

const isTrialing = computed(() => props.subscription?.status === 'trialing')
const isCanceled = computed(() => props.subscription?.cancel_at_period_end === true)

// Check if subscription is from a bulk license batch
const isBulkLicense = computed(() => {
  return !!(props.subscription?.subscription_batch_id)
})

// Check if current subscription is personal (not assigned)
const isPersonalSubscription = computed(() => {
  return props.subscription?.subscription_type === 'personal' || !props.subscription?.subscription_type
})

// Check if user has EVER purchased a personal subscription
const neverPurchasedPersonal = computed(() => {
  if (!props.allSubscriptions || props.allSubscriptions.length === 0) {
    return true // No subscriptions at all, user can start free trial
  }

  // Check if there's any personal subscription in the list
  const hasPersonalSubscription = props.allSubscriptions.some(
    sub => sub.subscription_type === 'personal'
  )

  return !hasPersonalSubscription
})

// Check if current plan is free (price_amount === 0)
const isFreePlan = computed(() => {
  return currentPlan.value?.price_amount === 0
})

// Get current plan details by matching the subscription plan ID
const currentPlan = computed(() => {
  if (!props.subscription) return null

  // Backend now returns subscription_plan_id (corrected field name)
  const planId = props.subscription.subscription_plan_id ||
                 props.subscription.subscription_plan?.id

  console.log('[SubscriptionCard] Looking up plan:', {
    planId,
    subscription: props.subscription,
    availablePlans: subscriptionPlansStore.entities.map((p: any) => ({ id: p.id, name: p.name }))
  })

  const foundPlan = subscriptionPlansStore.entities.find((plan: any) => plan.id === planId)

  console.log('[SubscriptionCard] Found plan:', foundPlan)

  return foundPlan
})

const planName = computed(() => {
  // Always prefer the plan name from the subscription plans store (most up-to-date)
  // This ensures plan changes are immediately reflected in the UI
  if (currentPlan.value?.name) {
    return currentPlan.value.name
  }

  // Fallback to the denormalized plan_name field (may be stale after plan changes)
  if (props.subscription?.plan_name) {
    return props.subscription.plan_name
  }

  // Final fallback
  return t('subscriptionPlans.current_subscription_plan')
})

// Méthodes utilitaires (dupliquées depuis le store subscriptions)
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

function formatDate(dateString: string) {
  if (!dateString) return '-'
  try {
    return new Date(dateString).toLocaleDateString('fr-FR')
  } catch (e) {
    return dateString
  }
}
</script>

<style scoped>
.subscription-overview {
  background: var(--color-bg-primary);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-gray-200);
  min-width: 600px;
}

@media (max-width: 768px) {
  .subscription-overview {
    min-width: unset;
  }
}

.subscription-overview h3 {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-gray-700);
  font-size: var(--font-size-xl);
}

/* No subscription styles */
.no-subscription-card {
  text-align: center;
  padding: var(--spacing-2xl) var(--spacing-md);
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
  color: var(--color-white);
  border-radius: var(--border-radius-xl);
}

.no-subscription-content i {
  margin-bottom: var(--spacing-lg);
  opacity: 0.9;
}

.no-subscription-content h4 {
  margin: var(--spacing-lg) 0 var(--spacing-sm) 0;
}

/* Active subscription styles */
.subscription-card {
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
}

.subscription-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: linear-gradient(135deg, rgba(13, 110, 253, 0.08) 0%, var(--color-bg-secondary) 100%);
  border-bottom: 1px solid var(--color-border-light);
}

.plan-title-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.plan-info h4 {
  margin: 0;
  color: var(--color-text-primary);
}

.type-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-xl);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.type-badge.type-personal {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
}

.type-badge.type-assigned {
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border-medium);
}

.type-badge i {
  font-size: var(--font-size-xs);
}

.plan-price {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-success);
  margin-top: var(--spacing-sm);
}

.billing-period {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  font-weight: normal;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.subscription-details {
  padding: var(--spacing-md);
}

.trial-card,
.cancellation-card,
.bulk-license-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-lg);
  margin-bottom: var(--spacing-lg);
}

.trial-card {
  background-color: var(--color-info-bg);
  border-left: 4px solid var(--color-info);
}

.cancellation-card {
  background-color: var(--color-warning-bg);
  border-left: 4px solid var(--color-warning);
}

.bulk-license-card {
  background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-bg-secondary) 100%);
  border-left: 4px solid var(--color-primary);
  border: 1px solid var(--color-primary);
}

.bulk-license-details {
  flex: 1;
}

.bulk-license-details strong {
  display: block;
  color: var(--color-primary);
  font-size: var(--font-size-md);
  margin-bottom: var(--spacing-xs);
}

.bulk-license-meta {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.bulk-license-meta .assigned-date {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.bulk-license-card i {
  font-size: var(--font-size-2xl);
  color: var(--color-primary);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.detail-row .label {
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-700);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.subscription-actions {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  margin-top: var(--spacing-lg);
}

.bulk-license-actions {
  margin-top: var(--spacing-lg);
}

.info-message {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-bg-secondary) 100%);
  border-left: 4px solid var(--color-info);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-info);
}

.info-message i {
  color: var(--color-info);
  font-size: var(--font-size-xl);
  margin-top: var(--spacing-xs);
  flex-shrink: 0;
}

.info-message p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  line-height: 1.5;
}

.personal-subscription-option {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border-light);
}

.option-description {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  line-height: 1.5;
}

/* Plan features */
.plan-features {
  margin: var(--spacing-lg) 0;
  padding: var(--spacing-lg);
  background: var(--color-gray-50);
  border-radius: var(--border-radius-lg);
}

.plan-features h5 {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-gray-700);
  font-size: var(--font-size-md);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.feature-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--color-bg-primary);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-gray-200);
}

.feature-item i {
  color: var(--color-gray-600);
  width: 16px;
  text-align: center;
}

.feature-item span {
  font-size: var(--font-size-sm);
  color: var(--color-gray-700);
}

/* Responsive */
@media (max-width: 768px) {
  .subscription-header {
    flex-direction: column;
    gap: var(--spacing-md);
    text-align: center;
  }

  .subscription-actions {
    flex-direction: column;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }
}

/* Text utilities */
.text-success { color: var(--color-success) !important; }
.text-info { color: var(--color-info) !important; }
.text-warning { color: var(--color-warning) !important; }
.text-danger { color: var(--color-danger) !important; }
.text-muted { color: var(--color-gray-600) !important; }
</style>