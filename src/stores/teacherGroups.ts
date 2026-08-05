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

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { teacherService, type TeacherGroupSummary } from '../services/domain/scenario/teacherService'
import { useOrganizationsStore } from './organizations'

/**
 * Read-only cache of GET /teacher/groups — every class the current user owns or
 * manages, with its live session count and assignment progress (issue #309).
 *
 * Deliberately NOT built on `useBaseStore`: there is no entity to create, edit
 * or delete here and no `fieldList` to render, so the CRUD surface would be
 * dead weight the callers still have to read past.
 *
 * It is one cache for three consumers — the "Mes classes" console, the live
 * counters on the group cards, and the post-login landing decision — precisely
 * so those three never disagree about what the teacher manages, and so the
 * cards never issue a request per card.
 *
 * The endpoint answers across every organization; the product decision is that
 * teacher surfaces show ONE organization at a time. So the cache stays whole
 * and the org rule lives here, once, as a derived view — a component filtering
 * on its own would be a second copy of that rule for the landing decision to
 * drift from.
 */
export const useTeacherGroupsStore = defineStore('teacherGroups', () => {
  const groups = ref<TeacherGroupSummary[]>([])
  const isLoaded = ref(false)
  const isLoading = ref(false)
  const error = ref('')
  const loadedAt = ref<number | null>(null)

  // Shared by concurrent ensureLoaded() callers so that every one of them awaits
  // the SAME request and sees the data when it resolves.
  let inFlight: Promise<void> | null = null

  const managesAnyClass = computed(() => groups.value.length > 0)

  /**
   * The classes of the ACTIVE organization — what every teacher surface shows.
   *
   * Empty while the organization context is still unknown rather than falling
   * back to "all": showing another organization's classes for one paint is the
   * mistake the org-scoping decision exists to prevent, and the list fills in
   * by itself as soon as the organizations load.
   */
  const groupsInCurrentOrganization = computed(() => {
    const currentOrganizationId = useOrganizationsStore().currentOrganization?.id
    if (!currentOrganizationId) return []
    return groups.value.filter(group => group.organization_id === currentOrganizationId)
  })

  const managesClassInCurrentOrganization = computed(() =>
    groupsInCurrentOrganization.value.length > 0
  )

  // True when the caller teaches somewhere, just not here — the console says so
  // rather than implying they have no classes at all.
  const managesClassInAnotherOrganization = computed(() =>
    managesAnyClass.value && !managesClassInCurrentOrganization.value
  )

  const liveSessionCountByGroupId = computed(() => {
    const counts: Record<string, number> = {}
    for (const group of groups.value) {
      counts[group.group_id] = group.live_session_count
    }
    return counts
  })

  /**
   * Live sessions in one class, or `undefined` when the caller does not manage
   * it — which is not the same as zero, and consumers must be able to tell the
   * two apart (a card for someone else's group shows no counter at all).
   *
   * Deliberately keyed off the WHOLE cache rather than the org-scoped view: the
   * lookup is by group id, so it is already as narrow as the caller's question,
   * and scoping it twice would only make a card go blank when its own page
   * disagreed with the org context by a paint.
   */
  const liveSessionCountOf = (groupId: string): number | undefined =>
    liveSessionCountByGroupId.value[groupId]

  const loadGroups = async (): Promise<void> => {
    isLoading.value = true
    error.value = ''
    try {
      groups.value = await teacherService.getManagedGroups()
      isLoaded.value = true
      loadedAt.value = Date.now()
    } catch (err: any) {
      error.value = err?.response?.data?.error_message ||
                    err?.response?.data?.message ||
                    err?.message ||
                    'Failed to load classes'
      // The last known classes are kept: a refresh that fails must leave the
      // console showing yesterday's truth with an error, not an empty page.
      // isLoaded stays false so ensureLoaded() retries instead of caching the
      // failure for the rest of the session.
      isLoaded.value = false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Loads the classes unless a load newer than `maxAgeMs` already happened.
   *
   * The default answers "does this user manage any class at all", which does
   * not go stale within a session. Surfaces that show live counts pass their
   * own refresh interval so they never display numbers older than the rate
   * they promise to refresh at, while still reusing a fetch that just ran —
   * landing on the console straight after login must not cost two requests.
   */
  const ensureLoaded = async (maxAgeMs: number = Number.POSITIVE_INFINITY): Promise<void> => {
    const isFresh = loadedAt.value !== null && Date.now() - loadedAt.value <= maxAgeMs
    if (isLoaded.value && isFresh && !inFlight) return
    if (!inFlight) {
      inFlight = loadGroups().finally(() => { inFlight = null })
    }
    await inFlight
  }

  /**
   * Declares the cached list stale without dropping it: the next
   * `ensureLoaded` refetches whatever `maxAgeMs` it is given, while whoever is
   * already on screen keeps rendering the old rows until the fresh ones land.
   *
   * Owned by the store so that every surface mutating membership invalidates
   * the console the same way, instead of each page refreshing it by hand —
   * without this, a teacher who just added three learners read the old
   * member count for a full polling interval.
   */
  const markStale = () => {
    loadedAt.value = null
  }

  const reset = () => {
    groups.value = []
    isLoaded.value = false
    loadedAt.value = null
    error.value = ''
  }

  return {
    groups,
    isLoaded,
    isLoading,
    error,
    loadedAt,
    managesAnyClass,
    groupsInCurrentOrganization,
    managesClassInCurrentOrganization,
    managesClassInAnotherOrganization,
    liveSessionCountByGroupId,
    liveSessionCountOf,
    loadGroups,
    ensureLoaded,
    markStale,
    reset,
  }
})
