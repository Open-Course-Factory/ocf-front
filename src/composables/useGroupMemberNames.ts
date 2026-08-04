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

import { ref } from 'vue'
import { fetchGroupMembers, type GroupMember } from './useGroupMembers'

/**
 * Resolves the opaque `user_id` carried by terminal sessions into a human name.
 *
 * Session listings (GET /terminals/user-sessions?group_id=…) return ids only, so
 * a teacher looking at a class needs one extra read to put a name on each card.
 * That read is the group roster, fetched ONCE per group and kept for the
 * lifetime of the page: never one call per row.
 */
export function useGroupMemberNames() {
  // groupId -> (userId -> display name). Populated on first look at a group.
  const rosters = new Map<string, Map<string, string>>()
  const currentNames = ref<Map<string, string>>(new Map())

  // Identifies the group whose roster the caller last asked for, so a slow
  // response for a group the user has already left behind is discarded instead
  // of labelling the sessions of another class.
  let awaitedGroupId: string | null = null

  function memberName(member: GroupMember): string {
    return member.user?.display_name || member.user?.username || member.user?.email || member.user_id
  }

  /**
   * Makes `nameFor` answer for `groupId`. Passing null clears the mapping, which
   * is what leaving group mode needs.
   */
  async function loadRoster(groupId: string | null): Promise<void> {
    awaitedGroupId = groupId

    if (!groupId) {
      currentNames.value = new Map()
      return
    }

    const cached = rosters.get(groupId)
    if (cached) {
      currentNames.value = cached
      return
    }

    let roster = new Map<string, string>()
    try {
      const members = await fetchGroupMembers(groupId)
      roster = new Map(members.map(member => [member.user_id, memberName(member)]))
      rosters.set(groupId, roster)
    } catch (err) {
      // A roster we cannot read costs the names, not the listing: sessions still
      // render, labelled by id. Not cached, so a later switch back retries.
      console.warn(`Failed to resolve learner names for group ${groupId}:`, err)
    }

    if (awaitedGroupId === groupId) {
      currentNames.value = roster
    }
  }

  /** The learner's name, falling back to the raw id when unresolved. */
  function nameFor(userId: string): string {
    return currentNames.value.get(userId) || userId
  }

  return { loadRoster, nameFor }
}
