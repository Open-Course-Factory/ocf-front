/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2024 Solution Libre
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
            noSubscription: 'No Active Subscription',
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
            noSubscription: 'Aucun Abonnement Actif',
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
        }
    })

    // Récupérer l'abonnement actuel
    const getCurrentSubscription = async () => {
        isLoading.value = true
        error.value = ''
        
        try {
            const response = await axios.get('/subscriptions/current')
            currentSubscription.value = response.data
            return response.data
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
            const payload: any = {
                subscription_plan_id: planId,
                success_url: successUrl,
                cancel_url: cancelUrl
            }
            
            if (couponCode) {
                payload.coupon_code = couponCode
            }
            
            const response = await axios.post('/subscriptions/checkout', payload)
            
            // Rediriger vers Stripe Checkout
            if (response.data.url) {
                window.location.href = response.data.url
            }
            
            return response.data
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
            const response = await axios.post('/subscriptions/portal', {
                return_url: returnUrl
            })
            
            // Rediriger vers le portail Stripe
            if (response.data.url) {
                window.location.href = response.data.url
            }
            
            return response.data
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
            const response = await axios.get('/subscriptions/usage')
            usageMetrics.value = response.data || []
            return usageMetrics.value
        } catch (err: any) {
            console.error('Erreur lors du chargement des métriques:', err)
            throw err
        }
    }

    // Vérifier les limites d'utilisation
    const checkUsageLimit = async (metricType: string, increment: number = 1) => {
        try {
            const response = await axios.post('/subscriptions/usage/check', {
                metric_type: metricType,
                increment: increment
            })
            
            return response.data.allowed
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