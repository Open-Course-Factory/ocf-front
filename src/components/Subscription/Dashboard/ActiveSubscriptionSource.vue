<template>
  <div v-if="primarySubscription" class="active-subscription-source subscription-card">
    <div class="source-header">
      <div class="header-icon">
        <i class="fas fa-star"></i>
      </div>
      <div class="header-text">
        <h3>{{ t('subscriptions.activeSubscriptionTitle') }}</h3>
        <p>{{ t('subscriptions.activeSubscriptionSubtitle') }}</p>
      </div>
    </div>

    <div class="source-content">
      <div class="source-main">
        <div class="plan-info">
          <h4 class="plan-name">{{ getPlanName() }}</h4>
          <span :class="['type-badge', `type-${primarySubscription.subscription_type || 'personal'}`]">
            <i :class="primarySubscription.subscription_type === 'assigned' ? 'fas fa-users' : 'fas fa-user'"></i>
            {{ getTypeLabel() }}
          </span>
        </div>

        <div class="source-details">
          <div class="detail-item">
            <i class="fas fa-source"></i>
            <span class="detail-label">{{ t('subscriptions.source') }}:</span>
            <span class="detail-value">{{ getSourceText() }}</span>
          </div>

          <div v-if="primarySubscription.subscription_plan?.priority !== undefined" class="detail-item">
            <i class="fas fa-signal"></i>
            <span class="detail-label">{{ t('subscriptions.priority') }}:</span>
            <span class="detail-value">
              {{ primarySubscription.subscription_plan.priority }}
              <span v-if="totalSubscriptions > 1" class="priority-context">
                ({{ t('subscriptions.highestOfN', { n: totalSubscriptions }) }})
              </span>
            </span>
          </div>

          <div v-if="primarySubscription.subscription_type === 'assigned' && primarySubscription.batch_owner_name" class="detail-item">
            <i class="fas fa-user-circle"></i>
            <span class="detail-label">{{ t('subscriptions.providedBy') }}:</span>
            <span class="detail-value">{{ primarySubscription.batch_owner_name }}</span>
          </div>
        </div>
      </div>

      <!-- Feature highlights -->
      <div v-if="hasFeatures" class="feature-highlights">
        <h5>{{ t('subscriptions.keyFeatures') }}</h5>
        <div class="features-grid">
          <!-- Capacity (size-count language) -->
          <div
            v-if="budgetCapacityText"
            class="feature-item budget-capacity"
            :title="t('pricingPlanCard.capacityTooltip')"
          >
            <i class="fas fa-server"></i>
            <span>{{ budgetCapacityText }}</span>
          </div>
          <div v-if="primarySubscription.subscription_plan?.max_session_duration_minutes" class="feature-item">
            <i class="fas fa-clock"></i>
            <span>{{ formatDuration(primarySubscription.subscription_plan.max_session_duration_minutes) }}</span>
          </div>
          <div v-if="primarySubscription.subscription_plan?.data_persistence_gb" class="feature-item">
            <i class="fas fa-database"></i>
            <span>{{ primarySubscription.subscription_plan.data_persistence_gb }} GB {{ t('subscriptions.storage') }}</span>
          </div>
          <div v-if="primarySubscription.subscription_plan?.network_access_enabled" class="feature-item">
            <i class="fas fa-network-wired"></i>
            <span>{{ t('subscriptions.networkAccess') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Status notices: trial / cancellation pending -->
    <div v-if="isTrialing && trialEnd" class="status-notice trial-notice">
      <i class="fas fa-gift"></i>
      <p>
        <strong>{{ t('subscriptionPlans.trialActive') }}</strong>
        <span class="status-notice-detail">{{ t('subscriptionPlans.trialEndsOn') }} {{ formatDate(trialEnd) }}</span>
      </p>
    </div>

    <div v-else-if="isCanceled && currentPeriodEnd" class="status-notice cancellation-notice">
      <i class="fas fa-exclamation-triangle"></i>
      <p>
        <strong>{{ t('subscriptionPlans.subscriptionWillCancel') }}</strong>
        <span class="status-notice-detail">{{ t('subscriptionPlans.accessUntil') }} {{ formatDate(currentPeriodEnd) }}</span>
      </p>
    </div>

    <!-- Next billing date (not for assigned licenses, not while canceling) -->
    <div v-else-if="!isAssigned && currentPeriodEnd" class="status-notice billing-notice">
      <i class="fas fa-calendar-alt"></i>
      <p>
        <strong>{{ t('subscriptionPlans.nextBilling') }}</strong>
        <span class="status-notice-detail">{{ formatDate(currentPeriodEnd) }}</span>
      </p>
    </div>

    <!-- Multiple subscriptions notice -->
    <div v-if="totalSubscriptions > 1" class="multiple-subs-notice">
      <i class="fas fa-info-circle"></i>
      <p>{{ t('subscriptions.multipleSubscriptionsNotice', { n: totalSubscriptions }) }}</p>
    </div>

    <!-- Management actions -->
    <div class="subscription-actions-bar">
      <!-- Personal subscription: full management controls -->
      <template v-if="!isAssigned">
        <button
          v-if="isPersonalSubscription"
          class="action-btn action-btn-primary"
          @click="emit('manage')"
          :disabled="isManaging"
        >
          <i :class="isManaging ? 'fas fa-spinner fa-spin' : 'fas fa-cog'"></i>
          {{ t('subscriptionPlans.manageSubscription') }}
        </button>

        <router-link v-if="isPersonalSubscription" to="/subscription-plans" class="action-btn action-btn-outline">
          <i class="fas fa-exchange-alt"></i>
          {{ t('subscriptionPlans.changePlan') }}
        </router-link>

        <button
          v-if="isPersonalSubscription && !isCanceled"
          class="action-btn action-btn-warning"
          @click="emit('cancel')"
        >
          <i class="fas fa-times"></i>
          {{ t('subscriptionPlans.cancelSubscription') }}
        </button>

        <button
          v-if="isPersonalSubscription && isCanceled"
          class="action-btn action-btn-success"
          @click="emit('reactivate')"
          :disabled="isReactivating"
        >
          <i :class="isReactivating ? 'fas fa-spinner fa-spin' : 'fas fa-undo'"></i>
          {{ t('subscriptionPlans.reactivateSubscription') }}
        </button>
      </template>

      <!-- Assigned license: read-only, no payment actions -->
      <div v-else class="assigned-license-actions">
        <div class="assigned-info-message">
          <i class="fas fa-info-circle"></i>
          <p>{{ t('subscriptionPlans.bulkLicenseReadOnly') }}</p>
        </div>

        <div v-if="canStartPersonalSubscription" class="personal-subscription-option">
          <p class="option-description">{{ t('subscriptionPlans.canStartPersonalSubscription') }}</p>
          <router-link to="/subscription-plans" class="action-btn action-btn-outline">
            <i class="fas fa-plus-circle"></i>
            {{ t('subscriptionPlans.viewPlans') }}
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTranslations } from '../../../composables/useTranslations'
import { formatBudgetAsSizes, CANONICAL_SIZE_CATALOG } from '../../../utils/quotaFormatters'

interface Props {
  primarySubscription: any | null
  totalSubscriptions?: number
  allSubscriptions?: any[]
  isManaging?: boolean
  isReactivating?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  totalSubscriptions: 1,
  allSubscriptions: () => [],
  isManaging: false,
  isReactivating: false
})

