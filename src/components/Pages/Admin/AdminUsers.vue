<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
-->

<template>
  <div class="admin-users-page">
    <div class="page-header">
      <h2><i class="fas fa-users-cog"></i> {{ t('adminUsers.pageTitle') }}</h2>
      <p class="page-subtitle">{{ t('adminUsers.pageSubtitle') }}</p>
    </div>

    <EntityTable
      :columns="columns"
      :rows="users"
      :loading="loading"
      :error="error"
      searchable
      show-count
      :search-filter="searchFilter"
      :search-placeholder="t('adminUsers.searchPlaceholder')"
      :initial-sort="initialSort"
      empty-icon="fa-users"
      :empty-text="t('adminUsers.noUsers')"
    >
      <template #cell-display_name="{ row }">
        <div class="user-cell">
          <span class="user-display">{{ row.display_name || row.username }}</span>
          <span class="user-username">@{{ row.username }}</span>
        </div>
      </template>

      <template #cell-email="{ row }">
        <span class="email-cell">{{ row.email }}</span>
      </template>

      <template #cell-is_active="{ row }">
        <span :class="['status-badge', row.is_active ? 'status-active' : 'status-inactive']">
          {{ row.is_active ? t('adminUsers.statusActive') : t('adminUsers.statusInactive') }}
        </span>
      </template>

      <template #cell-is_admin="{ row }">
        <span v-if="!row.is_admin" class="role-badge role-member">
          {{ t('adminUsers.roleMember') }}
        </span>
        <AdminBadge v-else />
      </template>

      <template #cell-organizations="{ row }">
        <div v-if="row.organizations.length > 0" class="chip-list">
          <span v-for="org in row.organizations" :key="org.id" class="chip">
            <span class="chip-name">{{ org.name }}</span>
            <span class="chip-role">{{ org.role }}</span>
          </span>
        </div>
        <span v-else class="text-muted text-italic">{{ t('adminUsers.none') }}</span>
      </template>

      <template #cell-groups="{ row }">
        <div v-if="row.groups.length > 0" class="chip-list">
          <span v-for="group in row.groups" :key="group.id" class="chip">
            <span class="chip-name">{{ group.name }}</span>
            <span class="chip-role">{{ group.role }}</span>
          </span>
        </div>
        <span v-else class="text-muted text-italic">{{ t('adminUsers.none') }}</span>
      </template>

      <template #row-actions="{ row }">
        <button
          type="button"
          class="impersonate-btn"
          :disabled="isImpersonateDisabled(row.id)"
          :title="impersonateButtonTitle(row.id)"
          @click="openConfirmModal(row)"
        >
          <i class="fas fa-user-secret"></i>
          {{ t('adminUsers.impersonate') }}
        </button>
      </template>
    </EntityTable>

    <!-- Confirmation Modal -->
    <BaseModal
      :visible="showConfirmModal"
      :title="confirmTitle"
      title-icon="fas fa-user-secret"
      size="medium"
      :is-loading="starting"
      :loading-text="t('adminUsers.modal.starting')"
      @close="closeConfirmModal"
    >
      <div class="confirm-modal-content">
        <p class="confirm-warning">
          <i class="fas fa-exclamation-triangle"></i>
          {{ t('adminUsers.modal.warning') }}
        </p>
        <ul class="confirm-bullets">
          <li>{{ t('adminUsers.modal.bulletScope') }}</li>
          <li>{{ t('adminUsers.modal.bulletExpiry') }}</li>
          <li>{{ t('adminUsers.modal.bulletAudit') }}</li>
          <li>{{ t('adminUsers.modal.bulletNoChain') }}</li>
        </ul>
        <div v-if="confirmError" class="confirm-error">
          <i class="fas fa-exclamation-circle"></i>
          {{ confirmError }}
        </div>
      </div>
      <template #footer>
        <button
          type="button"
          class="btn btn-secondary impersonate-cancel"
          :disabled="starting"
          @click="closeConfirmModal"
        >
          {{ t('adminUsers.modal.cancel') }}
        </button>
        <button
          type="button"
          class="btn btn-primary impersonate-confirm"
          :disabled="starting"
          @click="confirmImpersonate"
        >
          <i v-if="starting" class="fas fa-spinner fa-spin"></i>
          {{ t('adminUsers.modal.confirm') }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTranslations } from '../../../composables/useTranslations'
import { type SortState } from '../../../composables/useClientTable'
import type { TableColumn } from '../../../utils/tableColumns'
import { useImpersonationStore } from '../../../stores/impersonation'
import { useCurrentUserStore } from '../../../stores/currentUser'
import { adminUsersService, type AdminUserListing } from '../../../services/admin/usersService'
import EntityTable from '../../Generic/EntityTable.vue'
import BaseModal from '../../Modals/BaseModal.vue'
import AdminBadge from '../../Common/AdminBadge.vue'

