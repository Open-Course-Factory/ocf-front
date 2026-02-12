<template>
  <div class="members-manager">
    <!-- Header with Actions -->
    <div class="members-header">
      <div class="header-info">
        <h3>
          <i class="fas fa-users"></i>
          {{ t('members.title') }}
        </h3>
        <div class="header-meta">
          <p class="member-count">
            {{ members.length }} / {{ maxMembers }} {{ t('members.members') }}
          </p>
          <button class="help-link" @click="goToRolesHelp">
            <i class="fas fa-question-circle"></i>
            {{ t('members.rolesHelp') }}
          </button>
        </div>
      </div>
      <button
        v-if="canManage"
        class="btn btn-primary"
        @click="openInviteModal"
        :disabled="members.length >= maxMembers"
      >
        <i class="fas fa-user-plus"></i>
        {{ t('members.inviteMember') }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <i class="fas fa-spinner fa-spin fa-2x"></i>
      <p>{{ t('members.loading') }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <i class="fas fa-exclamation-circle"></i>
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="loadMembers">
        <i class="fas fa-redo"></i>
        {{ t('members.retry') }}
      </button>
    </div>

    <!-- Members List -->
    <div v-else-if="members.length > 0" class="members-list">
      <div
        v-for="member in members"
        :key="member.id"
        class="member-card"
      >
        <div class="member-info">
          <div class="member-avatar">
            <i class="fas fa-user"></i>
          </div>
          <div class="member-details">
            <div class="member-name">
              {{ member.user?.display_name || member.user?.name || member.user?.email }}
            </div>
            <div class="member-email">{{ member.user?.email }}</div>
            <div class="member-meta">
              <span class="joined-date">
                <i class="fas fa-calendar"></i>
                {{ t('members.joined') }}: {{ formatDate(member.joined_at) }}
              </span>
            </div>
          </div>
        </div>

        <div class="member-actions">
          <div class="member-role">
            <select
              v-if="canManageRole(member)"
              v-model="member.role"
              @change="updateMemberRole(member)"
              class="role-select"
            >
              <option value="member">{{ t('members.roleMember') }}</option>
              <option value="manager">{{ t('members.roleManager') }}</option>
              <option v-if="props.isOwner" value="owner">{{ t('members.roleOwner') }}</option>
            </select>
            <span v-else :class="['role-badge', `role-${member.role}`]">
              {{ getRoleLabel(member.role) }}
            </span>
          </div>

          <button
            v-if="canRemoveMember(member)"
            class="btn btn-danger btn-sm"
            @click="confirmRemoveMember(member)"
            :title="t('members.removeMember')"
          >
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <i class="fas fa-users fa-3x"></i>
      <h4>{{ t('members.noMembers') }}</h4>
      <p>{{ t('members.noMembersDesc') }}</p>
      <button
        v-if="canManage"
        class="btn btn-primary"
        @click="openInviteModal"
      >
        <i class="fas fa-user-plus"></i>
        {{ t('members.inviteFirstMember') }}
      </button>
    </div>

    <!-- Invite Member Modal -->
    <div v-if="showInviteModal" class="modal-overlay" @click="closeInviteModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ t('members.inviteMember') }}</h3>
          <button class="modal-close" @click="closeInviteModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <div v-if="inviteError" class="alert alert-danger">
            {{ inviteError }}
          </div>

          <div class="form-group">
            <label for="userEmail">{{ t('members.emailAddress') }}</label>
            <input
              id="userEmail"
              v-model="inviteEmail"
              type="email"
              class="form-control"
              :placeholder="t('members.emailPlaceholder')"
              @keyup.enter="inviteMember"
            />
          </div>

          <div class="form-group">
            <label for="userRole">{{ t('members.role') }}</label>
            <select id="userRole" v-model="inviteRole" class="form-control">
              <option value="member">{{ t('members.roleMember') }}</option>
              <option value="manager">{{ t('members.roleManager') }}</option>
              <option v-if="props.isOwner" value="owner">{{ t('members.roleOwner') }}</option>
            </select>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeInviteModal">
            {{ t('members.cancel') }}
          </button>
          <button
            class="btn btn-primary"
            @click="inviteMember"
            :disabled="isInviting || !inviteEmail"
          >
            <i :class="isInviting ? 'fas fa-spinner fa-spin' : 'fas fa-paper-plane'"></i>
            {{ isInviting ? t('members.inviting') : t('members.sendInvite') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useTranslations } from '../../composables/useTranslations'
import type { OrganizationMember } from '../../types'

interface Props {
  organizationId: string
  canManage: boolean
  isOwner: boolean
  maxMembers?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxMembers: 100
})

const router = useRouter()

const { t } = useTranslations({
  en: {
    members: {
      title: 'Members',
      members: 'members',
      inviteMember: 'Invite Member',
      loading: 'Loading members...',
      retry: 'Retry',
      joined: 'Joined',
      roleMember: 'Member',
      roleManager: 'Manager',
      roleOwner: 'Owner',
      removeMember: 'Remove member',
      noMembers: 'No members yet',
      noMembersDesc: 'Invite members to collaborate in this organization',
      inviteFirstMember: 'Invite your first member',
      emailAddress: 'Email Address',
      emailPlaceholder: 'user@example.com',
      role: 'Role',
      cancel: 'Cancel',
      sendInvite: 'Send Invite',
      inviting: 'Inviting...',
      confirmRemove: 'Are you sure you want to remove this member from the organization?',
      roleUpdated: 'Member role updated successfully',
      memberRemoved: 'Member removed successfully',
      memberInvited: 'Member invited successfully',
      rolesHelp: 'Learn about roles',
    }
  },
  fr: {
    members: {
      title: 'Membres',
      members: 'membres',
      inviteMember: 'Inviter un membre',
      loading: 'Chargement des membres...',
      retry: 'Réessayer',
      joined: 'Rejoint',
      roleMember: 'Membre',
      roleManager: 'Gestionnaire',
      roleOwner: 'Propriétaire',
      removeMember: 'Retirer le membre',
      noMembers: 'Aucun membre',
      noMembersDesc: 'Invitez des membres pour collaborer dans cette organisation',
      inviteFirstMember: 'Invitez votre premier membre',
      emailAddress: 'Adresse email',
      emailPlaceholder: 'utilisateur@exemple.com',
      role: 'Rôle',
      cancel: 'Annuler',
      sendInvite: 'Envoyer l\'invitation',
      inviting: 'Invitation en cours...',
      confirmRemove: 'Êtes-vous sûr de vouloir retirer ce membre de l\'organisation ?',
      roleUpdated: 'Rôle du membre mis à jour avec succès',
      memberRemoved: 'Membre retiré avec succès',
      memberInvited: 'Membre invité avec succès',
      rolesHelp: 'En savoir plus sur les rôles',
    }
  }
})

const members = ref<OrganizationMember[]>([])
const isLoading = ref(false)
const error = ref('')
const showInviteModal = ref(false)
const inviteEmail = ref('')
const inviteRole = ref<'member' | 'manager' | 'owner'>('member')
const isInviting = ref(false)
const inviteError = ref('')

onMounted(() => {
  loadMembers()
})

const loadMembers = async () => {
  isLoading.value = true
  error.value = ''
  try {
    const response = await axios.get(`/organizations/${props.organizationId}/members`, {
      params: { include: 'User' }
    })
    members.value = response.data
  } catch (err: any) {
    error.value = err.response?.data?.error_message || err.message || 'Failed to load members'
  } finally {
    isLoading.value = false
  }
}

const openInviteModal = () => {
  inviteEmail.value = ''
  inviteRole.value = 'member'
  inviteError.value = ''
  showInviteModal.value = true
}

const closeInviteModal = () => {
  showInviteModal.value = false
}

const inviteMember = async () => {
  if (!inviteEmail.value) return

  isInviting.value = true
  inviteError.value = ''

  try {
    await axios.post(`/organizations/${props.organizationId}/members`, {
      email: inviteEmail.value,
      role: inviteRole.value
    })

    closeInviteModal()
    await loadMembers()
  } catch (err: any) {
    inviteError.value = err.response?.data?.error_message || err.message || 'Failed to invite member'
  } finally {
    isInviting.value = false
  }
}

const canManageRole = (member: OrganizationMember): boolean => {
  // Can't change owner role, can manage if current user can manage organization
  return props.canManage && member.role !== 'owner'
}

const canRemoveMember = (member: OrganizationMember): boolean => {
  // Can't remove owners
  return props.canManage && member.role !== 'owner'
}

const updateMemberRole = async (member: OrganizationMember) => {
  try {
    await axios.patch(`/organizations/${props.organizationId}/members/${member.id}`, {
      role: member.role
    })
  } catch (err: any) {
    error.value = err.response?.data?.error_message || err.message || 'Failed to update member role'
    // Reload to revert changes
    await loadMembers()
  }
}

const confirmRemoveMember = async (member: OrganizationMember) => {
  if (!confirm(t('members.confirmRemove'))) return

  try {
    await axios.delete(`/organizations/${props.organizationId}/members/${member.id}`)
    await loadMembers()
  } catch (err: any) {
    error.value = err.response?.data?.error_message || err.message || 'Failed to remove member'
  }
}

const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    owner: t('members.roleOwner'),
    manager: t('members.roleManager'),
    member: t('members.roleMember')
  }
  return labels[role] || role
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

const goToRolesHelp = () => {
  router.push({ name: 'HelpRolesAndPermissions' })
}
</script>

<style scoped>
.members-manager {
  width: 100%;
}

.members-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-info h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.member-count {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.help-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.help-link:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.help-link i {
  font-size: 0.875rem;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: var(--color-text-secondary);
}

.loading-state i {
  color: var(--color-primary);
  margin-bottom: 1rem;
}

.error-state {
  color: var(--color-danger);
}

.error-state i {
  margin-bottom: 1rem;
  font-size: 2rem;
}

.empty-state i {
  color: var(--color-text-tertiary);
  margin-bottom: 1.5rem;
}

.empty-state h4 {
  margin: 0 0 0.5rem 0;
  color: var(--color-text-primary);
}

.empty-state p {
  margin: 0 0 1.5rem 0;
}

.members-list {
  display: grid;
  gap: 1rem;
}

.member-card {
  background: var(--color-bg-secondary);
  border-radius: 8px;
  padding: 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: box-shadow 0.2s ease;
}

.member-card:hover {
  box-shadow: var(--shadow-sm);
}

.member-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.member-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.member-details {
  flex: 1;
}

.member-name {
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.25rem;
}

.member-email {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.5rem;
}

.member-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
}

.member-meta i {
  margin-right: 0.25rem;
}

.member-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.role-select {
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: 0.875rem;
  cursor: pointer;
}

.role-badge {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
}

.role-owner {
  background: var(--color-warning-light);
  color: var(--color-warning);
}

.role-manager {
  background: var(--color-info-light);
  color: var(--color-info);
}

.role-member {
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-sm {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.btn-secondary:hover {
  background: var(--color-bg-quaternary);
}

.btn-danger {
  background: var(--color-danger);
  color: white;
}

.btn-danger:hover {
  background: var(--color-danger-dark);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--overlay-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--color-bg-primary);
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow: auto;
  box-shadow: var(--shadow-modal);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: background 0.2s ease;
}

.modal-close:hover {
  background: var(--color-bg-secondary);
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid var(--color-border);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.form-control {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
}

.alert {
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
}

.alert-danger {
  background: var(--color-danger-light);
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
}
</style>