const emit = defineEmits<{
  manage: []
  cancel: []
  reactivate: []
}>()

const { t } = useTranslations({
  en: {
    subscriptions: {
      activeSubscriptionTitle: 'Your Active Subscription',
      activeSubscriptionSubtitle: 'This subscription is currently providing your terminal features',
      source: 'Source',
      priority: 'Priority',
      highestOfN: 'highest of {n} subscriptions',
      providedBy: 'Provided by',
      keyFeatures: 'Key Features',
      storage: 'storage',
      networkAccess: 'Network access',
      sessionDuration: 'session duration',
      multipleSubscriptionsNotice: 'You have {n} active subscriptions. If this one expires, the next highest priority subscription will automatically become active.',
      subscriptionTypePersonal: 'Personal Subscription',
      subscriptionTypeAssigned: 'Assigned License',
      subscriptionTypeOrganization: 'Organization',
      sourcePersonal: 'Self-paid subscription',
      sourceAssigned: 'Assigned by organization',
      sourceOrganization: 'Organization subscription',
    },
    pricingPlanCard: {
      budgetCapacity: 'Includes up to {summary} simultaneous sessions',
      or: 'OR',
      capacityTooltip: 'Your plan\'s capacity, expressed as machine sizes you can spawn at once. Pick any combination that fits.',
      unlimitedCapacity: 'Unlimited capacity',
    },
    subscriptionPlans: {
      manageSubscription: 'Manage Subscription',
      changePlan: 'Change Plan',
      cancelSubscription: 'Cancel Subscription',
      reactivateSubscription: 'Reactivate Subscription',
      nextBilling: 'Next Billing',
      trialActive: 'Free Trial Active',
      trialEndsOn: 'Trial ends on',
      subscriptionWillCancel: 'Subscription will cancel',
      accessUntil: 'Access until',
      bulkLicenseReadOnly: 'This subscription was assigned to you and is managed by the license owner. You cannot modify or cancel it.',
      canStartPersonalSubscription: 'Want your own subscription? You can still purchase a personal plan or start a free trial.',
      viewPlans: 'View Plans',
    },
  },
  fr: {
    subscriptions: {
      activeSubscriptionTitle: 'Votre abonnement actif',
      activeSubscriptionSubtitle: 'Cet abonnement fournit actuellement vos fonctionnalités de terminal',
      source: 'Source',
      priority: 'Priorité',
      highestOfN: 'la plus élevée sur {n} abonnements',
      providedBy: 'Fourni par',
      keyFeatures: 'Fonctionnalités clés',
      storage: 'stockage',
      networkAccess: 'Accès réseau',
      sessionDuration: 'durée de session',
      multipleSubscriptionsNotice: 'Vous avez {n} abonnements actifs. Si celui-ci expire, le prochain abonnement de priorité la plus élevée deviendra automatiquement actif.',
      subscriptionTypePersonal: 'Abonnement personnel',
      subscriptionTypeAssigned: 'Licence attribuée',
      subscriptionTypeOrganization: 'Organisation',
      sourcePersonal: 'Abonnement auto-payé',
      sourceAssigned: 'Attribué par l\'organisation',
      sourceOrganization: 'Abonnement de l\'organisation',
    },
    pricingPlanCard: {
      budgetCapacity: 'Comprend jusqu\'à {summary} sessions simultanées',
      or: 'OU',
      capacityTooltip: 'La capacité de votre forfait, exprimée en tailles de machines que vous pouvez lancer simultanément. Choisissez la combinaison qui vous convient.',
      unlimitedCapacity: 'Capacité illimitée',
    },
    subscriptionPlans: {
      manageSubscription: 'Gérer l\'abonnement',
      changePlan: 'Changer de plan',
      cancelSubscription: 'Annuler l\'abonnement',
      reactivateSubscription: 'Réactiver l\'abonnement',
      nextBilling: 'Prochaine facturation',
      trialActive: 'Essai gratuit actif',
      trialEndsOn: 'L\'essai se termine le',
      subscriptionWillCancel: 'L\'abonnement sera annulé',
      accessUntil: 'Accès jusqu\'au',
      bulkLicenseReadOnly: 'Cet abonnement vous a été attribué et est géré par le propriétaire de la licence. Vous ne pouvez pas le modifier ou l\'annuler.',
      canStartPersonalSubscription: 'Vous voulez votre propre abonnement ? Vous pouvez toujours acheter un plan personnel ou commencer un essai gratuit.',
      viewPlans: 'Voir les plans',
    },
  }
})

