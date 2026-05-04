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

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="search-wrapper">
        <i class="fas fa-search search-icon"></i>
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          :placeholder="t('adminUsers.searchPlaceholder')"
        />
      </div>
      <span class="user-count">
        {{ filteredUsers.length }} / {{ users.length }}
      </span>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin fa-3x"></i>
      <p>{{ t('adminUsers.loading') }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <i class="fas fa-exclamation-triangle fa-3x"></i>
      <p>{{ error }}</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredUsers.length === 0" class="empty-state">
      <i class="fas fa-users fa-3x"></i>
      <p>{{ t('adminUsers.noUsers') }}</p>
    </div>

    <!-- Users Table -->
    <div v-else class="table-wrapper">
      <table class="users-table">
        <thead>
          <tr>
            <th
              class="sortable-header"
              data-sort="display_name"
              @click="toggleSort('display_name')"
            >
              {{ t('adminUsers.colUser') }}
              <i :class="getSortIcon('display_name')"></i>
            </th>
            <th
              class="sortable-header"
              data-sort="email"
              @click="toggleSort('email')"
            >
              {{ t('adminUsers.colEmail') }}
              <i :class="getSortIcon('email')"></i>
            </th>
            <th
              class="sortable-header"
              data-sort="is_active"
              @click="toggleSort('is_active')"
            >
              {{ t('adminUsers.colStatus') }}
              <i :class="getSortIcon('is_active')"></i>
            </th>
            <th
              class="sortable-header"
              data-sort="is_admin"
              @click="toggleSort('is_admin')"
            >
              {{ t('adminUsers.colRole') }}
              <i :class="getSortIcon('is_admin')"></i>
            </th>
            <th
              class="sortable-header"
              data-sort="org_count"
              @click="toggleSort('org_count')"
            >
              {{ t('adminUsers.colOrganizations') }}
              <i :class="getSortIcon('org_count')"></i>
            </th>
            <th
              class="sortable-header"
              data-sort="group_count"
              @click="toggleSort('group_count')"
            >
              {{ t('adminUsers.colGroups') }}
              <i :class="getSortIcon('group_count')"></i>
            </th>
            <th>{{ t('adminUsers.colActions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.id">
            <td>
              <div class="user-cell">
                <span class="user-display">{{ user.display_name || user.username }}</span>
                <span class="user-username">@{{ user.username }}</span>
              </div>
            </td>
            <td class="email-cell">{{ user.email }}</td>
            <td>
              <span :class="['status-badge', user.is_active ? 'status-active' : 'status-inactive']">
                {{ user.is_active ? t('adminUsers.statusActive') : t('adminUsers.statusInactive') }}
              </span>
            </td>
            <td>
              <span v-if="!user.is_admin" class="role-badge role-member">
                {{ t('adminUsers.roleMember') }}
              </span>
              <AdminBadge v-else />
            </td>
            <td>
              <div v-if="user.organizations.length > 0" class="chip-list">
                <span v-for="org in user.organizations" :key="org.id" class="chip">
                  <span class="chip-name">{{ org.name }}</span>
                  <span class="chip-role">{{ org.role }}</span>
                </span>
              </div>
              <span v-else class="text-muted text-italic">{{ t('adminUsers.none') }}</span>
            </td>
            <td>
              <div v-if="user.groups.length > 0" class="chip-list">
                <span v-for="group in user.groups" :key="group.id" class="chip">
                  <span class="chip-name">{{ group.name }}</span>
                  <span class="chip-role">{{ group.role }}</span>
                </span>
              </div>
              <span v-else class="text-muted text-italic">{{ t('adminUsers.none') }}</span>
            </td>
            <td class="actions-cell">
              <button
                type="button"
                class="impersonate-btn"
                :disabled="isImpersonateDisabled(user.id)"
                :title="impersonateButtonTitle(user.id)"
                @click="openConfirmModal(user)"
              >
                <i class="fas fa-user-secret"></i>
                {{ t('adminUsers.impersonate') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

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
import { useRouter } from 'vue-router'
import { useTranslations } from '../../../composables/useTranslations'
import { useImpersonationStore } from '../../../stores/impersonation'
import { useCurrentUserStore } from '../../../stores/currentUser'
import { adminUsersService, type AdminUserListing } from '../../../services/admin/usersService'
import BaseModal from '../../Modals/BaseModal.vue'
import AdminBadge from '../../Common/AdminBadge.vue'

const { t } = useTranslations({
  en: {
    adminUsers: {
      pageTitle: 'User management',
      pageSubtitle: 'Browse all users with their org and group memberships, and impersonate any user for debugging.',
      searchPlaceholder: 'Search by name, email, organization or group...',
      loading: 'Loading users...',
      loadError: 'Failed to load users',
      noUsers: 'No users found',
      colUser: 'User',
      colEmail: 'Email',
      colStatus: 'Status',
      colRole: 'Role',
      colOrganizations: 'Organizations',
      colGroups: 'Groups',
      colActions: 'Actions',
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
      loading: 'Chargement des utilisateurs...',
      loadError: 'Echec du chargement des utilisateurs',
      noUsers: 'Aucun utilisateur trouvé',
      colUser: 'Utilisateur',
      colEmail: 'Email',
      colStatus: 'Statut',
      colRole: 'Rôle',
      colOrganizations: 'Organisations',
      colGroups: 'Groupes',
      colActions: 'Actions',
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

const router = useRouter()
const impersonationStore = useImpersonationStore()
const currentUserStore = useCurrentUserStore()

type SortColumn =
  | 'display_name'
  | 'email'
  | 'is_active'
  | 'is_admin'
  | 'org_count'
  | 'group_count'

interface SortState {
  column: SortColumn
  direction: 'asc' | 'desc'
}

// State
const users = ref<AdminUserListing[]>([])
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')
const sortState = ref<SortState>({ column: 'display_name', direction: 'asc' })

// Modal state
const showConfirmModal = ref(false)
const targetUser = ref<AdminUserListing | null>(null)
const starting = ref(false)
const confirmError = ref('')

// Helpers
function getSortIcon(column: SortColumn): string {
  if (sortState.value.column !== column) return 'fas fa-sort'
  return sortState.value.direction === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'
}

function toggleSort(column: SortColumn) {
  if (sortState.value.column === column) {
    sortState.value.direction = sortState.value.direction === 'asc' ? 'desc' : 'asc'
  } else {
    sortState.value.column = column
    sortState.value.direction = 'asc'
  }
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

const filteredUsers = computed(() => {
  let list = [...users.value]

  // Search filter
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(u => {
      if (u.username?.toLowerCase().includes(q)) return true
      if (u.display_name?.toLowerCase().includes(q)) return true
      if (u.email?.toLowerCase().includes(q)) return true
      if (u.organizations?.some(o => o.name?.toLowerCase().includes(q))) return true
      if (u.groups?.some(g => g.name?.toLowerCase().includes(q))) return true
      return false
    })
  }

  // Sort
  const { column, direction } = sortState.value
  list.sort((a, b) => {
    let va: string | number
    let vb: string | number
    switch (column) {
      case 'display_name':
        va = (a.display_name || a.username || '').toLowerCase()
        vb = (b.display_name || b.username || '').toLowerCase()
        break
      case 'email':
        va = (a.email || '').toLowerCase()
        vb = (b.email || '').toLowerCase()
        break
      case 'is_active':
        va = a.is_active ? 1 : 0
        vb = b.is_active ? 1 : 0
        break
      case 'is_admin':
        va = a.is_admin ? 1 : 0
        vb = b.is_admin ? 1 : 0
        break
      case 'org_count':
        va = a.organizations?.length || 0
        vb = b.organizations?.length || 0
        break
      case 'group_count':
        va = a.groups?.length || 0
        vb = b.groups?.length || 0
        break
      default:
        return 0
    }
    const cmp = typeof va === 'number' && typeof vb === 'number'
      ? va - vb
      : String(va).localeCompare(String(vb))
    return direction === 'asc' ? cmp : -cmp
  })

  return list
})

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
    await router.push('/')
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
  min-width: 240px;
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

.user-count {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  white-space: nowrap;
  font-weight: var(--font-weight-medium);
}

/* Table */
.table-wrapper {
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--color-bg-primary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
}

.users-table thead {
  background: var(--color-bg-secondary);
}

.users-table th {
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

.users-table td {
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: var(--border-width-thin) solid var(--color-border-light);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  vertical-align: middle;
}

.users-table tbody tr:hover {
  background: var(--color-bg-secondary);
}

.users-table tbody tr:last-child td {
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

/* Actions cell */
.actions-cell {
  white-space: nowrap;
}

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

/* States */
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

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-wrapper {
    min-width: unset;
  }

  .users-table th,
  .users-table td {
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-sm);
  }
}
</style>
