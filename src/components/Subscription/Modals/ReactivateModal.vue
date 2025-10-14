<template>
  <BaseModal
    :visible="visible"
    :title="t('subscriptions.confirmReactivation')"
    title-icon="fas fa-undo text-success"
    size="medium"
    :show-default-footer="true"
    :confirm-text="t('subscriptions.confirmReactivate')"
    confirm-icon="fas fa-undo"
    :confirm-disabled="isConfirming"
    :cancel-text="t('subscriptions.cancel')"
    @close="$emit('close')"
    @confirm="$emit('confirm')"
  >
    <p>{{ t('subscriptions.reactivationInfo') }}</p>

    <div v-if="subscription" class="subscription-summary">
      <h4>{{ t('subscriptions.subscriptionDetails') }}</h4>
      <div class="detail-row">
        <span class="label">{{ t('subscriptions.plan') }}:</span>
        <span class="value">{{ subscription.plan_name }}</span>
      </div>
      <div class="detail-row" v-if="subscription.plan_price">
        <span class="label">{{ t('subscriptions.price') }}:</span>
        <span class="value">
          {{ formatPrice(subscription.plan_price, subscription.currency) }}
          / {{ subscription.billing_interval }}
        </span>
      </div>
      <div class="detail-row" v-if="subscription.current_period_end">
        <span class="label">{{ t('subscriptions.nextBilling') }}:</span>
        <span class="value">{{ formatDate(subscription.current_period_end) }}</span>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSubscriptionPlansStore } from '../../../stores/subscriptionPlans'
import { useSubscriptionTranslations } from '../composables/useSubscriptionTranslations'
import BaseModal from '../../Modals/BaseModal.vue'

const { t } = useSubscriptionTranslations()

interface Props {
  visible: boolean
  subscription?: any | null
  isConfirming?: boolean
}

withDefaults(defineProps<Props>(), {
  subscription: null,
  isConfirming: false
})

const emit = defineEmits<{
  close: []
  confirm: []
}>()

const subscriptionPlansStore = useSubscriptionPlansStore()

const formatPrice = computed(() => subscriptionPlansStore.formatPrice)

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
.subscription-summary {
  background-color: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
  margin: var(--spacing-lg) 0;
  border-left: 4px solid var(--color-success);
}

.subscription-summary h4 {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-text-secondary);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.detail-row:last-child {
  margin-bottom: 0;
}

.label {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);
}

.value {
  color: var(--color-text-secondary);
}

.text-success {
  color: var(--color-success);
}
</style>