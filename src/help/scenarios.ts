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

export function registerScenariosHelp(store: ReturnType<typeof useHelpRegistryStore>) {
  store.registerSection({
    id: 'scenarios',
    title: {
      en: 'Interactive Scenarios',
      fr: 'Scenarios interactifs'
    },
    description: {
      en: 'Learn how to use and create step-by-step interactive lab exercises',
      fr: 'Apprenez a utiliser et creer des exercices pratiques interactifs etape par etape'
    },
    icon: 'fas fa-flag-checkered',
    featureFlag: 'scenarios',
    items: [
      {
        route: 'scenarios/getting-started',
        title: {
          en: 'Getting Started with Scenarios',
          fr: 'Premiers pas avec les scenarios'
        },
        description: {
          en: 'Interactive scenarios are guided, step-by-step lab exercises that run on real Linux terminals. Follow instructions, execute commands, and get instant feedback on your progress.',
          fr: 'Les scenarios interactifs sont des exercices pratiques guides, etape par etape, qui s\'executent sur de vrais terminaux Linux. Suivez les instructions, executez des commandes et obtenez un retour instantane sur votre progression.'
        },
        icon: 'fas fa-play-circle'
      },
      {
        route: 'scenarios/creation',
        title: {
          en: 'Creating Scenarios',
          fr: 'Creation de scenarios'
        },
        description: {
          en: 'Learn how to build engaging, step-by-step interactive exercises for your learners with real terminal environments, verification scripts, and CTF challenges.',
          fr: 'Apprenez a concevoir des exercices interactifs engageants, etape par etape, pour vos apprenants avec des environnements terminaux reels, des scripts de verification et des defis CTF.'
        },
        icon: 'fas fa-plus-circle'
      }
    ]
  })
}
