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
        <p class="page-description">{{ t('plans.pageDescription') }}</p>
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
          {{ t('plans.retry') }}
        </button>
      </div>

      <!-- Assigned user: simplified view (no pricing, no comparison) -->
      <div v-else-if="isAssignedUser" class="assigned-user-view">
        <div class="assigned-info-card">
          <i class="fas fa-building"></i>
          <div class="assigned-info-content">
            <h3>{{ t('plans.yourCurrentPlan') }}: {{ subscriptionsStore.currentSubscription?.plan_name || subscriptionsStore.currentSubscription?.subscription_plan?.name }}</h3>
            <p class="assigned-message">{{ t('plans.managedByOrg') }}</p>
          </div>
        </div>
      </div>

      <!-- Plans display -->
      <template v-else-if="filteredPlans.length > 0">
        <!-- View toggle -->
        <div class="view-toggle">
          <button
            :class="['btn-toggle', { active: viewMode === 'grid' }]"
            @click="viewMode = 'grid'"
          >
            <i class="fas fa-th-large"></i>
            {{ t('plans.gridView') }}
          </button>
          <button
            :class="['btn-toggle', { active: viewMode === 'table' }]"
            @click="viewMode = 'table'"
          >
            <i class="fas fa-table"></i>
            {{ t('plans.comparePlans') }}
          </button>
        </div>

        <!-- Plans Grid - Compact Design -->
        <div v-if="viewMode === 'grid'" class="plans-grid-compact">
          <div
            v-for="plan in filteredPlans"
            :key="plan.id"
            :class="['plan-card-compact', { 'current-plan': isCurrentPlan(plan), 'coming-soon-plan': !plan.is_active }]"
          >
            <!-- Coming Soon Badge -->
            <div v-if="!plan.is_active" class="coming-soon-badge">
              <i class="fas fa-clock"></i>
              {{ t('plans.comingSoon') }}
            </div>

            <!-- Plan Header with Status -->
            <div class="plan-header-compact">
              <div class="plan-title-section">
                <h3 class="plan-name-compact">{{ plan.name }}</h3>
                <div v-if="isCurrentPlan(plan)" class="current-badge">
                  <i class="fas fa-check-circle"></i>
                  {{ t('plans.current') }}
                </div>
              </div>
              <div v-if="plan.is_active" class="plan-price-compact">
                <span class="price-amount-compact">{{ formatPrice(plan.price_amount, plan.currency) }}</span>
                <span class="billing-period-compact">/ {{ plan.billing_interval === 'year' ? t('plans.year') : t('plans.month') }}</span>
              </div>
            </div>

            <!-- Plan Content in Two Columns -->
            <div class="plan-content-compact">
              <!-- Left Column: Key Features -->
              <div class="features-column">
                <div class="key-features">
                  <!-- Concurrent Users -->
                  <div v-if="plan.max_concurrent_users" class="feature-item">
                    <i class="fas fa-users"></i>
                    <span>{{ plan.max_concurrent_users }} {{ plan.max_concurrent_users === 1 ? t('plans.user') : t('plans.users') }}</span>
                  </div>

                  <!-- Machine Size -->
                  <div v-if="plan.allowed_machine_sizes && plan.allowed_machine_sizes.length > 0" class="feature-item">
                    <i class="fas fa-server"></i>
                    <span>{{ formatMachineSizes(plan.allowed_machine_sizes) }} {{ t('plans.environments') }}</span>
                  </div>

                  <!-- Session Duration -->
                  <div v-if="plan.max_session_duration_minutes" class="feature-item">
                    <i class="fas fa-clock"></i>
                    <span>{{ formatSessionDuration(plan.max_session_duration_minutes) }}</span>
                  </div>

                  <!-- Concurrent Terminals -->
                  <div v-if="plan.max_concurrent_terminals" class="feature-item">
                    <i class="fas fa-terminal"></i>
                    <span>{{ plan.max_concurrent_terminals }} {{ plan.max_concurrent_terminals === 1 ? t('plans.terminal') : t('plans.terminals') }}</span>
                  </div>

                  <!-- Storage -->
                  <div class="feature-item">
                    <i class="fas fa-hdd"></i>
                    <span>{{ formatStorage(plan) }}</span>
                  </div>

                  <!-- Network Access -->
                  <div class="feature-item">
                    <i class="fas fa-network-wired"></i>
                    <span>{{ plan.network_access_enabled ? t('plans.outboundNetwork') : t('plans.noNetworkAccess') }}</span>
                  </div>
                </div>

                <!-- Plan Capabilities -->
                <div v-if="plan.features && plan.features.length > 0" class="capabilities-section">
                  <div v-for="feature in plan.features" :key="feature" class="capability-item">
                    <i class="fas fa-check"></i>
                    <span>{{ formatFeatureName(feature) }}</span>
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
                  <span>{{ t('plans.activePlan') }}</span>
                </div>
              </div>
            </div>

            <!-- Bulk Purchase Option -->
            <div v-if="hasBulkPurchaseFeature(plan)" class="bulk-purchase-section">
              <div class="bulk-header">
                <i class="fas fa-layer-group"></i>
                <span>{{ t('plans.volumePricing') }}</span>
              </div>
              <p class="bulk-description">
                {{ t('plans.volumeDescription') }}
              </p>
              <button
                class="btn-bulk-purchase"
                @click="navigateToBulkPurchase(plan.id)"
              >
                <i class="fas fa-shopping-cart"></i>
                {{ t('plans.viewBulkPricing') }}
              </button>
            </div>

            <!-- Description (if any) -->
            <div v-if="plan.description" class="plan-description-compact">
              {{ plan.description }}
            </div>

            <!-- Planned Features (Coming Soon) -->
            <div v-if="plan.planned_features && plan.planned_features.length > 0" class="planned-features-section">
              <div class="planned-features-header">
                <i class="fas fa-clock"></i>
                <span>{{ t('plans.comingSoon') }}</span>
              </div>
              <ul class="planned-features-list">
                <li v-for="(feature, index) in plan.planned_features" :key="index" class="planned-feature-item">
                  {{ feature }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Comparison Table View -->
        <div v-else class="comparison-table-wrapper">
          <table class="comparison-table">
            <thead>
              <tr>
                <th class="feature-col"></th>
                <th v-for="plan in filteredPlans" :key="plan.id" :class="{ 'current-plan-col': isCurrentPlan(plan) }">
                  <div class="table-plan-header">
                    <span class="table-plan-name">{{ plan.name }}</span>
                    <span v-if="plan.is_active" class="table-plan-price">{{ formatPrice(plan.price_amount, plan.currency) }}/{{ plan.billing_interval === 'year' ? t('plans.year') : t('plans.month') }}</span>
                    <span v-if="isCurrentPlan(plan)" class="table-current-badge">{{ t('plans.current') }}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <!-- Concurrent Users -->
              <tr>
                <td class="feature-col">{{ t('plans.concurrentUsers') }}</td>
                <td v-for="plan in filteredPlans" :key="plan.id" :class="{ 'current-plan-col': isCurrentPlan(plan) }">
                  {{ plan.max_concurrent_users || '-' }}
                </td>
              </tr>
              <!-- Machine Sizes -->
              <tr>
                <td class="feature-col">{{ t('plans.machineSizes') }}</td>
                <td v-for="plan in filteredPlans" :key="plan.id" :class="{ 'current-plan-col': isCurrentPlan(plan) }">
                  {{ plan.allowed_machine_sizes ? formatMachineSizes(plan.allowed_machine_sizes) : '-' }}
                </td>
              </tr>
              <!-- Session Duration -->
              <tr>
                <td class="feature-col">{{ t('plans.sessionDuration') }}</td>
                <td v-for="plan in filteredPlans" :key="plan.id" :class="{ 'current-plan-col': isCurrentPlan(plan) }">
                  {{ plan.max_session_duration_minutes ? formatSessionDuration(plan.max_session_duration_minutes) : '-' }}
                </td>
              </tr>
              <!-- Concurrent Terminals -->
              <tr>
                <td class="feature-col">{{ t('plans.concurrentTerminals') }}</td>
                <td v-for="plan in filteredPlans" :key="plan.id" :class="{ 'current-plan-col': isCurrentPlan(plan) }">
                  {{ plan.max_concurrent_terminals || '-' }}
                </td>
              </tr>
              <!-- Storage -->
              <tr>
                <td class="feature-col">{{ t('plans.storage') }}</td>
                <td v-for="plan in filteredPlans" :key="plan.id" :class="{ 'current-plan-col': isCurrentPlan(plan) }">
                  {{ formatStorage(plan) }}
                </td>
              </tr>
              <!-- Network -->
              <tr>
                <td class="feature-col">{{ t('plans.networkAccess') }}</td>
                <td v-for="plan in filteredPlans" :key="plan.id" :class="{ 'current-plan-col': isCurrentPlan(plan) }">
                  <i :class="plan.network_access_enabled ? 'fas fa-check table-check' : 'fas fa-times table-cross'"></i>
                </td>
              </tr>
              <!-- Feature Capabilities -->
              <tr v-for="featureKey in allFeatureKeys" :key="featureKey">
                <td class="feature-col">{{ formatFeatureName(featureKey) }}</td>
                <td v-for="plan in filteredPlans" :key="plan.id" :class="{ 'current-plan-col': isCurrentPlan(plan) }">
                  <i :class="plan.features && plan.features.includes(featureKey) ? 'fas fa-check table-check' : 'fas fa-times table-cross'"></i>
                </td>
              </tr>
              <!-- Actions -->
              <tr>
                <td class="feature-col"></td>
                <td v-for="plan in filteredPlans" :key="plan.id" :class="{ 'current-plan-col': isCurrentPlan(plan) }">
                  <button
                    v-if="!isCurrentPlan(plan)"
                    class="btn-compact btn-subscribe-compact"
                    @click="selectPlan(plan)"
                    :disabled="!plan.is_active || isSubscribing"
                  >
                    {{ getPlanButtonText(plan) }}
                  </button>
                  <span v-else class="table-current-label">{{ t('plans.activePlan') }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <!-- No Plans Available -->
      <div v-else class="no-plans-container">
        <i class="fas fa-inbox fa-3x"></i>
        <h3>{{ t('plans.noPlansTitle') }}</h3>
        <p>{{ t('plans.noPlansDescription') }}</p>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useSubscriptionPlansStore } from '../../stores/subscriptionPlans'
import { useSubscriptionsStore } from '../../stores/subscriptions'
import { useTranslations } from '../../composables/useTranslations'
import { useAdminViewMode } from '../../composables/useAdminViewMode'
import router from '../../router/index'
import { useNotification } from '../../composables/useNotification'

const { t, locale } = useTranslations({
  en: {
    plans: {
      pageDescription: 'Choose the perfect plan for your needs',
      retry: 'Retry',
      comingSoon: 'Coming Soon',
      current: 'Current',
      activePlan: 'Active Plan',
      noPlansTitle: 'No subscription plans available',
      noPlansDescription: 'Please check back later or contact support.',
      startTrial: 'Start Trial',
      subscribe: 'Subscribe',
      changePlan: 'Change Plan',
      month: 'month',
      year: 'year',
      environments: 'environment(s)',
      terminal: 'terminal',
      terminals: 'terminals',
      user: 'user',
      users: 'concurrent users',
      hourMax: '{hours} hour max | {hours} hours max',
      oneHourMax: '1 hour max',
      hoursMax: '{hours} hours max',
      ephemeralOnly: 'Session data resets',
      storageGb: '{gb}GB storage',
      outboundNetwork: 'Internet access',
      noNetworkAccess: 'Offline terminal',
      volumePricing: 'Volume Pricing Available',
      volumeDescription: 'Purchase multiple licenses and save with volume discounts. Perfect for classes and teams.',
      viewBulkPricing: 'View Bulk Pricing',
      cannotDowngradeTitle: 'Cannot Downgrade',
      startPersonalSub: 'Start Personal Subscription',
      switchToFreePlan: 'Switch to Free Plan',
      switchToFreeConfirm: 'To switch to the free plan, we need to cancel your current subscription.\n\nYour current subscription will be cancelled immediately and you\'ll be switched to the free plan.\n\nDo you want to continue?',
      switchedToFreeSuccess: 'Successfully switched to free plan!',
      freeActivationError: 'There was an issue activating the free plan. Please try again or contact support.',
      activationErrorTitle: 'Activation Error',
      upgradeFromFree: 'Upgrade from Free Plan',
      upgradeFromFreeConfirm: 'You\'re about to upgrade from the free plan to {plan}.\n\nYour free plan will be replaced when you complete checkout.\n\nDo you want to continue?',
      subscriptionErrorTitle: 'Subscription Error',
      gridView: 'Grid view',
      comparePlans: 'Compare plans',
      concurrentUsers: 'Concurrent users',
      machineSizes: 'Environments',
      sessionDuration: 'Session duration',
      concurrentTerminals: 'Terminals',
      storage: 'Storage',
      networkAccess: 'Network',
      capabilities: 'Capabilities',
      managedByOrg: 'Your plan is managed by your organization',
      yourCurrentPlan: 'Your current plan',
    }
  },
  fr: {
    plans: {
      pageDescription: 'Choisissez le plan parfait pour vos besoins',
      retry: 'Réessayer',
      comingSoon: 'Bientôt disponible',
      current: 'Actuel',
      activePlan: 'Plan actif',
      noPlansTitle: 'Aucun plan d\'abonnement disponible',
      noPlansDescription: 'Veuillez vérifier plus tard ou contacter le support.',
      startTrial: 'Essai gratuit',
      subscribe: 'S\'abonner',
      changePlan: 'Changer de plan',
      month: 'mois',
      year: 'an',
      environments: 'environnement(s)',
      terminal: 'terminal',
      terminals: 'terminaux',
      user: 'utilisateur',
      users: 'utilisateurs simultanés',
      oneHourMax: '1 heure max',
      hoursMax: '{hours} heures max',
      ephemeralOnly: 'Données réinitialisées',
      storageGb: '{gb} Go de stockage',
      outboundNetwork: 'Accès Internet',
      noNetworkAccess: 'Terminal hors ligne',
      volumePricing: 'Tarification en volume disponible',
      volumeDescription: 'Achetez plusieurs licences et économisez avec des remises en volume. Idéal pour les classes et les équipes.',
      viewBulkPricing: 'Voir les tarifs en volume',
      cannotDowngradeTitle: 'Impossible de rétrograder',
      startPersonalSub: 'Démarrer un abonnement personnel',
      switchToFreePlan: 'Passer au plan gratuit',
      switchToFreeConfirm: 'Pour passer au plan gratuit, nous devons annuler votre abonnement actuel.\n\nVotre abonnement actuel sera annulé immédiatement et vous serez basculé sur le plan gratuit.\n\nVoulez-vous continuer ?',
      switchedToFreeSuccess: 'Passage au plan gratuit réussi !',
      freeActivationError: 'Un problème est survenu lors de l\'activation du plan gratuit. Veuillez réessayer ou contacter le support.',
      activationErrorTitle: 'Erreur d\'activation',
      upgradeFromFree: 'Passer à un plan supérieur',
      upgradeFromFreeConfirm: 'Vous êtes sur le point de passer du plan gratuit à {plan}.\n\nVotre plan gratuit sera remplacé une fois le paiement effectué.\n\nVoulez-vous continuer ?',
      subscriptionErrorTitle: 'Erreur d\'abonnement',
      gridView: 'Vue grille',
      comparePlans: 'Comparer les plans',
      concurrentUsers: 'Utilisateurs simultanés',
      machineSizes: 'Environnements',
      sessionDuration: 'Durée de session',
      concurrentTerminals: 'Terminaux',
      storage: 'Stockage',
      networkAccess: 'Réseau',
      capabilities: 'Fonctionnalités',
      managedByOrg: 'Votre plan est géré par votre organisation',
      yourCurrentPlan: 'Votre plan actuel',
    }
  }
})
const { showSuccess, showError, showConfirm } = useNotification()
const { isAdmin } = useAdminViewMode()

// Stores
const entityStore = useSubscriptionPlansStore()
const subscriptionsStore = useSubscriptionsStore()

// State
const isSubscribing = ref(false)
const hasCurrentSubscription = ref(false)
const viewMode = ref<'grid' | 'table'>('grid')

// Check if user has an assigned (organization-managed) subscription
const isAssignedUser = computed(() => {
  const subscription = subscriptionsStore.currentSubscription
  return subscription?.subscription_type === 'assigned'
})

// Computed
const filteredPlans = computed(() => {
  let plans = [...entityStore.entities]

  // Non-admins don't see inactive (coming soon) plans
  if (!isAdmin.value) {
    plans = plans.filter(p => p.is_active)
  }

  // Sort to put current plan first
  return plans.sort((a, b) => {
    const aIsCurrent = isCurrentPlan(a)
    const bIsCurrent = isCurrentPlan(b)

    if (aIsCurrent && !bIsCurrent) return -1
    if (!aIsCurrent && bIsCurrent) return 1
    return 0 // Keep original order for non-current plans
  })
})

// Collect all unique feature keys across plans (for comparison table)
const allFeatureKeys = computed(() => {
  const keys = new Set<string>()
  for (const plan of filteredPlans.value) {
    if (plan.features && Array.isArray(plan.features)) {
      for (const f of plan.features) {
        keys.add(f)
      }
    }
  }
  return [...keys]
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
    return t('plans.comingSoon')
  }

  if (!hasCurrentSubscription.value) {
    return plan.trial_days > 0 ? t('plans.startTrial') : t('plans.subscribe')
  }

  const currentPlan = filteredPlans.value.find((p: any) => isCurrentPlan(p))
  if (!currentPlan) {
    return t('plans.changePlan')
  }

  // Compare prices to determine if it's an upgrade or downgrade
  if (plan.price_amount > currentPlan.price_amount) {
    return t('subscriptionPlans.upgrade')
  } else if (plan.price_amount < currentPlan.price_amount) {
    return t('subscriptionPlans.downgrade')
  } else {
    return t('plans.changePlan')
  }
}

// Format helper functions for new fields
function formatSessionDuration(minutes: number): string {
  const hours = minutes / 60
  return hours === 1 ? t('plans.oneHourMax') : t('plans.hoursMax', { hours })
}

function formatStorage(plan: any): string {
  if (!plan.data_persistence_enabled) {
    return t('plans.ephemeralOnly')
  }
  return t('plans.storageGb', { gb: plan.data_persistence_gb })
}

// Machine size labels for customer-friendly display
const machineSizeLabels: Record<string, { en: string; fr: string }> = {
  'XS': { en: 'Basic', fr: 'Basique' },
  'S': { en: 'Standard', fr: 'Standard' },
  'M': { en: 'Performance', fr: 'Performance' },
  'L': { en: 'Advanced', fr: 'Avancé' },
  'XL': { en: 'Maximum', fr: 'Maximum' },
}

function formatMachineSize(size: string): string {
  const label = machineSizeLabels[size]
  if (label) {
    return locale.value === 'fr' ? label.fr : label.en
  }
  return size
}

function formatMachineSizes(sizes: string[]): string {
  return sizes.map(formatMachineSize).join(', ')
}

// Feature capability labels for plan features array
const featureLabels: Record<string, { en: string; fr: string }> = {
  unlimited_courses: { en: 'Unlimited courses', fr: 'Formations illimitées' },
  advanced_labs: { en: 'Advanced labs', fr: 'TP avancés' },
  export: { en: 'Course export', fr: 'Export de cours' },
  custom_themes: { en: 'Custom themes', fr: 'Thèmes personnalisés' },
  bulk_purchase: { en: 'Volume licensing', fr: 'Licences en volume' },
  group_management: { en: 'Group management', fr: 'Gestion des groupes' },
  api_access: { en: 'API access', fr: 'Accès API' },
  analytics: { en: 'Analytics dashboard', fr: 'Tableau de bord de suivi' },
  priority_support: { en: 'Priority support', fr: 'Support prioritaire' },
}

function formatFeatureName(feature: string): string {
  const label = featureLabels[feature]
  if (label) {
    return locale.value === 'fr' ? label.fr : label.en
  }
  // Fallback: title-case the snake_case key
  return feature
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
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
    await subscriptionsStore.getAllSubscriptions() // Load all subscriptions for stacking logic
    hasCurrentSubscription.value = subscriptionsStore.hasActiveSubscription()
  } catch (error) {
    // No current subscription is fine
    hasCurrentSubscription.value = false
  }
}

