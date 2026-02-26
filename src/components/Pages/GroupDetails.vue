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
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useClassGroupsStore } from '../../stores/classGroups'
import { useCurrentUserStore } from '../../stores/currentUser'
import { useTranslations } from '../../composables/useTranslations'
import { useFeatureFlags } from '../../composables/useFeatureFlags'
import { useGroupMembers } from '../../composables/useGroupMembers'
import { withAsync } from '../../utils/asyncWrapper'
import { formatDate, formatDateTime } from '../../utils/formatters'
import { userService, type User } from '../../services/domain/user'
import type { ClassGroup } from '../../types'
import type { Organization } from '../../types/organization'
import axios from 'axios'
import { bulkImportService, type UserCredential } from '../../services/domain/bulkImport'
import BaseModal from '../Modals/BaseModal.vue'
import EntityModal from '../Modals/EntityModal.vue'
import GroupCommandHistory from '../Groups/GroupCommandHistory.vue'

const route = useRoute()
const router = useRouter()
const groupStore = useClassGroupsStore()

const currentUser = useCurrentUserStore()
const { isEnabled } = useFeatureFlags()

// Translations
const { t } = useTranslations({
  en: {
    groupDetails: {
      // Page & Navigation
      pageTitle: 'Group Details',
      backToGroups: 'Back to Groups',
      groupNotFound: 'Group not found',
      loading: 'Loading group details...',

      // Tabs
      tabOverview: 'Overview',
      tabMembers: 'Members',
      tabHistory: 'Command History',
      tabSettings: 'Settings',

      // Overview Fields
      displayName: 'Display Name',
      description: 'Description',
      owner: 'Owner',
      organization: 'Organization',
      noOrganization: 'No organization',
      parentGroup: 'Parent Group',
      subGroups: 'Subgroups',
      createdAt: 'Created',
      updatedAt: 'Updated',
      expiresAt: 'Expires',
      maxMembers: 'Maximum Members',
      currentMembers: 'Current Members',
      noParentGroup: 'None (top-level group)',
      noSubGroups: 'No subgroups',
      viewGroup: 'View',
      mainGroup: 'Main Group',

      // Status
      statusActive: 'Active',
      statusInactive: 'Inactive',
      statusExpired: 'EXPIRED',
      statusFull: 'FULL',

      // Member Count
      memberCount: 'Members',
      memberCountLabel: '{current} / {max} members',
      memberCapacity: '{percentage}% capacity',

      // Members Section
      memberEmail: 'Email',
      memberRole: 'Role',
      memberJoinedAt: 'Joined',
      memberStatus: 'Status',
      memberActions: 'Actions',
      searchMembers: 'Search members...',

      // Roles
      roleOwner: 'Owner',
      roleAdmin: 'Admin',
      roleAssistant: 'Assistant',
      roleMember: 'Member',

      // Buttons & Actions
      editGroup: 'Edit Group',
      deleteGroup: 'Delete Group',
      addMember: 'Add Member',
      removeMember: 'Remove',
      changeRole: 'Change Role',
      saveChanges: 'Save Changes',
      cancel: 'Cancel',
      createTerminalsForAll: 'Create Terminals for All Members',
      bulkCreateTerminals: 'Bulk Create Terminals',
      createSubgroup: 'Create Subgroup',
      addSubgroup: 'Add Subgroup',

      // Modals
      addMemberTitle: 'Add Member to {groupName}',
      selectUser: 'User ID or Email',
      selectRole: 'Select Role',
      deleteConfirmTitle: 'Delete Group?',
      deleteConfirmMessage: 'This action cannot be undone. All members will be removed and the group will be permanently deleted.',
      bulkTerminalTitle: 'Create Terminals for All Members',
      bulkTerminalMessage: 'This will create {count} terminal sessions (one for each member). Continue?',
      instanceTypeLabel: 'Instance Type',
      expirySecondsLabel: 'Expiry (seconds, optional)',
      termsLabel: 'Terms of Service',

      // Messages
      memberAddedSuccess: 'Member added successfully',
      memberRemovedSuccess: 'Member removed successfully',
      memberRoleUpdatedSuccess: 'Member role updated successfully',
      groupUpdatedSuccess: 'Group updated successfully',
      groupDeletedSuccess: 'Group deleted successfully',
      bulkTerminalsCreatedSuccess: '{count} terminal sessions created successfully',
      bulkTerminalsPartialSuccess: '{successCount} of {totalCount} terminals created ({failureCount} failed)',

      // Errors
      groupLoadError: 'Failed to load group details',
      memberLoadError: 'Failed to load members',
      memberAddError: 'Failed to add member',
      memberRemoveError: 'Failed to remove member',
      memberRoleError: 'Failed to update member role',
      groupUpdateError: 'Failed to update group',
      groupDeleteError: 'Failed to delete group',
      bulkTerminalsError: 'Failed to create terminals for members',
      cannotRemoveOwner: 'Cannot remove the group owner',
      cannotManageNotAdmin: 'You do not have permission to manage members',
      userAlreadyMember: 'User is already a member of this group',
      groupFull: 'Group is at maximum capacity',
      groupExpired: 'Group has expired',
      groupInactive: 'Group is inactive',

      // Empty States
      noMembers: 'No members in this group',
      noDescription: 'No description provided',

      // Password Regeneration
      selectAll: 'Select All',
      deselectAll: 'Deselect All',
      regeneratePasswords: 'Regenerate Passwords',
      regeneratePasswordsCount: 'Regenerate Passwords ({count})',
      regeneratePasswordsConfirm: 'Are you sure you want to regenerate passwords for {count} member(s)? This will invalidate their current passwords.',
      regeneratePasswordsSuccess: 'Successfully regenerated {count} password(s)',
      regeneratePasswordsError: 'Failed to regenerate passwords',
      credentialsTitle: 'New Credentials',
      password: 'Password',
      credentialsWarning: 'These credentials will only be shown once. Please download or copy them now.',
      downloadCsv: 'Download CSV',
      credentialsCopied: 'Credentials copied to clipboard',
      close: 'Close'
    }
  },
  fr: {
    groupDetails: {
      // Page & Navigation
      pageTitle: 'Détails du groupe',
      backToGroups: 'Retour aux groupes',
      groupNotFound: 'Groupe introuvable',
      loading: 'Chargement des détails du groupe...',

      // Tabs
      tabOverview: 'Aperçu',
      tabMembers: 'Membres',
      tabHistory: 'Historique des commandes',
      tabSettings: 'Paramètres',

      // Overview Fields
      displayName: 'Nom d\'affichage',
      description: 'Description',
      owner: 'Propriétaire',
      organization: 'Organisation',
      noOrganization: 'Aucune organisation',
      parentGroup: 'Groupe parent',
      subGroups: 'Sous-groupes',
      createdAt: 'Créé',
      updatedAt: 'Modifié',
      expiresAt: 'Expire',
      mainGroup: 'Groupe Principal',
      maxMembers: 'Membres maximum',
      currentMembers: 'Membres actuels',
      noParentGroup: 'Aucun (groupe de niveau supérieur)',
      noSubGroups: 'Aucun sous-groupe',
      viewGroup: 'Voir',

      // Status
      statusActive: 'Actif',
      statusInactive: 'Inactif',
      statusExpired: 'EXPIRÉ',
      statusFull: 'COMPLET',

      // Member Count
      memberCount: 'Membres',
      memberCountLabel: '{current} / {max} membres',
      memberCapacity: '{percentage}% capacité',

      // Members Section
      memberEmail: 'Email',
      memberRole: 'Rôle',
      memberJoinedAt: 'Rejoint le',
      memberStatus: 'Statut',
      memberActions: 'Actions',
      searchMembers: 'Rechercher des membres...',

      // Roles
      roleOwner: 'Propriétaire',
      roleAdmin: 'Administrateur',
      roleAssistant: 'Assistant',
      roleMember: 'Membre',

      // Buttons & Actions
      editGroup: 'Modifier le groupe',
      deleteGroup: 'Supprimer le groupe',
      addMember: 'Ajouter un membre',
      removeMember: 'Retirer',
      changeRole: 'Changer le rôle',
      saveChanges: 'Enregistrer',
      cancel: 'Annuler',
      createTerminalsForAll: 'Créer des Terminaux pour Tous les Membres',
      bulkCreateTerminals: 'Création en Masse de Terminaux',
      createSubgroup: 'Créer un Sous-groupe',
      addSubgroup: 'Ajouter un Sous-groupe',

      // Modals
      addMemberTitle: 'Ajouter un membre à {groupName}',
      selectUser: 'ID utilisateur ou Email',
      selectRole: 'Sélectionner un rôle',
      deleteConfirmTitle: 'Supprimer le groupe ?',
      deleteConfirmMessage: 'Cette action ne peut pas être annulée. Tous les membres seront retirés et le groupe sera définitivement supprimé.',
      bulkTerminalTitle: 'Créer des Terminaux pour Tous les Membres',
      bulkTerminalMessage: 'Ceci créera {count} sessions terminales (une pour chaque membre). Continuer ?',
      instanceTypeLabel: 'Type d\'Instance',
      expirySecondsLabel: 'Expiration (secondes, optionnel)',
      termsLabel: 'Conditions d\'Utilisation',

      // Messages
      memberAddedSuccess: 'Membre ajouté avec succès',
      memberRemovedSuccess: 'Membre retiré avec succès',
      memberRoleUpdatedSuccess: 'Rôle du membre mis à jour avec succès',
      groupUpdatedSuccess: 'Groupe mis à jour avec succès',
      groupDeletedSuccess: 'Groupe supprimé avec succès',
      bulkTerminalsCreatedSuccess: '{count} sessions terminales créées avec succès',
      bulkTerminalsPartialSuccess: '{successCount} sur {totalCount} terminaux créés ({failureCount} échoués)',

      // Errors
      groupLoadError: 'Échec du chargement des détails du groupe',
      memberLoadError: 'Échec du chargement des membres',
      memberAddError: 'Échec de l\'ajout du membre',
      memberRemoveError: 'Échec du retrait du membre',
      memberRoleError: 'Échec de la mise à jour du rôle',
      groupUpdateError: 'Échec de la mise à jour du groupe',
      groupDeleteError: 'Échec de la suppression du groupe',
      bulkTerminalsError: 'Échec de la création des terminaux pour les membres',
      cannotRemoveOwner: 'Impossible de retirer le propriétaire du groupe',
      cannotManageNotAdmin: 'Vous n\'avez pas la permission de gérer les membres',
      userAlreadyMember: 'L\'utilisateur est déjà membre de ce groupe',
      groupFull: 'Le groupe a atteint sa capacité maximale',
      groupExpired: 'Le groupe a expiré',
      groupInactive: 'Le groupe est inactif',

      // Empty States
      noMembers: 'Aucun membre dans ce groupe',
      noDescription: 'Aucune description fournie',

      // Password Regeneration
      selectAll: 'Tout sélectionner',
      deselectAll: 'Tout désélectionner',
      regeneratePasswords: 'Régénérer les mots de passe',
      regeneratePasswordsCount: 'Régénérer les mots de passe ({count})',
      regeneratePasswordsConfirm: 'Êtes-vous sûr de vouloir régénérer les mots de passe de {count} membre(s) ? Cela invalidera leurs mots de passe actuels.',
      regeneratePasswordsSuccess: '{count} mot(s) de passe régénéré(s) avec succès',
      regeneratePasswordsError: 'Échec de la régénération des mots de passe',
      credentialsTitle: 'Nouveaux identifiants',
      password: 'Mot de passe',
      credentialsWarning: 'Ces identifiants ne seront affichés qu\'une seule fois. Veuillez les télécharger ou les copier maintenant.',
      downloadCsv: 'Télécharger CSV',
      credentialsCopied: 'Identifiants copiés dans le presse-papiers',
      close: 'Fermer'
    }
  }
})

