<!-- 
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */ 
-->

<template>
  <div class="wrapper">
    <div class="subscription-dashboard">
      <div class="dashboard-header">
        <h2>
          <i class="fas fa-tachometer-alt"></i>
          {{ t('subscriptions.dashboardTitle') }}
        </h2>
        <p class="text-muted">{{ t('subscriptions.dashboardSubtitle') }}</p>
      </div>

      <!-- Upgrade to Team Banner -->
      <UpgradeToTeamBanner />

      <!-- Messages d'erreur globaux (utilise le nouveau composant ErrorAlert) -->
      <ErrorAlert
        :message="error"
        @dismiss="error = ''"
      />

      <!-- Indicateur de chargement principal -->
      <div v-if="isLoading && !subscriptionsStore.currentSubscription" class="loading-section">
        <i class="fas fa-spinner fa-spin fa-2x"></i>
        <p>{{ t('subscriptions.loadingDashboard') }}</p>
      </div>

      <div v-else class="dashboard-content">
        <!-- Composant Abonnement -->
        <SubscriptionCard
          :subscription="subscriptionsStore.currentSubscription"
          :all-subscriptions="subscriptionsStore.allSubscriptions"
          :has-active-subscription="subscriptionsStore.hasActiveSubscription()"
          :last-canceled-subscription="lastCanceledSubscription"
          :is-managing="isManaging"
          :is-reactivating="isReactivating"
          :is-activating-free-plan="isActivatingFreePlan"
          @manage="openStripePortal"
          @cancel="showCancelModal = true"
          @reactivate="showReactivateModal = true"
          @activate-free-plan="activateFreePlan"
        />

        <!-- All Subscriptions (Stacked View) -->
        <AllSubscriptions
          v-if="subscriptionsStore.hasActiveSubscription() && subscriptionsStore.allSubscriptions.length > 0"
          :subscriptions="subscriptionsStore.allSubscriptions"
          :is-loading="isLoadingAllSubs"
        />

        <!-- Composant Utilisation (seulement si abonnement actif) -->
        <UsageOverview
          v-if="subscriptionsStore.hasActiveSubscription()"
          :metrics="usageMetrics"
          :is-refreshing="isRefreshingUsage"
          :is-loading="isLoadingUsage"
          @refresh="refreshUsage"
        />

        <!-- Composant Factures Récentes -->
        <RecentInvoices
          :invoices="recentInvoices"
          :downloading-ids="downloadingInvoices"
          :is-loading="isLoadingInvoices"
          @download-invoice="downloadInvoice"
        />
      </div>

      <!-- Modals -->
      <CancelSubscriptionModal
        :visible="showCancelModal"
        :is-confirming="isCanceling"
        @close="showCancelModal = false"
        @confirm="confirmCancellation"
      />

      <ReactivateModal
        :visible="showReactivateModal"
        :subscription="subscriptionsStore.currentSubscription"
        :is-confirming="isReactivating"
        @close="showReactivateModal = false"
        @confirm="confirmReactivation"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSubscriptionsStore } from '../../stores/subscriptions'
import { extractErrorMessage } from '../../utils/formatters'
import axios from 'axios'

// Import des composants modulaires
import { SubscriptionCard, UsageOverview, RecentInvoices, AllSubscriptions } from '../Subscription/Dashboard'
import { CancelSubscriptionModal, ReactivateModal } from '../Subscription/Modals'
import ErrorAlert from '../UI/ErrorAlert.vue'
import UpgradeToTeamBanner from '../Common/UpgradeToTeamBanner.vue'

const { t } = useI18n()

// Stores
const subscriptionsStore = useSubscriptionsStore()

// État local
const isLoading = ref(false)
const error = ref('')
const isManaging = ref(false)
const isRefreshingUsage = ref(false)
const isCanceling = ref(false)
const isReactivating = ref(false)
const isActivatingFreePlan = ref(false)
const showCancelModal = ref(false)
const showReactivateModal = ref(false)

// Loading states for components
const isLoadingUsage = ref(false)
const isLoadingInvoices = ref(false)
const isLoadingAllSubs = ref(false)

