<!-- 
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */ 
-->

<template>
  <div class="checkout-canceled">
    <div class="canceled-container">
      <div class="canceled-content">
        <!-- Icône d'annulation -->
        <div class="canceled-icon">
          <i class="fas fa-times-circle"></i>
        </div>
        
        <!-- Message principal -->
        <div class="canceled-message">
          <h1>{{ t('checkoutCanceled.title') }}</h1>
          <p class="lead">{{ t('checkoutCanceled.subtitle') }}</p>
        </div>
        
        <!-- Raisons possibles -->
        <div class="canceled-reasons">
          <h3>{{ t('checkoutCanceled.whyTitle') }}</h3>
          <div class="reasons-list">
            <div class="reason-item">
              <i class="fas fa-credit-card text-warning"></i>
              <span>{{ t('checkoutCanceled.reason1') }}</span>
            </div>
            <div class="reason-item">
              <i class="fas fa-clock text-info"></i>
              <span>{{ t('checkoutCanceled.reason2') }}</span>
            </div>
            <div class="reason-item">
              <i class="fas fa-shield-alt text-primary"></i>
              <span>{{ t('checkoutCanceled.reason3') }}</span>
            </div>
          </div>
        </div>
        
        <!-- Options disponibles -->
        <div class="next-actions">
          <h3>{{ t('checkoutCanceled.whatNext') }}</h3>
          
          <div class="actions-grid">
            <div class="action-card primary">
              <div class="action-icon">
                <i class="fas fa-redo"></i>
              </div>
              <div class="action-content">
                <h4>{{ t('checkoutCanceled.action1Title') }}</h4>
                <p>{{ t('checkoutCanceled.action1Description') }}</p>
                <button 
                  class="btn btn-primary"
                  @click="retryCheckout"
                  :disabled="!lastPlanId"
                >
                  {{ t('checkoutCanceled.retryPayment') }}
                </button>
              </div>
            </div>
            
            <div class="action-card">
              <div class="action-icon">
                <i class="fas fa-list"></i>
              </div>
              <div class="action-content">
                <h4>{{ t('checkoutCanceled.action2Title') }}</h4>
                <p>{{ t('checkoutCanceled.action2Description') }}</p>
                <router-link to="/subscription-plans" class="btn btn-outline-primary">
                  {{ t('checkoutCanceled.viewPlans') }}
                </router-link>
              </div>
            </div>
            
            <div class="action-card">
              <div class="action-icon">
                <i class="fas fa-question-circle"></i>
              </div>
              <div class="action-content">
                <h4>{{ t('checkoutCanceled.action3Title') }}</h4>
                <p>{{ t('checkoutCanceled.action3Description') }}</p>
                <a href="mailto:support@opencourse.factory" class="btn btn-outline-secondary">
                  {{ t('checkoutCanceled.contactSupport') }}
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Informations de sécurité -->
        <div class="security-info">
          <div class="security-card">
            <i class="fas fa-lock"></i>
            <div class="security-text">
              <h4>{{ t('checkoutCanceled.securityTitle') }}</h4>
              <p>{{ t('checkoutCanceled.securityDescription') }}</p>
            </div>
          </div>
        </div>
        
        <!-- Navigation alternative -->
        <div class="alternative-navigation">
          <p>{{ t('checkoutCanceled.alternativeText') }}</p>
          <div class="nav-actions">
            <router-link to="/courses" class="btn btn-outline-success">
              <i class="fas fa-book"></i>
              {{ t('checkoutCanceled.exploreCourses') }}
            </router-link>
            
            <router-link to="/subscription-dashboard" class="btn btn-outline-info">
              <i class="fas fa-tachometer-alt"></i>
              {{ t('checkoutCanceled.viewDashboard') }}
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTranslations } from '../../composables/useTranslations'

const { t } = useTranslations({
  en: {
    checkoutCanceled: {
      title: 'Payment Canceled',
      subtitle: 'Your payment was not completed. No charges were made to your account.',
      whyTitle: 'Why might this happen?',
      reason1: 'Payment method issue or insufficient funds',
      reason2: 'Session timeout or browser back button',
      reason3: 'Security verification required',
      whatNext: 'What would you like to do?',
      action1Title: 'Try Again',
      action1Description: 'Retry the payment with the same plan and settings.',
      action2Title: 'Choose Different Plan',
      action2Description: 'Browse our subscription plans and select another option.',
      action3Title: 'Get Help',
      action3Description: 'Contact our support team for assistance.',
      retryPayment: 'Retry Payment',
      viewPlans: 'View Plans',
      contactSupport: 'Contact Support',
      securityTitle: 'Your Security is Important',
      securityDescription: 'All payment processing is handled securely by Stripe. We never store your payment information.',
      alternativeText: 'In the meantime, you can explore our platform:',
      exploreCourses: 'Explore Courses',
      viewDashboard: 'View Dashboard'
    }
  },
  fr: {
    checkoutCanceled: {
      title: 'Paiement Annulé',
      subtitle: 'Votre paiement n\'a pas été finalisé. Aucun débit n\'a été effectué sur votre compte.',
      whyTitle: 'Pourquoi cela peut-il arriver ?',
      reason1: 'Problème de méthode de paiement ou fonds insuffisants',
      reason2: 'Session expirée ou bouton retour du navigateur',
      reason3: 'Vérification de sécurité requise',
      whatNext: 'Que souhaitez-vous faire ?',
      action1Title: 'Réessayer',
      action1Description: 'Relancer le paiement avec le même plan et paramètres.',
      action2Title: 'Choisir un Autre Plan',
      action2Description: 'Parcourir nos plans d\'abonnement et sélectionner une autre option.',
      action3Title: 'Obtenir de l\'Aide',
      action3Description: 'Contacter notre équipe support pour assistance.',
      retryPayment: 'Réessayer le Paiement',
      viewPlans: 'Voir les Plans',
      contactSupport: 'Contacter le Support',
      securityTitle: 'Votre Sécurité est Importante',
      securityDescription: 'Tous les paiements sont traités de manière sécurisée par Stripe. Nous ne stockons jamais vos informations de paiement.',
      alternativeText: 'En attendant, vous pouvez explorer notre plateforme :',
      exploreCourses: 'Explorer les Cours',
      viewDashboard: 'Voir le Tableau de Bord'
    }
  }
})