function formatPrice(amount: number, currency: string = 'EUR') {
  return entityStore.formatPrice(amount, currency)
}

function hasBulkPurchaseFeature(plan: any): boolean {
  // Only show bulk purchase for admins/trainers, not regular members/learners
  if (!isAdmin.value) return false
  // Simplified: any plan with tiered pricing supports bulk purchase
  return plan.use_tiered_pricing === true
}

function navigateToBulkPurchase(planId?: string) {
  if (planId) {
    router.push({
      name: 'BulkLicensePurchase',
      query: { planId }
    })
  } else {
    router.push({ name: 'BulkLicensePurchase' })
  }
}

async function selectPlan(plan: any) {
  if (!plan.is_active) return

  isSubscribing.value = true
  try {
    // If user has an active subscription
    if (hasCurrentSubscription.value) {
      const currentPlan = filteredPlans.value.find((p: any) => isCurrentPlan(p))
      const isCurrentlyOnFreePlan = currentPlan?.price_amount === 0
      const currentSubscription = subscriptionsStore.currentSubscription

      // Check if current subscription is assigned (gift)
      const isAssignedSubscription = currentSubscription?.subscription_type === 'assigned' ||
                                      currentSubscription?.subscription_batch_id

      // Check if user has ever purchased a personal subscription
      const allSubs = subscriptionsStore.allSubscriptions || []
      const hasPersonalSubscription = allSubs.some(sub => sub.subscription_type === 'personal')

      // RULE: Cannot downgrade from assigned subscription
      // EXCEPTION: Can always access free trial if never purchased anything personal
      if (isAssignedSubscription) {
        const currentPriority = currentSubscription?.subscription_plan?.priority ?? 0
        const targetPriority = plan.priority ?? 0

        // Check if it's a downgrade (lower priority)
        const isDowngrade = targetPriority < currentPriority

        // Exception: Allow free trial if user never purchased anything personal
        const isFreeTrial = plan.price_amount === 0
        const canActivateFreeTrial = isFreeTrial && !hasPersonalSubscription

        if (isDowngrade && !canActivateFreeTrial) {
          showError(
            t('subscriptionPlans.cannotDowngradeFromAssigned'),
            t('plans.cannotDowngradeTitle')
          )
          isSubscribing.value = false
          return
        }

        // If user wants to upgrade from assigned subscription with a personal one
        if (!isDowngrade) {
          const message = t('subscriptionPlans.upgradeFromAssignedConfirm')
            .replace('{newPlan}', plan.name)

          const confirmed = await showConfirm(
            message,
            t('plans.startPersonalSub')
          )

          if (!confirmed) {
            isSubscribing.value = false
            return
          }
        }
      }

      // Special case: downgrade to free plan requires cancellation first
      if (plan.price_amount === 0) {
        const confirmed = await showConfirm(
          t('plans.switchToFreeConfirm'),
          t('plans.switchToFreePlan')
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
          showSuccess(t('plans.switchedToFreeSuccess'))
          // Reload to show the new free subscription
          await checkCurrentSubscription()
          await loadPlans()
          return
        } else {
          // If no free_plan flag but no error, something went wrong
          console.error('Unexpected response:', response)
          showError(t('plans.freeActivationError'), t('plans.activationErrorTitle'))
        }
      }

      // Special case: upgrading FROM free plan to paid plan
      // This is a new subscription, not an upgrade
      if (isCurrentlyOnFreePlan && plan.price_amount > 0) {
        const confirmed = await showConfirm(
          t('plans.upgradeFromFreeConfirm', { plan: plan.name }),
          t('plans.upgradeFromFree')
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
        t('plans.changePlan')
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
      showError(subscriptionsStore.error, t('plans.subscriptionErrorTitle'))
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
  padding: var(--spacing-lg);
}

.page-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
}

.page-header h1 {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-4xl);
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
  padding: var(--spacing-3xl) var(--spacing-lg);
  color: var(--color-text-muted);
}

.error-message {
  color: var(--color-danger);
  margin: var(--spacing-lg) 0;
}

/* Compact Plans Grid */
.plans-grid-compact {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.plan-card-compact {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius-lg);
  padding: 0;
  position: relative;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.plan-card-compact:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.plan-card-compact.current-plan {
  border-color: var(--color-success);
  background: linear-gradient(135deg, var(--color-bg-primary) 0%, var(--color-success-bg) 100%);
  box-shadow: var(--shadow-lg);
}

.plan-card-compact.coming-soon-plan {
  opacity: 0.7;
  background: linear-gradient(135deg, var(--color-bg-tertiary) 0%, var(--color-bg-secondary) 100%);
  position: relative;
}

.plan-card-compact.coming-soon-plan:hover {
  transform: none;
  box-shadow: var(--shadow-sm);
}

/* Coming Soon Badge */
.coming-soon-badge {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  background: var(--color-warning);
  color: var(--color-white);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--border-radius-xl);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  z-index: 10;
  box-shadow: var(--shadow-sm);
}

/* Compact Header */
.plan-header-compact {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-gray-50);
}

.plan-title-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.plan-name-compact {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.current-badge {
  background: var(--color-success);
  color: var(--color-white);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-xl);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
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
  padding: var(--spacing-md);
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--spacing-md);
  align-items: center;
}

