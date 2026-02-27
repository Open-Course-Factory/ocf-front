<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <div class="admin-organizations-page">
    <div class="page-header">
      <h2><i class="fas fa-building"></i> {{ t('adminOrgs.pageTitle') }}</h2>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="search-wrapper">
        <i class="fas fa-search search-icon"></i>
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          :placeholder="t('adminOrgs.searchPlaceholder')"
        />
      </div>
      <select v-model="typeFilter" class="type-filter">
        <option value="all">{{ t('adminOrgs.filterAll') }}</option>
        <option value="personal">{{ t('adminOrgs.filterPersonal') }}</option>
        <option value="team">{{ t('adminOrgs.filterTeam') }}</option>
      </select>
      <span class="org-count">
        {{ filteredOrganizations.length }} / {{ organizationsStore.organizations.length }}
      </span>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin fa-3x"></i>
      <p>{{ t('adminOrgs.loading') }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <i class="fas fa-exclamation-triangle fa-3x"></i>
      <p>{{ error }}</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredOrganizations.length === 0" class="empty-state">
      <i class="fas fa-building fa-3x"></i>
      <p>{{ t('adminOrgs.noOrgs') }}</p>
    </div>

    <!-- Organizations Table -->
    <div v-else class="table-wrapper">
      <table class="org-table">
        <thead>
          <tr>
            <th
              class="sortable-header"
              @click="toggleSort('display_name')"
            >
              {{ t('adminOrgs.colOrganization') }}
              <i :class="getSortIcon('display_name')"></i>
            </th>
            <th
              class="sortable-header"
              @click="toggleSort('organization_type')"
            >
              {{ t('adminOrgs.colType') }}
              <i :class="getSortIcon('organization_type')"></i>
            </th>
            <th
              class="sortable-header"
              @click="toggleSort('member_count')"
            >
              {{ t('adminOrgs.colMembers') }}
              <i :class="getSortIcon('member_count')"></i>
            </th>
            <th>{{ t('adminOrgs.colPlan') }}</th>
            <th>{{ t('adminOrgs.colBackends') }}</th>
            <th>{{ t('adminOrgs.colActions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="org in filteredOrganizations" :key="org.id">
            <td>{{ org.display_name }}</td>
            <td>
              <span :class="['type-badge', `type-${org.organization_type}`]">
                {{ org.organization_type === 'personal' ? t('adminOrgs.filterPersonal') : t('adminOrgs.filterTeam') }}
              </span>
            </td>
            <td>{{ org.member_count ?? 0 }}</td>
            <td>
              <template v-if="getPlanDisplay(org.id)">
                <span class="plan-name">{{ getPlanDisplay(org.id)!.name }}</span>
                <span class="plan-price">{{ getPlanDisplay(org.id)!.price }}</span>
              </template>
              <span v-else class="text-muted text-italic">{{ t('adminOrgs.noPlan') }}</span>
            </td>
            <td>
              <template v-if="orgConfigs[org.id] && orgConfigs[org.id].allowed_backends.length > 0">
                <span
                  v-for="backendId in orgConfigs[org.id].allowed_backends"
                  :key="backendId"
                  class="backend-tag"
                >
                  {{ getBackendName(backendId) }}
                </span>
              </template>
              <span v-else class="text-muted text-italic">{{ t('adminOrgs.systemDefault') }}</span>
            </td>
            <td class="actions-cell">
              <Button
                variant="outline-primary"
                size="sm"
                icon="fas fa-server"
                @click="openBackendModal(org)"
              >
                {{ t('adminOrgs.backendsBtn') }}
              </Button>
              <Button
                variant="outline-primary"
                size="sm"
                icon="fas fa-credit-card"
                @click="openPlanModal(org)"
              >
                {{ t('adminOrgs.planBtn') }}
              </Button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Backend Config Modal -->
    <BaseModal
      :visible="showBackendModal"
      :title="editingOrg?.display_name || ''"
      title-icon="fas fa-server"
      size="medium"
      :is-loading="savingBackendConfig"
      @close="closeBackendModal"
    >
      <div class="config-modal-content">
        <div class="config-section">
          <h4>{{ t('adminOrgs.allowedBackendsLabel') }}</h4>
          <p class="config-hint">{{ t('adminOrgs.allowedBackendsHint') }}</p>
          <div class="backend-checkboxes">
            <label v-for="backend in backendsStore.backends" :key="backend.id" class="backend-checkbox">
              <input
                type="checkbox"
                :value="backend.id"
                :checked="editAllowedBackends.includes(backend.id)"
                @change="toggleBackend(backend.id)"
              />
              <span class="checkbox-label">
                <span class="connection-dot-sm" :class="backend.connected ? 'online' : 'offline'"></span>
                {{ backend.name || backend.id }}
              </span>
            </label>
          </div>
        </div>
        <div class="config-section">
          <h4>{{ t('adminOrgs.defaultBackendLabel') }}</h4>
          <select v-model="editDefaultBackend" class="config-select" :disabled="editAllowedBackends.length === 0">
            <option value="">{{ t('adminOrgs.systemDefault') }}</option>
            <option v-for="backend in availableDefaultBackends" :key="backend.id" :value="backend.id">
              {{ backend.name || backend.id }}
            </option>
          </select>
        </div>
        <div v-if="backendConfigError" class="config-error">
          <i class="fas fa-exclamation-triangle"></i>
          {{ backendConfigError }}
        </div>
      </div>
      <template #footer>
        <button class="btn btn-secondary" @click="closeBackendModal" :disabled="savingBackendConfig">
          {{ t('adminOrgs.cancel') }}
        </button>
        <button class="btn btn-primary" @click="saveBackendConfig" :disabled="savingBackendConfig">
          <i v-if="savingBackendConfig" class="fas fa-spinner fa-spin"></i>
          {{ t('adminOrgs.save') }}
        </button>
      </template>
    </BaseModal>

    <!-- Plan Modal -->
    <AdminOrgPlanModal
      :visible="showPlanModal"
      :organization-id="planModalOrgId"
      :organization-name="planModalOrgName"
      :current-plan-id="planModalCurrentPlanId"
      :current-subscription="planModalCurrentSub"
      @close="closePlanModal"
      @assigned="onPlanAssigned"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import axios from 'axios'
import { useOrganizationsStore } from '../../../stores/organizations'
import { useTerminalBackendsStore } from '../../../stores/terminalBackends'
import { useSubscriptionPlansStore } from '../../../stores/subscriptionPlans'
import { useTranslations } from '../../../composables/useTranslations'
import Button from '../../UI/Button.vue'
import BaseModal from '../../Modals/BaseModal.vue'
import AdminOrgPlanModal from '../../Modals/AdminOrgPlanModal.vue'
import type { Organization, OrganizationSubscription } from '../../../types'

const organizationsStore = useOrganizationsStore()
const backendsStore = useTerminalBackendsStore()
const plansStore = useSubscriptionPlansStore()

const { t } = useTranslations({
  en: {
    adminOrgs: {
      pageTitle: 'Organizations',
      searchPlaceholder: 'Search organizations...',
      filterAll: 'All',
      filterPersonal: 'Personal',
      filterTeam: 'Team',
      loading: 'Loading organizations...',
      noOrgs: 'No organizations found',
      loadError: 'Failed to load organizations',
      colOrganization: 'Organization',
      colType: 'Type',
      colMembers: 'Members',
      colPlan: 'Plan',
      colBackends: 'Backends',
      colActions: 'Actions',
      noPlan: 'No plan',
      systemDefault: 'System default',
      backendsBtn: 'Backends',
      planBtn: 'Plan',
      allowedBackendsLabel: 'Allowed Backends',
      allowedBackendsHint: 'Select which backends this organization can use. If none are selected, the system default will be used.',
      defaultBackendLabel: 'Default Backend',
      cancel: 'Cancel',
      save: 'Save',
      saveError: 'Failed to save backend configuration'
    }
  },
  fr: {
    adminOrgs: {
      pageTitle: 'Organisations',
      searchPlaceholder: 'Rechercher des organisations...',
      filterAll: 'Toutes',
      filterPersonal: 'Personnel',
      filterTeam: 'Equipe',
      loading: 'Chargement des organisations...',
      noOrgs: 'Aucune organisation trouvée',
      loadError: 'Échec du chargement des organisations',
      colOrganization: 'Organisation',
      colType: 'Type',
      colMembers: 'Membres',
      colPlan: 'Plan',
      colBackends: 'Backends',
      colActions: 'Actions',
      noPlan: 'Aucun plan',
      systemDefault: 'Défaut système',
      backendsBtn: 'Backends',
      planBtn: 'Plan',
      allowedBackendsLabel: 'Backends autorisés',
      allowedBackendsHint: 'Sélectionnez les backends que cette organisation peut utiliser. Si aucun n\'est sélectionné, le défaut système sera utilisé.',
      defaultBackendLabel: 'Backend par défaut',
      cancel: 'Annuler',
      save: 'Enregistrer',
      saveError: 'Échec de l\'enregistrement de la configuration des backends'
    }
  }
})

// State
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')
const typeFilter = ref<'all' | 'personal' | 'team'>('all')
const sortColumn = ref<'display_name' | 'organization_type' | 'member_count'>('display_name')
const sortDirection = ref<'asc' | 'desc'>('asc')

// Per-org data
const orgConfigs: Record<string, { allowed_backends: string[]; default_backend: string }> = reactive({})
const orgSubscriptions: Record<string, OrganizationSubscription> = reactive({})

// Backend modal state
const showBackendModal = ref(false)
const editingOrg = ref<Organization | null>(null)
const editAllowedBackends = ref<string[]>([])
const editDefaultBackend = ref('')
const savingBackendConfig = ref(false)
const backendConfigError = ref('')

// Plan modal state
const showPlanModal = ref(false)
const planModalOrgId = ref('')
const planModalOrgName = ref('')
const planModalCurrentPlanId = ref<string | undefined>(undefined)
const planModalCurrentSub = ref<OrganizationSubscription | undefined>(undefined)

// Helpers
function getSortIcon(column: string): string {
  if (sortColumn.value !== column) return 'fas fa-sort'
  return sortDirection.value === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'
}

const filteredOrganizations = computed(() => {
  let orgs = [...organizationsStore.organizations]

  // Filter by search
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    orgs = orgs.filter(org =>
      org.display_name?.toLowerCase().includes(q) ||
      org.name?.toLowerCase().includes(q)
    )
  }

  // Filter by type
  if (typeFilter.value !== 'all') {
    orgs = orgs.filter(org => org.organization_type === typeFilter.value)
  }

  // Sort
  orgs.sort((a, b) => {
    let valA: any, valB: any
    switch (sortColumn.value) {
      case 'display_name':
        valA = (a.display_name || '').toLowerCase()
        valB = (b.display_name || '').toLowerCase()
        break
      case 'organization_type':
        valA = a.organization_type
        valB = b.organization_type
        break
      case 'member_count':
        valA = a.member_count || 0
        valB = b.member_count || 0
        break
      default:
        return 0
    }
    const cmp = typeof valA === 'number' ? valA - valB : String(valA).localeCompare(String(valB))
    return sortDirection.value === 'asc' ? cmp : -cmp
  })

  return orgs
})

const availableDefaultBackends = computed(() => {
  if (editAllowedBackends.value.length === 0) return []
  return backendsStore.backends.filter(b => editAllowedBackends.value.includes(b.id))
})

// Helpers
function getBackendName(backendId: string): string {
  const backend = backendsStore.backends.find(b => b.id === backendId)
  return backend?.name || backendId
}

function getPlanDisplay(orgId: string): { name: string; price: string } | null {
  const sub = orgSubscriptions[orgId]
  if (!sub) return null
  const plan = plansStore.entities.find((p: any) => p.id === sub.subscription_plan_id)
  if (!plan) return null
  return {
    name: plan.name,
    price: plansStore.formatPrice(plan.price_amount, plan.currency) + '/' + plan.billing_interval
  }
}

function toggleSort(column: 'display_name' | 'organization_type' | 'member_count') {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
}

// Backend modal actions
function toggleBackend(backendId: string) {
  const idx = editAllowedBackends.value.indexOf(backendId)
  if (idx >= 0) {
    editAllowedBackends.value.splice(idx, 1)
    // Clear default if it was the removed backend
    if (editDefaultBackend.value === backendId) {
      editDefaultBackend.value = ''
    }
  } else {
    editAllowedBackends.value.push(backendId)
  }
}

function openBackendModal(org: Organization) {
  editingOrg.value = org
  const config = orgConfigs[org.id]
  editAllowedBackends.value = [...(config?.allowed_backends || [])]
  editDefaultBackend.value = config?.default_backend || ''
  backendConfigError.value = ''
  showBackendModal.value = true
}

function closeBackendModal() {
  showBackendModal.value = false
  editingOrg.value = null
}

async function saveBackendConfig() {
  if (!editingOrg.value) return
  savingBackendConfig.value = true
  backendConfigError.value = ''
  try {
    await organizationsStore.updateOrganizationBackendConfig(editingOrg.value.id, {
      allowed_backends: editAllowedBackends.value,
      default_backend: editDefaultBackend.value
    })
    orgConfigs[editingOrg.value.id] = {
      allowed_backends: [...editAllowedBackends.value],
      default_backend: editDefaultBackend.value
    }
    closeBackendModal()
  } catch (err: any) {
    backendConfigError.value = err.response?.data?.error_message || err.response?.data?.message || t('adminOrgs.saveError')
  } finally {
    savingBackendConfig.value = false
  }
}

// Plan modal actions
function openPlanModal(org: Organization) {
  planModalOrgId.value = org.id
  planModalOrgName.value = org.display_name
  const sub = orgSubscriptions[org.id]
  planModalCurrentPlanId.value = sub?.subscription_plan_id || undefined
  planModalCurrentSub.value = sub || undefined
  showPlanModal.value = true
}

function closePlanModal() {
  showPlanModal.value = false
}

async function onPlanAssigned() {
  // Refresh subscription for this org (direct axios to avoid store state mutation)
  if (planModalOrgId.value) {
    try {
      const response = await axios.get(`/organizations/${planModalOrgId.value}/subscription`)
      const data = response.data?.data || response.data
      if (data) {
        orgSubscriptions[planModalOrgId.value] = data
      }
    } catch {
      delete orgSubscriptions[planModalOrgId.value]
    }
  }
  closePlanModal()
}

// Data loading
// TODO: Replace per-org API calls with a bulk admin endpoint when available
// Currently issues 2 requests per org (backends + subscription) which won't scale
// Uses direct axios calls instead of store methods to avoid mutating shared
// isLoading/error state in parallel — 404s are expected for orgs without data.
onMounted(async () => {
  loading.value = true
  try {
    // Phase 1: Load base data in parallel
    await Promise.all([
      organizationsStore.loadOrganizations(),
      backendsStore.fetchBackends(),
      plansStore.ensurePlansLoaded()
    ])

    // Phase 2: Load per-org data in parallel (direct axios, bypass store state)
    const orgs = organizationsStore.organizations
    const [configResults, subResults] = await Promise.all([
      Promise.allSettled(
        orgs.map(org => axios.get(`/organizations/${org.id}/backends`))
      ),
      Promise.allSettled(
        orgs.map(org => axios.get(`/organizations/${org.id}/subscription`))
      )
    ])

    // Process results — 404s are expected (org has no config/subscription)
    configResults.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        const data = result.value.data?.data || result.value.data
        if (data) orgConfigs[orgs[idx].id] = data
      }
    })
    subResults.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        const data = result.value.data?.data || result.value.data
        if (data) orgSubscriptions[orgs[idx].id] = data
      }
    })
  } catch (err) {
    error.value = t('adminOrgs.loadError')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.admin-organizations-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
}

