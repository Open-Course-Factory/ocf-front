<template>
  <BaseModal
    :visible="visible"
    :title="t('adminAssign.title')"
    title-icon="fas fa-user-plus"
    size="medium"
    @close="$emit('close')"
  >
    <div class="assign-form">
      <div class="form-group">
        <label for="assign-user-id">{{ t('adminAssign.userId') }} <span class="required-mark">*</span></label>
        <input
          id="assign-user-id"
          v-model="userId"
          type="text"
          class="form-control"
          :placeholder="t('adminAssign.userIdPlaceholder')"
        />
      </div>

      <div class="form-group">
        <label for="assign-plan">{{ t('adminAssign.plan') }}</label>
        <select id="assign-plan" v-model="selectedPlanId" class="form-control">
          <option v-for="plan in activePlans" :key="plan.id" :value="plan.id">
            {{ plan.name }} - {{ plansStore.formatPrice(plan.price_amount, plan.currency) }}/{{ plan.billing_interval }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="assign-duration">{{ t('adminAssign.durationDays') }}</label>
        <input
          id="assign-duration"
          v-model.number="durationDays"
          type="number"
          class="form-control"
          min="1"
        />
        <div class="preset-buttons">
          <button class="btn-preset" :class="{ active: durationDays === 30 }" @click="durationDays = 30">30 {{ t('adminAssign.days') }}</button>
          <button class="btn-preset" :class="{ active: durationDays === 90 }" @click="durationDays = 90">90 {{ t('adminAssign.days') }}</button>
          <button class="btn-preset" :class="{ active: durationDays === 365 }" @click="durationDays = 365">365 {{ t('adminAssign.days') }}</button>
        </div>
      </div>

      <div v-if="errorMsg" class="alert alert-danger">
        <i class="fas fa-exclamation-triangle"></i>
        {{ errorMsg }}
      </div>

      <div v-if="successMsg" class="alert alert-success">
        <i class="fas fa-check-circle"></i>
        {{ successMsg }}
      </div>
    </div>

    <template #footer>
      <button class="btn btn-secondary" @click="$emit('close')">
        <i class="fas fa-ban"></i>
        {{ t('adminAssign.cancel') }}
      </button>
      <button class="btn btn-primary" @click="handleAssign" :disabled="isAssigning || !userId || !selectedPlanId">
        <i :class="isAssigning ? 'fas fa-spinner fa-spin' : 'fas fa-check'"></i>
        {{ t('adminAssign.confirm') }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { useSubscriptionPlansStore } from '../../stores/subscriptionPlans'
import { useSubscriptionsStore } from '../../stores/subscriptions'
import BaseModal from './BaseModal.vue'

const { t } = useTranslations({
  en: {
    adminAssign: {
      title: 'Assign Plan to User',
      userId: 'User ID',
      userIdPlaceholder: 'Enter user ID...',
      plan: 'Plan',
      durationDays: 'Duration (days)',
      days: 'days',
      cancel: 'Cancel',
      confirm: 'Assign Plan',
      success: 'Plan assigned successfully',
      error: 'Failed to assign plan'
    }
  },
  fr: {
    adminAssign: {
      title: 'Attribuer un Plan a un Utilisateur',
      userId: 'ID Utilisateur',
      userIdPlaceholder: "Entrez l'ID utilisateur...",
      plan: 'Plan',
      durationDays: 'Duree (jours)',
      days: 'jours',
      cancel: 'Annuler',
      confirm: 'Attribuer le Plan',
      success: 'Plan attribue avec succes',
      error: "Echec de l'attribution du plan"
    }
  }
})

const props = defineProps<{
  visible: boolean
  planId: string | null
}>()

const emit = defineEmits<{
  close: []
}>()

const plansStore = useSubscriptionPlansStore()
const subscriptionsStore = useSubscriptionsStore()

const userId = ref('')
const selectedPlanId = ref('')
const durationDays = ref(365)
const isAssigning = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const activePlans = computed(() => {
  return plansStore.entities.filter((p: any) => p.is_active)
})

async function handleAssign() {
  if (!userId.value || !selectedPlanId.value) return

  isAssigning.value = true
  errorMsg.value = ''
  successMsg.value = ''

  try {
    await subscriptionsStore.adminAssignPlan(userId.value, selectedPlanId.value, durationDays.value)
    successMsg.value = t('adminAssign.success')
    setTimeout(() => {
      emit('close')
    }, 1500)
  } catch (err: any) {
    errorMsg.value = err.response?.data?.error_message || err.message || t('adminAssign.error')
  } finally {
    isAssigning.value = false
  }
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    errorMsg.value = ''
    successMsg.value = ''
    userId.value = ''
    durationDays.value = 365
    if (props.planId) {
      selectedPlanId.value = props.planId
    } else if (activePlans.value.length > 0) {
      selectedPlanId.value = activePlans.value[0].id
    }
    plansStore.ensurePlansLoaded()
  }
})
</script>

<style scoped>
.assign-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.form-group label {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.required-mark {
  color: var(--color-danger);
  margin-left: var(--spacing-xs);
}

.preset-buttons {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}

.btn-preset {
  padding: var(--spacing-xs) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);
}

.btn-preset:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.btn-preset.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.alert {
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  font-size: var(--font-size-base);
}

.alert-success {
  background-color: var(--color-success-bg);
  color: var(--color-success-text);
  border: 1px solid var(--color-success-border);
}

.alert-danger {
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
  border: 1px solid var(--color-danger-border);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--btn-padding-md);
  font-size: var(--font-size-base);
  font-weight: 500;
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: var(--border-radius-md);
  transition: all var(--transition-fast);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-dark, var(--color-primary-hover));
}

.btn-secondary {
  background-color: var(--color-secondary, var(--color-gray-600));
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-secondary-dark, var(--color-secondary-hover));
}
</style>
