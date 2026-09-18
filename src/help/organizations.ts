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

export function registerOrganizationsHelp(store: ReturnType<typeof useHelpRegistryStore>) {
  store.registerSection({
    id: 'organizations',
    title: {
      en: 'Organizations',
      fr: 'Organisations'
    },
    description: {
      en: 'Personal and team organizations, members and roles, plans, bulk import and learner seats',
      fr: 'Organisations personnelles et d\'équipe, membres et rôles, forfaits, importation groupée et sièges apprenant'
    },
    icon: 'fas fa-building',
    items: [
      {
        route: 'organizations/overview',
        component: () => import('../components/Pages/Help/AccountOrganizations.vue'),
        title: {
          en: 'Organizations',
          fr: 'Organisations'
        },
        description: {
          en: 'Personal versus team organization, switching between them, who can create one, the members and their roles, and which plan an organization runs under.',
          fr: 'Organisation personnelle ou d\'équipe, passer de l\'une à l\'autre, qui peut en créer une, les membres et leurs rôles, et sous quel forfait une organisation fonctionne.'
        },
        icon: 'fas fa-building'
      },
      {
        route: 'groups/management',
        component: () => import('../components/Pages/Help/GroupManagement.vue'),
        title: {
          en: 'Groups and hierarchy',
          fr: 'Groupes et hiérarchie'
        },
        description: {
          en: 'A class is a group. The organization-wide Groups page, the hierarchy tree, and sub-groups — teaching itself lives in the Classes section.',
          fr: 'Une classe est un groupe. La page Groupes à l\'échelle de l\'organisation, l\'arbre de hiérarchie et les sous-groupes — l\'enseignement lui-même est dans la section Classes.'
        },
        icon: 'fas fa-users'
      },
      {
        route: 'organizations/bulk-import',
        component: () => import('../components/Pages/Help/BulkImport.vue'),
        title: {
          en: 'Bulk import',
          fr: 'Importation groupée'
        },
        description: {
          en: 'Create the accounts, classes and memberships of a whole cohort from three CSV files: formats, options, dry run, credentials.',
          fr: 'Créez les comptes, les classes et les adhésions d\'une cohorte entière à partir de trois fichiers CSV : formats, options, simulation, identifiants.'
        },
        icon: 'fas fa-file-import'
      },
      {
        route: 'licenses/bulk-purchase',
        component: () => import('../components/Pages/Help/BulkLicenses.vue'),
        title: {
          en: 'Bulk licenses',
          fr: 'Licences en volume'
        },
        description: {
          en: 'Learner seats bought in packs: quoting by class size and duration, assigning a seat to a learner, revoking it.',
          fr: 'Des sièges apprenant achetés par lots : devis selon la taille de la classe et la durée, attribution d\'un siège à un apprenant, révocation.'
        },
        icon: 'fas fa-id-badge'
      }
    ]
  })
}
