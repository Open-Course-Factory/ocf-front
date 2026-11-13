<!--
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
-->

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useCurrentUserStore } from '../../stores/currentUser'
import { useTranslations } from '../../composables/useTranslations'
import { useGroupMembers, type GroupMember } from '../../composables/useGroupMembers'
import { CLASS_PAGE_NAMES } from '../../router/classPages'
import { formatDate } from '../../utils/formatters'
import { userService, type User } from '../../services/domain/user'
import { bulkImportService, type UserCredential } from '../../services/domain/bulkImport'
import type { ClassGroup } from '../../types'
import BaseModal from '../Modals/BaseModal.vue'
import AdminBadge from '../Common/AdminBadge.vue'
import DropdownMenu from '../Common/DropdownMenu.vue'
import EmptyState from '../Common/EmptyState.vue'

const props = defineProps<{
  groupId: string
  group: ClassGroup
  canEditGroup: boolean
  /**
   * Ranks as a class owner: the creator, the organization's managers, a platform
   * admin. Only they may name an owner — nobody grants above their own rank.
   */
  canNameOwner: boolean
  isOwner: boolean
  isPlatformAdmin: boolean
  subgroups: ClassGroup[]
}>()

const emit = defineEmits<{
  (e: 'member-count-changed', delta: number): void
}>()

const currentUser = useCurrentUserStore()

const { t } = useTranslations({
  en: {
    groupMembers: {
      // Members Section
      searchMembers: 'Search members...',
      userEmailPlaceholder: 'Their full email address',
      memberEmail: 'Email',
      noMembers: 'No members in this group',
      noMembersHint: 'The people you add to the class appear here.',
      noMatch: 'No member matches this search',
      noMatchHint: 'Search by name, email or login.',
      memberName: 'Name',
      memberRole: 'Role',
      trainers: 'Trainers',
      participants: 'Participants',
      memberCountOne: '1 member',
      memberCountMany: '{count} members',
      memberCountFiltered: '{shown} of {total} members',
      sortAscHint: 'Sorted by name, A to Z. Click to sort Z to A.',
      sortDescHint: 'Sorted by name, Z to A. Click to sort A to Z.',
      joinedOn: 'Joined on {date}',
      selectMember: 'Select {name}',
      selectionHint: 'Tick participants to regenerate their passwords.',
      selectedCount: '{count} selected',
      clearSelection: 'Clear selection',
      memberActions: 'Actions for {name}',
      regeneratePassword: 'Regenerate password',
      removeMemberLabel: 'Remove from the class',
      removeMemberTitle: 'Remove a member',
      removeMemberConfirm: '{name} will no longer be a member of {groupName}.',

      // Roles
      roleOwner: 'Owner',
      roleManager: 'Manager',
      roleMember: 'Member',

      // Actions
      addMember: 'Add Member',
      addMemberArchived: 'This class is archived: it takes no new member. Restore it from its settings first.',
      removeMember: 'Remove',
      startScenarioForClass: 'Start a scenario for the class',
      startScenarioForClassHint: 'Open the Scenarios tab, where an assigned scenario can be started for every member at once',

      // Modal
      addMemberTitle: 'Add Member to {groupName}',
      selectUser: 'User ID or Email',
      searching: 'Searching...',
      noUserFound: 'No user found',
      selectRole: 'Select Role',
      cancel: 'Cancel',

      // Password Regeneration
      selectAll: 'Select all participants',
      regeneratePasswords: 'Regenerate Passwords',
      regeneratePasswordsConfirm: 'Are you sure you want to regenerate passwords for {count} member(s)? This will invalidate their current passwords.',
      regeneratePasswordsError: 'Failed to regenerate passwords',
      credentialsTitle: 'New Credentials',
      password: 'Password',
      credentialsWarning: 'These credentials will only be shown once. Please download or copy them now.',
      downloadCsv: 'Download CSV',
      close: 'Close',

      // Errors
      groupFull: 'Group is at maximum capacity',

      // Loading
      loadingMembers: 'Loading members...'
    }
  },
  fr: {
    groupMembers: {
      // Members Section
      searchMembers: 'Rechercher des membres...',
      userEmailPlaceholder: 'Son adresse email complète',
      memberEmail: 'Email',
      noMembers: 'Aucun membre dans ce groupe',
      noMembersHint: 'Les personnes ajoutées à la classe apparaissent ici.',
      noMatch: 'Aucun membre ne correspond à cette recherche',
      noMatchHint: 'Cherchez par nom, email ou identifiant.',
      memberName: 'Nom',
      memberRole: 'Rôle',
      trainers: 'Formateurs',
      participants: 'Participants',
      memberCountOne: '1 membre',
      memberCountMany: '{count} membres',
      memberCountFiltered: '{shown} sur {total} membres',
      sortAscHint: 'Trié par nom, de A à Z. Cliquez pour trier de Z à A.',
      sortDescHint: 'Trié par nom, de Z à A. Cliquez pour trier de A à Z.',
      joinedOn: 'Rejoint le {date}',
      selectMember: 'Sélectionner {name}',
      selectionHint: 'Cochez des participants pour régénérer leurs mots de passe.',
      selectedCount: '{count} sélectionné(s)',
      clearSelection: 'Désélectionner',
      memberActions: 'Actions pour {name}',
      regeneratePassword: 'Régénérer le mot de passe',
      removeMemberLabel: 'Retirer de la classe',
      removeMemberTitle: 'Retirer un membre',
      removeMemberConfirm: '{name} ne fera plus partie de {groupName}.',

      // Roles
      roleOwner: 'Propriétaire',
      roleManager: 'Gestionnaire',
      roleMember: 'Membre',

      // Actions
      addMember: 'Ajouter un membre',
      addMemberArchived: 'Cette classe est archivée : elle n’accepte plus de membre. Restaurez-la depuis ses réglages.',
      removeMember: 'Retirer',
      startScenarioForClass: 'Lancer un scénario pour la classe',
      startScenarioForClassHint: 'Ouvre l\'onglet Scénarios, d\'où un scénario assigné peut être lancé pour tous les membres en une fois',

      // Modal
      addMemberTitle: 'Ajouter un membre à {groupName}',
      selectUser: 'ID utilisateur ou Email',
      searching: 'Recherche...',
      noUserFound: 'Aucun utilisateur trouvé',
      selectRole: 'Sélectionner un rôle',
      cancel: 'Annuler',

      // Password Regeneration
      selectAll: 'Sélectionner tous les participants',
      regeneratePasswords: 'Régénérer les mots de passe',
      regeneratePasswordsConfirm: 'Êtes-vous sûr de vouloir régénérer les mots de passe de {count} membre(s) ? Cela invalidera leurs mots de passe actuels.',
      regeneratePasswordsError: 'Échec de la régénération des mots de passe',
      credentialsTitle: 'Nouveaux identifiants',
      password: 'Mot de passe',
      credentialsWarning: 'Ces identifiants ne seront affichés qu\'une seule fois. Veuillez les télécharger ou les copier maintenant.',
      downloadCsv: 'Télécharger CSV',
      close: 'Fermer',

      // Errors
      groupFull: 'Le groupe a atteint sa capacité maximale',

      // Loading
      loadingMembers: 'Chargement des membres...'
    }
  }
})

