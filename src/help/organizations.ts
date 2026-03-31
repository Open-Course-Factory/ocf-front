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

export function registerOrganizationsHelp(store: ReturnType<typeof useHelpRegistryStore>) {
  store.registerSection({
    id: 'organizations',
    title: {
      en: 'Organizations & Groups',
      fr: 'Organisations & Groupes'
    },
    description: {
      en: 'Manage organizations, groups, bulk imports and licenses',
      fr: 'Gérez les organisations, les groupes, les importations en masse et les licences'
    },
    icon: 'fas fa-building',
    items: [
      {
        route: 'organizations/overview',
        title: {
          en: 'Organizations Overview',
          fr: 'Vue d\'ensemble des Organisations'
        },
        description: {
          en: 'Organizations are the top-level structure for managing teams, licenses, and content. Learn how to create and configure organizations effectively.',
          fr: 'Les organisations sont la structure de base pour gérer les équipes, les licences et le contenu. Apprenez à créer et configurer efficacement vos organisations.'
        },
        icon: 'fas fa-building'
      },
      {
        route: 'groups/management',
        title: {
          en: 'Group Management',
          fr: 'Gestion des Groupes'
        },
        description: {
          en: 'Groups allow you to organize members within an organization into classes, teams, or departments. Learn how to create, configure, and manage groups effectively.',
          fr: 'Les groupes permettent d\'organiser les membres au sein d\'une organisation en classes, équipes ou départements. Apprenez à créer, configurer et gérer efficacement vos groupes.'
        },
        icon: 'fas fa-users'
      },
      {
        route: 'organizations/bulk-import',
        title: {
          en: 'Bulk Import',
          fr: 'Import en Masse'
        },
        description: {
          en: 'Import multiple users into your organization at once using CSV files. This guide walks you through the import process, CSV format requirements, and best practices.',
          fr: 'Importez plusieurs utilisateurs dans votre organisation en une seule fois à l\'aide de fichiers CSV. Ce guide vous accompagne dans le processus d\'importation, les exigences de format CSV et les bonnes pratiques.'
        },
        icon: 'fas fa-file-import'
      },
      {
        route: 'licenses/bulk-purchase',
        title: {
          en: 'Bulk Licenses',
          fr: 'Licences en Volume'
        },
        description: {
          en: 'Purchase and manage licenses in bulk for your organization. Learn about batch purchasing, license assignment, and pricing tiers.',
          fr: 'Achetez et gérez des licences en volume pour votre organisation. Découvrez l\'achat par lots, l\'attribution de licences et les niveaux de tarification.'
        },
        icon: 'fas fa-id-badge'
      }
    ]
  })
}
