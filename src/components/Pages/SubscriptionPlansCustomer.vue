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
          :class="['plan-card-compact', { 'current-plan': isCurrentPlan(plan) }]"
        >
          <!-- Plan Header with Status -->
          <div class="plan-header-compact">
            <div class="plan-title-section">
              <h3 class="plan-name-compact">{{ plan.name }}</h3>
              <div v-if="isCurrentPlan(plan)" class="current-badge">
                <i class="fas fa-check-circle"></i>
                Current
              </div>
            </div>
            <div class="plan-price-compact">
              <span class="price-amount-compact">{{ formatPrice(plan.price_amount, plan.currency) }}</span>
              <span class="billing-period-compact">{{ plan.billing_interval }}</span>
            </div>
          </div>

          <!-- Plan Content in Two Columns -->
          <div class="plan-content-compact">
            <!-- Left Column: Key Features -->
            <div class="features-column">
              <div class="key-features">
                <div class="feature-item">
                  <i class="fas fa-users"></i>
                  <span>{{ plan.max_concurrent_users === -1 ? 'Unlimited' : plan.max_concurrent_users }} {{ t('subscriptionPlans.concurrentTerminals') }}</span>
                </div>
                <div v-if="plan.features && plan.features.find(f => f.includes('hour'))" class="feature-item">
                  <i class="fas fa-clock"></i>
                  <span>{{ plan.features.find(f => f.includes('hour')) }}</span>
                </div>
                <div v-if="plan.features && plan.features.find(f => f.includes('machine'))" class="feature-item">
                  <i class="fas fa-server"></i>
                  <span>{{ plan.features.find(f => f.includes('machine')) }}</span>
                </div>
                <div v-if="plan.features && plan.features.find(f => f.includes('GB') || f.includes('persistence'))" class="feature-item">
                  <i class="fas fa-hdd"></i>
                  <span>{{ plan.features.find(f => f.includes('GB') || f.includes('persistence')) }}</span>
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
                <span v-if="plan.trial_days > 0">Start Trial</span>
                <span v-else>Subscribe</span>
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
        </div>
      </div>

      <!-- No Plans Available -->
      <div v-else class="no-plans-container">
        <i class="fas fa-inbox fa-3x"></i>
        <h3>No subscription plans available</h3>
        <p>Please check back later or contact support.</p>
      </div>

      <!-- Current Subscription Info -->
      <div v-if="hasCurrentSubscription" class="current-subscription-info">
        <div class="info-card">
          <i class="fas fa-info-circle text-info"></i>
          <div class="info-content">
            <h4>Current Subscription</h4>
            <p>You currently have an active subscription. Selecting a new plan will change your current subscription.</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useSubscriptionPlansStore } from '../../stores/subscriptionPlans'
import { useSubscriptionsStore } from '../../stores/subscriptions'
import { useCurrentUserStore } from '../../stores/currentUser'
import { useI18n } from 'vue-i18n'
import router from '../../router/index'

const { t } = useI18n()

// Stores
const entityStore = useSubscriptionPlansStore()
const subscriptionsStore = useSubscriptionsStore()
const currentUser = useCurrentUserStore()

// State
const isSubscribing = ref(false)
const hasCurrentSubscription = ref(false)

// Computed
const isAdmin = computed(() =>
  currentUser.userRoles.includes('administrator')
)

const filteredPlans = computed(() => {
  if (isAdmin.value) {
    return entityStore.entities
  }
  // Regular users only see active plans
  return entityStore.entities.filter((plan: any) => plan.is_active)
})

const currentPlanId = computed(() => {
  const subscription = subscriptionsStore.currentSubscription
  if (!subscription) return null

  // Try different possible plan ID fields
  const planId = subscription.subscription_plan_id ||
                 subscription.plan_id ||
                 subscription.subscription_plans ||
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
    await entityStore.selectPlan(plan.id)
    router.push({ name: 'Checkout', params: { planId: plan.id } })
  } catch (error) {
    console.error('Error selecting plan:', error)
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
  color: #333;
  font-size: 2.5rem;
}

.page-description {
  font-size: 1.2rem;
  color: #666;
  margin: 0;
}

.loading-container,
.error-container,
.no-plans-container {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.error-message {
  color: #dc3545;
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
  border: 1px solid #e9ecef;
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
  border-color: #28a745;
  background: linear-gradient(135deg, #f8fff9 0%, #e8f5e9 100%);
  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.2);
}

/* Compact Header */
.plan-header-compact {
  padding: 15px;
  border-bottom: 1px solid #f1f3f4;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
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
  color: #333;
}

.current-badge {
  background: #28a745;
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
  color: #28a745;
  display: block;
}

.billing-period-compact {
  font-size: 0.8rem;
  color: #666;
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
  color: #555;
}

.feature-item i {
  width: 14px;
  color: #007bff;
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
  background: #007bff;
  color: white;
}

.btn-subscribe-compact:hover:not(:disabled) {
  background: #0056b3;
  transform: translateY(-1px);
}

.btn-subscribe-compact:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.current-plan-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #28a745;
  font-size: 0.9rem;
  font-weight: 600;
}

.plan-description-compact {
  padding: 0 15px 15px 15px;
  font-size: 0.85rem;
  color: #666;
  line-height: 1.4;
  border-top: 1px solid #f1f3f4;
  background: #fafbfc;
  margin-top: 10px;
}

/* Remove old styles - replaced by compact design */

/* Current Subscription Info */
.current-subscription-info {
  margin-bottom: 40px;
}

.info-card {
  background: #e3f2fd;
  border: 1px solid #bbdefb;
  border-radius: 10px;
  padding: 20px;
  display: flex;
  align-items: flex-start;
  gap: 15px;
}

.info-card i {
  font-size: 1.5rem;
  margin-top: 2px;
}

.info-content h4 {
  margin: 0 0 8px 0;
  color: #1976d2;
}

.info-content p {
  margin: 0;
  color: #1976d2;
  line-height: 1.5;
}


/* Utilities */
.text-success { color: #28a745 !important; }
.text-info { color: #17a2b8 !important; }
.text-muted { color: #6c757d !important; }

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
  background-color: #007bff;
  border-color: #007bff;
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

  .info-card {
    flex-direction: column;
    text-align: center;
  }
}
</style>