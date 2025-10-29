<template>
  <div class="organization-card">
    <div class="organization-header">
      <div class="organization-icon">
        <i :class="organization.is_personal ? 'fas fa-user' : 'fas fa-building'"></i>
      </div>
      <div class="organization-info">
        <div class="organization-title-row">
          <h4>{{ organization.display_name }}</h4>
          <span v-if="organization.is_personal" class="badge badge-info">
            <i class="fas fa-user"></i>
            {{ t('organizations.personal') }}
          </span>
        </div>
        <p v-if="organization.description" class="organization-description">
          {{ organization.description }}
        </p>
      </div>
    </div>

    <div class="organization-stats">
      <div class="stat-item">
        <i class="fas fa-users"></i>
        <div class="stat-content">
          <span class="stat-value">{{ organization.member_count || 0 }}</span>
          <span class="stat-label">{{ t('organizations.members') }}</span>
        </div>
      </div>
      <div class="stat-item">
        <i class="fas fa-layer-group"></i>
        <div class="stat-content">
          <span class="stat-value">{{ organization.group_count || 0 }}</span>
          <span class="stat-label">{{ t('organizations.groups') }}</span>
        </div>
      </div>
      <div class="stat-item">
        <i :class="getStatusIcon(hasSubscription)"></i>
        <div class="stat-content">
          <span class="stat-value">{{ hasSubscription ? t('organizations.subscribed') : t('organizations.free') }}</span>
          <span class="stat-label">{{ t('organizations.subscription') }}</span>
        </div>
      </div>
    </div>

    <div class="organization-actions">
      <button
        v-if="canManage"
        class="btn btn-secondary"
        @click="$emit('bulkImport', organization.id)"
        :title="t('organizations.bulkImport')"
      >
        <i class="fas fa-file-import"></i>
        {{ t('organizations.import') }}
      </button>
      <button
        v-if="canManage"
        class="btn btn-primary"
        @click="$emit('manage', organization.id)"
      >
        <i class="fas fa-cog"></i>
        {{ t('organizations.manage') }}
      </button>
      <button
        class="btn btn-outline-primary"
        @click="$emit('view', organization.id)"
      >
        <i class="fas fa-eye"></i>
        {{ t('organizations.view') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">

import { useTranslations } from '../../composables/useTranslations'
import type { Organization } from '../../types'

interface Props {
  organization: Organization
  canManage?: boolean
  hasSubscription?: boolean
}

withDefaults(defineProps<Props>(), {
  canManage: false,
  hasSubscription: false
})

const emit = defineEmits<{
  (e: 'bulkImport', id: string): void
  (e: 'manage', id: string): void
  (e: 'view', id: string): void
}>()

const { t } = useTranslations({
  en: {
    organizations: {
      personal: 'Personal',
      members: 'Members',
      groups: 'Groups',
      subscription: 'Subscription',
      subscribed: 'Active',
      free: 'Free',
      import: 'Import',
      bulkImport: 'Bulk Import Users & Groups',
      manage: 'Manage',
      view: 'View',
    }
  },
  fr: {
    organizations: {
      personal: 'Personnel',
      members: 'Membres',
      groups: 'Groupes',
      subscription: 'Abonnement',
      subscribed: 'Actif',
      free: 'Gratuit',
      import: 'Importer',
      bulkImport: 'Importation groupée d\'utilisateurs et groupes',
      manage: 'Gérer',
      view: 'Voir',
    }
  }
})

const getStatusIcon = (hasSubscription: boolean) => {
  return hasSubscription ? 'fas fa-check-circle text-success' : 'fas fa-circle text-muted'
}
</script>

<style scoped>
.organization-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.organization-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--color-primary);
}

.organization-header {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.organization-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-radius: 8px;
  font-size: 1.5rem;
}

.organization-info {
  flex: 1;
}

.organization-title-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.organization-title-row h4 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge-info {
  background: var(--color-info-light);
  color: var(--color-info);
}

.organization-description {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.organization-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--color-bg-secondary);
  border-radius: 6px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.stat-item i {
  font-size: 1.5rem;
  color: var(--color-primary);
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
}

.organization-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn {
  padding: 0.5rem 1rem;
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

.btn-outline-primary {
  background: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
}

.btn-outline-primary:hover {
  background: var(--color-primary-light);
}

.text-success {
  color: var(--color-success);
}

.text-muted {
  color: var(--color-text-tertiary);
}
</style>
