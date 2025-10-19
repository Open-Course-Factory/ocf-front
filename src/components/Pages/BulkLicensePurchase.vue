<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <div class="wrapper">
    <div class="bulk-purchase-page">
      <div class="page-header">
        <h2>
          <i class="fas fa-shopping-cart"></i>
          {{ t('bulkPurchase.title') }}
        </h2>
        <p class="text-muted">{{ t('bulkPurchase.subtitle') }}</p>
      </div>

      <!-- Error message -->
      <div v-if="error" class="alert alert-danger">
        <i class="fas fa-exclamation-triangle"></i>
        {{ error }}
        <button class="btn btn-sm btn-outline-danger" @click="error = ''">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Success message -->
      <div v-if="successMessage" class="alert alert-success">
        <i class="fas fa-check-circle"></i>
        {{ successMessage }}
        <button class="btn btn-sm btn-outline-success" @click="successMessage = ''">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Loading state -->
      <div v-if="isLoadingPlans" class="loading-section">
        <i class="fas fa-spinner fa-spin fa-2x"></i>
        <p>{{ t('bulkPurchase.loadingPlans') }}</p>
      </div>

      <div v-else class="purchase-content">
        <!-- Step 1: Plan Selection -->
        <div class="purchase-section">
          <div class="section-header">
            <h3>
              <span class="step-number">1</span>
              {{ t('bulkPurchase.selectPlan') }}
            </h3>
          </div>

          <div class="plans-grid">
            <div
              v-for="plan in tieredPlans"
              :key="plan.id"
              :class="['plan-card', { selected: selectedPlanId === plan.id }]"
              @click="selectPlan(plan.id)"
            >
              <div class="plan-header">
                <h4 class="plan-name">{{ plan.name }}</h4>
                <div class="plan-price">
                  {{ formatCurrency(plan.price_amount || plan.price) }}
                  <span class="price-unit">/{{ t('bulkPurchase.license') }}</span>
                </div>
              </div>
              <div class="plan-description">
                {{ plan.description || t('bulkPurchase.noDescription') }}
              </div>
              <div v-if="plan.use_tiered_pricing" class="plan-badge">
                <i class="fas fa-layer-group"></i>
                {{ t('bulkPurchase.volumeDiscount') }}
              </div>
              <div v-if="selectedPlanId === plan.id" class="plan-selected-badge">
                <i class="fas fa-check-circle"></i>
                {{ t('bulkPurchase.selected') }}
              </div>
            </div>
          </div>

          <div v-if="tieredPlans.length === 0" class="empty-state">
            <i class="fas fa-info-circle"></i>
            <p>{{ t('bulkPurchase.noPlansAvailable') }}</p>
          </div>
        </div>

        <!-- Step 2: Quantity and Pricing -->
        <div v-if="selectedPlanId" class="purchase-section">
          <div class="section-header">
            <h3>
              <span class="step-number">2</span>
              {{ t('bulkPurchase.chooseQuantity') }}
            </h3>
          </div>

          <PricingCalculator
            :plan-id="selectedPlanId"
            :initial-quantity="quantity"
            :min-quantity="1"
            :max-quantity="200"
            :show-purchase-button="false"
            @quantity-change="handleQuantityChange"
          />
        </div>

        <!-- Step 3: Additional Options -->
        <div v-if="selectedPlanId && quantity > 0" class="purchase-section">
          <div class="section-header">
            <h3>
              <span class="step-number">3</span>
              {{ t('bulkPurchase.additionalOptions') }}
            </h3>
          </div>

          <div class="options-form">
            <div class="form-group">
              <label for="group-select">
                {{ t('bulkPurchase.linkToGroup') }}
                <span class="optional-label">({{ t('bulkPurchase.optional') }})</span>
              </label>
              <select id="group-select" v-model="selectedGroupId" class="form-control">
                <option value="">{{ t('bulkPurchase.noGroup') }}</option>
                <option v-for="group in groups" :key="group.id" :value="group.id">
                  {{ group.display_name || group.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="coupon-input">
                {{ t('bulkPurchase.couponCode') }}
                <span class="optional-label">({{ t('bulkPurchase.optional') }})</span>
              </label>
              <input
                id="coupon-input"
                v-model="couponCode"
                type="text"
                class="form-control"
                :placeholder="t('bulkPurchase.enterCoupon')"
              />
            </div>
          </div>
        </div>

        <!-- Step 4: Confirm Purchase -->
        <div v-if="selectedPlanId && quantity > 0" class="purchase-section">
          <div class="section-header">
            <h3>
              <span class="step-number">4</span>
              {{ t('bulkPurchase.confirmPurchase') }}
            </h3>
          </div>

          <div class="purchase-summary">
            <div class="summary-row">
              <span class="summary-label">{{ t('bulkPurchase.selectedPlan') }}</span>
              <span class="summary-value">{{ selectedPlan?.name }}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">{{ t('bulkPurchase.quantity') }}</span>
              <span class="summary-value">{{ quantity }} {{ t('bulkPurchase.licenses') }}</span>
            </div>
            <div v-if="selectedGroupId" class="summary-row">
              <span class="summary-label">{{ t('bulkPurchase.linkedGroup') }}</span>
              <span class="summary-value">{{ selectedGroup?.display_name || selectedGroup?.name }}</span>
            </div>
            <div v-if="couponCode" class="summary-row">
              <span class="summary-label">{{ t('bulkPurchase.couponCode') }}</span>
              <span class="summary-value">{{ couponCode }}</span>
            </div>
          </div>

          <div class="action-section">
            <button
              class="btn-purchase"
              :disabled="isPurchasing"
              @click="handlePurchase"
            >
              <i v-if="isPurchasing" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-shopping-cart"></i>
              {{ isPurchasing ? t('bulkPurchase.processing') : t('bulkPurchase.completePurchase') }}
            </button>
            <button class="btn-cancel" @click="resetForm">
              <i class="fas fa-times"></i>
              {{ t('bulkPurchase.cancel') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTranslations } from '../../composables/useTranslations'
import { useSubscriptionPlansStore } from '../../stores/subscriptionPlans'
import { useSubscriptionBatchesStore } from '../../stores/subscriptionBatches'
import { useClassGroupsStore } from '../../stores/classGroups'
import PricingCalculator from '../Subscription/PricingCalculator.vue'
import { formatCurrency as formatCurrencyUtil } from '../../utils/formatters'

const { t } = useTranslations({
  en: {
    bulkPurchase: {
      title: 'Purchase Bulk Licenses',
      subtitle: 'Buy multiple licenses with volume discounts',
      loadingPlans: 'Loading subscription plans...',
      selectPlan: 'Select a Plan',
      chooseQuantity: 'Choose Quantity',
      additionalOptions: 'Additional Options',
      confirmPurchase: 'Confirm Purchase',
      license: 'license',
      licenses: 'licenses',
      volumeDiscount: 'Volume Discount',
      selected: 'Selected',
      noPlansAvailable: 'No bulk purchase plans available',
      noDescription: 'No description available',
      linkToGroup: 'Link to Group',
      optional: 'optional',
      noGroup: 'No group',
      couponCode: 'Coupon Code',
      enterCoupon: 'Enter coupon code',
      selectedPlan: 'Plan',
      quantity: 'Quantity',
      linkedGroup: 'Group',
      completePurchase: 'Complete Purchase',
      processing: 'Processing...',
      cancel: 'Cancel',
      purchaseSuccess: 'Licenses purchased successfully! Redirecting to license management...',
      purchaseError: 'Failed to purchase licenses'
    }
  },
  fr: {
    bulkPurchase: {
      title: 'Acheter des Licences en Gros',
      subtitle: 'Achetez plusieurs licences avec des remises sur volume',
      loadingPlans: 'Chargement des plans...',
      selectPlan: 'Sélectionner un Plan',
      chooseQuantity: 'Choisir la Quantité',
      additionalOptions: 'Options Supplémentaires',
      confirmPurchase: 'Confirmer l\'Achat',
      license: 'licence',
      licenses: 'licences',
      volumeDiscount: 'Remise Volume',
      selected: 'Sélectionné',
      noPlansAvailable: 'Aucun plan d\'achat en gros disponible',
      noDescription: 'Aucune description disponible',
      linkToGroup: 'Lier à un Groupe',
      optional: 'optionnel',
      noGroup: 'Aucun groupe',
      couponCode: 'Code Promo',
      enterCoupon: 'Entrer le code promo',
      selectedPlan: 'Plan',
      quantity: 'Quantité',
      linkedGroup: 'Groupe',
      completePurchase: 'Finaliser l\'Achat',
      processing: 'Traitement...',
      cancel: 'Annuler',
      purchaseSuccess: 'Licences achetées avec succès ! Redirection vers la gestion des licences...',
      purchaseError: 'Échec de l\'achat des licences'
    }
  }
})

const router = useRouter()
const route = useRoute()
const plansStore = useSubscriptionPlansStore()
const batchStore = useSubscriptionBatchesStore()
const groupsStore = useClassGroupsStore()

// State
const isLoadingPlans = ref(true)
const isPurchasing = ref(false)
const error = ref('')
const successMessage = ref('')

const selectedPlanId = ref('')
const quantity = ref(10)
const selectedGroupId = ref('')
const couponCode = ref('')

// Computed
const tieredPlans = computed(() => {
  return plansStore.entities.filter((plan: any) => {
    // Only show active plans with tiered pricing enabled
    return plan.use_tiered_pricing && plan.is_active
  })
})

const selectedPlan = computed(() => {
  return plansStore.entities.find((p: any) => p.id === selectedPlanId.value)
})

const selectedGroup = computed(() => {
  return groupsStore.entities.find((g: any) => g.id === selectedGroupId.value)
})

const groups = computed(() => {
  return groupsStore.entities.filter((g: any) => g.is_active && !g.is_expired)
})

// Methods
const formatCurrency = (amount: number | undefined): string => {
  if (amount === undefined) return '€0.00'
  return formatCurrencyUtil(amount, 'EUR')
}

const selectPlan = (planId: string) => {
  selectedPlanId.value = planId
}

const handleQuantityChange = (newQuantity: number) => {
  quantity.value = newQuantity
}

const handlePurchase = async () => {
  if (!selectedPlanId.value || quantity.value < 1) {
    error.value = t('bulkPurchase.purchaseError')
    return
  }

  isPurchasing.value = true
  error.value = ''

  try {
    const result = await batchStore.purchaseBulkLicenses({
      subscription_plan_id: selectedPlanId.value,
      quantity: quantity.value,
      group_id: selectedGroupId.value || undefined,
      coupon_code: couponCode.value || undefined
    })

    successMessage.value = t('bulkPurchase.purchaseSuccess')

    // Redirect to license management after 2 seconds
    setTimeout(() => {
      router.push(`/license-management/${result.id}`)
    }, 2000)
  } catch (err: any) {
    console.error('Purchase error:', err)
    error.value = err.response?.data?.error_message ||
                  err.response?.data?.message ||
                  t('bulkPurchase.purchaseError')
  } finally {
    isPurchasing.value = false
  }
}

const resetForm = () => {
  selectedPlanId.value = ''
  quantity.value = 10
  selectedGroupId.value = ''
  couponCode.value = ''
  error.value = ''
  successMessage.value = ''
}

// Lifecycle
onMounted(async () => {
  try {
    isLoadingPlans.value = true
    await Promise.all([
      plansStore.loadPlans(),
      groupsStore.loadEntities('/class-groups')
    ])

    // Check for planId in query parameters
    const planIdFromQuery = route.query.planId as string
    if (planIdFromQuery && tieredPlans.value.some(p => p.id === planIdFromQuery)) {
      selectedPlanId.value = planIdFromQuery
    }
  } catch (err) {
    console.error('Error loading data:', err)
    error.value = t('bulkPurchase.purchaseError')
  } finally {
    isLoadingPlans.value = false
  }
})
</script>

<style scoped>
.bulk-purchase-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.page-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.page-header h2 {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
}

.text-muted {
  color: var(--color-text-muted);
  font-size: var(--font-size-base);
}

/* Alerts */
.alert {
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-sm);
}

.alert-danger {
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
  border: 1px solid var(--color-danger-border);
}

.alert-success {
  background-color: var(--color-success-bg);
  color: var(--color-success-text);
  border: 1px solid var(--color-success-border);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border: 1px solid transparent;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-sm {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
}

.btn-outline-danger {
  color: var(--color-danger);
  border-color: var(--color-danger);
  background-color: transparent;
}

.btn-outline-success {
  color: var(--color-success);
  border-color: var(--color-success);
  background-color: transparent;
}

/* Loading */
.loading-section {
  text-align: center;
  padding: var(--spacing-3xl);
  color: var(--color-text-muted);
}

.loading-section i {
  margin-bottom: var(--spacing-md);
}

/* Purchase Sections */
.purchase-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.purchase-section {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
}

.section-header {
  margin-bottom: var(--spacing-lg);
}

.section-header h3 {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--color-primary);
  color: var(--color-white);
  border-radius: 50%;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
}

/* Plans Grid */
.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}

.plan-card {
  position: relative;
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border: 2px solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
}

.plan-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.plan-card.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  box-shadow: var(--shadow-md);
}

