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
import { formatDate } from '../../utils/formatters'
import type { ClassGroup } from '../../types'
import BaseModal from '../Modals/BaseModal.vue'
import EntityModal from '../Modals/EntityModal.vue'

const props = defineProps<{
  group: ClassGroup
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
      expiresAt: 'Expires',
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
      expiresAt: 'Expire',
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
      router.push('/class-groups')
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
