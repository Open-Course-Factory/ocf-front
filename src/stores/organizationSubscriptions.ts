import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { useStoreTranslations } from '../composables/useTranslations'
import { isDemoMode, logDemoAction } from '../services/demo'
import { createAsyncWrapper } from '../utils/asyncWrapper'
import type {
  OrganizationFeatures,
  SubscribeOrganizationRequest,
  CancelOrganizationSubscriptionRequest
} from '../types'

export const useOrganizationSubscriptionsStore = defineStore('organizationSubscriptions', () => {
  const isLoading = ref(false)
  const error = ref('')
  const withAsync = createAsyncWrapper({ isLoading, error })

  // Translations
  const { t } = useStoreTranslations({
    en: {
      organizationSubscriptions: {
        name: 'Organization Subscriptions',
        subscribeSuccess: 'Organization subscribed successfully',
        cancelSuccess: 'Subscription cancelled successfully',
        loadError: 'Failed to load subscription',
        subscribeError: 'Failed to subscribe organization',
        cancelError: 'Failed to cancel subscription',
        notFound: 'Subscription not found',
        planRequired: 'Subscription plan is required',
        notAuthorized: 'You are not authorized to manage this organization',
      }
    },
    fr: {
      organizationSubscriptions: {
        name: 'Abonnements d\'organisation',
        subscribeSuccess: 'Organisation abonnée avec succès',
        cancelSuccess: 'Abonnement annulé avec succès',
        loadError: 'Échec du chargement de l\'abonnement',
        subscribeError: 'Échec de l\'abonnement de l\'organisation',
        cancelError: 'Échec de l\'annulation de l\'abonnement',
        notFound: 'Abonnement introuvable',
        planRequired: 'Le plan d\'abonnement est requis',
        notAuthorized: 'Vous n\'êtes pas autorisé à gérer cette organisation',
      }
    }
  })

  // Load organization subscription
  const loadOrganizationSubscription = async (organizationId: string) => {
    return withAsync(async () => {
      if (isDemoMode()) {
        logDemoAction('loadOrganizationSubscription', { organizationId })
        return {
          id: `demo-org-sub-${organizationId}`,
          organization_id: organizationId,
          subscription_plan_id: 'demo-plan-1',
          stripe_subscription_id: 'sub_demo123',
          stripe_customer_id: 'cus_demo123',
          status: 'active' as const,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          cancel_at_period_end: false,
          quantity: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      }

      const response = await axios.get(`/organizations/${organizationId}/subscription`)
      return response.data.data || response.data
    }, 'organizationSubscriptions.loadError')
  }

  // Subscribe organization to plan
  const subscribeOrganization = async (organizationId: string, data: SubscribeOrganizationRequest) => {
    return withAsync(async () => {
      if (!data.subscription_plan_id) {
        throw new Error(t('organizationSubscriptions.planRequired'))
      }

      if (isDemoMode()) {
        logDemoAction('subscribeOrganization', { organizationId, data })
        return {
          id: `demo-org-sub-${organizationId}`,
          organization_id: organizationId,
          subscription_plan_id: data.subscription_plan_id,
          stripe_subscription_id: 'sub_demo123',
          stripe_customer_id: 'cus_demo123',
          status: 'active' as const,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          cancel_at_period_end: false,
          quantity: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      }

      const response = await axios.post(`/organizations/${organizationId}/subscribe`, data)
      return response.data.data || response.data
    }, 'organizationSubscriptions.subscribeError')
  }

  // Cancel organization subscription
  const cancelOrganizationSubscription = async (organizationId: string, cancelAtPeriodEnd: boolean = true) => {
    return withAsync(async () => {
      if (isDemoMode()) {
        logDemoAction('cancelOrganizationSubscription', { organizationId, cancelAtPeriodEnd })
        return
      }

      const requestData: CancelOrganizationSubscriptionRequest = { cancel_at_period_end: cancelAtPeriodEnd }
      await axios.delete(`/organizations/${organizationId}/subscription`, { data: requestData })
    }, 'organizationSubscriptions.cancelError')
  }

  // Get organization features
  const loadOrganizationFeatures = async (organizationId: string): Promise<OrganizationFeatures> => {
    return withAsync(async () => {
      if (isDemoMode()) {
        logDemoAction('loadOrganizationFeatures', { organizationId })
        return {
          organization_id: organizationId,
          organization_name: 'Demo Organization',
          has_active_subscription: true,
          features: ['advanced_terminals', 'multiple_groups', 'api_access'],
          usage_limits: {
            max_session_duration_minutes: 240,
            max_courses: 50,
            network_access_enabled: true,
            data_persistence_enabled: true,
            data_persistence_gb: 50,
          }
        }
      }

      const response = await axios.get(`/organizations/${organizationId}/features`)
      return response.data.data || response.data
    }, 'organizationSubscriptions.loadError')
  }

  return {
    // State
    isLoading,
    error,

    // Actions
    loadOrganizationSubscription,
    subscribeOrganization,
    cancelOrganizationSubscription,
    loadOrganizationFeatures,

    // Translations
    t,
  }
})
