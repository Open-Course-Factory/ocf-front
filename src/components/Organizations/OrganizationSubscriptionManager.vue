<template>
  <div class="subscription-manager">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <i class="fas fa-spinner fa-spin fa-2x"></i>
      <p>{{ t('subscription.loading') }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <i class="fas fa-exclamation-circle"></i>
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="loadSubscription">
        <i class="fas fa-redo"></i>
        {{ t('subscription.retry') }}
      </button>
    </div>

    <!-- Active Subscription -->
    <div v-else-if="subscription" class="subscription-content">
      <!-- Subscription Card -->
      <div class="subscription-card">
        <div class="card-header">
          <div class="plan-info">
            <h3>
              <i class="fas fa-crown"></i>
              {{ subscription.subscription_plan?.name || t('subscription.currentPlan') }}
            </h3>
            <span :class="['status-badge', `status-${subscription.status}`]">
              {{ getStatusLabel(subscription.status) }}
            </span>
          </div>
          <div class="plan-price">
            <div class="price-amount">
              {{ formatPrice(subscription.subscription_plan?.price_amount, subscription.subscription_plan?.currency) }}
            </div>
            <div class="price-period">
              / {{ subscription.subscription_plan?.billing_interval === 'year' ? t('subscription.year') : t('subscription.month') }}
            </div>
          </div>
        </div>

        <div class="card-body">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">{{ t('subscription.currentPeriod') }}:</span>
              <span class="info-value">
                {{ formatDate(subscription.current_period_start) }} - {{ formatDate(subscription.current_period_end) }}
              </span>
            </div>
            <div v-if="subscription.cancel_at_period_end" class="info-item warning">
              <span class="info-label">
                <i class="fas fa-exclamation-triangle"></i>
                {{ t('subscription.cancelScheduled') }}:
              </span>
              <span class="info-value">{{ formatDate(subscription.current_period_end) }}</span>
            </div>
          </div>

          <!-- Features -->
          <div v-if="subscription.subscription_plan" class="features-section">
            <h4>{{ t('subscription.features') }}</h4>
            <ul class="features-list">
              <li v-for="(feature, index) in subscription.subscription_plan.features" :key="index">
                <i class="fas fa-check-circle"></i>
                {{ feature }}
              </li>
            </ul>

            <!-- Limits -->
            <div class="limits-grid">
              <div class="limit-item">
                <i class="fas fa-book"></i>
                <span class="limit-label">{{ t('subscription.maxCourses') }}</span>
                <span class="limit-value">{{ formatLimit(subscription.subscription_plan.max_courses) }}</span>
              </div>
              <div class="limit-item">
                <i class="fas fa-users"></i>
                <span class="limit-label">{{ t('subscription.maxUsers') }}</span>
                <span class="limit-value">{{ subscription.subscription_plan.max_concurrent_users }}</span>
              </div>
              <div class="limit-item">
                <i class="fas fa-laptop-code"></i>
                <span class="limit-label">{{ t('subscription.maxTerminals') }}</span>
                <span class="limit-value">{{ subscription.subscription_plan.max_concurrent_terminals }}</span>
              </div>
              <div class="limit-item">
                <i class="fas fa-clock"></i>
                <span class="limit-label">{{ t('subscription.sessionDuration') }}</span>
                <span class="limit-value">{{ subscription.subscription_plan.max_session_duration_minutes }} min</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div v-if="canManage" class="card-footer">
          <button
            v-if="!subscription.cancel_at_period_end"
            class="btn btn-outline-danger"
            @click="confirmCancelSubscription"
          >
            <i class="fas fa-times-circle"></i>
            {{ t('subscription.cancelSubscription') }}
          </button>
          <button
            v-else
            class="btn btn-outline-primary"
            @click="reactivateSubscription"
          >
            <i class="fas fa-undo"></i>
            {{ t('subscription.reactivateSubscription') }}
          </button>

          <button class="btn btn-primary" @click="showChangePlanModal = true">
            <i class="fas fa-exchange-alt"></i>
            {{ t('subscription.changePlan') }}
          </button>
        </div>
      </div>
    </div>

    <!-- No Subscription -->
    <div v-else class="no-subscription">
      <i class="fas fa-credit-card fa-3x"></i>
      <h3>{{ t('subscription.noSubscription') }}</h3>
      <p>{{ t('subscription.noSubscriptionDesc') }}</p>
      <button
        v-if="canManage"
        class="btn btn-primary btn-lg"
        @click="showAvailablePlans"
      >
        <i class="fas fa-shopping-cart"></i>
        {{ t('subscription.choosePlan') }}
      </button>
    </div>

    <!-- Change Plan Modal -->
    <BaseModal
      :visible="showChangePlanModal"
      :title="t('subscription.availablePlans')"
      title-icon="fas fa-exchange-alt"
      size="large"
      @close="showChangePlanModal = false"
    >
      <p class="modal-description">{{ t('subscription.selectNewPlan') }}</p>
      <div v-if="modalError" class="alert alert-danger">{{ modalError }}</div>

      <div class="plans-list">
        <div
          v-for="plan in availablePlans"
          :key="plan.id"
          :class="['plan-option', { active: subscription?.subscription_plan_id === plan.id }]"
          @click="selectPlan(plan)"
        >
          <div class="plan-header">
            <h4>{{ plan.name }}</h4>
            <div class="plan-price">
              {{ formatPrice(plan.price_amount, plan.currency) }}
              <span class="plan-period">
                / {{ plan.billing_interval === 'year' ? t('subscription.year') : t('subscription.month') }}
              </span>
            </div>
          </div>
          <p v-if="plan.description" class="plan-description">{{ plan.description }}</p>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import BaseModal from '../Modals/BaseModal.vue'
import { useTranslations } from '../../composables/useTranslations'
import type { OrganizationSubscription, SubscriptionPlan } from '../../types'

interface Props {
  organizationId: string
  canManage: boolean
}

const props = defineProps<Props>()

const { t } = useTranslations({
  en: {
    subscription: {
      loading: 'Loading subscription...',
      retry: 'Retry',
      currentPlan: 'Current Plan',
      features: 'Features',
      maxCourses: 'Max Courses',
      maxUsers: 'Max Users',
      maxTerminals: 'Max Terminals',
      sessionDuration: 'Session Duration',
      currentPeriod: 'Current Period',
      cancelScheduled: 'Cancellation scheduled for',
      cancelSubscription: 'Cancel Subscription',
      reactivateSubscription: 'Reactivate Subscription',
      changePlan: 'Change Plan',
      noSubscription: 'No Active Subscription',
      noSubscriptionDesc: 'Subscribe to a plan to unlock features for your organization',
      choosePlan: 'Choose a Plan',
      availablePlans: 'Available Plans',
      selectNewPlan: 'Select a new plan for your organization',
      month: 'month',
      year: 'year',
      unlimited: 'Unlimited',
      statusActive: 'Active',
      statusTrialing: 'Trial',
      statusPastDue: 'Past Due',
      statusCanceled: 'Canceled',
      statusPendingPayment: 'Pending Payment',
      confirmCancel: 'Are you sure you want to cancel this subscription? It will remain active until the end of the current billing period.',
    }
  },
  fr: {
    subscription: {
      loading: 'Chargement de l\'abonnement...',
      retry: 'Réessayer',
      currentPlan: 'Plan actuel',
      features: 'Fonctionnalités',
      maxCourses: 'Cours max',
      maxUsers: 'Utilisateurs max',
      maxTerminals: 'Terminaux max',
      sessionDuration: 'Durée de session',
      currentPeriod: 'Période actuelle',
      cancelScheduled: 'Annulation prévue pour',
      cancelSubscription: 'Annuler l\'abonnement',
      reactivateSubscription: 'Réactiver l\'abonnement',
      changePlan: 'Changer de plan',
      noSubscription: 'Aucun abonnement actif',
      noSubscriptionDesc: 'Souscrivez à un plan pour débloquer des fonctionnalités pour votre organisation',
      choosePlan: 'Choisir un plan',
      availablePlans: 'Plans disponibles',
      selectNewPlan: 'Sélectionnez un nouveau plan pour votre organisation',
      month: 'mois',
      year: 'an',
      unlimited: 'Illimité',
      statusActive: 'Actif',
      statusTrialing: 'Essai',
      statusPastDue: 'En retard',
      statusCanceled: 'Annulé',
      statusPendingPayment: 'Paiement en attente',
      confirmCancel: 'Êtes-vous sûr de vouloir annuler cet abonnement ? Il restera actif jusqu\'à la fin de la période de facturation actuelle.',
    }
  }
})

const subscription = ref<OrganizationSubscription | null>(null)
const availablePlans = ref<SubscriptionPlan[]>([])
const isLoading = ref(false)
const error = ref('')
const showChangePlanModal = ref(false)
const modalError = ref('')

onMounted(async () => {
  await Promise.all([
    loadSubscription(),
    loadAvailablePlans()
  ])
})

const loadSubscription = async () => {
  isLoading.value = true
  error.value = ''
  try {
    const response = await axios.get(`/organizations/${props.organizationId}/subscription`, {
      params: { includes: 'subscription_plan' }
    })
    subscription.value = response.data.data || response.data
  } catch (err: any) {
    if (err.response?.status === 404) {
      // No subscription found - this is okay
      subscription.value = null
    } else {
      error.value = err.response?.data?.error_message || err.message || 'Failed to load subscription'
    }
  } finally {
    isLoading.value = false
  }
}

const loadAvailablePlans = async () => {
  try {
    const response = await axios.get('/subscription-plans', {
      params: { is_active: true }
    })
    availablePlans.value = response.data.data || response.data
  } catch (err: any) {
    console.error('Failed to load available plans:', err)
  }
}

const confirmCancelSubscription = async () => {
  if (!confirm(t('subscription.confirmCancel'))) return

  try {
    await axios.post(`/organizations/${props.organizationId}/subscription/cancel`, {
      cancel_at_period_end: true
    })
    await loadSubscription()
  } catch (err: any) {
    error.value = err.response?.data?.error_message || err.message || 'Failed to cancel subscription'
  }
}

const reactivateSubscription = async () => {
  try {
    await axios.post(`/organizations/${props.organizationId}/subscription/reactivate`)
    await loadSubscription()
  } catch (err: any) {
    error.value = err.response?.data?.error_message || err.message || 'Failed to reactivate subscription'
  }
}

const selectPlan = async (plan: SubscriptionPlan) => {
  modalError.value = ''
  try {
    await axios.post(`/organizations/${props.organizationId}/subscription`, {
      subscription_plan_id: plan.id
    })
    showChangePlanModal.value = false
    await loadSubscription()
  } catch (err: any) {
    modalError.value = err.response?.data?.error_message || err.message || 'Failed to change plan'
  }
}

const showAvailablePlans = () => {
  showChangePlanModal.value = true
}

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    active: t('subscription.statusActive'),
    trialing: t('subscription.statusTrialing'),
    past_due: t('subscription.statusPastDue'),
    canceled: t('subscription.statusCanceled'),
    pending_payment: t('subscription.statusPendingPayment')
  }
  return labels[status] || status
}