// State
const currentGroup = ref<ClassGroup | null>(null)
const ownerUser = ref<User | null>(null)
const groupOrganization = ref<Organization | null>(null)
const isLoading = ref(true)
const error = ref('')
// Initialize activeTab from URL query parameter
const activeTab = ref<'overview' | 'members' | 'history' | 'settings'>(
  (route.query.tab as 'overview' | 'members' | 'history' | 'settings') || 'overview'
)
const showAddMemberModal = ref(false)
const showDeleteConfirm = ref(false)
const showEditGroupModal = ref(false)
const showCreateSubgroupModal = ref(false)

// Password regeneration state
const selectedMemberIds = ref(new Set<string>())
const regeneratedCredentials = ref<UserCredential[]>([])
const showCredentialsModal = ref(false)
const isRegenerating = ref(false)

// User search for Add Member modal
const userSearchQuery = ref('')
const userSearchResults = ref<User[]>([])
const isSearchingUsers = ref(false)
const showUserSearchDropdown = ref(false)

// Group ID for composable
const groupId = computed(() => route.params.id as string | null)

// Computed Properties
const isOwner = computed(() => {
  return currentGroup.value?.owner_user_id === currentUser.userId
})

const isAdmin = computed(() => {
  const member = groupMembersComposable.members.value.find(m => m.user_id === currentUser.userId)
  return member?.role === 'admin' || member?.role === 'owner'
})

