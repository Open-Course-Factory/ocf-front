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

export function registerTerminalsHelp(store: ReturnType<typeof useHelpRegistryStore>) {
  store.registerSection({
    id: 'terminals',
    title: {
      en: 'Terminals',
      fr: 'Terminaux'
    },
    description: {
      en: 'Learn how to create, manage and share your terminal sessions',
      fr: 'Apprenez a creer, gerer et partager vos sessions de terminaux'
    },
    icon: 'fas fa-terminal',
    featureFlag: 'terminal_management',
    items: [
      {
        route: 'terminals/getting-started',
        title: {
          en: 'Getting Started',
          fr: 'Premiers Pas'
        },
        description: {
          en: 'Terminals are virtual development environments that allow you to work on your projects directly from your browser. This guide will help you create your first terminal session.',
          fr: 'Les terminaux sont des environnements de developpement virtuels qui vous permettent de travailler sur vos projets directement depuis votre navigateur. Ce guide vous aidera a creer votre premiere session terminal.'
        },
        icon: 'fas fa-play-circle'
      },
      {
        route: 'terminals/managing-sessions',
        title: {
          en: 'Managing Sessions',
          fr: 'Gestion des Sessions'
        },
        description: {
          en: 'Learn how to effectively manage your terminal sessions, synchronize your work, and access your environments from anywhere.',
          fr: 'Apprenez a gerer efficacement vos sessions terminal, synchroniser votre travail et acceder a vos environnements depuis n\'importe ou.'
        },
        icon: 'fas fa-cogs'
      },
      {
        route: 'terminals/sharing',
        title: {
          en: 'Sharing & Collaboration',
          fr: 'Partage et Collaboration'
        },
        description: {
          en: 'Terminals can be shared with other users to facilitate collaboration, teaching, or technical support.',
          fr: 'Les terminaux peuvent etre partages avec d\'autres utilisateurs pour faciliter la collaboration, l\'enseignement ou le support technique.'
        },
        icon: 'fas fa-share-alt'
      },
      {
        route: 'terminals/troubleshooting',
        title: {
          en: 'Troubleshooting',
          fr: 'Depannage'
        },
        description: {
          en: 'Solutions to common problems and incident resolution guide',
          fr: 'Solutions aux problemes courants et guide de resolution des incidents'
        },
        icon: 'fas fa-wrench'
      },
      {
        route: 'terminals/ssh-keys',
        title: {
          en: 'SSH Key Management',
          fr: 'Gestion des cles SSH'
        },
        description: {
          en: 'Manage your terminal access keys to connect to terminal sessions securely.',
          fr: 'Gerez vos cles d\'acces terminal pour vous connecter aux sessions de terminal en toute securite.'
        },
        icon: 'fas fa-key'
      }
    ]
  })
}
