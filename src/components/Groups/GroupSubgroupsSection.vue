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
import { useClassGroupsStore } from '../../stores/classGroups'
import { useTranslations } from '../../composables/useTranslations'
import { withAsync } from '../../utils/asyncWrapper'
import { CLASS_PAGE_NAMES } from '../../router/classPages'
import type { ClassGroup } from '../../types'
import EntityModal from '../Modals/EntityModal.vue'

const props = defineProps<{
  group: ClassGroup
  subgroups: ClassGroup[]
  canEditGroup: boolean
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
    groupSubgroups: {
      subGroups: 'Subgroups',
      noSubGroups: 'No subgroups',
      viewGroup: 'View',
      addSubgroup: 'Add Subgroup',
      groupCreateError: 'Failed to create the subgroup'
    }
  },
  fr: {
    groupSubgroups: {
      subGroups: 'Sous-groupes',
      noSubGroups: 'Aucun sous-groupe',
      viewGroup: 'Voir',
      addSubgroup: 'Ajouter un sous-groupe',
      groupCreateError: 'Échec de la création du sous-groupe'
    }
  }
})

const handleCreateSubgroup = async (data: any) => {
  return await withAsync(
    { isLoading, error },
    async () => {
      data.parent_group_id = props.group.id

      await groupStore.createEntity('/class-groups', data)

      showCreateSubgroupModal.value = false
      emit('group-updated')
    },
    'groupSubgroups.groupCreateError'
  )
}
</script>

<template>
  <div class="subgroups-section">
    <div class="subgroups-header">
      <h3>{{ t('groupSubgroups.subGroups') }}</h3>
      <button
        v-if="canEditGroup"
        @click="showCreateSubgroupModal = true"
        class="btn btn-primary btn-sm"
      >
        <i class="fas fa-plus"></i>
        {{ t('groupSubgroups.addSubgroup') }}
      </button>
    </div>

    <div v-if="subgroups.length > 0" class="subgroups-list">
      <div v-for="subgroup in subgroups" :key="subgroup.id" class="subgroup-card">
        <div class="subgroup-info">
          <h4>{{ subgroup.display_name }}</h4>
          <p v-if="subgroup.description" class="subgroup-description">{{ subgroup.description }}</p>
        </div>
        <div class="subgroup-actions">
          <router-link
            :to="{ name: CLASS_PAGE_NAMES.live, params: { id: subgroup.id } }"
            class="btn btn-sm btn-primary"
          >
            {{ t('groupSubgroups.viewGroup') }}
            <i class="fas fa-arrow-right"></i>
          </router-link>
        </div>
      </div>
    </div>
    <p v-else class="text-muted">{{ t('groupSubgroups.noSubGroups') }}</p>

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
.subgroups-section {
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: var(--border-width-thin) solid var(--color-border-light);
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
  border: var(--border-width-thin) solid var(--color-border-light);
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

.text-muted {
  color: var(--color-text-muted);
  font-style: italic;
}

@media (max-width: 768px) {
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
