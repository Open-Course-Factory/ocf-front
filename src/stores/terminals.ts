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
import { useStoreTranslations } from '../composables/useTranslations'
import { useBaseStore } from "./baseStore"
import { createAsyncWrapper } from '../utils/asyncWrapper'
import { field, buildFieldList } from '../utils/fieldBuilder'
import { ref } from 'vue'
import axios from 'axios'

export const useTerminalsStore = defineStore('terminals', () => {

    const base = useBaseStore();

    // État spécifique aux terminaux
    const activeSessions = ref([])
    const isLoading = ref(false)
    const error = ref('')

    // Create async wrapper with store state
    const withAsync = createAsyncWrapper({ isLoading, error })

    const { t } = useStoreTranslations({
        en: {
            terminals: {
                pageTitle: 'Terminal Sessions',
        session_id: 'Session ID',
        status: 'Status',
        expires_at: 'Expires at',
        terms: 'Terms of Service',
        expiry: 'Expiry (seconds)',
        add: 'Start a terminal session',
        start: 'Start Session',
        stop: 'Stop Session',
        connect: 'Connect to Console',
        name: 'Terminal Name',
        nameOptional: 'Terminal Name (optional)',
        namePlaceholder: 'Give this terminal a name...',
        editName: 'Edit name',
        saveName: 'Save name',
        cancelEdit: 'Cancel',
        unnamed: 'Unnamed Terminal',
        terminalWithPrefix: 'Terminal',
        userToAdd: 'User to add:',
        searchPlaceholder: 'Search by name or email...',
        searchInProgress: 'Searching...',
        accessLevel: 'Access level:',
        readAccess: '👁️ Read - Can view console',
        writeAccess: '✏️ Write - Can interact with terminal',
        adminAccess: '🔧 Admin - Can manage terminal and sharing',
        expirationDate: 'Expiration date (optional):',
        debugInfo: 'Debug Info',
        startNewSession: 'Start a new terminal session',
        termsRequired: 'Terms of Service (required):',
        expirySeconds: 'Expiry duration (seconds, optional):',
        instanceType: 'Instance type:',
        loading: 'Loading...',
        sessionMissing: 'Session missing',
        sessionIdNotProvided: 'Session ID was not provided in the URL.',
        expectedFormat: 'Expected format:',
        initializingTerminal: 'Initializing terminal...',
        websocketConnected: 'WebSocket connected',
        websocketDisconnected: 'WebSocket disconnected',
        terminal: 'Terminal:',
        instance: 'Instance:',
        fullControl: 'Full terminal control',
        noActiveSharing: 'No active sharing',
        notSharedWithUsers: 'This terminal is not shared with any other users at the moment.',
        connectionError: 'Connection error',
        // New translations for scalable instance system
        searchInstances: 'Search for an instance type...',
        allInstances: 'All',
        availableInstances: 'Available',
        restrictedInstances: 'Restricted',
        noInstancesFound: 'No instances found',
        noMatchingInstances: 'No instances match "{searchTerm}"',
        noAvailableInstances: 'No instances available in your current plan.',
        allInstancesAvailable: 'All instances are available in your plan.',
        clearFilters: 'Clear filters',
        availableInPlan: 'Available in your plan',
        requiresUpgrade: 'Requires upgrade',
        upgrade: 'Upgrade',
        currentUsage: 'Current Usage',
        concurrentTerminals: 'concurrent terminals',
        planLimit: 'plan limit',
        sessionDuration: 'session duration',
        allowedSizes: 'allowed sizes',
        yourPlanAllows: 'Your plan allows sizes',
        selectEnvironmentType: 'Select the environment type for your terminal session.',
        refreshUsage: 'Refresh usage data',
        autoRefreshInfo: 'Usage data refreshes automatically every {minutes} minutes',
        // Instance type translations
        instances: {
            alpine: {
                name: 'Alpine Linux',
                description: 'Lightweight Linux distribution'
            },
            debian: {
                name: 'Debian',
                description: 'Stable Linux distribution'
            },
            ubuntu: {
                name: 'Ubuntu Server',
                description: 'Popular server distribution'
            }
        },
                startError: 'Error starting terminal session',
                stopError: 'Error stopping terminal session',
                loadError: 'Error loading terminal sessions'
            },
            ui: {
                logout: 'Logout',
                disconnect: 'Disconnect',
                refresh: 'Refresh',
                retry: 'Retry',
                managePaymentMethods: 'Manage your payment methods. Your banking data is secured by Stripe.',
                noPaymentMethods: 'No payment methods',
                addCardToPurchase: 'Add a bank card to make your purchases.',
                expiringSoon: 'Expires soon',
                availablePlans: 'Available subscription plans. Contact your administrator to subscribe.',
                manageBillingAddresses: 'Manage your billing addresses. The default address will be used for your next purchases.'
            },
            navigation: {
                courseDesign: 'Course Design',
                practicalWork: 'Practical Work',
                myAccount: 'My Account',
                administration: 'Administration',
                createSession: 'Create Session',
                createNewTerminalSession: 'Create a new terminal session',
                mySessions: 'My Sessions',
                manageTerminalSessions: 'Manage my terminal sessions',
                sharedSessions: 'Shared Sessions',
                sessionsSharedWithMe: 'Sessions shared with me',
                adminSubscriptionPlans: 'Subscription Plans (Admin)',
                adminSubscriptionPlansTitle: 'Administration of subscription plans',
                allInvoices: 'All Invoices',
                viewAllSystemInvoices: 'View all system invoices',
                featureFlags: 'Feature Flags',
                featureFlagsTitle: 'Manage feature flags and experimental features',
                terminalMetrics: 'Server Metrics',
                terminalMetricsTitle: 'Monitor server resource usage and terminal capacity',
                terminalBackends: 'Terminal Backends',
                terminalBackendsTitle: 'Manage terminal backend servers'
            }
        },
        fr: {
            terminals: {
        pageTitle: 'Sessions Terminal',
        session_id: 'ID de session',
        status: 'Statut',
        expires_at: 'Expire le',
        terms: 'Conditions d\'utilisation',
        expiry: 'Expiration (secondes)',
        add: 'Démarrer une session terminal',
        start: 'Démarrer une session',
        stop: 'Arrêter la session',
        connect: 'Se connecter à la console',
        name: 'Nom du Terminal',
        nameOptional: 'Nom du Terminal (optionnel)',
        namePlaceholder: 'Donnez un nom à ce terminal...',
        editName: 'Modifier le nom',
        saveName: 'Enregistrer le nom',
        cancelEdit: 'Annuler',
        unnamed: 'Terminal sans nom',
        terminalWithPrefix: 'Terminal',
        userToAdd: 'Utilisateur à ajouter:',
        searchPlaceholder: 'Rechercher par nom ou email...',
        searchInProgress: 'Recherche en cours...',
        accessLevel: 'Niveau d\'accès:',
        readAccess: '👁️ Lecture - Peut voir la console',
        writeAccess: '✏️ Écriture - Peut interagir avec le terminal',
        adminAccess: '🔧 Admin - Peut gérer le terminal et le partage',
        expirationDate: 'Date d\'expiration (optionnel):',
        debugInfo: 'Debug Info',
        startNewSession: 'Démarrer une nouvelle session terminal',
        termsRequired: 'Conditions d\'utilisation (obligatoire):',
        expirySeconds: 'Durée d\'expiration (secondes, optionnel):',
        instanceType: 'Type d\'instance:',
        loading: 'Chargement...',
        sessionMissing: 'Session manquante',
        sessionIdNotProvided: 'L\'ID de session n\'a pas été fourni dans l\'URL.',
        expectedFormat: 'Format attendu:',
        initializingTerminal: 'Initialisation du terminal...',
        websocketConnected: 'WebSocket connecté',
        websocketDisconnected: 'WebSocket déconnecté',
        terminal: 'Terminal:',
        instance: 'Instance:',
        fullControl: 'Contrôle total du terminal',
        noActiveSharing: 'Aucun partage actif',
        notSharedWithUsers: 'Ce terminal n\'est partagé avec aucun autre utilisateur pour le moment.',
        connectionError: 'Erreur de connexion',
        // New translations for scalable instance system
        searchInstances: 'Rechercher un type d\'instance...',
        allInstances: 'Tous',
        availableInstances: 'Disponibles',
        restrictedInstances: 'Restreints',
        noInstancesFound: 'Aucune instance trouvée',
        noMatchingInstances: 'Aucune instance ne correspond à "{searchTerm}"',
        noAvailableInstances: 'Aucune instance disponible dans votre plan actuel.',
        allInstancesAvailable: 'Toutes les instances sont disponibles dans votre plan.',
        clearFilters: 'Réinitialiser les filtres',
        availableInPlan: 'Disponible dans votre plan',
        requiresUpgrade: 'Nécessite une mise à niveau',
        upgrade: 'Améliorer',
        currentUsage: 'Utilisation Actuelle',
        concurrentTerminals: 'terminaux simultanés',
        planLimit: 'limite de votre plan',
        sessionDuration: 'durée max par session',
        allowedSizes: 'tailles autorisées',
        yourPlanAllows: 'Votre plan autorise les tailles',
        selectEnvironmentType: 'Sélectionnez le type d\'environnement pour votre session terminal.',
        refreshUsage: 'Actualiser les données d\'utilisation',
        autoRefreshInfo: 'Les données d\'utilisation se rafraîchissent automatiquement toutes les {minutes} minutes',
        // Instance type translations
        instances: {
            alpine: {
                name: 'Alpine Linux',
                description: 'Distribution Linux légère'
            },
            debian: {
                name: 'Debian',
                description: 'Distribution Linux stable'
            },
            ubuntu: {
                name: 'Ubuntu Server',
                description: 'Distribution serveur populaire'
            }
        },
                startError: 'Erreur lors du démarrage de la session terminal',
                stopError: 'Erreur lors de l\'arrêt de la session terminal',
                loadError: 'Erreur lors du chargement des sessions terminal'
            },
            ui: {
                logout: 'Se déconnecter',
                disconnect: 'Se déconnecter',
                refresh: 'Actualiser',
                retry: 'Réessayer',
                managePaymentMethods: 'Gérez vos méthodes de paiement. Vos données bancaires sont sécurisées par Stripe.',
                noPaymentMethods: 'Aucune méthode de paiement',
                addCardToPurchase: 'Ajoutez une carte bancaire pour effectuer vos achats.',
                expiringSoon: 'Expire bientôt',
                availablePlans: 'Plans d\'abonnement disponibles. Contactez votre administrateur pour souscrire.',
                manageBillingAddresses: 'Gérez vos adresses de facturation. L\'adresse par défaut sera utilisée pour vos prochains achats.'
            },
            navigation: {
                courseDesign: 'Conception de cours',
                practicalWork: 'Travaux Pratiques',
                myAccount: 'Mon Compte',
                administration: 'Administration',
                createSession: 'Créer une Session',
                createNewTerminalSession: 'Créer une nouvelle session terminal',
                mySessions: 'Mes Sessions',
                manageTerminalSessions: 'Gérer mes sessions terminal',
                sharedSessions: 'Sessions Partagées',
                sessionsSharedWithMe: 'Sessions partagées avec moi',
                adminSubscriptionPlans: 'Plans d\'Abonnement (Admin)',
                adminSubscriptionPlansTitle: 'Administration des plans d\'abonnement',
                allInvoices: 'Toutes les Factures',
                viewAllSystemInvoices: 'Visualiser toutes les factures système',
                featureFlags: 'Feature Flags',
                featureFlagsTitle: 'Gérer les feature flags et fonctionnalités expérimentales',
                terminalMetrics: 'Métriques du Serveur',
                terminalMetricsTitle: 'Surveiller l\'utilisation des ressources du serveur et la capacité des terminaux',
                terminalBackends: 'Backends Terminal',
                terminalBackendsTitle: 'Gérer les serveurs backend des terminaux'
            }
        }
    })

    const fieldList = buildFieldList([
        field('id', 'ID').input().visible().readonly(),
        field('session_id', t('terminals.session_id')).input().visible().readonly(),
        field('status', t('terminals.status')).input().visible().readonly(),
        field('expires_at', t('terminals.expires_at')).input().visible().readonly(),
        field('terms', t('terminals.terms')).textarea().hidden().creatable().required(),
        field('expiry', t('terminals.expiry')).input().hidden().creatable(),
        field('created_at', 'Created at').input().visible().readonly(),
    ])

    // Actions spécifiques aux terminaux
    const startTerminalSession = async (sessionData: { terms: string, expiry?: number, instance_type?: string, name?: string, backend?: string, organization_id?: string }) => {
        return withAsync(async () => {
            const response = await axios.post('/terminals/start-session', sessionData)
            await getUserSessions()
            return response.data
        }, 'terminals.startError')
    }

    const stopTerminalSession = async (terminalId: string) => {
        return withAsync(async () => {
            await axios.post(`/terminals/${terminalId}/stop`)
            await getUserSessions()
            return true
        }, 'terminals.stopError')
    }

    const getUserSessions = async () => {
        return withAsync(async () => {
            const response = await axios.get('/terminals/user-sessions')
            activeSessions.value = response.data || []
            base.entities = activeSessions.value
            return activeSessions.value
        }, 'terminals.loadError', {
            onError: () => {
                activeSessions.value = []
                base.entities = []
            }
        })
    }

    // const getConsoleWebSocketUrl = (terminalId: string, width?: number, height?: number) => {
    //     const protocol = import.meta.env.VITE_PROTOCOL === 'https' ? 'wss' : 'ws'
    //     const apiUrl = import.meta.env.VITE_API_URL
    //     let url = `${protocol}://${apiUrl}/api/v1/terminals/${terminalId}/console`
        
    //     const params = new URLSearchParams()
    //     if (width) params.append('width', width.toString())
    //     if (height) params.append('height', height.toString())
        
    //     if (params.toString()) {
    //         url += `?${params.toString()}`
    //     }
        
    //     return url
    // }

    return {
        ...base, 
        fieldList,
        activeSessions,
        isLoading,
        error,
        startTerminalSession,
        stopTerminalSession,
        getUserSessions,
        //getConsoleWebSocketUrl
    }
})