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

    <div v-if="error && !preview" class="error-state">
      <i class="fas fa-exclamation-circle"></i>
      {{ error }}
    </div>

    <div v-else-if="!preview && isLoading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      {{ t('pricingCalculator.calculating') }}
    </div>

    <div v-if="preview" class="pricing-preview" :class="{ 'loading-overlay': isLoading }">
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

        <!-- Discount Percentage Badge -->
        <div v-if="discountPercentage > 0" class="discount-badge">
          <i class="fas fa-tag"></i>
          {{ discountPercentage }}% {{ t('pricingCalculator.discount') }}
        </div>

        <!-- Savings vs Individual -->
        <div v-if="preview.savings_vs_individual > 0" class="savings-badge">
          <i class="fas fa-piggy-bank"></i>
          {{ t('pricingCalculator.save') }} {{ formatCents(preview.savings_vs_individual) }}
          {{ t('pricingCalculator.vsIndividual') }}
        </div>
      </div>

      <!-- Comparison Table -->
      <div
        class="comparison-table"
        :class="{ 'comparison-hidden': !preview.savings_vs_individual || preview.savings_vs_individual <= 0 }"
      >
        <h4 class="comparison-title">{{ t('pricingCalculator.comparisonTitle') }}</h4>
        <table class="price-comparison">
          <thead>
            <tr>
              <th>{{ t('pricingCalculator.purchaseType') }}</th>
              <th>{{ t('pricingCalculator.pricePerLicense') }}</th>
              <th>{{ t('pricingCalculator.totalCost') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr class="individual-row">
              <td>{{ t('pricingCalculator.individualPurchase', { count: localQuantity }) }}</td>
              <td>{{ formatCents(preview.individual_unit_price || 0) }}</td>
              <td>{{ formatCents((preview.total_monthly_cost || 0) + (preview.savings_vs_individual || 0)) }}</td>
            </tr>
            <tr class="bulk-row">
              <td>
                <strong>{{ t('pricingCalculator.bulkPurchase', { count: localQuantity }) }}</strong>
                <span class="recommended-badge">{{ t('pricingCalculator.recommended') }}</span>
              </td>
              <td><strong>{{ formatCurrency(preview.average_per_license) }}</strong></td>
              <td>
                <strong>{{ formatCents(preview.total_monthly_cost) }}</strong>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="comparison-savings">
          <i class="fas fa-check-circle"></i>
          {{ t('pricingCalculator.youSave') }} <strong>{{ formatCents(preview.savings_vs_individual) }}/{{ t('pricingCalculator.month') }}</strong> {{ t('pricingCalculator.withBulkPricing') }}
        </div>
      </div>

      <!-- Use Case -->
      <div class="use-case-section" :class="{ 'use-case-hidden': localQuantity < 15 }">
        <div class="use-case-card">
          <div class="use-case-icon">
            <i class="fas fa-graduation-cap"></i>
          </div>
          <div class="use-case-content">
            <h5 class="use-case-title">{{ t('pricingCalculator.useCaseTitle') }}</h5>
            <p class="use-case-text">{{ t('pricingCalculator.useCaseDescription') }}</p>
          </div>
        </div>
      </div>

      <!-- Help Link -->
      <div class="help-link-section">
        <router-link to="/help-public/account/billing" class="help-link">
          <i class="fas fa-question-circle"></i>
          {{ t('pricingCalculator.learnMore') }}
        </router-link>
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
import { ref, computed, watch, onMounted } from 'vue'
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
      purchaseLicenses: 'Purchase {count} Licenses',
      discount: 'OFF',
      comparisonTitle: 'Price Comparison',
      purchaseType: 'Purchase Type',
      pricePerLicense: 'Price per License',
      totalCost: 'Total Monthly Cost',
      individualPurchase: '{count} individual licenses',
      bulkPurchase: '{count} licenses (bulk)',
      recommended: 'Recommended',
      youSave: 'You save',
      withBulkPricing: 'with bulk pricing',
      useCaseTitle: 'Perfect for classrooms',
      useCaseDescription: 'Many educators use bulk licensing to provide terminals to all their students at a discounted rate.',
      learnMore: 'Learn more about bulk licensing'
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
      purchaseLicenses: 'Acheter {count} Licences',
      discount: 'DE RÉDUCTION',
      comparisonTitle: 'Comparaison des Prix',
      purchaseType: 'Type d\'Achat',
      pricePerLicense: 'Prix par Licence',
      totalCost: 'Coût Mensuel Total',
      individualPurchase: '{count} licences individuelles',
      bulkPurchase: '{count} licences (groupé)',
      recommended: 'Recommandé',
      youSave: 'Vous économisez',
      withBulkPricing: 'avec la tarification groupée',
      useCaseTitle: 'Parfait pour les salles de classe',
      useCaseDescription: 'De nombreux éducateurs utilisent les licences groupées pour fournir des terminaux à tous leurs étudiants à un tarif réduit.',
      learnMore: 'En savoir plus sur les licences groupées'
    }
  }
})

const batchStore = useSubscriptionBatchesStore()

