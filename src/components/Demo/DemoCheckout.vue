<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <div class="demo-checkout">
    <div class="demo-container">
      <div class="demo-header">
        <div class="demo-badge">
          <i class="fas fa-flask"></i>
          {{ t('demoCheckout.badge') }}
        </div>
        <h1>
          <i class="fas fa-credit-card"></i>
          {{ t('demoCheckout.title') }}
        </h1>
      </div>

      <div class="checkout-simulator">
        <div class="plan-summary">
          <h2>{{ planName }}</h2>
          <div class="amount">
            {{ formatAmount(amount, currency) }}
            <span class="billing-cycle">{{ t('demoCheckout.billingCycle') }}</span>
          </div>
        </div>

        <div class="demo-actions">
          <h3>{{ t('demoCheckout.simulateOutcome') }}</h3>

          <button
            class="btn btn-success btn-lg"
            @click="simulateSuccess"
            :disabled="isProcessing"
          >
            <i class="fas fa-check-circle"></i>
            {{ t('demoCheckout.simulateSuccess') }}
          </button>

          <button
            class="btn btn-danger"
            @click="simulateCancel"
            :disabled="isProcessing"
          >
            <i class="fas fa-times-circle"></i>
            {{ t('demoCheckout.simulateCancel') }}
          </button>

          <button
            class="btn btn-warning"
            @click="simulateError"
            :disabled="isProcessing"
          >
            <i class="fas fa-exclamation-triangle"></i>
            {{ t('demoCheckout.simulateError') }}
          </button>
        </div>

        <div v-if="isProcessing" class="processing">
          <i class="fas fa-spinner fa-spin fa-2x"></i>
          <p>{{ t('demoCheckout.processing') }}</p>
        </div>

        <div class="demo-info">
          <h4>
            <i class="fas fa-info-circle"></i>
            {{ t('demoCheckout.infoTitle') }}
          </h4>
          <ul>
            <li>{{ t('demoCheckout.info1') }}</li>
            <li>{{ t('demoCheckout.info2') }}</li>
            <li>{{ t('demoCheckout.info3') }}</li>
            <li>{{ t('demoCheckout.info4') }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTranslations } from '../../composables/useTranslations'
import { logDemoAction, simulateDelay } from '../../services/demo'

const route = useRoute()

const { t } = useTranslations({
  en: {
    demoCheckout: {
      badge: 'DEMO MODE - No real charges',
      title: 'Demo Stripe Checkout',
      billingCycle: '/ month',
      simulateOutcome: 'Simulate Payment Outcome:',
      simulateSuccess: 'Simulate Successful Payment',
      simulateCancel: 'Simulate Canceled Payment',
      simulateError: 'Simulate Payment Error',
      processing: 'Processing payment simulation...',
      infoTitle: 'Demo Information',
      info1: 'This is a simulated Stripe checkout page',
      info2: 'No real payment will be processed',
      info3: 'Click one of the buttons above to test different outcomes',
      info4: 'The subscription will be simulated in your account'
    }
  },
  fr: {
    demoCheckout: {
      badge: 'MODE DEMO - Aucun frais réel',
      title: 'Paiement Stripe Démo',
      billingCycle: '/ mois',
      simulateOutcome: 'Simuler le Résultat du Paiement:',
      simulateSuccess: 'Simuler un Paiement Réussi',
      simulateCancel: 'Simuler un Paiement Annulé',
      simulateError: 'Simuler une Erreur de Paiement',
      processing: 'Traitement de la simulation de paiement...',
      infoTitle: 'Informations de Démo',
      info1: 'Ceci est une page de paiement Stripe simulée',
      info2: 'Aucun paiement réel ne sera traité',
      info3: 'Cliquez sur l\'un des boutons ci-dessus pour tester différents résultats',
      info4: 'L\'abonnement sera simulé dans votre compte'
    }
  }
})

const sessionId = ref('')
const successUrl = ref('')
const cancelUrl = ref('')
const planName = ref('')
const amount = ref(0)
const currency = ref('eur')
const isProcessing = ref(false)

onMounted(() => {
  // Extract parameters from URL
  sessionId.value = route.query.session_id as string || ''
  successUrl.value = route.query.success_url as string || ''
  cancelUrl.value = route.query.cancel_url as string || ''
  planName.value = route.query.plan_name as string || 'Unknown Plan'
  amount.value = parseInt(route.query.amount as string) || 0
  currency.value = route.query.currency as string || 'eur'

  logDemoAction('Demo checkout page loaded', {
    sessionId: sessionId.value,
    planName: planName.value,
    amount: amount.value
  })
})

function formatAmount(cents: number, curr: string): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: curr.toUpperCase(),
  }).format(cents / 100)
}

async function simulateSuccess() {
  isProcessing.value = true
  logDemoAction('Simulating successful payment')

  await simulateDelay(3000) // Simulate payment processing time

  // Redirect to success URL
  window.location.href = successUrl.value
}

async function simulateCancel() {
  isProcessing.value = true
  logDemoAction('Simulating canceled payment')

  await simulateDelay(1000)

  // Redirect to cancel URL
  window.location.href = cancelUrl.value
}

async function simulateError() {
  isProcessing.value = true
  logDemoAction('Simulating payment error')

  await simulateDelay(2000)

  // Redirect to cancel URL with error parameter
  const errorUrl = new URL(cancelUrl.value)
  errorUrl.searchParams.set('error', 'payment_failed')
  window.location.href = errorUrl.toString()
}
</script>

<style scoped>
.demo-checkout {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.demo-container {
  max-width: 600px;
  width: 100%;
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.demo-header {
  text-align: center;
  margin-bottom: 40px;
}

.demo-badge {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.demo-header h1 {
  margin: 0;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.checkout-simulator {
  text-align: center;
}

.plan-summary {
  background: #f8f9fa;
  padding: 30px;
  border-radius: 15px;
  margin-bottom: 40px;
}

.plan-summary h2 {
  margin: 0 0 15px 0;
  color: #333;
}

.amount {
  font-size: 2.5rem;
  font-weight: bold;
  color: #28a745;
}

.billing-cycle {
  font-size: 1rem;
  color: #666;
  font-weight: normal;
}

.demo-actions {
  margin-bottom: 40px;
}

.demo-actions h3 {
  margin: 0 0 25px 0;
  color: #333;
}

.demo-actions .btn {
  display: block;
  width: 100%;
  margin-bottom: 15px;
  padding: 15px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
}

.demo-actions .btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.demo-actions .btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-success {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
}

.btn-danger {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  color: white;
}

.btn-warning {
  background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
  color: #212529;
}

.btn-lg {
  font-size: 18px;
  padding: 20px;
}

.processing {
  color: #007bff;
  margin: 30px 0;
}

.processing i {
  margin-bottom: 15px;
}

.demo-info {
  background: #e3f2fd;
  border: 1px solid #bbdefb;
  border-radius: 10px;
  padding: 20px;
  text-align: left;
}

.demo-info h4 {
  margin: 0 0 15px 0;
  color: #1976d2;
  display: flex;
  align-items: center;
  gap: 8px;
}

.demo-info ul {
  margin: 0;
  padding-left: 20px;
  color: #1976d2;
}

.demo-info li {
  margin-bottom: 8px;
  line-height: 1.4;
}

/* Responsive */
@media (max-width: 768px) {
  .demo-container {
    padding: 30px 20px;
  }

  .demo-header h1 {
    font-size: 1.8rem;
  }

  .amount {
    font-size: 2rem;
  }
}
</style>