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

export function registerScenariosHelp(store: ReturnType<typeof useHelpRegistryStore>) {
  store.registerSection({
    id: 'scenarios',
    title: {
      en: 'Interactive Scenarios',
      fr: 'Scénarios interactifs'
    },
    description: {
      en: 'Learn how to use and create step-by-step interactive lab exercises',
      fr: 'Apprenez à utiliser et créer des exercices pratiques interactifs étape par étape'
    },
    icon: 'fas fa-flag-checkered',
    featureFlag: 'scenarios',
    items: [
      {
        route: 'scenarios/getting-started',
        title: {
          en: 'Getting Started with Scenarios',
          fr: 'Premiers pas avec les scénarios'
        },
        description: {
          en: 'Interactive scenarios are guided, step-by-step lab exercises that run on real Linux terminals. Follow instructions, execute commands, and get instant feedback on your progress.',
          fr: 'Les scénarios interactifs sont des exercices pratiques guidés, étape par étape, qui s\'exécutent sur de vrais terminaux Linux. Suivez les instructions, exécutez des commandes et obtenez un retour instantané sur votre progression.'
        },
        icon: 'fas fa-play-circle'
      },
      {
        route: 'scenarios/creation',
        title: {
          en: 'Creating Scenarios',
          fr: 'Création de scénarios'
        },
        description: {
          en: 'Learn how to build engaging, step-by-step interactive exercises for your learners with real terminal environments, verification scripts, and CTF challenges.',
          fr: 'Apprenez à concevoir des exercices interactifs engageants, étape par étape, pour vos apprenants avec des environnements terminaux réels, des scripts de vérification et des défis CTF.'
        },
        icon: 'fas fa-plus-circle'
      }
    ]
  })
}
