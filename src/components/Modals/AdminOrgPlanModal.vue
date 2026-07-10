<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
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

      <!-- Per-role plan overrides -->
      <div class="section-divider">
        <span>{{ t('adminOrgPlan.roleOverridesTitle') }}</span>
      </div>

      <div class="role-overrides">
        <p class="role-overrides-help">
          <i class="fas fa-info-circle"></i>
          {{ t('adminOrgPlan.roleOverridesHelp') }}
        </p>

        <div
          v-for="roleRow in roleRows"
          :key="roleRow.role"
          class="form-group role-override-row"
        >
          <label :for="`role-override-${roleRow.role}`">
            {{ roleRow.label }}
          </label>
          <select
            :id="`role-override-${roleRow.role}`"
            v-model="roleSelections[roleRow.role]"
            class="form-control"
          >
            <option value="">{{ t('adminOrgPlan.useDefaultPlan') }}</option>
            <option
              v-for="plan in activePlans"
              :key="plan.id"
              :value="plan.id"
            >
              {{ plan.name }} - {{ plansStore.formatPrice(plan.price_amount, plan.currency) }}/{{ plan.billing_interval }}
            </option>
          </select>
        </div>
      </div>

      <!-- Assign Confirmation -->
      <div v-if="showAssignConfirm" class="confirm-assign">
        <p class="confirm-text">
          {{ currentSubscription ? t('adminOrgPlan.changeConfirmText') : t('adminOrgPlan.assignConfirmText') }}
        </p>
        <div class="confirm-summary">
          <div class="confirm-summary-row">
            <span class="confirm-label">{{ t('adminOrgPlan.confirmOrganization') }}:</span>
            <span class="confirm-value">{{ organizationName }}</span>
          </div>
          <div class="confirm-summary-row">
            <span class="confirm-label">{{ t('adminOrgPlan.confirmPlan') }}:</span>
            <span class="confirm-value">{{ selectedPlanName }}</span>
          </div>
          <div v-if="quantity > 1" class="confirm-summary-row">
            <span class="confirm-label">{{ t('adminOrgPlan.quantity') }}:</span>
            <span class="confirm-value">{{ quantity }}</span>
          </div>
        </div>
        <div class="confirm-actions">
          <button class="btn btn-primary" :disabled="saving" @click="handleAssign">
            <i :class="saving ? 'fas fa-spinner fa-spin' : 'fas fa-check'"></i>
            {{ currentSubscription ? t('adminOrgPlan.changePlanConfirm') : t('adminOrgPlan.assignPlan') }}
          </button>
          <button class="btn btn-secondary" :disabled="saving" @click="showAssignConfirm = false">
            {{ t('adminOrgPlan.goBack') }}
          </button>
        </div>
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
        v-if="!showAssignConfirm"
        class="btn btn-primary"
        :disabled="saving || !canSave"
        @click="onPrimaryClick"
      >
        <i class="fas fa-check"></i>
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
import { useOrganizationRolePlansStore } from '../../stores/organizationRolePlans'
import type { OrganizationRolePlan } from '../../stores/organizationRolePlans'
import type { SubscriptionPlan, OrganizationSubscription } from '../../types'

