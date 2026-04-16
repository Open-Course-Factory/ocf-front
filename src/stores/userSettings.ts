/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
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
import { ref, computed } from "vue"
import axios from "axios"
import { useFeatureFlags } from "../composables/useFeatureFlags"
import { createAsyncWrapper } from '../utils/asyncWrapper'
import { useStoreTranslations } from '../composables/useTranslations'
import { COMMON_TIMEZONES } from '../utils/formatters'

export interface UserSettings {
    id?: string
    user_id?: string
    default_landing_page?: string
    preferred_language?: string
    timezone?: string
    theme?: string
    compact_mode?: boolean
    email_notifications?: boolean
    desktop_notifications?: boolean
    password_last_changed?: string
    two_factor_enabled?: boolean
    recording_acknowledged_at?: string
    created_at?: string
    updated_at?: string
}

export interface ChangePasswordData {
    current_password: string
    new_password: string
    confirm_password: string
}

export const useUserSettingsStore = defineStore('UserSettings', () => {
    const { t } = useStoreTranslations({
        en: {
            userSettings: {
                pageTitle: "User Settings",
                menu: {
                    navigation: "Navigation",
                    localization: "Localization",
                    ui: "User Interface",
                    notifications: "Notifications",
                    security: "Security",
                    sshKeys: "SSH Keys"
                },
                navigation: {
                    title: "Navigation Preferences",
                    defaultLandingPage: "Default Landing Page",
                    defaultLandingPageHelp: "Page to show after login"
                },
                localization: {
                    title: "Localization",
                    preferredLanguage: "Preferred Language",
                    timezone: "Timezone",
                    timezonePlaceholder: "UTC"
                },
                ui: {
                    title: "User Interface",
                    theme: "Theme",
                    compactMode: "Compact Mode",
                    compactModeHelp: "Reduce spacing and padding for a more compact interface"
                },
                notifications: {
                    title: "Notifications",
                    emailNotifications: "Email Notifications",
                    emailNotificationsHelp: "Receive notifications via email",
                    desktopNotifications: "Desktop Notifications",
                    desktopNotificationsHelp: "Show browser notifications"
                },
                security: {
                    title: "Security",
                    passwordLastChanged: "Password Last Changed",
                    twoFactorEnabled: "Two-Factor Authentication",
                    changePassword: "Change Password",
                    currentPassword: "Current Password",
                    newPassword: "New Password",
                    confirmPassword: "Confirm New Password",
                    passwordChanged: "Password changed successfully",
                    passwordMismatch: "Passwords do not match",
                    passwordWeak: "Password is too weak",
                    yes: "Yes",
                    no: "No",
                    never: "Never",
                    changing: "Changing...",
                    errorChangingPassword: "Error changing password"
                },
                deleteAccount: {
                    title: "Danger Zone",
                    description: "Permanently delete your account and all associated data. This action is irreversible.",
                    button: "Delete my account",
                    modalTitle: "Delete account",
                    modalWarning: "This action is permanent and cannot be undone.",
                    willDelete: "Will be permanently deleted:",
                    willDeleteItems: {
                        terminalSessions: "Terminal sessions",
                        sshKeys: "SSH keys",
                        scenarioHistory: "Scenario history and progress",
                        memberships: "Group and organization memberships"
                    },
                    willAnonymize: "Will be anonymized (kept for accounting):",
                    willAnonymizeItems: {
                        invoices: "Invoices",
                        paymentRecords: "Payment records"
                    },
                    mustTransfer: "You must first transfer ownership of any organizations or groups you own before deleting your account.",
                    typeConfirmation: "Type {confirmText} to confirm:",
                    confirm: "Permanently delete",
                    cancel: "Cancel",
                    deleting: "Deleting...",
                    success: "Account deleted successfully",
                    error: "Failed to delete account"
                },
                themes: {
                    light: "Light",
                    dark: "Dark",
                    auto: "Auto (System)"
                },
                languages: {
                    en: "English",
                    fr: "Français"
                },
                saveSuccess: "Settings saved successfully",
                saveError: "Error saving settings",
                loadError: "Error loading settings",
                loading: "Loading...",
                saving: "Saving...",
                unknown: "Unknown"
            }
        },
        fr: {
            userSettings: {
                pageTitle: "Paramètres Utilisateur",
                menu: {
                    navigation: "Navigation",
                    localization: "Localisation",
                    ui: "Interface Utilisateur",
                    notifications: "Notifications",
                    security: "Sécurité",
                    sshKeys: "Clés SSH"
                },
                navigation: {
                    title: "Préférences de Navigation",
                    defaultLandingPage: "Page d'Accueil par Défaut",
                    defaultLandingPageHelp: "Page à afficher après connexion"
                },
                localization: {
                    title: "Localisation",
                    preferredLanguage: "Langue Préférée",
                    timezone: "Fuseau Horaire",
                    timezonePlaceholder: "UTC"
                },
                ui: {
                    title: "Interface Utilisateur",
                    theme: "Thème",
                    compactMode: "Mode Compact",
                    compactModeHelp: "Réduire l'espacement et le remplissage pour une interface plus compacte"
                },
                notifications: {
                    title: "Notifications",
                    emailNotifications: "Notifications par Email",
                    emailNotificationsHelp: "Recevoir des notifications par email",
                    desktopNotifications: "Notifications Bureau",
                    desktopNotificationsHelp: "Afficher les notifications dans le navigateur"
                },
                security: {
                    title: "Sécurité",
                    passwordLastChanged: "Mot de Passe Modifié le",
                    twoFactorEnabled: "Authentification à Deux Facteurs",
                    changePassword: "Changer le Mot de Passe",
                    currentPassword: "Mot de Passe Actuel",
                    newPassword: "Nouveau Mot de Passe",
                    confirmPassword: "Confirmer le Nouveau Mot de Passe",
                    passwordChanged: "Mot de passe modifié avec succès",
                    passwordMismatch: "Les mots de passe ne correspondent pas",
                    passwordWeak: "Le mot de passe est trop faible",
                    yes: "Oui",
                    no: "Non",
                    never: "Jamais",
                    changing: "Modification...",
                    errorChangingPassword: "Erreur lors du changement de mot de passe"
                },
                deleteAccount: {
                    title: "Zone de danger",
                    description: "Supprimer définitivement votre compte et toutes les données associées. Cette action est irréversible.",
                    button: "Supprimer mon compte",
                    modalTitle: "Suppression du compte",
                    modalWarning: "Cette action est permanente et irréversible.",
                    willDelete: "Seront supprimés définitivement :",
                    willDeleteItems: {
                        terminalSessions: "Sessions de terminal",
                        sshKeys: "Clés SSH",
                        scenarioHistory: "Historique et progression des scénarios",
                        memberships: "Appartenances aux groupes et organisations"
                    },
                    willAnonymize: "Seront anonymisés (conservés pour la comptabilité) :",
                    willAnonymizeItems: {
                        invoices: "Factures",
                        paymentRecords: "Enregistrements de paiement"
                    },
                    mustTransfer: "Vous devez d'abord transférer la propriété de toutes les organisations ou groupes dont vous êtes propriétaire avant de supprimer votre compte.",
                    typeConfirmation: "Tapez {confirmText} pour confirmer :",
                    confirm: "Supprimer définitivement",
                    cancel: "Annuler",
                    deleting: "Suppression...",
                    success: "Compte supprimé avec succès",
                    error: "Échec de la suppression du compte"
                },
                themes: {
                    light: "Clair",
                    dark: "Sombre",
                    auto: "Auto (Système)"
                },
                languages: {
                    en: "Anglais",
                    fr: "Français"
                },
                saveSuccess: "Paramètres enregistrés avec succès",
                saveError: "Erreur lors de l'enregistrement des paramètres",
                loadError: "Erreur lors du chargement des paramètres",
                loading: "Chargement...",
                saving: "Enregistrement...",
                unknown: "Inconnu"
            }
        }
    })

    const { isEnabled } = useFeatureFlags()

    // State
    const settings = ref<UserSettings>({})
    const isLoading = ref(false)
    const error = ref('')

    // Create async wrapper with store state
    const withAsync = createAsyncWrapper({ isLoading, error })

    // Available options (with feature flags)
    const allPages = [
        { value: '/courses', label: 'Courses', featureFlag: 'course_conception' },
        { value: '/subscription-dashboard', label: 'Subscription Dashboard' },
        { value: '/terminal-sessions', label: 'Terminal Sessions', featureFlag: 'terminal_management' }
    ]

    // Filter pages based on feature flags
    const availablePages = computed(() => {
        return allPages.filter(page => {
            // If no feature flag is required, always show the page
            if (!page.featureFlag) return true
            // Otherwise, check if the feature flag is enabled
            return isEnabled(page.featureFlag)
        })
    })

    const availableLanguages = [
        { value: 'en', label: t('userSettings.languages.en') },
        { value: 'fr', label: t('userSettings.languages.fr') }
    ]

    const availableThemes = [
        { value: 'light', label: t('userSettings.themes.light') },
        { value: 'dark', label: t('userSettings.themes.dark') },
        { value: 'auto', label: t('userSettings.themes.auto') }
    ]

    const availableTimezones = COMMON_TIMEZONES

    // API Calls
    async function loadSettings() {
        return withAsync(async () => {
            const response = await axios.get('/users/me/settings')
            settings.value = response.data
            return response.data
        }, 'userSettings.loadError')
    }

    async function updateSettings(data: Partial<UserSettings>) {
        return withAsync(async () => {
            const response = await axios.patch('/users/me/settings', data)
            settings.value = { ...settings.value, ...response.data }
            return response.data
        }, 'userSettings.saveError')
    }

    async function changePassword(data: ChangePasswordData) {
        return withAsync(async () => {
            await axios.post('/users/me/change-password', data)
            // Update password last changed date
            await loadSettings()
        }, 'userSettings.security.errorChangingPassword')
    }

    return {
        settings,
        isLoading,
        error,
        availablePages,
        availableLanguages,
        availableThemes,
        availableTimezones,
        loadSettings,
        updateSettings,
        changePassword
    }
})
