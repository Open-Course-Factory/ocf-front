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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useClassGroupsStore } from '../../stores/classGroups'
import { useTranslations } from '../../composables/useTranslations'
import { withAsync } from '../../utils/asyncWrapper'
import { formatDate, formatDateTime } from '../../utils/formatters'
import { CLASS_PAGE_NAMES } from '../../router/classPages'
import type { ClassGroup } from '../../types'
import type { Organization } from '../../types/organization'
import type { User } from '../../services/domain/user'
import BaseModal from '../Modals/BaseModal.vue'
import EntityModal from '../Modals/EntityModal.vue'

// The class's whole configuration lives here since the "Aperçu" tab was retired:
// what the teacher can change (name, size, expiry) next to what they can only
// read (owner, organization, parent class, dates).
const props = defineProps<{
  group: ClassGroup
  ownerUser: User | null
  groupOrganization: Organization | null
  memberCount: number
  canEditGroup: boolean
  canDeleteGroup: boolean
}>()

const emit = defineEmits<{
  (e: 'group-updated'): void
  (e: 'group-deleted'): void
}>()

const router = useRouter()
const groupStore = useClassGroupsStore()

const showEditGroupModal = ref(false)
const showDeleteConfirm = ref(false)
const isLoading = ref(false)
const error = ref('')

const { t } = useTranslations({
  en: {
    groupSettings: {
      tabSettings: 'Settings',
      editGroup: 'Edit Group',
      deleteGroup: 'Delete Group',
      displayName: 'Display Name',
      description: 'Description',
      maxMembers: 'Maximum Members',
      currentMembers: 'Current Members',
      expiresAt: 'Expires',
      owner: 'Owner',
      organization: 'Organization',
      noOrganization: 'No organization',
      parentGroup: 'Parent Group',
      noParentGroup: 'None (top-level group)',
      createdAt: 'Created',
      updatedAt: 'Updated',
      statusActive: 'Active',
      statusInactive: 'Inactive',
      noDescription: 'No description provided',
      cannotManageNotAdmin: 'You do not have permission to manage members',
      deleteConfirmTitle: 'Delete Group?',
      deleteConfirmMessage: 'This action cannot be undone. All members will be removed and the group will be permanently deleted.',
      cancel: 'Cancel'
    }
  },
  fr: {
    groupSettings: {
      tabSettings: 'Paramètres',
      editGroup: 'Modifier le groupe',
      deleteGroup: 'Supprimer le groupe',
      displayName: 'Nom d\'affichage',
      description: 'Description',
      maxMembers: 'Membres maximum',
      currentMembers: 'Membres actuels',
      expiresAt: 'Expire',
      owner: 'Propriétaire',
      organization: 'Organisation',
      noOrganization: 'Aucune organisation',
      parentGroup: 'Groupe parent',
      noParentGroup: 'Aucun (groupe de niveau supérieur)',
      createdAt: 'Créé',
      updatedAt: 'Modifié',
      statusActive: 'Actif',
      statusInactive: 'Inactif',
      noDescription: 'Aucune description fournie',
      cannotManageNotAdmin: 'Vous n\'avez pas la permission de gérer les membres',
      deleteConfirmTitle: 'Supprimer le groupe ?',
      deleteConfirmMessage: 'Cette action ne peut pas être annulée. Tous les membres seront retirés et le groupe sera définitivement supprimé.',
      cancel: 'Annuler'
    }
  }
})

const handleEditGroup = async (data: any) => {
  return await withAsync(
    { isLoading, error },
    async () => {
      if (!props.group) return

      await groupStore.updateEntity('/class-groups', props.group.id, data)

      showEditGroupModal.value = false
      emit('group-updated')
    },
    'groupSettings.groupUpdateError'
  )
}

const handleDeleteGroup = async () => {
  return await withAsync(
    { isLoading, error },
    async () => {
      if (!props.group) return

      await groupStore.deleteEntity('/class-groups', props.group.id)
      emit('group-deleted')
      // The class this page belonged to no longer exists, so there is no page of
      // it left to be on: back to the console the teacher navigates from.
      router.push('/my-classes')
    },
    'groupSettings.groupDeleteError'
  )
}
</script>

