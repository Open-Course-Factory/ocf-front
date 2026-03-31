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

export function registerPermissionsHelp(store: ReturnType<typeof useHelpRegistryStore>) {
  store.registerSection({
    id: 'permissions',
    title: {
      en: 'Permissions Reference',
      fr: 'Référence des permissions'
    },
    description: {
      en: 'Complete technical reference of all API endpoints and their access control rules',
      fr: 'Référence technique complète de tous les endpoints API et de leurs règles de contrôle d\'accès'
    },
    icon: 'fas fa-lock',
    items: [
      {
        route: 'account/permissions-reference',
        component: () => import('../components/Pages/Help/PermissionsReference.vue'),
        title: {
          en: 'API Permissions Reference',
          fr: 'Référence des permissions API'
        },
        description: {
          en: 'Complete technical reference of all API endpoints and their access control rules.',
          fr: 'Référence technique complète de tous les endpoints API et de leurs règles de contrôle d\'accès.'
        },
        icon: 'fas fa-lock'
      }
    ]
  })
}
