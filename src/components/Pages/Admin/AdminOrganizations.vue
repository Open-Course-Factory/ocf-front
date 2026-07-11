<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */
-->

<template>
  <div class="admin-organizations-page">
    <div class="page-header">
      <h2><i class="fas fa-building"></i> {{ t('adminOrgs.pageTitle') }}</h2>
    </div>

    <EntityTable
      :columns="columns"
      :rows="typeFilteredOrganizations"
      :loading="loading"
      :error="error"
      searchable
      :search-filter="searchFilter"
      :search-placeholder="t('adminOrgs.searchPlaceholder')"
      :initial-sort="{ key: 'display_name', dir: 'asc' }"
      show-count
      empty-icon="fa-building"
      :empty-text="t('adminOrgs.noOrgs')"
    >
      <template #toolbar-extra>
        <select v-model="typeFilter" class="type-filter">
          <option value="all">{{ t('adminOrgs.filterAll') }}</option>
          <option value="personal">{{ t('adminOrgs.filterPersonal') }}</option>
          <option value="team">{{ t('adminOrgs.filterTeam') }}</option>
        </select>
      </template>

      <template #cell-type="{ row }">
        <span :class="['type-badge', `type-${row.organization_type}`]">
          {{ row.organization_type === 'personal' ? t('adminOrgs.filterPersonal') : t('adminOrgs.filterTeam') }}
        </span>
      </template>

      <template #cell-plan="{ row }">
        <template v-if="getPlanDisplay(row.id)">
          <span class="plan-name">{{ getPlanDisplay(row.id)!.name }}</span>
          <span class="plan-price">{{ getPlanDisplay(row.id)!.price }}</span>
        </template>
        <span v-else class="text-muted text-italic">{{ t('adminOrgs.noPlan') }}</span>
      </template>

      <template #cell-backends="{ row }">
        <template v-if="orgConfigs[row.id]?.allowed_backends?.length > 0">
          <span
            v-for="backendId in orgConfigs[row.id].allowed_backends"
            :key="backendId"
            class="backend-tag"
          >
            {{ getBackendName(backendId) }}
          </span>
        </template>
        <span v-else class="text-muted text-italic">{{ t('adminOrgs.systemDefault') }}</span>
      </template>

      <template #row-actions="{ row }">
        <div class="org-row-actions">
          <Button
            variant="outline-primary"
            size="sm"
            icon="fas fa-server"
            @click="openBackendModal(row)"
          >
            {{ t('adminOrgs.backendsBtn') }}
          </Button>
          <Button
            variant="outline-primary"
            size="sm"
            icon="fas fa-credit-card"
            @click="openPlanModal(row)"
          >
            {{ t('adminOrgs.planBtn') }}
          </Button>
        </div>
      </template>
    </EntityTable>

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
          <label class="toggle-label">
            <input
              type="checkbox"
              v-model="editIncusUIEnabled"
            />
            <span>{{ t('adminOrgs.incusUIEnabledLabel') }}</span>
          </label>
          <p class="config-hint">{{ t('adminOrgs.incusUIEnabledHint') }}</p>
        </div>
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
import EntityTable from '../../Generic/EntityTable.vue'
import Button from '../../UI/Button.vue'
import BaseModal from '../../Modals/BaseModal.vue'
import AdminOrgPlanModal from '../../Modals/AdminOrgPlanModal.vue'
import type { TableColumn } from '../../../utils/tableColumns'
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
      noOrgs: 'No organizations found',
      loadError: 'Failed to load organizations',
      colOrganization: 'Organization',
      colType: 'Type',
      colMembers: 'Members',
      colPlan: 'Plan',
      colBackends: 'Backends',
      noPlan: 'No plan',
      systemDefault: 'System default',
      backendsBtn: 'Backends',
      planBtn: 'Plan',
      allowedBackendsLabel: 'Allowed Backends',
      allowedBackendsHint: 'Select which backends this organization can use. If none are selected, the system default will be used.',
      defaultBackendLabel: 'Default Backend',
      cancel: 'Cancel',
      save: 'Save',
      saveError: 'Failed to save backend configuration',
      incusUIEnabledLabel: 'Enable Incus UI access',
      incusUIEnabledHint: 'Allow organization owners and managers to access the infrastructure management interface.'
    }
  },
  fr: {
    adminOrgs: {
      pageTitle: 'Organisations',
      searchPlaceholder: 'Rechercher des organisations...',
      filterAll: 'Toutes',
      filterPersonal: 'Personnel',
      filterTeam: 'Equipe',
      noOrgs: 'Aucune organisation trouvée',
      loadError: 'Échec du chargement des organisations',
      colOrganization: 'Organisation',
      colType: 'Type',
      colMembers: 'Membres',
      colPlan: 'Plan',
      colBackends: 'Backends',
      noPlan: 'Aucun plan',
      systemDefault: 'Défaut système',
      backendsBtn: 'Backends',
      planBtn: 'Plan',
      allowedBackendsLabel: 'Backends autorisés',
      allowedBackendsHint: 'Sélectionnez les backends que cette organisation peut utiliser. Si aucun n\'est sélectionné, le défaut système sera utilisé.',
      defaultBackendLabel: 'Backend par défaut',
      cancel: 'Annuler',
      save: 'Enregistrer',
      saveError: 'Échec de l\'enregistrement de la configuration des backends',
      incusUIEnabledLabel: 'Activer l\'accès à l\'interface Incus',
      incusUIEnabledHint: 'Permettre aux propriétaires et gestionnaires de l\'organisation d\'accéder à l\'interface de gestion de l\'infrastructure.'
    }
  }
})