const canEditGroup = computed(() => {
  return isOwner.value || isAdmin.value
})

const canDeleteGroup = computed(() => {
  return isOwner.value
})

const isAssistant = computed(() => {
  const member = groupMembersComposable.members.value.find(m => m.user_id === currentUser.userId)
  return member?.role === 'assistant'
})

const canViewHistory = computed(() => {
  return canEditGroup.value || isAssistant.value
})

const groupStatus = computed(() => {
  if (!currentGroup.value) return 'inactive'
  if (currentGroup.value.is_expired) return 'expired'
  if (currentGroup.value.is_full) return 'full'
  if (!currentGroup.value.is_active) return 'inactive'
  return 'active'
})

const statusColor = computed(() => {
  switch (groupStatus.value) {
    case 'active': return 'success'
    case 'expired': return 'warning'
    case 'full': return 'info'
    case 'inactive': return 'danger'
    default: return 'secondary'
  }
})

const actualMemberPercentage = computed(() => {
  if (!currentGroup.value) return 0
  return Math.round((groupMembersComposable.members.value.length / currentGroup.value.max_members) * 100)
})

const subgroups = computed(() => {
  return currentGroup.value?.subGroups || currentGroup.value?.sub_groups || []
})

// Use Group Members composable
const groupMembersComposable = useGroupMembers({
  groupId,
  currentUserId: computed(() => currentUser.userId),
  isOwner
})

// Selectable members (exclude owner)
const selectableMembers = computed(() => {
  return groupMembersComposable.sortedMembers.value.filter(
    m => m.user_id !== currentGroup.value?.owner_user_id
  )
})

const allSelectableSelected = computed(() => {
  if (selectableMembers.value.length === 0) return false
  return selectableMembers.value.every(m => selectedMemberIds.value.has(m.user_id))
})

const selectedCount = computed(() => selectedMemberIds.value.size)

