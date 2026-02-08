<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <div class="terminal-backends-page">
    <div class="page-header">
      <h2>{{ t('terminalBackends.pageTitle') }}</h2>
      <div class="header-actions">
        <Button
          variant="primary"
          size="md"
          :icon="backendsStore.isLoading ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'"
          :disabled="backendsStore.isLoading"
          @click="handleRefresh"
        >
          {{ t('terminalBackends.refresh') }}
        </Button>
      </div>
    </div>

    <!-- Summary Banner -->
    <div v-if="backendsStore.backends.length > 0" class="status-banner" :class="`status-${overallStatus}`">
      <div class="status-indicator">
        <i :class="overallStatusIcon"></i>
        <span class="status-label">{{ t('terminalBackends.status') }}:</span>
        <strong>{{ onlineCount }}/{{ backendsStore.backends.length }} {{ t('terminalBackends.online') }}</strong>
      </div>
      <div v-if="offlineCount > 0" class="status-message">
        <i class="fas fa-exclamation-triangle"></i>
        {{ t('terminalBackends.offlineWarning', { count: offlineCount }) }}
      </div>
    </div>

    <!-- Backends Grid -->
    <div v-if="backendsStore.backends.length > 0" class="backends-grid">
      <div
        v-for="backend in backendsStore.backends"
        :key="backend.id"
        :class="['backend-card', { 'offline': !backend.connected }]"
      >
        <div class="card-header">
          <div class="card-title-row">
            <span class="connection-dot" :class="backend.connected ? 'online' : 'offline'"></span>
            <h3>{{ backend.name || backend.id }}</h3>
            <span v-if="backend.is_default" class="default-badge">
              {{ t('terminalBackends.default') }}
            </span>
          </div>
          <span class="connection-label" :class="backend.connected ? 'text-success' : 'text-danger'">
            {{ backend.connected ? t('terminalBackends.connected') : t('terminalBackends.disconnected') }}
          </span>
        </div>

        <p v-if="backend.description" class="card-description">{{ backend.description }}</p>

        <div class="card-footer">
          <span class="backend-id">{{ backend.id }}</span>
          <Button
            v-if="backend.connected && !backend.is_default"
            size="sm"
            variant="outline-primary"
            icon="fas fa-star"
            :loading="settingDefault === backend.id"
            :disabled="!!settingDefault"
            @click="setAsDefault(backend.id)"
          >
            {{ t('terminalBackends.setDefault') }}
          </Button>
          <span v-else-if="backend.is_default" class="current-default-label">
            <i class="fas fa-star"></i> {{ t('terminalBackends.currentDefault') }}
          </span>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else-if="backendsStore.isLoading" class="loading-state">
      <i class="fas fa-spinner fa-spin fa-3x"></i>
      <p>{{ t('terminalBackends.loading') }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="backendsStore.error" class="error-state">
      <i class="fas fa-exclamation-triangle fa-3x"></i>
      <p>{{ backendsStore.error }}</p>
      <Button variant="primary" @click="handleRefresh">
        {{ t('terminalBackends.refresh') }}
      </Button>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <i class="fas fa-server fa-3x"></i>
      <p>{{ t('terminalBackends.noBackends') }}</p>
    </div>

    <!-- Auto-refresh info -->
    <div v-if="backendsStore.backends.length > 0" class="last-update">
      <i class="fas fa-sync-alt"></i>
      <span>{{ t('terminalBackends.autoRefresh', { seconds: autoRefreshInterval / 1000 }) }}</span>
    </div>

    <!-- Organization Backend Configuration -->
    <div v-if="backendsStore.backends.length > 0" class="org-config-section">
      <h3 class="section-title">
        <i class="fas fa-building"></i>
        {{ t('terminalBackends.orgConfig.title') }}
      </h3>
      <p class="section-description">{{ t('terminalBackends.orgConfig.description') }}</p>

      <div v-if="orgsLoading" class="loading-state">
        <i class="fas fa-spinner fa-spin fa-2x"></i>
        <p>{{ t('terminalBackends.orgConfig.loading') }}</p>
      </div>

      <div v-else-if="organizationsStore.organizations.length > 0" class="org-table-wrapper">
        <table class="org-table">
          <thead>
            <tr>
              <th>{{ t('terminalBackends.orgConfig.orgName') }}</th>
              <th>{{ t('terminalBackends.orgConfig.type') }}</th>
              <th>{{ t('terminalBackends.orgConfig.allowedBackends') }}</th>
              <th>{{ t('terminalBackends.orgConfig.defaultBackend') }}</th>
              <th>{{ t('terminalBackends.orgConfig.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="org in organizationsStore.organizations" :key="org.id">
              <td class="org-name-cell">{{ org.display_name }}</td>
              <td>
                <span class="type-badge" :class="`type-${org.organization_type}`">
                  {{ org.organization_type === 'personal' ? t('terminalBackends.orgConfig.personal') : t('terminalBackends.orgConfig.team') }}
                </span>
              </td>
              <td>
                <div class="backend-tags">
                  <template v-if="orgConfigs[org.id]?.allowed_backends?.length">
                    <span
                      v-for="backendId in orgConfigs[org.id].allowed_backends"
                      :key="backendId"
                      class="backend-tag"
                    >
                      {{ getBackendName(backendId) }}
                    </span>
                  </template>
                  <span v-else class="default-only-label">{{ t('terminalBackends.orgConfig.defaultOnly') }}</span>
                </div>
              </td>
              <td>
                <span v-if="orgConfigs[org.id]?.default_backend" class="default-backend-name">
                  {{ getBackendName(orgConfigs[org.id].default_backend) }}
                </span>
                <span v-else class="system-default-label">{{ t('terminalBackends.orgConfig.systemDefault') }}</span>
              </td>
              <td>
                <Button
                  size="sm"
                  variant="outline-primary"
                  icon="fas fa-cog"
                  :loading="loadingOrgConfig === org.id"
                  @click="openConfigModal(org)"
                >
                  {{ t('terminalBackends.orgConfig.configure') }}
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-state">
        <i class="fas fa-building fa-2x"></i>
        <p>{{ t('terminalBackends.orgConfig.noOrgs') }}</p>
      </div>
    </div>

    <!-- Organization Config Modal -->
    <BaseModal
      :visible="showConfigModal"
      :title="editingOrg?.display_name || ''"
      title-icon="fas fa-server"
      size="medium"
      :is-loading="savingConfig"
      @close="closeConfigModal"
    >
      <div class="config-modal-content">
        <div class="config-section">
          <h4>{{ t('terminalBackends.orgConfig.allowedBackendsLabel') }}</h4>
          <p class="config-hint">{{ t('terminalBackends.orgConfig.allowedBackendsHint') }}</p>
          <div class="backend-checkboxes">
            <label
              v-for="backend in backendsStore.backends"
              :key="backend.id"
              class="backend-checkbox"
            >
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
          <h4>{{ t('terminalBackends.orgConfig.defaultBackendLabel') }}</h4>
          <select v-model="editDefaultBackend" class="config-select" :disabled="editAllowedBackends.length === 0">
            <option value="">{{ t('terminalBackends.orgConfig.systemDefault') }}</option>
            <option
              v-for="backend in availableDefaultBackends"
              :key="backend.id"
              :value="backend.id"
            >
              {{ backend.name || backend.id }}
            </option>
          </select>
          <p v-if="editAllowedBackends.length === 0" class="config-hint">
            {{ t('terminalBackends.orgConfig.defaultBackendDisabledHint') }}
          </p>
        </div>

        <div v-if="configError" class="config-error">
          <i class="fas fa-exclamation-triangle"></i>
          {{ configError }}
        </div>
      </div>

      <template #footer>
        <button class="btn btn-secondary" @click="closeConfigModal" :disabled="savingConfig">
          {{ t('terminalBackends.orgConfig.cancel') }}
        </button>
        <button class="btn btn-primary" @click="saveConfig" :disabled="savingConfig">
          <i v-if="savingConfig" class="fas fa-spinner fa-spin"></i>
          {{ t('terminalBackends.orgConfig.save') }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useTerminalBackendsStore } from '../../../stores/terminalBackends'
import { useOrganizationsStore } from '../../../stores/organizations'
import { useTranslations } from '../../../composables/useTranslations'
import Button from '../../UI/Button.vue'
import BaseModal from '../../Modals/BaseModal.vue'
import type { Organization } from '../../../types'

interface OrgBackendConfig {
  allowed_backends: string[]
  default_backend: string
}

const backendsStore = useTerminalBackendsStore()
const organizationsStore = useOrganizationsStore()
const settingDefault = ref<string | null>(null)

// Org config state
const orgsLoading = ref(false)
const orgConfigs = reactive<Record<string, OrgBackendConfig>>({})
const showConfigModal = ref(false)
const editingOrg = ref<Organization | null>(null)
const editAllowedBackends = ref<string[]>([])
const editDefaultBackend = ref('')
const savingConfig = ref(false)
const configError = ref('')
const loadingOrgConfig = ref<string | null>(null)

const autoRefreshInterval = 30000
let refreshIntervalId: NodeJS.Timeout | null = null

const { t } = useTranslations({
  en: {
    terminalBackends: {
      pageTitle: 'Terminal Backends',
      refresh: 'Refresh',
      status: 'Status',
      online: 'online',
      connected: 'Connected',
      disconnected: 'Disconnected',
      default: 'Default',
      setDefault: 'Set as Default',
      currentDefault: 'System Default',
      offlineWarning: '{count} backend(s) offline',
      loading: 'Loading backends...',
      noBackends: 'No backends configured',
      autoRefresh: 'Auto-refreshing every {seconds} seconds',
      orgConfig: {
        title: 'Organization Backend Configuration',
        description: 'By default, organizations can only use the system default backend. Add specific backends here to grant access.',
        loading: 'Loading organizations...',
        orgName: 'Organization',
        type: 'Type',
        allowedBackends: 'Allowed Backends',
        defaultBackend: 'Default Backend',
        actions: 'Actions',
        personal: 'Personal',
        team: 'Team',
        defaultOnly: 'Default backend only',
        systemDefault: 'System default',
        configure: 'Configure',
        noOrgs: 'No organizations found',
        allowedBackendsLabel: 'Allowed Backends',
        allowedBackendsHint: 'Select which backends this organization can use. If none are selected, only the system default backend is available.',
        defaultBackendLabel: 'Default Backend',
        defaultBackendDisabledHint: 'Add allowed backends above to set a specific default.',
        cancel: 'Cancel',
        save: 'Save',
        saveSuccess: 'Backend configuration updated successfully',
        saveError: 'Failed to save backend configuration'
      }
    }
  },
  fr: {
    terminalBackends: {
      pageTitle: 'Backends Terminal',
      refresh: 'Actualiser',
      status: 'Statut',
      online: 'en ligne',
      connected: 'Connecté',
      disconnected: 'Déconnecté',
      default: 'Par défaut',
      setDefault: 'Définir par défaut',
      currentDefault: 'Défaut système',
      offlineWarning: '{count} backend(s) hors ligne',
      loading: 'Chargement des backends...',
      noBackends: 'Aucun backend configuré',
      autoRefresh: 'Actualisation automatique toutes les {seconds} secondes',
      orgConfig: {
        title: 'Configuration des backends par organisation',
        description: 'Par défaut, les organisations ne peuvent utiliser que le backend par défaut du système. Ajoutez des backends spécifiques ici pour en autoriser l\'accès.',
        loading: 'Chargement des organisations...',
        orgName: 'Organisation',
        type: 'Type',
        allowedBackends: 'Backends autorisés',
        defaultBackend: 'Backend par défaut',
        actions: 'Actions',
        personal: 'Personnel',
        team: 'Équipe',
        defaultOnly: 'Backend par défaut uniquement',
        systemDefault: 'Défaut système',
        configure: 'Configurer',
        noOrgs: 'Aucune organisation trouvée',
        allowedBackendsLabel: 'Backends autorisés',
        allowedBackendsHint: 'Sélectionnez les backends que cette organisation peut utiliser. Si aucun n\'est sélectionné, seul le backend par défaut du système est disponible.',
        defaultBackendLabel: 'Backend par défaut',
        defaultBackendDisabledHint: 'Ajoutez des backends autorisés ci-dessus pour définir un backend par défaut spécifique.',
        cancel: 'Annuler',
        save: 'Enregistrer',
        saveSuccess: 'Configuration des backends mise à jour avec succès',
        saveError: 'Échec de la sauvegarde de la configuration des backends'
      }
    }
  }
})

const onlineCount = computed(() => backendsStore.onlineBackends.length)
const offlineCount = computed(() => backendsStore.backends.length - onlineCount.value)

const overallStatus = computed(() => {
  if (onlineCount.value === 0) return 'critical'
  if (offlineCount.value > 0) return 'warning'
  return 'healthy'
})

const overallStatusIcon = computed(() => {
  switch (overallStatus.value) {
    case 'healthy': return 'fas fa-check-circle'
    case 'warning': return 'fas fa-exclamation-triangle'
    case 'critical': return 'fas fa-exclamation-circle'
    default: return 'fas fa-question-circle'
  }
})

const availableDefaultBackends = computed(() => {
  if (editAllowedBackends.value.length === 0) {
    return backendsStore.backends
  }
  return backendsStore.backends.filter(b => editAllowedBackends.value.includes(b.id))
})

function getBackendName(backendId: string): string {
  const backend = backendsStore.backends.find(b => b.id === backendId)
  return backend?.name || backendId
}

function toggleBackend(backendId: string) {
  const idx = editAllowedBackends.value.indexOf(backendId)
  if (idx >= 0) {
    editAllowedBackends.value.splice(idx, 1)
    // Clear default if it was the removed backend or no backends left
    if (editDefaultBackend.value === backendId || editAllowedBackends.value.length === 0) {
      editDefaultBackend.value = ''
    }
  } else {
    editAllowedBackends.value.push(backendId)
  }
}

async function openConfigModal(org: Organization) {
  editingOrg.value = org
  configError.value = ''
  loadingOrgConfig.value = org.id

  try {
    const config = await organizationsStore.getOrganizationBackendConfig(org.id)
    editAllowedBackends.value = [...(config.allowed_backends || [])]
    editDefaultBackend.value = config.default_backend || ''
    orgConfigs[org.id] = config
    showConfigModal.value = true
  } catch {
    configError.value = t('terminalBackends.orgConfig.saveError')
    showConfigModal.value = true
    editAllowedBackends.value = []
    editDefaultBackend.value = ''
  } finally {
    loadingOrgConfig.value = null
  }
}

function closeConfigModal() {
  showConfigModal.value = false
  editingOrg.value = null
  configError.value = ''
}

async function saveConfig() {
  if (!editingOrg.value) return

  savingConfig.value = true
  configError.value = ''

  try {
    const config: OrgBackendConfig = {
      allowed_backends: editAllowedBackends.value,
      default_backend: editDefaultBackend.value
    }
    await organizationsStore.updateOrganizationBackendConfig(editingOrg.value.id, config)
    orgConfigs[editingOrg.value.id] = { ...config }
    closeConfigModal()
  } catch (err: any) {
    configError.value = err.response?.data?.error_message ||
                        err.response?.data?.message ||
                        t('terminalBackends.orgConfig.saveError')
  } finally {
    savingConfig.value = false
  }
}

async function loadOrgConfigs() {
  orgsLoading.value = true
  try {
    await organizationsStore.loadOrganizations()
    // Load configs for each org in parallel
    const orgs = organizationsStore.organizations
    const results = await Promise.allSettled(
      orgs.map(org => organizationsStore.getOrganizationBackendConfig(org.id))
    )
    results.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        orgConfigs[orgs[idx].id] = result.value
      } else {
        orgConfigs[orgs[idx].id] = { allowed_backends: [], default_backend: '' }
      }
    })
  } catch {
    // Org loading failed — table will show empty state
  } finally {
    orgsLoading.value = false
  }
}

async function handleRefresh() {
  await backendsStore.fetchBackends()
}

async function setAsDefault(backendId: string) {
  settingDefault.value = backendId
  try {
    await backendsStore.setSystemDefault(backendId)
    await backendsStore.fetchBackends()
  } finally {
    settingDefault.value = null
  }
}

onMounted(async () => {
  await backendsStore.fetchBackends()
  loadOrgConfigs()

  refreshIntervalId = setInterval(async () => {
    try {
      await backendsStore.fetchBackends()
    } catch {
      // Silent refresh failure
    }
  }, autoRefreshInterval)
})

onBeforeUnmount(() => {
  if (refreshIntervalId) {
    clearInterval(refreshIntervalId)
  }
})
</script>

<style scoped>
.terminal-backends-page {
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
}

.header-actions {
  display: flex;
  gap: var(--spacing-md);
}

/* Status Banner */
.status-banner {
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-lg);
  margin-bottom: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  border-left: 4px solid;
}