type OrgRole = 'owner' | 'manager' | 'member'

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
      assignConfirmText: 'Are you sure you want to assign this plan? This will affect the organization\'s billing.',
      changeConfirmText: 'Are you sure you want to change the plan? This will affect the organization\'s billing.',
      confirmOrganization: 'Organization',
      confirmPlan: 'Plan',
      goBack: 'Go Back',
      assignSuccess: 'Plan assigned successfully',
      changeSuccess: 'Plan changed successfully',
      cancelSuccess: 'Subscription canceled successfully',
      assignError: 'Failed to assign plan',
      cancelError: 'Failed to cancel subscription',
      statusActive: 'Active',
      statusTrialing: 'Trial',
      statusCanceled: 'Canceled',
      statusPastDue: 'Past Due',
      statusPendingPayment: 'Pending',
      roleOverridesTitle: 'Per-role plan overrides',
      roleOverridesHelp: 'Assign a specific plan to a role. A role without an override inherits the organization\'s default plan above.',
      useDefaultPlan: 'Use default plan (no override)',
      roleOwner: 'Owner',
      roleManager: 'Manager',
      roleMember: 'Member',
      overridesError: 'Failed to save role plan overrides'
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
      assignConfirmText: 'Êtes-vous sûr de vouloir attribuer ce plan ? Cela affectera la facturation de l\'organisation.',
      changeConfirmText: 'Êtes-vous sûr de vouloir changer de plan ? Cela affectera la facturation de l\'organisation.',
      confirmOrganization: 'Organisation',
      confirmPlan: 'Plan',
      goBack: 'Retour',
      assignSuccess: 'Plan attribué avec succès',
      changeSuccess: 'Plan modifié avec succès',
      cancelSuccess: 'Abonnement annulé avec succès',
      assignError: 'Échec de l\'attribution du plan',
      cancelError: 'Échec de l\'annulation de l\'abonnement',
      statusActive: 'Actif',
      statusTrialing: 'Essai',
      statusCanceled: 'Annulé',
      statusPastDue: 'En retard',
      statusPendingPayment: 'En attente',
      roleOverridesTitle: 'Plans par rôle',
      roleOverridesHelp: 'Attribuez un plan spécifique à un rôle. Un rôle sans plan dédié hérite du plan par défaut de l\'organisation ci-dessus.',
      useDefaultPlan: 'Utiliser le plan par défaut (aucun)',
      roleOwner: 'Propriétaire',
      roleManager: 'Gestionnaire',
      roleMember: 'Membre',
      overridesError: 'Échec de l\'enregistrement des plans par rôle'
    }
  }
})

const orgSubStore = useOrganizationSubscriptionsStore()
const plansStore = useSubscriptionPlansStore()
const rolePlansStore = useOrganizationRolePlansStore()

const selectedPlanId = ref('')
const quantity = ref(1)
const saving = ref(false)
const error = ref('')
const successMsg = ref('')
const showCancelConfirm = ref(false)
const showAssignConfirm = ref(false)
let autoCloseTimer: ReturnType<typeof setTimeout> | null = null

// Per-role plan overrides
const ROLES: OrgRole[] = ['owner', 'manager', 'member']
// Current selection per role (plan id, or '' for "use default")
const roleSelections = ref<Record<OrgRole, string>>({ owner: '', manager: '', member: '' })
// Initial selection per role (to compute the diff on save)
const initialRoleSelections = ref<Record<OrgRole, string>>({ owner: '', manager: '', member: '' })
// Existing override records per role (id + current plan), if any
const existingRolePlans = ref<Record<OrgRole, OrganizationRolePlan | null>>({
  owner: null,
  manager: null,
  member: null
})

const roleRows = computed(() =>
  ROLES.map((role) => ({
    role,
    label: t(`adminOrgPlan.role${role.charAt(0).toUpperCase()}${role.slice(1)}`)
  }))
)

const activePlans = computed(() =>
  (plansStore.entities as SubscriptionPlan[]).filter((p: SubscriptionPlan) => p.is_active)
)

// Whether any role override differs from its initial value
const hasRoleOverrideChanges = computed(() =>
  ROLES.some((role) => roleSelections.value[role] !== initialRoleSelections.value[role])
)

// Primary button is enabled when a default plan can be (re)assigned OR overrides changed
const canSave = computed(() => !!selectedPlanId.value || hasRoleOverrideChanges.value)

// Whether the default-plan selection changed and should trigger a (re)subscribe
const defaultPlanChanged = computed(() =>
  !!selectedPlanId.value && selectedPlanId.value !== (props.currentPlanId || '')
)

const currentPlanName = computed(() => {
  if (!props.currentSubscription) return ''
  if (props.currentSubscription.subscription_plan?.name) {
    return props.currentSubscription.subscription_plan.name
  }
  const plan = activePlans.value.find(p => p.id === props.currentSubscription?.subscription_plan_id)
  return plan?.name || props.currentSubscription.subscription_plan_id
})

