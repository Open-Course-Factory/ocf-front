<!-- 
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */ 
-->

<template>
  <div class="checkout-flow">
    <div class="checkout-container">
      <!-- Header avec étapes -->
      <div class="checkout-header">
        <h1>
          <i class="fas fa-shopping-cart"></i>
          {{ t('checkout.title') }}
        </h1>
        
        <!-- Indicateur d'étapes -->
        <div class="checkout-steps">
          <div 
            v-for="(step, index) in steps" 
            :key="step.key"
            :class="['step', { 
              'active': currentStep === index, 
              'completed': index < currentStep,
              'disabled': index > currentStep 
            }]"
          >
            <div class="step-number">
              <i v-if="index < currentStep" class="fas fa-check"></i>
              <span v-else>{{ index + 1 }}</span>
            </div>
            <span class="step-label">{{ t(`checkout.steps.${step.key}`) }}</span>
          </div>
        </div>
      </div>

      <!-- Contenu principal -->
      <div class="checkout-content">
        <div class="checkout-main">
          <!-- Étape 1: Confirmation du plan -->
          <div v-if="currentStep === 0" class="step-content">
            <h2>{{ t('checkout.steps.plan') }}</h2>
            
            <div v-if="selectedPlan" class="plan-summary">
              <div class="plan-card">
                <div class="plan-header">
                  <h3>{{ selectedPlan.name }}</h3>
                  <div class="plan-price">
                    {{ formatPrice(selectedPlan.price_amount, selectedPlan.currency) }}
                    <span class="billing-interval">/ {{ selectedPlan.billing_interval }}</span>
                  </div>
                </div>
                
                <div class="plan-description" v-if="selectedPlan.description">
                  <p>{{ selectedPlan.description }}</p>
                </div>
                
                <div class="plan-features" v-if="selectedPlan.features && selectedPlan.features.length > 0">
                  <h4>{{ t('checkout.features') }}</h4>
                  <ul>
                    <li v-for="feature in selectedPlan.features" :key="feature">
                      <i class="fas fa-check text-success"></i>
                      {{ feature }}
                    </li>
                  </ul>
                </div>
                
                <div class="plan-limits">
                  <div v-if="selectedPlan.max_courses" class="limit-item">
                    <i class="fas fa-book"></i>
                    {{ selectedPlan.max_courses === -1 ? t('checkout.unlimited') : selectedPlan.max_courses }} {{ t('checkout.courses') }}
                  </div>
                  <div v-if="selectedPlan.max_concurrent_users" class="limit-item">
                    <i class="fas fa-users"></i>
                    {{ selectedPlan.max_concurrent_users === -1 ? t('checkout.unlimited') : selectedPlan.max_concurrent_users }} {{ t('checkout.users') }}
                  </div>
                </div>
                
                <div v-if="selectedPlan.trial_days > 0" class="trial-info">
                  <i class="fas fa-gift text-success"></i>
                  {{ t('checkout.trialDays', { days: selectedPlan.trial_days }) }}
                </div>
              </div>
              
              <!-- Code promo -->
              <div class="coupon-section">
                <div class="coupon-input">
                  <label for="couponCode">{{ t('checkout.couponCode') }}</label>
                  <div class="input-group">
                    <input 
                      id="couponCode"
                      v-model="couponCode"
                      type="text"
                      class="form-control"
                      :placeholder="t('checkout.couponPlaceholder')"
                      :disabled="isValidatingCoupon"
                    />
                    <button 
                      class="btn btn-outline-secondary"
                      @click="validateCoupon"
                      :disabled="!couponCode.trim() || isValidatingCoupon"
                    >
                      <i :class="isValidatingCoupon ? 'fas fa-spinner fa-spin' : 'fas fa-tag'"></i>
                      {{ t('checkout.applyCoupon') }}
                    </button>
                  </div>
                </div>
                
                <div v-if="validatedCoupon" class="coupon-applied">
                  <div class="alert alert-success">
                    <i class="fas fa-check-circle"></i>
                    {{ t('checkout.couponApplied', { code: validatedCoupon.code, discount: validatedCoupon.discount }) }}
                    <button class="btn btn-sm btn-outline-danger" @click="removeCoupon">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-else class="loading-plan">
              <i class="fas fa-spinner fa-spin fa-2x"></i>
              <p>{{ t('checkout.loadingPlan') }}</p>
            </div>
          </div>

          <!-- Étape 2: Adresse de facturation -->
          <div v-if="currentStep === 1" class="step-content">
            <h2>{{ t('checkout.steps.billing') }}</h2>
            
            <div class="billing-section">
              <!-- Adresses existantes -->
              <div v-if="billingAddresses.length > 0" class="existing-addresses">
                <h4>{{ t('checkout.selectAddress') }}</h4>
                <div class="address-options">
                  <div 
                    v-for="address in billingAddresses" 
                    :key="address.id"
                    :class="['address-option', { 'selected': selectedBillingAddress?.id === address.id }]"
                    @click="selectBillingAddress(address)"
                  >
                    <div class="address-content">
                      <div class="address-text">
                        <div><strong>{{ address.line1 }}</strong></div>
                        <div v-if="address.line2">{{ address.line2 }}</div>
                        <div>{{ address.postal_code }} {{ address.city }}</div>
                        <div v-if="address.state">{{ address.state }}</div>
                        <div><strong>{{ address.country ? getCountryName(address.country, 'fr') : address.country }}</strong></div>
                      </div>
                      <div v-if="address.is_default" class="default-badge">
                        <span class="badge badge-primary">{{ t('checkout.default') }}</span>
                      </div>
                    </div>
                    <div class="address-radio">
                      <i :class="selectedBillingAddress?.id === address.id ? 'fas fa-check-circle text-primary' : 'far fa-circle'"></i>
                    </div>
                  </div>
                </div>
                
                <div class="add-new-address">
                  <button class="btn btn-outline-primary" @click="showNewAddressForm = !showNewAddressForm">
                    <i class="fas fa-plus"></i>
                    {{ t('checkout.addNewAddress') }}
                  </button>
                </div>
              </div>
              
              <!-- Bouton pour ouvrir la modale d'ajout d'adresse -->
              <div v-if="showNewAddressForm || billingAddresses.length === 0" class="new-address-form">
                <h4 v-if="billingAddresses.length > 0">{{ t('checkout.newAddress') }}</h4>
                <h4 v-else>{{ t('checkout.billingAddress') }}</h4>

                <div class="add-address-section">
                  <button
                    type="button"
                    class="btn btn-primary"
                    @click="showAddressModal = true"
                  >
                    <i class="fas fa-plus"></i>
                    {{ t('checkout.addAddress') }}
                  </button>
                  <button
                    v-if="billingAddresses.length > 0"
                    type="button"
                    class="btn btn-secondary"
                    @click="showNewAddressForm = false"
                  >
                    {{ t('checkout.cancel') }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Étape 3: Révision et paiement -->
          <div v-if="currentStep === 2" class="step-content">
            <h2>{{ t('checkout.steps.review') }}</h2>
            
            <div class="checkout-review">
              <!-- Résumé de la commande -->
              <div class="order-summary">
                <h4>{{ t('checkout.orderSummary') }}</h4>
                
                <div class="summary-item">
                  <span class="item-description">
                    {{ selectedPlan?.name }}
                    <small>({{ selectedPlan?.billing_interval }})</small>
                  </span>
                  <span class="item-price">
                    {{ formatPrice(selectedPlan?.price_amount || 0, selectedPlan?.currency) }}
                  </span>
                </div>
                
                <div v-if="validatedCoupon" class="summary-item discount">
                  <span class="item-description">
                    {{ t('checkout.discount') }} ({{ validatedCoupon.code }})
                  </span>
                  <span class="item-price text-success">
                    -{{ validatedCoupon.discount }}
                  </span>
                </div>
                
                <div class="summary-total">
                  <span class="total-label">{{ t('checkout.total') }}</span>
                  <span class="total-price">
                    {{ calculateTotal() }}
                  </span>
                </div>
                
                <div v-if="selectedPlan?.trial_days > 0" class="trial-notice">
                  <i class="fas fa-gift text-success"></i>
                  {{ t('checkout.trialNotice', { days: selectedPlan.trial_days }) }}
                </div>
              </div>
              
              <!-- Adresse sélectionnée -->
              <div class="selected-billing">
                <h4>{{ t('checkout.billingAddress') }}</h4>
                <div class="address-display">
                  <div>{{ selectedBillingAddress?.line1 }}</div>
                  <div v-if="selectedBillingAddress?.line2">{{ selectedBillingAddress.line2 }}</div>
                  <div>{{ selectedBillingAddress?.postal_code }} {{ selectedBillingAddress?.city }}</div>
                  <div v-if="selectedBillingAddress?.state">{{ selectedBillingAddress.state }}</div>
                  <div>{{ selectedBillingAddress?.country ? getCountryName(selectedBillingAddress.country, 'fr') : '' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar avec actions -->
        <div class="checkout-sidebar">
          <!-- Erreurs globales -->
          <div v-if="checkoutError" class="alert alert-danger">
            <i class="fas fa-exclamation-triangle"></i>
            {{ checkoutError }}
          </div>
          
          <!-- Actions de navigation -->
          <div class="checkout-actions">
            <button 
              v-if="currentStep > 0"
              class="btn btn-outline-secondary btn-block"
              @click="previousStep"
              :disabled="isProcessing"
            >
              <i class="fas fa-arrow-left"></i>
              {{ t('checkout.previous') }}
            </button>
            
            <button 
              v-if="currentStep < steps.length - 1"
              class="btn btn-primary btn-block"
              @click="nextStep"
              :disabled="!canContinue || isProcessing"
            >
              <i class="fas fa-arrow-right"></i>
              {{ t('checkout.continue') }}
            </button>
            
            <button 
              v-if="currentStep === steps.length - 1"
              class="btn btn-success btn-block btn-lg"
              @click="processCheckout"
              :disabled="!canContinue || isProcessing"
            >
              <i :class="isProcessing ? 'fas fa-spinner fa-spin' : 'fas fa-credit-card'"></i>
              {{ isProcessing ? t('checkout.processing') : t('checkout.subscribe') }}
            </button>
          </div>
          
          <div class="checkout-help">
            <p class="text-muted">
              <i class="fas fa-lock"></i>
              {{ t('checkout.securePayment') }}
            </p>
            <p class="text-muted">
              <i class="fas fa-question-circle"></i>
              <a href="mailto:support@opencourse.factory">{{ t('checkout.needHelp') }}</a>
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Billing Address Modal -->
    <BillingAddressModal
      :visible="showAddressModal"
      :is-loading="isAddingAddress"
      @close="showAddressModal = false"
      @submit="addBillingAddress"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSubscriptionPlansStore } from '../../stores/subscriptionPlans'
import { useSubscriptionsStore } from '../../stores/subscriptions'
import { useTranslations } from '../../composables/useTranslations'
import axios from 'axios'
import { getCountryName } from '../../services/data'
import BillingAddressModal from '../Modals/BillingAddressModal.vue'

const { t } = useTranslations({
  en: {
    checkoutFlow: {
      planNotFound: 'Plan not found',
      errorLoading: 'Error loading data',
      errorLoadingPlan: 'Error loading plan',
      errorLoadingAddresses: 'Error loading addresses',
      errorAddingAddress: 'Error adding address',
      invalidCoupon: 'Invalid coupon code',
      errorProcessing: 'Error processing payment'
    },
    checkout: {
      title: 'Checkout',
      steps: {
        plan: 'Plan Selection',
        billing: 'Billing Address',
        review: 'Review & Pay'
      },
      features: 'Features',
      unlimited: 'Unlimited',
      courses: 'courses',
      users: 'concurrent users',
      trialDays: '{days} days free trial',
      couponCode: 'Coupon Code',
      couponPlaceholder: 'Enter coupon code',
      applyCoupon: 'Apply',
      couponApplied: 'Coupon {code} applied: {discount}',
      loadingPlan: 'Loading plan details...',
      selectAddress: 'Select billing address',
      default: 'Default',
      addNewAddress: 'Add new address',
      newAddress: 'New address',
      billingAddress: 'Billing address',
      addressLine1: 'Address line 1',
      addressLine2: 'Address line 2',
      city: 'City',
      postalCode: 'Postal code',
      state: 'State',
      country: 'Country',
      addAddress: 'Add address',
      cancel: 'Cancel',
      orderSummary: 'Order Summary',
      discount: 'Discount',
      total: 'Total',
      trialNotice: 'Free for {days} days, then billed {interval}',
      previous: 'Previous',
      continue: 'Continue',
      subscribe: 'Subscribe',
      processing: 'Processing...',
      securePayment: 'Secure payment with Stripe',
      needHelp: 'Need help?'
    }
  },
  fr: {
    checkoutFlow: {
      planNotFound: 'Plan non trouvé',
      errorLoading: 'Erreur lors du chargement des données',
      errorLoadingPlan: 'Erreur lors du chargement du plan',
      errorLoadingAddresses: 'Erreur lors du chargement des adresses',
      errorAddingAddress: 'Erreur lors de l\'ajout de l\'adresse',
      invalidCoupon: 'Code promo invalide',
      errorProcessing: 'Erreur lors du traitement du paiement'
    },
    checkout: {
      title: 'Commande',
      steps: {
        plan: 'Sélection du plan',
        billing: 'Adresse de facturation',
        review: 'Révision et paiement'
      },
      features: 'Fonctionnalités',
      unlimited: 'Illimité',
      courses: 'cours',
      users: 'utilisateurs concurrents',
      trialDays: '{days} jours d\'essai gratuit',
      couponCode: 'Code promo',
      couponPlaceholder: 'Entrez votre code promo',
      applyCoupon: 'Appliquer',
      couponApplied: 'Code {code} appliqué : {discount}',
      loadingPlan: 'Chargement du plan...',
      selectAddress: 'Sélectionnez une adresse de facturation',
      default: 'Défaut',
      addNewAddress: 'Ajouter une nouvelle adresse',
      newAddress: 'Nouvelle adresse',
      billingAddress: 'Adresse de facturation',
      addressLine1: 'Adresse ligne 1',
      addressLine2: 'Adresse ligne 2',
      city: 'Ville',
      postalCode: 'Code postal',
      state: 'État/Province',
      country: 'Pays',
      addAddress: 'Ajouter l\'adresse',
      cancel: 'Annuler',
      orderSummary: 'Résumé de la commande',
      discount: 'Remise',
      total: 'Total',
      trialNotice: 'Gratuit pendant {days} jours, puis facturé',
      previous: 'Précédent',
      continue: 'Continuer',
      subscribe: 'S\'abonner',
      processing: 'Traitement...',
      securePayment: 'Paiement sécurisé avec Stripe',
      needHelp: 'Besoin d\'aide ?'
    }
  }
})

const route = useRoute()
// const router = useRouter()

// Stores
const subscriptionPlansStore = useSubscriptionPlansStore()
// const billingAddressesStore = useBillingAddressesStore()
const subscriptionsStore = useSubscriptionsStore()

// État du checkout
const currentStep = ref(0)
const isProcessing = ref(false)
const checkoutError = ref('')

// Plan sélectionné
const planId = ref(route.params.planId as string)
const selectedPlan = ref(null)

// Code promo
const couponCode = ref('')
const isValidatingCoupon = ref(false)
const validatedCoupon = ref(null)

// Adresses de facturation
const billingAddresses = ref([])
const selectedBillingAddress = ref(null)
const showNewAddressForm = ref(false)
const isAddingAddress = ref(false)
const showAddressModal = ref(false)

// Configuration des étapes
const steps = [
  { key: 'plan', title: 'Plan' },
  { key: 'billing', title: 'Facturation' },
  { key: 'review', title: 'Révision' }
]

// Méthodes
onMounted(async () => {
  await loadInitialData();
});

// Computed
const formatPrice = computed(() => subscriptionPlansStore.formatPrice)

const canContinue = computed(() => {
  switch (currentStep.value) {
    case 0: return !!selectedPlan.value
    case 1: return !!selectedBillingAddress.value
    case 2: return !!selectedPlan.value && !!selectedBillingAddress.value
    default: return false
  }
})

async function loadInitialData() {
  try {
    // Charger le plan sélectionné
    if (planId.value) {
      await loadSelectedPlan()
    }
    
    // Charger les adresses de facturation
    await loadBillingAddresses()
    
  } catch (error) {
    console.error('Erreur lors du chargement:', error)
    checkoutError.value = t('checkoutFlow.errorLoading')
  }
}

async function loadSelectedPlan() {
  try {
    const response = await axios.get(`/subscription-plans/${planId.value}`)
    selectedPlan.value = response.data
  } catch (error) {
    console.error('Erreur lors du chargement du plan:', error)
    checkoutError.value = t('checkoutFlow.planNotFound')
  }
}

async function loadBillingAddresses() {
  try {
    const response = await axios.get('/billing-addresses')
    billingAddresses.value = response.data?.data || response.data || []

    // Sélectionner l'adresse par défaut
    const defaultAddress = billingAddresses.value.find(addr => addr.is_default)
    if (defaultAddress) {
      selectedBillingAddress.value = defaultAddress
    }
  } catch (error) {
    console.error('Erreur lors du chargement des adresses:', error)
    billingAddresses.value = []
  }
}

function selectBillingAddress(address: any) {
  selectedBillingAddress.value = address
}

async function addBillingAddress(addressData: any) {
  isAddingAddress.value = true
  try {
    const response = await axios.post('/billing-addresses', addressData)
    billingAddresses.value.push(response.data)
    selectedBillingAddress.value = response.data
    showNewAddressForm.value = false
    showAddressModal.value = false
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'adresse:', error)
    checkoutError.value = t('checkoutFlow.errorAddingAddress')
  } finally {
    isAddingAddress.value = false
  }
}


async function validateCoupon() {
  if (!couponCode.value.trim()) return
  
  isValidatingCoupon.value = true
  try {
    const response = await axios.post('/user-subscriptions/validate-coupon', {
      coupon_code: couponCode.value,
      subscription_plan_id: planId.value
    })
    
    validatedCoupon.value = response.data
  } catch (error) {
    console.error('Erreur validation coupon:', error)
    checkoutError.value = t('checkoutFlow.invalidCoupon')
  } finally {
    isValidatingCoupon.value = false
  }
}

function removeCoupon() {
  validatedCoupon.value = null
  couponCode.value = ''
}

function calculateTotal() {
  if (!selectedPlan.value) return '0 €'
  
  let amount = selectedPlan.value.price_amount
  
  // Appliquer la remise si coupon valide
  if (validatedCoupon.value) {
    if (validatedCoupon.value.type === 'percent') {
      amount = amount * (1 - validatedCoupon.value.value / 100)
    } else {
      amount = Math.max(0, amount - validatedCoupon.value.value)
    }
  }
  
  return subscriptionPlansStore.formatPrice(amount, selectedPlan.value.currency)
}

function nextStep() {
  if (canContinue.value && currentStep.value < steps.length - 1) {
    currentStep.value++
    checkoutError.value = ''
  }
}

function previousStep() {
  if (currentStep.value > 0) {
    currentStep.value--
    checkoutError.value = ''
  }
}

async function processCheckout() {
  if (!canContinue.value) return

  isProcessing.value = true
  checkoutError.value = ''

  try {
    const successUrl = `${window.location.origin}/subscription-dashboard?success=true`
    const cancelUrl = `${window.location.origin}/checkout/${planId.value}?canceled=true`

    // Check if this is an upgrade from free plan
    const isUpgradeFromFree = route.query.upgradeFromFree === 'true'

    const response = await subscriptionsStore.createCheckoutSession(
      planId.value,
      successUrl,
      cancelUrl,
      validatedCoupon.value?.code,
      isUpgradeFromFree // Pass allowReplace flag
    )

    // Handle free plan activation (no Stripe redirect)
    if (response?.free_plan) {
      // Redirect to success page
      window.location.href = successUrl
      return
    }

    // For paid plans, redirection to Stripe happens automatically in the store

  } catch (error) {
    console.error('Erreur lors du checkout:', error)
    checkoutError.value = t('checkoutFlow.errorProcessing')
  } finally {
    isProcessing.value = false
  }
}
</script>

<style scoped>
.checkout-flow {
  min-height: 100vh;
  background-color: var(--color-gray-50);
  padding: 20px 0;
}

.checkout-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.checkout-header {
  text-align: center;
  margin-bottom: 40px;
}

.checkout-header h1 {
  margin: 0 0 30px 0;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.checkout-steps {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 20px;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
}

.step.disabled {
  opacity: 0.5;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-gray-200);
  color: var(--color-gray-600);
  font-weight: 600;
  transition: all 0.3s ease;
}

.step.active .step-number {
  background-color: var(--color-primary);
  color: white;
}

.step.completed .step-number {
  background-color: var(--color-success);
  color: white;
}

.step-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-gray-600);
}