.status-banner.status-healthy {
  background-color: var(--color-success-bg);
  border-left-color: var(--color-success);
  color: var(--color-success-text);
}

.status-banner.status-warning {
  background-color: var(--color-warning-bg);
  border-left-color: var(--color-warning);
  color: var(--color-warning-text);
}

.status-banner.status-critical {
  background-color: var(--color-danger-bg);
  border-left-color: var(--color-danger);
  color: var(--color-danger-text);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-lg);
}

.status-indicator i {
  font-size: var(--font-size-xl);
}

.status-message {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: var(--font-weight-medium);
}

/* Backends Grid */
.backends-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.backend-card {
  background: var(--color-bg-primary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-base);
}

.backend-card:hover {
  box-shadow: var(--shadow-md);
}

.backend-card.offline {
  opacity: 0.6;
  background: var(--color-bg-secondary);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-sm);
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.card-title-row h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
}

.connection-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.connection-dot.online {
  background-color: var(--color-success);
  box-shadow: 0 0 6px var(--color-success);
}

.connection-dot.offline {
  background-color: var(--color-danger);
}

.default-badge {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  padding: 2px var(--spacing-sm);
  border-radius: var(--border-radius-full);
  background-color: var(--color-primary);
  color: var(--color-white);
}

.connection-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.text-success { color: var(--color-success); }
.text-danger { color: var(--color-danger); }

