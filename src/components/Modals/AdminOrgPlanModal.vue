<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <BaseModal
    :visible="visible"
    :title="organizationName"
    title-icon="fas fa-credit-card"
    size="medium"
    :is-loading="saving"
    @close="$emit('close')"
  >
    <div class="admin-org-plan-content">
      <!-- Current Subscription Info -->
      <div v-if="currentSubscription" class="current-subscription">
        <h3 class="section-title">{{ t('adminOrgPlan.currentPlan') }}</h3>
        <div class="subscription-card">
          <div class="subscription-header">
            <span class="plan-name">{{ currentPlanName }}</span>
            <span :class="['status-badge', `status-${currentSubscription.status}`]">
              {{ statusLabel(currentSubscription.status) }}
            </span>
          </div>
          <div v-if="currentSubscription.current_period_end" class="subscription-detail">
            <i class="fas fa-calendar-alt"></i>
            <span>{{ t('adminOrgPlan.periodEnd') }}: {{ formatDate(currentSubscription.current_period_end) }}</span>
          </div>
          <div v-if="currentSubscription.cancel_at_period_end" class="subscription-warning">
            <i class="fas fa-exclamation-triangle"></i>
            <span>{{ t('adminOrgPlan.willCancelAtPeriodEnd') }}</span>
          </div>
        </div>

        <!-- Cancel Subscription Button -->
        <div class="cancel-section">
          <button
            class="btn btn-danger-outline"
            :disabled="saving || currentSubscription.status === 'canceled'"
            @click="showCancelConfirm = true"
          >
            <i class="fas fa-ban"></i>
            {{ t('adminOrgPlan.cancelSubscription') }}
          </button>
        </div>

        <!-- Cancel Confirmation -->
        <div v-if="showCancelConfirm" class="confirm-cancel">
          <p class="confirm-text">{{ t('adminOrgPlan.cancelConfirmText') }}</p>
          <div class="confirm-actions">
            <button class="btn btn-danger" :disabled="saving" @click="handleCancel">
              <i :class="saving ? 'fas fa-spinner fa-spin' : 'fas fa-check'"></i>
              {{ t('adminOrgPlan.confirmCancel') }}
            </button>
            <button class="btn btn-secondary" :disabled="saving" @click="showCancelConfirm = false">
              {{ t('adminOrgPlan.keepSubscription') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Divider when both sections are shown -->
      <div v-if="currentSubscription" class="section-divider">
        <span>{{ t('adminOrgPlan.changePlan') }}</span>
      </div>

      <!-- Plan Selection -->
      <div class="form-group">
        <label for="plan-select">
          {{ t('adminOrgPlan.selectPlan') }}
        </label>
        <select
          id="plan-select"
          v-model="selectedPlanId"
          class="form-control"
        >
          <option value="">{{ t('adminOrgPlan.choosePlan') }}</option>
          <option
            v-for="plan in activePlans"
            :key="plan.id"
            :value="plan.id"
          >
            {{ plan.name }} - {{ plansStore.formatPrice(plan.price_amount, plan.currency) }}/{{ plan.billing_interval }}
          </option>
        </select>
      </div>

      <!-- Quantity Input -->
      <div class="form-group">
        <label for="quantity-input">
          {{ t('adminOrgPlan.quantity') }}
        </label>
        <input
          id="quantity-input"
          v-model.number="quantity"
          type="number"
          class="form-control"
          min="1"
          :placeholder="t('adminOrgPlan.quantityPlaceholder')"
        />
      </div>

      <!-- Error message -->
      <div v-if="error" class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        {{ error }}
      </div>

      <!-- Success message -->
      <div v-if="successMsg" class="success-message">
        <i class="fas fa-check-circle"></i>
        {{ successMsg }}
      </div>
    </div>

    <template #footer>
      <button class="btn btn-secondary" @click="$emit('close')">
        <i class="fas fa-times"></i>
        {{ t('adminOrgPlan.cancel') }}
      </button>
      <button
        class="btn btn-primary"
        :disabled="saving || !selectedPlanId"
        @click="handleAssign"
      >
        <i :class="saving ? 'fas fa-spinner fa-spin' : 'fas fa-check'"></i>
        {{ currentSubscription ? t('adminOrgPlan.changePlanConfirm') : t('adminOrgPlan.assignPlan') }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import BaseModal from './BaseModal.vue'
import { useOrganizationSubscriptionsStore } from '../../stores/organizationSubscriptions'
import { useSubscriptionPlansStore } from '../../stores/subscriptionPlans'
import type { SubscriptionPlan, OrganizationSubscription } from '../../types'

const props = defineProps<{
  visible: boolean
  organizationId: string
  organizationName: string
  currentPlanId?: string
  currentSubscription?: OrganizationSubscription | null
}>()

const emit = defineEmits<{
  close: []
  assigned: []
}>()

const { t } = useTranslations({
  en: {
    adminOrgPlan: {
      title: 'Plan Assignment',
      currentPlan: 'Current Plan',
      selectPlan: 'Subscription Plan',
      choosePlan: '-- Select a plan --',
      quantity: 'Quantity (seats)',
      quantityPlaceholder: '1',
      changePlan: 'Change Plan',
      changePlanConfirm: 'Change Plan',
      assignPlan: 'Assign Plan',
      cancel: 'Cancel',
      cancelSubscription: 'Cancel Subscription',
      cancelConfirmText: 'Are you sure you want to cancel this subscription? The organization will lose access at the end of the current billing period.',
      confirmCancel: 'Yes, Cancel',
      keepSubscription: 'Keep Subscription',
      willCancelAtPeriodEnd: 'Subscription will be canceled at the end of the current period',
      periodEnd: 'Period ends',
      assignSuccess: 'Plan assigned successfully',
      changeSuccess: 'Plan changed successfully',
      cancelSuccess: 'Subscription canceled successfully',
      assignError: 'Failed to assign plan',
      cancelError: 'Failed to cancel subscription',
      statusActive: 'Active',
      statusTrialing: 'Trial',
      statusCanceled: 'Canceled',
      statusPastDue: 'Past Due',
      statusPendingPayment: 'Pending'
    }
  },
  fr: {
    adminOrgPlan: {
      title: 'Attribution du plan',
      currentPlan: 'Plan actuel',
      selectPlan: 'Plan d\'abonnement',
      choosePlan: '-- Sélectionnez un plan --',
      quantity: 'Quantité (sièges)',
      quantityPlaceholder: '1',
      changePlan: 'Changer de plan',
      changePlanConfirm: 'Changer de plan',
      assignPlan: 'Attribuer le plan',
      cancel: 'Annuler',
      cancelSubscription: 'Annuler l\'abonnement',
      cancelConfirmText: 'Êtes-vous sûr de vouloir annuler cet abonnement ? L\'organisation perdra l\'accès à la fin de la période de facturation en cours.',
      confirmCancel: 'Oui, annuler',
      keepSubscription: 'Garder l\'abonnement',
      willCancelAtPeriodEnd: 'L\'abonnement sera annulé à la fin de la période en cours',
      periodEnd: 'Fin de période',
      assignSuccess: 'Plan attribué avec succès',
      changeSuccess: 'Plan modifié avec succès',
      cancelSuccess: 'Abonnement annulé avec succès',
      assignError: 'Échec de l\'attribution du plan',
      cancelError: 'Échec de l\'annulation de l\'abonnement',
      statusActive: 'Actif',
      statusTrialing: 'Essai',
      statusCanceled: 'Annulé',
      statusPastDue: 'En retard',
      statusPendingPayment: 'En attente'
    }
  }
})

const orgSubStore = useOrganizationSubscriptionsStore()
const plansStore = useSubscriptionPlansStore()

const selectedPlanId = ref('')
const quantity = ref(1)
const saving = ref(false)
const error = ref('')
const successMsg = ref('')
const showCancelConfirm = ref(false)
let autoCloseTimer: ReturnType<typeof setTimeout> | null = null

const activePlans = computed(() =>
  (plansStore.entities as SubscriptionPlan[]).filter((p: SubscriptionPlan) => p.is_active)
)

const currentPlanName = computed(() => {
  if (!props.currentSubscription) return ''
  if (props.currentSubscription.subscription_plan?.name) {
    return props.currentSubscription.subscription_plan.name
  }
  const plan = activePlans.value.find(p => p.id === props.currentSubscription?.subscription_plan_id)
  return plan?.name || props.currentSubscription.subscription_plan_id
})

const statusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    active: t('adminOrgPlan.statusActive'),
    trialing: t('adminOrgPlan.statusTrialing'),
    canceled: t('adminOrgPlan.statusCanceled'),
    past_due: t('adminOrgPlan.statusPastDue'),
    pending_payment: t('adminOrgPlan.statusPendingPayment')
  }
  return statusMap[status] || status
}

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString()
  } catch {
    return dateStr
  }
}