const budgetCapacityText = computed(() => {
  const plan = props.primarySubscription?.subscription_plan
  if (!plan) return ''
  const maxCpu = plan.max_cpu ?? 0
  const maxMemoryMb = plan.max_memory_mb ?? 0
  if (maxCpu === 0 && maxMemoryMb === 0) {
    return t('pricingPlanCard.unlimitedCapacity')
  }
  const summary = formatBudgetAsSizes(plan, CANONICAL_SIZE_CATALOG, t('pricingPlanCard.or'))
  if (!summary) return ''
  return t('pricingPlanCard.budgetCapacity', { summary })
})

const hasFeatures = computed(() => {
  return !!(
    budgetCapacityText.value ||
    props.primarySubscription?.subscription_plan?.max_session_duration_minutes ||
    props.primarySubscription?.subscription_plan?.data_persistence_gb ||
    props.primarySubscription?.subscription_plan?.network_access_enabled
  )
})

function getPlanName(): string {
  return props.primarySubscription?.subscription_plan?.name ||
         props.primarySubscription?.plan_name ||
         'Unknown Plan'
}

function getTypeLabel(): string {
  const type = props.primarySubscription?.subscription_type || 'personal'
  return t(`subscriptions.subscriptionType${type.charAt(0).toUpperCase() + type.slice(1)}`)
}

function getSourceText(): string {
  const type = props.primarySubscription?.subscription_type || 'personal'
  return t(`subscriptions.source${type.charAt(0).toUpperCase() + type.slice(1)}`)
}

