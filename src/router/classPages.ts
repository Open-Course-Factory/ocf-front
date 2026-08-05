/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

import type { LocationQuery, RouteLocationRaw } from 'vue-router'

/**
 * The five pages of a class, each its own route and its own URL.
 *
 * Named here rather than spelled out at every call site because three things
 * have to agree on them: the banner links, the layout's access guard, and the
 * redirect that keeps old `/class-groups/:id?tab=` links working.
 */
export const CLASS_PAGE_NAMES = {
  live: 'ClassLive',
  members: 'ClassMembers',
  scenarios: 'ClassScenarios',
  analytics: 'ClassAnalytics',
  settings: 'ClassSettings',
} as const

export type ClassPageKey = keyof typeof CLASS_PAGE_NAMES

/** The page every retired tab of the old eight-tab class page now lives on. */
const RETIRED_TAB_DESTINATIONS: Record<string, ClassPageKey> = {
  // "Aperçu" died as a page; its metadata moved into the settings page.
  overview: 'settings',
  members: 'members',
  scenarios: 'scenarios',
  live: 'live',
  // "Activité" had already merged into the live class tab (#310); the key
  // outlives it in bookmarks and browser history.
  activity: 'live',
  analytics: 'analytics',
  // Command replay is a section of the analytics page now, opened by `section`.
  history: 'analytics',
  settings: 'settings',
}

/**
 * Everything a link may carry through the move. `view` is the live page's own
 * representation switch (`?view=wall` opens the wall of tiles), and the retired
 * history tab keeps its destination open by asking for its section by name.
 */
function forwardedQuery(page: ClassPageKey, tab: string, query: LocationQuery): Record<string, string> {
  if (page === 'live' && typeof query.view === 'string') {
    return { view: query.view }
  }
  if (tab === 'history') {
    return { section: 'history' }
  }
  return {}
}

/**
 * Where an old `/class-groups/:id?tab=…` link goes now.
 *
 * A tab value that means nothing here — absent, mistyped, or left over from a
 * build nobody runs any more — opens the default page rather than failing to
 * resolve, so no bookmark can dead-end.
 */
export function classPageForRetiredTab(id: string, query: LocationQuery): RouteLocationRaw {
  const tab = typeof query.tab === 'string' ? query.tab : ''
  const page = RETIRED_TAB_DESTINATIONS[tab] ?? 'live'

  return {
    name: CLASS_PAGE_NAMES[page],
    params: { id },
    query: forwardedQuery(page, tab, query),
  }
}
