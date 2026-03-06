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
import { ref } from 'vue'
import { useClassGroupsStore } from '../../stores/classGroups'
import { useTranslations } from '../../composables/useTranslations'
import { withAsync } from '../../utils/asyncWrapper'
import { formatDate, formatDateTime } from '../../utils/formatters'
import type { ClassGroup } from '../../types'
import type { Organization } from '../../types/organization'
import type { User } from '../../services/domain/user'
import EntityModal from '../Modals/EntityModal.vue'

const props = defineProps<{
  group: ClassGroup
  subgroups: ClassGroup[]
  ownerUser: User | null
  groupOrganization: Organization | null
  canEditGroup: boolean
  memberCount: number
}>()

const emit = defineEmits<{
  (e: 'group-updated'): void
}>()

const groupStore = useClassGroupsStore()

const showCreateSubgroupModal = ref(false)
const isLoading = ref(false)
const error = ref('')

const { t } = useTranslations({
  en: {
    groupOverview: {
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
      addSubgroup: 'Add Subgroup',
      noDescription: 'No description provided'
    }
  },
  fr: {
    groupOverview: {
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
      maxMembers: 'Membres maximum',
      currentMembers: 'Membres actuels',
      noParentGroup: 'Aucun (groupe de niveau supérieur)',
      noSubGroups: 'Aucun sous-groupe',
      viewGroup: 'Voir',
      addSubgroup: 'Ajouter un Sous-groupe',
      noDescription: 'Aucune description fournie'
    }
  }
})

const handleCreateSubgroup = async (data: any) => {
  return await withAsync(
    { isLoading, error },
    async () => {
      if (!props.group) return

      data.parent_group_id = props.group.id

      await groupStore.createEntity('/class-groups', data)

      showCreateSubgroupModal.value = false
      emit('group-updated')
    },
    'groupOverview.groupCreateError'
  )
}
</script>

<template>
  <div class="overview-tab">
    <div class="info-grid">
      <div class="info-item">
        <label>{{ t('groupOverview.displayName') }}</label>
        <p>{{ group.display_name }}</p>
      </div>
      <div class="info-item">
        <label>{{ t('groupOverview.description') }}</label>
        <p>{{ group.description || t('groupOverview.noDescription') }}</p>
      </div>
      <div class="info-item">
        <label>{{ t('groupOverview.owner') }}</label>
        <p v-if="ownerUser">
          <span class="owner-name">{{ ownerUser.display_name || ownerUser.name }}</span>
          <span v-if="ownerUser.email" class="owner-email">({{ ownerUser.email }})</span>
        </p>
        <p v-else class="text-muted">{{ group.owner_user_id }}</p>
      </div>
      <div class="info-item">
        <label>{{ t('groupOverview.organization') }}</label>
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
        <p v-else-if="group.organization_id" class="text-muted">{{ group.organization_id }}</p>
        <p v-else class="text-muted">{{ t('groupOverview.noOrganization') }}</p>
      </div>
      <div class="info-item">
        <label>{{ t('groupOverview.parentGroup') }}</label>
        <p v-if="group.parentGroup || group.parent_group">
          <router-link
            :to="`/class-groups/${group.parentGroup?.id || group.parent_group?.id}`"
            class="parent-group-link"
          >
            {{ group.parentGroup?.display_name || group.parent_group?.display_name }}
            <i class="fas fa-external-link-alt"></i>
          </router-link>
        </p>
        <p v-else class="text-muted">{{ t('groupOverview.noParentGroup') }}</p>
      </div>
      <div class="info-item">
        <label>{{ t('groupOverview.maxMembers') }}</label>
        <p>{{ group.max_members }}</p>
      </div>
      <div class="info-item">
        <label>{{ t('groupOverview.currentMembers') }}</label>
        <p>{{ memberCount }}</p>
      </div>
      <div class="info-item">
        <label>{{ t('groupOverview.createdAt') }}</label>
        <p>{{ formatDateTime(group.created_at) }}</p>
      </div>
      <div class="info-item">
        <label>{{ t('groupOverview.updatedAt') }}</label>
        <p>{{ formatDateTime(group.updated_at) }}</p>
      </div>
      <div v-if="group.expires_at" class="info-item">
        <label>{{ t('groupOverview.expiresAt') }}</label>
        <p>{{ formatDate(group.expires_at) }}</p>
      </div>
    </div>

    <!-- Subgroups Section -->
    <div class="subgroups-section">
      <div class="subgroups-header">
        <h3>{{ t('groupOverview.subGroups') }}</h3>
        <button
          v-if="canEditGroup"
          @click="showCreateSubgroupModal = true"
          class="btn btn-primary btn-sm"
        >
          <i class="fas fa-plus"></i>
          {{ t('groupOverview.addSubgroup') }}
        </button>
      </div>
      <div v-if="subgroups.length > 0" class="subgroups-list">
        <div
          v-for="subgroup in subgroups"
          :key="subgroup.id"
          class="subgroup-card"
        >
          <div class="subgroup-info">
            <h4>{{ subgroup.display_name }}</h4>
            <p v-if="subgroup.description" class="subgroup-description">{{ subgroup.description }}</p>
          </div>
          <div class="subgroup-actions">
            <router-link :to="`/class-groups/${subgroup.id}`" class="btn btn-sm btn-primary">
              {{ t('groupOverview.viewGroup') }}
              <i class="fas fa-arrow-right"></i>
            </router-link>
          </div>
        </div>
      </div>
      <p v-else class="text-muted">{{ t('groupOverview.noSubGroups') }}</p>
    </div>

    <!-- Create Subgroup Modal -->
    <EntityModal
      :visible="showCreateSubgroupModal"
      :entity-store="groupStore"
      entity-name="class-groups"
      @submit="handleCreateSubgroup"
      @close="showCreateSubgroupModal = false"
    />
  </div>
</template>

<style scoped>
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
</style>
