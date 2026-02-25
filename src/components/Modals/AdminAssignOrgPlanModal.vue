<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <BaseModal
    :visible="visible"
    :title="t('assignOrgPlan.title')"
    :show-default-footer="true"
    :confirm-text="t('assignOrgPlan.assign')"
    :cancel-text="t('assignOrgPlan.cancel')"
    :is-loading="isAssigning"
    :confirm-disabled="!selectedOrganizationId || !selectedPlanId"
    @confirm="handleAssign"
    @close="handleClose"
  >
    <div class="assign-modal-content">
      <p class="modal-description">
        {{ t('assignOrgPlan.description') }}
      </p>

      <!-- Organization Search -->
      <div class="form-group">
        <label for="org-search">
          {{ t('assignOrgPlan.searchOrganization') }}
        </label>
        <input
          id="org-search"
          v-model="searchQuery"
          type="text"
          class="form-control"
          :placeholder="t('assignOrgPlan.searchPlaceholder')"
          @input="handleSearch"
        />
      </div>

      <!-- Search Results -->
      <div v-if="isSearching" class="search-loading">
        <i class="fas fa-spinner fa-spin"></i>
        {{ t('assignOrgPlan.searching') }}
      </div>

      <div v-else-if="filteredOrganizations.length > 0" class="search-results">
        <div
          v-for="org in filteredOrganizations"
          :key="org.id"
          :class="['org-result', { selected: selectedOrganizationId === org.id }]"
          @click="selectOrganization(org.id)"
        >
          <div class="org-avatar">
            <i class="fas fa-building"></i>
          </div>
          <div class="org-info">
            <div class="org-name">{{ org.display_name }}</div>
            <div class="org-meta">{{ org.name }} &middot; {{ org.member_count || 0 }} {{ t('assignOrgPlan.members') }}</div>
          </div>
          <div v-if="selectedOrganizationId === org.id" class="org-check">
            <i class="fas fa-check-circle"></i>
          </div>
        </div>
      </div>

      <div v-else-if="searchQuery.length > 1 && !isSearching" class="empty-results">
        <i class="fas fa-search"></i>
        <p>{{ t('assignOrgPlan.noResults') }}</p>
      </div>

      <!-- Plan Selection -->
      <div class="form-group">
        <label for="plan-select">
          {{ t('assignOrgPlan.selectPlan') }}
        </label>
        <select
          id="plan-select"
          v-model="selectedPlanId"
          class="form-control"
        >
          <option value="">{{ t('assignOrgPlan.choosePlan') }}</option>
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
          {{ t('assignOrgPlan.quantity') }}
        </label>
        <input
          id="quantity-input"
          v-model.number="quantity"
          type="number"
          class="form-control"
          min="1"
          :placeholder="t('assignOrgPlan.quantityPlaceholder')"
        />
      </div>

      <!-- Error message -->
      <div v-if="error" class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        {{ error }}
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import BaseModal from './BaseModal.vue'
import { useOrganizationsStore } from '../../stores/organizations'
import { useOrganizationSubscriptionsStore } from '../../stores/organizationSubscriptions'
import { useSubscriptionPlansStore } from '../../stores/subscriptionPlans'
import type { Organization, SubscriptionPlan } from '../../types'

const props = defineProps<{
  visible: boolean
  preselectedPlanId?: string
}>()

const emit = defineEmits<{
  close: []
  assigned: []
}>()

const { t } = useTranslations({
  en: {
    assignOrgPlan: {
      title: 'Assign Plan to Organization',
      description: 'Select an organization and a plan to assign.',
      searchOrganization: 'Search for organization',
      searchPlaceholder: 'Enter organization name...',
      searching: 'Loading organizations...',
      noResults: 'No organizations found',
      members: 'members',
      selectPlan: 'Subscription plan',
      choosePlan: '-- Select a plan --',
      quantity: 'Quantity (seats)',
      quantityPlaceholder: '1',
      assign: 'Assign Plan',
      cancel: 'Cancel',
      assignSuccess: 'Plan assigned to organization successfully',
      assignError: 'Failed to assign plan to organization'
    }
  },
  fr: {
    assignOrgPlan: {
      title: 'Assigner un plan a une organisation',
      description: 'Selectionnez une organisation et un plan a assigner.',
      searchOrganization: 'Rechercher une organisation',
      searchPlaceholder: 'Entrer le nom de l\'organisation...',
      searching: 'Chargement des organisations...',
      noResults: 'Aucune organisation trouvee',
      members: 'membres',
      selectPlan: 'Plan d\'abonnement',
      choosePlan: '-- Selectionnez un plan --',
      quantity: 'Quantite (sieges)',
      quantityPlaceholder: '1',
      assign: 'Assigner le plan',
      cancel: 'Annuler',
      assignSuccess: 'Plan assigne a l\'organisation avec succes',
      assignError: 'Echec de l\'assignation du plan a l\'organisation'
    }
  }
})

