<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <div class="wrapper">
    <div class="subscription-plans-page">
      <!-- Page Header -->
      <div class="page-header">
        <h1>
          <i class="fas fa-credit-card"></i>
          {{ t('subscriptionPlans.pageTitle') }}
        </h1>
        <p class="page-description">Choose the perfect plan for your needs</p>
      </div>

      <!-- Loading State -->
      <div v-if="entityStore.isLoading" class="loading-container">
        <i class="fas fa-spinner fa-spin fa-2x"></i>
        <p>{{ t('loadingPlans', 'Loading subscription plans...') }}</p>
      </div>

      <!-- Error State -->
      <div v-else-if="entityStore.error" class="error-container">
        <i class="fas fa-exclamation-triangle fa-2x"></i>
        <p class="error-message">{{ entityStore.error }}</p>
        <button class="btn btn-primary" @click="loadPlans">
          <i class="fas fa-sync"></i>
          Retry
        </button>
      </div>

      <!-- Plans Grid - Compact Design -->
      <div v-else-if="filteredPlans.length > 0" class="plans-grid-compact">
        <div
          v-for="plan in filteredPlans"
          :key="plan.id"
          :class="['plan-card-compact', { 'current-plan': isCurrentPlan(plan), 'coming-soon-plan': !plan.is_active }]"
        >
          <!-- Coming Soon Badge -->
          <div v-if="!plan.is_active" class="coming-soon-badge">
            <i class="fas fa-clock"></i>
            Coming Soon
          </div>

          <!-- Plan Header with Status -->
          <div class="plan-header-compact">
            <div class="plan-title-section">
              <h3 class="plan-name-compact">{{ plan.name }}</h3>
              <div v-if="isCurrentPlan(plan)" class="current-badge">
                <i class="fas fa-check-circle"></i>
                Current
              </div>
            </div>
            <div v-if="plan.is_active" class="plan-price-compact">
              <span class="price-amount-compact">{{ formatPrice(plan.price_amount, plan.currency) }}</span>
              <span class="billing-period-compact">{{ plan.billing_interval }}</span>
            </div>
          </div>

          <!-- Plan Content in Two Columns -->
          <div class="plan-content-compact">
            <!-- Left Column: Key Features -->
            <div class="features-column">
              <div class="key-features">
                <!-- Machine Size -->
                <div v-if="plan.allowed_machine_sizes && plan.allowed_machine_sizes.length > 0" class="feature-item">
                  <i class="fas fa-server"></i>
                  <span>{{ plan.allowed_machine_sizes.join(', ') }} machine(s)</span>
                </div>

                <!-- Session Duration -->
                <div v-if="plan.max_session_duration_minutes" class="feature-item">
                  <i class="fas fa-clock"></i>
                  <span>{{ formatSessionDuration(plan.max_session_duration_minutes) }}</span>
                </div>

                <!-- Concurrent Terminals -->
                <div v-if="plan.max_concurrent_terminals" class="feature-item">
                  <i class="fas fa-terminal"></i>
                  <span>{{ plan.max_concurrent_terminals }} {{ plan.max_concurrent_terminals === 1 ? 'terminal' : 'terminals' }}</span>
                </div>

                <!-- Storage -->
                <div class="feature-item">
                  <i class="fas fa-hdd"></i>
                  <span>{{ formatStorage(plan) }}</span>
                </div>

                <!-- Network Access -->
                <div class="feature-item">
                  <i class="fas fa-network-wired"></i>
                  <span>{{ plan.network_access_enabled ? 'Outbound network' : 'No network access' }}</span>
                </div>
              </div>
            </div>

            <!-- Right Column: Action Button -->
            <div class="action-column">
              <button
                v-if="!isCurrentPlan(plan)"
                class="btn-compact"
                :class="isCurrentPlan(plan) ? 'btn-current' : 'btn-subscribe-compact'"
                @click="selectPlan(plan)"
                :disabled="!plan.is_active || isSubscribing"
              >
                <i v-if="isSubscribing" class="fas fa-spinner fa-spin"></i>
                <i v-else class="fas fa-shopping-cart"></i>
                <span>{{ getPlanButtonText(plan) }}</span>
              </button>

              <div v-else class="current-plan-indicator">
                <i class="fas fa-check-circle"></i>
                <span>Active Plan</span>
              </div>
            </div>
          </div>

          <!-- Description (if any) -->
          <div v-if="plan.description" class="plan-description-compact">
            {{ plan.description }}
          </div>

          <!-- Planned Features (Coming Soon) -->
          <div v-if="plan.planned_features && plan.planned_features.length > 0" class="planned-features-section">
            <div class="planned-features-header">
              <i class="fas fa-clock"></i>
              <span>Coming Soon</span>
            </div>
            <ul class="planned-features-list">
              <li v-for="(feature, index) in plan.planned_features" :key="index" class="planned-feature-item">
                {{ feature }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- No Plans Available -->
      <div v-else class="no-plans-container">
        <i class="fas fa-inbox fa-3x"></i>
        <h3>No subscription plans available</h3>
        <p>Please check back later or contact support.</p>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useSubscriptionPlansStore } from '../../stores/subscriptionPlans'
