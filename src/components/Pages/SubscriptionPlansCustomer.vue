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

      <!-- Plans Grid -->
      <div v-else-if="filteredPlans.length > 0" class="plans-grid">
        <div
          v-for="plan in filteredPlans"
          :key="plan.id"
          :class="['plan-card', { 'popular': plan.name.includes('Pro') }]"
        >
          <!-- Popular Badge -->
          <div v-if="plan.name.includes('Pro')" class="popular-badge">
            <i class="fas fa-star"></i>
            Popular
          </div>

          <!-- Plan Header -->
          <div class="plan-header">
            <h3 class="plan-name">{{ plan.name }}</h3>
            <div class="plan-price">
              <span class="price-amount">{{ formatPrice(plan.price_amount, plan.currency) }}</span>
              <span class="billing-period">/ {{ plan.billing_interval }}</span>
            </div>
            <p v-if="plan.description" class="plan-description">{{ plan.description }}</p>
          </div>

          <!-- Plan Features -->
          <div class="plan-body">
            <!-- Trial Info -->
            <div v-if="plan.trial_days > 0" class="trial-info">
              <i class="fas fa-gift text-success"></i>
              <span>{{ plan.trial_days }} days free trial</span>
            </div>

            <!-- Features List -->
            <div v-if="plan.features && plan.features.length > 0" class="features-list">
              <h4>What's included:</h4>
              <ul>
                <li v-for="feature in plan.features" :key="feature">
                  <i class="fas fa-check text-success"></i>
                  {{ feature }}
                </li>
              </ul>
            </div>

            <!-- Limits -->
            <div class="limits-list">
              <div v-if="plan.max_courses" class="limit-item">
                <i class="fas fa-book"></i>
                <span>
                  {{ plan.max_courses === -1 ? 'Unlimited' : plan.max_courses }} courses
                </span>
              </div>
              <div v-if="plan.max_concurrent_users" class="limit-item">
                <i class="fas fa-users"></i>
                <span>
                  {{ plan.max_concurrent_users === -1 ? 'Unlimited' : plan.max_concurrent_users }} concurrent users
                </span>
              </div>
              <div v-if="plan.max_lab_sessions" class="limit-item">
                <i class="fas fa-flask"></i>
                <span>
                  {{ plan.max_lab_sessions === -1 ? 'Unlimited' : plan.max_lab_sessions }} lab sessions/month
                </span>
              </div>
            </div>
          </div>

          <!-- Plan Actions -->
          <div class="plan-footer">
            <button
              class="btn btn-subscribe"
              :class="plan.name.includes('Pro') ? 'btn-primary btn-lg' : 'btn-outline-primary'"
              @click="selectPlan(plan)"
              :disabled="!plan.is_active || isSubscribing"
            >
              <i v-if="isSubscribing" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-shopping-cart"></i>
              <span v-if="plan.trial_days > 0">Start Free Trial</span>
              <span v-else>Subscribe Now</span>
            </button>

            <div v-if="!plan.is_active" class="inactive-notice">
              <small class="text-muted">This plan is no longer available</small>
            </div>
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

      <!-- Admin Section (if admin) -->
      <div v-if="isAdmin" class="admin-section">
        <div class="admin-header">
          <h2>
            <i class="fas fa-cog"></i>
            Plan Management (Admin)
          </h2>
        </div>
        <Entity
          entity-name="subscription-plans"
          :entity-store="entityStore"
        />
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
import Entity from './Entity.vue'

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
  padding: 40px 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 50px;
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

/* Plans Grid */
.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 30px;
  margin-bottom: 50px;
}

.plan-card {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 15px;
  padding: 0;
  position: relative;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.plan-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.plan-card.popular {
  border-color: #007bff;
  transform: scale(1.05);
}

.popular-badge {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
  padding: 5px 20px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 5px;
}

.plan-header {
  padding: 30px 25px 20px 25px;
  text-align: center;
  border-bottom: 1px solid #f8f9fa;
}

.plan-name {
  margin: 0 0 15px 0;
  font-size: 1.5rem;
  color: #333;
}

.plan-price {
  margin: 15px 0;
}

.price-amount {
  font-size: 2.5rem;
  font-weight: bold;
  color: #28a745;
}

.billing-period {
  font-size: 1rem;
  color: #666;
  font-weight: normal;
}

.plan-description {
  margin: 15px 0 0 0;
  color: #666;
  line-height: 1.5;
}

.plan-body {
  padding: 25px;
}

.trial-info {
  background: #e8f5e9;
  border: 1px solid #c8e6c9;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 25px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #2e7d32;
  font-weight: 500;
}

.features-list h4 {
  margin: 0 0 15px 0;
  font-size: 1.1rem;
  color: #333;
}

.features-list ul {
  list-style: none;
  padding: 0;
  margin: 0 0 25px 0;
}

.features-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  color: #555;
}

.limits-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.limit-item {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #666;
  font-size: 0.95rem;
}

.plan-footer {
  padding: 25px;
  border-top: 1px solid #f8f9fa;
  text-align: center;
}

.btn-subscribe {
  width: 100%;
  padding: 15px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.btn-primary {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  border: none;
  color: white;
}

.btn-outline-primary {
  background: transparent;
  border: 2px solid #007bff;
  color: #007bff;
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-lg {
  padding: 18px;
  font-size: 18px;
}

.inactive-notice {
  margin-top: 10px;
}

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

/* Admin Section */
.admin-section {
  margin-top: 60px;
  padding-top: 40px;
  border-top: 2px solid #e9ecef;
}

.admin-header {
  margin-bottom: 30px;
}

.admin-header h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #333;
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

  .plans-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .plan-card.popular {
    transform: none;
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