// Données réactives
const usageMetrics = ref([])
const recentInvoices = ref([])
const lastCanceledSubscription = ref(null)
const downloadingInvoices = ref<Set<string>>(new Set())

// Caching timestamps to avoid redundant reloads
const lastUsageLoad = ref<number>(0)
const lastInvoicesLoad = ref<number>(0)
const CACHE_DURATION = 60 * 1000 // 1 minute

// Lifecycle
onMounted(async () => {
  await loadDashboardData()
})

// Méthodes principales
async function loadDashboardData() {
  isLoading.value = true
  error.value = ''

  // Set loading states immediately for all components
  isLoadingUsage.value = true
  isLoadingInvoices.value = true
  isLoadingAllSubs.value = true

  try {
    await loadCurrentSubscription()

    if (subscriptionsStore.hasActiveSubscription()) {
      await Promise.allSettled([
        loadAllSubscriptions(),
        loadUsageMetrics(),
        loadRecentInvoices()
      ])
    } else {
      // If no active subscription, stop loading these components
      isLoadingUsage.value = false
      isLoadingInvoices.value = false
      isLoadingAllSubs.value = false
      await loadLastCanceledSubscription()
    }
  } catch (err: any) {
    console.error('Erreur lors du chargement du dashboard:', err)
    error.value = extractErrorMessage(err, 'Erreur lors du chargement du tableau de bord')
    // Make sure to stop loading on error
    isLoadingUsage.value = false
    isLoadingInvoices.value = false
    isLoadingAllSubs.value = false
  } finally {
    isLoading.value = false
  }
}

async function loadCurrentSubscription() {
  try {
    await subscriptionsStore.getCurrentSubscription()
  } catch (err: any) {
    if (err.response?.status !== 404) {
      throw err
    }
  }
}

async function loadAllSubscriptions() {
  try {
    await subscriptionsStore.getAllSubscriptions()
  } catch (err) {
    console.warn('Impossible de charger tous les abonnements:', err)
  } finally {
    isLoadingAllSubs.value = false
  }
}

async function loadUsageMetrics(force: boolean = false) {
  // Check cache unless forced reload
  const now = Date.now()
  if (!force && (now - lastUsageLoad.value) < CACHE_DURATION && usageMetrics.value.length > 0) {
    console.debug('Using cached usage metrics')
    isLoadingUsage.value = false
    return
  }

  try {
    usageMetrics.value = await subscriptionsStore.getUsageMetrics()
    lastUsageLoad.value = now
  } catch (err) {
    console.warn('Impossible de charger les métriques d\'usage:', err)
    usageMetrics.value = []
  } finally {
    isLoadingUsage.value = false
  }
}

async function loadRecentInvoices(force: boolean = false) {
  // Check cache unless forced reload
  const now = Date.now()
  if (!force && (now - lastInvoicesLoad.value) < CACHE_DURATION && recentInvoices.value.length > 0) {
    console.debug('Using cached invoices')
    isLoadingInvoices.value = false
    return
  }

  try {
    // Utiliser le store pour synchroniser et charger les factures
    const { useInvoicesStore } = await import('../../stores/invoices')
    const invoicesStore = useInvoicesStore()

    await invoicesStore.syncAndLoadInvoices()
    // Prendre seulement les 3 plus récentes
    recentInvoices.value = invoicesStore.entities.slice(0, 3)
    lastInvoicesLoad.value = now
  } catch (err) {
    console.warn('Impossible de charger les factures récentes:', err)
    recentInvoices.value = []
  } finally {
    isLoadingInvoices.value = false
  }
}

async function loadLastCanceledSubscription() {
  try {
    const response = await axios.get('/user-subscriptions/history?status=canceled&limit=1')
    if (response.data && response.data.length > 0) {
      lastCanceledSubscription.value = response.data[0]
    }
  } catch (err) {
    console.warn('Impossible de charger l\'historique des abonnements:', err)
  }
}

