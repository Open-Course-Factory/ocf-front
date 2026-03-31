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

import type { Router } from 'vue-router'
import { useHelpRegistryStore } from '../stores/helpRegistry'
import { registerTerminalsHelp } from './terminals'
import { registerScenariosHelp } from './scenarios'
import { registerCoursesHelp } from './courses'
import { registerOrganizationsHelp } from './organizations'
import { registerAccountHelp } from './account'
import { registerPermissionsHelp } from './permissions'

export function registerAllHelp() {
  const store = useHelpRegistryStore()
  store.clearSections() // Idempotent: clear before re-registering (needed for Vite HMR)
  registerTerminalsHelp(store)
  registerScenariosHelp(store)
  registerCoursesHelp(store)
  registerOrganizationsHelp(store)
  registerAccountHelp(store)
  registerPermissionsHelp(store)
}

export function registerHelpRoutes(router: Router) {
  const store = useHelpRegistryStore()

  for (const section of store.sections) {
    for (const item of section.items) {
      if (!item.component) continue

      // Authenticated route (nested under Layout)
      router.addRoute('Layout', {
        path: `help/${item.route}`,
        name: `Help_${item.route.replace(/\//g, '_')}`,
        component: item.component,
        meta: { requiresAuth: true }
      })

      // Public route
      router.addRoute({
        path: `/help-public/${item.route}`,
        name: `HelpPublic_${item.route.replace(/\//g, '_')}`,
        component: item.component,
        meta: { requiresAuth: false }
      })
    }
  }
}
