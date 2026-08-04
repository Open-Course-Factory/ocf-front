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

/**
 * Debounced free-text search over a list of entities.
 *
 * SCOPE: this filters the entities it is handed — for `Entity.vue` that is the
 * page currently loaded, not the whole collection. The generic entity routes in
 * ocf-core accept only exact-match column filters (`GetEntities` turns every
 * unrecognised query param into an equality predicate), so there is no server
 * side to delegate a substring search to. Callers must say so in the UI rather
 * than let the count read as a total.
 *
 * Matching mirrors what the card shows: the fields `EntityCard` draws its title
 * and subtitle from, plus any other displayed string field the store declares,
 * so an entity with no name (keyed by e-mail, say) is still findable. Foreign
 * keys are excluded — matching a UUID fragment is never what was meant.
 */

import { ref, computed, watch, onScopeDispose, type Ref } from 'vue'

/** The fields `EntityCard` reads for its title and subtitle, in its own order. */
export const CARD_TEXT_FIELDS = ['display_name', 'title', 'name', 'description'] as const

const DEFAULT_DEBOUNCE_MS = 250

/** Lowercase and strip diacritics, so "eleve" finds "élève" in a French UI. */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

function isForeignKeyField(key: string, field: any): boolean {
  return field?.type === 'multi-select' || /(_id|Id|ID)$/.test(key)
}

/** Every string on an entity a user could reasonably be searching for. */
export function searchableValues(
  entity: Record<string, any>,
  fieldList?: Map<string, any>
): string[] {
  const values: string[] = []

  const push = (value: unknown) => {
    if (typeof value === 'string' && value !== '') values.push(value)
  }

  for (const key of CARD_TEXT_FIELDS) push(entity?.[key])

  fieldList?.forEach((field, key) => {
    if (!field?.display) return
    if ((CARD_TEXT_FIELDS as readonly string[]).includes(key)) return
    if (isForeignKeyField(key, field)) return
    push(entity?.[key])
  })

  return values
}

export function useEntitySearch<T extends Record<string, any>>(
  entities: Ref<T[]>,
  fieldList: Ref<Map<string, any> | undefined>,
  debounceMs: number = DEFAULT_DEBOUNCE_MS
) {
  const searchQuery = ref('')
  const activeQuery = ref('')
  let timer: ReturnType<typeof setTimeout> | null = null

  function cancelPending() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  watch(searchQuery, value => {
    cancelPending()
    // Clearing the box is not a search. Restore the full list at once instead of
    // leaving the user looking at stale matches for another debounce interval.
    if (normalizeSearchText(value) === '') {
      activeQuery.value = ''
      return
    }
    timer = setTimeout(() => {
      activeQuery.value = value
      timer = null
    }, debounceMs)
  })

  onScopeDispose(cancelPending)

  const isSearching = computed(() => normalizeSearchText(activeQuery.value) !== '')

  const results = computed<T[]>(() => {
    const needle = normalizeSearchText(activeQuery.value)
    // No search: hand back the very list that came in, so an empty box is
    // indistinguishable from this composable not being here at all.
    if (needle === '') return entities.value
    return entities.value.filter(entity =>
      searchableValues(entity, fieldList.value).some(value =>
        normalizeSearchText(value).includes(needle)
      )
    )
  })

  function clearSearch() {
    searchQuery.value = ''
  }

  return { searchQuery, activeQuery, isSearching, results, clearSearch }
}