onMounted(async () => {
  await plansStore.ensurePlansLoaded()
})

const handleAssign = async () => {
  if (!selectedPlanId.value) return

  saving.value = true
  error.value = ''
  successMsg.value = ''

  try {
    await orgSubStore.subscribeOrganization(props.organizationId, {
      subscription_plan_id: selectedPlanId.value,
      quantity: quantity.value > 0 ? quantity.value : undefined
    })
    successMsg.value = props.currentSubscription
      ? t('adminOrgPlan.changeSuccess')
      : t('adminOrgPlan.assignSuccess')
    emit('assigned')
    autoCloseTimer = setTimeout(() => {
      emit('close')
    }, 1500)
  } catch (err: any) {
    error.value = err.response?.data?.error_message ||
                  err.response?.data?.message ||
                  orgSubStore.error ||
                  t('adminOrgPlan.assignError')
  } finally {
    saving.value = false
  }
}

const handleCancel = async () => {
  saving.value = true
  error.value = ''
  successMsg.value = ''

  try {
    await orgSubStore.cancelOrganizationSubscription(props.organizationId)
    successMsg.value = t('adminOrgPlan.cancelSuccess')
    showCancelConfirm.value = false
    emit('assigned')
    autoCloseTimer = setTimeout(() => {
      emit('close')
    }, 1500)
  } catch (err: any) {
    error.value = err.response?.data?.error_message ||
                  err.response?.data?.message ||
                  orgSubStore.error ||
                  t('adminOrgPlan.cancelError')
  } finally {
    saving.value = false
  }
}