const route = useRoute()
const router = useRouter()

const lastPlanId = ref('')

onMounted(() => {
  // Récupérer l'ID du plan depuis les paramètres d'URL ou le localStorage
  lastPlanId.value = route.query.planId as string || localStorage.getItem('lastCheckoutPlan') || ''
})

function retryCheckout() {
  if (lastPlanId.value) {
    router.push({ name: 'Checkout', params: { planId: lastPlanId.value } })
  } else {
    router.push({ name: 'SubscriptionPlans' })
  }
}
</script>

<style scoped>
.checkout-canceled {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--color-accent-coral) 0%, var(--color-accent-coral-dark) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.canceled-container {
  max-width: 900px;
  width: 100%;
}

.canceled-content {
  background: white;
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

/* Icône d'annulation */
.canceled-icon {
  margin: 0 auto 30px auto;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: var(--color-danger);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2.5rem;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

/* Messages */
.canceled-message {
  margin-bottom: 40px;
}

.canceled-message h1 {
  color: var(--color-text-primary);
  margin: 0 0 15px 0;
  font-size: 2.5rem;
  font-weight: 300;
}

.canceled-message .lead {
  font-size: 1.2rem;
  color: var(--color-text-muted);
  margin: 0;
}

/* Raisons */
.canceled-reasons {
  margin-bottom: 40px;
  text-align: left;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.canceled-reasons h3 {
  text-align: center;
  margin: 0 0 25px 0;
  color: var(--color-text-primary);
  font-size: 1.5rem;
}

.reasons-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.reason-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: var(--color-gray-50);
  border-radius: 8px;
  font-size: 1rem;
  color: var(--color-gray-700);
}

.reason-item i {
  font-size: 1.2rem;
  width: 20px;
  text-align: center;
}

/* Actions suivantes */
.next-actions {
  margin-bottom: 40px;
}

.next-actions h3 {
  margin: 0 0 25px 0;
  color: var(--color-text-primary);
  font-size: 1.5rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 25px 0;
}

.action-card {
  background: var(--color-gray-50);
  border-radius: 12px;
  padding: 25px;
  text-align: center;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.action-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.action-card.primary {
  background: linear-gradient(135deg, var(--color-info-bg) 0%, var(--color-info-bg) 100%);
  border-color: var(--color-info);
}

.action-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 15px auto;
  color: white;
  font-size: 1.5rem;
}

.action-content h4 {
  margin: 0 0 10px 0;
  color: var(--color-text-primary);
  font-size: 1.2rem;
}

.action-content p {
  margin: 0 0 20px 0;
  color: var(--color-text-muted);
  font-size: 0.95rem;
  line-height: 1.4;
}

/* Informations de sécurité */
.security-info {
  margin-bottom: 30px;
}

.security-card {
  background: linear-gradient(135deg, var(--color-info-bg) 0%, var(--color-info-bg) 100%);
  border: 1px solid var(--color-info-border);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  text-align: left;
  max-width: 600px;
  margin: 0 auto;
}

.security-card i {
  font-size: 2rem;
  color: var(--color-primary);
  min-width: 40px;
}

.security-text h4 {
  margin: 0 0 8px 0;
  color: var(--color-text-primary);
  font-size: 1.1rem;
}

.security-text p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  line-height: 1.4;
}

/* Navigation alternative */
.alternative-navigation {
  border-top: 1px solid var(--color-gray-200);
  padding-top: 30px;
}

.alternative-navigation p {
  margin: 0 0 20px 0;
  color: var(--color-text-muted);
  font-size: 1rem;
}

.nav-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
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

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
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

.btn-outline-success {
  background-color: transparent;
  border-color: var(--color-success);
  color: var(--color-success);
}

.btn-outline-info {
  background-color: transparent;
  border-color: var(--color-info);
  color: var(--color-info);
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Couleurs des textes */
.text-warning { color: var(--color-warning); }
.text-info { color: var(--color-info); }
.text-primary { color: var(--color-primary); }

/* Responsive */
@media (max-width: 768px) {
  .canceled-content {
    padding: 30px 20px;
  }
  
  .canceled-message h1 {
    font-size: 2rem;
  }
  
  .canceled-message .lead {
    font-size: 1.1rem;
  }
  
  .actions-grid {
    grid-template-columns: 1fr;
  }
  
  .nav-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .nav-actions .btn {
    width: 100%;
    max-width: 300px;
  }
  
  .security-card {
    flex-direction: column;
    text-align: center;
  }
  
  .canceled-reasons {
    text-align: center;
  }
  
  .reasons-list {
    text-align: left;
  }
}
</style>