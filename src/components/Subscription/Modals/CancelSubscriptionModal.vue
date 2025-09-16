<template>
  <div v-if="visible" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>
          <i class="fas fa-exclamation-triangle text-warning"></i>
          {{ t('subscriptions.confirmCancellation') }}
        </h3>
        <button class="modal-close" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <p>{{ t('subscriptions.cancellationWarning') }}</p>
        
        <div class="cancellation-options">
          <label class="radio-option">
            <input type="radio" v-model="cancelImmediately" :value="false" />
            <span>{{ t('subscriptions.cancelAtPeriodEnd') }}</span>
            <small class="text-muted">{{ t('subscriptions.cancelAtPeriodEndDesc') }}</small>
          </label>
          <label class="radio-option">
            <input type="radio" v-model="cancelImmediately" :value="true" />
            <span>{{ t('subscriptions.cancelImmediately') }}</span>
            <small class="text-muted">{{ t('subscriptions.cancelImmediatelyDesc') }}</small>
          </label>
        </div>
        
        <div class="modal-actions">
          <button 
            class="btn btn-danger" 
            @click="handleConfirm"
            :disabled="isConfirming"
          >
            <i :class="isConfirming ? 'fas fa-spinner fa-spin' : 'fas fa-times'"></i>
            {{ t('subscriptions.confirmCancel') }}
          </button>
          <button class="btn btn-secondary" @click="$emit('close')">
            {{ t('subscriptions.keepSubscription') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSubscriptionTranslations } from '../composables/useSubscriptionTranslations'

const { t } = useSubscriptionTranslations()

interface Props {
  visible: boolean
  isConfirming?: boolean
}

withDefaults(defineProps<Props>(), {
  isConfirming: false
})

const emit = defineEmits<{
  close: []
  confirm: [cancelImmediately: boolean]
}>()

const cancelImmediately = ref(false)

function handleConfirm() {
  emit('confirm', cancelImmediately.value)
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

.cancellation-options {
  margin: 20px 0;
}

.radio-option {
  display: block;
  margin-bottom: 15px;
  cursor: pointer;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.radio-option:hover {
  background-color: #f8f9fa;
}

.radio-option input {
  margin-right: 10px;
}

.radio-option small {
  display: block;
  margin-left: 25px;
  margin-top: 5px;
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

.btn-danger {
  background-color: #dc3545;
  border-color: #dc3545;
  color: #fff;
}

.btn-secondary {
  background-color: #6c757d;
  border-color: #6c757d;
  color: #fff;
}

.text-warning {
  color: #ffc107;
}

.text-muted {
  color: #6c757d;
}
</style>