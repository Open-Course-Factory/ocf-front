<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.

 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
-->

<template>
  <div class="pricing-calculator">
    <div class="calculator-header">
      <h3 class="calculator-title">{{ t('pricingCalculator.title') }}</h3>
      <p class="calculator-subtitle">{{ t('pricingCalculator.subtitle') }}</p>
    </div>

    <div class="quantity-selector">
      <label for="quantity-slider" class="quantity-label">
        {{ t('pricingCalculator.howManyLicenses') }}
      </label>
      <div class="quantity-input-group">
        <input
          id="quantity-slider"
          v-model.number="localQuantity"
          type="range"
          :min="minQuantity"
          :max="maxQuantity"
          class="quantity-slider"
          @input="handleQuantityChange"
        />
        <input
          v-model.number="localQuantity"
          type="number"
          :min="minQuantity"
          :max="maxQuantity"
          class="quantity-number"
          @change="handleQuantityChange"
        />
      </div>
      <div class="quantity-display">
        <span class="quantity-value">{{ localQuantity }}</span>
        <span class="quantity-unit">{{ t('pricingCalculator.licenses') }}</span>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      {{ t('pricingCalculator.calculating') }}
    </div>

    <div v-else-if="error" class="error-state">
      <i class="fas fa-exclamation-circle"></i>
      {{ error }}
    </div>

    <div v-else-if="preview" class="pricing-preview">
      <div class="tier-breakdown">
        <h4 class="breakdown-title">{{ t('pricingCalculator.pricingBreakdown') }}</h4>
        <div class="tier-list">
          <div v-for="tier in preview.tier_breakdown" :key="tier.range" class="tier-row">
            <span class="tier-range">{{ tier.range }} {{ t('pricingCalculator.licenses') }}</span>
            <span class="tier-calculation">
              {{ tier.quantity }} × {{ formatCents(tier.unit_price) }}
            </span>
            <span class="tier-subtotal">= {{ formatCents(tier.subtotal) }}</span>
          </div>
        </div>
      </div>

      <div class="pricing-summary">
        <div class="summary-row total-row">
          <span class="summary-label">{{ t('pricingCalculator.totalMonthly') }}</span>
          <span class="summary-value total-value">
            {{ formatCents(preview.total_monthly_cost) }}/{{ t('pricingCalculator.month') }}
          </span>
        </div>
        <div class="summary-row">
          <span class="summary-label">{{ t('pricingCalculator.averagePerLicense') }}</span>
          <span class="summary-value">{{ formatCurrency(preview.average_per_license) }}</span>
        </div>
        <div v-if="preview.savings_vs_individual > 0" class="savings-badge">
          <i class="fas fa-piggy-bank"></i>
          {{ t('pricingCalculator.save') }} {{ formatCents(preview.savings_vs_individual) }}
          {{ t('pricingCalculator.vsIndividual') }}
        </div>
      </div>

      <div v-if="showPurchaseButton" class="action-section">
        <button class="btn-purchase" @click="handlePurchase">
          <i class="fas fa-shopping-cart"></i>
          {{ t('pricingCalculator.purchaseLicenses', { count: localQuantity }) }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { useSubscriptionBatchesStore } from '../../stores/subscriptionBatches'
import type { PricingBreakdown } from '../../types/entities'

const props = defineProps<{
  planId: string
  initialQuantity?: number
  minQuantity?: number
  maxQuantity?: number
  showPurchaseButton?: boolean
}>()

const emit = defineEmits<{
  purchase: [quantity: number]
  quantityChange: [quantity: number]
}>()

const { t } = useTranslations({
  en: {
    pricingCalculator: {
      title: 'Volume Pricing Calculator',
      subtitle: 'Get discounts when you purchase multiple licenses',
      howManyLicenses: 'How many licenses do you need?',
      licenses: 'licenses',
      calculating: 'Calculating pricing...',
      pricingBreakdown: 'Pricing Breakdown',
      totalMonthly: 'Total Monthly Cost',
      month: 'month',
      averagePerLicense: 'Average per License',
      save: 'Save',
      vsIndividual: 'vs individual pricing',
      purchaseLicenses: 'Purchase {count} Licenses'
    }
  },
  fr: {
    pricingCalculator: {
      title: 'Calculateur de Prix Volume',
      subtitle: 'Obtenez des remises lors de l\'achat de plusieurs licences',
      howManyLicenses: 'Combien de licences avez-vous besoin ?',
      licenses: 'licences',
      calculating: 'Calcul du prix...',
      pricingBreakdown: 'Détail du Prix',
      totalMonthly: 'Coût Mensuel Total',
      month: 'mois',
      averagePerLicense: 'Moyenne par Licence',
      save: 'Économisez',
      vsIndividual: 'vs prix individuel',
      purchaseLicenses: 'Acheter {count} Licences'
    }
  }
})

const batchStore = useSubscriptionBatchesStore()

const localQuantity = ref(props.initialQuantity || props.minQuantity || 10)
const preview = ref<PricingBreakdown | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

// Debounce timer for quantity changes
let debounceTimer: NodeJS.Timeout | null = null

const handleQuantityChange = () => {
  // Clear existing timer
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  // Set new timer
  debounceTimer = setTimeout(() => {
    loadPricingPreview()
    emit('quantityChange', localQuantity.value)
  }, 300)
}

const loadPricingPreview = async () => {
  if (!props.planId || localQuantity.value < (props.minQuantity || 1)) {
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const data = await batchStore.getPricingPreview(props.planId, localQuantity.value)
    preview.value = data
  } catch (err: any) {
    error.value = err.response?.data?.error_message || err.response?.data?.message || t('pricingCalculator.calculating')
  } finally {
    isLoading.value = false
  }
}

const formatCents = (cents: number): string => {
  const amount = cents / 100
  return `€${amount.toFixed(2)}`
}

const formatCurrency = (amount: number): string => {
  return `€${amount.toFixed(2)}`
}

const handlePurchase = () => {
  emit('purchase', localQuantity.value)
}

// Watch for planId changes
watch(() => props.planId, () => {
  if (props.planId) {
    loadPricingPreview()
  }
})

// Load preview on mount
onMounted(() => {
  if (props.planId) {
    loadPricingPreview()
  }
})
</script>

<style scoped>
.pricing-calculator {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
}

.calculator-header {
  margin-bottom: var(--spacing-lg);
}

.calculator-title {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.calculator-subtitle {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

/* Quantity Selector */
.quantity-selector {
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
}

.quantity-label {
  display: block;
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.quantity-input-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.quantity-slider {
  flex: 1;
  height: 6px;
  border-radius: var(--border-radius-sm);
  background: var(--color-bg-tertiary);
  outline: none;
  -webkit-appearance: none;
}

.quantity-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.quantity-slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 0 0 8px var(--color-primary-light);
}

.quantity-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.quantity-slider::-moz-range-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 0 0 8px var(--color-primary-light);
}

.quantity-number {
  width: 100px;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border-default);
  border-radius: var(--border-radius-sm);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  text-align: center;
}

.quantity-display {
  text-align: center;
}

.quantity-value {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-right: var(--spacing-xs);
}

.quantity-unit {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
}

/* Loading and Error States */
.loading-state,
.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xl);
  color: var(--color-text-muted);
  font-size: var(--font-size-base);
}

