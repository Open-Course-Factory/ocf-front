<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
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
import { ref, computed } from 'vue'
import { useCurrentUserStore } from '../../stores/currentUser'
import { useTranslations } from '../../composables/useTranslations'
import { useGroupMembers, type GroupMember } from '../../composables/useGroupMembers'
import { formatDate } from '../../utils/formatters'
import { userService, type User } from '../../services/domain/user'
import { bulkImportService, type UserCredential } from '../../services/domain/bulkImport'
import type { ClassGroup } from '../../types'
import BaseModal from '../Modals/BaseModal.vue'

const props = defineProps<{
  groupId: string
  group: ClassGroup
  canEditGroup: boolean
  isOwner: boolean
  isAdmin: boolean
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
      memberEmail: 'Email',
      memberJoinedAt: 'Joined',
      noMembers: 'No members in this group',

      // Roles
      roleOwner: 'Owner',
      roleAdmin: 'Admin',
      roleAssistant: 'Assistant',
      roleMember: 'Member',

      // Actions
      addMember: 'Add Member',
      removeMember: 'Remove',
      bulkCreateTerminals: 'Bulk Create Terminals',
      createTerminalsForAll: 'Create Terminals for All Members',
      mainGroup: 'Main Group',

      // Modal
      addMemberTitle: 'Add Member to {groupName}',
      selectUser: 'User ID or Email',
      selectRole: 'Select Role',
      cancel: 'Cancel',

      // Password Regeneration
      selectAll: 'Select All',
      deselectAll: 'Deselect All',
      regeneratePasswords: 'Regenerate Passwords',
      regeneratePasswordsCount: 'Regenerate Passwords ({count})',
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
      memberEmail: 'Email',
      memberJoinedAt: 'Rejoint le',
      noMembers: 'Aucun membre dans ce groupe',

      // Roles
      roleOwner: 'Propriétaire',
      roleAdmin: 'Administrateur',
      roleAssistant: 'Assistant',
      roleMember: 'Membre',

      // Actions
      addMember: 'Ajouter un membre',
      removeMember: 'Retirer',
      bulkCreateTerminals: 'Création en Masse de Terminaux',
      createTerminalsForAll: 'Créer des Terminaux pour Tous les Membres',
      mainGroup: 'Groupe Principal',

      // Modal
      addMemberTitle: 'Ajouter un membre à {groupName}',
      selectUser: 'ID utilisateur ou Email',
      selectRole: 'Sélectionner un rôle',
      cancel: 'Annuler',

      // Password Regeneration
      selectAll: 'Tout sélectionner',
      deselectAll: 'Tout désélectionner',
      regeneratePasswords: 'Régénérer les mots de passe',
      regeneratePasswordsCount: 'Régénérer les mots de passe ({count})',
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
const isOwnerRef = computed(() => props.isOwner)

const groupMembersComposable = useGroupMembers({
  groupId: groupIdRef,
  currentUserId: currentUserIdRef,
  isOwner: isOwnerRef
})

// Load members on mount
import { onMounted } from 'vue'
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

// Selectable members (exclude owner)
const selectableMembers = computed(() => {
  return groupMembersComposable.sortedMembers.value.filter(
    m => m.user_id !== props.group?.owner_user_id
  )
})

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

async function onUserSearchInput() {
  const query = userSearchQuery.value.trim()

  if (query.length < 2) {
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

function onUserSearchBlur() {
  setTimeout(() => {
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

async function handleRegeneratePasswords() {
  if (selectedCount.value === 0 || !props.group?.organization_id) return

  const confirmed = window.confirm(
    t('groupMembers.regeneratePasswordsConfirm', { count: selectedCount.value })
  )
  if (!confirmed) return

  isRegenerating.value = true
  try {
    const response = await bulkImportService.regeneratePasswords(
      props.group.organization_id,
      props.group.id,
      Array.from(selectedMemberIds.value)
    )

    if (response.credentials.length > 0) {
      regeneratedCredentials.value = response.credentials
      showCredentialsModal.value = true
    }

    if (response.errors.length > 0) {
      error.value = t('groupMembers.regeneratePasswordsError')
    }

    selectedMemberIds.value = new Set()
  } catch (err: any) {
    error.value = err.response?.data?.error_message || t('groupMembers.regeneratePasswordsError')
  } finally {
    isRegenerating.value = false
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

async function handleRemoveMember(member: GroupMember) {
  await groupMembersComposable.removeMember(member)
  emit('member-count-changed', -1)
}
</script>

<template>
  <div class="members-tab">
    <div class="members-toolbar">
      <input
        v-model="groupMembersComposable.memberSearchQuery.value"
        type="text"
        :placeholder="t('groupMembers.searchMembers')"
        class="search-input"
      />
      <label v-if="groupMembersComposable.canManageMembers.value && selectableMembers.length > 0" class="select-all-checkbox">
        <input
          type="checkbox"
          :checked="allSelectableSelected"
          @change="toggleSelectAll"
        />
        {{ allSelectableSelected ? t('groupMembers.deselectAll') : t('groupMembers.selectAll') }}
      </label>
      <div class="toolbar-actions">
        <button
          v-if="groupMembersComposable.canManageMembers.value && selectedCount > 0"
          @click="handleRegeneratePasswords"
          class="btn btn-warning"
          :disabled="isRegenerating"
        >
          <i class="fas fa-key"></i>
          {{ t('groupMembers.regeneratePasswordsCount', { count: selectedCount }) }}
        </button>
        <router-link
          v-if="groupMembersComposable.canManageMembers.value && groupMembersComposable.members.value.length > 0"
          :to="`/terminal-creation?mode=bulk&groupId=${group.id}`"
          class="btn btn-secondary"
          :title="t('groupMembers.createTerminalsForAll')"
        >
          <i class="fas fa-terminal"></i>
          {{ t('groupMembers.bulkCreateTerminals') }}
        </router-link>
        <button
          v-if="groupMembersComposable.canManageMembers.value"
          @click="showAddMemberModal = true"
          class="btn btn-primary"
        >
          <i class="fas fa-plus"></i>
          {{ t('groupMembers.addMember') }}
        </button>
      </div>
    </div>

    <div v-if="groupMembersComposable.isLoading.value" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>{{ t('groupMembers.loadingMembers') }}</p>
    </div>

    <div v-else-if="groupMembersComposable.sortedMembers.value.length === 0" class="empty-state">
      <i class="fas fa-users"></i>
      <p>{{ t('groupMembers.noMembers') }}</p>
    </div>

    <div v-else class="members-list">
      <div
        v-for="member in groupMembersComposable.sortedMembers.value"
        :key="member.id"
        :class="['member-card', { 'member-selected': selectedMemberIds.has(member.user_id) }]"
      >
        <input
          v-if="groupMembersComposable.canManageMembers.value && member.user_id !== group?.owner_user_id"
          type="checkbox"
          class="member-checkbox"
          :checked="selectedMemberIds.has(member.user_id)"
          @change="toggleMemberSelection(member.user_id)"
        />
        <div class="member-info">
          <div class="member-avatar">
            {{ (member.user?.display_name || member.user?.email || member.user_id).charAt(0).toUpperCase() }}
          </div>
          <div class="member-details">
            <div class="member-name">{{ member.user?.display_name || member.user_id }}</div>
            <div class="member-email" v-if="member.user?.email">{{ member.user.email }}</div>
            <div class="member-meta">
              <span :class="['role-badge', `role-${member.role}`]">
                {{ t(`groupMembers.role${member.role.charAt(0).toUpperCase() + member.role.slice(1)}`) }}
              </span>
              <span v-if="member.source_group" class="source-group-badge">
                <i class="fas fa-layer-group"></i>
                {{ member.source_group.display_name }}
              </span>
              <span v-else class="source-group-badge main-group">
                <i class="fas fa-star"></i>
                {{ t('groupMembers.mainGroup') }}
              </span>
              <span v-if="member.joined_at" class="member-joined">
                {{ t('groupMembers.memberJoinedAt') }}: {{ formatDate(member.joined_at) }}
              </span>
            </div>
          </div>
        </div>
        <div v-if="groupMembersComposable.canEditMember(member)" class="member-actions">
          <select
            v-model="member.role"
            @change="groupMembersComposable.updateMemberRole(member)"
            class="role-select"
          >
            <option value="admin">{{ t('groupMembers.roleAdmin') }}</option>
            <option value="assistant">{{ t('groupMembers.roleAssistant') }}</option>
            <option value="member">{{ t('groupMembers.roleMember') }}</option>
          </select>
          <button
            v-if="groupMembersComposable.canRemoveMember(member)"
            @click="handleRemoveMember(member)"
            class="btn btn-sm btn-danger"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>

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
              placeholder="Search by name or email..."
              @input="onUserSearchInput"
              @focus="showUserSearchDropdown = true"
              @blur="onUserSearchBlur"
              required
            />
            <div v-if="showUserSearchDropdown && (userSearchResults.length > 0 || isSearchingUsers)" class="search-dropdown">
              <div v-if="isSearchingUsers" class="search-loading">
                <i class="fas fa-spinner fa-spin"></i>
                Searching...
              </div>
              <div v-else-if="userSearchResults.length === 0 && userSearchQuery.trim()" class="search-empty">
                No user found
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
            <option value="assistant">{{ t('groupMembers.roleAssistant') }}</option>
            <option value="admin">{{ t('groupMembers.roleAdmin') }}</option>
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
  </div>
</template>

<style scoped>
/* Members Tab */
.members-toolbar {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.toolbar-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.search-input {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--border-radius-md);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
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

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-2xl);
  color: var(--color-text-muted);
}

.empty-state i {
  font-size: var(--font-size-3xl);
  margin-bottom: var(--spacing-md);
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.member-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border-light);
}

.member-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.member-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--border-radius-full);
  background-color: var(--color-primary);
  color: var(--color-white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-semibold);
}

.member-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.member-name {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
}

.member-email {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.member-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.role-badge {
  padding: 2px 8px;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

.role-badge.role-owner {
  background-color: var(--color-warning-gold);
  color: var(--color-black);
}

.role-badge.role-admin {
  background-color: var(--color-primary);
  color: var(--color-white);
}

.role-badge.role-assistant {
  background-color: var(--color-success);
  color: var(--color-white);
}

.role-badge.role-member {
  background-color: var(--color-gray-400);
  color: var(--color-white);
}

.source-group-badge {
  padding: 2px 8px;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  background-color: var(--color-info-bg);
  color: var(--color-info);
  border: 1px solid var(--color-info);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.source-group-badge.main-group {
  background-color: var(--color-success-bg);
  color: var(--color-success);
  border-color: var(--color-success);
}

.source-group-badge i {
  font-size: 10px;
}

.member-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.role-select {
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--border-radius-sm);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
}

/* Password Regeneration */
.select-all-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.select-all-checkbox input[type="checkbox"] {
  cursor: pointer;
}

.member-checkbox {
  cursor: pointer;
  margin-right: 0.75rem;
  flex-shrink: 0;
}

.member-card.member-selected {
  background: var(--color-primary-light, rgba(var(--color-primary-rgb, 59, 130, 246), 0.08));
  border-color: var(--color-primary);
}

.btn-warning {
  background: var(--color-warning, #f59e0b);
  color: var(--color-text-on-warning, #fff);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius, 6px);
  cursor: pointer;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-warning:hover {
  opacity: 0.9;
}

.btn-warning:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

/* Responsive */
@media (max-width: 768px) {
  .members-toolbar {
    flex-direction: column;
  }

  .member-card {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .member-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
