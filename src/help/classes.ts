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

export function registerClassesHelp(store: ReturnType<typeof useHelpRegistryStore>) {
  store.registerSection({
    id: 'classes',
    title: {
      en: 'Classes',
      fr: 'Classes'
    },
    description: {
      en: 'Create a class, bring your learners in, assign scenarios, follow them live and read their results',
      fr: 'Créez une classe, ajoutez vos apprenants, assignez des scénarios, suivez-les en direct et lisez leurs résultats'
    },
    icon: 'fas fa-chalkboard-teacher',
    // Same gate as the "Mes classes" entry in the main menu.
    featureFlag: 'class_groups',
    items: [
      {
        route: 'classes/overview',
        component: () => import('../components/Pages/Help/ClassesOverview.vue'),
        title: {
          en: 'What a class is',
          fr: 'Qu\'est-ce qu\'une classe ?'
        },
        description: {
          en: 'A class gathers your learners, the scenarios you assign them and everything you see about their work. Where classes live, the "My classes" console and how to create one.',
          fr: 'Une classe réunit vos apprenants, les scénarios que vous leur assignez et tout ce que vous voyez de leur travail. Où vivent les classes, la console « Mes classes » et comment en créer une.'
        },
        icon: 'fas fa-chalkboard-teacher'
      },
      {
        route: 'classes/members',
        component: () => import('../components/Pages/Help/ClassesMembers.vue'),
        title: {
          en: 'Adding learners',
          fr: 'Ajouter des apprenants'
        },
        description: {
          en: 'One by one from the Learners page, or by CSV import at organization level. Roles in a class, password regeneration.',
          fr: 'Un par un depuis la page Apprenants, ou par import CSV au niveau de l\'organisation. Les rôles dans une classe, la régénération des mots de passe.'
        },
        icon: 'fas fa-user-plus'
      },
      {
        route: 'classes/scenarios',
        component: () => import('../components/Pages/Help/ClassesScenarios.vue'),
        title: {
          en: 'Assigning scenarios',
          fr: 'Assigner des scénarios'
        },
        description: {
          en: 'Assign a scenario to the class with a start date and a deadline, start it for everyone at once, and what your learners see on their side.',
          fr: 'Assignez un scénario à la classe avec une date de début et une date limite, lancez-le pour tout le monde d\'un coup, et ce que vos apprenants voient de leur côté.'
        },
        icon: 'fas fa-clipboard-list'
      },
      {
        route: 'classes/live',
        component: () => import('../components/Pages/Help/ClassesLive.vue'),
        title: {
          en: 'Following the class live',
          fr: 'Suivre la classe en direct'
        },
        description: {
          en: 'Progress step by step, who is connected, who is stuck, the wall of terminals, and typing in a learner\'s terminal alongside them.',
          fr: 'La progression étape par étape, qui est connecté, qui bloque, le mur des terminaux, et écrire dans le terminal d\'un apprenant à ses côtés.'
        },
        icon: 'fas fa-play'
      },
      {
        route: 'classes/results',
        component: () => import('../components/Pages/Help/ClassesResults.vue'),
        title: {
          en: 'Results and analytics',
          fr: 'Résultats et analytiques'
        },
        description: {
          en: 'Per-scenario figures, each learner\'s results step by step, the command replay, and CSV exports.',
          fr: 'Les chiffres par scénario, les résultats de chaque apprenant étape par étape, la relecture des commandes et les exports CSV.'
        },
        icon: 'fas fa-chart-bar'
      },
      {
        route: 'classes/settings',
        component: () => import('../components/Pages/Help/ClassesSettings.vue'),
        title: {
          en: 'Settings and archiving',
          fr: 'Réglages et archivage'
        },
        description: {
          en: 'Rename a class, set its size and expiry, create sub-groups, and close it at the end of the year — what archiving does for learners.',
          fr: 'Renommer une classe, fixer sa taille et son expiration, créer des sous-groupes, et la clôturer en fin d\'année — ce que l\'archivage change pour les apprenants.'
        },
        icon: 'fas fa-cog'
      }
    ]
  })
}
