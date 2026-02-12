<template>
  <div class="overview-grid">
    <div class="info-card">
      <h3>
        <i class="fas fa-info-circle"></i>
        {{ t('overview.information') }}
      </h3>
      <div class="info-row">
        <span class="label">{{ t('overview.name') }}:</span>
        <span class="value">{{ organization.name }}</span>
      </div>
      <div class="info-row">
        <span class="label">{{ t('overview.displayName') }}:</span>
        <span class="value">{{ organization.display_name }}</span>
      </div>
      <div class="info-row">
        <span class="label">{{ t('overview.type') }}:</span>
        <span class="value">
          {{ organization.is_personal ? t('overview.personal') : t('overview.business') }}
        </span>
      </div>
      <div class="info-row">
        <span class="label">{{ t('overview.status') }}:</span>
        <span :class="['value', organization.is_active ? 'text-success' : 'text-danger']">
          {{ organization.is_active ? t('overview.active') : t('overview.inactive') }}
        </span>
      </div>
    </div>

    <div class="info-card">
      <h3>
        <i class="fas fa-chart-bar"></i>
        {{ t('overview.limits') }}
      </h3>
      <div class="info-row">
        <span class="label">{{ t('overview.maxGroups') }}:</span>
        <span class="value">{{ organization.max_groups }}</span>
      </div>
      <div class="info-row">
        <span class="label">{{ t('overview.maxMembers') }}:</span>
        <span class="value">{{ organization.max_members }}</span>
      </div>
      <div class="info-row">
        <span class="label">{{ t('overview.currentGroups') }}:</span>
        <span class="value">{{ organization.group_count || 0 }}</span>
      </div>
      <div class="info-row">
        <span class="label">{{ t('overview.currentMembers') }}:</span>
        <span class="value">{{ organization.member_count || 0 }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTranslations } from '../../composables/useTranslations'
import type { Organization } from '../../types'

defineProps<{
  organization: Organization
}>()

const { t } = useTranslations({
  en: {
    overview: {
      information: 'Information',
      name: 'Name',
      displayName: 'Display Name',
      type: 'Type',
      personal: 'Personal',
      business: 'Business',
      status: 'Status',
      active: 'Active',
      inactive: 'Inactive',
      limits: 'Limits',
      maxGroups: 'Max Groups',
      maxMembers: 'Max Members',
      currentGroups: 'Current Groups',
      currentMembers: 'Current Members',
    }
  },
  fr: {
    overview: {
      information: 'Informations',
      name: 'Nom',
      displayName: 'Nom d\'affichage',
      type: 'Type',
      personal: 'Personnel',
      business: 'Entreprise',
      status: 'Statut',
      active: 'Actif',
      inactive: 'Inactif',
      limits: 'Limites',
      maxGroups: 'Groupes max',
      maxMembers: 'Membres max',
      currentGroups: 'Groupes actuels',
      currentMembers: 'Membres actuels',
    }
  }
})
</script>

<style scoped>
.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
}

.info-card {
  background: var(--color-bg-secondary);
  border-radius: 8px;
  padding: 1.5rem;
}

.info-card h3 {
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-border);
}

.info-row:last-child {
  border-bottom: none;
}

.label {
  font-weight: 500;
  color: var(--color-text-secondary);
}

.value {
  font-weight: 600;
  color: var(--color-text-primary);
}

.text-success {
  color: var(--color-success);
}

.text-danger {
  color: var(--color-danger);
}
</style>
