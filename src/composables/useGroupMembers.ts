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

import { ref, computed, Ref } from 'vue'
import axios from 'axios'
import { withAsync } from '../utils/asyncWrapper'
import { useTranslations } from './useTranslations'

export interface GroupMember {
  id: string
  user_id: string
  role: 'owner' | 'admin' | 'assistant' | 'member'
  joined_at?: string
  user?: {
    id: string
    email: string
    username?: string
    display_name?: string
  }
}

export interface NewMemberData {
  user_id: string
  role: 'owner' | 'admin' | 'assistant' | 'member'
}

export interface UseGroupMembersOptions {
  groupId: Ref<string | null>
  currentUserId: Ref<string>
  isOwner: Ref<boolean>
}

export function useGroupMembers({ groupId, currentUserId, isOwner }: UseGroupMembersOptions) {
  const { t } = useTranslations({
    en: {
      groupMembers: {
        loadError: 'Failed to load members',
        addError: 'Failed to add member',
        updateError: 'Failed to update member role',
        removeError: 'Failed to remove member',
        addSuccess: 'Member added successfully',
        updateSuccess: 'Member role updated successfully',
        removeSuccess: 'Member removed successfully',
        cannotRemoveOwner: 'Cannot remove the group owner',
        cannotRemoveSelf: 'Cannot remove yourself from the group',
        userIdRequired: 'User ID is required',
        roleRequired: 'Role is required',
        userAlreadyMember: 'This user is already a member of the group'
      }
    },
    fr: {
      groupMembers: {
        loadError: 'Échec du chargement des membres',
        addError: 'Échec de l\'ajout du membre',
        updateError: 'Échec de la mise à jour du rôle',
        removeError: 'Échec de la suppression du membre',
        addSuccess: 'Membre ajouté avec succès',
        updateSuccess: 'Rôle du membre mis à jour avec succès',
        removeSuccess: 'Membre supprimé avec succès',
        cannotRemoveOwner: 'Impossible de retirer le propriétaire du groupe',
        cannotRemoveSelf: 'Impossible de vous retirer du groupe',
        userIdRequired: 'L\'ID utilisateur est requis',
        roleRequired: 'Le rôle est requis',
        userAlreadyMember: 'Cet utilisateur est déjà membre du groupe'
      }
    }
  })

  // State
  const members = ref<GroupMember[]>([])
  const memberSearchQuery = ref('')
  const newMemberData = ref<NewMemberData>({
    user_id: '',
    role: 'member'
  })
  const isLoading = ref(false)
  const error = ref('')

  // Computed
  const filteredMembers = computed(() => {
    if (!memberSearchQuery.value.trim()) {
      return members.value
    }
    const query = memberSearchQuery.value.toLowerCase()
    return members.value.filter(member => {
      const email = member.user?.email?.toLowerCase() || ''
      const username = member.user?.username?.toLowerCase() || ''
      const displayName = member.user?.display_name?.toLowerCase() || ''
      return email.includes(query) || username.includes(query) || displayName.includes(query)
    })
  })

  const sortedMembers = computed(() => {
    const roleOrder = { owner: 3, admin: 2, assistant: 1, member: 0 }
    return [...filteredMembers.value].sort((a, b) => {
      return (roleOrder[b.role] || 0) - (roleOrder[a.role] || 0)
    })
  })

  // Methods
  const loadMembers = async () => {
    if (!groupId.value) return

    return await withAsync(
      { isLoading, error },
      async () => {
        const response = await axios.get(`/group-members`, {
          params: {
            group_id: groupId.value
          }
        })
        members.value = response.data?.data || response.data || []
        return members.value
      },
      'groupMembers.loadError'
    )
  }

  const addMember = async () => {
    if (!groupId.value) return

    // Validation
    if (!newMemberData.value.user_id) {
      error.value = t('groupMembers.userIdRequired')
      return
    }

    if (!newMemberData.value.role) {
      error.value = t('groupMembers.roleRequired')
      return
    }

    // Check if user is already a member
    const existingMember = members.value.find(m => m.user_id === newMemberData.value.user_id)
    if (existingMember) {
      error.value = t('groupMembers.userAlreadyMember')
      return
    }

    return await withAsync(
      { isLoading, error },
      async () => {
        const newMember = {
          group_id: groupId.value,
          user_id: newMemberData.value.user_id,
          role: newMemberData.value.role,
          invited_by: currentUserId.value
        }

        const response = await axios.post('/group-members', newMember)

        // Reset form
        newMemberData.value = {
          user_id: '',
          role: 'member'
        }

        // Reload members to get full user details
        await loadMembers()

        return response.data
      },
      'groupMembers.addError'
    )
  }

  const updateMemberRole = async (member: GroupMember) => {
    return await withAsync(
      { isLoading, error },
      async () => {
        await axios.patch(`/group-members/${member.id}`, {
          role: member.role
        })
        return member
      },
      'groupMembers.updateError'
    )
  }

  const removeMember = async (member: GroupMember) => {
    // Owner protection
    if (member.role === 'owner') {
      error.value = t('groupMembers.cannotRemoveOwner')
      return
    }

    // Self-removal protection (only owner can remove themselves via group deletion)
    if (member.user_id === currentUserId.value) {
      error.value = t('groupMembers.cannotRemoveSelf')
      return
    }

    return await withAsync(
      { isLoading, error },
      async () => {
        await axios.delete(`/group-members/${member.id}`)
        const index = members.value.findIndex(m => m.id === member.id)
        if (index !== -1) {
          members.value.splice(index, 1)
        }
        return true
      },
      'groupMembers.removeError'
    )
  }

  const canManageMembers = computed(() => {
    return isOwner.value // Only owners can manage members
  })

  const canEditMember = (member: GroupMember) => {
    // Only owner can edit members
    // Owner role cannot be changed
    return isOwner.value && member.role !== 'owner'
  }

  const canRemoveMember = (member: GroupMember) => {
    // Only owner can remove members
    // Cannot remove owner
    // Cannot remove self
    return isOwner.value && member.role !== 'owner' && member.user_id !== currentUserId.value
  }

  return {
    // State
    members,
    memberSearchQuery,
    newMemberData,
    isLoading,
    error,

    // Computed
    filteredMembers,
    sortedMembers,
    canManageMembers,

    // Methods
    loadMembers,
    addMember,
    updateMemberRole,
    removeMember,
    canEditMember,
    canRemoveMember
  }
}
