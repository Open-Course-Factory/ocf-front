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

import type { useHelpRegistryStore } from '../stores/helpRegistry'

export function registerAccountHelp(store: ReturnType<typeof useHelpRegistryStore>) {
  store.registerSection({
    id: 'account',
    title: {
      en: 'Account Management',
      fr: 'Gestion du Compte'
    },
    description: {
      en: 'Manage your subscription, billing and account settings',
      fr: 'Gerez votre abonnement, facturation et parametres de compte'
    },
    icon: 'fas fa-user-cog',
    items: [
      {
        route: 'account/subscription',
        title: {
          en: 'Subscription & Plans',
          fr: 'Abonnement et Plans'
        },
        description: {
          en: 'Manage your subscription, understand plan features, and optimize your usage.',
          fr: 'Gerez votre abonnement, comprenez les fonctionnalites des plans et optimisez votre utilisation.'
        },
        icon: 'fas fa-calendar-check'
      },
      {
        route: 'account/billing',
        title: {
          en: 'Billing & Payments',
          fr: 'Facturation et Paiements'
        },
        description: {
          en: 'Everything you need to know about billing, payments, and financial management of your account.',
          fr: 'Tout ce que vous devez savoir sur la facturation, les paiements et la gestion financiere de votre compte.'
        },
        icon: 'fas fa-credit-card'
      },
      {
        route: 'account/roles-and-permissions',
        title: {
          en: 'Roles & Permissions',
          fr: 'Roles et Permissions'
        },
        description: {
          en: 'Understand organization roles and what each role can do.',
          fr: 'Comprendre les roles d\'organisation et ce que chaque role peut faire.'
        },
        icon: 'fas fa-user-shield'
      },
      {
        route: 'account/settings',
        title: {
          en: 'Settings & Preferences',
          fr: 'Parametres & Preferences'
        },
        description: {
          en: 'Configure your account settings to personalize your experience, from language and theme to security and notifications.',
          fr: 'Configurez les parametres de votre compte pour personnaliser votre experience, de la langue et du theme a la securite et aux notifications.'
        },
        icon: 'fas fa-cog'
      },
      {
        route: 'account/themes',
        title: {
          en: 'Dark Mode & Themes',
          fr: 'Mode sombre & Themes'
        },
        description: {
          en: 'Personalize the visual appearance of the platform with theme selection and display density options.',
          fr: 'Personnalisez l\'apparence visuelle de la plateforme avec le choix du theme et les options de densite d\'affichage.'
        },
        icon: 'fas fa-palette'
      }
    ]
  })
}