.card-description {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-sm);
  border-top: var(--border-width-thin) solid var(--color-border-light);
}

.backend-id {
  font-family: var(--font-family-monospace);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.current-default-label {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
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

/* Last Update */
.last-update {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background-color: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

/* Organization Config Section */
.org-config-section {
  margin-top: var(--spacing-2xl);
  padding-top: var(--spacing-xl);
  border-top: var(--border-width-thin) solid var(--color-border-light);
}

.section-title {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-xl);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.section-title i {
  color: var(--color-primary);
}

.section-description {
  margin: 0 0 var(--spacing-lg) 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.org-table-wrapper {
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

.org-table th,
.org-table td {
  padding: var(--spacing-md) var(--spacing-lg);
  text-align: left;
  border-bottom: var(--border-width-thin) solid var(--color-border-light);
}

.org-table th {
  background: var(--color-bg-secondary);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.org-table tbody tr:hover {
  background: var(--color-bg-secondary);
}

.org-table tbody tr:last-child td {
  border-bottom: none;
}

.org-name-cell {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.type-badge {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  padding: 2px var(--spacing-sm);
  border-radius: var(--border-radius-full);
}

.type-badge.type-personal {
  background-color: var(--color-info-bg, #e8f4fd);
  color: var(--color-info-text, #1a73e8);
}

.type-badge.type-team {
  background-color: var(--color-success-bg);
  color: var(--color-success-text);
}

.backend-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.backend-tag {
  font-size: var(--font-size-xs);
  padding: 2px var(--spacing-sm);
  border-radius: var(--border-radius-full);
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: var(--border-width-thin) solid var(--color-border-light);
}

.default-only-label,
.system-default-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  font-style: italic;
}

.default-backend-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

/* Config Modal */
.config-modal-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.config-section h4 {
  margin: 0 0 var(--spacing-xs) 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
}

.config-hint {
  margin: 0 0 var(--spacing-md) 0;
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
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.backend-checkbox:hover {
  background-color: var(--color-bg-secondary);
}

.backend-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-text-primary);
}

.connection-dot-sm {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.connection-dot-sm.online {
  background-color: var(--color-success);
}

.connection-dot-sm.offline {
  background-color: var(--color-danger);
}

.config-select {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
}

.config-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-light, rgba(0, 123, 255, 0.25));
}

.config-error {
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
}

/* Responsive */
@media (max-width: 768px) {
  .terminal-backends-page {
    padding: var(--spacing-md);
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .backends-grid {
    grid-template-columns: 1fr;
  }

  .org-table th,
  .org-table td {
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-sm);
  }
}
</style>