async function refreshUsage() {
  isRefreshingUsage.value = true
  try {
    await loadUsageMetrics(true) // Force reload, bypass cache
  } finally {
    isRefreshingUsage.value = false
  }
}

// Actions Stripe
async function openStripePortal() {
  isManaging.value = true
  error.value = ''
  
  try {
    const returnUrl = `${window.location.origin}/subscription-dashboard`
    await subscriptionsStore.createPortalSession(returnUrl)
  } catch (err: any) {
    console.error('Erreur ouverture portail:', err)
    error.value = extractErrorMessage(err, 'Impossible d\'ouvrir le portail de gestion')
  } finally {
    isManaging.value = false
  }
}

async function confirmCancellation(cancelImmediately: boolean) {
  if (!subscriptionsStore.currentSubscription?.id) return

  isCanceling.value = true
  try {
    await subscriptionsStore.cancelSubscription(
      subscriptionsStore.currentSubscription.id,
      cancelImmediately
    )
  } catch (err: any) {
    console.error('Error canceling subscription:', err)
    error.value = extractErrorMessage(err, 'Failed to cancel subscription')
  } finally {
    isCanceling.value = false
    showCancelModal.value = false
  }
}

async function confirmReactivation() {
  if (!subscriptionsStore.currentSubscription?.id) return

  isReactivating.value = true
  try {
    await subscriptionsStore.reactivateSubscription(subscriptionsStore.currentSubscription.id)
  } catch (err: any) {
    console.error('Error reactivating subscription:', err)
    error.value = extractErrorMessage(err, 'Failed to reactivate subscription')
  } finally {
    isReactivating.value = false
    showReactivateModal.value = false
  }
}

async function activateFreePlan() {
  isActivatingFreePlan.value = true
  error.value = ''

  try {
    // Find the free trial plan (price_amount === 0)
    const { useSubscriptionPlansStore } = await import('../../stores/subscriptionPlans')
    const plansStore = useSubscriptionPlansStore()
    await plansStore.ensurePlansLoaded()

    const freePlan = plansStore.entities.find((plan: any) => plan.price_amount === 0 && plan.is_active)

    if (!freePlan) {
      error.value = 'Free trial plan not available'
      return
    }

    // Activate the free plan
    const successUrl = `${window.location.origin}/subscription-dashboard?success=true`
    const cancelUrl = `${window.location.origin}/subscription-dashboard`

    const response = await subscriptionsStore.createCheckoutSession(
      freePlan.id,
      successUrl,
      cancelUrl
    )

    if (response?.free_plan) {
      // Reload dashboard data
      await loadDashboardData()
    }
  } catch (err: any) {
    console.error('Error activating free plan:', err)
    error.value = extractErrorMessage(err, 'Failed to activate free plan')
  } finally {
    isActivatingFreePlan.value = false
  }
}

// Actions factures
async function downloadInvoice(invoiceId: string) {
  downloadingInvoices.value.add(invoiceId)
  try {
    const { useInvoicesStore } = await import('../../stores/invoices')
    const invoicesStore = useInvoicesStore()
    await invoicesStore.downloadInvoice(invoiceId)
  } catch (err) {
    console.error('Erreur téléchargement facture:', err)
  } finally {
    downloadingInvoices.value.delete(invoiceId)
  }
}
</script>

<style scoped>
.subscription-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-lg);
}

.dashboard-header {
  text-align: center;
  margin-bottom: var(--spacing-lg);
}

.dashboard-header h2 {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--color-text-primary);
}

.loading-section {
  text-align: center;
  padding: var(--spacing-2xl) var(--spacing-lg);
  color: var(--color-gray-600);
}

.dashboard-content {
  display: grid;
  gap: var(--spacing-md);
}

/* Alert */
.alert {
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--border-radius-lg);
  margin-bottom: var(--spacing-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alert-danger {
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
  border: 1px solid var(--color-danger-border);
}

/* Text utilities */
.text-muted {
  color: var(--color-gray-600) !important;
}

/* Responsive */
@media (max-width: 768px) {
  .subscription-dashboard {
    padding: var(--spacing-sm);
  }
}
</style>