// Methods
const loadGroup = async () => {
  return await withAsync(
    { isLoading, error },
    async () => {
      const groupId = route.params.id as string
      if (!groupId) return

      // Load group with parent and subgroups
      const data = await groupStore.getOne(groupId, ['ParentGroup', 'SubGroups'])
      currentGroup.value = data

      // Load owner user information
      if (data.owner_user_id) {
        try {
          ownerUser.value = await userService.getUserById(data.owner_user_id)
        } catch (err) {
          console.error('Failed to load owner user:', err)
          ownerUser.value = null
        }
      }

      // Load organization information
      if (data.organization_id) {
        try {
          const orgResponse = await axios.get(`/organizations/${data.organization_id}`)
          groupOrganization.value = orgResponse.data
        } catch (err) {
          console.error('Failed to load organization:', err)
          groupOrganization.value = null
        }
      }

      return data
    },
    'groupDetails.groupLoadError'
  )
}

const handleAddMember = async () => {
  // Check group capacity
  if (currentGroup.value?.is_full) {
    error.value = t('groupDetails.groupFull')
    return
  }

  const result = await groupMembersComposable.addMember()
  if (result) {
    // Update group member count
    if (currentGroup.value) {
      currentGroup.value.member_count++
    }
    showAddMemberModal.value = false
    // Reset search
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
  // Delay hiding dropdown to allow click events to fire
  setTimeout(() => {
    showUserSearchDropdown.value = false
  }, 200)
}

const handleEditGroup = async (data: any) => {
  return await withAsync(
    { isLoading, error },
    async () => {
      if (!currentGroup.value) return

      await groupStore.updateEntity('/class-groups', currentGroup.value.id, data)

      // Reload group to reflect changes
      await loadGroup()

      showEditGroupModal.value = false
    },
    'groupDetails.groupUpdateError'
  )
}

const handleDeleteGroup = async () => {
  return await withAsync(
    { isLoading, error },
    async () => {
      if (!currentGroup.value) return

      await groupStore.deleteEntity('/class-groups', currentGroup.value.id)
      router.push('/class-groups')
    },
    'groupDetails.groupDeleteError'
  )
}

const handleCreateSubgroup = async (data: any) => {
  return await withAsync(
    { isLoading, error },
    async () => {
      if (!currentGroup.value) return

      // Set parent_group_id to current group
      data.parent_group_id = currentGroup.value.id

      await groupStore.createEntity('/class-groups', data)

      // Reload group to refresh subgroups list
      await loadGroup()

      showCreateSubgroupModal.value = false
    },
    'groupDetails.groupCreateError'
  )
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
  if (selectedCount.value === 0 || !currentGroup.value?.organization_id) return

  const confirmed = window.confirm(
    t('groupDetails.regeneratePasswordsConfirm', { count: selectedCount.value })
  )
  if (!confirmed) return

  isRegenerating.value = true
  try {
    const response = await bulkImportService.regeneratePasswords(
      currentGroup.value.organization_id,
      currentGroup.value.id,
      Array.from(selectedMemberIds.value)
    )

    if (response.credentials.length > 0) {
      regeneratedCredentials.value = response.credentials
      showCredentialsModal.value = true
    }

    if (response.errors.length > 0) {
      error.value = t('groupDetails.regeneratePasswordsError')
    }

    selectedMemberIds.value = new Set()
  } catch (err: any) {
    error.value = err.response?.data?.error_message || t('groupDetails.regeneratePasswordsError')
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
  a.download = `credentials-${currentGroup.value?.display_name || 'group'}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// Lifecycle
onMounted(async () => {
  // Check feature flag
  if (!isEnabled('class_groups')) {
    //TODO use default user route
    router.push('/dashboard')
    return
  }

  isLoading.value = true
  await loadGroup()
  // Load members with subgroups included
  await groupMembersComposable.loadMembers(true, subgroups.value)
  isLoading.value = false
})

watch(() => route.params.id, async () => {
  isLoading.value = true
  await loadGroup()
  // Load members with subgroups included
  await groupMembersComposable.loadMembers(true, subgroups.value)
  isLoading.value = false
})

// Sync activeTab with URL query parameter (for browser back/forward)
watch(() => route.query.tab, (newTab) => {
  if (newTab && typeof newTab === 'string' && ['overview', 'members', 'history', 'settings'].includes(newTab)) {
    activeTab.value = newTab as 'overview' | 'members' | 'history' | 'settings'
  }
})

// Update URL when tab changes
watch(activeTab, (newTab) => {
  if (route.query.tab !== newTab) {
    router.push({
      path: route.path,
      query: { ...route.query, tab: newTab }
    })
  }
})
</script>

<template>
  <div class="group-detail">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      {{ t('groupDetails.loading') }}
    </div>

    <!-- Error State -->
    <div v-else-if="error && !currentGroup" class="error-state">
      <i class="fas fa-exclamation-triangle"></i>
      <p>{{ error }}</p>
      <router-link to="/class-groups" class="btn btn-primary">
        {{ t('groupDetails.backToGroups') }}
      </router-link>
    </div>

    <!-- Group Details -->
    <div v-else-if="currentGroup" class="group-detail-content">
      <!-- Header -->
      <div class="group-detail-header">
        <router-link to="/class-groups" class="back-link">
          <i class="fas fa-arrow-left"></i>
          {{ t('groupDetails.backToGroups') }}
        </router-link>

        <div class="header-title">
          <h1>{{ currentGroup.display_name }}</h1>
          <span class="status-badge" :class="`badge-${statusColor}`">
            {{ t(`groupDetails.status${groupStatus.charAt(0).toUpperCase() + groupStatus.slice(1)}`) }}
          </span>
        </div>

        <div class="header-actions">
          <button
            v-if="canEditGroup"
            @click="activeTab = 'settings'"
            class="btn btn-secondary"
          >
            <i class="fas fa-edit"></i>
            {{ t('groupDetails.editGroup') }}
          </button>
          <button
            v-if="canDeleteGroup"
            @click="showDeleteConfirm = true"
            class="btn btn-danger"
          >
            <i class="fas fa-trash"></i>
            {{ t('groupDetails.deleteGroup') }}
          </button>
        </div>
      </div>

      <!-- Status Bar -->
      <div class="group-status-bar">
        <div class="status-item">
          <i class="fas fa-users"></i>
          <span>{{ t('groupDetails.memberCountLabel', {
            current: groupMembersComposable.members.value.length,
            max: currentGroup.max_members
          }) }}</span>
        </div>
        <div class="status-item">
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: actualMemberPercentage + '%' }"
              :class="{ 'progress-warning': actualMemberPercentage >= 80 }"
            ></div>
          </div>
          <span class="capacity-text">
            {{ t('groupDetails.memberCapacity', { percentage: actualMemberPercentage }) }}
          </span>
        </div>
        <div v-if="currentGroup.expires_at" class="status-item">
          <i class="fas fa-calendar"></i>
          <span>{{ t('groupDetails.expiresAt') }}: {{ formatDate(currentGroup.expires_at) }}</span>
        </div>
      </div>

      <!-- Tabs Navigation -->
      <div class="group-tabs">
        <button
          @click="activeTab = 'overview'"
          :class="['tab-button', { active: activeTab === 'overview' }]"
        >
          <i class="fas fa-info-circle"></i>
          {{ t('groupDetails.tabOverview') }}
        </button>
        <button
          @click="activeTab = 'members'"
          :class="['tab-button', { active: activeTab === 'members' }]"
        >
          <i class="fas fa-users"></i>
          {{ t('groupDetails.tabMembers') }}
          <span class="badge">{{ groupMembersComposable.members.value.length }}</span>
        </button>
        <button
          v-if="canViewHistory"
          @click="activeTab = 'history'"
          :class="['tab-button', { active: activeTab === 'history' }]"
        >
          <i class="fas fa-history"></i>
          {{ t('groupDetails.tabHistory') }}
        </button>
        <button
          v-if="canEditGroup"
          @click="activeTab = 'settings'"
          :class="['tab-button', { active: activeTab === 'settings' }]"
        >
          <i class="fas fa-cog"></i>
          {{ t('groupDetails.tabSettings') }}
        </button>
      </div>

      <!-- Tab Content: Overview -->
      <div v-show="activeTab === 'overview'" class="tab-content overview-tab">
        <div class="info-grid">
          <div class="info-item">
            <label>{{ t('groupDetails.displayName') }}</label>
            <p>{{ currentGroup.display_name }}</p>
          </div>
          <div class="info-item">
            <label>{{ t('groupDetails.description') }}</label>
            <p>{{ currentGroup.description || t('groupDetails.noDescription') }}</p>
          </div>
          <div class="info-item">
            <label>{{ t('groupDetails.owner') }}</label>
            <p v-if="ownerUser">
              <span class="owner-name">{{ ownerUser.display_name || ownerUser.name }}</span>
              <span v-if="ownerUser.email" class="owner-email">({{ ownerUser.email }})</span>
            </p>
            <p v-else class="text-muted">{{ currentGroup.owner_user_id }}</p>
          </div>
          <div class="info-item">
            <label>{{ t('groupDetails.organization') }}</label>
            <p v-if="groupOrganization">
              <router-link
                :to="{ name: 'OrganizationDetail', params: { id: groupOrganization.id } }"
                class="parent-group-link"
              >
                <i class="fas fa-building"></i>
                {{ groupOrganization.display_name || groupOrganization.name }}
                <i class="fas fa-external-link-alt"></i>
              </router-link>
            </p>
            <p v-else-if="currentGroup.organization_id" class="text-muted">{{ currentGroup.organization_id }}</p>
            <p v-else class="text-muted">{{ t('groupDetails.noOrganization') }}</p>
          </div>
          <div class="info-item">
            <label>{{ t('groupDetails.parentGroup') }}</label>
            <p v-if="currentGroup.parentGroup || currentGroup.parent_group">
              <router-link
                :to="`/class-groups/${currentGroup.parentGroup?.id || currentGroup.parent_group?.id}`"
                class="parent-group-link"
              >
                {{ currentGroup.parentGroup?.display_name || currentGroup.parent_group?.display_name }}
                <i class="fas fa-external-link-alt"></i>
              </router-link>
            </p>
            <p v-else class="text-muted">{{ t('groupDetails.noParentGroup') }}</p>
          </div>
          <div class="info-item">
            <label>{{ t('groupDetails.maxMembers') }}</label>
            <p>{{ currentGroup.max_members }}</p>
          </div>
          <div class="info-item">
            <label>{{ t('groupDetails.currentMembers') }}</label>
            <p>{{ groupMembersComposable.members.value.length }}</p>
          </div>
          <div class="info-item">
            <label>{{ t('groupDetails.createdAt') }}</label>
            <p>{{ formatDateTime(currentGroup.created_at) }}</p>
          </div>
          <div class="info-item">
            <label>{{ t('groupDetails.updatedAt') }}</label>
            <p>{{ formatDateTime(currentGroup.updated_at) }}</p>
          </div>
          <div v-if="currentGroup.expires_at" class="info-item">
            <label>{{ t('groupDetails.expiresAt') }}</label>
            <p>{{ formatDate(currentGroup.expires_at) }}</p>
          </div>
        </div>

        <!-- Subgroups Section -->
        <div class="subgroups-section">
          <div class="subgroups-header">
            <h3>{{ t('groupDetails.subGroups') }}</h3>
            <button
              v-if="canEditGroup"
              @click="showCreateSubgroupModal = true"
              class="btn btn-primary btn-sm"
            >
              <i class="fas fa-plus"></i>
              {{ t('groupDetails.addSubgroup') }}
            </button>
          </div>
          <div v-if="(currentGroup.subGroups?.length || currentGroup.sub_groups?.length || 0) > 0" class="subgroups-list">
            <div
              v-for="subgroup in (currentGroup.subGroups || currentGroup.sub_groups)"
              :key="subgroup.id"
              class="subgroup-card"
            >
              <div class="subgroup-info">
                <h4>{{ subgroup.display_name }}</h4>
                <p v-if="subgroup.description" class="subgroup-description">{{ subgroup.description }}</p>
              </div>
              <div class="subgroup-actions">
                <router-link :to="`/class-groups/${subgroup.id}`" class="btn btn-sm btn-primary">
                  {{ t('groupDetails.viewGroup') }}
                  <i class="fas fa-arrow-right"></i>
                </router-link>
              </div>
            </div>
          </div>
          <p v-else class="text-muted">{{ t('groupDetails.noSubGroups') }}</p>
        </div>
      </div>

      <!-- Tab Content: Members -->
      <div v-show="activeTab === 'members'" class="tab-content members-tab">
        <div class="members-toolbar">
          <input
            v-model="groupMembersComposable.memberSearchQuery.value"
            type="text"
            :placeholder="t('groupDetails.searchMembers')"
            class="search-input"
          />
          <label v-if="groupMembersComposable.canManageMembers.value && selectableMembers.length > 0" class="select-all-checkbox">
            <input
              type="checkbox"
              :checked="allSelectableSelected"
              @change="toggleSelectAll"
            />
            {{ allSelectableSelected ? t('groupDetails.deselectAll') : t('groupDetails.selectAll') }}
          </label>
          <div class="toolbar-actions">
            <button
              v-if="groupMembersComposable.canManageMembers.value && selectedCount > 0"
              @click="handleRegeneratePasswords"
              class="btn btn-warning"
              :disabled="isRegenerating"
            >
              <i class="fas fa-key"></i>
              {{ t('groupDetails.regeneratePasswordsCount', { count: selectedCount }) }}
            </button>
            <router-link
              v-if="groupMembersComposable.canManageMembers.value && groupMembersComposable.members.value.length > 0"
              :to="`/terminal-creation?mode=bulk&groupId=${currentGroup.id}`"
              class="btn btn-secondary"
              :title="t('groupDetails.createTerminalsForAll')"
            >
              <i class="fas fa-terminal"></i>
              {{ t('groupDetails.bulkCreateTerminals') }}
            </router-link>
            <button
              v-if="groupMembersComposable.canManageMembers.value"
              @click="showAddMemberModal = true"
              class="btn btn-primary"
            >
              <i class="fas fa-plus"></i>
              {{ t('groupDetails.addMember') }}
            </button>
          </div>
        </div>

        <div v-if="groupMembersComposable.sortedMembers.value.length === 0" class="empty-state">
          <i class="fas fa-users"></i>
          <p>{{ t('groupDetails.noMembers') }}</p>
        </div>

        <div v-else class="members-list">
          <div
            v-for="member in groupMembersComposable.sortedMembers.value"
            :key="member.id"
            :class="['member-card', { 'member-selected': selectedMemberIds.has(member.user_id) }]"
          >
            <input
              v-if="groupMembersComposable.canManageMembers.value && member.user_id !== currentGroup?.owner_user_id"
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
                    {{ t(`groupDetails.role${member.role.charAt(0).toUpperCase() + member.role.slice(1)}`) }}
                  </span>
                  <span v-if="member.source_group" class="source-group-badge">
                    <i class="fas fa-layer-group"></i>
                    {{ member.source_group.display_name }}
                  </span>
                  <span v-else class="source-group-badge main-group">
                    <i class="fas fa-star"></i>
                    {{ t('groupDetails.mainGroup') }}
                  </span>
                  <span v-if="member.joined_at" class="member-joined">
                    {{ t('groupDetails.memberJoinedAt') }}: {{ formatDate(member.joined_at) }}
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
                <option value="admin">{{ t('groupDetails.roleAdmin') }}</option>
                <option value="assistant">{{ t('groupDetails.roleAssistant') }}</option>
                <option value="member">{{ t('groupDetails.roleMember') }}</option>
              </select>
              <button
                v-if="groupMembersComposable.canRemoveMember(member)"
                @click="async () => {
                  await groupMembersComposable.removeMember(member)
                  if (currentGroup) currentGroup.member_count--
                }"
                class="btn btn-sm btn-danger"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab Content: Command History -->
      <div v-show="activeTab === 'history'" class="tab-content history-tab">
        <GroupCommandHistory v-if="currentGroup" :group-id="currentGroup.id" />
      </div>

      <!-- Tab Content: Settings -->
      <div v-show="activeTab === 'settings'" class="tab-content settings-tab">
        <div v-if="canEditGroup" class="settings-content">
          <div class="settings-header">
            <h3>{{ t('groupDetails.tabSettings') }}</h3>
            <button @click="showEditGroupModal = true" class="btn btn-primary">
              <i class="fas fa-edit"></i>
              {{ t('groupDetails.editGroup') }}
            </button>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <label>{{ t('groupDetails.displayName') }}</label>
              <p>{{ currentGroup.display_name }}</p>
            </div>
            <div class="info-item">
              <label>{{ t('groupDetails.description') }}</label>
              <p>{{ currentGroup.description || t('groupDetails.noDescription') }}</p>
            </div>
            <div class="info-item">
              <label>{{ t('groupDetails.maxMembers') }}</label>
              <p>{{ currentGroup.max_members }}</p>
            </div>
            <div v-if="currentGroup.expires_at" class="info-item">
              <label>{{ t('groupDetails.expiresAt') }}</label>
              <p>{{ formatDate(currentGroup.expires_at) }}</p>
            </div>
            <div class="info-item">
              <label>{{ t('groupDetails.statusActive') }}</label>
              <p>
                <span :class="['status-badge', `badge-${currentGroup.is_active ? 'success' : 'danger'}`]">
                  {{ currentGroup.is_active ? t('groupDetails.statusActive') : t('groupDetails.statusInactive') }}
                </span>
              </p>
            </div>
          </div>
        </div>
        <div v-else class="permission-denied">
          <i class="fas fa-lock"></i>
          <p>{{ t('groupDetails.cannotManageNotAdmin') }}</p>
        </div>
      </div>
    </div>

    <!-- Add Member Modal -->
    <BaseModal
      :visible="showAddMemberModal"
      :title="t('groupDetails.addMemberTitle', { groupName: currentGroup?.display_name })"
      size="medium"
      :is-loading="groupMembersComposable.isLoading.value"
      :show-default-footer="true"
      :confirm-text="t('groupDetails.addMember')"
      :cancel-text="t('groupDetails.cancel')"
      @confirm="handleAddMember"
      @close="showAddMemberModal = false; userSearchQuery = ''; userSearchResults = []"
    >
      <form @submit.prevent="handleAddMember">
        <div class="form-group">
          <label>{{ t('groupDetails.selectUser') }}</label>
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
          <label>{{ t('groupDetails.selectRole') }}</label>
          <select v-model="groupMembersComposable.newMemberData.value.role" class="form-control">
            <option value="member">{{ t('groupDetails.roleMember') }}</option>
            <option value="assistant">{{ t('groupDetails.roleAssistant') }}</option>
            <option value="admin">{{ t('groupDetails.roleAdmin') }}</option>
          </select>
        </div>
        <div v-if="groupMembersComposable.error.value" class="alert alert-danger">
          {{ groupMembersComposable.error.value }}
        </div>
      </form>
    </BaseModal>

    <!-- Delete Confirmation Modal -->
    <BaseModal
      :visible="showDeleteConfirm"
      :title="t('groupDetails.deleteConfirmTitle')"
      size="small"
      :show-default-footer="true"
      :confirm-text="t('groupDetails.deleteGroup')"
      :cancel-text="t('groupDetails.cancel')"
      @confirm="handleDeleteGroup"
      @close="showDeleteConfirm = false"
    >
      <p>{{ t('groupDetails.deleteConfirmMessage') }}</p>
    </BaseModal>

    <!-- Edit Group Modal -->
    <EntityModal
      :visible="showEditGroupModal"
      :entity="currentGroup"
      :entity-store="groupStore"
      entity-name="class-groups"
      @modify="handleEditGroup"
      @close="showEditGroupModal = false"
    />

    <!-- Create Subgroup Modal -->
    <EntityModal
      :visible="showCreateSubgroupModal"
      :entity-store="groupStore"
      entity-name="class-groups"
      @submit="handleCreateSubgroup"
      @close="showCreateSubgroupModal = false"
    />

    <!-- Credentials Modal -->
    <BaseModal
      :visible="showCredentialsModal"
      :title="t('groupDetails.credentialsTitle')"
      @close="showCredentialsModal = false"
      size="large"
    >
      <div class="credentials-content">
        <div class="credentials-warning">
          <i class="fas fa-exclamation-triangle"></i>
          {{ t('groupDetails.credentialsWarning') }}
        </div>
        <table class="credentials-table">
          <thead>
            <tr>
              <th>{{ t('groupDetails.memberEmail') }}</th>
              <th>{{ t('groupDetails.password') }}</th>
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
          {{ t('groupDetails.downloadCsv') }}
        </button>
        <button @click="showCredentialsModal = false" class="btn btn-secondary">
          {{ t('groupDetails.close') }}
        </button>
      </template>
    </BaseModal>

  </div>
</template>

<style scoped>
.group-detail {
  padding: var(--spacing-lg);
  max-width: 1200px;
  margin: 0 auto;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  gap: var(--spacing-md);
  color: var(--color-text-secondary);
}

.loading-state i {
  font-size: var(--font-size-2xl);
  color: var(--color-primary);
}

.error-state i {
  font-size: var(--font-size-2xl);
  color: var(--color-danger);
}

/* Header */
.group-detail-header {
  margin-bottom: var(--spacing-lg);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-primary);
  text-decoration: none;
  margin-bottom: var(--spacing-md);
  transition: var(--transition-base);
}

.back-link:hover {
  color: var(--color-primary-hover);
}

.header-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.header-title h1 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-2xl);
}

.status-badge {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.badge-success {
  background-color: var(--color-success-bg);
  color: var(--color-success-text);
}

.badge-warning {
  background-color: var(--color-warning-bg);
  color: var(--color-warning-text);
}

.badge-info {
  background-color: var(--color-info-bg);
  color: var(--color-info-text);
}

.badge-danger {
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

/* Status Bar */
.group-status-bar {
  display: flex;
  gap: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
}

.status-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-text-secondary);
}

.progress-bar {
  width: 200px;
  height: 8px;
  background-color: var(--color-bg-tertiary);
  border-radius: var(--border-radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--color-success);
  transition: width var(--transition-base);
}

.progress-fill.progress-warning {
  background-color: var(--color-warning);
}

.capacity-text {
  font-size: var(--font-size-sm);
}

/* Tabs */
.group-tabs {
  display: flex;
  gap: var(--spacing-sm);
  border-bottom: 2px solid var(--color-border-light);
  margin-bottom: var(--spacing-lg);
}

.tab-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: var(--transition-base);
  margin-bottom: -2px;
}

.tab-button:hover {
  color: var(--color-text-primary);
}

.tab-button.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.tab-button .badge {
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  padding: 2px 8px;
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
}

/* Tab Content */
.tab-content {
  padding: var(--spacing-md) 0;
}

/* Overview Tab */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
}

.info-item label {
  display: block;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
  font-size: var(--font-size-sm);
}

.info-item p {
  margin: 0;
  color: var(--color-text-primary);
}

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

/* Settings Tab */
.settings-content {
  padding: 0;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border-light);
}

.settings-header h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-xl);
}

.permission-denied {
  padding: var(--spacing-lg);
  background-color: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  text-align: center;
}

.info-message {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  justify-content: center;
  color: var(--color-info-text);
}

.permission-denied i {
  font-size: var(--font-size-2xl);
  color: var(--color-danger);
  margin-bottom: var(--spacing-md);
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

.modal-info {
  background-color: var(--color-info-bg);
  color: var(--color-info-text);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-md);
  border-left: 4px solid var(--color-info);
}

/* Owner Display */
.owner-name {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.owner-email {
  margin-left: var(--spacing-xs);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

/* Parent Group Link */
.parent-group-link {
  color: var(--color-primary);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  transition: var(--transition-base);
}

.parent-group-link:hover {
  color: var(--color-primary-hover);
  text-decoration: underline;
}

.parent-group-link i {
  font-size: var(--font-size-xs);
}

.text-muted {
  color: var(--color-text-muted);
  font-style: italic;
}

/* Subgroups Section */
.subgroups-section {
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border-light);
}

.subgroups-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.subgroups-section h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.subgroups-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-md);
}

.subgroup-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  transition: var(--transition-base);
}

.subgroup-card:hover {
  border-color: var(--color-border-medium);
  box-shadow: var(--shadow-sm);
}

.subgroup-info {
  flex: 1;
}

.subgroup-info h4 {
  margin: 0 0 var(--spacing-xs) 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
}

.subgroup-description {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.4;
}

.subgroup-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

/* Responsive */
@media (max-width: 768px) {
  .group-detail {
    padding: var(--spacing-md);
  }

  .header-actions {
    flex-direction: column;
    width: 100%;
  }

  .header-actions .btn {
    width: 100%;
  }

  .group-status-bar {
    flex-direction: column;
  }

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

  .info-grid {
    grid-template-columns: 1fr;
  }

  .subgroups-list {
    grid-template-columns: 1fr;
  }

  .subgroup-card {
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .subgroup-actions {
    width: 100%;
  }

  .subgroup-actions .btn {
    width: 100%;
  }
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
</style>