import { useSubscriptionsStore } from '../../stores/subscriptions'
import { useI18n } from 'vue-i18n'
import router from '../../router/index'
import { useNotification } from '../../composables/useNotification'

const { t } = useI18n()
const { showSuccess, showError, showConfirm } = useNotification()

// Stores
const entityStore = useSubscriptionPlansStore()
const subscriptionsStore = useSubscriptionsStore()

// State
const isSubscribing = ref(false)
const hasCurrentSubscription = ref(false)

// Computed
const filteredPlans = computed(() => {
  // Show all plans to everyone, but mark inactive ones as "Coming Soon"
  return entityStore.entities
})

const currentPlanId = computed(() => {
  const subscription = subscriptionsStore.currentSubscription
  if (!subscription) return null

  // Backend now returns subscription_plan_id (corrected field name)
  const planId = subscription.subscription_plan_id ||
                 subscription.subscription_plan?.id

  return planId
})

const isCurrentPlan = (plan: any) => {
  const subscription = subscriptionsStore.currentSubscription
  if (!subscription) return false

  // Method 1: Direct plan ID comparison
  const planIdMatch = plan.id === currentPlanId.value

  // Method 2: Compare by plan name (fallback)
  const planNameMatch = subscription.plan_name === plan.name ||
                        subscription.subscription_plan?.name === plan.name

  return planIdMatch || planNameMatch
}

const getPlanButtonText = (plan: any) => {
  // Check if plan is inactive (coming soon)
  if (!plan.is_active) {
    return 'Coming Soon'
  }

  if (!hasCurrentSubscription.value) {
    return plan.trial_days > 0 ? 'Start Trial' : 'Subscribe'
  }

  const currentPlan = filteredPlans.value.find((p: any) => isCurrentPlan(p))
  if (!currentPlan) {
    return 'Change Plan'
  }

  // Compare prices to determine if it's an upgrade or downgrade
  if (plan.price_amount > currentPlan.price_amount) {
    return t('subscriptionPlans.upgrade')
  } else if (plan.price_amount < currentPlan.price_amount) {
    return t('subscriptionPlans.downgrade')
  } else {
    return 'Change Plan'
  }
}

// Format helper functions for new fields
function formatSessionDuration(minutes: number): string {
  const hours = minutes / 60
  return hours === 1 ? '1 hour max' : `${hours} hours max`
}

function formatStorage(plan: any): string {
  if (!plan.data_persistence_enabled) {
    return 'Ephemeral only'
  }
  return `${plan.data_persistence_gb}GB storage`
}

// Methods
onMounted(async () => {
  await loadPlans()
  await checkCurrentSubscription()
})

async function loadPlans() {
  try {
    await entityStore.ensurePlansLoaded()
  } catch (error) {
    console.error('Error loading subscription plans:', error)
  }
}

async function checkCurrentSubscription() {
  try {
    await subscriptionsStore.getCurrentSubscription()
    hasCurrentSubscription.value = subscriptionsStore.hasActiveSubscription()
  } catch (error) {
    // No current subscription is fine
    hasCurrentSubscription.value = false
  }
}

function formatPrice(amount: number, currency: string = 'EUR') {
  return entityStore.formatPrice(amount, currency)
}

