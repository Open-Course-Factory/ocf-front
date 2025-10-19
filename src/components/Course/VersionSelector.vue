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

<template>
  <div class="version-selector">
    <div class="version-header">
      <label class="version-label">{{ t('courses.versionSelector') }}</label>
      <button
        v-if="canDeleteVersion"
        class="btn-delete-version"
        :disabled="isDeleting || versions.length <= 1"
        @click="handleDelete"
        :title="t('courses.deleteVersion')"
      >
        <i class="fas fa-trash"></i>
      </button>
    </div>

    <div class="version-select-wrapper">
      <select
        v-model="selectedVersionModel"
        class="version-select"
        :disabled="isLoading || versions.length === 0"
        @change="handleVersionChange"
      >
        <option v-if="versions.length === 0" disabled value="">
          {{ isLoading ? t('courses.loadingVersions') : t('courses.noVersionsAvailable') }}
        </option>
        <option
          v-for="version in versions"
          :key="version.id"
          :value="version.version"
        >
          {{ version.version }}
          {{ isLatestVersion(version) ? `(${t('courses.latestVersion')})` : '' }}
          - {{ formatDate(version.updated_at) }}
        </option>
      </select>
      <i v-if="isLoading" class="fas fa-spinner fa-spin loading-icon"></i>
    </div>

    <div v-if="error" class="version-error">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import type { Course } from '../../types/entities'

interface Props {
  versions: Course[]
  selectedVersion: string
  isLoading?: boolean
  error?: string
  canDelete?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  error: '',
  canDelete: true
})

const emit = defineEmits<{
  'update:selectedVersion': [version: string]
  'version-changed': [version: string]
  'delete-version': [courseId: string]
}>()

const { t } = useTranslations({
  en: {
    courses: {
      versionSelector: 'Version',
      latestVersion: 'Latest',
      deleteVersion: 'Delete this version',
      confirmDeleteVersion: 'Are you sure you want to delete version {version}?',
      loadingVersions: 'Loading versions...',
      noVersionsAvailable: 'No versions available',
      lastUpdated: 'Last updated'
    }
  },
  fr: {
    courses: {
      versionSelector: 'Version',
      latestVersion: 'Dernière',
      deleteVersion: 'Supprimer cette version',
      confirmDeleteVersion: 'Êtes-vous sûr de vouloir supprimer la version {version} ?',
      loadingVersions: 'Chargement des versions...',
      noVersionsAvailable: 'Aucune version disponible',
      lastUpdated: 'Dernière mise à jour'
    }
  }
})

const selectedVersionModel = ref(props.selectedVersion)
const isDeleting = ref(false)

// Watch for prop changes
watch(() => props.selectedVersion, (newValue) => {
  selectedVersionModel.value = newValue
})

const canDeleteVersion = computed(() => {
  return props.canDelete && props.versions.length > 1
})

const currentVersion = computed(() => {
  return props.versions.find(v => v.version === selectedVersionModel.value)
})

function isLatestVersion(version: Course): boolean {
  if (props.versions.length === 0) return false
  // The first version in the array is the latest (backend returns sorted by version desc)
  return props.versions[0].id === version.id
}

function formatDate(dateString?: string): string {
  if (!dateString) return ''

  try {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return dateString
  }
}

function handleVersionChange() {
  emit('update:selectedVersion', selectedVersionModel.value)
  emit('version-changed', selectedVersionModel.value)
}

async function handleDelete() {
  if (!currentVersion.value) return

  const confirmMessage = t('courses.confirmDeleteVersion')
    .replace('{version}', currentVersion.value.version)

  if (!confirm(confirmMessage)) return

  isDeleting.value = true
  try {
    emit('delete-version', currentVersion.value.id)
  } finally {
    isDeleting.value = false
  }
}
</script>

<style scoped>
.version-selector {
  margin-bottom: var(--spacing-md);
}

.version-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-xs);
}

.version-label {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.btn-delete-version {
  background: none;
  border: none;
  color: var(--color-danger);
  cursor: pointer;
  padding: var(--spacing-xs);
  border-radius: var(--border-radius-sm);
  transition: all 0.2s ease;
}

.btn-delete-version:hover:not(:disabled) {
  background: var(--color-danger-light);
  color: var(--color-danger-dark);
}

.btn-delete-version:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.version-select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.version-select {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  border: var(--border-width-thin) solid var(--color-border);
  border-radius: var(--border-radius-md);
  background: var(--color-background);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: all 0.2s ease;
}

.version-select:hover:not(:disabled) {
  border-color: var(--color-primary);
}

.version-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-alpha-20);
}

.version-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--color-background-secondary);
}

.loading-icon {
  position: absolute;
  right: var(--spacing-md);
  color: var(--color-primary);
  pointer-events: none;
}

.version-error {
  margin-top: var(--spacing-xs);
  padding: var(--spacing-sm);
  background: var(--color-danger-light);
  color: var(--color-danger-dark);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
}
</style>
