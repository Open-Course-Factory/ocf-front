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
import { computed } from "vue"
import { useBaseStore } from "./baseStore"
import { getDemoSubscriptionPlans, isDemoMode, logDemoAction, simulateDelay } from '../services/demo'
import axios from 'axios'
import { formatCurrency } from '../utils/formatters'
import { createAsyncWrapper } from '../utils/asyncWrapper'
import { useStoreTranslations } from '../composables/useTranslations'
import { field, buildFieldList } from '../utils/fieldBuilder'
import { buildSelectData } from '../utils'

export const useSubscriptionPlansStore = defineStore('subscriptionPlans', () => {

    const base = useBaseStore();

    const { t } = useStoreTranslations({
        en: { 
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
            bulkLicenseAssigned: 'Bulk License - Assigned to You',
            providedBy: 'Provided by',
            assignedOn: 'Assigned on',
            bulkLicenseReadOnly: 'This subscription was assigned to you and is managed by the license owner. You cannot modify or cancel it.',
            canStartPersonalSubscription: 'Want your own subscription? You can still purchase a personal plan or start a free trial.',
            subscriptionType_personal: 'Personal',
            subscriptionType_assigned: 'Assigned',
            allSubscriptionsTitle: 'All Your Subscriptions',
            loadingSubscriptions: 'Loading subscriptions...',
            noSubscriptions: 'No subscriptions found',
            stackedSubscriptionsInfo: 'You have multiple active subscriptions. The highest priority plan (⭐ starred) is currently being used for your terminal sessions.',
            advancedDetails: 'Advanced Details',
            showDetails: 'Show all subscriptions',
            hideDetails: 'Hide details',
            stackedSubscriptionsExplanation: 'You have multiple subscriptions. The highest-tier determines your features.',
            activePlan: 'Active Plan',
            fallbackPlan: 'Fallback',
            priorityLevel: 'Priority',
            terminals: 'terminals',
            unknownPlan: 'Unknown Plan',
            cannotDowngradeFromAssigned: 'You cannot downgrade from an assigned subscription. Your subscription was provided by an organization and can only be upgraded with a personal subscription.',
            upgradeFromAssignedConfirm: 'You currently have an assigned subscription. Starting a personal subscription will give you access to {newPlan} features. Your assigned subscription will remain as a fallback. Continue?',
            active: 'Active',
            trialing: 'Trial',
            canceled: 'Canceled',
            past_due: 'Past Due',
            unpaid: 'Unpaid',
            incomplete: 'Incomplete',
            planFeatures: 'Plan Features',
            concurrentTerminals: 'concurrent terminals',
            sessionDuration: 'session duration',
            machineSizes: 'machine sizes',
            allowedSizes: 'allowed sizes',
            storage: 'storage',
            networkAccess: 'Network Access',
            currentPlan: 'Current Plan',
            choosePlan: 'Choose Plan',
            upgrade: 'Upgrade',
            downgrade: 'Downgrade',
            syncWithStripe: 'Sync with Stripe',
            syncing: 'Syncing...',
            syncDescription: 'Synchronizes database plans with Stripe products and prices',
            comingSoon: 'Coming Soon',
            max_session_duration_minutes: 'Max Session Duration',
            max_concurrent_terminals: 'Max Concurrent Terminals',
            allowed_machine_sizes: 'Allowed Machine Sizes',
            network_access_enabled: 'Network Access',
            data_persistence_enabled: 'Data Persistence',
            data_persistence_gb: 'Storage Size (GB)',
            allowed_templates: 'Allowed Templates',
            syncError: 'Error syncing subscription plans',
            activating: 'Activating...',
            startFreeTrial: 'Start Free Trial',
            maxCourses: 'courses max',
            users: 'users',
            freeTrialDays: 'free trial days',
            statusActive: 'Active',
            statusInactive: 'Inactive',
            syncSuccess: 'Sync successful!',
            syncTotalPlans: 'Total plans:',
            syncSynced: 'Synced:',
            syncSkipped: 'Skipped:',
            syncFailed: 'Failed:',
            syncSyncedPlans: 'Synced plans:',
            syncSkippedPlans: 'Skipped plans:',
            syncFailedPlans: 'Failed plans:',
            syncErrorTitle: 'Sync error'
        }
        },
        fr: {
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
            bulkLicenseAssigned: 'Licence groupée - Attribuée à vous',
            providedBy: 'Fourni par',
            assignedOn: 'Attribué le',
            bulkLicenseReadOnly: 'Cet abonnement vous a été attribué et est géré par le propriétaire de la licence. Vous ne pouvez pas le modifier ou l\'annuler.',
            canStartPersonalSubscription: 'Vous voulez votre propre abonnement ? Vous pouvez toujours acheter un plan personnel ou commencer un essai gratuit.',
            subscriptionType_personal: 'Personnel',
            subscriptionType_assigned: 'Attribué',
            allSubscriptionsTitle: 'Tous vos Abonnements',
            loadingSubscriptions: 'Chargement des abonnements...',
            noSubscriptions: 'Aucun abonnement trouvé',
            stackedSubscriptionsInfo: 'Vous avez plusieurs abonnements actifs. Le plan avec la priorité la plus élevée (⭐ étoilé) est actuellement utilisé pour vos sessions terminal.',
            advancedDetails: 'Détails Avancés',
            showDetails: 'Afficher tous les abonnements',
            hideDetails: 'Masquer les détails',
            stackedSubscriptionsExplanation: 'Vous avez plusieurs abonnements. Le plus élevé détermine vos fonctionnalités.',
            activePlan: 'Plan Actif',
            fallbackPlan: 'Plan de secours',
            priorityLevel: 'Priorité',
            terminals: 'terminaux',
            unknownPlan: 'Plan Inconnu',
            cannotDowngradeFromAssigned: 'Vous ne pouvez pas rétrograder depuis un abonnement attribué. Votre abonnement a été fourni par une organisation et ne peut être que amélioré avec un abonnement personnel.',
            upgradeFromAssignedConfirm: 'Vous avez actuellement un abonnement attribué. Commencer un abonnement personnel vous donnera accès aux fonctionnalités de {newPlan}. Votre abonnement attribué restera comme plan de secours. Continuer ?',
            active: 'Actif',
            trialing: 'Essai',
            canceled: 'Annulé',
            past_due: 'En Retard',
            unpaid: 'Non Payé',
            incomplete: 'Incomplet',
            planFeatures: 'Fonctionnalités du Plan',
            concurrentTerminals: 'terminaux simultanés',
            sessionDuration: 'durée de session',
            machineSizes: 'tailles de machine',
            allowedSizes: 'tailles autorisées',
            storage: 'stockage',
            networkAccess: 'Accès Réseau',
            currentPlan: 'Plan Actuel',
            choosePlan: 'Choisir ce Plan',
            upgrade: 'Améliorer',
            downgrade: 'Rétrograder',
            syncWithStripe: 'Synchroniser avec Stripe',
            syncing: 'Synchronisation...',
            syncDescription: 'Synchronise les plans de la base de données avec les produits et prix Stripe',
            comingSoon: 'Bientôt disponible',
            max_session_duration_minutes: 'Durée Max de Session',
            max_concurrent_terminals: 'Terminaux Simultanés Max',
            allowed_machine_sizes: 'Tailles de Machine Autorisées',
            network_access_enabled: 'Accès Réseau',
            data_persistence_enabled: 'Persistance des Données',
            data_persistence_gb: 'Taille de Stockage (GB)',
            allowed_templates: 'Modèles Autorisés',
            syncError: 'Erreur lors de la synchronisation des plans',
            activating: 'Activation...',
            startFreeTrial: 'Démarrer l\'essai gratuit',
            maxCourses: 'cours max',
            users: 'utilisateurs',
            freeTrialDays: 'jours d\'essai gratuit',
            statusActive: 'Actif',
            statusInactive: 'Inactif',
            syncSuccess: 'Synchronisation réussie !',
            syncTotalPlans: 'Total des plans :',
            syncSynced: 'Synchronisés :',
            syncSkipped: 'Ignorés :',
            syncFailed: 'Échecs :',
            syncSyncedPlans: 'Plans synchronisés :',
            syncSkippedPlans: 'Plans ignorés :',
            syncFailedPlans: 'Plans en échec :',
            syncErrorTitle: 'Erreur de synchronisation'
        }
        }
    })

    // Create async wrapper with base store state
    const baseAsync = createAsyncWrapper({ isLoading: base.isLoading, error: base.error })

    const fieldList = computed(() => buildFieldList([
        field('id').hidden().readonly(),
        field('name', t('subscriptionPlans.name')).input().visible().creatable().updatable().required(),
        field('description', t('subscriptionPlans.description')).textarea().visible().creatable().updatable(),
        field('price_amount', t('subscriptionPlans.price_amount')).input().visible().creatable().required(),
        field('billing_interval', t('subscriptionPlans.billing_interval')).input().visible().creatable().required(),
        field('currency', t('subscriptionPlans.currency')).input().visible().creatable(),
        field('features', t('subscriptionPlans.features')).type('advanced-textarea').visible().creatable().updatable(),
        field('max_courses', t('subscriptionPlans.max_courses')).input().visible().creatable().updatable(),
        field('max_concurrent_users', t('subscriptionPlans.max_concurrent_users')).input().visible().creatable().updatable(),
        field('trial_days', t('subscriptionPlans.trial_days')).input().visible().creatable().updatable(),
        field('required_role', t('subscriptionPlans.required_role')).input().visible().creatable().updatable(),
        field('is_active', t('subscriptionPlans.is_active')).input().visible().readonly(),
        field('stripe_product_id', t('subscriptionPlans.stripe_product_id')).input().hidden().readonly(),
        field('stripe_price_id', t('subscriptionPlans.stripe_price_id')).input().hidden().readonly(),
        field('created_at', 'Created At').input().visible().readonly(),
        field('updated_at', 'Updated At').input().visible().readonly()
    ]))

    // Formatage du prix pour affichage
    const formatPrice = (amount: number, currency: string = 'EUR') => {
        return formatCurrency(amount, currency)
    }

    // Fonction personnalisée pour les données de sélection (utilise l'utilitaire réutilisable)
    const getSelectDatas = (inputEntities: any[]) => {
        return buildSelectData(inputEntities, (plan) => {
            const price = formatPrice(plan.price_amount, plan.currency)
            return `${plan.name} - ${price}/${plan.billing_interval}`
        })
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

    // Synchroniser les plans avec Stripe
    const syncPlansWithStripe = async () => {
        return await baseAsync(
            async () => {
                if (isDemoMode()) {
                    logDemoAction('Syncing demo subscription plans with Stripe')
                    await simulateDelay(2000)
                    // In demo mode, just refresh the local plans
                    return await loadPlans()
                } else {
                    const response = await axios.post('/subscription-plans/sync-stripe')
                    console.log('Subscription plans sync result:', response.data)

                    // Adapt backend response to expected frontend format
                    const data = response.data
                    const adapted = {
                        success: true,
                        synced_count: data.synced_plans?.length || 0,
                        skipped_count: data.skipped_plans?.length || 0,
                        failed_count: data.failed_plans?.length || 0,
                        total_plans: data.total_plans || 0,
                        message: `Synchronisé ${data.synced_plans?.length || 0} plan(s) avec succès`,
                        details: {
                            synced: data.synced_plans || [],
                            skipped: data.skipped_plans || [],
                            failed: data.failed_plans || []
                        }
                    }

                    return adapted
                }
            },
            'subscriptionPlans.syncError'
        );
    }

    // Synchroniser puis charger les plans (méthode recommandée)
    const syncAndLoadPlans = async () => {
        try {
            // D'abord synchroniser avec Stripe
            await syncPlansWithStripe()
            // Puis charger les plans
            return await loadPlans()
        } catch (error) {
            console.error('Erreur lors de la synchronisation et du chargement:', error)
            throw error
        }
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
        ensurePlansLoaded,
        syncPlansWithStripe,
        syncAndLoadPlans
    }
})