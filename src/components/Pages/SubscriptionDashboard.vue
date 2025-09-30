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

      <!-- Messages d'erreur globaux -->
      <div v-if="error" class="alert alert-danger">
        <i class="fas fa-exclamation-triangle"></i>
        {{ error }}
        <button class="btn btn-sm btn-outline-danger" @click="error = ''">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Indicateur de chargement principal -->
      <div v-if="isLoading && !subscriptionsStore.currentSubscription" class="loading-section">
        <i class="fas fa-spinner fa-spin fa-2x"></i>
        <p>{{ t('subscriptions.loadingDashboard') }}</p>
      </div>

      <div v-else class="dashboard-content">
        <!-- Composant Abonnement -->
        <SubscriptionCard
          :subscription="subscriptionsStore.currentSubscription"
          :has-active-subscription="subscriptionsStore.hasActiveSubscription()"
          :last-canceled-subscription="lastCanceledSubscription"
          :is-managing="isManaging"
          :is-reactivating="isReactivating"
          @manage="openStripePortal"
          @cancel="showCancelModal = true"
          @reactivate="showReactivateModal = true"
        />

        <!-- Composant Utilisation (seulement si abonnement actif) -->
        <UsageOverview
          v-if="subscriptionsStore.hasActiveSubscription()"
          :metrics="usageMetrics"
          :is-refreshing="isRefreshingUsage"
          @refresh="refreshUsage"
        />

        <!-- Composant Factures Récentes -->
        <RecentInvoices
          :invoices="recentInvoices"
          :downloading-ids="downloadingInvoices"
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
import axios from 'axios'

// Import des composants modulaires
import { SubscriptionCard, UsageOverview, RecentInvoices } from '../Subscription/Dashboard'
import { CancelSubscriptionModal, ReactivateModal } from '../Subscription/Modals'

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
const showCancelModal = ref(false)
const showReactivateModal = ref(false)

// Données réactives
const usageMetrics = ref([])
const recentInvoices = ref([])
const lastCanceledSubscription = ref(null)
const downloadingInvoices = ref<Set<string>>(new Set())

// Lifecycle
onMounted(async () => {
  await loadDashboardData()
})

// Méthodes principales
async function loadDashboardData() {
  isLoading.value = true
  error.value = ''

  try {
    await loadCurrentSubscription()
    
    if (subscriptionsStore.hasActiveSubscription()) {
      await Promise.allSettled([
        loadUsageMetrics(),
        loadRecentInvoices()
      ])
    } else {
      await loadLastCanceledSubscription()
    }
  } catch (err: any) {
    console.error('Erreur lors du chargement du dashboard:', err)
    error.value = 'Erreur lors du chargement du tableau de bord'
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

async function loadUsageMetrics() {
  try {
    usageMetrics.value = await subscriptionsStore.getUsageMetrics()
  } catch (err) {
    console.warn('Impossible de charger les métriques d\'usage:', err)
    usageMetrics.value = []
  }
}

async function loadRecentInvoices() {
  try {
    // Utiliser le store pour synchroniser et charger les factures
    const { useInvoicesStore } = await import('../../stores/invoices')
    const invoicesStore = useInvoicesStore()

    await invoicesStore.syncAndLoadInvoices()
    // Prendre seulement les 3 plus récentes
    recentInvoices.value = invoicesStore.entities.slice(0, 3)
  } catch (err) {
    console.warn('Impossible de charger les factures récentes:', err)
    recentInvoices.value = []
  }
}

async function loadLastCanceledSubscription() {
  try {
    const response = await axios.get('/subscriptions/history?status=canceled&limit=1')
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
    await loadUsageMetrics()
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
    error.value = err.response?.data?.error_message || 'Impossible d\'ouvrir le portail de gestion'
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
    showCancelModal.value = false
  } finally {
    isCanceling.value = false
  }
}

async function confirmReactivation() {
  if (!subscriptionsStore.currentSubscription?.id) return

  isReactivating.value = true
  try {
    await subscriptionsStore.reactivateSubscription(subscriptionsStore.currentSubscription.id)
    showReactivateModal.value = false
  } finally {
    isReactivating.value = false
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
  padding: 20px;
}

.dashboard-header {
  text-align: center;
  margin-bottom: 40px;
}

.dashboard-header h2 {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin: 0 0 10px 0;
  color: #333;
}

.loading-section {
  text-align: center;
  padding: 60px 20px;
  color: #6c757d;
}

.dashboard-content {
  display: grid;
  gap: 30px;
}

/* Alert */
.alert {
  padding: 15px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alert-danger {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* Button */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.btn-outline-danger {
  color: #dc3545;
  border-color: #dc3545;
  background-color: transparent;
}

/* Text utilities */
.text-muted {
  color: #6c757d !important;
}

/* Responsive */
@media (max-width: 768px) {
  .subscription-dashboard {
    padding: 10px;
  }
}
</style>