<template>
  <div class="settings-tab">
    <div v-if="canEditGroup" class="settings-content">
      <div class="settings-header">
        <h3>{{ t('groupSettings.tabSettings') }}</h3>
        <div class="settings-actions">
          <button @click="showEditGroupModal = true" class="btn btn-primary">
            <i class="fas fa-edit"></i>
            {{ t('groupSettings.editGroup') }}
          </button>
          <button
            v-if="canDeleteGroup"
            @click="showDeleteConfirm = true"
            class="btn btn-danger"
          >
            <i class="fas fa-trash"></i>
            {{ t('groupSettings.deleteGroup') }}
          </button>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <label>{{ t('groupSettings.displayName') }}</label>
          <p>{{ group.display_name }}</p>
        </div>
        <div class="info-item">
          <label>{{ t('groupSettings.description') }}</label>
          <p>{{ group.description || t('groupSettings.noDescription') }}</p>
        </div>
        <div class="info-item">
          <label>{{ t('groupSettings.maxMembers') }}</label>
          <p>{{ group.max_members }}</p>
        </div>
        <div class="info-item">
          <label>{{ t('groupSettings.currentMembers') }}</label>
          <p>{{ memberCount }}</p>
        </div>
        <div v-if="group.expires_at" class="info-item">
          <label>{{ t('groupSettings.expiresAt') }}</label>
          <p>{{ formatDate(group.expires_at) }}</p>
        </div>
        <div class="info-item">
          <label>{{ t('groupSettings.statusActive') }}</label>
          <p>
            <span :class="['status-badge', `badge-${group.is_active ? 'success' : 'danger'}`]">
              {{ group.is_active ? t('groupSettings.statusActive') : t('groupSettings.statusInactive') }}
            </span>
          </p>
        </div>
        <div class="info-item">
          <label>{{ t('groupSettings.owner') }}</label>
          <p v-if="ownerUser">
            <span class="owner-name">{{ ownerUser.display_name || ownerUser.name }}</span>
            <span v-if="ownerUser.email" class="owner-email">({{ ownerUser.email }})</span>
          </p>
          <p v-else class="text-muted">{{ group.owner_user_id }}</p>
        </div>
        <div class="info-item">
          <label>{{ t('groupSettings.organization') }}</label>
          <p v-if="groupOrganization">
            <router-link
              :to="{ name: 'OrganizationDetail', params: { id: groupOrganization.id } }"
              class="related-link"
            >
              <i class="fas fa-building"></i>
              {{ groupOrganization.display_name || groupOrganization.name }}
              <i class="fas fa-external-link-alt"></i>
            </router-link>
          </p>
          <p v-else-if="group.organization_id" class="text-muted">{{ group.organization_id }}</p>
          <p v-else class="text-muted">{{ t('groupSettings.noOrganization') }}</p>
        </div>
        <div class="info-item">
          <label>{{ t('groupSettings.parentGroup') }}</label>
          <p v-if="group.parentGroup || group.parent_group">
            <router-link
              :to="{
                name: CLASS_PAGE_NAMES.live,
                params: { id: group.parentGroup?.id || group.parent_group?.id }
              }"
              class="related-link"
            >
              {{ group.parentGroup?.display_name || group.parent_group?.display_name }}
              <i class="fas fa-external-link-alt"></i>
            </router-link>
          </p>
          <p v-else class="text-muted">{{ t('groupSettings.noParentGroup') }}</p>
        </div>
        <div class="info-item">
          <label>{{ t('groupSettings.createdAt') }}</label>
          <p>{{ formatDateTime(group.created_at) }}</p>
        </div>
        <div class="info-item">
          <label>{{ t('groupSettings.updatedAt') }}</label>
          <p>{{ formatDateTime(group.updated_at) }}</p>
        </div>
      </div>
    </div>
    <div v-else class="permission-denied">
      <i class="fas fa-lock"></i>
      <p>{{ t('groupSettings.cannotManageNotAdmin') }}</p>
    </div>

    <!-- Edit Group Modal -->
    <EntityModal
      :visible="showEditGroupModal"
      :entity="group"
      :entity-store="groupStore"
      entity-name="class-groups"
      @modify="handleEditGroup"
      @close="showEditGroupModal = false"
    />

    <!-- Delete Confirmation Modal -->
    <BaseModal
      :visible="showDeleteConfirm"
      :title="t('groupSettings.deleteConfirmTitle')"
      size="small"
      :show-default-footer="true"
      :confirm-text="t('groupSettings.deleteGroup')"
      :cancel-text="t('groupSettings.cancel')"
      @confirm="handleDeleteGroup"
      @close="showDeleteConfirm = false"
    >
      <p>{{ t('groupSettings.deleteConfirmMessage') }}</p>
    </BaseModal>
  </div>
</template>

<style scoped>
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

.settings-actions {
  display: flex;
  gap: var(--spacing-sm);
}

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

.owner-name {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.owner-email {
  margin-left: var(--spacing-xs);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.related-link {
  color: var(--color-primary);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  transition: var(--transition-base);
}

.related-link:hover {
  color: var(--color-primary-hover);
  text-decoration: underline;
}

.related-link i {
  font-size: var(--font-size-xs);
}

.text-muted {
  color: var(--color-text-muted);
  font-style: italic;
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

.badge-danger {
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.permission-denied {
  padding: var(--spacing-lg);
  background-color: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  text-align: center;
}

.permission-denied i {
  font-size: var(--font-size-2xl);
  color: var(--color-danger);
  margin-bottom: var(--spacing-md);
}

/* Responsive */
@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .settings-actions {
    flex-direction: column;
  }
}
</style>
