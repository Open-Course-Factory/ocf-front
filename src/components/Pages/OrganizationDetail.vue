<template>
  <div class="organization-detail-page">
    <!-- Loading State (Initial Load Only) -->
    <div v-if="isInitialLoading" class="loading-container">
      <div class="spinner">
        <i class="fas fa-spinner fa-spin fa-3x"></i>
      </div>
      <p>{{ t('organizations.loading') }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <i class="fas fa-exclamation-circle fa-3x"></i>
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="loadOrganization(true)">
        <i class="fas fa-redo"></i>
        {{ t('organizations.retry') }}
      </button>
    </div>

    <!-- Not Found State -->
    <div v-else-if="!isInitialLoading && !organization" class="error-container">
      <i class="fas fa-exclamation-circle fa-3x"></i>
      <p>{{ t('organizations.notFound') }}</p>
      <button class="btn btn-primary" @click="goBack">
        <i class="fas fa-arrow-left"></i>
        {{ t('organizations.back') }}
      </button>
    </div>

    <!-- Organization Content -->
    <div v-else-if="organization" class="organization-content">
      <!-- Header -->
      <div class="organization-header">
        <div class="header-content">
          <div class="organization-icon-large">
            <i :class="organization.is_personal ? 'fas fa-user' : 'fas fa-building'"></i>
          </div>
          <div class="organization-info">
            <div class="title-row">
              <h1>
                {{ organization.display_name }}
                <i v-if="isRefreshing" class="fas fa-spinner fa-spin refresh-spinner" title="Refreshing..."></i>
              </h1>
              <span v-if="organization.is_personal" class="badge badge-info">
                <i class="fas fa-user"></i>
                {{ t('organizations.personal') }}
              </span>
            </div>
            <p v-if="organization.description" class="description">{{ organization.description }}</p>
            <div class="quick-stats">
              <span class="stat">
                <i class="fas fa-users"></i>
                {{ organization.member_count || 0 }} {{ t('organizations.members') }}
              </span>
              <span class="stat">
                <i class="fas fa-layer-group"></i>
                {{ organization.group_count || 0 }} {{ t('organizations.groups') }}
              </span>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button
            v-if="canManage"
            class="btn btn-primary"
            @click="goToBulkImport"
          >
            <i class="fas fa-file-import"></i>
            {{ t('organizations.bulkImport') }}
          </button>
          <button
            v-if="canManage"
            class="btn btn-outline-primary"
            @click="openEditModal"
          >
            <i class="fas fa-edit"></i>
            {{ t('organizations.edit') }}
          </button>
          <button class="btn btn-outline-secondary" @click="goBack">
            <i class="fas fa-arrow-left"></i>
            {{ t('organizations.back') }}
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs-container">
        <div class="tabs-header">
          <button
            :class="['tab', { active: activeTab === 'overview' }]"
            @click="changeTab('overview')"
          >
            <i class="fas fa-info-circle"></i>
            {{ t('organizations.overview') }}
          </button>
          <button
            :class="['tab', { active: activeTab === 'members' }]"
            @click="changeTab('members')"
          >
            <i class="fas fa-users"></i>
            {{ t('organizations.members') }}
          </button>
          <button
            :class="['tab', { active: activeTab === 'groups' }]"
            @click="changeTab('groups')"
          >
            <i class="fas fa-layer-group"></i>
            {{ t('organizations.groups') }}
          </button>
          <button
            :class="['tab', { active: activeTab === 'subscription' }]"
            @click="changeTab('subscription')"
          >
            <i class="fas fa-credit-card"></i>
            {{ t('organizations.subscription') }}
          </button>
          <button
            v-if="canManage"
            :class="['tab', { active: activeTab === 'settings' }]"
            @click="changeTab('settings')"
          >
            <i class="fas fa-cog"></i>
            {{ t('organizations.settings') }}
          </button>
        </div>

        <div class="tabs-content">
          <!-- Overview Tab -->
          <div v-if="activeTab === 'overview'" class="tab-panel">
            <div class="overview-grid">
              <div class="info-card">
                <h3>
                  <i class="fas fa-info-circle"></i>
                  {{ t('organizations.information') }}
                </h3>
                <div class="info-row">
                  <span class="label">{{ t('organizations.name') }}:</span>
                  <span class="value">{{ organization.name }}</span>
                </div>
                <div class="info-row">
                  <span class="label">{{ t('organizations.displayName') }}:</span>
                  <span class="value">{{ organization.display_name }}</span>
                </div>
                <div class="info-row">
                  <span class="label">{{ t('organizations.type') }}:</span>
                  <span class="value">
                    {{ organization.is_personal ? t('organizations.personal') : t('organizations.business') }}
                  </span>
                </div>
                <div class="info-row">
                  <span class="label">{{ t('organizations.status') }}:</span>
                  <span :class="['value', organization.is_active ? 'text-success' : 'text-danger']">
                    {{ organization.is_active ? t('organizations.active') : t('organizations.inactive') }}
                  </span>
                </div>
              </div>

              <div class="info-card">
                <h3>
                  <i class="fas fa-chart-bar"></i>
                  {{ t('organizations.limits') }}
                </h3>
                <div class="info-row">
                  <span class="label">{{ t('organizations.maxGroups') }}:</span>
                  <span class="value">{{ organization.max_groups }}</span>
                </div>
                <div class="info-row">
                  <span class="label">{{ t('organizations.maxMembers') }}:</span>
                  <span class="value">{{ organization.max_members }}</span>
                </div>
                <div class="info-row">
                  <span class="label">{{ t('organizations.currentGroups') }}:</span>
                  <span class="value">{{ organization.group_count || 0 }}</span>
                </div>
                <div class="info-row">
                  <span class="label">{{ t('organizations.currentMembers') }}:</span>
                  <span class="value">{{ organization.member_count || 0 }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Members Tab -->
          <div v-if="activeTab === 'members'" class="tab-panel">
            <OrganizationMembersManager
              :organization-id="organizationId"
              :can-manage="canManage"
              :max-members="organization?.max_members || 100"
            />
          </div>

          <!-- Groups Tab -->
          <div v-if="activeTab === 'groups'" class="tab-panel">
            <OrganizationGroupsManager
              :organization-id="organizationId"
              :can-manage="canManage"
              :max-groups="organization?.max_groups || 20"
            />
          </div>

          <!-- Subscription Tab -->
          <div v-if="activeTab === 'subscription'" class="tab-panel">
            <OrganizationSubscriptionManager
              :organization-id="organizationId"
              :can-manage="canManage"
            />
          </div>

          <!-- Settings Tab -->
          <div v-if="activeTab === 'settings' && canManage" class="tab-panel">
            <div class="settings-card">
              <h3>
                <i class="fas fa-cog"></i>
                {{ t('organizations.organizationSettings') }}
              </h3>
              <div class="danger-zone">
                <h4>{{ t('organizations.dangerZone') }}</h4>
                <p>{{ t('organizations.deleteWarning') }}</p>
                <button class="btn btn-danger" @click="confirmDelete">
                  <i class="fas fa-trash"></i>
                  {{ t('organizations.deleteOrganization') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <OrganizationModal
      :is-open="isEditModalOpen"
      :organization="organization"
      :is-submitting="isSubmitting"
      :error="modalError"
      @close="closeEditModal"
      @submit="handleEdit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  OrganizationModal,
  OrganizationMembersManager,
  OrganizationGroupsManager,
  OrganizationSubscriptionManager
} from '../Organizations'
import { useOrganizationsStore } from '../../stores/organizations'
import { usePermissionsStore } from '../../stores/permissions'
import { useTranslations } from '../../composables/useTranslations'
import type { Organization, UpdateOrganizationRequest } from '../../types'

const route = useRoute()
const router = useRouter()
const organizationsStore = useOrganizationsStore()
const permissionsStore = usePermissionsStore()

const isInitialLoading = ref(true) // Initial page load
const isRefreshing = ref(false) // Refreshing data (don't show full screen loader)
const error = ref('')
const organization = ref<Organization | null>(null) // Store loaded organization locally
const activeTab = ref((route.query.tab as string) || 'overview')
const isEditModalOpen = ref(false)
const isSubmitting = ref(false)
const modalError = ref('')

const { t } = useTranslations({
  en: {
    organizations: {
      loading: 'Loading organization...',
      retry: 'Retry',
      personal: 'Personal',
      business: 'Business',
      members: 'Members',
      groups: 'Groups',
      bulkImport: 'Bulk Import',
      edit: 'Edit',
      back: 'Back',
      overview: 'Overview',
      subscription: 'Subscription',
      settings: 'Settings',
      information: 'Information',
      name: 'Name',
      displayName: 'Display Name',
      type: 'Type',
      status: 'Status',
      active: 'Active',
      inactive: 'Inactive',
      limits: 'Limits',
      maxGroups: 'Max Groups',
      maxMembers: 'Max Members',
      currentGroups: 'Current Groups',
      currentMembers: 'Current Members',
      organizationSettings: 'Organization Settings',
      dangerZone: 'Danger Zone',
      deleteWarning: 'Deleting an organization is permanent and cannot be undone.',
      deleteOrganization: 'Delete Organization',
      notFound: 'Organization not found',
    }
  },
  fr: {
    organizations: {
      loading: 'Chargement de l\'organisation...',
      retry: 'Réessayer',
      personal: 'Personnel',
      business: 'Entreprise',
      members: 'Membres',
      groups: 'Groupes',
      bulkImport: 'Importation groupée',
      edit: 'Modifier',
      back: 'Retour',
      overview: 'Aperçu',
      subscription: 'Abonnement',
      settings: 'Paramètres',
      information: 'Informations',
      name: 'Nom',
      displayName: 'Nom d\'affichage',
      type: 'Type',
      status: 'Statut',
      active: 'Actif',
      inactive: 'Inactif',
      limits: 'Limites',
      maxGroups: 'Groupes max',
      maxMembers: 'Membres max',
      currentGroups: 'Groupes actuels',
      currentMembers: 'Membres actuels',
      organizationSettings: 'Paramètres de l\'organisation',
      dangerZone: 'Zone dangereuse',
      deleteWarning: 'La suppression d\'une organisation est permanente et ne peut pas être annulée.',
      deleteOrganization: 'Supprimer l\'organisation',
      notFound: 'Organisation introuvable',
    }
  }
})

const organizationId = computed(() => route.params.id as string)
const canManage = computed(() => permissionsStore.canManageOrganization(organizationId.value))

onMounted(async () => {
  await Promise.all([
    loadOrganization(true), // Initial load
    permissionsStore.loadCurrentUser()
  ])
})

const loadOrganization = async (isInitial = false) => {
  if (isInitial) {
    isInitialLoading.value = true
  } else {
    isRefreshing.value = true
  }
  error.value = ''
  try {
    const result = await organizationsStore.loadOrganization(organizationId.value, 'members,groups')
    organization.value = result
  } catch (err: any) {
    error.value = err.response?.data?.error_message || err.message || 'Failed to load organization'
  } finally {
    if (isInitial) {
      isInitialLoading.value = false
    } else {
      isRefreshing.value = false
    }
  }
}

const openEditModal = () => {
  modalError.value = ''
  isEditModalOpen.value = true
}

const closeEditModal = () => {
  isEditModalOpen.value = false
  modalError.value = ''
}

const handleEdit = async (data: UpdateOrganizationRequest) => {
  isSubmitting.value = true
  modalError.value = ''

  try {
    const updated = await organizationsStore.updateOrganization(organizationId.value, data)
    organization.value = updated || organization.value // Update local ref
    closeEditModal()
    await loadOrganization(false) // Reload to get fresh data (refresh, not initial load)
  } catch (err: any) {
    modalError.value = err.response?.data?.error_message || err.message || 'An error occurred'
  } finally {
    isSubmitting.value = false
  }
}

const confirmDelete = () => {
  if (confirm(t('organizations.deleteWarning'))) {
    deleteOrganization()
  }
}

const deleteOrganization = async () => {
  try {
    await organizationsStore.deleteOrganization(organizationId.value)
    router.push({ name: 'Organizations' })
  } catch (err: any) {
    error.value = err.response?.data?.error_message || err.message || 'Failed to delete organization'
  }
}

const goBack = () => {
  router.push({ name: 'Organizations' })
}

const goToBulkImport = () => {
  router.push({ name: 'BulkImport', params: { id: organizationId.value } })
}

const changeTab = (tab: string) => {
  activeTab.value = tab
  // Optionally update URL for bookmarking, but without navigation
  if (history.replaceState) {
    const url = new URL(window.location.href)
    url.searchParams.set('tab', tab)
    history.replaceState({}, '', url)
  }
}
</script>

<style scoped>
.organization-detail-page {
  min-height: 100vh;
  background: var(--color-bg-secondary);
}

.loading-container,
.error-container {
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

.organization-content {
  padding: 2rem;
}

.organization-header {
  background: var(--color-bg-primary);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-content {
  display: flex;
  gap: 1.5rem;
  flex: 1;
}

.organization-icon-large {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-radius: 12px;
  font-size: 2.5rem;
}

.organization-info {
  flex: 1;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.title-row h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.refresh-spinner {
  font-size: 1.25rem;
  color: var(--color-primary);
  opacity: 0.7;
}

.badge {
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

.badge-info {
  background: var(--color-info-light);
  color: var(--color-info);
}

.description {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: var(--color-text-secondary);
}

.quick-stats {
  display: flex;
  gap: 2rem;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-secondary);
}

.stat i {
  color: var(--color-primary);
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.tabs-container {
  background: var(--color-bg-primary);
  border-radius: 12px;
  overflow: hidden;
}

.tabs-header {
  display: flex;
  border-bottom: 2px solid var(--color-border);
}

.tab {
  flex: 1;
  padding: 1.25rem 1.5rem;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 500;
  color: var(--color-text-secondary);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-bottom: 3px solid transparent;
}

.tab:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.tab.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.tabs-content {
  padding: 2rem;
}

.tab-panel {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

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

.settings-card {
  background: var(--color-bg-secondary);
  border-radius: 8px;
  padding: 1.5rem;
}

.settings-card h3 {
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.danger-zone {
  border: 2px solid var(--color-danger);
  border-radius: 8px;
  padding: 1.5rem;
  background: var(--color-danger-light);
}

.danger-zone h4 {
  margin: 0 0 0.5rem 0;
  color: var(--color-danger);
}

.danger-zone p {
  margin: 0 0 1rem 0;
  color: var(--color-text-secondary);
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

.btn-outline-primary {
  background: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
}

.btn-outline-primary:hover {
  background: var(--color-primary-light);
}

.btn-outline-secondary {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.btn-outline-secondary:hover {
  background: var(--color-bg-secondary);
}

.btn-danger {
  background: var(--color-danger);
  color: white;
}

.btn-danger:hover {
  background: var(--color-danger-dark);
}
</style>