.step.active .step-label {
  color: var(--color-primary);
}

.step.completed .step-label {
  color: var(--color-success);
}

.checkout-content {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 40px;
}

.step-content {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.step-content h2 {
  margin: 0 0 25px 0;
  color: var(--color-text-primary);
  border-bottom: 2px solid var(--color-gray-50);
  padding-bottom: 15px;
}

/* Plan summary */
.plan-card {
  border: 2px solid var(--color-gray-200);
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 25px;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.plan-header h3 {
  margin: 0;
  color: var(--color-text-primary);
}

.plan-price {
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--color-success);
}

.billing-interval {
  font-size: 1rem;
  color: var(--color-gray-600);
  font-weight: normal;
}

.plan-features ul {
  list-style: none;
  padding: 0;
  margin: 15px 0;
}

.plan-features li {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.plan-limits {
  display: flex;
  gap: 20px;
  margin: 20px 0;
  flex-wrap: wrap;
}

.limit-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-gray-700);
  font-size: 14px;
}

.trial-info {
  background-color: var(--color-success-bg);
  border: 1px solid #c8e6c9;
  border-radius: 6px;
  padding: 15px;
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--color-success-text);
}

/* Coupon section */
.coupon-section {
  border-top: 1px solid var(--color-gray-200);
  padding-top: 25px;
  margin-top: 25px;
}

