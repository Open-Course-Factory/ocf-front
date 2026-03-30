<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.

 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
-->

<template>
  <div class="help-article permissions-reference">
    <div class="help-nav">
      <router-link :to="helpMainRoute" class="back-link">
        <i class="fas fa-arrow-left"></i>
        {{ t('help.navigation.backToHelp') }}
      </router-link>
    </div>
    <div class="help-header">
      <h1>
        <i class="fas fa-lock"></i>
        {{ t('help.account.permissionsReference.title') }}
      </h1>
      <p class="subtitle">{{ t('help.account.permissionsReference.subtitle') }}</p>
    </div>

    <div class="help-content">
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>{{ t('help.account.permissionsReference.loading') }}</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-container">
        <i class="fas fa-exclamation-triangle"></i>
        <p>{{ t('help.account.permissionsReference.error') }}</p>
        <button class="btn-retry" @click="fetchPermissions">
          <i class="fas fa-redo"></i>
          {{ t('help.account.permissionsReference.retry') }}
        </button>
      </div>

      <!-- Permissions Data -->
      <template v-else>
        <!-- Legend -->
        <section class="help-section">
          <h2>
            <i class="fas fa-info-circle"></i>
            {{ t('help.account.permissionsReference.legendTitle') }}
          </h2>
          <p>{{ t('help.account.permissionsReference.legendDescription') }}</p>

          <div class="legend-grid">
            <div class="legend-card">
              <span class="badge badge-member">member</span>
              <span>{{ t('help.account.permissionsReference.legendMember') }}</span>
            </div>
            <div class="legend-card">
              <span class="badge badge-admin">admin</span>
              <span>{{ t('help.account.permissionsReference.legendAdmin') }}</span>
            </div>
          </div>

          <div class="access-legend">
            <h3>{{ t('help.account.permissionsReference.accessRulesTitle') }}</h3>
            <div class="access-legend-grid">
              <div class="access-legend-item">
                <span class="access-tag access-self">
                  <i class="fas fa-user"></i>
                  {{ t('help.account.permissionsReference.accessSelf') }}
                </span>
                <span class="access-desc">{{ t('help.account.permissionsReference.accessSelfDesc') }}</span>
              </div>
              <div class="access-legend-item">
                <span class="access-tag access-admin">
                  <i class="fas fa-shield-alt"></i>
                  {{ t('help.account.permissionsReference.accessAdminOnly') }}
                </span>
                <span class="access-desc">{{ t('help.account.permissionsReference.accessAdminOnlyDesc') }}</span>
              </div>
              <div class="access-legend-item">
                <span class="access-tag access-owner">
                  <i class="fas fa-crown"></i>
                  {{ t('help.account.permissionsReference.accessOwner') }}
                </span>
                <span class="access-desc">{{ t('help.account.permissionsReference.accessOwnerDesc') }}</span>
              </div>
              <div class="access-legend-item">
                <span class="access-tag access-group">
                  <i class="fas fa-users"></i>
                  {{ t('help.account.permissionsReference.accessGroup') }}
                </span>
                <span class="access-desc">{{ t('help.account.permissionsReference.accessGroupDesc') }}</span>
              </div>
              <div class="access-legend-item">
                <span class="access-tag access-org">
                  <i class="fas fa-building"></i>
                  {{ t('help.account.permissionsReference.accessOrg') }}
                </span>
                <span class="access-desc">{{ t('help.account.permissionsReference.accessOrgDesc') }}</span>
              </div>
              <div class="access-legend-item">
                <span class="access-tag access-any">
                  <i class="fas fa-globe"></i>
                  {{ t('help.account.permissionsReference.accessAny') }}
                </span>
                <span class="access-desc">{{ t('help.account.permissionsReference.accessAnyDesc') }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Category Sections -->
        <section
          v-for="category in categories"
          :key="category.name"
          class="help-section category-section"
        >
          <div class="category-header" @click="toggleCategory(category.name)">
            <h2>
              <i :class="getCategoryIcon(category.name)"></i>
              {{ category.name }}
              <span class="route-count">({{ category.routes.length }})</span>
            </h2>
            <i class="fas fa-chevron-down toggle-icon" :class="{ rotated: expandedCategories.has(category.name) }"></i>
          </div>

          <div v-if="expandedCategories.has(category.name)" class="category-content">
            <div class="permission-matrix">
              <table>
                <thead>
                  <tr>
                    <th class="col-action">{{ t('help.account.permissionsReference.colAction') }}</th>
                    <th class="col-method">{{ t('help.account.permissionsReference.colMethod') }}</th>
                    <th class="col-path">{{ t('help.account.permissionsReference.colPath') }}</th>
                    <th class="col-role">{{ t('help.account.permissionsReference.colCasbinRole') }}</th>
                    <th class="col-access">{{ t('help.account.permissionsReference.colAccessRule') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="route in category.routes" :key="`${route.method}-${route.path}`">
                    <td class="col-action">
                      <span class="action-text">{{ route.description || route.path }}</span>
                    </td>
                    <td class="col-method">
                      <span class="method-badge" :class="`method-${route.method.toLowerCase()}`">
                        {{ route.method }}
                      </span>
                    </td>
                    <td class="col-path">
                      <code class="path-code">{{ route.path }}</code>
                    </td>
                    <td class="col-role">
                      <span class="badge" :class="route.casbin_role === 'admin' ? 'badge-admin' : 'badge-member'">
                        {{ route.casbin_role }}
                      </span>
                    </td>
                    <td class="col-access">
                      <span class="access-tag" :class="getAccessClass(route.access)">
                        <i :class="getAccessIcon(route.access)"></i>
                        {{ formatAccessRule(route.access) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- Entity CRUD Permissions -->
        <section v-if="entities.length > 0" class="help-section entity-crud-section">
          <h2>
            <i class="fas fa-database"></i>
            {{ t('help.account.permissionsReference.entityCrudTitle') }}
          </h2>
          <p>{{ t('help.account.permissionsReference.entityCrudDescription') }}</p>

          <div class="entity-table-wrapper">
            <table class="entity-crud-table">
              <thead>
                <tr>
                  <th class="col-entity">{{ t('help.account.permissionsReference.entityColumn') }}</th>
                  <th class="col-crud">{{ t('help.account.permissionsReference.colCreate') }}</th>
                  <th class="col-crud">{{ t('help.account.permissionsReference.colRead') }}</th>
                  <th class="col-crud">{{ t('help.account.permissionsReference.colUpdate') }}</th>
                  <th class="col-crud">{{ t('help.account.permissionsReference.colDelete') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="entity in entities" :key="entity.entity">
                  <td class="col-entity">
                    <code class="entity-name">{{ entity.entity }}</code>
                  </td>
                  <td class="col-crud">
                    <span class="access-tag" :class="getAccessClass(entity.create)">
                      <i :class="getAccessIcon(entity.create)"></i>
                      {{ formatAccessRule(entity.create) }}
                    </span>
                  </td>
                  <td class="col-crud">
                    <span class="access-tag" :class="getAccessClass(entity.read)">
                      <i :class="getAccessIcon(entity.read)"></i>
                      {{ formatAccessRule(entity.read) }}
                    </span>
                  </td>
                  <td class="col-crud">
                    <span class="access-tag" :class="getAccessClass(entity.update)">
                      <i :class="getAccessIcon(entity.update)"></i>
                      {{ formatAccessRule(entity.update) }}
                    </span>
                  </td>
                  <td class="col-crud">
                    <span class="access-tag" :class="getAccessClass(entity.delete)">
                      <i :class="getAccessIcon(entity.delete)"></i>
                      {{ formatAccessRule(entity.delete) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Empty State -->
        <div v-if="categories.length === 0 && entities.length === 0 && !loading && !error" class="empty-state">
          <i class="fas fa-folder-open"></i>
          <p>{{ t('help.account.permissionsReference.noData') }}</p>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { useTranslations } from '../../../composables/useTranslations'
import { helpEn } from '../../../locales/help/en'
import { helpFr } from '../../../locales/help/fr'

const { t } = useTranslations({ en: helpEn, fr: helpFr })
const route = useRoute()

const isPublicHelp = computed(() => route.path.startsWith('/help-public'))
const helpMainRoute = computed(() => isPublicHelp.value ? '/help-public' : '/help')

interface AccessRule {
  type: string
  entity?: string
  field?: string
  min_role?: string
}

interface RoutePermission {
  path: string
  method: string
  category: string
  casbin_role: string
  access: AccessRule
  description: string
}

interface PermissionCategory {
  name: string
  routes: RoutePermission[]
}

interface EntityCRUDPermissions {
  entity: string
  create: AccessRule
  read: AccessRule
  update: AccessRule
  delete: AccessRule
}

interface PermissionsResponse {
  categories: PermissionCategory[]
  entities: EntityCRUDPermissions[]
}

const loading = ref(true)
const error = ref(false)
const categories = ref<PermissionCategory[]>([])
const entities = ref<EntityCRUDPermissions[]>([])
const expandedCategories = ref(new Set<string>())

async function fetchPermissions() {
  loading.value = true
  error.value = false
  try {
    const response = await axios.get<PermissionsResponse>('permissions/reference')
    categories.value = response.data.categories || []
    entities.value = response.data.entities || []
    // Expand all categories by default
    categories.value.forEach(cat => expandedCategories.value.add(cat.name))
  } catch (err) {
    console.error('Failed to fetch permissions reference:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

function toggleCategory(name: string) {
  if (expandedCategories.value.has(name)) {
    expandedCategories.value.delete(name)
  } else {
    expandedCategories.value.add(name)
  }
}

function getCategoryIcon(name: string): string {
  const iconMap: Record<string, string> = {
    'Terminals': 'fas fa-terminal',
    'Courses': 'fas fa-graduation-cap',
    'Authentication': 'fas fa-sign-in-alt',
    'Users': 'fas fa-users',
    'Groups': 'fas fa-users-cog',
    'Organizations': 'fas fa-building',
    'Payment': 'fas fa-credit-card',
    'Admin': 'fas fa-cogs',
    'Scenarios': 'fas fa-flag-checkered',
    'Configuration': 'fas fa-sliders-h',
    'Email': 'fas fa-envelope',
    'Generations': 'fas fa-magic',
    'Audit': 'fas fa-clipboard-list',
  }
  return iconMap[name] || 'fas fa-folder'
}

function getAccessClass(access: AccessRule): string {
  if (!access || !access.type) return 'access-any'
  const classMap: Record<string, string> = {
    'self_scoped': 'access-self',
    'admin_only': 'access-admin',
    'entity_owner': 'access-owner',
    'group_role': 'access-group',
    'org_role': 'access-org',
    'any_member': 'access-any',
    'public': 'access-any',
  }
  return classMap[access.type] || 'access-any'
}

function getAccessIcon(access: AccessRule): string {
  if (!access || !access.type) return 'fas fa-globe'
  const iconMap: Record<string, string> = {
    'self_scoped': 'fas fa-user',
    'admin_only': 'fas fa-shield-alt',
    'entity_owner': 'fas fa-crown',
    'group_role': 'fas fa-users',
    'org_role': 'fas fa-building',
    'any_member': 'fas fa-globe',
    'public': 'fas fa-globe',
  }
  return iconMap[access.type] || 'fas fa-globe'
}

function formatAccessRule(access: AccessRule): string {
  if (!access || !access.type) return t('help.account.permissionsReference.accessAny')
  switch (access.type) {
    case 'self_scoped':
      return t('help.account.permissionsReference.accessSelf')
    case 'admin_only':
      return t('help.account.permissionsReference.accessAdminOnly')
    case 'entity_owner':
      return access.entity
        ? t('help.account.permissionsReference.accessOwnerEntity', { entity: access.entity })
        : t('help.account.permissionsReference.accessOwner')
    case 'group_role':
      return access.min_role
        ? t('help.account.permissionsReference.accessGroupRole', { role: access.min_role })
        : t('help.account.permissionsReference.accessGroup')
    case 'org_role':
      return access.min_role
        ? t('help.account.permissionsReference.accessOrgRole', { role: access.min_role })
        : t('help.account.permissionsReference.accessOrg')
    case 'any_member':
      return t('help.account.permissionsReference.accessAny')
    case 'public':
      return t('help.account.permissionsReference.accessAny')
    default:
      return access.type
  }
}

onMounted(async () => {
  await fetchPermissions()
})
</script>

<style scoped>
.help-article {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.help-nav {
  margin-bottom: 1.5rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: var(--font-size-sm);
  transition: color var(--transition-base);
}

.back-link:hover {
  color: var(--color-primary);
}

.help-header {
  text-align: center;
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 2px solid var(--color-border);
}

.help-header h1 {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin: 0 0 1rem 0;
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.help-header h1 i {
  color: var(--color-primary);
  font-size: 2.25rem;
}

.subtitle {
  font-size: 1.125rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.help-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Loading */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1.5rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-container p {
  color: var(--color-text-muted);
  font-size: 1rem;
}

/* Error */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1rem;
}

.error-container i {
  font-size: 2.5rem;
  color: var(--color-warning);
}

.error-container p {
  color: var(--color-text-secondary);
  font-size: 1rem;
}

.btn-retry {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-primary);
  background: transparent;
  border: 1px solid var(--color-primary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-retry:hover {
  background: var(--color-primary);
  color: var(--color-white);
}

/* Sections */
.help-section {
  margin-bottom: 1rem;
}

.help-section h2 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.help-section h2 i {
  color: var(--color-primary);
  font-size: 1.25rem;
}

.help-section > p {
  font-size: 1rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

/* Legend */
.legend-grid {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.legend-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: var(--color-bg-secondary);
  border-radius: 8px;
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
}

.access-legend {
  margin-top: 1.5rem;
}

.access-legend h3 {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.access-legend-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 0.75rem;
}

.access-legend-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
}

.access-desc {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

/* Badges */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.badge-member {
  background: var(--color-info-bg, rgba(59, 130, 246, 0.1));
  color: var(--color-info, #3b82f6);
  border: 1px solid var(--color-info-border, rgba(59, 130, 246, 0.3));
}

.badge-admin {
  background: var(--color-danger-bg, rgba(239, 68, 68, 0.1));
  color: var(--color-danger, #ef4444);
  border: 1px solid var(--color-danger-border, rgba(239, 68, 68, 0.3));
}

/* Method Badges */
.method-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  font-family: monospace;
  letter-spacing: 0.03em;
}

.method-get {
  background: rgba(16, 185, 129, 0.1);
  color: var(--color-success, #10b981);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.method-post {
  background: rgba(59, 130, 246, 0.1);
  color: var(--color-info, #3b82f6);
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.method-patch, .method-put {
  background: rgba(245, 158, 11, 0.1);
  color: var(--color-warning, #f59e0b);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.method-delete {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-danger, #ef4444);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

/* Access Tags */
.access-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-size: 0.8125rem;
  font-weight: 500;
  white-space: nowrap;
}

.access-tag i {
  font-size: 0.75rem;
}

.access-self {
  background: rgba(139, 92, 246, 0.1);
  color: var(--color-purple, #8b5cf6);
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.access-admin {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-danger, #ef4444);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.access-owner {
  background: rgba(245, 158, 11, 0.1);
  color: var(--color-warning, #f59e0b);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.access-group {
  background: rgba(16, 185, 129, 0.1);
  color: var(--color-success, #10b981);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.access-org {
  background: rgba(59, 130, 246, 0.1);
  color: var(--color-info, #3b82f6);
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.access-any {
  background: var(--color-bg-secondary);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
}

/* Category Sections */
.category-section {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
  background: var(--color-bg-primary);
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.category-header:hover {
  background-color: var(--color-bg-secondary);
}

.category-header h2 {
  margin: 0;
  font-size: 1.25rem;
}

.route-count {
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--color-text-muted);
  margin-left: 0.25rem;
}

.toggle-icon {
  color: var(--color-text-muted);
  transition: transform 0.3s ease;
  font-size: 0.875rem;
}

.toggle-icon.rotated {
  transform: rotate(180deg);
}

/* Table */
.category-content {
  border-top: 1px solid var(--color-border);
}

.permission-matrix {
  overflow-x: auto;
}

.permission-matrix table {
  width: 100%;
  border-collapse: collapse;
}

.permission-matrix thead {
  background: var(--color-bg-secondary);
}

.permission-matrix th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--color-border);
}

.permission-matrix tbody tr {
  border-bottom: 1px solid var(--color-border-light, var(--color-border));
  transition: background 0.15s ease;
}

.permission-matrix tbody tr:last-child {
  border-bottom: none;
}

.permission-matrix tbody tr:hover {
  background: var(--color-bg-secondary);
}

.permission-matrix td {
  padding: 0.75rem 1rem;
  font-size: 0.9375rem;
  vertical-align: middle;
}

.col-action {
  min-width: 200px;
}

.col-method {
  min-width: 70px;
  width: 80px;
}

.col-path {
  min-width: 250px;
}

.col-role {
  min-width: 80px;
  width: 100px;
}

.col-access {
  min-width: 160px;
}

.action-text {
  color: var(--color-text-primary);
  font-weight: 500;
}

.path-code {
  font-family: monospace;
  font-size: 0.8125rem;
  padding: 0.15rem 0.4rem;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-secondary);
  word-break: break-all;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1rem;
  color: var(--color-text-muted);
}

.empty-state i {
  font-size: 2.5rem;
}

/* Entity CRUD Table */
.entity-crud-section {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
  background: var(--color-bg-primary);
  padding: 1.5rem;
}

.entity-crud-section > h2 {
  margin-bottom: 0.5rem;
}

.entity-crud-section > p {
  margin-bottom: 1.5rem;
}

.entity-table-wrapper {
  overflow-x: auto;
}

.entity-crud-table {
  width: 100%;
  border-collapse: collapse;
}

.entity-crud-table thead {
  background: var(--color-bg-secondary);
}

.entity-crud-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--color-border);
}

.entity-crud-table tbody tr {
  border-bottom: 1px solid var(--color-border-light, var(--color-border));
  transition: background 0.15s ease;
}

.entity-crud-table tbody tr:last-child {
  border-bottom: none;
}

.entity-crud-table tbody tr:hover {
  background: var(--color-bg-secondary);
}

.entity-crud-table td {
  padding: 0.75rem 1rem;
  font-size: 0.9375rem;
  vertical-align: middle;
}

.col-entity {
  min-width: 160px;
}

.col-crud {
  min-width: 130px;
}

.entity-name {
  font-family: monospace;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-primary);
}

/* Responsive */
@media (max-width: 768px) {
  .help-article {
    padding: 1rem;
  }

  .help-header h1 {
    font-size: 2rem;
  }

  .help-section h2 {
    font-size: 1.25rem;
  }

  .permission-matrix th,
  .permission-matrix td {
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
  }

  .legend-grid {
    flex-direction: column;
  }

  .access-legend-grid {
    grid-template-columns: 1fr;
  }

  .col-path {
    min-width: 180px;
  }

  .entity-crud-section {
    padding: 1rem;
  }

  .entity-crud-table th,
  .entity-crud-table td {
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
  }

  .col-entity {
    min-width: 120px;
  }

  .col-crud {
    min-width: 100px;
  }
}
</style>
