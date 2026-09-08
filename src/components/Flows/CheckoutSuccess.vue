<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Return page from Stripe Checkout. An ordinary page of the application, not a
 * splash screen: the buyer is signed in and the next thing they do happens in
 * the app around this page.
 */
-->

<template>
  <div class="ocf-checkout-success-page">
    <div class="ocf-checkout-success-column">
      <!-- Payment received, webhook still syncing the subscription: reassure the
           user their money landed instead of claiming an unverified activation. -->
      <template v-if="status === 'polling'">
        <div class="page-header">
          <div>
            <h2>{{ t('checkoutSuccess.pendingTitle') }}</h2>
            <p class="page-subtitle">{{ t('checkoutSuccess.pendingActivating') }}</p>
          </div>
        </div>
        <div class="ocf-checkout-status ocf-checkout-status--pending" data-test="pending-state">
          <i class="fas fa-spinner fa-spin"></i>
          <span>{{ t('checkoutSuccess.pendingActivating') }}</span>
        </div>
      </template>

      <!-- Poll budget drained without the webhook landing: still not an error —
           the payment is in, activation just trails. Offer a manual re-check. -->
      <template v-else-if="status === 'pending'">
        <div class="page-header">
          <div>
            <h2>{{ t('checkoutSuccess.pendingTitle') }}</h2>
            <p class="page-subtitle">{{ t('checkoutSuccess.pendingMessage') }}</p>
          </div>
        </div>
        <div class="ocf-checkout-actions">
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
      </template>

      <!-- Activation confirmed: the details and the next step are only shown
           once the subscription has actually landed. -->
      <template v-else>
        <div class="page-header">
          <div>
            <h2>{{ t('checkoutSuccess.title') }}</h2>
            <p class="page-subtitle">{{ t('checkoutSuccess.subtitle') }}</p>
          </div>
        </div>

        <div class="ocf-checkout-status ocf-checkout-status--ok" data-test="activated-state">
          <i class="fas fa-check-circle"></i>
          <span>{{ t('checkoutSuccess.activated') }}</span>
        </div>

        <!-- What was bought -->
        <section v-if="planDetails" class="ocf-checkout-card" data-test="subscription-details">
          <h3>{{ t('checkoutSuccess.subscriptionDetails') }}</h3>
          <dl class="ocf-checkout-details">
            <div class="ocf-checkout-detail">
              <dt>{{ t('checkoutSuccess.plan') }}</dt>
              <dd>{{ planDetails.name }}</dd>
            </div>
            <div v-if="planDetails.amount" class="ocf-checkout-detail">
              <dt>{{ t('checkoutSuccess.amount') }}</dt>
              <dd>{{ formatPrice(planDetails.amount, planDetails.currency) }}</dd>
            </div>
            <div v-if="planDetails.interval" class="ocf-checkout-detail">
              <dt>{{ t('checkoutSuccess.billingInterval') }}</dt>
              <dd>{{ planDetails.interval }}</dd>
            </div>
            <div v-if="planDetails.periodEnd" class="ocf-checkout-detail">
              <dt>{{ t('checkoutSuccess.nextBillingLabel') }}</dt>
              <dd>{{ formatDate(planDetails.periodEnd) }}</dd>
            </div>
          </dl>
        </section>

        <!-- The one next step. It follows the plan just bought: a plan that
             allows teaching leads to the organization the classes will live
             in; any other plan leads to a terminal. Nothing here points at a
             section the buyer cannot use. -->
        <section class="ocf-checkout-card ocf-checkout-next" data-test="next-step">
          <div class="ocf-checkout-next-icon">
            <i :class="nextStep.icon"></i>
          </div>
          <div class="ocf-checkout-next-body">
            <h3>{{ t(`checkoutSuccess.${nextStep.key}Title`) }}</h3>
            <p>{{ t(`checkoutSuccess.${nextStep.key}Body`) }}</p>
            <router-link :to="nextStep.to" class="btn btn-primary" data-test="primary-next-step">
              {{ t(`checkoutSuccess.${nextStep.key}Cta`) }}
            </router-link>
          </div>
        </section>

        <!-- Invoice and dashboard, one click away in every case -->
        <div class="ocf-checkout-links">
          <router-link to="/invoices" class="ocf-checkout-link" data-test="invoice-link">
            <i class="fas fa-file-invoice"></i>
            <span>{{ t('checkoutSuccess.viewInvoice') }}</span>
          </router-link>
          <router-link to="/subscription-dashboard" class="ocf-checkout-link">
            <i class="fas fa-tachometer-alt"></i>
            <span>{{ t('checkoutSuccess.goToDashboard') }}</span>
          </router-link>
          <a :href="`mailto:${SUPPORT_EMAIL}`" class="ocf-checkout-link">
            <i class="fas fa-question-circle"></i>
            <span>{{ t('checkoutSuccess.contactSupport') }}</span>
          </a>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSubscriptionsStore } from '../../stores/subscriptions'
import { useSubscriptionPlansStore } from '../../stores/subscriptionPlans'
import { usePermissionsStore } from '../../stores/permissions'
import { useClassroomEntitlement } from '../../composables/useClassroomEntitlement'
import { useTranslations } from '../../composables/useTranslations'
import { SUPPORT_EMAIL } from '../../config/contact'

