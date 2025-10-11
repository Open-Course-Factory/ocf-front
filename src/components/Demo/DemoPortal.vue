<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <div class="demo-portal">
    <div class="demo-container">
      <div class="demo-header">
        <div class="demo-badge">
          <i class="fas fa-flask"></i>
          {{ t('demoPortal.badge') }}
        </div>
        <h1>
          <i class="fas fa-cog"></i>
          {{ t('demoPortal.title') }}
        </h1>
      </div>

      <div class="portal-simulator">
        <div class="current-subscription">
          <h2>{{ t('demoPortal.currentSubscription') }}</h2>
          <div class="subscription-info">
            <div class="plan-name">{{ t('demoPortal.planName') }}</div>
            <div class="plan-price">{{ t('demoPortal.planPrice') }}</div>
            <div class="plan-status active">{{ t('demoPortal.statusActive') }}</div>
          </div>
        </div>

        <div class="portal-sections">
          <div class="portal-section">
            <h3>
              <i class="fas fa-credit-card"></i>
              {{ t('demoPortal.paymentMethods') }}
            </h3>
            <div class="payment-method">
              <i class="fab fa-cc-visa"></i>
              {{ t('demoPortal.cardInfo') }}
              <span class="default-badge">{{ t('demoPortal.defaultBadge') }}</span>
            </div>
            <button class="btn btn-outline-primary btn-sm">
              {{ t('demoPortal.addPaymentMethod') }}
            </button>
          </div>

          <div class="portal-section">
            <h3>
              <i class="fas fa-file-invoice"></i>
              {{ t('demoPortal.billingHistory') }}
            </h3>
            <div class="invoice-list">
              <div class="invoice-item">
                <span>Jan 15, 2025 - €29.00</span>
                <span class="status paid">{{ t('demoPortal.statusPaid') }}</span>
              </div>
              <div class="invoice-item">
                <span>Dec 15, 2024 - €29.00</span>
                <span class="status paid">{{ t('demoPortal.statusPaid') }}</span>
              </div>
            </div>
          </div>

          <div class="portal-section">
            <h3>
              <i class="fas fa-exchange-alt"></i>
              {{ t('demoPortal.changePlan') }}
            </h3>
            <p>{{ t('demoPortal.changePlanDesc') }}</p>
            <button class="btn btn-outline-primary btn-sm">
              {{ t('demoPortal.viewPlans') }}
            </button>
          </div>

          <div class="portal-section danger">
            <h3>
              <i class="fas fa-times-circle"></i>
              {{ t('demoPortal.cancelSubscription') }}
            </h3>
            <p>{{ t('demoPortal.cancelSubscriptionDesc') }}</p>
            <button class="btn btn-outline-danger btn-sm">
              {{ t('demoPortal.cancelSubscription') }}
            </button>
          </div>
        </div>

        <div class="portal-actions">
          <button
            class="btn btn-primary btn-lg"
            @click="returnToDashboard"
          >
            <i class="fas fa-arrow-left"></i>
            {{ t('demoPortal.returnToDashboard') }}
          </button>
        </div>

        <div class="demo-info">
          <h4>
            <i class="fas fa-info-circle"></i>
            {{ t('demoPortal.infoTitle') }}
          </h4>
          <ul>
            <li>{{ t('demoPortal.info1') }}</li>
            <li>{{ t('demoPortal.info2') }}</li>
            <li>{{ t('demoPortal.info3') }}</li>
            <li>{{ t('demoPortal.info4') }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { logDemoAction, simulateDelay } from '../../services/demoConfig'

const route = useRoute()
const i18n = useI18n()
const { t } = i18n

const sessionId = ref('')
const returnUrl = ref('')

onMounted(() => {
  sessionId.value = route.query.session_id as string || ''
  returnUrl.value = route.query.return_url as string || '/subscription-dashboard'

  logDemoAction('Demo portal page loaded', {
    sessionId: sessionId.value,
    returnUrl: returnUrl.value
  })

  // Add translations
  i18n.mergeLocaleMessage('en', {
    demoPortal: {
      badge: 'DEMO MODE - Simulated Portal',
      title: 'Demo Stripe Customer Portal',
      currentSubscription: 'Current Subscription',
      planName: 'Professional Plan',
      planPrice: '€29.00 / month',
      statusActive: 'Active',
      statusPaid: 'Paid',
      paymentMethods: 'Payment Methods',
      cardInfo: 'Visa •••• 4242',
      defaultBadge: 'Default',
      addPaymentMethod: 'Add Payment Method',
      billingHistory: 'Billing History',
      changePlan: 'Change Plan',
      changePlanDesc: 'Upgrade or downgrade your subscription',
      viewPlans: 'View Plans',
      cancelSubscription: 'Cancel Subscription',
      cancelSubscriptionDesc: 'Cancel your subscription (active until next billing cycle)',
      returnToDashboard: 'Return to Dashboard',
      infoTitle: 'Demo Portal Information',
      info1: 'This is a simulated Stripe Customer Portal',
      info2: 'No real billing operations are performed',
      info3: 'In production, this would be the actual Stripe portal',
      info4: 'Users can manage payment methods, view invoices, and change plans'
    }
  })

  i18n.mergeLocaleMessage('fr', {
    demoPortal: {
      badge: 'MODE DEMO - Portail Simulé',
      title: 'Portail Client Stripe Démo',
      currentSubscription: 'Abonnement Actuel',
      planName: 'Forfait Professionnel',
      planPrice: '29,00 € / mois',
      statusActive: 'Actif',
      statusPaid: 'Payé',
      paymentMethods: 'Moyens de Paiement',
      cardInfo: 'Visa •••• 4242',
      defaultBadge: 'Par défaut',
      addPaymentMethod: 'Ajouter un Moyen de Paiement',
      billingHistory: 'Historique de Facturation',
      changePlan: 'Changer de Forfait',
      changePlanDesc: 'Augmentez ou réduisez votre abonnement',
      viewPlans: 'Voir les Forfaits',
      cancelSubscription: 'Annuler l\'Abonnement',
      cancelSubscriptionDesc: 'Annuler votre abonnement (actif jusqu\'au prochain cycle de facturation)',
      returnToDashboard: 'Retour au Tableau de Bord',
      infoTitle: 'Informations sur le Portail Démo',
      info1: 'Ceci est un portail client Stripe simulé',
      info2: 'Aucune opération de facturation réelle n\'est effectuée',
      info3: 'En production, ce serait le véritable portail Stripe',
      info4: 'Les utilisateurs peuvent gérer les moyens de paiement, voir les factures et changer de forfait'
    }
  })
})

async function returnToDashboard() {
  logDemoAction('Returning from demo portal')
  await simulateDelay(500)
  window.location.href = returnUrl.value
}
</script>

<style scoped>
.demo-portal {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.demo-container {
  max-width: 800px;
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
  background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}

.demo-header h1 {
  margin: 0;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.current-subscription {
  background: #f8f9fa;
  padding: 30px;
  border-radius: 15px;
  margin-bottom: 40px;
  text-align: center;
}

.current-subscription h2 {
  margin: 0 0 20px 0;
  color: #333;
}

.subscription-info {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.plan-name {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
}

.plan-price {
  font-size: 1.2rem;
  color: #28a745;
  font-weight: 600;
}

.plan-status {
  padding: 5px 12px;
  border-radius: 15px;
  font-size: 0.9rem;
  font-weight: 600;
}

.plan-status.active {
  background: #d4edda;
  color: #155724;
}

.portal-sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.portal-section {
  border: 1px solid #e9ecef;
  border-radius: 10px;
  padding: 25px;
  background: #fafafa;
}

.portal-section.danger {
  border-color: #dc3545;
  background: #f8f9fa;
}

.portal-section h3 {
  margin: 0 0 15px 0;
  color: #333;
  display: flex;
  align-items: center;
  gap: 10px;
}

.portal-section.danger h3 {
  color: #dc3545;
}

.portal-section p {
  margin: 0 0 15px 0;
  color: #666;
}

.payment-method {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  background: white;
  border-radius: 8px;
  margin-bottom: 15px;
  font-weight: 500;
}

.default-badge {
  background: #007bff;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.8rem;
  margin-left: auto;
}

.invoice-list {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.invoice-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid #f8f9fa;
}

.invoice-item:last-child {
  border-bottom: none;
}

.status {
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status.paid {
  background: #d4edda;
  color: #155724;
}

.btn {
  padding: 8px 16px;
  border: 2px solid transparent;
  border-radius: 6px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 14px;
}

.btn-lg {
  padding: 15px 30px;
  font-size: 16px;
}

.btn-primary {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.btn-outline-primary {
  background: transparent;
  color: #007bff;
  border-color: #007bff;
}

.btn-outline-danger {
  background: transparent;
  color: #dc3545;
  border-color: #dc3545;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.portal-actions {
  text-align: center;
  margin-bottom: 30px;
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

  .subscription-info {
    flex-direction: column;
    gap: 10px;
  }

  .portal-sections {
    grid-template-columns: 1fr;
  }
}
</style>