.error-state {
  color: var(--color-danger);
}

.loading-state i {
  font-size: var(--font-size-lg);
}

/* Pricing Preview */
.pricing-preview {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.tier-breakdown {
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
}

.breakdown-title {
  margin: 0 0 var(--spacing-md) 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.tier-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.tier-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  background: var(--color-bg-primary);
  font-size: var(--font-size-sm);
}

.tier-range {
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

.tier-calculation {
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

.tier-subtotal {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

/* Pricing Summary */
.pricing-summary {
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  border: 2px solid var(--color-border-light);
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
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-weight-semibold);
}

.total-row {
  padding: var(--spacing-md) 0;
  margin-bottom: var(--spacing-sm);
}

.total-row .summary-label {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.total-value {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

/* Savings Badge */
.savings-badge {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  margin-top: var(--spacing-md);
  background: linear-gradient(135deg, var(--color-success-bg) 0%, var(--color-success-light) 100%);
  color: var(--color-success-text);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  text-align: center;
  justify-content: center;
}

.savings-badge i {
  font-size: var(--font-size-lg);
}

/* Action Section */
.action-section {
  display: flex;
  justify-content: center;
  padding-top: var(--spacing-lg);
}

.btn-purchase {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-xl);
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm);
}

.btn-purchase:hover {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-purchase:active {
  transform: translateY(0);
  box-shadow: var(--shadow-xs);
}

.btn-purchase i {
  font-size: var(--font-size-base);
}

/* Responsive */
@media (max-width: 768px) {
  .pricing-calculator {
    padding: var(--spacing-lg);
  }

  .tier-row {
    grid-template-columns: 1fr;
    gap: var(--spacing-xs);
    text-align: center;
  }

  .tier-subtotal {
    text-align: center;
  }

  .quantity-input-group {
    flex-direction: column;
  }

  .quantity-number {
    width: 100%;
  }
}
</style>
