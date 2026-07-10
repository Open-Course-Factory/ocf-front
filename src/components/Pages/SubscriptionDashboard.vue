<!-- 
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
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

      <!-- Upgrade to Team Banner (hide for assigned subscriptions) -->
      <UpgradeToTeamBanner v-if="!isAssigned" />

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
        <!-- Active subscription: single info + actions panel -->
        <ActiveSubscriptionSource
          v-if="subscriptionsStore.hasActiveSubscription() && primarySubscription"
          :primary-subscription="primarySubscription"
          :all-subscriptions="subscriptionsStore.allSubscriptions"
          :total-subscriptions="subscriptionsStore.allSubscriptions.length"
          :is-managing="isManaging"
          :is-reactivating="isReactivating"
          @manage="openStripePortal"
          @cancel="showCancelModal = true"
          @reactivate="showReactivateModal = true"
        />

        <!-- No active subscription: standalone CTA -->
        <NoSubscriptionCard
          v-else
          :last-canceled-subscription="lastCanceledSubscription"
          :is-activating-free-plan="isActivatingFreePlan"
          @activate-free-plan="activateFreePlan"
          @reactivate="showReactivateModal = true"
        />

        <!-- All Subscriptions (Stacked View) - hidden for assigned-only users -->
        <AllSubscriptions
          v-if="!isAssigned && subscriptionsStore.hasActiveSubscription() && subscriptionsStore.allSubscriptions.length > 1"
          :subscriptions="subscriptionsStore.allSubscriptions"
          :is-loading="isLoadingAllSubs"
        />

        <!-- Live terminal usage (budget bars + active sessions) -->
        <TerminalUsagePanel
          v-if="subscriptionsStore.hasActiveSubscription()"
          :organization-id="currentOrgId || undefined"
        />

        <!-- Org Terminal Usage Panel (managers/owners only) -->
        <OrgTerminalUsagePanel
          v-if="showOrgTerminalPanel"
          :organization-id="currentOrgId"
        />

        <!-- Composant Factures Récentes (hidden for assigned users who don't pay) -->
        <RecentInvoices
          v-if="!isAssigned"
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
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSubscriptionsStore } from '../../stores/subscriptions'
import { useOrganizationsStore } from '../../stores/organizations'
import { usePermissionsStore } from '../../stores/permissions'
import { extractErrorMessage } from '../../utils/formatters'
import { useTranslations } from '../../composables/useTranslations'
import axios from 'axios'

// Import des composants modulaires
import { NoSubscriptionCard, RecentInvoices, AllSubscriptions, ActiveSubscriptionSource } from '../Subscription/Dashboard'
import { CancelSubscriptionModal, ReactivateModal } from '../Subscription/Modals'
import ErrorAlert from '../UI/ErrorAlert.vue'
import UpgradeToTeamBanner from '../Common/UpgradeToTeamBanner.vue'
import OrgTerminalUsagePanel from '../Terminal/OrgTerminalUsagePanel.vue'
import TerminalUsagePanel from '../Terminal/TerminalUsagePanel.vue'
import { isAssignedSubscription } from '../../utils/subscriptionHelpers'

const { t } = useI18n()

// Localized fallbacks for API errors that don't carry a server message.
// Registered on the shared i18n instance so the useI18n() `t` above resolves
// them alongside the store-registered `subscriptions.*` keys.
useTranslations({
  en: {
    subscriptionDashboard: {
      loadError: 'Error loading the dashboard',
      portalError: 'Unable to open the management portal',
      cancelError: 'Failed to cancel subscription',
      reactivateError: 'Failed to reactivate subscription',
      freePlanUnavailable: 'Free trial plan not available',
      freePlanActivateError: 'Failed to activate free plan'
    }
  },
  fr: {
    subscriptionDashboard: {
      loadError: 'Erreur lors du chargement du tableau de bord',
      portalError: 'Impossible d\'ouvrir le portail de gestion',
      cancelError: 'Échec de l\'annulation de l\'abonnement',
      reactivateError: 'Échec de la réactivation de l\'abonnement',
      freePlanUnavailable: 'Le plan d\'essai gratuit n\'est pas disponible',
      freePlanActivateError: 'Échec de l\'activation du plan gratuit'
    }
  }
})

// Stores
const subscriptionsStore = useSubscriptionsStore()
const organizationsStore = useOrganizationsStore()
const permissionsStore = usePermissionsStore()

// État local
const isLoading = ref(false)
const error = ref('')
const isManaging = ref(false)
const isCanceling = ref(false)
const isReactivating = ref(false)
const isActivatingFreePlan = ref(false)
const showCancelModal = ref(false)
const showReactivateModal = ref(false)

// Loading states for components
const isLoadingInvoices = ref(false)
const isLoadingAllSubs = ref(false)

// Données réactives
const recentInvoices = ref([])
const lastCanceledSubscription = ref(null)
const downloadingInvoices = ref<Set<string>>(new Set())

// Caching timestamps to avoid redundant reloads
const lastInvoicesLoad = ref<number>(0)
const CACHE_DURATION = 60 * 1000 // 1 minute

// Computed
const primarySubscription = computed(() => {
  return subscriptionsStore.currentSubscription
})

const isAssigned = computed(() => isAssignedSubscription(subscriptionsStore.currentSubscription))

// Show org terminal usage panel when user can manage the current org
const currentOrgId = computed(() => organizationsStore.currentOrganization?.id ?? null)

const showOrgTerminalPanel = computed(() => {
  const orgId = currentOrgId.value
  if (!orgId) return false
  return permissionsStore.canManageOrganization(orgId)
})

// Lifecycle
onMounted(async () => {
  await loadDashboardData()
})

// Méthodes principales
async function loadDashboardData() {
  isLoading.value = true
  error.value = ''

  // Set loading states immediately for all components
  isLoadingInvoices.value = true
  isLoadingAllSubs.value = true

  try {
    await loadCurrentSubscription()

    if (subscriptionsStore.hasActiveSubscription()) {
      await Promise.allSettled([
        loadAllSubscriptions(),
        loadRecentInvoices()
      ])
    } else {
      // If no active subscription, stop loading these components
      isLoadingInvoices.value = false
      isLoadingAllSubs.value = false
      await loadLastCanceledSubscription()
    }
  } catch (err: any) {
    console.error('Erreur lors du chargement du dashboard:', err)
    error.value = extractErrorMessage(err, t('subscriptionDashboard.loadError'))
    // Make sure to stop loading on error
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

// Actions Stripe
async function openStripePortal() {
  isManaging.value = true
  error.value = ''
  
  try {
    const returnUrl = `${window.location.origin}/subscription-dashboard`
    await subscriptionsStore.createPortalSession(returnUrl)
  } catch (err: any) {
    console.error('Erreur ouverture portail:', err)
    error.value = extractErrorMessage(err, t('subscriptionDashboard.portalError'))
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
    error.value = extractErrorMessage(err, t('subscriptionDashboard.cancelError'))
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
    error.value = extractErrorMessage(err, t('subscriptionDashboard.reactivateError'))
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
      error.value = t('subscriptionDashboard.freePlanUnavailable')
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
    error.value = extractErrorMessage(err, t('subscriptionDashboard.freePlanActivateError'))
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