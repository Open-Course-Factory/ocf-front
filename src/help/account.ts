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

import type { useHelpRegistryStore } from '../stores/helpRegistry'

export function registerAccountHelp(store: ReturnType<typeof useHelpRegistryStore>) {
  store.registerSection({
    id: 'account',
    title: {
      en: 'Account',
      fr: 'Compte'
    },
    description: {
      en: 'Subscription, billing, roles, settings and appearance',
      fr: 'Abonnement, facturation, rôles, paramètres et apparence'
    },
    icon: 'fas fa-user-cog',
    items: [
      {
        route: 'account/subscription',
        component: () => import('../components/Pages/Help/AccountSubscription.vue'),
        title: {
          en: 'Subscription and plans',
          fr: 'Abonnement et plans'
        },
        description: {
          en: 'The plans, how to subscribe or change plan, and the subscription dashboard.',
          fr: 'Les formules, comment souscrire ou changer de plan, et le tableau de bord d\'abonnement.'
        },
        icon: 'fas fa-calendar-check'
      },
      {
        route: 'account/billing',
        component: () => import('../components/Pages/Help/AccountBilling.vue'),
        title: {
          en: 'Billing and payments',
          fr: 'Facturation et paiements'
        },
        description: {
          en: 'Invoices, billing addresses, payment methods and the Stripe portal.',
          fr: 'Factures, adresses de facturation, moyens de paiement et portail Stripe.'
        },
        icon: 'fas fa-credit-card'
      },
      {
        route: 'account/roles-and-permissions',
        component: () => import('../components/Pages/Help/RolesAndPermissions.vue'),
        title: {
          en: 'Roles and permissions',
          fr: 'Rôles et permissions'
        },
        description: {
          en: 'Who can do what on the platform, in an organisation and in a class.',
          fr: 'Qui peut faire quoi sur la plateforme, dans une organisation et dans une classe.'
        },
        icon: 'fas fa-user-shield'
      },
      {
        route: 'account/settings',
        component: () => import('../components/Pages/Help/SettingsPreferences.vue'),
        title: {
          en: 'Settings and preferences',
          fr: 'Paramètres et préférences'
        },
        description: {
          en: 'Landing page, language and timezone, notifications, password, account deletion.',
          fr: 'Page d\'accueil, langue et fuseau horaire, notifications, mot de passe, suppression du compte.'
        },
        icon: 'fas fa-cog'
      },
      {
        route: 'account/themes',
        component: () => import('../components/Pages/Help/DarkModeThemes.vue'),
        title: {
          en: 'Dark mode and themes',
          fr: 'Mode sombre et thèmes'
        },
        description: {
          en: 'Light, dark or automatic theme, and where to switch.',
          fr: 'Thème clair, sombre ou automatique, et où le changer.'
        },
        icon: 'fas fa-palette'
      },
      {
        route: 'account/permissions-reference',
        component: () => import('../components/Pages/Help/PermissionsReference.vue'),
        title: {
          en: 'API permissions reference',
          fr: 'Référence des permissions API'
        },
        description: {
          en: 'For integrators: every API endpoint with its platform role and access rule, generated from the running API.',
          fr: 'Pour les intégrateurs : chaque endpoint de l\'API avec son rôle de plateforme et sa règle d\'accès, généré depuis l\'API en service.'
        },
        icon: 'fas fa-lock'
      }
    ]
  })
}