const { t } = useTranslations({
  en: {
    checkoutSuccess: {
      title: 'Payment confirmed',
      subtitle: 'Your subscription is active. Here is what you bought and where to go next.',
      activated: 'Subscription activated',
      pendingTitle: 'Payment received',
      pendingActivating: 'Activating your subscription…',
      pendingMessage: 'Your payment was received successfully. Activating your subscription may take a few moments. It will appear in your dashboard as soon as it is ready.',
      refresh: 'Refresh',
      subscriptionDetails: 'Your subscription',
      plan: 'Plan',
      amount: 'Amount',
      billingInterval: 'Billing cycle',
      nextBillingLabel: 'Next billing',
      organizationTitle: 'Create your organization',
      organizationBody: 'Your classes, learners and seats live in an organization. Create yours to open your first class.',
      organizationCta: 'Create the organization',
      terminalTitle: 'Start your first terminal',
      terminalBody: 'Your plan is ready. Pick a distribution and a size and start working in a real Linux environment.',
      terminalCta: 'Start a terminal',
      viewInvoice: 'View the invoice',
      goToDashboard: 'Subscription dashboard',
      contactSupport: 'Contact support'
    }
  },
  fr: {
    checkoutSuccess: {
      title: 'Paiement confirmé',
      subtitle: 'Votre abonnement est actif. Voici ce que vous avez acheté et la suite.',
      activated: 'Abonnement activé',
      pendingTitle: 'Paiement reçu',
      pendingActivating: 'Activation de votre abonnement en cours…',
      pendingMessage: 'Votre paiement a bien été reçu. L\'activation de votre abonnement peut prendre quelques instants. Il apparaîtra dans votre tableau de bord dès qu\'il sera prêt.',
      refresh: 'Actualiser',
      subscriptionDetails: 'Votre abonnement',
      plan: 'Forfait',
      amount: 'Montant',
      billingInterval: 'Cycle de facturation',
      nextBillingLabel: 'Prochaine facturation',
      organizationTitle: 'Créez votre organisation',
      organizationBody: 'Vos classes, vos apprenants et vos sièges vivent dans une organisation. Créez la vôtre pour ouvrir votre première classe.',
      organizationCta: 'Créer l\'organisation',
      terminalTitle: 'Lancez votre premier terminal',
      terminalBody: 'Votre forfait est prêt. Choisissez une distribution et une taille, et travaillez dans un vrai environnement Linux.',
      terminalCta: 'Lancer un terminal',
      viewInvoice: 'Voir la facture',
      goToDashboard: 'Tableau de bord de l\'abonnement',
      contactSupport: 'Contacter le support'
    }
  }
})

useRoute()
const subscriptionsStore = useSubscriptionsStore()
const subscriptionPlansStore = useSubscriptionPlansStore()
const { planAllowsClassrooms } = useClassroomEntitlement()

const subscriptionDetails = ref<any>(null)

// The /user-subscriptions/current DTO carries the plan nested under
// subscription_plan (no flat plan_name/amount fields), so read the embedded
// plan and keep the flat fields as fallback for older response shapes.
const planDetails = computed(() => {
  const sub = subscriptionDetails.value
  if (!sub) return null
  const plan = sub.subscription_plan || {}
  return {
    name: sub.plan_name || plan.name || '',
    amount: sub.amount ?? plan.price_amount ?? null,
    currency: sub.currency || plan.currency || 'EUR',
    interval: sub.billing_interval || plan.billing_interval || '',
    periodEnd: sub.current_period_end,
  }
})

// The next step reads the backend's verdict on the plan just bought (the same
// `can_create_organization` the organization-creation gate applies, refreshed
// after activation), never the plan's feature list. Only an explicit "yes"
// sends the buyer to create an organization; an unresolved verdict offers the
// terminal, which every plan covers.
const nextStep = computed(() => planAllowsClassrooms.value === true
  ? { key: 'organization', icon: 'fas fa-building', to: '/organizations?create=1' }
  : { key: 'terminal', icon: 'fas fa-terminal', to: '/terminal-creation' })

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
        // The page booted before the webhook landed, so the navigation and the
        // verdict the next step reads still hold the pre-purchase answer; the
        // plan just paid for may unlock them.
        await usePermissionsStore().refreshEntitlements()
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
.ocf-checkout-success-page {
  padding: var(--spacing-lg);
}

.ocf-checkout-success-column {
  max-width: 760px;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.page-header h2 {
  margin: 0 0 var(--spacing-xs);
  color: var(--color-text-primary);
}

.page-subtitle {
  margin: 0;
  color: var(--color-text-muted);
}

.ocf-checkout-status {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  font-weight: 500;
  align-self: flex-start;
}

.ocf-checkout-status--ok {
  background: var(--color-success-bg);
  color: var(--color-success-text);
}

.ocf-checkout-status--pending {
  background: var(--color-info-bg);
  color: var(--color-info-text);
}

.ocf-checkout-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
}

.ocf-checkout-card h3 {
  margin: 0 0 var(--spacing-md);
  font-size: 1.1rem;
  color: var(--color-text-primary);
}

.ocf-checkout-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--spacing-md);
  margin: 0;
}

.ocf-checkout-detail dt {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-xs);
}

.ocf-checkout-detail dd {
  margin: 0;
  font-weight: 600;
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
}

.ocf-checkout-next {
  display: flex;
  gap: var(--spacing-lg);
  align-items: flex-start;
}

.ocf-checkout-next-icon {
  flex: 0 0 auto;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: 1.3rem;
}

.ocf-checkout-next-body p {
  color: var(--color-text-muted);
  margin: 0 0 var(--spacing-md);
}

.ocf-checkout-actions {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.ocf-checkout-links {
  display: flex;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
}

.ocf-checkout-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-primary);
  text-decoration: none;
}

.ocf-checkout-link:hover {
  text-decoration: underline;
}
</style>