// State
const loading = ref(false)
const error = ref('')
const typeFilter = ref<'all' | 'personal' | 'team'>('all')

// Per-org data
const orgConfigs: Record<string, { allowed_backends: string[]; default_backend: string }> = reactive({})
const orgSubscriptions: Record<string, OrganizationSubscription> = reactive({})

// Backend modal state
const showBackendModal = ref(false)
const editingOrg = ref<Organization | null>(null)
const editAllowedBackends = ref<string[]>([])
const editDefaultBackend = ref('')
const editIncusUIEnabled = ref(false)
const savingBackendConfig = ref(false)
const backendConfigError = ref('')

// Plan modal state
const showPlanModal = ref(false)
const planModalOrgId = ref('')
const planModalOrgName = ref('')
const planModalCurrentPlanId = ref<string | undefined>(undefined)
const planModalCurrentSub = ref<OrganizationSubscription | undefined>(undefined)

// Table configuration. Search and sort are handled by EntityTable; the page only
// applies the organization-type filter (a page-level domain concern) to the rows.
const columns = computed<TableColumn<Organization>[]>(() => [
  { key: 'display_name', label: t('adminOrgs.colOrganization'), sortable: true },
  { key: 'type', label: t('adminOrgs.colType'), sortable: true, sortValue: (o) => o.organization_type ?? '' },
  {
    key: 'member_count',
    label: t('adminOrgs.colMembers'),
    sortable: true,
    sortValue: (o) => o.member_count ?? 0,
    format: (v) => String(v ?? 0)
  },
  { key: 'plan', label: t('adminOrgs.colPlan') },
  { key: 'backends', label: t('adminOrgs.colBackends') }
])

const typeFilteredOrganizations = computed(() => {
  if (typeFilter.value === 'all') return organizationsStore.organizations
  return organizationsStore.organizations.filter(org => org.organization_type === typeFilter.value)
})

function searchFilter(org: Organization, query: string): boolean {
  const q = query.toLowerCase()
  return !!org.display_name?.toLowerCase().includes(q) || !!org.name?.toLowerCase().includes(q)
}

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

  // Use embedded plan from bulk response if available, fallback to store
  const plan = sub.subscription_plan || plansStore.entities.find((p: any) => p.id === sub.subscription_plan_id)
  if (!plan) return null

  return {
    name: plan.name,
    price: plansStore.formatPrice(plan.price_amount, plan.currency) + '/' + plan.billing_interval
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
  editIncusUIEnabled.value = org.incus_ui_enabled ?? false
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
    await axios.patch(`/organizations/${editingOrg.value.id}`, {
      incus_ui_enabled: editIncusUIEnabled.value
    })
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
onMounted(async () => {
  loading.value = true
  try {
    // Phase 1: Load base data in parallel
    await Promise.all([
      organizationsStore.loadOrganizations(),
      backendsStore.fetchBackends(),
      plansStore.ensurePlansLoaded()
    ])

    // Phase 2: Read backend configs from org objects + bulk load subscriptions
    const orgs = organizationsStore.organizations

    // Backend configs: already on org objects from GET /organizations
    for (const org of orgs) {
      if (org.allowed_backends?.length || org.default_backend) {
        orgConfigs[org.id] = {
          allowed_backends: org.allowed_backends || [],
          default_backend: org.default_backend || ''
        }
      }
    }

    // Subscriptions: single bulk fetch
    try {
      const response = await axios.get('/admin/organizations/subscriptions')
      const subscriptions = response.data?.data || []
      for (const sub of subscriptions) {
        orgSubscriptions[sub.organization_id] = sub
      }
    } catch {
      // Non-critical: page works without subscription data
    }
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

/* Type filter (toolbar-extra slot) */
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

/* Row actions */
.org-row-actions {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
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

  .org-row-actions {
    flex-direction: column;
  }
}
</style>
