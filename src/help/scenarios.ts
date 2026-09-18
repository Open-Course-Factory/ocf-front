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
        component: () => import('../components/Pages/Help/ScenarioGettingStarted.vue'),
        title: {
          en: 'Getting Started with Scenarios',
          fr: 'Premiers pas avec les scénarios'
        },
        description: {
          en: 'From the catalogue to your history: launch a scenario, follow the steps in the player, verify your work, use hints, and see how a run ends.',
          fr: 'Du catalogue à votre historique : lancer un scénario, suivre les étapes dans le lecteur, vérifier votre travail, utiliser les indices, et comment une exécution se termine.'
        },
        icon: 'fas fa-play-circle'
      },
      {
        route: 'scenarios/creation',
        component: () => import('../components/Pages/Help/ScenarioCreation.vue'),
        title: {
          en: 'Creating Scenarios',
          fr: 'Création de scénarios'
        },
        description: {
          en: 'For trainers: the Scenario Editor, the four step types and their scripts, translations, preview, KillerCoda and JSON import, archiving.',
          fr: 'Pour les formateurs : l\'Éditeur de scénarios, les quatre types d\'étape et leurs scripts, les traductions, l\'aperçu, l\'import KillerCoda et JSON, l\'archivage.'
        },
        icon: 'fas fa-plus-circle'
      }
    ]
  })
}
