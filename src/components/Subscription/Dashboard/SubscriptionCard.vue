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
          <router-link to="/subscription-plans" class="btn btn-primary btn-lg">
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
          <h4>{{ planName }}</h4>
          <div class="plan-price" v-if="currentPlan?.price_amount || subscription?.plan_price">
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

        <!-- Prochaine facturation -->
        <div v-else-if="subscription?.current_period_end" class="billing-info">
          <div class="detail-row">
            <span class="label">
              <i class="fas fa-calendar-alt"></i>
              {{ t('subscriptionPlans.nextBilling') }}:
            </span>
            <span class="value">{{ formatDate(subscription.current_period_end) }}</span>
          </div>
        </div>

        <!-- Actions rapides -->
        <div class="subscription-actions">
          <button 
            class="btn btn-primary"
            @click="$emit('manage')"
            :disabled="isManaging"
          >
            <i :class="isManaging ? 'fas fa-spinner fa-spin' : 'fas fa-cog'"></i>
            {{ t('subscriptionPlans.manageSubscription') }}
          </button>
          
          <router-link to="/subscription-plans" class="btn btn-outline-primary">
            <i class="fas fa-exchange-alt"></i>
            {{ t('subscriptionPlans.changePlan') }}
          </router-link>

          <button 
            v-if="!isCanceled" 
            class="btn btn-outline-warning"
            @click="$emit('cancel')"
          >
            <i class="fas fa-times"></i>
            {{ t('subscriptionPlans.cancelSubscription') }}
          </button>

          <button 
            v-else 
            class="btn btn-success"
            @click="$emit('reactivate')"
            :disabled="isReactivating"
          >
            <i :class="isReactivating ? 'fas fa-spinner fa-spin' : 'fas fa-undo'"></i>
            {{ t('subscriptionPlans.reactivateSubscription') }}
          </button>
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
  isManaging?: boolean
  isReactivating?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isManaging: false,
  isReactivating: false
})

const emit = defineEmits<{
  manage: []
  cancel: []
  reactivate: []
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

// Get current plan details by matching the subscription plan ID
const currentPlan = computed(() => {
  if (!props.subscription) return null

  const planId = props.subscription.subscription_plans ||
                 props.subscription.subscription_plan_id ||
                 props.subscription.plan_id

  return subscriptionPlansStore.entities.find((plan: any) => plan.id === planId)
})

const planName = computed(() => {
  return currentPlan.value?.name ||
         props.subscription?.plan_name ||
         t('subscriptionPlans.current_subscription_plan')
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
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
}

.subscription-overview h3 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 20px 0;
  color: #495057;
  font-size: 1.25rem;
}

/* No subscription styles */
.no-subscription-card {
  text-align: center;
  padding: 40px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
}

.no-subscription-content i {
  margin-bottom: 20px;
  opacity: 0.9;
}

.no-subscription-content h4 {
  margin: 20px 0 10px 0;
}

/* Active subscription styles */
.subscription-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.subscription-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #e0e0e0;
}

.plan-info h4 {
  margin: 0 0 8px 0;
  color: #333;
}

.plan-price {
  font-size: 1.5rem;
  font-weight: bold;
  color: #28a745;
}

.billing-period {
  font-size: 0.9rem;
  color: #666;
  font-weight: normal;
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

.subscription-details {
  padding: 20px;
}

.trial-card,
.cancellation-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.trial-card {
  background-color: #e1f5fe;
  border-left: 4px solid #17a2b8;
}

.cancellation-card {
  background-color: #fff3cd;
  border-left: 4px solid #ffc107;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.detail-row .label {
  font-weight: 600;
  color: #495057;
  display: flex;
  align-items: center;
  gap: 5px;
}

.subscription-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 20px;
}

/* Plan features */
.plan-features {
  margin: 20px 0;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.plan-features h5 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 15px 0;
  color: #495057;
  font-size: 1rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.feature-item i {
  color: #6c757d;
  width: 16px;
  text-align: center;
}

.feature-item span {
  font-size: 14px;
  color: #495057;
}

/* Responsive */
@media (max-width: 768px) {
  .subscription-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .subscription-actions {
    flex-direction: column;
  }

  .subscription-actions .btn {
    width: 100%;
    justify-content: center;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }
}

/* Button styles */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.2s ease;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-lg {
  padding: 12px 24px;
  font-size: 16px;
}

.btn-primary {
  background-color: #007bff;
  border-color: #007bff;
  color: #fff;
}

.btn-success {
  background-color: #28a745;
  border-color: #28a745;
  color: #fff;
}

.btn-outline-primary {
  color: #007bff;
  border-color: #007bff;
  background-color: transparent;
}

.btn-outline-warning {
  color: #ffc107;
  border-color: #ffc107;
  background-color: transparent;
}

/* Text utilities */
.text-success { color: #28a745 !important; }
.text-info { color: #17a2b8 !important; }
.text-warning { color: #ffc107 !important; }
.text-danger { color: #dc3545 !important; }
.text-muted { color: #6c757d !important; }
</style>