.features-column {
  min-width: 0;
}

.key-features {
  display: grid;
  gap: var(--spacing-xs);
}

.feature-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.feature-item i {
  width: 14px;
  color: var(--color-primary);
  font-size: var(--font-size-sm);
}

.action-column {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.btn-compact {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  border: none;
  cursor: pointer;
  transition: all var(--transition-base);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  min-width: 100px;
  justify-content: center;
}

.btn-subscribe-compact {
  background: var(--color-primary);
  color: var(--color-white);
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
  gap: var(--spacing-xs);
  color: var(--color-success);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
}

.plan-description-compact {
  padding: 0 var(--spacing-md) var(--spacing-md) var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  line-height: 1.4;
  border-top: 1px solid var(--color-border-light);
  background: var(--color-bg-secondary);
  margin-top: var(--spacing-sm);
}

/* Bulk Purchase Section */
.bulk-purchase-section {
  padding: var(--spacing-md);
  border-top: 1px solid var(--color-primary-light);
  background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-info-bg) 100%);
  margin-top: var(--spacing-sm);
}

.bulk-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  margin-bottom: var(--spacing-sm);
}

.bulk-header i {
  font-size: var(--font-size-md);
}

.bulk-description {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-md) 0;
  line-height: 1.4;
}

.btn-bulk-purchase {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-base);
  width: 100%;
  justify-content: center;
}