function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${t('subscriptions.sessionDuration')}`
  }
  return `${minutes}min ${t('subscriptions.sessionDuration')}`
}

// --- Subscription state (drives status notices + action gating) ---

const isTrialing = computed(() => props.primarySubscription?.status === 'trialing')
const isCanceled = computed(() => props.primarySubscription?.cancel_at_period_end === true)

// Assigned (bulk-license) users don't pay, so they must never see
// Manage / Cancel / Reactivate. Mirror SubscriptionCard's detection.
const isAssigned = computed(() => {
  const sub = props.primarySubscription
  return sub?.subscription_type === 'assigned' || !!sub?.subscription_batch_id
})

const isPersonalSubscription = computed(() => {
  const type = props.primarySubscription?.subscription_type
  return type === 'personal' || !type
})

// Assigned users may start their own plan only if they never bought one.
const canStartPersonalSubscription = computed(() => {
  if (!props.allSubscriptions || props.allSubscriptions.length === 0) return true
  return !props.allSubscriptions.some(sub => sub.subscription_type === 'personal')
})

const trialEnd = computed(() => props.primarySubscription?.trial_end ?? null)
const currentPeriodEnd = computed(() => props.primarySubscription?.current_period_end ?? null)

function formatDate(dateString: string | null): string {
  if (!dateString) return '-'
  try {
    return new Date(dateString).toLocaleDateString('fr-FR')
  } catch {
    return dateString
  }
}
</script>

<style scoped>
.active-subscription-source {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
  border-radius: 16px;
  padding: 0;
  box-shadow: var(--shadow-lg);
  color: var(--color-white);
  overflow: hidden;
}

/*
 * This hero sits on a fixed blue gradient that does not change with the theme,
 * so the white text and translucent white overlays below are intentional in
 * both light and dark mode — they must stay legible against the blue, not the
 * page background. They are kept as rgba(255,255,255,*) on purpose.
 */

.source-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 24px 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
}

.header-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  flex-shrink: 0;
}

.header-text h3 {
  margin: 0 0 4px 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-white);
}

.header-text p {
  margin: 0;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.85);
}

.source-content {
  padding: 24px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
}

.source-main {
  margin-bottom: 24px;
}

.plan-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.plan-name {
  margin: 0;
  font-size: 1.375rem;
  font-weight: 600;
  color: var(--color-white);
}

.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: rgba(255, 255, 255, 0.2);
  color: var(--color-white);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.type-badge i {
  font-size: 0.75rem;
}

.source-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9375rem;
}

.detail-item i {
  width: 20px;
  color: rgba(255, 255, 255, 0.7);
}

.detail-label {
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  min-width: 80px;
}

.detail-value {
  font-weight: 600;
  color: var(--color-white);
}

.priority-context {
  font-weight: 400;
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.875rem;
}

.feature-highlights {
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
}

.feature-highlights h5 {
  margin: 0 0 16px 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-white);
  backdrop-filter: blur(5px);
}

.feature-item i {
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.8);
}

.multiple-subs-notice {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.1);
  border-top: 1px solid rgba(255, 255, 255, 0.15);
}

.multiple-subs-notice i {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 2px;
  flex-shrink: 0;
}

.multiple-subs-notice p {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.9);
}

/*
 * Status notices and action buttons live on the same fixed blue gradient as
 * the rest of the hero, so they use translucent-white surfaces and white text
 * on purpose (see the note at the top of this stylesheet).
 */
.status-notice {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.1);
  border-top: 1px solid rgba(255, 255, 255, 0.15);
}

.status-notice i {
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.9);
  flex-shrink: 0;
}

.status-notice p {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.875rem;
  line-height: 1.4;
  color: var(--color-white);
}

.status-notice-detail {
  font-weight: 400;
  color: rgba(255, 255, 255, 0.85);
}

.cancellation-notice {
  background: rgba(255, 193, 7, 0.18);
}

.subscription-actions-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.08);
  border-top: 1px solid rgba(255, 255, 255, 0.15);
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  text-decoration: none;
  transition: background 0.15s ease, opacity 0.15s ease;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-btn-primary {
  background: var(--color-white);
  color: var(--color-primary);
}

.action-btn-primary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.9);
}

.action-btn-outline {
  background: rgba(255, 255, 255, 0.12);
  color: var(--color-white);
  border-color: rgba(255, 255, 255, 0.4);
}

.action-btn-outline:hover {
  background: rgba(255, 255, 255, 0.22);
}

.action-btn-warning {
  background: rgba(255, 255, 255, 0.12);
  color: var(--color-white);
  border-color: rgba(255, 193, 7, 0.7);
}

.action-btn-warning:hover {
  background: rgba(255, 193, 7, 0.2);
}

.action-btn-success {
  background: var(--color-success);
  color: var(--color-white);
}

.action-btn-success:hover:not(:disabled) {
  filter: brightness(1.05);
}

.assigned-license-actions {
  flex: 1;
}

.assigned-info-message {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.assigned-info-message i {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 2px;
  flex-shrink: 0;
}

.assigned-info-message p {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.9);
}

.personal-subscription-option {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
}

.option-description {
  margin: 0 0 12px 0;
  font-size: 0.9375rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.9);
}

/* Responsive */
@media (max-width: 768px) {
  .source-header {
    padding: 20px;
  }

  .header-icon {
    width: 48px;
    height: 48px;
    font-size: 1.5rem;
  }

  .header-text h3 {
    font-size: 1.25rem;
  }

  .source-content {
    padding: 20px;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .detail-item {
    flex-wrap: wrap;
  }

  .detail-label {
    min-width: unset;
  }

  .subscription-actions-bar {
    flex-direction: column;
  }

  .action-btn {
    justify-content: center;
  }
}
</style>
