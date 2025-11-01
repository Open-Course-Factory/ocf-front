<template>
  <div :class="['organization-card', organization.is_personal ? 'card-personal' : 'card-team']">
    <div class="organization-header">
      <div :class="['organization-icon', organization.is_personal ? 'icon-personal' : 'icon-team']">
        <i :class="organization.is_personal ? 'fas fa-user' : 'fas fa-building'"></i>
      </div>
      <div class="organization-info">
        <div class="organization-title-row">
          <h4>{{ organization.display_name }}</h4>
          <span :class="['org-type-badge', organization.is_personal ? 'badge-personal' : 'badge-team']">
            <i :class="organization.is_personal ? 'fas fa-user' : 'fas fa-users'"></i>
            {{ organization.is_personal ? t('organizations.personal') : t('organizations.team') }}
          </span>
        </div>
        <p v-if="organization.description" class="organization-description">
          {{ organization.description }}
        </p>
        <div class="org-type-info">
          <i class="fas fa-info-circle"></i>
          <span>{{ organization.is_personal ? t('organizations.personalInfo') : t('organizations.teamInfo') }}</span>
        </div>
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
      team: 'Team',
      members: 'Members',
      groups: 'Groups',
      subscription: 'Subscription',
      subscribed: 'Active',
      free: 'Free',
      import: 'Import',
      bulkImport: 'Bulk Import Users & Groups',
      manage: 'Manage',
      view: 'View',
      personalInfo: '1 member only',
      teamInfo: 'Collaboration enabled',
    }
  },
  fr: {
    organizations: {
      personal: 'Personnel',
      team: 'Équipe',
      members: 'Membres',
      groups: 'Groupes',
      subscription: 'Abonnement',
      subscribed: 'Actif',
      free: 'Gratuit',
      import: 'Importer',
      bulkImport: 'Importation groupée d\'utilisateurs et groupes',
      manage: 'Gérer',
      view: 'Voir',
      personalInfo: '1 membre seulement',
      teamInfo: 'Collaboration activée',
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
  border: 2px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.organization-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  transition: background 0.3s ease;
}

.card-personal::before {
  background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
}

.card-team::before {
  background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
}

.organization-card:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.card-personal:hover {
  border-color: #3b82f6;
}

.card-team:hover {
  border-color: #10b981;
}

.organization-header {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.organization-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 1.75rem;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.icon-personal {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(96, 165, 250, 0.15) 100%);
  color: #3b82f6;
}

.icon-team {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(52, 211, 153, 0.15) 100%);
  color: #10b981;
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

.org-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.badge-personal {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(96, 165, 250, 0.2) 100%);
  color: #2563eb;
  border: 1.5px solid rgba(59, 130, 246, 0.3);
}

.badge-team {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(52, 211, 153, 0.2) 100%);
  color: #059669;
  border: 1.5px solid rgba(16, 185, 129, 0.3);
}

.org-type-badge i {
  font-size: 0.8125rem;
}

.org-type-info {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  font-style: italic;
}

.org-type-info i {
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
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