// Group Members composable
const groupIdRef = computed(() => props.groupId)
const currentUserIdRef = computed(() => currentUser.userId)
const groupMembersComposable = useGroupMembers({
  groupId: groupIdRef,
  currentUserId: currentUserIdRef,
  canManageMembers: computed(() => props.canEditGroup)
})

// Load members on mount
onMounted(async () => {
  await groupMembersComposable.loadMembers(true, props.subgroups)
})

// State
const showAddMemberModal = ref(false)
const selectedMemberIds = ref(new Set<string>())
const regeneratedCredentials = ref<UserCredential[]>([])
const showCredentialsModal = ref(false)
const isRegenerating = ref(false)
const error = ref('')

// User search for Add Member modal
const userSearchQuery = ref('')
const userSearchResults = ref<User[]>([])
const isSearchingUsers = ref(false)
const showUserSearchDropdown = ref(false)

// Trainers (owners, managers) are pinned above the participants. Only
// participants can be selected: a bulk password reset must never reach a
// trainer's account.
const trainers = computed(() =>
  groupMembersComposable.sortedMembers.value.filter(m => m.role !== 'member')
)
const participants = computed(() =>
  groupMembersComposable.sortedMembers.value.filter(m => m.role === 'member')
)
const selectableMembers = participants

// A selection only holds rows the trainer can see: when the search hides a
// row, it leaves the selection, so the bulk bar's count is the true count.
// Sorting does not touch it.
// Watches the ids, not the array: a removal splices the roster in place.
watch(() => groupMembersComposable.filteredMembers.value.map(m => m.user_id), (ids) => {
  const visibleIds = new Set(ids)
  const kept = [...selectedMemberIds.value].filter(id => visibleIds.has(id))
  if (kept.length !== selectedMemberIds.value.size) {
    selectedMemberIds.value = new Set(kept)
  }
})