const orgsStore = useOrganizationsStore()
const orgSubStore = useOrganizationSubscriptionsStore()
const plansStore = useSubscriptionPlansStore()

const searchQuery = ref('')
const selectedOrganizationId = ref('')
const selectedPlanId = ref('')
const quantity = ref(1)
const isSearching = ref(false)
const isAssigning = ref(false)
const error = ref('')

const activePlans = computed(() =>
  (plansStore.entities as SubscriptionPlan[]).filter((p: SubscriptionPlan) => p.is_active)
)

const filteredOrganizations = computed(() => {
  const orgs = orgsStore.organizations as Organization[]
  if (!searchQuery.value || searchQuery.value.length < 2) {
    return orgs
  }
  const query = searchQuery.value.toLowerCase()
  return orgs.filter(org =>
    org.display_name.toLowerCase().includes(query) ||
    org.name.toLowerCase().includes(query)
  )
})

onMounted(async () => {
  await Promise.all([
    loadOrganizations(),
    plansStore.ensurePlansLoaded()
  ])
})

const loadOrganizations = async () => {
  isSearching.value = true
  try {
    await orgsStore.loadOrganizations()
  } catch (err: any) {
    console.error('Failed to load organizations:', err)
  } finally {
    isSearching.value = false
  }
}

const handleSearch = () => {
  // Filtering is done client-side via the computed property
}

const selectOrganization = (orgId: string) => {
  selectedOrganizationId.value = orgId
}

const handleAssign = async () => {
  if (!selectedOrganizationId.value || !selectedPlanId.value) return

  isAssigning.value = true
  error.value = ''

  try {
    await orgSubStore.subscribeOrganization(selectedOrganizationId.value, {
      subscription_plan_id: selectedPlanId.value,
      quantity: quantity.value > 0 ? quantity.value : undefined
    })
    emit('assigned')
    resetForm()
    emit('close')
  } catch (err: any) {
    error.value = err.response?.data?.error_message ||
                  err.response?.data?.message ||
                  orgSubStore.error ||
                  t('assignOrgPlan.assignError')
  } finally {
    isAssigning.value = false
  }
}

const handleClose = () => {
  resetForm()
  emit('close')
}

const resetForm = () => {
  searchQuery.value = ''
  selectedOrganizationId.value = ''
  selectedPlanId.value = ''
  quantity.value = 1
  error.value = ''
  isAssigning.value = false
}

// Pre-fill plan when modal opens with preselectedPlanId
watch(() => props.visible, (newVisible) => {
  if (newVisible && props.preselectedPlanId) {
    selectedPlanId.value = props.preselectedPlanId
  }
  if (!newVisible) {
    resetForm()
  }
})
</script>

<style scoped>
.assign-modal-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.modal-description {
  margin: 0;
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
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

.search-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xl);
  color: var(--color-text-muted);
  font-size: var(--font-size-base);
}

.search-results {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  max-height: 200px;
  overflow-y: auto;
  padding: var(--spacing-xs);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
}

.org-result {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-bg-primary);
  border: 2px solid var(--color-border-light);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.org-result:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.org-result.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  box-shadow: var(--shadow-sm);
}

.org-avatar {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-secondary);
  color: var(--color-text-muted);
  border-radius: 50%;
  font-size: var(--font-size-lg);
}

.org-info {
  flex: 1;
  min-width: 0;
}

.org-name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.org-meta {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.org-check {
  color: var(--color-primary);
  font-size: var(--font-size-xl);
}

.empty-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-xl);
  color: var(--color-text-muted);
}

.empty-results i {
  font-size: var(--font-size-3xl);
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
}
</style>