async function selectPlan(plan: any) {
  if (!plan.is_active) return

  isSubscribing.value = true
  try {
    // If user has an active subscription
    if (hasCurrentSubscription.value) {
      const currentPlan = filteredPlans.value.find((p: any) => isCurrentPlan(p))
      const isCurrentlyOnFreePlan = currentPlan?.price_amount === 0

      // Special case: downgrade to free plan requires cancellation first
      if (plan.price_amount === 0) {
        const confirmed = await showConfirm(
          `To switch to the free plan, we need to cancel your current subscription.\n\n` +
          `Your current subscription will be cancelled immediately and you'll be switched to the free plan.\n\n` +
          `Do you want to continue?`,
          'Switch to Free Plan'
        )

        if (!confirmed) {
          isSubscribing.value = false
          return
        }

        // Cancel current subscription immediately
        await subscriptionsStore.cancelSubscription(
          subscriptionsStore.currentSubscription.id,
          true // cancel immediately
        )

        // Reload subscription state to clear current subscription
        await checkCurrentSubscription()

        // Wait a moment for cancellation to fully process on backend
        await new Promise(resolve => setTimeout(resolve, 1500))

        // Now activate the free plan
        const successUrl = `${window.location.origin}/subscription-dashboard?success=true`
        const cancelUrl = `${window.location.origin}/subscription-plans`

        const response = await subscriptionsStore.createCheckoutSession(
          plan.id,
          successUrl,
          cancelUrl
        )

        if (response?.free_plan) {
          showSuccess('Successfully switched to free plan!')
          // Reload to show the new free subscription
          await checkCurrentSubscription()
          await loadPlans()
          return
        } else {
          // If no free_plan flag but no error, something went wrong
          console.error('Unexpected response:', response)
          showError('There was an issue activating the free plan. Please try again or contact support.', 'Activation Error')
        }
      }

      // Special case: upgrading FROM free plan to paid plan
      // This is a new subscription, not an upgrade
      if (isCurrentlyOnFreePlan && plan.price_amount > 0) {
        const confirmed = await showConfirm(
          `You're about to upgrade from the free plan to ${plan.name}.\n\n` +
          `Your free plan will be replaced when you complete checkout.\n\n` +
          `Do you want to continue?`,
          'Upgrade from Free Plan'
        )

        if (!confirmed) {
          isSubscribing.value = false
          return
        }

        // For free plans, go to checkout with allowReplace flag
        // Pass upgradeFromFree=true in the route query
        await entityStore.selectPlan(plan.id)
        router.push({
          name: 'Checkout',
          params: { planId: plan.id },
          query: { upgradeFromFree: 'true' }
        })
        return
      }

      // For paid-to-paid upgrades/downgrades
      // Show confirmation dialog
      const confirmed = await showConfirm(
        `${t('subscriptions.changePlanWarning')}\n\n` +
        `${t('subscriptions.prorationAlwaysInvoiceDesc')}`,
        'Change Plan'
      )

      if (!confirmed) {
        isSubscribing.value = false
        return
      }

      // Call upgrade endpoint with immediate proration
      await subscriptionsStore.upgradePlan(plan.id, 'always_invoice')

      // Show success message
      showSuccess(t('subscriptions.planChangedSuccess'))

      // Reload current page to refresh subscription details
      await checkCurrentSubscription()
      await loadPlans()
    } else {
      // No active subscription
      await entityStore.selectPlan(plan.id)

      // For free plans (price_amount === 0), activate directly without Stripe checkout
      if (plan.price_amount === 0) {
        // Call checkout API which will activate the free plan immediately
        const successUrl = `${window.location.origin}/subscription-dashboard?success=true`
        const cancelUrl = `${window.location.origin}/subscription-plans`

        const response = await subscriptionsStore.createCheckoutSession(
          plan.id,
          successUrl,
          cancelUrl
        )

        // If it's a free plan, redirect to dashboard with success message
        if (response?.free_plan) {
          showSuccess(t('subscriptions.planChangedSuccess') || 'Free plan activated successfully!')
          router.push('/subscription-dashboard')
          return
        }
      }

      // For paid plans, go through checkout flow
      router.push({ name: 'Checkout', params: { planId: plan.id } })
    }
  } catch (error: any) {
    console.error('Error selecting plan:', error)
    // Show error from store (already formatted with translations)
    if (subscriptionsStore.error) {
      showError(subscriptionsStore.error, 'Subscription Error')
    }
  } finally {
    isSubscribing.value = false
  }
}
</script>

