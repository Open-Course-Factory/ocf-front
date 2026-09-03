<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
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

      <!-- Error message (utilise le nouveau composant ErrorAlert) -->
      <ErrorAlert
        :message="error"
        @dismiss="error = ''"
      />

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
        <!-- Not allowed to buy: explain instead of showing a form that would be
             refused. The backend answers can_purchase with a reason for this. -->
        <div v-if="!canPurchase" class="empty-state" data-test="seat-purchase-ineligible">
          <i class="fas fa-info-circle"></i>
          <p>{{ t('bulkPurchase.ineligible') }}</p>
        </div>

        <template v-else>
          <!-- Step 1: the order, in the trainer's terms -->
          <div class="purchase-section">
            <div class="section-header">
              <h3>
                <span class="step-number">1</span>
                {{ t('bulkPurchase.yourClass') }}
              </h3>
            </div>

            <div class="ocf-order-form">
              <div class="ocf-order-field">
                <label for="bp-learners">{{ t('bulkPurchase.learnersLabel') }}</label>
                <input
                  id="bp-learners"
                  v-model.number="learners"
                  data-test="seat-purchase-learners"
                  type="number"
                  min="1"
                  max="200"
                  class="form-control"
                />
              </div>
              <div class="ocf-order-field">
                <label for="bp-duration">{{ t('bulkPurchase.durationLabel') }}</label>
                <select
                  id="bp-duration"
                  v-model="duration"
                  data-test="seat-purchase-duration"
                  class="form-control"
                >
                  <option v-for="d in DAY_CHOICES" :key="d" :value="String(d)">
                    {{ t('bulkPurchase.days', { n: d }) }}
                  </option>
                  <option value="month">{{ t('bulkPurchase.oneMonth') }}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Step 2: what it costs. Reserved height so the quotes swapping
               between states never moves the buy button under the cursor. -->
          <div class="purchase-section">
            <div class="section-header">
              <h3>
                <span class="step-number">2</span>
                {{ t('bulkPurchase.whatItCosts') }}
              </h3>
            </div>

            <div class="ocf-quotes" data-test="seat-purchase-quotes">
              <p v-if="quoting" class="section-placeholder">{{ t('bulkPurchase.quoting') }}</p>
              <p v-else-if="quoteFailed" class="section-placeholder">{{ t('bulkPurchase.quoteError') }}</p>
              <p v-else-if="quotes.length === 0" class="section-placeholder">{{ t('bulkPurchase.noQuote') }}</p>
              <div
                v-for="(q, index) in quotes"
                :key="q.plan.id"
                :class="['plan-card', { selected: selectedPlanId === q.plan.id }]"
                data-test="seat-purchase-quote"
                @click="chooseQuote(q)"
              >
                <div class="plan-header">
                  <h4 class="plan-name">{{ q.plan.name }}</h4>
                  <div class="plan-price">{{ formatCurrency(q.total) }}</div>
                </div>
                <div class="plan-description">
                  {{ t('bulkPurchase.quantityDetail', { qty: q.quantity, unit: unitLabel(q.plan.seat_unit) }) }}
                  · {{ t('bulkPurchase.perLearner', { amount: formatCurrency(Math.round(q.total / Math.max(learners, 1))) }) }}
                </div>
                <div v-if="index === 0 && quotes.length > 1" class="plan-badge">
                  <i class="fas fa-award"></i>
                  {{ t('bulkPurchase.cheaper') }}
                </div>
                <div v-if="selectedPlanId === q.plan.id" class="plan-selected-badge">
                  <i class="fas fa-check-circle"></i>
                  {{ t('bulkPurchase.selected') }}
                </div>
              </div>
            </div>
          </div>
        </template>

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
import { ref, computed, onMounted, watch } from 'vue'
import {
  bulkLicenseService,
  type PurchasableSeatPlan,
  type SeatUnit
} from '../../services/domain/subscription/bulkLicenseService'
import { useTranslations } from '../../composables/useTranslations'
import { useSubscriptionBatchesStore } from '../../stores/subscriptionBatches'
import { useClassGroupsStore } from '../../stores/classGroups'
import { formatCurrency as formatCurrencyUtil, extractErrorMessage } from '../../utils/formatters'
import ErrorAlert from '../UI/ErrorAlert.vue'

