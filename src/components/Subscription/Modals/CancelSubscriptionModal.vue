<template>
  <BaseModal
    :visible="visible"
    :title="t('subscriptions.confirmCancellation')"
    title-icon="fas fa-exclamation-triangle text-warning"
    size="medium"
    @close="$emit('close')"
  >
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

    <template #footer>
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
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSubscriptionTranslations } from '../composables/useSubscriptionTranslations'
import BaseModal from '../../Modals/BaseModal.vue'

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
.cancellation-options {
  margin: var(--spacing-lg) 0;
}

.radio-option {
  display: block;
  margin-bottom: var(--spacing-md);
  cursor: pointer;
  padding: var(--spacing-md);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  transition: background-color var(--transition-base);
}

.radio-option:hover {
  background-color: var(--color-bg-tertiary);
}

.radio-option input {
  margin-right: var(--spacing-sm);
}

.radio-option small {
  display: block;
  margin-left: 25px;
  margin-top: var(--spacing-xs);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--btn-padding-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  border: var(--border-width-thin) solid transparent;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-danger {
  background-color: var(--color-danger);
  border-color: var(--color-danger);
  color: var(--color-white);
}

.btn-secondary {
  background-color: var(--color-secondary);
  border-color: var(--color-secondary);
  color: var(--color-white);
}

.text-warning {
  color: var(--color-warning);
}

.text-muted {
  color: var(--color-text-muted);
}
</style>