const localQuantity = ref(props.initialQuantity || props.minQuantity || 10)
const preview = ref<PricingBreakdown | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

// Calculate discount percentage
const discountPercentage = computed(() => {
  if (!preview.value || !preview.value.savings_vs_individual || preview.value.savings_vs_individual <= 0) {
    return 0
  }
  const totalWithoutDiscount = preview.value.total_monthly_cost + preview.value.savings_vs_individual
  const percentage = (preview.value.savings_vs_individual / totalWithoutDiscount) * 100
  return Math.round(percentage)
})

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
  min-width: 400px;
  max-width: 100%;
  transition: all var(--transition-base);
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
  transition: opacity var(--transition-base);
  min-height: 600px;
}

.pricing-preview.loading-overlay {
  opacity: 0.6;
  pointer-events: none;
}

.tier-breakdown {
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  min-height: 180px;
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
  grid-template-columns: minmax(120px, 1fr) minmax(100px, auto) minmax(100px, auto);
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  background: var(--color-bg-primary);
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);
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

/* Discount Badge */
.discount-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  color: var(--color-white);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  box-shadow: var(--shadow-md);
  margin-top: var(--spacing-md);
}

.discount-badge i {
  font-size: var(--font-size-base);
}

/* Comparison Table */
.comparison-table {
  margin-top: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border-light);
  transition: opacity var(--transition-base);
  height: 250px;
  overflow: hidden;
}

.comparison-table.comparison-hidden {
  opacity: 0;
  pointer-events: none;
}

.comparison-title {
  margin: 0 0 var(--spacing-md) 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.price-comparison {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: var(--spacing-md);
}

.price-comparison th {
  padding: var(--spacing-sm) var(--spacing-md);
  text-align: left;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  border-bottom: 2px solid var(--color-border-medium);
}

.price-comparison td {
  padding: var(--spacing-md);
  font-size: var(--font-size-base);
  border-bottom: 1px solid var(--color-border-light);
}

.individual-row {
  background: var(--color-bg-primary);
}

.bulk-row {
  background: linear-gradient(135deg, rgba(var(--color-primary-rgb), 0.05) 0%, rgba(var(--color-primary-rgb), 0.1) 100%);
  color: var(--color-text-primary);
}

.recommended-badge {
  display: inline-block;
  margin-left: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-success);
  color: var(--color-white);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
}

.comparison-savings {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: linear-gradient(135deg, rgba(var(--color-success-rgb), 0.1) 0%, rgba(var(--color-success-rgb), 0.15) 100%);
  border-radius: var(--border-radius-sm);
  color: var(--color-success-dark);
  font-size: var(--font-size-base);
  border: 1px solid rgba(var(--color-success-rgb), 0.3);
}

.comparison-savings i {
  font-size: var(--font-size-lg);
  color: var(--color-success);
}

.comparison-savings strong {
  color: var(--color-success-dark);
  font-weight: var(--font-weight-bold);
}

/* Use Case Section */
.use-case-section {
  margin-top: var(--spacing-xl);
  height: 120px;
  transition: opacity var(--transition-base);
}

.use-case-section.use-case-hidden {
  opacity: 0;
  pointer-events: none;
}

.use-case-card {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  background: linear-gradient(135deg, rgba(var(--color-info-rgb), 0.05) 0%, rgba(var(--color-info-rgb), 0.1) 100%);
  border-radius: var(--border-radius-md);
  border-left: 4px solid var(--color-info);
}

.use-case-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-info);
  color: var(--color-white);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-xl);
}

.use-case-content {
  flex: 1;
}

.use-case-title {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.use-case-text {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.6;
}

/* Help Link Section */
.help-link-section {
  margin-top: var(--spacing-lg);
  text-align: center;
}

.help-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-primary);
  text-decoration: none;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  transition: color var(--transition-fast);
}

.help-link:hover {
  color: var(--color-primary-hover);
  text-decoration: underline;
}

.help-link i {
  font-size: var(--font-size-base);
}

/* Responsive */
@media (max-width: var(--breakpoint-lg)) {
  .comparison-table {
    height: auto;
    min-height: 250px;
    overflow: visible;
  }

  .comparison-savings {
    flex-wrap: wrap;
  }

  .use-case-section {
    height: auto;
    min-height: 120px;
  }
}

@media (max-width: var(--breakpoint-md)) {
  .pricing-calculator {
    padding: var(--spacing-lg);
    min-width: 320px;
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

  .price-comparison {
    font-size: var(--font-size-sm);
  }

  .price-comparison th,
  .price-comparison td {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-size-xs);
  }

  .comparison-table {
    height: auto;
    min-height: 250px;
    overflow: visible;
  }

  .comparison-title {
    font-size: var(--font-size-base);
  }

  .comparison-savings {
    font-size: var(--font-size-sm);
    flex-wrap: wrap;
  }

  .recommended-badge {
    display: block;
    margin: var(--spacing-xs) 0 0 0;
  }

  .use-case-card {
    flex-direction: column;
    text-align: center;
  }

  .use-case-section {
    height: auto;
    min-height: 120px;
  }

  .pricing-preview {
    min-height: auto;
  }
}
</style>
