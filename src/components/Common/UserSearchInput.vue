<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Labinux
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
-->

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { userService, type User } from '../../services/domain/user'

defineProps<{ placeholder?: string }>()

/** The picked user's id; '' until a pick, and again as soon as the text is edited. */
const userId = defineModel<string>({ required: true })
/** The typed text: the security page reads it to look up a raw UUID. */
const query = defineModel<string>('query', { default: '' })

const { t } = useTranslations({
  en: {
    userSearchInput: {
      searching: 'Searching...',
      noUserFound: 'No user found'
    }
  },
  fr: {
    userSearchInput: {
      searching: 'Recherche...',
      noUserFound: 'Aucun utilisateur trouvé'
    }
  }
})

const MIN_QUERY_LENGTH = 2
const results = ref<User[]>([])
const isSearching = ref(false)
const isOpen = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | undefined
let hideTimer: ReturnType<typeof setTimeout> | undefined

function onInput(event: Event) {
  // A pick never outlives the text that showed it.
  userId.value = ''
  results.value = []
  clearTimeout(searchTimer)
  // From the event: a parent-bound query only catches up after this handler.
  const q = (event.target as HTMLInputElement).value.trim()
  isSearching.value = q.length >= MIN_QUERY_LENGTH
  if (!isSearching.value) return
  searchTimer = setTimeout(async () => {
    let found: User[] = []
    try {
      found = await userService.searchUsers(q)
    } catch (err) {
      console.error('Error searching users:', err)
    }
    // A slower, earlier response must not replace the current one.
    if (q !== query.value.trim()) return
    results.value = found
    isSearching.value = false
  }, 300)
}

function pick(user: User) {
  query.value = `${user.display_name || user.name}${user.email ? ` (${user.email})` : ''}`
  userId.value = user.id
  isOpen.value = false
}

// The delay lets a click on a row land before the dropdown hides; the next
// focus cancels it, or a stale timer would hide a brand-new search.
function onFocus() {
  clearTimeout(hideTimer)
  isOpen.value = true
}

function onBlur() {
  clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    isOpen.value = false
  }, 200)
}

onUnmounted(() => {
  clearTimeout(searchTimer)
  clearTimeout(hideTimer)
})
</script>

<template>
  <div class="user-search-container">
    <input
      v-model="query"
      type="text"
      class="form-control"
      :placeholder="placeholder"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
    />
    <div v-if="isOpen && query.trim().length >= MIN_QUERY_LENGTH" class="search-dropdown">
      <div v-if="isSearching" class="search-loading">
        <i class="fas fa-spinner fa-spin"></i>
        {{ t('userSearchInput.searching') }}
      </div>
      <div v-else-if="results.length === 0" class="search-empty">
        {{ t('userSearchInput.noUserFound') }}
      </div>
      <div
        v-for="user in results"
        :key="user.id"
        class="search-result"
        @click="pick(user)"
      >
        <div class="user-info">
          <div class="user-name">{{ user.display_name || user.name }}</div>
          <div v-if="user.email" class="user-email">{{ user.email }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-search-container {
  position: relative;
}

.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-medium);
  border-top: none;
  border-radius: 0 0 var(--border-radius-md) var(--border-radius-md);
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: var(--shadow-md);
}

.search-loading,
.search-empty {
  padding: var(--spacing-md);
  text-align: center;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.search-result {
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
  border-bottom: 1px solid var(--color-border-light);
  transition: background-color var(--transition-fast);
}

.search-result:hover {
  background-color: var(--color-bg-secondary);
}

.search-result:last-child {
  border-bottom: none;
}

.search-result .user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.search-result .user-name {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.search-result .user-email {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>