const memberCountLabel = computed(() => {
  const total = groupMembersComposable.members.value.length
  const shown = groupMembersComposable.filteredMembers.value.length
  if (shown !== total) return t('groupMembers.memberCountFiltered', { shown, total })
  return total === 1 ? t('groupMembers.memberCountOne') : t('groupMembers.memberCountMany', { count: total })
})

const sortAscending = computed(() => groupMembersComposable.nameSortDirection.value === 'asc')

function toggleNameSort() {
  groupMembersComposable.nameSortDirection.value = sortAscending.value ? 'desc' : 'asc'
}

function memberName(member: GroupMember) {
  return member.user?.display_name || member.user?.email || member.user_id
}

function roleLabel(role: GroupMember['role']) {
  return t(`groupMembers.role${role.charAt(0).toUpperCase() + role.slice(1)}`)
}

const columnCount = computed(() => (groupMembersComposable.canManageMembers.value ? 5 : 3))

const memberGroups = computed(() => [
  { key: 'trainers', label: t('groupMembers.trainers'), members: trainers.value },
  { key: 'participants', label: t('groupMembers.participants'), members: participants.value }
].filter(g => g.members.length > 0))

const allSelectableSelected = computed(() => {
  if (selectableMembers.value.length === 0) return false
  return selectableMembers.value.every(m => selectedMemberIds.value.has(m.user_id))
})

const selectedCount = computed(() => selectedMemberIds.value.size)

// Expose members for parent to read member count
defineExpose({
  members: groupMembersComposable.members
})

// Methods
const handleAddMember = async () => {
  if (props.group?.is_full) {
    error.value = t('groupMembers.groupFull')
    return
  }

  const result = await groupMembersComposable.addMember()
  if (result) {
    emit('member-count-changed', 1)
    showAddMemberModal.value = false
    userSearchQuery.value = ''
    userSearchResults.value = []
  }
}

// Searches start at two characters; below that there is nothing to report.
const USER_SEARCH_MIN_LENGTH = 2
const isUserSearchActive = computed(() => userSearchQuery.value.trim().length >= USER_SEARCH_MIN_LENGTH)

async function onUserSearchInput() {
  const query = userSearchQuery.value.trim()

  if (query.length < USER_SEARCH_MIN_LENGTH) {
    userSearchResults.value = []
    return
  }

  isSearchingUsers.value = true

  try {
    userSearchResults.value = await userService.searchUsers(query)
  } catch (err: any) {
    console.error('Error searching users:', err)
    userSearchResults.value = []
  } finally {
    isSearchingUsers.value = false
  }
}

function selectUser(user: User) {
  groupMembersComposable.newMemberData.value.user_id = user.id
  userSearchQuery.value = `${user.name}${user.email ? ` (${user.email})` : ''}`
  showUserSearchDropdown.value = false
}

// The delay lets a click on a dropdown row land before the dropdown hides.
// The timer MUST be cancelled on the next focus: it used to survive the modal
// closing, and reopening within 200ms let the stale timer hide the dropdown
// of a brand-new search.
let hideDropdownTimer: ReturnType<typeof setTimeout> | undefined

function onUserSearchFocus() {
  clearTimeout(hideDropdownTimer)
  showUserSearchDropdown.value = true
}

function onUserSearchBlur() {
  clearTimeout(hideDropdownTimer)
  hideDropdownTimer = setTimeout(() => {
    showUserSearchDropdown.value = false
  }, 200)
}

function toggleMemberSelection(userId: string) {
  const newSet = new Set(selectedMemberIds.value)
  if (newSet.has(userId)) {
    newSet.delete(userId)
  } else {
    newSet.add(userId)
  }
  selectedMemberIds.value = newSet
}

function toggleSelectAll() {
  if (allSelectableSelected.value) {
    selectedMemberIds.value = new Set()
  } else {
    selectedMemberIds.value = new Set(selectableMembers.value.map(m => m.user_id))
  }
}

