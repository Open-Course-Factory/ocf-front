/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.

 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 * 
 * See the LICENSE file for more information.
 */

import { defineStore } from "pinia"
import { useI18n } from "vue-i18n"
import { ref } from 'vue'
import axios from 'axios'
import { isDemoMode, logDemoAction, simulateDelay } from '../services/demoConfig'
import { demoPayments } from '../services/demoPayments'
import { getDemoCurrentSubscription, getDemoUsageMetrics } from '../services/demoData'
import { featureFlagService } from '../services/featureFlags'
import { formatDate as formatDateUtil } from '../utils/formatters'
import { handleStoreError } from '../services/errorHandler'

export const useSubscriptionsStore = defineStore('subscriptions', () => {

    const { t } = useI18n()

    // État local
    const currentSubscription = ref(null)
    const isLoading = ref(false)
    const error = ref('')
    const usageMetrics = ref([])

    useI18n().mergeLocaleMessage('en', {
        subscriptions: {
            pageTitle: 'My Subscription',
            currentPlan: 'Current Plan',
            status: 'Status',
            nextBilling: 'Next Billing',
            cancelAt: 'Cancels At',
            trialEnd: 'Trial Ends',
            manageSubscription: 'Manage Subscription',
            upgradePlan: 'Upgrade Plan',
            cancelSubscription: 'Cancel Subscription',
            reactivateSubscription: 'Reactivate Subscription',
            noActiveSubscription: 'No Active Subscription',
            subscribeNow: 'Subscribe Now',
            active: 'Active',
            canceled: 'Canceled',
            past_due: 'Past Due',
            trialing: 'Trialing',
            unpaid: 'Unpaid',
            incomplete: 'Incomplete',
            usageTitle: 'Usage Overview',
            checkoutError: 'Checkout Error',
            portalError: 'Portal Error',
            usageLimitError: 'Usage Limit Error',
            loadError: 'Error loading subscription',
            cancelError: 'Error canceling subscription',
            reactivateError: 'Error reactivating subscription',
            dashboardTitle: 'Subscription Dashboard',
            dashboardSubtitle: 'Manage your subscription, usage, and billing',
            loadingDashboard: 'Loading dashboard...',
            usageOverview: 'Usage Overview',
            remaining: 'remaining',
            noUsageData: 'No usage data available',
            confirmCancellation: 'Confirm Cancellation',
            cancellationWarning: 'Are you sure you want to cancel your subscription?',
            cancelAtPeriodEnd: 'Cancel at period end',
            cancelAtPeriodEndDesc: 'Your subscription will remain active until the end of your current billing period.',
            cancelImmediately: 'Cancel immediately',
            cancelImmediatelyDesc: 'Your subscription will be cancelled immediately and you will lose access.',
            confirmCancel: 'Yes, Cancel',
            keepSubscription: 'Keep Subscription',
            confirmReactivation: 'Reactivate Subscription',
            reactivationInfo: 'Your subscription will be reactivated and billing will resume.',
            subscriptionDetails: 'Subscription Details',
            plan: 'Plan',
            price: 'Price',
            confirmReactivate: 'Reactivate',
            cancel: 'Cancel',
            changePlanConfirm: 'Change Subscription Plan',
            changePlanWarning: 'Are you sure you want to change your subscription plan?',
            prorationBehavior: 'Billing Adjustment',
            prorationAlwaysInvoice: 'Immediate adjustment (recommended)',
            prorationAlwaysInvoiceDesc: 'You will be charged or credited immediately for the plan change',
            prorationCreateProrations: 'Bill at next cycle',
            prorationCreateProrationsDesc: 'Changes will be reflected in your next billing cycle',
            prorationNone: 'No proration',
            prorationNoneDesc: 'New price takes effect immediately without adjustment',
            confirmChange: 'Change Plan',
            planNotAvailableError: 'This plan is not available. Please contact support.',
            paymentProviderError: 'Payment provider error. Please try again or contact support.',
            upgradeError: 'Failed to change subscription plan',
            changingPlan: 'Changing plan...',
            planChangedSuccess: 'Your subscription plan has been changed successfully!'
        }
    })

    useI18n().mergeLocaleMessage('fr', {
        subscriptions: {
            pageTitle: 'Mon Abonnement',
            currentPlan: 'Plan Actuel',
            status: 'Statut',
            nextBilling: 'Prochaine Facturation',
            cancelAt: 'Résiliation le',
            trialEnd: 'Fin d\'Essai',
            manageSubscription: 'Gérer l\'Abonnement',
            upgradePlan: 'Changer de Plan',
            cancelSubscription: 'Résilier l\'Abonnement',
            reactivateSubscription: 'Réactiver l\'Abonnement',
            noActiveSubscription: 'Aucun Abonnement Actif',
            subscribeNow: 'S\'Abonner Maintenant',
            active: 'Actif',
            canceled: 'Résilié',
            past_due: 'En Retard',
            trialing: 'Période d\'Essai',
            unpaid: 'Non Payé',
            incomplete: 'Incomplet',
            usageTitle: 'Aperçu de l\'Utilisation',
            checkoutError: 'Erreur de Paiement',
            portalError: 'Erreur du Portail',
            usageLimitError: 'Erreur de Limite d\'Usage',
            loadError: 'Erreur lors du chargement de l\'abonnement',
            cancelError: 'Erreur lors de l\'annulation de l\'abonnement',
            reactivateError: 'Erreur lors de la réactivation de l\'abonnement',
            dashboardTitle: 'Tableau de Bord Abonnement',
            dashboardSubtitle: 'Gérez votre abonnement, utilisation et facturation',
            loadingDashboard: 'Chargement du tableau de bord...',
            usageOverview: 'Aperçu de l\'Utilisation',
            remaining: 'restant',
            noUsageData: 'Aucune donnée d\'utilisation disponible',
            confirmCancellation: 'Confirmer l\'Annulation',
            cancellationWarning: 'Êtes-vous sûr de vouloir annuler votre abonnement ?',
            cancelAtPeriodEnd: 'Annuler à la fin de la période',
            cancelAtPeriodEndDesc: 'Votre abonnement restera actif jusqu\'à la fin de votre période de facturation actuelle.',
            cancelImmediately: 'Annuler immédiatement',
            cancelImmediatelyDesc: 'Votre abonnement sera annulé immédiatement et vous perdrez l\'accès.',
            confirmCancel: 'Oui, Annuler',
            keepSubscription: 'Garder l\'Abonnement',
            confirmReactivation: 'Réactiver l\'Abonnement',
            reactivationInfo: 'Votre abonnement sera réactivé et la facturation reprendra.',
            subscriptionDetails: 'Détails de l\'Abonnement',
            plan: 'Plan',
            price: 'Prix',
            confirmReactivate: 'Réactiver',
            cancel: 'Annuler',
            changePlanConfirm: 'Changer de Plan d\'Abonnement',
            changePlanWarning: 'Êtes-vous sûr de vouloir changer votre plan d\'abonnement ?',
            prorationBehavior: 'Ajustement de Facturation',
            prorationAlwaysInvoice: 'Ajustement immédiat (recommandé)',
            prorationAlwaysInvoiceDesc: 'Vous serez facturé ou crédité immédiatement pour le changement de plan',
            prorationCreateProrations: 'Facturer au prochain cycle',
            prorationCreateProrationsDesc: 'Les changements seront reflétés dans votre prochain cycle de facturation',
            prorationNone: 'Pas de proratisation',
            prorationNoneDesc: 'Le nouveau prix prend effet immédiatement sans ajustement',
            confirmChange: 'Changer de Plan',
            planNotAvailableError: 'Ce plan n\'est pas disponible. Veuillez contacter le support.',
            paymentProviderError: 'Erreur du fournisseur de paiement. Veuillez réessayer ou contacter le support.',
            upgradeError: 'Échec du changement de plan d\'abonnement',
            changingPlan: 'Changement de plan...',
            planChangedSuccess: 'Votre plan d\'abonnement a été changé avec succès !'
        }
    })

    // Récupérer l'abonnement actuel
    const getCurrentSubscription = async () => {
        isLoading.value = true
        error.value = ''

        try {
            let data: any

            if (isDemoMode()) {
                logDemoAction('Getting demo current subscription')
                await simulateDelay(1000)
                data = getDemoCurrentSubscription('active') // You can change this to test different states
            } else {
                const response = await axios.get('/user-subscriptions/current')
                data = response.data
            }

            currentSubscription.value = data
            return data
        } catch (err: any) {
            if (err.response?.status === 404) {
                // Pas d'abonnement actif
                currentSubscription.value = null
            } else {
                error.value = handleStoreError(err, 'subscriptions.loadError')
            }
            throw err
        } finally {
            isLoading.value = false
        }
    }

    // Créer une session de checkout Stripe
    const createCheckoutSession = async (planId: string, successUrl: string, cancelUrl: string, couponCode?: string, allowReplace: boolean = false) => {
        isLoading.value = true
        error.value = ''

        try {
            let response: any

            if (isDemoMode()) {
                logDemoAction('Creating demo checkout session', { planId, couponCode })
                response = await demoPayments.createCheckoutSession(planId, successUrl, cancelUrl, couponCode)
            } else {
                const payload: any = {
                    subscription_plan_id: planId,
                    success_url: successUrl,
                    cancel_url: cancelUrl
                }

                if (couponCode) {
                    payload.coupon_code = couponCode
                }

                // If allowReplace is true, tell backend to replace existing free subscription
                if (allowReplace) {
                    payload.allow_replace = true
                }

                const axiosResponse = await axios.post('/user-subscriptions/checkout', payload)
                response = axiosResponse.data
            }

            // Handle free plan activation (no Stripe redirect needed)
            if (response.free_plan) {
                // Update local subscription state
                if (response.subscription) {
                    currentSubscription.value = response.subscription
                }
                // Return response to let caller handle success UI
                return response
            }

            // Handle paid plans - redirect to Stripe Checkout
            if (response.url) {
                window.location.href = response.url
            }

            return response
        } catch (err: any) {
            error.value = handleStoreError(err, 'subscriptions.checkoutError')
            throw err
        } finally {
            isLoading.value = false
        }
    }

    // Créer une session portail client Stripe
    const createPortalSession = async (returnUrl: string) => {
        isLoading.value = true
        error.value = ''

        try {
            let response: any

            if (isDemoMode()) {
                logDemoAction('Creating demo portal session', { returnUrl })
                response = await demoPayments.createPortalSession(returnUrl)
            } else {
                const axiosResponse = await axios.post('/user-subscriptions/portal', {
                    return_url: returnUrl
                })
                response = axiosResponse.data
            }

            // Rediriger vers le portail Stripe (ou demo portal)
            if (response.url) {
                window.location.href = response.url
            }

            return response
        } catch (err: any) {
            error.value = handleStoreError(err, 'subscriptions.portalError')
            throw err
        } finally {
            isLoading.value = false
        }
    }

    // Annuler l'abonnement
    const cancelSubscription = async (subscriptionId: string, cancelImmediately: boolean = false) => {
        isLoading.value = true
        error.value = ''
        
        try {
            const params = cancelImmediately ? '?cancel_immediately=true' : ''
            await axios.post(`/user-subscriptions/${subscriptionId}/cancel${params}`)
            
            // Recharger l'abonnement actuel
            await getCurrentSubscription()
            
            return true
        } catch (err: any) {
            error.value = handleStoreError(err, 'subscriptions.cancelError')
            throw err
        } finally {
            isLoading.value = false
        }
    }

    // Réactiver l'abonnement
    const reactivateSubscription = async (subscriptionId: string) => {
        isLoading.value = true
        error.value = ''
        
        try {
            await axios.post(`/user-subscriptions/${subscriptionId}/reactivate`)
            
            // Recharger l'abonnement actuel
            await getCurrentSubscription()
            
            return true
        } catch (err: any) {
            error.value = handleStoreError(err, 'subscriptions.reactivateError')
            throw err
        } finally {
            isLoading.value = false
        }
    }

    // Récupérer les métriques d'utilisation
    const getUsageMetrics = async () => {
        try {
            let data: any[]

            if (isDemoMode()) {
                logDemoAction('Getting demo usage metrics')
                await simulateDelay(800)
                data = getDemoUsageMetrics()
            } else {
                const response = await axios.get('/user-subscriptions/usage')
                data = response.data || []
            }

            // Deduplicate metrics by metric_type (keep the first occurrence)
            const uniqueMetrics = new Map()
            data.forEach(metric => {
                if (!uniqueMetrics.has(metric.metric_type)) {
                    uniqueMetrics.set(metric.metric_type, metric)
                }
            })

            usageMetrics.value = Array.from(uniqueMetrics.values())
            return usageMetrics.value
        } catch (err: any) {
            console.error('Erreur lors du chargement des métriques:', err)
            throw err
        }
    }

    // Mettre à niveau le plan
    const upgradePlan = async (
        newPlanId: string,
        prorationBehavior: 'always_invoice' | 'create_prorations' | 'none' = 'always_invoice'
    ) => {
        isLoading.value = true
        error.value = ''

        try {
            let result: any

            if (isDemoMode()) {
                logDemoAction('Upgrading demo plan', { newPlanId, prorationBehavior })
                await simulateDelay(1500)
                result = { success: true, subscription: getDemoCurrentSubscription('active') }
            } else {
                const response = await axios.post('/user-subscriptions/upgrade', {
                    new_plan_id: newPlanId,
                    proration_behavior: prorationBehavior
                })
                result = response.data
                console.log('Upgrade response:', result)
            }

            // Wait for Stripe webhook to process (optimized single wait)
            console.log('Waiting for webhook to process...')
            await new Promise(resolve => setTimeout(resolve, 3000))

            // Recharger l'abonnement actuel
            console.log('Reloading subscription after upgrade...')
            await getCurrentSubscription()
            console.log('Updated subscription:', currentSubscription.value)

            // Only retry if plan_id doesn't match (webhook might be slow)
            if (currentSubscription.value?.subscription_plan_id !== newPlanId) {
                console.warn('Plan ID mismatch, waiting additional 2s for webhook...')
                await new Promise(resolve => setTimeout(resolve, 2000))

                console.log('Final reload attempt...')
                await getCurrentSubscription()
                console.log('Final subscription state:', currentSubscription.value)
            }

            // Reload usage metrics
            await getUsageMetrics()
            console.log('Updated usage metrics:', usageMetrics.value)

            return result
        } catch (err: any) {
            // Enhanced error handling for Stripe-specific errors
            const errorMessage = err.response?.data?.error_message || ''

            if (errorMessage.includes('Stripe price')) {
                error.value = t('subscriptions.planNotAvailableError')
            } else if (errorMessage.includes('Stripe')) {
                error.value = t('subscriptions.paymentProviderError')
            } else {
                error.value = errorMessage || t('subscriptions.upgradeError')
            }

            throw err
        } finally {
            isLoading.value = false
        }
    }

    // Vérifier les limites d'utilisation
    const checkUsageLimit = async (metricType: string, requestedAmount: number = 1) => {
        try {
            let result: any

            if (isDemoMode()) {
                logDemoAction('Checking demo usage limit', { metricType, requestedAmount })
                result = await demoPayments.checkUsageLimit(metricType, requestedAmount)
                return result.allowed
            } else {
                const response = await axios.post('/user-subscriptions/usage/check', {
                    metric_type: metricType,
                    increment: requestedAmount
                })
                return response.data.allowed
            }
        } catch (err: any) {
            error.value = handleStoreError(err, 'subscriptions.usageLimitError')
            return false
        }
    }

    // Synchroniser les limites d'utilisation avec le backend
    const syncUsageLimits = async () => {
        try {
            if (isDemoMode()) {
                logDemoAction('Syncing demo usage limits')
                await simulateDelay(500)
                return { success: true }
            } else {
                const response = await axios.post('/user-subscriptions/sync-usage-limits')
                return response.data
            }
        } catch (err: any) {
            console.error('Erreur lors de la synchronisation des limites:', err)
            throw err
        }
    }

    // Utilitaires pour l'affichage
    const getStatusClass = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active': return 'text-success'
            case 'trialing': return 'text-info'
            case 'canceled': return 'text-warning'
            case 'past_due': return 'text-danger'
            case 'unpaid': return 'text-danger'
            case 'incomplete': return 'text-muted'
            default: return 'text-secondary'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active': return 'fas fa-check-circle'
            case 'trialing': return 'fas fa-gift'
            case 'canceled': return 'fas fa-times-circle'
            case 'past_due': return 'fas fa-exclamation-triangle'
            case 'unpaid': return 'fas fa-credit-card'
            case 'incomplete': return 'fas fa-hourglass-half'
            default: return 'fas fa-question-circle'
        }
    }

    const formatDate = (dateString: string) => {
        return formatDateUtil(dateString, 'fr-FR', '-')
    }

    const isTrialing = () => {
        return currentSubscription.value?.status === 'trialing'
    }

    const isCanceled = () => {
        return currentSubscription.value?.cancel_at_period_end === true
    }

    const hasActiveSubscription = () => {
        return currentSubscription.value &&
               ['active', 'trialing'].includes(currentSubscription.value.status)
    }

    /**
     * Filter usage metrics based on feature flags
     * This ensures metrics related to disabled features are not shown
     */
    const getFilteredUsageMetrics = (actor?: { userId?: string, role?: string }) => {
        return usageMetrics.value.filter(metric => {
            return featureFlagService.isMetricVisible(metric.metric_type, actor)
        })
    }

    return {
        // État
        currentSubscription,
        isLoading,
        error,
        usageMetrics,

        // Actions
        getCurrentSubscription,
        createCheckoutSession,
        createPortalSession,
        cancelSubscription,
        reactivateSubscription,
        upgradePlan,
        getUsageMetrics,
        getFilteredUsageMetrics,
        checkUsageLimit,
        syncUsageLimits,

        // Utilitaires
        getStatusClass,
        getStatusIcon,
        formatDate,
        isTrialing,
        isCanceled,
        hasActiveSubscription
    }
})