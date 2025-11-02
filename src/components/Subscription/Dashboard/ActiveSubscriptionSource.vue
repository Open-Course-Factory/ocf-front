<template>
  <div v-if="primarySubscription" class="active-subscription-source">
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
          <div v-if="primarySubscription.subscription_plan?.max_concurrent_terminals" class="feature-item">
            <i class="fas fa-terminal"></i>
            <span>{{ primarySubscription.subscription_plan.max_concurrent_terminals }} {{ t('subscriptions.terminals') }}</span>
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

    <!-- Multiple subscriptions notice -->
    <div v-if="totalSubscriptions > 1" class="multiple-subs-notice">
      <i class="fas fa-info-circle"></i>
      <p>
        {{ t('subscriptions.multipleSubscriptionsNotice', { n: totalSubscriptions }) }}
        <router-link to="#all-subscriptions" class="view-all-link">
          {{ t('subscriptions.viewAll') }}
        </router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTranslations } from '../../../composables/useTranslations'

interface Props {
  primarySubscription: any | null
  totalSubscriptions?: number
}

const props = withDefaults(defineProps<Props>(), {
  totalSubscriptions: 1
})

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
      terminals: 'concurrent terminals',
      storage: 'storage',
      networkAccess: 'Network access',
      sessionDuration: 'session duration',
      multipleSubscriptionsNotice: 'You have {n} active subscriptions. If this one expires, the next highest priority subscription will automatically become active.',
      viewAll: 'View all subscriptions',
      subscriptionTypePersonal: 'Personal Subscription',
      subscriptionTypeAssigned: 'Assigned License',
      sourcePersonal: 'Self-paid subscription',
      sourceAssigned: 'Assigned by organization',
    }
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
      terminals: 'terminaux simultanés',
      storage: 'stockage',
      networkAccess: 'Accès réseau',
      sessionDuration: 'durée de session',
      multipleSubscriptionsNotice: 'Vous avez {n} abonnements actifs. Si celui-ci expire, le prochain abonnement de priorité la plus élevée deviendra automatiquement actif.',
      viewAll: 'Voir tous les abonnements',
      subscriptionTypePersonal: 'Abonnement personnel',
      subscriptionTypeAssigned: 'Licence attribuée',
      sourcePersonal: 'Abonnement auto-payé',
      sourceAssigned: 'Attribué par l\'organisation',
    }
  }
})

const hasFeatures = computed(() => {
  return !!(
    props.primarySubscription?.subscription_plan?.max_concurrent_terminals ||
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
</script>

<style scoped>
.active-subscription-source {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
  border-radius: 16px;
  padding: 0;
  box-shadow: 0 8px 24px rgba(13, 110, 253, 0.25);
  color: var(--color-white);
  overflow: hidden;
}

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

.view-all-link {
  color: var(--color-white);
  font-weight: 600;
  text-decoration: underline;
  margin-left: 6px;
}

.view-all-link:hover {
  color: rgba(255, 255, 255, 0.85);
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
}
</style>
