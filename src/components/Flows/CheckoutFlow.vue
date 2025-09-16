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
                  <div v-if="selectedPlan.max_lab_sessions" class="limit-item">
                    <i class="fas fa-flask"></i>
                    {{ selectedPlan.max_lab_sessions === -1 ? t('checkout.unlimited') : selectedPlan.max_lab_sessions }} {{ t('checkout.labSessions') }}
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
                        <div><strong>{{ address.country }}</strong></div>
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
              
              <!-- Formulaire nouvelle adresse -->
              <div v-if="showNewAddressForm || billingAddresses.length === 0" class="new-address-form">
                <h4 v-if="billingAddresses.length > 0">{{ t('checkout.newAddress') }}</h4>
                <h4 v-else>{{ t('checkout.billingAddress') }}</h4>
                
                <form @submit.prevent="addBillingAddress">
                  <div class="form-row">
                    <div class="form-group">
                      <label for="line1">{{ t('checkout.addressLine1') }} *</label>
                      <input 
                        id="line1"
                        v-model="newAddress.line1"
                        type="text"
                        class="form-control"
                        required
                      />
                    </div>
                  </div>
                  
                  <div class="form-row">
                    <div class="form-group">
                      <label for="line2">{{ t('checkout.addressLine2') }}</label>
                      <input 
                        id="line2"
                        v-model="newAddress.line2"
                        type="text"
                        class="form-control"
                      />
                    </div>
                  </div>
                  
                  <div class="form-row">
                    <div class="form-group col-md-6">
                      <label for="city">{{ t('checkout.city') }} *</label>
                      <input 
                        id="city"
                        v-model="newAddress.city"
                        type="text"
                        class="form-control"
                        required
                      />
                    </div>
                    <div class="form-group col-md-6">
                      <label for="postal_code">{{ t('checkout.postalCode') }} *</label>
                      <input 
                        id="postal_code"
                        v-model="newAddress.postal_code"
                        type="text"
                        class="form-control"
                        required
                      />
                    </div>
                  </div>
                  
                  <div class="form-row">
                    <div class="form-group col-md-6">
                      <label for="state">{{ t('checkout.state') }}</label>
                      <input 
                        id="state"
                        v-model="newAddress.state"
                        type="text"
                        class="form-control"
                      />
                    </div>
                    <div class="form-group col-md-6">
                      <label for="country">{{ t('checkout.country') }} *</label>
                      <input 
                        id="country"
                        v-model="newAddress.country"
                        type="text"
                        class="form-control"
                        required
                      />
                    </div>
                  </div>
                  
                  <div class="form-actions">
                    <button type="submit" class="btn btn-primary" :disabled="isAddingAddress">
                      <i :class="isAddingAddress ? 'fas fa-spinner fa-spin' : 'fas fa-plus'"></i>
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
                </form>
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
                  <div>{{ selectedBillingAddress?.country }}</div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSubscriptionPlansStore } from '../../stores/subscriptionPlans'
import { useSubscriptionsStore } from '../../stores/subscriptions'
import { useI18n } from 'vue-i18n'
import axios from 'axios'

const { t } = useI18n()
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
const newAddress = ref({
  line1: '',
  line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'France'
})

// Configuration des étapes
const steps = [
  { key: 'plan', title: 'Plan' },
  { key: 'billing', title: 'Facturation' },
  { key: 'review', title: 'Révision' }
]

// Traductions
useI18n().mergeLocaleMessage('en', {
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
    labSessions: 'lab sessions',
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
})

useI18n().mergeLocaleMessage('fr', {
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
    labSessions: 'sessions lab',
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
})

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

// Méthodes
onMounted(async () => {
  await loadInitialData()
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
    checkoutError.value = 'Erreur lors du chargement des données'
  }
}

async function loadSelectedPlan() {
  try {
    const response = await axios.get(`/subscription-plans/${planId.value}`)
    selectedPlan.value = response.data
  } catch (error) {
    console.error('Erreur lors du chargement du plan:', error)
    checkoutError.value = 'Plan non trouvé'
  }
}