.page-header h2 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 2rem;
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

/* Toolbar */
.toolbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
}

.search-wrapper {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.search-icon {
  position: absolute;
  left: var(--spacing-md);
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md) var(--spacing-sm) calc(var(--spacing-md) + 1.5em);
  border: 2px solid var(--color-border-medium);
  border-radius: var(--border-radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  transition: border-color var(--transition-fast);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.type-filter {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 2px solid var(--color-border-medium);
  border-radius: var(--border-radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  appearance: auto;
  cursor: pointer;
}

.type-filter:focus {
  outline: none;
  border-color: var(--color-primary);
}

.org-count {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  white-space: nowrap;
  font-weight: var(--font-weight-medium);
}

/* Table */
.table-wrapper {
  overflow-x: auto;
}

.org-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--color-bg-primary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
}

.org-table thead {
  background: var(--color-bg-secondary);
}

.org-table th {
  padding: var(--spacing-md) var(--spacing-lg);
  text-align: left;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid var(--color-border-light);
  white-space: nowrap;
}

.org-table td {
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: var(--border-width-thin) solid var(--color-border-light);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  vertical-align: middle;
}

.org-table tbody tr:hover {
  background: var(--color-bg-secondary);
}

.org-table tbody tr:last-child td {
  border-bottom: none;
}

.sortable-header {
  cursor: pointer;
  user-select: none;
  transition: color var(--transition-fast);
}

.sortable-header:hover {
  color: var(--color-primary);
}

.sortable-header i {
  margin-left: var(--spacing-xs);
  font-size: var(--font-size-xs);
}

/* Type Badge */
.type-badge {
  display: inline-block;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  padding: 2px var(--spacing-sm);
  border-radius: var(--border-radius-full);
  text-transform: capitalize;
}

.type-personal {
  background-color: var(--color-info-bg);
  color: var(--color-info-text);
  border: 1px solid var(--color-info-border);
}

.type-team {
  background-color: var(--color-success-bg);
  color: var(--color-success-text);
  border: 1px solid var(--color-success-border);
}

/* Plan display */
.plan-name {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.plan-price {
  margin-left: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

/* Backend tag */
.backend-tag {
  display: inline-block;
  font-size: var(--font-size-xs);
  padding: 2px var(--spacing-sm);
  border-radius: var(--border-radius-full);
  background-color: var(--color-bg-secondary);
  border: var(--border-width-thin) solid var(--color-border-light);
  color: var(--color-text-secondary);
  margin-right: var(--spacing-xs);
  margin-bottom: var(--spacing-xs);
}

/* Text helpers */
.text-muted {
  color: var(--color-text-muted);
}

.text-italic {
  font-style: italic;
}

/* Actions cell */
.actions-cell {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

/* Loading / Error / Empty States */
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl);
  gap: var(--spacing-lg);
  color: var(--color-text-secondary);
}

.error-state {
  color: var(--color-danger-text);
}

.empty-state i {
  opacity: 0.4;
}

/* Config modal content */
.config-modal-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.config-section h4 {
  margin: 0;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.config-hint {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.backend-checkboxes {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.backend-checkbox {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  transition: background var(--transition-fast);
}

.backend-checkbox:hover {
  background: var(--color-bg-secondary);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
}

.connection-dot-sm {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.connection-dot-sm.online {
  background-color: var(--color-success);
  box-shadow: 0 0 4px var(--color-success);
}

.connection-dot-sm.offline {
  background-color: var(--color-danger);
}

.config-select {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 2px solid var(--color-border-medium);
  border-radius: var(--border-radius-sm);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  appearance: auto;
}

.config-select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.config-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.config-error {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  border: 1px solid var(--color-danger-border);
}

/* Responsive */
@media (max-width: 768px) {
  .admin-organizations-page {
    padding: var(--spacing-md);
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-wrapper {
    min-width: unset;
  }

  .org-table th,
  .org-table td {
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-sm);
  }

  .actions-cell {
    flex-direction: column;
  }
}
</style>
