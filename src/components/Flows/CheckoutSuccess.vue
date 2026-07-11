<!-- 
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */ 
-->

<template>
  <div class="checkout-success">
    <div class="success-container">
      <!-- Payment received, webhook still syncing the subscription: reassure the
           user their money landed instead of claiming an unverified activation. -->
      <div v-if="status === 'polling'" class="success-content pending-content">
        <div class="pending-spinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <div class="success-message">
          <h1>{{ t('checkoutSuccess.pendingTitle') }}</h1>
          <p class="lead">{{ t('checkoutSuccess.pendingActivating') }}</p>
        </div>
      </div>

      <!-- Poll budget drained without the webhook landing: still not an error —
           the payment is in, activation just trails. Offer a manual re-check. -->
      <div v-else-if="status === 'pending'" class="success-content pending-content">
        <div class="pending-icon">
          <i class="fas fa-clock"></i>
        </div>
        <div class="success-message">
          <h1>{{ t('checkoutSuccess.pendingTitle') }}</h1>
          <p class="lead">{{ t('checkoutSuccess.pendingMessage') }}</p>
        </div>
        <div class="pending-actions">
          <!-- Manual re-poll instead of an unbounded background poll: the budget
               already expired, so let the user decide when to re-check. -->
          <button class="btn btn-outline-primary" @click="pollForSubscription">
            <i class="fas fa-sync-alt"></i>
            {{ t('checkoutSuccess.refresh') }}
          </button>
          <router-link to="/subscription-dashboard" class="btn btn-primary">
            <i class="fas fa-tachometer-alt"></i>
            {{ t('checkoutSuccess.goToDashboard') }}
          </router-link>
        </div>
      </div>

      <!-- Activation confirmed: the welcome + subscription details are only
           shown once the subscription has actually landed. -->
      <div v-else class="success-content">
        <!-- Animation de succès -->
        <div class="success-animation">
          <div class="checkmark">
            <div class="checkmark-circle">
              <div class="checkmark-stem"></div>
              <div class="checkmark-kick"></div>
            </div>
          </div>
        </div>

        <!-- Message principal -->
        <div class="success-message">
          <h1>{{ t('checkoutSuccess.title') }}</h1>
          <p class="lead">{{ t('checkoutSuccess.subtitle') }}</p>
        </div>

        <!-- Détails de l'abonnement -->
        <div v-if="subscriptionDetails" class="subscription-details">
          <div class="details-card">
            <h3>{{ t('checkoutSuccess.subscriptionDetails') }}</h3>
            
            <div class="detail-row">
              <span class="label">{{ t('checkoutSuccess.plan') }}:</span>
              <span class="value">{{ subscriptionDetails.plan_name }}</span>
            </div>
            
            <div class="detail-row" v-if="subscriptionDetails.amount">
              <span class="label">{{ t('checkoutSuccess.amount') }}:</span>
              <span class="value">{{ formatPrice(subscriptionDetails.amount, subscriptionDetails.currency) }}</span>
            </div>
            
            <div class="detail-row" v-if="subscriptionDetails.billing_interval">
              <span class="label">{{ t('checkoutSuccess.billingInterval') }}:</span>
              <span class="value">{{ subscriptionDetails.billing_interval }}</span>
            </div>
            
            <div v-if="subscriptionDetails.current_period_end" class="billing-info">
              <i class="fas fa-calendar text-info"></i>
              {{ t('checkoutSuccess.nextBilling', { date: formatDate(subscriptionDetails.current_period_end) }) }}
            </div>
          </div>
        </div>
        
        <!-- Étapes suivantes -->
        <div class="next-steps">
          <h3>{{ t('checkoutSuccess.nextSteps') }}</h3>
          <div class="steps-grid">
            <div class="step-card">
              <div class="step-icon">
                <i class="fas fa-tachometer-alt"></i>
              </div>
              <div class="step-content">
                <h4>{{ t('checkoutSuccess.step1Title') }}</h4>
                <p>{{ t('checkoutSuccess.step1Description') }}</p>
                <router-link to="/subscription-dashboard" class="btn btn-outline-primary">
                  {{ t('checkoutSuccess.viewDashboard') }}
                </router-link>
              </div>
            </div>
            
            <div class="step-card">
              <div class="step-icon">
                <i class="fas fa-book"></i>
              </div>
              <div class="step-content">
                <h4>{{ t('checkoutSuccess.step2Title') }}</h4>
                <p>{{ t('checkoutSuccess.step2Description') }}</p>
                <router-link to="/courses" class="btn btn-outline-primary">
                  {{ t('checkoutSuccess.startCreating') }}
                </router-link>
              </div>
            </div>
            
            <div class="step-card">
              <div class="step-icon">
                <i class="fas fa-question-circle"></i>
              </div>
              <div class="step-content">
                <h4>{{ t('checkoutSuccess.step3Title') }}</h4>
                <p>{{ t('checkoutSuccess.step3Description') }}</p>
                <a :href="`mailto:${SUPPORT_EMAIL}`" class="btn btn-outline-secondary">
                  {{ t('checkoutSuccess.contactSupport') }}
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Actions principales -->
        <div class="main-actions">
          <router-link to="/subscription-dashboard" class="btn btn-primary btn-lg">
            <i class="fas fa-tachometer-alt"></i>
            {{ t('checkoutSuccess.goToDashboard') }}
          </router-link>
          
          <router-link to="/courses" class="btn btn-success btn-lg">
            <i class="fas fa-plus"></i>
            {{ t('checkoutSuccess.createFirstCourse') }}
          </router-link>
        </div>
        
        <!-- Email de confirmation -->
        <div class="email-notice">
          <i class="fas fa-envelope"></i>
          {{ t('checkoutSuccess.emailConfirmation') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSubscriptionsStore } from '../../stores/subscriptions'
import { useSubscriptionPlansStore } from '../../stores/subscriptionPlans'
import { useTranslations } from '../../composables/useTranslations'
import { SUPPORT_EMAIL } from '../../config/contact'

const { t } = useTranslations({
  en: {
    checkoutSuccess: {
      title: 'Welcome to Open Course Factory!',
      subtitle: 'Your subscription has been activated successfully.',
      pendingTitle: 'Payment received',
      pendingActivating: 'Activating your subscription…',
      pendingMessage: 'Your payment was received successfully. Activating your subscription may take a few moments. It will appear in your dashboard as soon as it is ready.',
      refresh: 'Refresh',
      subscriptionDetails: 'Subscription Details',
      plan: 'Plan',
      amount: 'Amount',
      billingInterval: 'Billing Cycle',
      nextBilling: 'Next billing on {date}',
      nextSteps: 'What\'s Next?',
      step1Title: 'Explore Your Dashboard',
      step1Description: 'View your subscription details, usage, and recent invoices.',
      step2Title: 'Create Your First Course',
      step2Description: 'Start building interactive courses with integrated labs.',
      step3Title: 'Need Help?',
      step3Description: 'Our support team is here to help you get started.',
      viewDashboard: 'View Dashboard',
      startCreating: 'Start Creating',
      contactSupport: 'Contact Support',
      goToDashboard: 'Go to Dashboard',
      createFirstCourse: 'Create First Course',
      emailConfirmation: 'A confirmation email has been sent to your inbox.'
    }
  },
  fr: {
    checkoutSuccess: {
      title: 'Bienvenue dans Open Course Factory !',
      subtitle: 'Votre abonnement a été activé avec succès.',
      pendingTitle: 'Paiement reçu',
      pendingActivating: 'Activation de votre abonnement en cours…',
      pendingMessage: 'Votre paiement a bien été reçu. L\'activation de votre abonnement peut prendre quelques instants. Il apparaîtra dans votre tableau de bord dès qu\'il sera prêt.',
      refresh: 'Actualiser',
      subscriptionDetails: 'Détails de l\'Abonnement',
      plan: 'Plan',
      amount: 'Montant',
      billingInterval: 'Cycle de Facturation',
      nextBilling: 'Prochaine facturation le {date}',
      nextSteps: 'Et Maintenant ?',
      step1Title: 'Explorez Votre Tableau de Bord',
      step1Description: 'Consultez vos détails d\'abonnement, utilisation et factures récentes.',
      step2Title: 'Créez Votre Premier Cours',
      step2Description: 'Commencez à créer des cours interactifs avec des labs intégrés.',
      step3Title: 'Besoin d\'Aide ?',
      step3Description: 'Notre équipe support est là pour vous aider à démarrer.',
      viewDashboard: 'Voir le Tableau de Bord',
      startCreating: 'Commencer à Créer',
      contactSupport: 'Contacter le Support',
      goToDashboard: 'Aller au Tableau de Bord',
      createFirstCourse: 'Créer le Premier Cours',
      emailConfirmation: 'Un email de confirmation a été envoyé dans votre boîte mail.'
    }
  }
})

useRoute()
const subscriptionsStore = useSubscriptionsStore()
const subscriptionPlansStore = useSubscriptionPlansStore()

const subscriptionDetails = ref(null)

// Drives the reassuring copy the just-paid user reads: 'polling' while we wait
// for the Stripe webhook to sync the subscription, 'activated' once it lands,
// 'pending' if the poll budget drains first (payment is in, activation trails).
const status = ref<'polling' | 'activated' | 'pending'>('polling')

// Poll getCurrentSubscription() until the webhook-synced subscription appears or
// the budget runs out. Also re-runnable on demand from the exhausted state so
// the user can re-check without an unbounded background poll.
async function pollForSubscription() {
  status.value = 'polling'
  const maxAttempts = 10
  const delayMs = 1000
  let attempts = 0

  try {
    while (attempts < maxAttempts) {
      await subscriptionsStore.getCurrentSubscription()

      if (subscriptionsStore.currentSubscription) {
        subscriptionDetails.value = subscriptionsStore.currentSubscription
        status.value = 'activated'
        return
      }

      attempts++
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    }

    // Webhook still hasn't landed — reassure rather than claim activation.
    status.value = 'pending'
  } catch (error) {
    console.error('Erreur lors du chargement de l\'abonnement:', error)
    status.value = 'pending'
  }
}

onMounted(pollForSubscription)

function formatPrice(amount: number, currency: string = 'EUR') {
  return subscriptionPlansStore.formatPrice(amount, currency)
}

function formatDate(dateString: string) {
  if (!dateString) return '-'
  try {
    return new Date(dateString).toLocaleDateString('fr-FR')
  } catch (e) {
    return dateString
  }
}
</script>

<style scoped>
.checkout-success {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.success-container {
  max-width: 800px;
  width: 100%;
}

.success-content {
  background: var(--color-surface);
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  box-shadow: var(--shadow-modal);
}

/* États d'attente (paiement reçu, activation en cours / différée) */
.pending-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.pending-spinner {
  font-size: 3rem;
  color: var(--color-primary);
}

.pending-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: var(--color-info-bg);
  color: var(--color-info-text);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
}

.pending-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

/* Animation de checkmark */
.success-animation {
  margin: 0 auto 30px auto;
}

.checkmark {
  width: 80px;
  height: 80px;
  margin: 0 auto;
  position: relative;
}

.checkmark-circle {
  width: 80px;
  height: 80px;
  position: relative;
  display: inline-block;
  vertical-align: top;
  border: 4px solid var(--color-success);
  border-radius: 50%;
  animation: checkmark-scale 0.3s ease-in-out 0.9s both;
}

.checkmark-stem {
  position: absolute;
  width: 5px;
  height: 18px;
  background-color: var(--color-success);
  left: 32px;
  top: 28px;
  transform: rotate(45deg);
  animation: checkmark-stem 0.3s ease-in-out 1.2s both;
}

.checkmark-kick {
  position: absolute;
  width: 12px;
  height: 5px;
  background-color: var(--color-success);
  left: 25px;
  top: 35px;
  transform: rotate(-45deg);
  animation: checkmark-kick 0.3s ease-in-out 1.5s both;
}

@keyframes checkmark-scale {
  0% { transform: scale(0); }
  100% { transform: scale(1); }
}

@keyframes checkmark-stem {
  0% { height: 0; }
  100% { height: 18px; }
}

@keyframes checkmark-kick {
  0% { width: 0; }
  100% { width: 12px; }
}

/* Messages */
.success-message {
  margin-bottom: 40px;
}

.success-message h1 {
  color: var(--color-text-primary);
  margin: 0 0 15px 0;
  font-size: 2.5rem;
  font-weight: 300;
}

.success-message .lead {
  font-size: 1.3rem;
  color: var(--color-text-muted);
  margin: 0;
}

/* Détails de l'abonnement */
.subscription-details {
  margin-bottom: 40px;
}

.details-card {
  background: var(--color-gray-50);
  border-radius: 12px;
  padding: 25px;
  margin: 0 auto;
  max-width: 400px;
}

.details-card h3 {
  margin: 0 0 20px 0;
  color: var(--color-text-primary);
  font-size: 1.3rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 8px 0;
}

.detail-row .label {
  font-weight: 600;
  color: var(--color-text-muted);
}

.detail-row .value {
  color: var(--color-text-primary);
  font-weight: 500;
}

.billing-info {
  margin-top: 20px;
  padding: 15px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
  background-color: var(--color-info-bg);
  color: var(--color-info-text);
}

/* Étapes suivantes */
.next-steps {
  margin-bottom: 40px;
}

.next-steps h3 {
  margin: 0 0 25px 0;
  color: var(--color-text-primary);
  font-size: 1.5rem;
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin: 25px 0;
}

.step-card {
  background: var(--color-gray-50);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  transition: transform 0.3s ease;
}

.step-card:hover {
  transform: translateY(-5px);
}

.step-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 15px auto;
  color: var(--color-white);
  font-size: 1.5rem;
}

.step-content h4 {
  margin: 0 0 10px 0;
  color: var(--color-text-primary);
  font-size: 1.1rem;
}

.step-content p {
  margin: 0 0 15px 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  line-height: 1.4;
}

/* Actions principales */
.main-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.email-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  margin-top: 20px;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: 2px solid transparent;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
}

.btn-lg {
  padding: 15px 25px;
  font-size: 16px;
}

.btn-primary {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-white);
}

.btn-success {
  background-color: var(--color-success);
  border-color: var(--color-success);
  color: var(--color-white);
}

.btn-outline-primary {
  background-color: transparent;
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.btn-outline-secondary {
  background-color: transparent;
  border-color: var(--color-gray-600);
  color: var(--color-gray-600);
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card);
}

/* Responsive */
@media (max-width: 768px) {
  .success-content {
    padding: 30px 20px;
  }
  
  .success-message h1 {
    font-size: 2rem;
  }
  
  .success-message .lead {
    font-size: 1.1rem;
  }
  
  .main-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .main-actions .btn {
    width: 100%;
    max-width: 300px;
  }
  
  .steps-grid {
    grid-template-columns: 1fr;
  }
}
</style>