const resetForm = () => {
  if (autoCloseTimer) {
    clearTimeout(autoCloseTimer)
    autoCloseTimer = null
  }
  selectedPlanId.value = ''
  quantity.value = 1
  error.value = ''
  successMsg.value = ''
  saving.value = false
  showCancelConfirm.value = false
}

// Pre-fill plan when modal opens with currentPlanId
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    if (props.currentPlanId) {
      selectedPlanId.value = props.currentPlanId
    }
    plansStore.ensurePlansLoaded()
  }
  if (!newVisible) {
    resetForm()
  }
})
</script>

<style scoped>
.admin-org-plan-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.section-title {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.current-subscription {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.subscription-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border-light);
}

.subscription-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.plan-name {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.status-active {
  background: var(--color-success-bg);
  color: var(--color-success-text);
  border: 1px solid var(--color-success-border);
}

.status-trialing {
  background: var(--color-info-bg);
  color: var(--color-info-text);
  border: 1px solid var(--color-info-border);
}

.status-canceled {
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
  border: 1px solid var(--color-danger-border);
}

.status-past_due {
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
  border: 1px solid var(--color-warning-border);
}

.status-pending_payment {
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
  border: 1px solid var(--color-warning-border);
}

.subscription-detail {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.subscription-warning {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  border: 1px solid var(--color-warning-border);
}

.cancel-section {
  display: flex;
  justify-content: flex-start;
}

.confirm-cancel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-danger-bg);
  border: 1px solid var(--color-danger-border);
  border-radius: var(--border-radius-md);
}

.confirm-text {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-danger-text);
}

.confirm-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.section-divider {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.section-divider::before,
.section-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.form-group label {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.form-control {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 2px solid var(--color-border-medium);
  border-radius: var(--border-radius-sm);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  transition: all var(--transition-fast);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
}

select.form-control {
  appearance: auto;
}

.error-message {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  border: 1px solid var(--color-danger-border);
}

.success-message {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-success-bg);
  color: var(--color-success-text);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  border: 1px solid var(--color-success-border);
}

</style>
