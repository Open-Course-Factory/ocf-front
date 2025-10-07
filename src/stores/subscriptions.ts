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
            cancel: 'Cancel'
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
            cancel: 'Annuler'
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
                const response = await axios.get('/subscriptions/current')
                data = response.data
            }

            currentSubscription.value = data
            return data
        } catch (err: any) {
            if (err.response?.status === 404) {
                // Pas d'abonnement actif
                currentSubscription.value = null
            } else {
                error.value = err.response?.data?.error_message || 'Erreur lors du chargement'
            }
            throw err
        } finally {
            isLoading.value = false
        }
    }

    // Créer une session de checkout Stripe
    const createCheckoutSession = async (planId: string, successUrl: string, cancelUrl: string, couponCode?: string) => {
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

                const axiosResponse = await axios.post('/subscriptions/checkout', payload)
                response = axiosResponse.data
            }

            // Rediriger vers Stripe Checkout (ou demo checkout)
            if (response.url) {
                window.location.href = response.url
            }

            return response
        } catch (err: any) {
            error.value = err.response?.data?.error_message || t('subscriptions.checkoutError')
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
                const axiosResponse = await axios.post('/subscriptions/portal', {
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
            error.value = err.response?.data?.error_message || t('subscriptions.portalError')
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
            await axios.post(`/subscriptions/${subscriptionId}/cancel${params}`)
            
            // Recharger l'abonnement actuel
            await getCurrentSubscription()
            
            return true
        } catch (err: any) {
            error.value = err.response?.data?.error_message || 'Erreur lors de l\'annulation'
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
            await axios.post(`/subscriptions/${subscriptionId}/reactivate`)
            
            // Recharger l'abonnement actuel
            await getCurrentSubscription()
            
            return true
        } catch (err: any) {
            error.value = err.response?.data?.error_message || 'Erreur lors de la réactivation'
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
                const response = await axios.get('/subscriptions/usage')
                data = response.data || []
            }

            usageMetrics.value = data
            return usageMetrics.value
        } catch (err: any) {
            console.error('Erreur lors du chargement des métriques:', err)
            throw err
        }
    }

    // Mettre à niveau le plan
    const upgradePlan = async (newPlanId: string) => {
        isLoading.value = true
        error.value = ''

        try {
            let result: any

            if (isDemoMode()) {
                logDemoAction('Upgrading demo plan', { newPlanId })
                await simulateDelay(1500)
                result = { success: true, subscription: getDemoCurrentSubscription('active') }
            } else {
                const response = await axios.post('/subscriptions/upgrade', {
                    new_plan_id: newPlanId
                })
                result = response.data
            }

            // Recharger l'abonnement actuel
            await getCurrentSubscription()
            await getUsageMetrics()

            return result
        } catch (err: any) {
            error.value = err.response?.data?.error_message || 'Erreur lors de la mise à niveau'
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
                const response = await axios.post('/subscriptions/usage/check', {
                    metric_type: metricType,
                    increment: requestedAmount
                })
                return response.data.allowed
            }
        } catch (err: any) {
            console.error('Erreur lors de la vérification des limites:', err)
            error.value = err.response?.data?.error_message || t('subscriptions.usageLimitError')
            return false
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
        if (!dateString) return '-'
        try {
            return new Date(dateString).toLocaleDateString('fr-FR')
        } catch (e) {
            return dateString
        }
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
        checkUsageLimit,
        
        // Utilitaires
        getStatusClass,
        getStatusIcon,
        formatDate,
        isTrialing,
        isCanceled,
        hasActiveSubscription
    }
})