const selectedPlanName = computed(() => {
  if (!selectedPlanId.value) return ''
  const plan = activePlans.value.find(p => p.id === selectedPlanId.value)
  return plan ? `${plan.name} - ${plansStore.formatPrice(plan.price_amount, plan.currency)}/${plan.billing_interval}` : selectedPlanId.value
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

// Load existing per-role overrides and pre-fill each row
const loadRoleOverrides = async () => {
  const blank: Record<OrgRole, string> = { owner: '', manager: '', member: '' }
  roleSelections.value = { ...blank }
  initialRoleSelections.value = { ...blank }
  existingRolePlans.value = { owner: null, manager: null, member: null }

  if (!props.organizationId) return

  try {
    const overrides = await rolePlansStore.loadOrganizationRolePlans(props.organizationId)
    overrides.forEach((rp) => {
      const role = rp.role as OrgRole
      if (ROLES.includes(role)) {
        existingRolePlans.value[role] = rp
        roleSelections.value[role] = rp.subscription_plan_id || ''
        initialRoleSelections.value[role] = rp.subscription_plan_id || ''
      }
    })
  } catch {
    // Surface a non-blocking error; default-plan management stays usable
    error.value = error.value || rolePlansStore.error || t('adminOrgPlan.overridesError')
  }
}

// Reconcile the (<=3) per-role override changes against their initial state
const saveRoleOverrides = async () => {
  const operations: Promise<unknown>[] = []

  for (const role of ROLES) {
    const current = roleSelections.value[role]
    const initial = initialRoleSelections.value[role]
    if (current === initial) continue

    const existing = existingRolePlans.value[role]
    if (!initial && current) {
      // was default, now a specific plan -> create
      operations.push(rolePlansStore.createRolePlan({
        organization_id: props.organizationId,
        role,
        subscription_plan_id: current
      }))
    } else if (initial && current && existing) {
      // had a plan, now a different plan -> update
      operations.push(rolePlansStore.updateRolePlan(existing.id, { subscription_plan_id: current }))
    } else if (initial && !current && existing) {
      // had a plan, now default -> delete
      operations.push(rolePlansStore.deleteRolePlan(existing.id))
    }
  }

  if (operations.length > 0) {
    await Promise.all(operations)
  }
}

const onPrimaryClick = () => {
  // A billing-affecting default-plan change needs explicit confirmation;
  // override-only edits save directly.
  if (defaultPlanChanged.value) {
    showAssignConfirm.value = true
  } else {
    handleAssign()
  }
}

const handleAssign = async () => {
  if (!canSave.value) return

  saving.value = true
  error.value = ''
  successMsg.value = ''

  try {
    // Only (re)subscribe when the default plan selection actually changed
    if (defaultPlanChanged.value) {
      await orgSubStore.subscribeOrganization(props.organizationId, {
        subscription_plan_id: selectedPlanId.value,
        quantity: quantity.value > 0 ? quantity.value : undefined
      })
    }

    await saveRoleOverrides()

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
                  rolePlansStore.error ||
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
  showAssignConfirm.value = false
  const blank: Record<OrgRole, string> = { owner: '', manager: '', member: '' }
  roleSelections.value = { ...blank }
  initialRoleSelections.value = { ...blank }
  existingRolePlans.value = { owner: null, manager: null, member: null }
}

// Pre-fill plan + role overrides when modal opens
watch(() => props.visible, async (newVisible) => {
  if (newVisible) {
    if (props.currentPlanId) {
      selectedPlanId.value = props.currentPlanId
    }
    await plansStore.ensurePlansLoaded()
    await loadRoleOverrides()
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

.confirm-assign {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-warning-bg);
  border: 1px solid var(--color-warning-border);
  border-radius: var(--border-radius-md);
}

.confirm-assign .confirm-text {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-warning-text);
  font-weight: var(--font-weight-medium);
}

.confirm-summary {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background: var(--color-bg-primary);
  border-radius: var(--border-radius-sm);
}

.confirm-summary-row {
  display: flex;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
}

.confirm-label {
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
}

.confirm-value {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
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

.role-overrides {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.role-overrides-help {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.role-override-row label {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
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
  box-shadow: var(--shadow-sm);
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