const { t } = useTranslations({
  en: {
    adminUsers: {
      pageTitle: 'User management',
      pageSubtitle: 'Browse all users with their org and group memberships, and impersonate any user for debugging.',
      searchPlaceholder: 'Search by name, email, organization or group...',
      loadError: 'Failed to load users',
      noUsers: 'No users found',
      colUser: 'User',
      colEmail: 'Email',
      colStatus: 'Status',
      colRole: 'Role',
      colOrganizations: 'Organizations',
      colGroups: 'Groups',
      statusActive: 'Active',
      statusInactive: 'Disabled',
      roleMember: 'Member',
      none: 'None',
      impersonate: 'Impersonate',
      impersonateDisabledBusy: 'An impersonation session is already active',
      impersonateDisabledSelf: 'You cannot impersonate yourself',
      modal: {
        title: 'Impersonate {name}?',
        warning: 'You are about to act on behalf of another user.',
        bulletScope: 'Impersonation is scoped to this browser tab only.',
        bulletExpiry: 'The session auto-expires after 30 minutes of inactivity.',
        bulletAudit: 'All actions you take will be logged under your administrator identity.',
        bulletNoChain: 'You cannot start a new impersonation while this one is active.',
        cancel: 'Cancel',
        confirm: 'Start impersonation',
        starting: 'Starting impersonation...',
        startError: 'Failed to start impersonation'
      }
    }
  },
  fr: {
    adminUsers: {
      pageTitle: 'Gestion des utilisateurs',
      pageSubtitle: 'Parcourez tous les utilisateurs avec leurs appartenances organisations/groupes, et incarnez n’importe quel utilisateur pour le débogage.',
      searchPlaceholder: 'Rechercher par nom, email, organisation ou groupe...',
      loadError: 'Echec du chargement des utilisateurs',
      noUsers: 'Aucun utilisateur trouvé',
      colUser: 'Utilisateur',
      colEmail: 'Email',
      colStatus: 'Statut',
      colRole: 'Rôle',
      colOrganizations: 'Organisations',
      colGroups: 'Groupes',
      statusActive: 'Actif',
      statusInactive: 'Désactivé',
      roleMember: 'Membre',
      none: 'Aucune',
      impersonate: 'Incarner',
      impersonateDisabledBusy: 'Une session d’incarnation est déjà active',
      impersonateDisabledSelf: 'Vous ne pouvez pas vous incarner vous-même',
      modal: {
        title: 'Incarner {name} ?',
        warning: 'Vous êtes sur le point d’agir au nom d’un autre utilisateur.',
        bulletScope: 'L’incarnation est limitée à cet onglet de navigateur.',
        bulletExpiry: 'La session expire automatiquement après 30 minutes d’inactivité.',
        bulletAudit: 'Toutes vos actions seront journalisées sous votre identité administrateur.',
        bulletNoChain: 'Vous ne pouvez pas démarrer une nouvelle incarnation tant que celle-ci est active.',
        cancel: 'Annuler',
        confirm: 'Démarrer l’incarnation',
        starting: 'Démarrage de l’incarnation...',
        startError: 'Echec du démarrage de l’incarnation'
      }
    }
  }
})

const impersonationStore = useImpersonationStore()
const currentUserStore = useCurrentUserStore()

// State
const users = ref<AdminUserListing[]>([])
const loading = ref(false)
const error = ref('')

// Modal state
const showConfirmModal = ref(false)
const targetUser = ref<AdminUserListing | null>(null)
const starting = ref(false)
const confirmError = ref('')

const initialSort: SortState = { key: 'display_name', dir: 'asc' }

const columns = computed<TableColumn<AdminUserListing>[]>(() => [
  {
    key: 'display_name',
    label: t('adminUsers.colUser'),
    sortable: true,
    sortValue: (u) => (u.display_name || u.username || '').toLowerCase()
  },
  {
    key: 'email',
    label: t('adminUsers.colEmail'),
    sortable: true,
    sortValue: (u) => (u.email || '').toLowerCase()
  },
  {
    key: 'is_active',
    label: t('adminUsers.colStatus'),
    sortable: true,
    sortValue: (u) => (u.is_active ? 1 : 0)
  },
  {
    key: 'is_admin',
    label: t('adminUsers.colRole'),
    sortable: true,
    sortValue: (u) => (u.is_admin ? 1 : 0)
  },
  {
    key: 'organizations',
    label: t('adminUsers.colOrganizations'),
    sortable: true,
    sortValue: (u) => u.organizations?.length || 0
  },
  {
    key: 'groups',
    label: t('adminUsers.colGroups'),
    sortable: true,
    sortValue: (u) => u.groups?.length || 0
  }
])