async function loadBillingAddresses() {
  try {
    const response = await axios.get('/billing-addresses')
    billingAddresses.value = response.data || []
    
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

async function addBillingAddress() {
  isAddingAddress.value = true
  try {
    const response = await axios.post('/billing-addresses', newAddress.value)
    billingAddresses.value.push(response.data)
    selectedBillingAddress.value = response.data
    showNewAddressForm.value = false
    resetNewAddressForm()
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'adresse:', error)
    checkoutError.value = 'Erreur lors de l\'ajout de l\'adresse'
  } finally {
    isAddingAddress.value = false
  }
}

function resetNewAddressForm() {
  newAddress.value = {
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'France'
  }
}

async function validateCoupon() {
  if (!couponCode.value.trim()) return
  
  isValidatingCoupon.value = true
  try {
    const response = await axios.post('/subscriptions/validate-coupon', {
      coupon_code: couponCode.value,
      subscription_plan_id: planId.value
    })
    
    validatedCoupon.value = response.data
  } catch (error) {
    console.error('Erreur validation coupon:', error)
    checkoutError.value = 'Code promo invalide'
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
    
    await subscriptionsStore.createCheckoutSession(
      planId.value,
      successUrl,
      cancelUrl,
      validatedCoupon.value?.code
    )
    
    // La redirection vers Stripe se fait automatiquement dans le store
    
  } catch (error) {
    console.error('Erreur lors du checkout:', error)
    checkoutError.value = 'Erreur lors du traitement du paiement'
  } finally {
    isProcessing.value = false
  }
}
</script>

<style scoped>
.checkout-flow {
  min-height: 100vh;
  background-color: #f8f9fa;
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
  color: #333;
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
  background-color: #e9ecef;
  color: #6c757d;
  font-weight: 600;
  transition: all 0.3s ease;
}

.step.active .step-number {
  background-color: #007bff;
  color: white;
}

.step.completed .step-number {
  background-color: #28a745;
  color: white;
}

.step-label {
  font-size: 14px;
  font-weight: 500;
  color: #6c757d;
}

.step.active .step-label {
  color: #007bff;
}

.step.completed .step-label {
  color: #28a745;
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
  color: #333;
  border-bottom: 2px solid #f8f9fa;
  padding-bottom: 15px;
}

/* Plan summary */
.plan-card {
  border: 2px solid #e9ecef;
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
  color: #333;
}

.plan-price {
  font-size: 1.8rem;
  font-weight: bold;
  color: #28a745;
}

.billing-interval {
  font-size: 1rem;
  color: #6c757d;
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
  color: #495057;
  font-size: 14px;
}

.trial-info {
  background-color: #e8f5e9;
  border: 1px solid #c8e6c9;
  border-radius: 6px;
  padding: 15px;
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #2e7d32;
}

/* Coupon section */
.coupon-section {
  border-top: 1px solid #e9ecef;
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
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.address-option:hover {
  border-color: #007bff;
  background-color: #f8f9fa;
}

.address-option.selected {
  border-color: #007bff;
  background-color: #e3f2fd;
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
  background-color: #007bff;
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
  color: #495057;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #ced4da;
  border-radius: 6px;
  transition: border-color 0.3s ease;
}

.form-control:focus {
  outline: none;
  border-color: #007bff;
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
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 25px;
}

.order-summary h4 {
  margin: 0 0 20px 0;
  color: #333;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f8f9fa;
}

.summary-item:last-of-type {
  border-bottom: none;
}

.summary-item.discount {
  color: #28a745;
}

.summary-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0 0 0;
  margin-top: 20px;
  border-top: 2px solid #e9ecef;
  font-size: 1.3rem;
  font-weight: bold;
}

.trial-notice {
  background-color: #e8f5e9;
  border: 1px solid #c8e6c9;
  border-radius: 6px;
  padding: 15px;
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #2e7d32;
}

.selected-billing {
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 25px;
}

.selected-billing h4 {
  margin: 0 0 15px 0;
  color: #333;
}

.address-display {
  line-height: 1.6;
  color: #495057;
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
  color: #007bff;
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
  background-color: #007bff;
  border-color: #007bff;
  color: white;
}

.btn-success {
  background-color: #28a745;
  border-color: #28a745;
  color: white;
}

.btn-secondary {
  background-color: #6c757d;
  border-color: #6c757d;
  color: white;
}

.btn-outline-secondary {
  background-color: transparent;
  border-color: #6c757d;
  color: #6c757d;
}

.btn-outline-primary {
  background-color: transparent;
  border-color: #007bff;
  color: #007bff;
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
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

.alert-success {
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
}

.text-success { color: #28a745; }
.text-primary { color: #007bff; }
.text-muted { color: #6c757d; }

.loading-plan {
  text-align: center;
  padding: 60px 20px;
  color: #6c757d;
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