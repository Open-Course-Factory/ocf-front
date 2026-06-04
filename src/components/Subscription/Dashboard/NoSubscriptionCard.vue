<template>
  <div class="subscription-overview">
    <h3>
      <i class="fas fa-credit-card"></i>
      {{ t('subscriptionPlans.current_subscription_plan') }}
    </h3>

    <div class="no-subscription-card">
      <div class="no-subscription-content">
        <i class="fas fa-plus-circle fa-3x"></i>
        <h4>{{ t('subscriptionPlans.no_active_subscription') }}</h4>
        <p>{{ t('subscriptionPlans.subscribe_to_start') }}</p>

        <div class="subscription-actions">
          <button
            class="btn btn-success btn-lg"
            @click="emit('activateFreePlan')"
            :disabled="isActivatingFreePlan"
          >
            <i :class="isActivatingFreePlan ? 'fas fa-spinner fa-spin' : 'fas fa-gift'"></i>
            {{ isActivatingFreePlan ? t('subscriptionPlans.activating') : t('subscriptionPlans.startFreeTrial') }}
          </button>

          <router-link to="/subscription-plans" class="btn btn-outline-primary btn-lg">
            <i class="fas fa-rocket"></i>
            {{ t('subscriptionPlans.view_plans') }}
          </router-link>

          <button
            v-if="lastCanceledSubscription"
            class="btn btn-outline-primary"
            @click="emit('reactivate')"
          >
            <i class="fas fa-undo"></i>
            {{ t('subscriptionPlans.reactivate_subscription') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSubscriptionTranslations } from '../composables/useSubscriptionTranslations'

const { t } = useSubscriptionTranslations()

interface Props {
  lastCanceledSubscription?: any | null
  isActivatingFreePlan?: boolean
}

withDefaults(defineProps<Props>(), {
  lastCanceledSubscription: null,
  isActivatingFreePlan: false
})

const emit = defineEmits<{
  activateFreePlan: []
  reactivate: []
}>()
</script>

<style scoped>
.subscription-overview {
  background: var(--color-bg-primary);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-gray-200);
}

.subscription-overview h3 {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-gray-700);
  font-size: var(--font-size-xl);
}

.no-subscription-card {
  text-align: center;
  padding: var(--spacing-2xl) var(--spacing-md);
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
  color: var(--color-white);
  border-radius: var(--border-radius-xl);
}

.no-subscription-content i {
  margin-bottom: var(--spacing-lg);
  opacity: 0.9;
}

.no-subscription-content h4 {
  margin: var(--spacing-lg) 0 var(--spacing-sm) 0;
}

.subscription-actions {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  justify-content: center;
  margin-top: var(--spacing-lg);
}

@media (max-width: 768px) {
  .subscription-actions {
    flex-direction: column;
  }
}
</style>