const formatPrice = (amount?: number, currency?: string): string => {
  if (!amount) return '-'
  const price = amount / 100
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency || 'EUR'
  }).format(price)
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

const formatLimit = (value: number): string => {
  return value === -1 ? t('subscription.unlimited') : String(value)
}
</script>

<style scoped>
.subscription-manager {
  width: 100%;
}

.loading-state,
.error-state,
.no-subscription {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: var(--color-text-secondary);
}

.loading-state i {
  color: var(--color-primary);
  margin-bottom: 1rem;
}

.error-state {
  color: var(--color-danger);
}

.error-state i {
  margin-bottom: 1rem;
  font-size: 2rem;
}

.no-subscription i {
  color: var(--color-text-tertiary);
  margin-bottom: 1.5rem;
}

.no-subscription h3 {
  margin: 0 0 0.5rem 0;
  color: var(--color-text-primary);
}

.no-subscription p {
  margin: 0 0 1.5rem 0;
  max-width: 400px;
}

.subscription-card {
  background: var(--color-bg-secondary);
  border-radius: 12px;
  overflow: hidden;
}

.card-header {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
  color: white;
  padding: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.plan-info h3 {
  margin: 0 0 0.75rem 0;
  font-size: 1.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.status-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  background: var(--overlay-white-20);
}

.status-active {
  background: var(--color-success-light);
  color: var(--color-success);
}

.status-trialing {
  background: var(--color-info-light);
  color: var(--color-info);
}

.status-past_due,
.status-canceled {
  background: var(--color-danger-light);
  color: var(--color-danger);
}

.plan-price {
  text-align: right;
}

.price-amount {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1;
}

.price-period {
  font-size: 1rem;
  opacity: 0.9;
  margin-top: 0.5rem;
}

.card-body {
  padding: 2rem;
}

.info-grid {
  display: grid;
  gap: 1rem;
  margin-bottom: 2rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--color-bg-tertiary);
  border-radius: 8px;
}