function searchFilter(user: AdminUserListing, query: string): boolean {
  const q = query.toLowerCase()
  if (user.username?.toLowerCase().includes(q)) return true
  if (user.display_name?.toLowerCase().includes(q)) return true
  if (user.email?.toLowerCase().includes(q)) return true
  if (user.organizations?.some((o) => o.name?.toLowerCase().includes(q))) return true
  if (user.groups?.some((g) => g.name?.toLowerCase().includes(q))) return true
  return false
}

function isImpersonateDisabled(userId: string): boolean {
  if (impersonationStore.isImpersonating) return true
  if (userId === currentUserStore.userId) return true
  return false
}

function impersonateButtonTitle(userId: string): string {
  if (impersonationStore.isImpersonating) return t('adminUsers.impersonateDisabledBusy')
  if (userId === currentUserStore.userId) return t('adminUsers.impersonateDisabledSelf')
  return ''
}

const confirmTitle = computed(() => {
  const name = targetUser.value?.display_name || targetUser.value?.username || ''
  return t('adminUsers.modal.title').replace('{name}', name)
})

// Modal actions
function openConfirmModal(user: AdminUserListing) {
  if (isImpersonateDisabled(user.id)) return
  targetUser.value = user
  confirmError.value = ''
  showConfirmModal.value = true
}

function closeConfirmModal() {
  if (starting.value) return
  showConfirmModal.value = false
  targetUser.value = null
  confirmError.value = ''
}

async function confirmImpersonate() {
  if (!targetUser.value) return
  starting.value = true
  confirmError.value = ''
  try {
    await impersonationStore.start(targetUser.value.id)
    showConfirmModal.value = false
    targetUser.value = null
    // Full reload so all Pinia stores re-initialize under the impersonated identity.
    // SPA navigation would keep admin's cached store state (current org, permissions,
    // organization list, terminals, etc.) and break the UI in unpredictable ways.
    window.location.href = '/'
  } catch (err: any) {
    confirmError.value =
      err?.response?.data?.error_message ||
      err?.response?.data?.message ||
      t('adminUsers.modal.startError')
  } finally {
    starting.value = false
  }
}

// Data load
onMounted(async () => {
  loading.value = true
  error.value = ''
  try {
    users.value = await adminUsersService.fetchAll()
  } catch (err: any) {
    error.value =
      err?.response?.data?.error_message ||
      err?.response?.data?.message ||
      t('adminUsers.loadError')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.admin-users-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.page-header {
  margin-bottom: var(--spacing-xl);
}

.page-header h2 {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--color-text-primary);
  font-size: 2rem;
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.page-subtitle {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-base);
}

/* User cell */
.user-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-display {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.user-username {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.email-cell {
  color: var(--color-text-secondary);
}

/* Status badge */
.status-badge {
  display: inline-block;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  padding: 2px var(--spacing-sm);
  border-radius: var(--border-radius-full);
  text-transform: capitalize;
}

.status-active {
  background-color: var(--color-success-bg);
  color: var(--color-success-text);
  border: 1px solid var(--color-success-border);
}

.status-inactive {
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border-medium);
}

/* Role badge */
.role-badge {
  display: inline-block;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  padding: 2px var(--spacing-sm);
  border-radius: var(--border-radius-full);
  text-transform: capitalize;
}

.role-member {
  background-color: var(--color-info-bg);
  color: var(--color-info-text);
  border: 1px solid var(--color-info-border);
}

/* Membership chips */
.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 2px var(--spacing-sm);
  border-radius: var(--border-radius-full);
  background-color: var(--color-bg-secondary);
  border: var(--border-width-thin) solid var(--color-border-light);
  font-size: var(--font-size-xs);
}

.chip-name {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}

.chip-role {
  color: var(--color-text-muted);
  font-style: italic;
}

/* Text helpers */
.text-muted {
  color: var(--color-text-muted);
}

.text-italic {
  font-style: italic;
}

/* Impersonate button */
.impersonate-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-md);
  border: 1px solid var(--color-primary);
  border-radius: var(--border-radius-md);
  background: var(--color-bg-primary);
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.impersonate-btn:hover:not(:disabled) {
  background: var(--color-primary);
  color: var(--color-bg-primary);
}

.impersonate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Confirmation modal */
.confirm-modal-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.confirm-warning {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin: 0;
  padding: var(--spacing-md);
  border-radius: var(--border-radius-sm);
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
  border: 1px solid var(--color-warning-border);
  font-weight: var(--font-weight-medium);
}

.confirm-bullets {
  margin: 0;
  padding-left: var(--spacing-xl);
  color: var(--color-text-primary);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.confirm-error {
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
  .admin-users-page {
    padding: var(--spacing-md);
  }
}
</style>
