import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { useStoreTranslations } from '../composables/useTranslations'
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

      const response = await axios.post(`/organizations/${organizationId}/subscribe`, data)
      // Assigning a plan to an organization changes what its members may do in
      // it; if the caller is one of them the navigation must learn it now.
      // Imported lazily for the same reason as in the subscriptions store.
      const { usePermissionsStore } = await import('./permissions')
      await usePermissionsStore().refreshEntitlements()
      return response.data.data || response.data
    }, 'organizationSubscriptions.subscribeError')
  }

  // Cancel organization subscription
  const cancelOrganizationSubscription = async (organizationId: string, cancelAtPeriodEnd: boolean = true) => {
    return withAsync(async () => {
      const requestData: CancelOrganizationSubscriptionRequest = { cancel_at_period_end: cancelAtPeriodEnd }
      await axios.delete(`/organizations/${organizationId}/subscription`, { data: requestData })
    }, 'organizationSubscriptions.cancelError')
  }

  // Get organization features
  const loadOrganizationFeatures = async (organizationId: string): Promise<OrganizationFeatures> => {
    return withAsync(async () => {
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