const { t } = useTranslations({
  en: {
    bulkPurchase: {
      title: 'Purchase Bulk Licenses',
      subtitle: 'Buy multiple licenses with volume discounts',
      loadingPlans: 'Loading seat products...',
      ineligible: 'Your plan does not allow buying seats for learners.',
      yourClass: 'Your class',
      whatItCosts: 'What it costs',
      learnersLabel: 'How many learners?',
      durationLabel: 'For how long?',
      days: '{n} day(s)',
      oneMonth: 'One month',
      quoting: 'Calculating...',
      quoteError: 'Could not calculate the price.',
      noQuote: 'No option applies to this combination.',
      cheaper: 'Cheaper',
      quantityDetail: '{qty} {unit}',
      perLearner: '{amount} per learner',
      seatMonths: 'seat-month(s)',
      learnerDays: 'learner-day(s)',
      selectPlan: 'Select a Plan',
      selectPlanFirst: 'Please select a plan above to see pricing',
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
      loadingPlans: 'Chargement des produits de sièges...',
      ineligible: "Votre plan ne permet pas d'acheter des sièges pour des apprenants.",
      yourClass: 'Votre classe',
      whatItCosts: 'Ce que cela coûte',
      learnersLabel: "Combien d'apprenants ?",
      durationLabel: 'Pour combien de temps ?',
      days: '{n} jour(s)',
      oneMonth: 'Un mois',
      quoting: 'Calcul en cours...',
      quoteError: 'Impossible de calculer le prix.',
      noQuote: 'Aucune option ne correspond à cette combinaison.',
      cheaper: 'Moins cher',
      quantityDetail: '{qty} {unit}',
      perLearner: '{amount} par apprenant',
      seatMonths: 'siège(s)-mois',
      learnerDays: 'journée(s)-apprenant',
      selectPlan: 'Sélectionner un Plan',
      selectPlanFirst: 'Veuillez sélectionner un plan ci-dessus pour voir les prix',
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

// Seat products come from their OWN endpoint, not from the plan catalogue.
// Seat plans are is_catalog=false so they never reach the public pricing page —
// which also means plansStore.entities does not contain them for a non-admin.
// Reading the catalogue here showed a trainer an empty page: the purchase screen
// could not see the only products it exists to sell.
const seatPlans = ref<PurchasableSeatPlan[]>([])
const canPurchase = ref(true)

const DAY_CHOICES = [1, 2, 3, 4, 5, 6, 7, 10]

const learners = ref(10)
const duration = ref<string>('3')

type Quote = { plan: PurchasableSeatPlan; quantity: number; total: number }
const quotes = ref<Quote[]>([])
const quoting = ref(false)
const quoteFailed = ref(false)

const selectedPlan = computed(() => seatPlans.value.find(p => p.id === selectedPlanId.value))

function unitLabel(unit: SeatUnit): string {
  return unit === 'learner_day' ? t('bulkPurchase.learnerDays') : t('bulkPurchase.seatMonths')
}

// How many units this order represents for a given product. The whole reason
// seat_unit exists: a day pack is priced per learner-day, so ten learners for
// three days is thirty units, while a monthly seat is priced per seat and the
// same order is ten. Nothing else distinguishes the two products.
function quantityFor(plan: PurchasableSeatPlan): number | null {
  const n = Math.max(1, Math.floor(learners.value || 0))
  if (plan.seat_unit === 'learner_day') {
    if (duration.value === 'month') return null // a day pack cannot express a month
    return n * Number(duration.value)
  }
  return n
}

function chooseQuote(q: Quote) {
  selectedPlanId.value = q.plan.id
  quantity.value = q.quantity
}

// What the PURCHASE sends, which is not what the quote prices.
//
// A quote is priced in billing units — ten learners for three days is thirty
// learner-days. The purchase must instead say who it covers and for how long, and
// let the backend derive the billing units, because sending the product made the
// backend create thirty month-long seats instead of ten three-day ones
// (ocf-core#455). Only one place may do that multiplication, and it is the
// backend's ResolvePackTerms.
function purchaseTermsFor(plan: PurchasableSeatPlan): { learners: number; durationDays: number } {
  const n = Math.max(1, Math.floor(learners.value || 0))
  if (plan.seat_unit === 'learner_day' && duration.value !== 'month') {
    return { learners: n, durationDays: Number(duration.value) }
  }
  return { learners: n, durationDays: 0 }
}

let quoteToken = 0

// Prices are fetched, never computed here: graduated pricing lives in exactly one
// place server-side, and a local implementation would quote a figure the invoice
// then contradicts.
async function refreshQuotes() {
  const token = ++quoteToken
  quoting.value = true
  quoteFailed.value = false
  try {
    const results: Quote[] = []
    for (const plan of seatPlans.value) {
      const qty = quantityFor(plan)
      if (!qty || qty < 1) continue
      const preview = await bulkLicenseService.getPricingPreview({
        subscriptionPlanId: plan.id,
        quantity: qty
      })
      results.push({ plan, quantity: qty, total: Number((preview as any)?.total_monthly_cost ?? 0) })
    }
    if (token !== quoteToken) return
    // Cheapest first: the recommendation is a sort, not a hard-coded rule, so it
    // stays correct when the ladders change.
    results.sort((a, b) => a.total - b.total)
    quotes.value = results
    if (results.length > 0) chooseQuote(results[0])
    else {
      selectedPlanId.value = ''
      quantity.value = 0
    }
  } catch {
    if (token !== quoteToken) return
    quotes.value = []
    quoteFailed.value = true
  } finally {
    if (token === quoteToken) quoting.value = false
  }
}

let quoteDebounce: ReturnType<typeof setTimeout> | undefined
watch([learners, duration], () => {
  if (quoteDebounce) clearTimeout(quoteDebounce)
  quoteDebounce = setTimeout(refreshQuotes, 300)
})

const selectedGroup = computed(() => {
  return groupsStore.entities.find((g: any) => g.id === selectedGroupId.value)
})

const groups = computed(() => {
  return groupsStore.entities.filter((g: any) => !g.archived_at && !g.is_expired)
})

// Methods
const formatCurrency = (amount: number | undefined): string => {
  return formatCurrencyUtil(amount ?? 0, 'EUR')
}

const handlePurchase = async () => {
  if (!selectedPlanId.value || quantity.value < 1) {
    error.value = t('bulkPurchase.purchaseError')
    return
  }

  isPurchasing.value = true
  error.value = ''

  try {
    // Capture the buyer's current batch count so the landing page can poll
    // until a NEW batch is provisioned. Stripe returns via a full page load, so
    // the landing page's store starts empty and can't know the pre-purchase
    // count itself — we thread it through the success URL as `prior=<N>`. A
    // repeat buyer already owns batches; a first-time buyer sends prior=0.
    try {
      await batchStore.loadBatches()
    } catch {
      // Non-fatal: fall back to whatever the store already holds.
    }
    const priorBatchCount = batchStore.batches.length

    // Create checkout URLs
    const successUrl = `${window.location.origin}/license-management?success=true&prior=${priorBatchCount}`
    const cancelUrl = `${window.location.origin}/bulk-license-purchase`

    // Create Stripe checkout session (will redirect to Stripe).
    //
    // Sends learners + duration, not the pre-multiplied figure the quote used.
    const terms = purchaseTermsFor(selectedPlan.value!)
    await batchStore.createBulkCheckoutSession(
      selectedPlanId.value,
      terms.learners,
      successUrl,
      cancelUrl,
      selectedGroupId.value || undefined,
      couponCode.value || undefined,
      terms.durationDays || undefined
    )

    // The store will redirect to Stripe automatically
    // If we reach here without redirect, show success (e.g., for free plans in future)
    successMessage.value = t('bulkPurchase.purchaseSuccess')
  } catch (err: any) {
    console.error('Purchase error:', err)
    error.value = extractErrorMessage(err, t('bulkPurchase.purchaseError'))
    isPurchasing.value = false
  }
  // Don't set isPurchasing to false here - redirect will happen
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
    const [seats] = await Promise.all([
      bulkLicenseService.getPurchasableSeatPlans(),
      groupsStore.loadEntities()
    ])

    canPurchase.value = !!seats?.can_purchase
    seatPlans.value = seats?.plans || []

    if (canPurchase.value && seatPlans.value.length > 0) {
      await refreshQuotes()
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
  min-height: 200px;
}

.purchase-section.calculator-section {
  min-height: 850px;
}

.purchase-section.section-disabled {
  opacity: 0.6;
  pointer-events: none;
}

.calculator-content {
  min-height: 750px;
}

.section-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-3xl);
  color: var(--color-text-muted);
  height: 750px;
  text-align: center;
}

.section-placeholder i {
  font-size: var(--font-size-4xl);
  opacity: 0.5;
}

.section-placeholder p {
  font-size: var(--font-size-base);
  margin: 0;
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
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-lg);
  max-width: 900px;
  margin: 0 auto;
  justify-content: center;
}

.plan-card {
  position: relative;
  flex: 0 0 280px;
  max-width: 280px;
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
  border: 1px solid var(--color-border-medium);
  border-radius: var(--border-radius-sm);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  transition: all var(--transition-fast);
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
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
  border: 1px solid var(--color-border-medium);
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

/* The two questions, and the quotes they produce. */
.ocf-order-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.ocf-order-field label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 600;
}

/* Reserved height: the quotes swap between calculating, error and results as the
   trainer edits, and the buy button must not move under the cursor. */
.ocf-quotes {
  min-height: 12rem;
  display: grid;
  gap: 0.75rem;
}

@media (max-width: 768px) {
  .ocf-order-form {
    grid-template-columns: 1fr;
  }
}
</style>
