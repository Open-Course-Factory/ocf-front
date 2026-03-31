<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */
-->

<template>
  <div class="security-admin-page">
    <div class="page-header">
      <div>
        <h2>{{ t('securityAdmin.pageTitle') }}</h2>
        <p class="page-description">{{ t('securityAdmin.pageDescription') }}</p>
      </div>
    </div>

    <!-- Tab Bar -->
    <div class="tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-button"
        :class="{ active: activeTab === tab.key }"
        @click="switchTab(tab.key)"
      >
        <i :class="tab.icon"></i>
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="store.isLoading" class="loading-state">
      <i class="fas fa-spinner fa-spin fa-2x"></i>
      <p>{{ t('securityAdmin.loading') }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="store.error" class="error-state">
      <i class="fas fa-exclamation-triangle fa-2x"></i>
      <p>{{ store.error }}</p>
      <Button variant="primary" @click="refreshCurrentTab">
        {{ t('securityAdmin.refresh') }}
      </Button>
    </div>

    <!-- Tab 1: Policy Overview -->
    <div v-else-if="activeTab === 'policies'">
      <div v-if="store.policyOverview" class="tab-content">
        <div class="total-badge">
          {{ t('securityAdmin.totalPolicies') }}: <strong>{{ store.policyOverview.total_policies }}</strong>
        </div>

        <!-- Role Policies -->
        <div class="section">
          <h3 class="section-title">{{ t('securityAdmin.rolePolicies') }}</h3>
          <div v-if="store.policyOverview.role_policies.length === 0" class="empty-state">
            {{ t('securityAdmin.noPolicies') }}
          </div>
          <div v-for="subject in store.policyOverview.role_policies" :key="subject.subject" class="subject-card">
            <div class="subject-header" @click="toggleSubject('role-' + subject.subject)">
              <i class="fas fa-chevron-right chevron" :class="{ rotated: expandedSubjects['role-' + subject.subject] }"></i>
              <div class="subject-info">
                <span class="subject-name">{{ subject.subject_name || subject.subject }}</span>
                <span v-if="subject.subject_name" class="subject-id" :title="subject.subject">{{ subject.subject }}</span>
              </div>
              <span class="policy-count">{{ subject.policies.length }}</span>
            </div>
            <div v-if="expandedSubjects['role-' + subject.subject]" class="subject-content">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>{{ t('securityAdmin.resource') }}</th>
                    <th>{{ t('securityAdmin.methods') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="policy in subject.policies" :key="policy.resource">
                    <td class="resource-cell">
                      <span class="resource-path">{{ policy.resource }}</span>
                      <span v-if="policy.resource_name" class="resource-resolved-name">
                        {{ policy.resource_name }}
                      </span>
                    </td>
                    <td>
                      <span
                        v-for="method in policy.methods"
                        :key="method"
                        class="method-badge"
                        :class="getMethodClass(method)"
                      >{{ method }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- User Policies -->
        <div class="section">
          <h3 class="section-title">{{ t('securityAdmin.userPolicies') }}</h3>
          <div v-if="store.policyOverview.user_policies.length === 0" class="empty-state">
            {{ t('securityAdmin.noPolicies') }}
          </div>
          <div v-for="subject in store.policyOverview.user_policies" :key="subject.subject" class="subject-card">
            <div class="subject-header" @click="toggleSubject('user-' + subject.subject)">
              <i class="fas fa-chevron-right chevron" :class="{ rotated: expandedSubjects['user-' + subject.subject] }"></i>
              <div class="subject-info">
                <span class="subject-name">{{ subject.subject_name || subject.subject }}</span>
                <span v-if="subject.subject_name" class="subject-id" :title="subject.subject">{{ subject.subject }}</span>
              </div>
              <span class="policy-count">{{ subject.policies.length }}</span>
            </div>
            <div v-if="expandedSubjects['user-' + subject.subject]" class="subject-content">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>{{ t('securityAdmin.resource') }}</th>
                    <th>{{ t('securityAdmin.methods') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="policy in subject.policies" :key="policy.resource">
                    <td class="resource-cell">
                      <span class="resource-path">{{ policy.resource }}</span>
                      <span v-if="policy.resource_name" class="resource-resolved-name">
                        {{ policy.resource_name }}
                      </span>
                    </td>
                    <td>
                      <span
                        v-for="method in policy.methods"
                        :key="method"
                        class="method-badge"
                        :class="getMethodClass(method)"
                      >{{ method }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">{{ t('securityAdmin.noData') }}</div>
    </div>

    <!-- Tab 2: User Permission Lookup -->
    <div v-else-if="activeTab === 'user'" class="tab-content">
      <div class="search-bar">
        <div class="user-search-container">
          <input
            v-model="userSearchQuery"
            type="text"
            class="search-input"
            :placeholder="t('securityAdmin.searchUser')"
            @input="onUserSearchInput"
            @focus="onUserSearchFocus"
            @blur="onUserSearchBlur"
            @keyup.enter="searchUserPermissions"
          />
          <div v-if="showUserSearchDropdown && (userSearchResults.length > 0 || isSearchingUsers || userSearchQuery.trim().length >= 2)" class="search-dropdown">
            <div v-if="isSearchingUsers" class="search-loading">
              <i class="fas fa-spinner fa-spin"></i>
              {{ t('securityAdmin.searchingUsers') }}
            </div>
            <div v-else-if="userSearchResults.length === 0 && userSearchQuery.trim()" class="search-empty">
              {{ t('securityAdmin.noUserFound') }}
            </div>
            <div
              v-for="user in userSearchResults"
              :key="user.id"
              class="search-result"
              @click="selectUser(user)"
            >
              <div class="user-info">
                <div class="user-name">{{ user.name }}</div>
                <div class="user-email" v-if="user.email">{{ user.email }}</div>
              </div>
            </div>
          </div>
        </div>
        <Button variant="primary" @click="searchUserPermissions" :disabled="!userSearchId.trim() && !userSearchQuery.trim()">
          <i class="fas fa-search"></i>
          {{ t('securityAdmin.search') }}
        </Button>
      </div>

      <div v-if="store.userPermissions" class="user-results">
        <!-- System Admin Badge -->
        <div v-if="store.userPermissions.is_system_admin" class="admin-badge">
          <i class="fas fa-shield-alt"></i>
          {{ t('securityAdmin.systemAdmin') }}
        </div>

        <!-- Roles -->
        <div v-if="store.userPermissions.roles.length > 0" class="result-section">
          <h4>{{ t('securityAdmin.roles') }}</h4>
          <div class="badge-list">
            <span v-for="role in store.userPermissions.roles" :key="role" class="role-badge">{{ role }}</span>
          </div>
        </div>

        <!-- Flags -->
        <div class="result-section flags-row">
          <span class="flag-item">
            {{ t('securityAdmin.canCreateOrg') }}:
            <strong :class="store.userPermissions.can_create_organization ? 'flag-yes' : 'flag-no'">
              {{ store.userPermissions.can_create_organization ? t('securityAdmin.yes') : t('securityAdmin.no') }}
            </strong>
          </span>
          <span class="flag-item">
            {{ t('securityAdmin.canCreateGroup') }}:
            <strong :class="store.userPermissions.can_create_group ? 'flag-yes' : 'flag-no'">
              {{ store.userPermissions.can_create_group ? t('securityAdmin.yes') : t('securityAdmin.no') }}
            </strong>
          </span>
          <span class="flag-item">
            {{ t('securityAdmin.hasSubscription') }}:
            <strong :class="store.userPermissions.has_any_subscription ? 'flag-yes' : 'flag-no'">
              {{ store.userPermissions.has_any_subscription ? t('securityAdmin.yes') : t('securityAdmin.no') }}
            </strong>
          </span>
        </div>

        <!-- Permissions -->
        <div class="result-section">
          <h4>{{ t('securityAdmin.permissions') }}</h4>
          <table v-if="store.userPermissions.permissions.length > 0" class="data-table">
            <thead>
              <tr>
                <th>{{ t('securityAdmin.resource') }}</th>
                <th>{{ t('securityAdmin.methods') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="perm in store.userPermissions.permissions" :key="perm.resource">
                <td class="resource-cell">
                  <span class="resource-path">{{ perm.resource }}</span>
                  <span v-if="perm.resource_name" class="resource-resolved-name">
                    {{ perm.resource_name }}
                  </span>
                </td>
                <td>
                  <span
                    v-for="method in perm.methods"
                    :key="method"
                    class="method-badge"
                    :class="getMethodClass(method)"
                  >{{ method }}</span>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-state">{{ t('securityAdmin.noData') }}</div>
        </div>

        <!-- Features -->
        <div v-if="store.userPermissions.aggregated_features.length > 0" class="result-section">
          <h4>{{ t('securityAdmin.features') }}</h4>
          <div class="badge-list">
            <span v-for="feature in store.userPermissions.aggregated_features" :key="feature" class="feature-badge">{{ feature }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 3: Entity Role Matrix -->
    <div v-else-if="activeTab === 'matrix'">
      <div v-if="store.entityRoleMatrix && store.entityRoleMatrix.entities.length > 0" class="tab-content matrix-content">
        <div class="table-wrapper">
          <table class="data-table matrix-table">
            <thead>
              <tr>
                <th class="sticky-col">{{ t('securityAdmin.entity') }}</th>
                <th v-for="role in allRoles" :key="role">{{ role }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entity in store.entityRoleMatrix.entities" :key="entity.entity_name">
                <td class="sticky-col resource-cell">{{ entity.entity_name }}</td>
                <td v-for="role in allRoles" :key="role" class="matrix-cell">
                  <span
                    v-for="method in (entity.role_methods[role] || [])"
                    :key="method"
                    class="method-badge method-badge-sm"
                    :class="getMethodClass(method)"
                  >{{ method }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else class="empty-state">{{ t('securityAdmin.noData') }}</div>
    </div>

    <!-- Tab 4: Health Checks -->
    <div v-else-if="activeTab === 'health'">
      <div v-if="store.healthChecks" class="tab-content">
        <!-- Summary Bar -->
        <div class="health-summary">
          <div class="summary-item severity-high">
            <span class="summary-count">{{ store.healthChecks.summary.high_count }}</span>
            <span class="summary-label">{{ t('securityAdmin.high') }}</span>
          </div>
          <div class="summary-item severity-medium">
            <span class="summary-count">{{ store.healthChecks.summary.medium_count }}</span>
            <span class="summary-label">{{ t('securityAdmin.medium') }}</span>
          </div>
          <div class="summary-item severity-low">
            <span class="summary-count">{{ store.healthChecks.summary.low_count }}</span>
            <span class="summary-label">{{ t('securityAdmin.low') }}</span>
          </div>
          <div class="summary-item severity-info">
            <span class="summary-count">{{ store.healthChecks.summary.info_count }}</span>
            <span class="summary-label">{{ t('securityAdmin.info') }}</span>
          </div>
        </div>

        <!-- Findings -->
        <div v-if="store.healthChecks.findings.length === 0" class="empty-state success-state">
          <i class="fas fa-check-circle fa-2x"></i>
          <p>{{ t('securityAdmin.noFindings') }}</p>
        </div>
        <div v-for="(finding, index) in store.healthChecks.findings" :key="finding.severity + '-' + finding.category + '-' + index" class="finding-card" :class="'finding-' + finding.severity">
          <div class="finding-header">
            <span class="severity-badge" :class="'severity-' + finding.severity">{{ t('securityAdmin.' + finding.severity) }}</span>
            <span class="finding-category">{{ finding.category }}</span>
          </div>
          <p class="finding-description">{{ finding.description }}</p>
          <p v-if="finding.details" class="finding-details">{{ finding.details }}</p>
        </div>
      </div>
      <div v-else class="empty-state">{{ t('securityAdmin.noData') }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSecurityAdminStore } from '../../../stores/securityAdmin'
import { userService } from '../../../services/domain/user/userService'
import type { User } from '../../../services/domain/user/userService'
import Button from '../../UI/Button.vue'

const { t } = useI18n()

const store = useSecurityAdminStore()
const activeTab = ref<'policies' | 'user' | 'matrix' | 'health'>('policies')
const userSearchId = ref('')
const userSearchQuery = ref('')
const userSearchResults = ref<User[]>([])
const isSearchingUsers = ref(false)
const showUserSearchDropdown = ref(false)
const expandedSubjects = ref<Record<string, boolean>>({})

const tabs = computed(() => [
  { key: 'policies' as const, label: t('securityAdmin.policyOverview'), icon: 'fas fa-list-alt' },
  { key: 'user' as const, label: t('securityAdmin.userPermissions'), icon: 'fas fa-user-lock' },
  { key: 'matrix' as const, label: t('securityAdmin.entityRoles'), icon: 'fas fa-table' },
  { key: 'health' as const, label: t('securityAdmin.healthChecks'), icon: 'fas fa-heartbeat' }
])

// Collect all unique roles from the entity role matrix
const allRoles = computed(() => {
  if (!store.entityRoleMatrix) return []
  const roles = new Set<string>()
  for (const entity of store.entityRoleMatrix.entities) {
    for (const role of Object.keys(entity.role_methods)) {
      roles.add(role)
    }
  }
  return Array.from(roles).sort()
})

function switchTab(tab: typeof activeTab.value) {
  activeTab.value = tab
  if (tab === 'policies' && !store.policyOverview) {
    store.fetchPolicyOverview()
  } else if (tab === 'matrix' && !store.entityRoleMatrix) {
    store.fetchEntityRoleMatrix()
  } else if (tab === 'health' && !store.healthChecks) {
    store.fetchHealthChecks()
  }
}

function refreshCurrentTab() {
  store.error = ''
  if (activeTab.value === 'policies') store.fetchPolicyOverview()
  else if (activeTab.value === 'user' && userSearchId.value) store.fetchUserPermissions(userSearchId.value)
  else if (activeTab.value === 'matrix') store.fetchEntityRoleMatrix()
  else if (activeTab.value === 'health') store.fetchHealthChecks()
}

function searchUserPermissions() {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const query = userSearchQuery.value.trim()
  if (uuidRegex.test(query)) {
    store.fetchUserPermissions(query)
  } else if (userSearchId.value.trim()) {
    store.fetchUserPermissions(userSearchId.value.trim())
  }
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null

async function onUserSearchInput() {
  const query = userSearchQuery.value.trim()
  userSearchId.value = ''

  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  if (query.length < 2) {
    userSearchResults.value = []
    showUserSearchDropdown.value = false
    return
  }

  showUserSearchDropdown.value = true
  isSearchingUsers.value = true

  searchTimeout = setTimeout(async () => {
    try {
      userSearchResults.value = await userService.searchUsers(query)
    } catch {
      userSearchResults.value = []
    } finally {
      isSearchingUsers.value = false
    }
  }, 300)
}

function selectUser(user: User) {
  userSearchId.value = user.id
  userSearchQuery.value = user.name + (user.email ? ' (' + user.email + ')' : '')
  showUserSearchDropdown.value = false
  searchUserPermissions()
}

function onUserSearchBlur() {
  setTimeout(() => {
    showUserSearchDropdown.value = false
  }, 200)
}

function onUserSearchFocus() {
  if (userSearchResults.value.length > 0) {
    showUserSearchDropdown.value = true
  }
}

function toggleSubject(key: string) {
  expandedSubjects.value[key] = !expandedSubjects.value[key]
}

function getMethodClass(method: string): string {
  switch (method.toUpperCase()) {
    case 'GET': return 'method-get'
    case 'POST': return 'method-post'
    case 'PATCH': case 'PUT': return 'method-patch'
    case 'DELETE': return 'method-delete'
    default: return 'method-default'
  }
}

onMounted(() => {
  store.fetchPolicyOverview()
})

onUnmounted(() => {
  if (searchTimeout) clearTimeout(searchTimeout)
})
</script>

<style scoped>
.security-admin-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.page-header {
  margin-bottom: var(--spacing-xl);
}

.page-header h2 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 2rem;
}

.page-description {
  margin: var(--spacing-xs) 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

/* Tab Bar */
.tab-bar {
  display: flex;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-xl);
  border-bottom: 2px solid var(--color-border-light);
  padding-bottom: 0;
  overflow-x: auto;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;
  white-space: nowrap;
  margin-bottom: -2px;
}

.tab-button:hover {
  color: var(--color-text-primary);
}

.tab-button.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}

.tab-button i {
  font-size: var(--font-size-sm);
}

/* Tab Content */
.tab-content {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Total Badge */
.total-badge {
  display: inline-block;
  padding: var(--spacing-sm) var(--spacing-lg);
  background-color: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-lg);
}

.total-badge strong {
  color: var(--color-text-primary);
}

/* Sections */
.section {
  margin-bottom: var(--spacing-xl);
}

.section-title {
  margin: 0 0 var(--spacing-md);
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

/* Subject Cards (collapsible) */
.subject-card {
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-sm);
  overflow: hidden;
}

.subject-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--color-bg-secondary);
  cursor: pointer;
  transition: background-color 0.2s;
}

.subject-header:hover {
  background-color: var(--color-bg-tertiary);
}

.subject-info {
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: var(--spacing-sm);
  min-width: 0;
}

.subject-name {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.subject-id {
  font-family: monospace;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.policy-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 var(--spacing-sm);
  background-color: var(--color-primary);
  color: var(--color-white);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

.chevron {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  transition: transform 0.2s;
}

.chevron.rotated {
  transform: rotate(90deg);
}

.subject-content {
  padding: var(--spacing-md);
  border-top: 1px solid var(--color-border-light);
}

/* Data Table */
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.data-table th {
  text-align: left;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-semibold);
  border-bottom: 2px solid var(--color-border-light);
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.data-table td {
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid var(--color-border-light);
  color: var(--color-text-primary);
}

.data-table tr:last-child td {
  border-bottom: none;
}

.resource-cell {
  font-family: monospace;
  font-size: var(--font-size-xs);
}

.resource-path {
  font-family: monospace;
  font-size: var(--font-size-xs);
}

.resource-resolved-name {
  display: inline-block;
  margin-left: var(--spacing-sm);
  padding: 1px var(--spacing-sm);
  background-color: var(--color-info-bg);
  color: var(--color-info-text);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  vertical-align: baseline;
}

/* Method Badges */
.method-badge {
  display: inline-block;
  padding: 2px var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  margin-right: var(--spacing-xs);
  margin-bottom: 2px;
  font-family: monospace;
}

.method-badge-sm {
  font-size: 10px;
  padding: 1px 4px;
}

.method-get {
  background-color: var(--color-success-bg);
  color: var(--color-success-text);
}

.method-post {
  background-color: var(--color-info-bg);
  color: var(--color-info-text);
}

.method-patch {
  background-color: var(--color-warning-bg);
  color: var(--color-warning-text);
}

.method-delete {
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.method-default {
  background-color: var(--color-bg-secondary);
  color: var(--color-text-secondary);
}

/* Search Bar (User Permissions tab) */
.search-bar {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.search-input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--border-radius-md);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus-primary);
}

.search-input::placeholder {
  color: var(--color-text-secondary);
}

/* User Search Autocomplete */
.user-search-container {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-medium);
  border-top: none;
  border-radius: 0 0 var(--border-radius-md) var(--border-radius-md);
  max-height: 300px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: var(--shadow-md);
}

.search-loading,
.search-empty {
  padding: var(--spacing-md);
  text-align: center;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.search-result {
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
  border-bottom: 1px solid var(--color-border-light);
}

.search-result:hover {
  background-color: var(--color-bg-secondary);
}

.search-result:last-child {
  border-bottom: none;
}

.search-result .user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.search-result .user-name {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.search-result .user-email {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

/* User Results */
.user-results {
  animation: fadeIn 0.2s ease;
}

.admin-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
  border-radius: var(--border-radius-md);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-lg);
}

.result-section {
  margin-bottom: var(--spacing-xl);
}

.result-section h4 {
  margin: 0 0 var(--spacing-md);
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
}

.badge-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.role-badge {
  display: inline-block;
  padding: var(--spacing-xs) var(--spacing-md);
  background-color: var(--color-primary);
  color: var(--color-white);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.feature-badge {
  display: inline-block;
  padding: var(--spacing-xs) var(--spacing-md);
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-xs);
}

.flags-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
}

.flag-item {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.flag-yes {
  color: var(--color-success-text);
}

.flag-no {
  color: var(--color-text-secondary);
}

/* Entity Role Matrix */
.matrix-content {
  overflow: visible;
}

.table-wrapper {
  overflow-x: auto;
}

.matrix-table {
  min-width: 600px;
}

.matrix-table th {
  white-space: nowrap;
  font-size: 11px;
}

.sticky-col {
  position: sticky;
  left: 0;
  background-color: var(--color-bg-primary);
  z-index: 1;
}

.matrix-table thead .sticky-col {
  background-color: var(--color-bg-secondary);
  z-index: 2;
}

.matrix-cell {
  white-space: nowrap;
}

/* Health Checks */
.health-summary {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--border-radius-md);
  min-width: 100px;
}

.summary-count {
  font-size: 2rem;
  font-weight: var(--font-weight-bold);
}

.summary-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
}

.severity-high {
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.severity-medium {
  background-color: var(--color-warning-bg);
  color: var(--color-warning-text);
}

.severity-low {
  background-color: var(--color-warning-bg);
  color: var(--color-warning-text);
  opacity: 0.8;
}

.severity-info {
  background-color: var(--color-info-bg);
  color: var(--color-info-text);
}

/* Finding Cards */
.finding-card {
  border: 1px solid var(--color-border-light);
  border-left: 4px solid;
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
}

.finding-high {
  border-left-color: var(--color-danger);
}

.finding-medium {
  border-left-color: var(--color-warning);
}

.finding-low {
  border-left-color: var(--color-warning);
  opacity: 0.9;
}

.finding-info {
  border-left-color: var(--color-info);
}

.finding-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
}

.severity-badge {
  display: inline-block;
  padding: 2px var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
}

.severity-badge.severity-high {
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.severity-badge.severity-medium {
  background-color: var(--color-warning-bg);
  color: var(--color-warning-text);
}

.severity-badge.severity-low {
  background-color: var(--color-warning-bg);
  color: var(--color-warning-text);
  opacity: 0.8;
}

.severity-badge.severity-info {
  background-color: var(--color-info-bg);
  color: var(--color-info-text);
}

.finding-category {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.finding-description {
  margin: 0 0 var(--spacing-xs);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.finding-details {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  font-family: monospace;
  background-color: var(--color-bg-secondary);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-sm);
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
  gap: var(--spacing-md);
  color: var(--color-text-secondary);
}

.error-state {
  color: var(--color-danger-text);
}

.success-state {
  color: var(--color-success-text);
}

/* Responsive */
@media (max-width: 768px) {
  .security-admin-page {
    padding: var(--spacing-md);
  }

  .tab-bar {
    gap: 0;
  }

  .tab-button {
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-xs);
  }

  .tab-button span {
    display: none;
  }

  .tab-button i {
    font-size: var(--font-size-md);
  }

  .search-bar {
    flex-direction: column;
  }

  .user-search-container {
    max-width: none;
  }

  .health-summary {
    flex-direction: column;
  }

  .flags-row {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
}
</style>
