<template>
  <div class="bulk-import-admin-page">
    <div class="page-header">
      <h1>
        <i class="fas fa-file-import"></i>
        {{ t('admin.bulkImportTitle') }}
      </h1>
      <p class="page-description">{{ t('admin.bulkImportDescription') }}</p>
    </div>

    <!-- Loading State -->
    <div v-if="organizationsStore.isLoading" class="loading-container">
      <div class="spinner">
        <i class="fas fa-spinner fa-spin fa-3x"></i>
      </div>
      <p>{{ t('admin.loadingOrganizations') }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="organizationsStore.error" class="error-container">
      <i class="fas fa-exclamation-circle fa-3x"></i>
      <p>{{ organizationsStore.error }}</p>
      <button class="btn btn-primary" @click="loadOrganizations">
        <i class="fas fa-redo"></i>
        {{ t('admin.retry') }}
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="organizations.length === 0" class="empty-state">
      <i class="fas fa-building fa-4x"></i>
      <h3>{{ t('admin.noOrganizations') }}</h3>
      <p>{{ t('admin.noOrganizationsDescription') }}</p>
    </div>

    <!-- Organizations Table -->
    <div v-else class="organizations-table-container">
      <div class="table-header">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('admin.searchOrganizations')"
            class="search-input"
          />
        </div>
        <div class="table-info">
          {{ t('admin.organizationsCount', { count: filteredOrganizations.length }) }}
        </div>
      </div>

      <table class="organizations-table">
        <thead>
          <tr>
            <th>{{ t('admin.organizationName') }}</th>
            <th>{{ t('admin.type') }}</th>
            <th>{{ t('admin.members') }}</th>
            <th>{{ t('admin.groups') }}</th>
            <th>{{ t('admin.status') }}</th>
            <th class="actions-column">{{ t('admin.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="org in filteredOrganizations" :key="org.id">
            <td>
              <div class="org-name-cell">
                <i :class="org.is_personal ? 'fas fa-user' : 'fas fa-building'"></i>
                <div class="org-info">
                  <div class="org-display-name">{{ org.display_name }}</div>
                  <div class="org-name">{{ org.name }}</div>
                </div>
              </div>
            </td>
            <td>
              <span class="badge" :class="org.is_personal ? 'badge-info' : 'badge-secondary'">
                {{ org.is_personal ? t('admin.personal') : t('admin.business') }}
              </span>
            </td>
            <td>
              <span class="count-badge">
                {{ org.member_count || 0 }} / {{ org.max_members || '∞' }}
              </span>
            </td>
            <td>
              <span class="count-badge">
                {{ org.group_count || 0 }} / {{ org.max_groups || '∞' }}
              </span>
            </td>
            <td>
              <span class="status-badge" :class="org.is_active ? 'status-active' : 'status-inactive'">
                {{ org.is_active ? t('admin.active') : t('admin.inactive') }}
              </span>
            </td>
            <td class="actions-cell">
              <button
                class="btn btn-primary btn-sm"
                @click="goToImport(org.id)"
                :title="t('admin.importTooltip')"
              >
                <i class="fas fa-file-import"></i>
                {{ t('admin.import') }}
              </button>
              <button
                class="btn btn-secondary btn-sm"
                @click="goToOrganization(org.id)"
                :title="t('admin.viewTooltip')"
              >
                <i class="fas fa-eye"></i>
                {{ t('admin.view') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useOrganizationsStore } from '../../../stores/organizations'
import { useTranslations } from '../../../composables/useTranslations'

const translations = {
  en: {
    admin: {
      bulkImportTitle: 'Bulk Import - Organizations',
      bulkImportDescription: 'Select an organization to import users and groups in bulk',
      loadingOrganizations: 'Loading organizations...',
      retry: 'Retry',
      noOrganizations: 'No Organizations Found',
      noOrganizationsDescription: 'There are no organizations in the system yet.',
      searchOrganizations: 'Search organizations...',
      organizationsCount: '{count} organizations',
      organizationName: 'Organization',
      type: 'Type',
      members: 'Members',
      groups: 'Groups',
      status: 'Status',
      actions: 'Actions',
      personal: 'Personal',
      business: 'Business',
      active: 'Active',
      inactive: 'Inactive',
      import: 'Import',
      importTooltip: 'Import users and groups',
      view: 'View',
      viewTooltip: 'View organization details'
    }
  },
  fr: {
    admin: {
      bulkImportTitle: 'Importation Groupée - Organisations',
      bulkImportDescription: 'Sélectionnez une organisation pour importer des utilisateurs et groupes en masse',
      loadingOrganizations: 'Chargement des organisations...',
      retry: 'Réessayer',
      noOrganizations: 'Aucune Organisation Trouvée',
      noOrganizationsDescription: 'Il n\'y a pas encore d\'organisations dans le système.',
      searchOrganizations: 'Rechercher des organisations...',
      organizationsCount: '{count} organisations',
      organizationName: 'Organisation',
      type: 'Type',
      members: 'Membres',
      groups: 'Groupes',
      status: 'Statut',
      actions: 'Actions',
      personal: 'Personnel',
      business: 'Entreprise',
      active: 'Actif',
      inactive: 'Inactif',
      import: 'Importer',
      importTooltip: 'Importer des utilisateurs et groupes',
      view: 'Voir',
      viewTooltip: 'Voir les détails de l\'organisation'
    }
  }
}

const { t } = useTranslations(translations)

const router = useRouter()
const organizationsStore = useOrganizationsStore()

const searchQuery = ref('')

const organizations = computed(() => organizationsStore.organizations)

const filteredOrganizations = computed(() => {
  if (!searchQuery.value) {
    return organizations.value
  }

  const query = searchQuery.value.toLowerCase()
  return organizations.value.filter(org =>
    org.display_name.toLowerCase().includes(query) ||
    org.name.toLowerCase().includes(query) ||
    (org.description && org.description.toLowerCase().includes(query))
  )
})

onMounted(async () => {
  await loadOrganizations()
})

async function loadOrganizations() {
  await organizationsStore.loadOrganizations()
}

function goToImport(organizationId: string) {
  router.push({ name: 'BulkImport', params: { id: organizationId } })
}

function goToOrganization(organizationId: string) {
  router.push({ name: 'OrganizationDetail', params: { id: organizationId } })
}
</script>

<style scoped>
.bulk-import-admin-page {
  padding: var(--spacing-xl);
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--spacing-xl);
}

.page-header h1 {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  font-size: var(--font-size-2xl);
}

.page-description {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
}

.loading-container,
.error-container,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  text-align: center;
}

.spinner {
  color: var(--color-primary);
  margin-bottom: var(--spacing-md);
}

.error-container {
  color: var(--color-danger);
}

.error-container i {
  margin-bottom: var(--spacing-md);
}

.empty-state i {
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-md);
}

.organizations-table-container {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border-medium);
}

.search-box {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex: 1;
  max-width: 400px;
}

.search-box i {
  color: var(--color-text-muted);
}

.search-input {
  flex: 1;
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--border-radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.table-info {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.organizations-table {
  width: 100%;
  border-collapse: collapse;
}

.organizations-table thead {
  background: var(--color-bg-tertiary);
}

.organizations-table th {
  padding: var(--spacing-md);
  text-align: left;
  font-weight: 600;
  color: var(--color-text-primary);
  border-bottom: 2px solid var(--color-border-medium);
  font-size: var(--font-size-sm);
}

.organizations-table td {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-border-light);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.organizations-table tbody tr:hover {
  background: var(--color-bg-secondary);
}

.org-name-cell {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.org-name-cell i {
  font-size: var(--font-size-lg);
  color: var(--color-primary);
}

.org-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.org-display-name {
  font-weight: 600;
  color: var(--color-text-primary);
}

.org-name {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-family: monospace;
}

.badge {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: 500;
  display: inline-block;
}

.badge-info {
  background: var(--color-info-bg);
  color: var(--color-info);
}

.badge-secondary {
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
}

.count-badge {
  font-family: monospace;
  color: var(--color-text-primary);
}

.status-badge {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: 500;
  display: inline-block;
}

.status-active {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.status-inactive {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

.actions-column {
  width: 200px;
}

.actions-cell {
  display: flex;
  gap: var(--spacing-sm);
}

.btn {
  padding: var(--spacing-xs) var(--spacing-sm);
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-xs);
  font-weight: 500;
  transition: opacity 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.btn:hover {
  opacity: 0.8;
}

.btn-sm {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-white);
}

.btn-secondary {
  background: var(--color-secondary);
  color: var(--color-white);
}
</style>
