<template>
  <div class="groups-manager">
    <!-- Header with Info -->
    <div class="groups-header">
      <div class="header-info">
        <h3>
          <i class="fas fa-layer-group"></i>
          {{ t('groups.title') }}
        </h3>
        <p class="group-count">
          {{ groups.length }} {{ groups.length === 1 ? t('groups.group') : t('groups.groups') }}
          <span v-if="maxGroups" class="max-groups">/ {{ maxGroups }} {{ t('groups.max') }}</span>
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <i class="fas fa-spinner fa-spin fa-2x"></i>
      <p>{{ t('groups.loading') }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <i class="fas fa-exclamation-circle"></i>
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="loadGroups">
        <i class="fas fa-redo"></i>
        {{ t('groups.retry') }}
      </button>
    </div>

    <!-- Groups List -->
    <div v-else-if="groups.length > 0" class="groups-list">
      <div
        v-for="group in sortedGroups"
        :key="group.id"
        :class="['group-card', { 'is-child': group.parent_group_id }]"
      >
        <div class="group-info">
          <div class="group-icon">
            <i :class="group.parent_group_id ? 'fas fa-folder' : 'fas fa-folder-open'"></i>
          </div>
          <div class="group-details">
            <div class="group-name">
              {{ group.display_name }}
              <span v-if="group.parent_group" class="parent-badge">
                <i class="fas fa-level-up-alt"></i>
                {{ group.parent_group.display_name }}
              </span>
            </div>
            <div v-if="group.description" class="group-description">
              {{ group.description }}
            </div>
            <div class="group-meta">
              <span class="member-count">
                <i class="fas fa-users"></i>
                {{ group.member_count }}
                <span v-if="group.max_members">/ {{ group.max_members }}</span>
                {{ group.member_count === 1 ? t('groups.member') : t('groups.members') }}
              </span>
              <span v-if="group.expires_at" class="expiry-date" :class="{ 'is-expired': isExpired(group.expires_at) }">
                <i class="fas fa-calendar-times"></i>
                {{ isExpired(group.expires_at) ? t('groups.expired') : t('groups.expires') }}: {{ formatDate(group.expires_at) }}
              </span>
              <span v-if="group.external_id" class="external-id">
                <i class="fas fa-tag"></i>
                {{ group.external_id }}
              </span>
            </div>
          </div>
        </div>

        <div class="group-actions">
          <span
            v-if="!group.is_active"
            class="status-badge inactive"
          >
            {{ t('groups.inactive') }}
          </span>
          <span
            v-else-if="isExpired(group.expires_at)"
            class="status-badge expired"
          >
            {{ t('groups.expired') }}
          </span>
          <span
            v-else-if="group.max_members && group.member_count >= group.max_members"
            class="status-badge full"
          >
            {{ t('groups.full') }}
          </span>
          <span
            v-else
            class="status-badge active"
          >
            {{ t('groups.active') }}
          </span>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <i class="fas fa-layer-group fa-3x"></i>
      <h4>{{ t('groups.noGroups') }}</h4>
      <p>{{ t('groups.noGroupsDesc') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { useTranslations } from '../../composables/useTranslations'
import type { OrganizationGroup } from '../../types'

interface Props {
  organizationId: string
  canManage: boolean
  maxGroups?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxGroups: 20
})

const { t } = useTranslations({
  en: {
    groups: {
      title: 'Groups',
      group: 'group',
      groups: 'groups',
      max: 'max',
      loading: 'Loading groups...',
      retry: 'Retry',
      member: 'member',
      members: 'members',
      expires: 'Expires',
      expired: 'Expired',
      noGroups: 'No groups yet',
      noGroupsDesc: 'Groups can be created via bulk import',
      active: 'Active',
      inactive: 'Inactive',
      full: 'Full'
    }
  },
  fr: {
    groups: {
      title: 'Groupes',
      group: 'groupe',
      groups: 'groupes',
      max: 'max',
      loading: 'Chargement des groupes...',
      retry: 'Réessayer',
      member: 'membre',
      members: 'membres',
      expires: 'Expire',
      expired: 'Expiré',
      noGroups: 'Aucun groupe',
      noGroupsDesc: 'Les groupes peuvent être créés via l\'importation groupée',
      active: 'Actif',
      inactive: 'Inactif',
      full: 'Complet'
    }
  }
})

const groups = ref<OrganizationGroup[]>([])
const isLoading = ref(false)
const error = ref('')

onMounted(() => {
  loadGroups()
})

const loadGroups = async () => {
  isLoading.value = true
  error.value = ''
  try {
    const response = await axios.get(`/organizations/${props.organizationId}/groups`, {
      params: { include: 'parent_group' }
    })
    groups.value = response.data
  } catch (err: any) {
    error.value = err.response?.data?.error_message || err.message || 'Failed to load groups'
  } finally {
    isLoading.value = false
  }
}

// Sort groups: parent groups first, then children
const sortedGroups = computed(() => {
  const sorted = [...groups.value]
  return sorted.sort((a, b) => {
    // Parent groups (no parent_group_id) come first
    if (!a.parent_group_id && b.parent_group_id) return -1
    if (a.parent_group_id && !b.parent_group_id) return 1

    // Within same level, sort by display_name
    return a.display_name.localeCompare(b.display_name)
  })
})

const isExpired = (expiresAt?: string): boolean => {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString()
}
</script>

<style scoped>
.groups-manager {
  width: 100%;
}

.groups-header {
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

.group-count {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.max-groups {
  color: var(--color-text-tertiary);
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
  margin: 0;
}

.groups-list {
  display: grid;
  gap: 1rem;
}

.group-card {
  background: var(--color-bg-secondary);
  border-radius: 8px;
  padding: 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: box-shadow 0.2s ease;
}

.group-card.is-child {
  margin-left: 2rem;
  background: var(--color-bg-tertiary);
}

.group-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.group-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.group-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.group-details {
  flex: 1;
}

.group-name {
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.parent-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: var(--color-info-bg);
  color: var(--color-info);
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 4px;
}

.parent-badge i {
  font-size: 0.7rem;
}

.group-description {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.group-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
}

.group-meta > span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.group-meta i {
  font-size: 0.7rem;
}

.member-count {
  color: var(--color-text-secondary);
  font-weight: 500;
}

.expiry-date {
  color: var(--color-text-secondary);
}

.expiry-date.is-expired {
  color: var(--color-danger);
  font-weight: 500;
}

.external-id {
  color: var(--color-text-tertiary);
  font-family: monospace;
  font-size: 0.7rem;
}

.group-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-badge.active {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.status-badge.inactive {
  background: var(--color-bg-tertiary);
  color: var(--color-text-tertiary);
}

.status-badge.expired {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

.status-badge.full {
  background: var(--color-warning-bg);
  color: var(--color-warning);
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

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}
</style>
