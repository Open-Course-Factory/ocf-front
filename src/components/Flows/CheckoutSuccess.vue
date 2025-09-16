<!-- 
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */ 
-->

<template>
  <div class="checkout-success">
    <div class="success-container">
      <div class="success-content">
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
            
            <div v-if="subscriptionDetails.trial_end" class="trial-info">
              <i class="fas fa-gift text-success"></i>
              {{ t('checkoutSuccess.trialActive', { date: formatDate(subscriptionDetails.trial_end) }) }}
            </div>
            
            <div v-else-if="subscriptionDetails.current_period_end" class="billing-info">
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
                <a href="mailto:support@opencourse.factory" class="btn btn-outline-secondary">
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
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
useRoute()
const subscriptionsStore = useSubscriptionsStore()
const subscriptionPlansStore = useSubscriptionPlansStore()

const subscriptionDetails = ref(null)
const isLoading = ref(true)

// Traductions
useI18n().mergeLocaleMessage('en', {
  checkoutSuccess: {
    title: 'Welcome to Open Course Factory!',
    subtitle: 'Your subscription has been activated successfully.',
    subscriptionDetails: 'Subscription Details',
    plan: 'Plan',
    amount: 'Amount',
    billingInterval: 'Billing Cycle',
    trialActive: 'Your free trial is active until {date}',
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
})

useI18n().mergeLocaleMessage('fr', {
  checkoutSuccess: {
    title: 'Bienvenue dans Open Course Factory !',
    subtitle: 'Votre abonnement a été activé avec succès.',
    subscriptionDetails: 'Détails de l\'Abonnement',
    plan: 'Plan',
    amount: 'Montant',
    billingInterval: 'Cycle de Facturation',
    trialActive: 'Votre essai gratuit est actif jusqu\'au {date}',
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
})

onMounted(async () => {
  // Récupérer les détails de l'abonnement depuis l'API
  try {
    await subscriptionsStore.getCurrentSubscription()
    subscriptionDetails.value = subscriptionsStore.currentSubscription
  } catch (error) {
    console.error('Erreur lors du chargement de l\'abonnement:', error)
  } finally {
    isLoading.value = false
  }
})

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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  background: white;
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
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
  border: 4px solid #28a745;
  border-radius: 50%;
  animation: checkmark-scale 0.3s ease-in-out 0.9s both;
}

.checkmark-stem {
  position: absolute;
  width: 5px;
  height: 18px;
  background-color: #28a745;
  left: 32px;
  top: 28px;
  transform: rotate(45deg);
  animation: checkmark-stem 0.3s ease-in-out 1.2s both;
}

.checkmark-kick {
  position: absolute;
  width: 12px;
  height: 5px;
  background-color: #28a745;
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
  color: #333;
  margin: 0 0 15px 0;
  font-size: 2.5rem;
  font-weight: 300;
}

.success-message .lead {
  font-size: 1.3rem;
  color: #666;
  margin: 0;
}

/* Détails de l'abonnement */
.subscription-details {
  margin-bottom: 40px;
}

.details-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 25px;
  margin: 0 auto;
  max-width: 400px;
}

.details-card h3 {
  margin: 0 0 20px 0;
  color: #333;
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
  color: #666;
}

.detail-row .value {
  color: #333;
  font-weight: 500;
}

.trial-info, .billing-info {
  margin-top: 20px;
  padding: 15px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
}

.trial-info {
  background-color: #d4edda;
  color: #155724;
}

.billing-info {
  background-color: #d1ecf1;
  color: #0c5460;
}

/* Étapes suivantes */
.next-steps {
  margin-bottom: 40px;
}

.next-steps h3 {
  margin: 0 0 25px 0;
  color: #333;
  font-size: 1.5rem;
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin: 25px 0;
}

.step-card {
  background: #f8f9fa;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 15px auto;
  color: white;
  font-size: 1.5rem;
}

.step-content h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.1rem;
}

.step-content p {
  margin: 0 0 15px 0;
  color: #666;
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
  color: #666;
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
  background-color: #007bff;
  border-color: #007bff;
  color: white;
}

.btn-success {
  background-color: #28a745;
  border-color: #28a745;
  color: white;
}

.btn-outline-primary {
  background-color: transparent;
  border-color: #007bff;
  color: #007bff;
}

.btn-outline-secondary {
  background-color: transparent;
  border-color: #6c757d;
  color: #6c757d;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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