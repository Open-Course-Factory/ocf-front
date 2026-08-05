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

import { inject, provide, type InjectionKey, type Ref } from 'vue'
import type { ClassGroup } from '../types'
import type { Organization } from '../types/organization'
import type { User } from '../services/domain/user'

/**
 * Everything the five pages of a class share, resolved once by ClassLayout.
 *
 * The old eight-tab page let every tab work out the caller's rights for itself,
 * which is how five of them could appear a moment after the page did. The layout
 * answers the question once, before it draws a single page link, and hands the
 * answer down — so a page never re-derives who the caller is, and the banner and
 * the pages can never disagree about it.
 */
export interface ClassContext {
  /** The class in the URL. Empty only if the route somehow carries no id. */
  groupId: Ref<string>
  /** Null while the class is loading; pages render only once it is set. */
  group: Ref<ClassGroup | null>
  subgroups: Ref<ClassGroup[]>
  ownerUser: Ref<User | null>
  organization: Ref<Organization | null>
  /** Live roster size — the members list once loaded, the class payload before. */
  memberCount: Ref<number>

  isPlatformAdmin: Ref<boolean>
  isOwner: Ref<boolean>
  isManager: Ref<boolean>
  /** Owner, manager or platform admin: may open the teaching pages. */
  canManageClass: Ref<boolean>
  /** Owner or platform admin: a manager may not delete the class. */
  canDeleteClass: Ref<boolean>

  /** Refetches the class and its roster, e.g. after a page saves the class. */
  reload: () => Promise<void>
  /** Keeps the banner count honest when a page adds or removes members. */
  applyMemberCountDelta: (delta: number) => void
}

const CLASS_CONTEXT_KEY: InjectionKey<ClassContext> = Symbol('classContext')

export function provideClassContext(context: ClassContext): void {
  provide(CLASS_CONTEXT_KEY, context)
}

export function useClassContext(): ClassContext {
  const context = inject(CLASS_CONTEXT_KEY)
  if (!context) {
    throw new Error('useClassContext() is only available inside a class page (ClassLayout)')
  }
  return context
}
