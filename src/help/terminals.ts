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

export function registerTerminalsHelp(store: ReturnType<typeof useHelpRegistryStore>) {
  store.registerSection({
    id: 'terminals',
    title: {
      en: 'Terminals',
      fr: 'Terminaux'
    },
    description: {
      en: 'Learn how to create and manage your terminal sessions',
      fr: 'Apprenez à créer et gérer vos sessions de terminaux'
    },
    icon: 'fas fa-terminal',
    featureFlag: 'terminal_management',
    items: [
      {
        route: 'terminals/getting-started',
        component: () => import('../components/Pages/Help/TerminalGettingStarted.vue'),
        title: {
          en: 'Getting Started',
          fr: 'Premiers Pas'
        },
        description: {
          en: 'Terminals are virtual development environments that allow you to work on your projects directly from your browser. This guide will help you create your first terminal session.',
          fr: 'Les terminaux sont des environnements de développement virtuels qui vous permettent de travailler sur vos projets directement depuis votre navigateur. Ce guide vous aidera à créer votre première session terminal.'
        },
        icon: 'fas fa-play-circle'
      },
      {
        route: 'terminals/managing-sessions',
        component: () => import('../components/Pages/Help/TerminalManagingSessions.vue'),
        title: {
          en: 'Managing Sessions',
          fr: 'Gestion des Sessions'
        },
        description: {
          en: 'Learn how to effectively manage your terminal sessions, synchronize your work, and access your environments from anywhere.',
          fr: 'Apprenez à gérer efficacement vos sessions terminal, synchroniser votre travail et accéder à vos environnements depuis n\'importe où.'
        },
        icon: 'fas fa-cogs'
      },
      {
        route: 'terminals/troubleshooting',
        component: () => import('../components/Pages/Help/TerminalTroubleshooting.vue'),
        title: {
          en: 'Troubleshooting',
          fr: 'Dépannage'
        },
        description: {
          en: 'Solutions to common problems and incident resolution guide',
          fr: 'Solutions aux problèmes courants et guide de résolution des incidents'
        },
        icon: 'fas fa-wrench'
      },
      {
        route: 'terminals/ssh-keys',
        component: () => import('../components/Pages/Help/SSHKeyManagement.vue'),
        title: {
          en: 'SSH Key Management',
          fr: 'Gestion des clés SSH'
        },
        description: {
          en: 'Manage your terminal access keys to connect to terminal sessions securely.',
          fr: 'Gérez vos clés d\'accès terminal pour vous connecter aux sessions de terminal en toute sécurité.'
        },
        icon: 'fas fa-key'
      }
    ]
  })
}