.info-item.warning {
  background: var(--color-warning-light);
  color: var(--color-warning);
}

.info-label {
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-value {
  font-weight: 600;
}

.features-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.features-list {
  list-style: none;
  padding: 0;
  margin: 0 0 2rem 0;
}

.features-list li {
  padding: 0.75rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border);
}

.features-list li:last-child {
  border-bottom: none;
}

.features-list i {
  color: var(--color-success);
  font-size: 1.125rem;
}

.limits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.limit-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.25rem;
  background: var(--color-bg-tertiary);
  border-radius: 8px;
  text-align: center;
}

.limit-item i {
  font-size: 2rem;
  color: var(--color-primary);
  margin-bottom: 0.75rem;
}

.limit-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.5rem;
}

.limit-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.card-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-lg {
  padding: 1rem 2rem;
  font-size: 1.125rem;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-outline-primary {
  background: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
}

.btn-outline-primary:hover {
  background: var(--color-primary-light);
}

.btn-outline-danger {
  background: transparent;
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
}

.btn-outline-danger:hover {
  background: var(--color-danger-light);
}

.modal-description {
  margin: 0 0 1.5rem 0;
  color: var(--color-text-secondary);
}

.plans-list {
  display: grid;
  gap: 1rem;
}

.plan-option {
  padding: 1.5rem;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.plan-option:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.plan-option.active {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.plan-header h4 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.plan-price {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

.plan-period {
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--color-text-secondary);
}

.plan-description {
  margin: 0;
  color: var(--color-text-secondary);
}

.alert {
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
}

.alert-danger {
  background: var(--color-danger-light);
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
}
</style>
