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
      en: 'Real Linux machines in your browser: create, use and manage your sessions',
      fr: 'De vraies machines Linux dans votre navigateur : créer, utiliser et gérer vos sessions'
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
          en: 'Pick an environment, a size and a few options, click Create, and work in a real Linux machine from your browser.',
          fr: 'Choisissez un environnement, une taille et quelques options, cliquez sur Créer, et travaillez dans une vraie machine Linux depuis votre navigateur.'
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
          en: 'The My sessions page, ephemeral and persistent sessions, the My usage panel and your command history.',
          fr: 'La page Mes sessions, sessions éphémères et persistantes, le panneau Mon utilisation et votre historique de commandes.'
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
          en: 'A session that will not start, a black terminal, a greyed button: what each message means and what to do',
          fr: 'Une session qui ne démarre pas, un terminal noir, un bouton grisé : ce que chaque message veut dire et quoi faire'
        },
        icon: 'fas fa-wrench'
      },
      {
        route: 'terminals/ssh-keys',
        component: () => import('../components/Pages/Help/SSHKeyManagement.vue'),
        title: {
          en: 'SSH keys and access key',
          fr: 'Clés SSH et clé d\'accès'
        },
        description: {
          en: 'Your terminal access key is created for you; this page explains it, and the SSH keys settings page.',
          fr: 'Votre clé d\'accès terminal est créée pour vous ; cette page l\'explique, ainsi que la page Clés SSH des paramètres.'
        },
        icon: 'fas fa-key'
      },
      {
        route: 'terminals/exposed-ports',
        component: () => import('../components/Pages/Help/TerminalExposedPorts.vue'),
        title: {
          en: 'Public URL for a port',
          fr: 'URL publique pour un port'
        },
        description: {
          en: 'Publish a web page, an API or a dashboard running in your session at a public URL for an hour.',
          fr: 'Publier une page web, une API ou un tableau de bord qui tourne dans votre session sur une URL publique, pendant une heure.'
        },
        icon: 'fas fa-plug'
      }
    ]
  })
}