.btn-bulk-purchase:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-bulk-purchase i {
  font-size: var(--font-size-base);
}

/* Planned Features Section */
.planned-features-section {
  padding: var(--spacing-md);
  border-top: 1px solid var(--color-gray-200);
  background: var(--color-gray-50);
  margin-top: var(--spacing-sm);
}

.planned-features-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-600);
  margin-bottom: var(--spacing-sm);
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
  gap: var(--spacing-xs);
}

.planned-feature-item {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  padding-left: var(--spacing-sm);
  line-height: 1.4;
  font-style: italic;
}

.planned-feature-item::before {
  content: '•';
  margin-right: var(--spacing-xs);
  color: var(--color-gray-500);
}


/* Assigned User View */
.assigned-user-view {
  max-width: 600px;
  margin: 0 auto;
}

.assigned-info-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
  border-left: 4px solid var(--color-info);
}

.assigned-info-card > i {
  font-size: var(--font-size-3xl);
  color: var(--color-info);
}

.assigned-info-content h3 {
  margin: 0 0 var(--spacing-xs) 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-xl);
}

.assigned-message {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-base);
}

/* View Toggle */
.view-toggle {
  display: flex;
  justify-content: center;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-lg);
}

.btn-toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-toggle:hover {
  background: var(--color-bg-tertiary);
}

