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
import { onMounted } from 'vue'
import { useBaseStore } from "./baseStore"
import { getDemoSubscriptionPlans } from '../services/demoData'

export const useSubscriptionPlansStore = defineStore('subscriptionPlans', () => {

    const base = useBaseStore();
    const { t } = useI18n()

    useI18n().mergeLocaleMessage('en', { 
        subscriptionPlans: {
            pageTitle: 'Subscription Plans',
            name: 'Plan Name',
            description: 'Description',
            price_amount: 'Price (cents)',
            billing_interval: 'Billing Interval',
            currency: 'Currency',
            features: 'Features',
            max_courses: 'Max Courses',
            max_concurrent_users: 'Max Concurrent Users',
            max_lab_sessions: 'Max Lab Sessions',
            trial_days: 'Trial Days',
            required_role: 'Required Role',
            is_active: 'Active',
            stripe_product_id: 'Stripe Product ID',
            stripe_price_id: 'Stripe Price ID',
            modify: 'Modify the plan',
            add: 'Add a plan',
            current_subscription_plan: 'Current plan',
            no_active_subscription: 'No active subscription',
            subscribe_to_start : 'Subscribe to start',
            view_plans: 'View plans',
            reactivate_subscription: 'Reactivate subscription',
            manageSubscription: 'Manage Subscription',
            changePlan: 'Change Plan',
            cancelSubscription: 'Cancel Subscription',
            nextBilling: 'Next Billing',
            trialActive: 'Free Trial Active',
            trialEndsOn: 'Trial ends on',
            subscriptionWillCancel: 'Subscription will cancel',
            accessUntil: 'Access until',
            active: 'Active',
            trialing: 'Trial',
            canceled: 'Canceled',
            past_due: 'Past Due',
            unpaid: 'Unpaid',
            incomplete: 'Incomplete'
        }
    })

    useI18n().mergeLocaleMessage('fr', { 
        subscriptionPlans: {
            pageTitle: 'Plans d\'Abonnement',
            name: 'Nom du Plan',
            description: 'Description',
            price_amount: 'Prix (centimes)',
            billing_interval: 'Intervalle de Facturation',
            currency: 'Devise',
            features: 'Fonctionnalités',
            max_courses: 'Cours Maximum',
            max_concurrent_users: 'Utilisateurs Concurrents Max',
            max_lab_sessions: 'Sessions Lab Maximum',
            trial_days: 'Jours d\'Essai',
            required_role: 'Rôle Requis',
            is_active: 'Actif',
            stripe_product_id: 'ID Produit Stripe',
            stripe_price_id: 'ID Prix Stripe',
            modify: 'Modifier le plan',
            add: 'Ajouter un plan',
            current_subscription_plan: 'Plan actuel',
            no_active_subscription: 'Pas d\'abonnement actif',
            subscribe_to_start: 'Abonnez-vous pour plus de sessions !',
            view_plans: 'Voir les abonnements',
            reactivate_subscription: 'Réactiver l\'abonnement',
            manageSubscription: 'Gérer l\'Abonnement',
            changePlan: 'Changer de Plan',
            cancelSubscription: 'Annuler l\'Abonnement',
            nextBilling: 'Prochaine Facturation',
            trialActive: 'Essai Gratuit Actif',
            trialEndsOn: 'L\'essai se termine le',
            subscriptionWillCancel: 'L\'abonnement sera annulé',
            accessUntil: 'Accès jusqu\'au',
            active: 'Actif',
            trialing: 'Essai',
            canceled: 'Annulé',
            past_due: 'En Retard',
            unpaid: 'Non Payé',
            incomplete: 'Incomplet'
        }
    })

    const fieldList = new Map<string, any>([
        ["id", { label: "ID", type: "input", display: false, toBeSet: false, toBeEdited: false }],
        ["name", { label: t('subscriptionPlans.name'), type: "input", display: true, toBeSet: true, toBeEdited: true, required: true }],
        ["description", { label: t('subscriptionPlans.description'), type: "textarea", display: true, toBeSet: true, toBeEdited: true }],
        ["price_amount", { label: t('subscriptionPlans.price_amount'), type: "input", display: true, toBeSet: true, toBeEdited: false, required: true }],
        ["billing_interval", { label: t('subscriptionPlans.billing_interval'), type: "input", display: true, toBeSet: true, toBeEdited: false, required: true }],
        ["currency", { label: t('subscriptionPlans.currency'), type: "input", display: true, toBeSet: true, toBeEdited: false }],
        ["features", { label: t('subscriptionPlans.features'), type: "advanced-textarea", display: true, toBeSet: true, toBeEdited: true }],
        ["max_courses", { label: t('subscriptionPlans.max_courses'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["max_concurrent_users", { label: t('subscriptionPlans.max_concurrent_users'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["max_lab_sessions", { label: t('subscriptionPlans.max_lab_sessions'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["trial_days", { label: t('subscriptionPlans.trial_days'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["required_role", { label: t('subscriptionPlans.required_role'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["is_active", { label: t('subscriptionPlans.is_active'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["stripe_product_id", { label: t('subscriptionPlans.stripe_product_id'), type: "input", display: false, toBeSet: false, toBeEdited: false }],
        ["stripe_price_id", { label: t('subscriptionPlans.stripe_price_id'), type: "input", display: false, toBeSet: false, toBeEdited: false }],
        ["created_at", { label: t('created_at'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["updated_at", { label: t('updated_at'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
    ])

    // Formatage du prix pour affichage
    const formatPrice = (amount: number, currency: string = 'EUR') => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: currency.toUpperCase(),
        }).format(amount / 100); // Conversion centimes -> euros
    }

    // Fonction personnalisée pour les données de sélection
    const getSelectDatas = (inputEntities: any[]) => {
        let res: Array<{text: string, value: string}> = []
        if (inputEntities.length > 0) {
            inputEntities.forEach((plan) => {
                const price = formatPrice(plan.price_amount, plan.currency)
                const displayName = `${plan.name} - ${price}/${plan.billing_interval}`
                res.push({ 
                    text: displayName, 
                    value: plan.id 
                })
            })
        }
        return res
    }

    // Load subscription plans on store initialization
    const loadPlans = async () => {
        return await base.loadEntities('/subscription-plans', getDemoSubscriptionPlans)
    }

    // Refresh subscription plans
    const refreshPlans = async () => {
        return await base.refreshEntities('/subscription-plans', getDemoSubscriptionPlans)
    }

    // Custom action for plan selection (for subscription flow)
    const selectPlan = async (planId: string) => {
        const plan = base.entities.find((p: any) => p.id === planId)
        if (!plan) {
            throw new Error('Plan not found')
        }

        // This will be handled by the checkout flow
        return plan
    }

    // Hook for subscription-specific rendering
    const getSubscriptionActionButton = (plan: any) => {
        if (!plan.is_active) {
            return null // Don't show subscribe button for inactive plans
        }

        return {
            text: 'Subscribe',
            class: 'btn btn-success',
            icon: 'fas fa-shopping-cart',
            action: 'subscribe'
        }
    }

    // Check if user can see plan (admin vs regular user)
    const canViewPlan = (plan: any, isAdmin: boolean) => {
        return isAdmin || plan.is_active
    }

    // Auto-load plans when store is first used
    let plansLoaded = false
    const ensurePlansLoaded = async () => {
        if (!plansLoaded && base.entities.length === 0) {
            await loadPlans()
            plansLoaded = true
        }
    }

    return {
        ...base,
        fieldList,
        formatPrice,
        getSelectDatas,

        // New subscription-specific methods
        loadPlans,
        refreshPlans,
        selectPlan,
        getSubscriptionActionButton,
        canViewPlan,
        ensurePlansLoaded
    }
})