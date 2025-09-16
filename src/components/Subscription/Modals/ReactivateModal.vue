<template>
  <div v-if="visible" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>
          <i class="fas fa-undo text-success"></i>
          {{ t('subscriptions.confirmReactivation') }}
        </h3>
        <button class="modal-close" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
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
        
        <div class="modal-actions">
          <button 
            class="btn btn-success" 
            @click="$emit('confirm')"
            :disabled="isConfirming"
          >
            <i :class="isConfirming ? 'fas fa-spinner fa-spin' : 'fas fa-undo'"></i>
            {{ t('subscriptions.confirmReactivate') }}
          </button>
          <button class="btn btn-secondary" @click="$emit('close')">
            {{ t('subscriptions.cancel') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSubscriptionPlansStore } from '../../../stores/subscriptionPlans'
import { useSubscriptionTranslations } from '../composables/useSubscriptionTranslations'

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
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #6c757d;
  padding: 5px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.modal-close:hover {
  background-color: #f8f9fa;
}

.modal-body {
  padding: 20px;
}

.subscription-summary {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  border-left: 4px solid #28a745;
}

.subscription-summary h4 {
  margin: 0 0 15px 0;
  color: #495057;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.label {
  font-weight: 600;
  color: #6c757d;
}

.value {
  color: #495057;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-success {
  background-color: #28a745;
  border-color: #28a745;
  color: #fff;
}

.btn-secondary {
  background-color: #6c757d;
  border-color: #6c757d;
  color: #fff;
}

.text-success {
  color: #28a745;
}
</style>