.btn-toggle.active {
  background: var(--color-primary);
  color: var(--color-white);
  border-color: var(--color-primary);
}

/* Capabilities Section */
.capabilities-section {
  margin-top: var(--spacing-sm);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--color-border-light);
  display: grid;
  gap: var(--spacing-xs);
}

.capability-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.capability-item i {
  width: 14px;
  color: var(--color-success);
  font-size: var(--font-size-xs);
}

/* Comparison Table */
.comparison-table-wrapper {
  overflow-x: auto;
  margin-bottom: var(--spacing-lg);
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--color-bg-primary);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.comparison-table th,
.comparison-table td {
  padding: var(--spacing-sm) var(--spacing-md);
  text-align: center;
  border-bottom: 1px solid var(--color-border-light);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.comparison-table th {
  background: var(--color-gray-50);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  vertical-align: top;
}

.comparison-table .feature-col {
  text-align: left;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  white-space: nowrap;
  min-width: 160px;
}

.comparison-table .current-plan-col {
  background: var(--color-success-bg);
}

.table-plan-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  align-items: center;
}

.table-plan-name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
}

.table-plan-price {
  font-size: var(--font-size-sm);
  color: var(--color-success);
  font-weight: var(--font-weight-semibold);
}

.table-current-badge {
  font-size: var(--font-size-xs);
  background: var(--color-success);
  color: var(--color-white);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-xl);
}

.table-current-label {
  color: var(--color-success);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
}

.table-check {
  color: var(--color-success);
}

.table-cross {
  color: var(--color-gray-400);
}

/* Utilities */
.text-success { color: var(--color-success) !important; }
.text-info { color: var(--color-info) !important; }
.text-muted { color: var(--color-gray-600) !important; }

/* Responsive */
@media (max-width: 768px) {
  .subscription-plans-page {
    padding: var(--spacing-lg) var(--spacing-md);
  }

  .page-header h1 {
    font-size: var(--font-size-3xl);
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .plans-grid-compact {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }

  .plan-content-compact {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }

  .action-column {
    align-items: stretch;
  }

  .btn-compact {
    width: 100%;
  }

  .price-amount {
    font-size: var(--font-size-3xl);
  }
}
</style>