// One participant (row menu) or the current selection (bulk bar). A bulk run
// clears the selection; a single one leaves it alone.
async function regeneratePasswords(userIds: string[]) {
  if (userIds.length === 0 || !props.group?.organization_id) return false

  const confirmed = window.confirm(
    t('groupMembers.regeneratePasswordsConfirm', { count: userIds.length })
  )
  if (!confirmed) return false

  isRegenerating.value = true
  try {
    const response = await bulkImportService.regeneratePasswords(
      props.group.organization_id,
      props.group.id,
      userIds
    )

    if (response.credentials.length > 0) {
      regeneratedCredentials.value = response.credentials
      showCredentialsModal.value = true
    }

    if (response.errors.length > 0) {
      error.value = t('groupMembers.regeneratePasswordsError')
    }
    return true
  } catch (err: any) {
    error.value = err.response?.data?.error_message || t('groupMembers.regeneratePasswordsError')
    return false
  } finally {
    isRegenerating.value = false
  }
}

async function handleRegeneratePasswords() {
  if (await regeneratePasswords(Array.from(selectedMemberIds.value))) {
    selectedMemberIds.value = new Set()
  }
}

function downloadCredentialsCsv() {
  const header = 'name,email,password\n'
  const escape = (s: string) => s.replace(/"/g, '""')
  const rows = regeneratedCredentials.value
    .map(c => `"${escape(c.name)}","${escape(c.email)}","${escape(c.password)}"`)
    .join('\n')
  const blob = new Blob([header + rows], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `credentials-${props.group?.display_name || 'group'}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// Removing a member is one click away from every row: it asks first.
const memberPendingRemoval = ref<GroupMember | null>(null)

async function confirmRemoveMember() {
  const member = memberPendingRemoval.value
  if (!member) return
  memberPendingRemoval.value = null
  const removed = await groupMembersComposable.removeMember(member)
  if (removed) emit('member-count-changed', -1)
}
</script>

<template>
  <div class="members-tab">
    <div class="members-toolbar">
      <div class="ocf-members-search">
        <i class="fas fa-search ocf-members-search__icon" aria-hidden="true"></i>
        <input
          v-model="groupMembersComposable.memberSearchQuery.value"
          type="text"
          :placeholder="t('groupMembers.searchMembers')"
          :aria-label="t('groupMembers.searchMembers')"
          class="search-input"
        />
      </div>
      <span v-if="groupMembersComposable.members.value.length > 0" class="ocf-members-count" aria-live="polite">{{ memberCountLabel }}</span>
      <div class="toolbar-actions">
        <!--
          Giving every member an environment happens on the Scenarios tab: a
          scenario is assigned to the group, then bulk-started for all members.
          This CTA only carries the teacher there — it does not start anything
          on its own.
        -->
        <router-link
          v-if="groupMembersComposable.canManageMembers.value && groupMembersComposable.members.value.length > 0"
          :to="{ name: CLASS_PAGE_NAMES.scenarios, params: { id: group.id } }"
          class="btn btn-secondary"
          data-test="bulk-scenario-link"
          :title="t('groupMembers.startScenarioForClassHint')"
        >
          <i class="fas fa-clipboard-list"></i>
          {{ t('groupMembers.startScenarioForClass') }}
        </router-link>
        <!-- An archived class takes no new member (ocf-core#491): the button
             stays where it is, disabled, and the wrapper carries the tooltip
             a disabled control cannot. -->
        <span
          v-if="groupMembersComposable.canManageMembers.value"
          class="add-member-slot"
          :title="group.archived_at ? t('groupMembers.addMemberArchived') : undefined"
          data-test="add-member-slot"
        >
          <button
            @click="showAddMemberModal = true"
            class="btn btn-primary"
            :disabled="!!group.archived_at"
            data-test="add-member"
          >
            <i class="fas fa-plus"></i>
            {{ t('groupMembers.addMember') }}
          </button>
        </span>
        <AdminBadge v-if="isPlatformAdmin && !isOwner" icon-only />
      </div>
    </div>

    <!-- The bulk bar is always laid out, hidden while nothing is selected and
         overlaid by a hint: the slot keeps the bar's height in both states, so
         selecting never moves the list, whatever the screen. -->
    <div
      v-if="groupMembersComposable.canManageMembers.value && selectableMembers.length > 0"
      :class="['ocf-members-bulk', { 'ocf-members-bulk--active': selectedCount > 0 }]"
      data-testid="members-bulk-bar"
    >
      <span v-if="selectedCount === 0" class="ocf-members-bulk__hint">{{ t('groupMembers.selectionHint') }}</span>
      <div class="ocf-members-bulk__actions" :aria-hidden="selectedCount === 0 ? 'true' : undefined">
        <span class="ocf-members-bulk__count">
          <i class="fas fa-check-square" aria-hidden="true"></i>
          {{ t('groupMembers.selectedCount', { count: selectedCount }) }}
        </span>
        <button
          type="button"
          class="btn btn-sm btn-primary"
          :disabled="isRegenerating || selectedCount === 0"
          data-testid="regenerate-passwords"
          @click="handleRegeneratePasswords"
        >
          <i class="fas fa-key" aria-hidden="true"></i>
          {{ t('groupMembers.regeneratePasswords') }}
        </button>
        <button
          type="button"
          class="btn btn-sm btn-outline-primary ocf-members-bulk__clear"
          :disabled="selectedCount === 0"
          @click="selectedMemberIds = new Set()"
        >
          {{ t('groupMembers.clearSelection') }}
        </button>
      </div>
    </div>

    <div v-if="groupMembersComposable.isLoading.value && groupMembersComposable.members.value.length === 0" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>{{ t('groupMembers.loadingMembers') }}</p>
    </div>

    <EmptyState
      v-else-if="groupMembersComposable.members.value.length === 0"
      icon-class="fas fa-users"
      :title="t('groupMembers.noMembers')"
      :description="t('groupMembers.noMembersHint')"
    />

    <EmptyState
      v-else-if="groupMembersComposable.sortedMembers.value.length === 0"
      icon-class="fas fa-search"
      :title="t('groupMembers.noMatch')"
      :description="t('groupMembers.noMatchHint')"
    />

    <table v-else class="ocf-data-table ocf-members-table">
      <thead>
        <tr>
          <th v-if="groupMembersComposable.canManageMembers.value" class="ocf-members-col-check">
            <label v-if="selectableMembers.length > 0" class="select-all-checkbox" :title="t('groupMembers.selectAll')">
              <input
                type="checkbox"
                :checked="allSelectableSelected"
                :aria-label="t('groupMembers.selectAll')"
                @change="toggleSelectAll"
              />
            </label>
          </th>
          <th :aria-sort="sortAscending ? 'ascending' : 'descending'">
            <button
              type="button"
              class="ocf-data-table__sort"
              data-testid="members-sort"
              :aria-label="sortAscending ? t('groupMembers.sortAscHint') : t('groupMembers.sortDescHint')"
              :title="sortAscending ? t('groupMembers.sortAscHint') : t('groupMembers.sortDescHint')"
              @click="toggleNameSort"
            >
              {{ t('groupMembers.memberName') }}
              <i :class="['fas', sortAscending ? 'fa-sort-up' : 'fa-sort-down']" aria-hidden="true"></i>
            </button>
          </th>
          <th class="ocf-members-col-email">{{ t('groupMembers.memberEmail') }}</th>
          <th class="ocf-members-col-role">{{ t('groupMembers.memberRole') }}</th>
          <th v-if="groupMembersComposable.canManageMembers.value" class="ocf-members-col-actions"></th>
        </tr>
      </thead>
      <tbody
        v-for="memberGroup in memberGroups"
        :key="memberGroup.key"
        :data-testid="`members-group-${memberGroup.key}`"
      >
        <tr class="ocf-members-group">
          <th :colspan="columnCount" scope="rowgroup">
            {{ memberGroup.label }}
            <span class="ocf-members-group__count">{{ memberGroup.members.length }}</span>
          </th>
        </tr>
        <tr
          v-for="member in memberGroup.members"
          :key="member.id"
          :class="['ocf-member-row', { 'ocf-member-row--selected': selectedMemberIds.has(member.user_id) }]"
          data-testid="member-row"
        >
          <td v-if="groupMembersComposable.canManageMembers.value" class="ocf-members-col-check">
            <input
              v-if="member.role === 'member'"
              type="checkbox"
              class="member-checkbox"
              :checked="selectedMemberIds.has(member.user_id)"
              :aria-label="t('groupMembers.selectMember', { name: memberName(member) })"
              @change="toggleMemberSelection(member.user_id)"
            />
          </td>
          <td :title="member.joined_at ? t('groupMembers.joinedOn', { date: formatDate(member.joined_at) }) : undefined">
            <span class="ocf-member-row__name">{{ memberName(member) }}</span>
            <span v-if="member.source_group" class="badge badge-secondary ocf-member-row__source">
              <i class="fas fa-layer-group" aria-hidden="true"></i>
              {{ member.source_group.display_name }}
            </span>
            <!-- Phones have no email column: the email folds under the name. -->
            <span v-if="member.user?.display_name" class="ocf-member-row__email-inline">{{ member.user?.email }}</span>
          </td>
          <td class="ocf-members-col-email ocf-member-row__email">
            {{ member.user?.display_name ? member.user?.email : '' }}
          </td>
          <td class="ocf-members-col-role">
            <select
              v-if="groupMembersComposable.canEditMember(member)"
              v-model="member.role"
              class="form-control form-select role-select"
              :aria-label="t('groupMembers.memberRole')"
              @change="groupMembersComposable.updateMemberRole(member)"
            >
              <option v-if="isPlatformAdmin && !isOwner" value="owner">🛡️ {{ t('groupMembers.roleOwner') }}</option>
              <option v-else-if="canNameOwner" value="owner">{{ t('groupMembers.roleOwner') }}</option>
              <option value="manager">{{ t('groupMembers.roleManager') }}</option>
              <option value="member">{{ t('groupMembers.roleMember') }}</option>
            </select>
            <span v-else-if="member.role !== 'member'" :class="['ocf-member-row__role', `ocf-member-row__role--${member.role}`]">
              {{ roleLabel(member.role) }}
            </span>
          </td>
          <td v-if="groupMembersComposable.canManageMembers.value" class="ocf-members-col-actions">
            <span
              v-if="member.role === 'member' || groupMembersComposable.canRemoveMember(member)"
              class="member-actions"
            >
              <DropdownMenu :trigger-label="t('groupMembers.memberActions', { name: memberName(member) })">
                <button
                  v-if="member.role === 'member'"
                  type="button"
                  class="ocf-dropdown-item"
                  data-testid="member-regenerate-password"
                  :disabled="isRegenerating"
                  @click="regeneratePasswords([member.user_id])"
                >
                  <i class="fas fa-key"></i>
                  <span>{{ t('groupMembers.regeneratePassword') }}</span>
                </button>
                <button
                  v-if="groupMembersComposable.canRemoveMember(member)"
                  type="button"
                  class="ocf-dropdown-item ocf-dropdown-item--danger"
                  data-testid="member-remove"
                  @click="memberPendingRemoval = member"
                >
                  <i class="fas fa-user-minus"></i>
                  <span>{{ t('groupMembers.removeMemberLabel') }}</span>
                </button>
              </DropdownMenu>
            </span>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Add Member Modal -->
    <BaseModal
      :visible="showAddMemberModal"
      :title="t('groupMembers.addMemberTitle', { groupName: group?.display_name })"
      size="medium"
      :is-loading="groupMembersComposable.isLoading.value"
      :show-default-footer="true"
      :confirm-text="t('groupMembers.addMember')"
      :cancel-text="t('groupMembers.cancel')"
      @confirm="handleAddMember"
      @close="showAddMemberModal = false; userSearchQuery = ''; userSearchResults = []"
    >
      <form @submit.prevent="handleAddMember">
        <div class="form-group">
          <label>{{ t('groupMembers.selectUser') }}</label>
          <div class="user-search-container">
            <input
              v-model="userSearchQuery"
              type="text"
              class="form-control"
              :placeholder="t('groupMembers.userEmailPlaceholder')"
              @input="onUserSearchInput"
              @focus="onUserSearchFocus"
              @blur="onUserSearchBlur"
              required
            />
            <div v-if="showUserSearchDropdown && isUserSearchActive" class="search-dropdown">
              <div v-if="isSearchingUsers" class="search-loading">
                <i class="fas fa-spinner fa-spin"></i>
                {{ t('groupMembers.searching') }}
              </div>
              <div v-else-if="userSearchResults.length === 0" class="search-empty">
                {{ t('groupMembers.noUserFound') }}
              </div>
              <div
                v-for="user in userSearchResults"
                :key="user.id"
                class="search-result"
                @click="selectUser(user)"
              >
                <div class="user-info">
                  <div class="user-name">{{ user.name }}</div>
                  <div class="user-email" v-if="user.email">{{ user.email }}</div>
                </div>
              </div>
            </div>
          </div>
          <small class="form-text text-muted">
            Search and select the user to add to this group
          </small>
        </div>
        <div class="form-group">
          <label>{{ t('groupMembers.selectRole') }}</label>
          <select v-model="groupMembersComposable.newMemberData.value.role" class="form-control">
            <option value="member">{{ t('groupMembers.roleMember') }}</option>
            <option value="manager">{{ t('groupMembers.roleManager') }}</option>
            <option v-if="isPlatformAdmin && !isOwner" value="owner">🛡️ {{ t('groupMembers.roleOwner') }}</option>
            <option v-else-if="canNameOwner" value="owner">{{ t('groupMembers.roleOwner') }}</option>
          </select>
        </div>
        <div v-if="groupMembersComposable.error.value" class="alert alert-danger">
          {{ groupMembersComposable.error.value }}
        </div>
      </form>
    </BaseModal>

    <!-- Credentials Modal -->
    <BaseModal
      :visible="showCredentialsModal"
      :title="t('groupMembers.credentialsTitle')"
      @close="showCredentialsModal = false"
      size="large"
    >
      <div class="credentials-content">
        <div class="credentials-warning">
          <i class="fas fa-exclamation-triangle"></i>
          {{ t('groupMembers.credentialsWarning') }}
        </div>
        <table class="credentials-table">
          <thead>
            <tr>
              <th>{{ t('groupMembers.memberEmail') }}</th>
              <th>{{ t('groupMembers.password') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cred in regeneratedCredentials" :key="cred.email">
              <td>{{ cred.email }}</td>
              <td class="password-cell">{{ cred.password }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <template #footer>
        <button @click="downloadCredentialsCsv" class="btn btn-primary">
          <i class="fas fa-download"></i>
          {{ t('groupMembers.downloadCsv') }}
        </button>
        <button @click="showCredentialsModal = false" class="btn btn-secondary">
          {{ t('groupMembers.close') }}
        </button>
      </template>
    </BaseModal>

    <!-- Remove Member Confirmation -->
    <BaseModal
      :visible="!!memberPendingRemoval"
      :title="t('groupMembers.removeMemberTitle')"
      size="small"
      @close="memberPendingRemoval = null"
    >
      <p v-if="memberPendingRemoval" class="ocf-remove-confirm">
        {{ t('groupMembers.removeMemberConfirm', { name: memberName(memberPendingRemoval), groupName: group?.display_name }) }}
      </p>
      <template #footer>
        <button type="button" class="btn btn-danger" data-testid="member-remove-confirm" @click="confirmRemoveMember">
          {{ t('groupMembers.removeMember') }}
        </button>
        <button type="button" class="btn btn-secondary" @click="memberPendingRemoval = null">
          {{ t('groupMembers.cancel') }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
/* Members Tab — toolbar and search follow EntityTable / the class tabs. */
.members-toolbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  flex-wrap: wrap;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-left: auto;
}

.ocf-members-search {
  position: relative;
  flex: 1;
  min-width: 200px;
  max-width: 400px;
}

.ocf-members-search__icon {
  position: absolute;
  left: var(--spacing-md);
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md) var(--spacing-sm) calc(var(--spacing-md) + 1.5em);
  border: var(--border-width-thin) solid var(--color-border-medium);
  border-radius: var(--border-radius-md);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  transition: border-color var(--transition-fast);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.ocf-members-count {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-2xl);
  gap: var(--spacing-md);
  color: var(--color-text-secondary);
}

.loading-state i {
  font-size: var(--font-size-2xl);
  color: var(--color-primary);
}

/* Bulk bar: AssignmentResultsView's bulk-actions bar, in a slot that is
   always there so selecting never moves the list. */
.ocf-members-bulk {
  position: relative;
  margin-bottom: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-md);
  border: var(--border-width-thin) dashed var(--color-border-light);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
}

.ocf-members-bulk--active {
  background: var(--color-primary-bg);
  border: var(--border-width-thin) solid var(--color-primary-border);
  color: var(--color-primary);
}

.ocf-members-bulk__actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.ocf-members-bulk:not(.ocf-members-bulk--active) .ocf-members-bulk__actions {
  visibility: hidden;
}

.ocf-members-bulk__hint {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  padding: 0 var(--spacing-md);
  color: var(--color-text-muted);
}

.ocf-members-bulk__count {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-weight: var(--font-weight-semibold);
}

.ocf-members-bulk__clear {
  margin-left: auto;
}

/* Member table: .ocf-data-table (tables-common.css) carries the look; these
   rules only size the columns and mark the trainer / participant groups. */
.ocf-members-table {
  table-layout: fixed;
}

.ocf-members-col-check {
  width: 2.75rem;
}

.ocf-members-col-role {
  width: 10rem;
}

.ocf-members-col-actions {
  width: 3.5rem;
  text-align: right;
}

/* The ⋯ trigger (.btn-icon) sets the row height; a tighter cell padding
   keeps rows near 40px. */
.ocf-members-table td {
  padding-top: var(--spacing-xs);
  padding-bottom: var(--spacing-xs);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ocf-members-table td.ocf-members-col-actions {
  overflow: visible;
}

.ocf-members-table .ocf-members-group th {
  padding-top: var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  background: none;
}

.ocf-members-table tbody .ocf-members-group:hover {
  background: none;
}

.ocf-members-group__count {
  margin-left: var(--spacing-xs);
  font-weight: var(--font-weight-normal);
  color: var(--color-text-muted);
}

.ocf-members-table .ocf-member-row--selected,
.ocf-members-table .ocf-member-row--selected:hover {
  background-color: var(--color-primary-bg);
}

.ocf-member-row--selected td:first-child {
  box-shadow: inset 3px 0 0 var(--color-primary);
}

.ocf-members-col-check input,
.select-all-checkbox {
  display: flex;
  margin: 0;
  cursor: pointer;
}

.ocf-member-row__name {
  font-weight: var(--font-weight-medium);
}

.ocf-member-row__source {
  margin-left: var(--spacing-sm);
  gap: var(--spacing-xs);
}

.ocf-member-row__email {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.ocf-member-row__email-inline {
  display: none;
}

/* A role read lines up with a role edited: same left inset as the select. */
.ocf-member-row__role {
  padding-left: calc(var(--spacing-sm) + var(--border-width-thin));
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.ocf-member-row__role--owner {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

/* The design-system select, compact for a table row. It saves on change. */
.form-control.role-select {
  padding: var(--spacing-2xs) 2rem var(--spacing-2xs) var(--spacing-sm);
  background-position: right var(--spacing-sm) center;
  font-size: var(--font-size-sm);
}

.ocf-remove-confirm {
  margin: 0;
  color: var(--color-text-primary);
}

/* Credentials */
.credentials-warning {
  background: var(--color-warning-light, rgba(245, 158, 11, 0.1));
  border: 1px solid var(--color-warning, #f59e0b);
  border-radius: var(--border-radius, 6px);
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-warning-text, var(--color-text-primary));
}

.credentials-warning i {
  color: var(--color-warning, #f59e0b);
  font-size: 1.25rem;
}

.credentials-table {
  width: 100%;
  border-collapse: collapse;
}

.credentials-table th,
.credentials-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.credentials-table th {
  font-weight: 600;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.password-cell {
  font-family: monospace;
  background: var(--color-background-secondary);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.credentials-content {
  max-height: 400px;
  overflow-y: auto;
}

/* Form Styles */
.form-group {
  margin-bottom: var(--spacing-md);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.form-control {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--border-radius-md);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
}

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

.form-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-top: var(--spacing-xs);
}

.text-muted {
  color: var(--color-text-muted);
  font-style: italic;
}

.alert {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  margin-top: var(--spacing-md);
}

.alert-danger {
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
  border: 1px solid var(--color-danger-border);
}

/* Phones: the email column folds under the name; the bulk slot reserves
   two lines (count and clear, then the action) in every state. */
@media (max-width: 768px) {
  .ocf-members-search {
    flex-basis: 100%;
    max-width: none;
  }

  .toolbar-actions {
    flex-wrap: wrap;
    margin-left: 0;
  }

  .ocf-members-bulk__actions {
    flex-wrap: wrap;
    row-gap: var(--spacing-xs);
  }

  .ocf-members-bulk .btn-primary {
    order: 3;
    white-space: nowrap;
  }

  .ocf-members-table {
    table-layout: auto;
  }

  .ocf-members-table .ocf-members-col-email {
    display: none;
  }

  .ocf-members-table .ocf-members-col-role {
    width: 7.5rem;
  }

  .ocf-members-table th,
  .ocf-members-table td {
    padding-left: var(--spacing-sm);
    padding-right: var(--spacing-sm);
  }

  .ocf-member-row__email-inline {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
  }
}
</style>