.input-group {
  display: flex;
  gap: 10px;
}

.input-group .form-control {
  flex: 1;
}

.coupon-applied .alert {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
}

/* Billing addresses */
.address-options {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}

.address-option {
  border: 2px solid var(--color-gray-200);
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.address-option:hover {
  border-color: var(--color-primary);
  background-color: var(--color-gray-50);
}

.address-option.selected {
  border-color: var(--color-primary);
  background-color: var(--color-info-bg);
}

.address-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.address-text {
  line-height: 1.5;
}

.default-badge .badge {
  background-color: var(--color-primary);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.address-radio {
  font-size: 1.2rem;
  margin-left: 15px;
}

/* Forms */
.form-row {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.form-group {
  flex: 1;
}

.form-group.col-md-6 {
  flex: 0 0 calc(50% - 7.5px);
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--color-gray-700);
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid var(--color-gray-400);
  border-radius: 6px;
  transition: border-color 0.3s ease;
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.form-actions {
  display: flex;
  gap: 15px;
  margin-top: 25px;
}

/* Checkout review */
.checkout-review {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.order-summary {
  border: 2px solid var(--color-gray-200);
  border-radius: 12px;
  padding: 25px;
}

.order-summary h4 {
  margin: 0 0 20px 0;
  color: var(--color-text-primary);
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-gray-50);
}

.summary-item:last-of-type {
  border-bottom: none;
}

.summary-item.discount {
  color: var(--color-success);
}

.summary-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0 0 0;
  margin-top: 20px;
  border-top: 2px solid var(--color-gray-200);
  font-size: 1.3rem;
  font-weight: bold;
}

.trial-notice {
  background-color: var(--color-success-bg);
  border: 1px solid #c8e6c9;
  border-radius: 6px;
  padding: 15px;
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--color-success-text);
}

.selected-billing {
  border: 2px solid var(--color-gray-200);
  border-radius: 12px;
  padding: 25px;
}

.selected-billing h4 {
  margin: 0 0 15px 0;
  color: var(--color-text-primary);
}

.address-display {
  line-height: 1.6;
  color: var(--color-gray-700);
}

/* Sidebar */
.checkout-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.checkout-actions {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.checkout-help {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.checkout-help p {
  margin: 0 0 10px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.checkout-help a {
  color: var(--color-primary);
  text-decoration: none;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border: 2px solid transparent;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-block {
  width: 100%;
}

.btn-lg {
  padding: 15px 25px;
  font-size: 16px;
}

.btn-primary {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.btn-success {
  background-color: var(--color-success);
  border-color: var(--color-success);
  color: white;
}

.btn-secondary {
  background-color: var(--color-gray-600);
  border-color: var(--color-gray-600);
  color: white;
}

.btn-outline-secondary {
  background-color: transparent;
  border-color: var(--color-gray-600);
  color: var(--color-gray-600);
}

.btn-outline-primary {
  background-color: transparent;
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* Utilities */
.alert {
  padding: 15px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.alert-danger {
  background-color: var(--color-danger-bg);
  border: 1px solid var(--color-danger-border);
  color: var(--color-danger-text);
}

.alert-success {
  background-color: var(--color-success-bg);
  border: 1px solid var(--color-success-border);
  color: var(--color-success-text);
}

.text-success { color: var(--color-success); }
.text-primary { color: var(--color-primary); }
.text-muted { color: var(--color-gray-600); }

.loading-plan {
  text-align: center;
  padding: 60px 20px;
  color: var(--color-gray-600);
}

/* Responsive */
@media (max-width: 768px) {
  .checkout-content {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .checkout-steps {
    gap: 20px;
  }
  
  .step-label {
    display: none;
  }
  
  .plan-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .plan-limits {
    flex-direction: column;
    gap: 10px;
  }
  
  .form-row {
    flex-direction: column;
    gap: 0;
  }
  
  .form-group.col-md-6 {
    flex: 1;
  }
  
  .address-content {
    flex-direction: column;
    gap: 15px;
  }
}
</style>