.plan-header {
  margin-bottom: var(--spacing-md);
}

.plan-name {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.plan-price {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.price-unit {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-normal);
  color: var(--color-text-muted);
}

.plan-description {
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.plan-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-success-bg);
  color: var(--color-success-text);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

.plan-selected-badge {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-primary);
  color: var(--color-white);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-3xl);
  color: var(--color-text-muted);
}

.empty-state i {
  font-size: var(--font-size-3xl);
  margin-bottom: var(--spacing-md);
}

/* Options Form */
.options-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
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

.optional-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-normal);
  color: var(--color-text-muted);
}

.form-control {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border-default);
  border-radius: var(--border-radius-sm);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  transition: all var(--transition-fast);
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
}

/* Purchase Summary */
.purchase-summary {
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-lg);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
}

.summary-row:not(:last-child) {
  border-bottom: 1px solid var(--color-border-light);
}

.summary-label {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

.summary-value {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
}

/* Action Section */
.action-section {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
}

.btn-purchase,
.btn-cancel {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-xl);
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-purchase {
  background: var(--color-primary);
  color: var(--color-white);
  box-shadow: var(--shadow-sm);
}

.btn-purchase:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-purchase:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-cancel {
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border-default);
}

.btn-cancel:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-border-dark);
}

/* Responsive */
@media (max-width: 768px) {
  .bulk-purchase-page {
    padding: var(--spacing-lg);
  }

  .plans-grid {
    grid-template-columns: 1fr;
  }

  .action-section {
    flex-direction: column;
  }

  .btn-purchase,
  .btn-cancel {
    width: 100%;
    justify-content: center;
  }
}
</style>