<style scoped>
.subscription-plans-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-header h1 {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin: 0 0 15px 0;
  color: var(--color-text-primary);
  font-size: 2.5rem;
}

.page-description {
  font-size: 1.2rem;
  color: var(--color-text-muted);
  margin: 0;
}

.loading-container,
.error-container,
.no-plans-container {
  text-align: center;
  padding: 60px 20px;
  color: var(--color-text-muted);
}

.error-message {
  color: var(--color-danger);
  margin: 20px 0;
}

/* Compact Plans Grid */
.plans-grid-compact {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.plan-card-compact {
  background: white;
  border: 1px solid var(--color-gray-200);
  border-radius: 10px;
  padding: 0;
  position: relative;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.plan-card-compact:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.plan-card-compact.current-plan {
  border-color: var(--color-success);
  background: linear-gradient(135deg, #f8fff9 0%, var(--color-success-bg) 100%);
  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.2);
}

.plan-card-compact.coming-soon-plan {
  opacity: 0.7;
  background: linear-gradient(135deg, var(--color-bg-tertiary) 0%, #e8e8e8 100%);
  position: relative;
}

.plan-card-compact.coming-soon-plan:hover {
  transform: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Coming Soon Badge */
.coming-soon-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: linear-gradient(135deg, var(--color-warning) 0%, var(--color-warning) 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 10;
  box-shadow: 0 2px 6px rgba(255, 152, 0, 0.3);
}

/* Compact Header */
.plan-header-compact {
  padding: 15px;
  border-bottom: 1px solid #f1f3f4;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-gray-50);
}

.plan-title-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.plan-name-compact {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.current-badge {
  background: var(--color-success);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

.plan-price-compact {
  text-align: right;
}

.price-amount-compact {
  font-size: 1.4rem;
  font-weight: bold;
  color: var(--color-success);
  display: block;
}

.billing-period-compact {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

/* Compact Content */
.plan-content-compact {
  padding: 15px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 15px;
  align-items: center;
}

.features-column {
  min-width: 0;
}

.key-features {
  display: grid;
  gap: 6px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.feature-item i {
  width: 14px;
  color: var(--color-primary);
  font-size: 0.8rem;
}

.action-column {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.btn-compact {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 100px;
  justify-content: center;
}

.btn-subscribe-compact {
  background: var(--color-primary);
  color: white;
}

.btn-subscribe-compact:hover:not(:disabled) {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}

.btn-subscribe-compact:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--color-gray-600);
  color: var(--color-white);
}

.coming-soon-plan .btn-subscribe-compact:disabled {
  background: var(--color-gray-500);
}

.current-plan-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--color-success);
  font-size: 0.9rem;
  font-weight: 600;
}

.plan-description-compact {
  padding: 0 15px 15px 15px;
  font-size: 0.85rem;
  color: var(--color-text-muted);
  line-height: 1.4;
  border-top: 1px solid #f1f3f4;
  background: #fafbfc;
  margin-top: 10px;
}

/* Planned Features Section */
.planned-features-section {
  padding: 15px;
  border-top: 1px solid var(--color-gray-200);
  background: var(--color-gray-50);
  margin-top: 10px;
}

.planned-features-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-gray-600);
  margin-bottom: 10px;
}

.planned-features-header i {
  color: var(--color-warning);
}

.planned-features-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.planned-feature-item {
  font-size: 0.8rem;
  color: #868e96;
  padding-left: 8px;
  line-height: 1.4;
  font-style: italic;
}

.planned-feature-item::before {
  content: '•';
  margin-right: 6px;
  color: var(--color-gray-500);
}


/* Utilities */
.text-success { color: var(--color-success) !important; }
.text-info { color: var(--color-info) !important; }
.text-muted { color: var(--color-gray-600) !important; }

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: 2px solid transparent;
  border-radius: 6px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

/* Responsive */
@media (max-width: 768px) {
  .subscription-plans-page {
    padding: 20px 15px;
  }

  .page-header h1 {
    font-size: 2rem;
    flex-direction: column;
    gap: 10px;
  }

  .plans-grid-compact {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .plan-content-compact {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .action-column {
    align-items: stretch;
  }

  .btn-compact {
    width: 100%;
  }

  .price-amount {
    font-size: 2rem;
  }
}
</style>