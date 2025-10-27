<template>
  <div class="organizations-list">
    <div class="list-header">
      <h2>
        <i class="fas fa-building"></i>
        {{ t('organizations.title') }}
      </h2>
      <button class="btn btn-primary" @click="$emit('create')">
        <i class="fas fa-plus"></i>
        {{ t('organizations.createNew') }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-container">
      <div class="spinner">
        <i class="fas fa-spinner fa-spin fa-3x"></i>
      </div>
      <p>{{ t('organizations.loading') }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <i class="fas fa-exclamation-circle fa-3x"></i>
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="$emit('reload')">
        <i class="fas fa-redo"></i>
        {{ t('organizations.retry') }}
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="!organizations || organizations.length === 0" class="empty-state">
      <i class="fas fa-building fa-4x"></i>
      <h3>{{ t('organizations.noOrganizations') }}</h3>
      <p>{{ t('organizations.createFirstOrganization') }}</p>
      <button class="btn btn-primary btn-lg" @click="$emit('create')">
        <i class="fas fa-plus"></i>
        {{ t('organizations.createNew') }}
      </button>
    </div>

    <!-- Organizations Grid -->
    <div v-else class="organizations-grid">
      <OrganizationCard
        v-for="org in organizations"
        :key="org.id"
        :organization="org"
        :can-manage="canManageOrganization(org.id)"
        :has-subscription="!!org.subscription_plan_id"
        @manage="$emit('manage', $event)"
        @view="$emit('view', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTranslations } from '../../composables/useTranslations'
import OrganizationCard from './OrganizationCard.vue'
import type { Organization } from '../../types'

interface Props {
  organizations?: Organization[]
  isLoading?: boolean
  error?: string
  canManageOrganization: (id: string) => boolean
}

withDefaults(defineProps<Props>(), {
  organizations: () => [],
  isLoading: false,
  error: ''
})

const emit = defineEmits<{
  (e: 'create'): void
  (e: 'manage', id: string): void
  (e: 'view', id: string): void
  (e: 'reload'): void
}>()

const { t } = useTranslations({
  en: {
    organizations: {
      title: 'Organizations',
      createNew: 'Create Organization',
      loading: 'Loading organizations...',
      retry: 'Retry',
      noOrganizations: 'No Organizations',
      createFirstOrganization: 'Create your first organization to get started',
    }
  },
  fr: {
    organizations: {
      title: 'Organisations',
      createNew: 'Créer une organisation',
      loading: 'Chargement des organisations...',
      retry: 'Réessayer',
      noOrganizations: 'Aucune organisation',
      createFirstOrganization: 'Créez votre première organisation pour commencer',
    }
  }
})
</script>

<style scoped>
.organizations-list {
  padding: 2rem;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.list-header h2 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.loading-container,
.error-container,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.loading-container .spinner {
  color: var(--color-primary);
  margin-bottom: 1rem;
}

.error-container {
  color: var(--color-danger);
}

.error-container i {
  margin-bottom: 1rem;
}

.empty-state {
  color: var(--color-text-secondary);
}

.empty-state i {
  color: var(--color-text-tertiary);
  margin-bottom: 1.5rem;
}

.empty-state h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: var(--color-text-primary);
}

.empty-state p {
  font-size: 1rem;
  margin-bottom: 2rem;
}

.organizations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
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

.btn-lg {
  padding: 0.75rem 1.5rem;
  font-size: 1.125rem;
}
</style>
