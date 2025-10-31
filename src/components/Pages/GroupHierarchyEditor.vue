<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
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
  <div class="group-hierarchy-editor">
    <!-- Header -->
    <div class="editor-header">
      <div class="header-left">
        <router-link to="/class-groups" class="back-link">
          <i class="fas fa-arrow-left"></i>
          {{ t('hierarchyEditor.backToGroups') }}
        </router-link>
        <h1>{{ t('hierarchyEditor.title') }}</h1>
        <p class="header-subtitle">{{ t('hierarchyEditor.subtitle') }}</p>
      </div>

      <div class="header-actions">
        <button @click="refreshHierarchy" class="btn btn-secondary" :disabled="isLoading">
          <i class="fas fa-sync" :class="{ 'fa-spin': isLoading }"></i>
          {{ t('hierarchyEditor.refresh') }}
        </button>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="editor-toolbar">
      <!-- Search -->
      <div class="toolbar-search">
        <i class="fas fa-search search-icon"></i>
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('hierarchyEditor.searchPlaceholder')"
          class="search-input"
        />
        <button
          v-if="searchQuery"
          @click="searchQuery = ''"
          class="search-clear"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- View Options -->
      <div class="toolbar-options">
        <button
          @click="expandAll"
          class="btn btn-sm btn-ghost"
          :title="t('hierarchyEditor.expandAll')"
        >
          <i class="fas fa-plus-square"></i>
        </button>
        <button
          @click="collapseAll"
          class="btn btn-sm btn-ghost"
          :title="t('hierarchyEditor.collapseAll')"
        >
          <i class="fas fa-minus-square"></i>
        </button>
      </div>
    </div>

    <!-- Tree Container -->
    <div class="tree-container">
      <!-- Loading State -->
      <div v-if="isLoading && organizations.length === 0" class="tree-loading">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <p>{{ t('hierarchyEditor.loading') }}</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredOrganizations.length === 0 && !searchQuery" class="tree-empty">
        <div class="empty-icon">🏢</div>
        <p class="empty-text">{{ t('hierarchyEditor.noOrganizations') }}</p>
      </div>

      <!-- Search No Results -->
      <div v-else-if="filteredOrganizations.length === 0 && searchQuery" class="tree-empty">
        <div class="empty-icon">🔍</div>
        <p class="empty-text">{{ t('hierarchyEditor.noResults', { query: searchQuery }) }}</p>
      </div>

      <!-- Tree View -->
      <div v-else class="tree-view">
        <TreeNode
          v-for="org in filteredOrganizations"
          :key="org.id"
          :entity="org"
          :level="0"
          :children-getter="getChildren"
          :expanded-nodes="treeExpand.expandedNodes.value"
          :draggable="false"
          :droppable="true"
          @toggle-expand="handleToggleExpand"
          @click="handleToggleExpand"
          @drag-start="handleDragStart"
          @drop="handleDrop"
        >
          <!-- Icon Slot -->
          <template #icon="{ entity }">
            <span class="node-icon">
              <i :class="isOrganization(entity) ? 'fas fa-building' : 'fas fa-layer-group'"></i>
            </span>
          </template>

          <!-- Label Slot -->
          <template #label="{ entity }">
            <span class="node-label">{{ entity.display_name }}</span>

            <!-- For Groups: Show member counts -->
            <template v-if="!isOrganization(entity)">
              <!-- Direct members count -->
              <span
                v-if="(entity as OrganizationGroup).member_count"
                class="member-count direct"
                :title="t('hierarchyEditor.directMembersTooltip')"
              >
                <i class="fas fa-user"></i>
                {{ (entity as OrganizationGroup).member_count }}
              </span>

              <!-- Total members count (including subgroups) -->
              <span
                v-if="getTotalMemberCount(entity as OrganizationGroup) > (entity as OrganizationGroup).member_count"
                class="member-count total"
                :title="t('hierarchyEditor.totalMembersTooltip')"
              >
                <i class="fas fa-users"></i>
                {{ getTotalMemberCount(entity as OrganizationGroup) }}
              </span>
            </template>

            <!-- For Organizations: Show group count -->
            <span v-else-if="(entity as Organization).group_count" class="group-count-badge">
              <i class="fas fa-layer-group"></i>
              {{ (entity as Organization).group_count }}
            </span>
          </template>

          <!-- Actions Slot -->
          <template #actions="{ entity }">
            <button
              @click="handleViewDetails(entity)"
              class="tree-action-button"
              :title="t('hierarchyEditor.viewDetails')"
            >
              <i class="fas fa-eye"></i>
            </button>
            <button
              v-if="!isOrganization(entity)"
              @click="handleDeleteGroup(entity as OrganizationGroup)"
              class="tree-action-button delete"
              :title="t('hierarchyEditor.deleteGroup')"
            >
              <i class="fas fa-trash"></i>
            </button>
          </template>
        </TreeNode>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <BaseModal
      :visible="showDeleteConfirm"
      :title="t('hierarchyEditor.deleteConfirmTitle')"
      title-icon="fas fa-exclamation-triangle"
      size="small"
      :show-default-footer="true"
      :confirm-text="t('hierarchyEditor.delete')"
      confirm-icon="fas fa-trash"
      :cancel-text="t('hierarchyEditor.cancel')"
      cancel-icon="fas fa-ban"
      confirm-variant="danger"
      @close="showDeleteConfirm = false"
      @confirm="confirmDelete"
    >
      <p>{{ t('hierarchyEditor.deleteConfirmMessage', { name: deletingGroup?.display_name }) }}</p>
      <p class="warning-text">{{ t('hierarchyEditor.deleteWarning') }}</p>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useOrganizationsStore } from '../../stores/organizations'
import { usePermissionsStore } from '../../stores/permissions'
import { useAdminViewMode } from '../../composables/useAdminViewMode'
import { useTranslations } from '../../composables/useTranslations'
import { useTreeExpand } from '../../composables/useTreeExpand'
import TreeNode from '../Common/TreeNode.vue'
import BaseModal from '../Modals/BaseModal.vue'
import type { Organization, OrganizationGroup } from '../../types'

const router = useRouter()
const organizationsStore = useOrganizationsStore()
const permissionsStore = usePermissionsStore()
const { isAdmin, shouldFilterAsStandardUser } = useAdminViewMode()

const { t } = useTranslations({
  en: {
    hierarchyEditor: {
      title: 'Group Hierarchy',
      subtitle: 'View organizational groups and their hierarchy',
      backToGroups: 'Back to Groups',
      refresh: 'Refresh',
      searchPlaceholder: 'Search organizations and groups...',
      expandAll: 'Expand All',
      collapseAll: 'Collapse All',
      loading: 'Loading hierarchy...',
      noOrganizations: 'No organizations available.',
      noResults: 'No results match "{query}"',
      viewDetails: 'View Details',
      deleteGroup: 'Delete',
      delete: 'Delete',
      cancel: 'Cancel',
      deleteConfirmTitle: 'Delete Group?',
      deleteConfirmMessage: 'Are you sure you want to delete "{name}"?',
      deleteWarning: 'This action cannot be undone. All subgroups and members will be removed.',
      deleteSuccess: 'Group deleted successfully',
      moveSuccess: 'Group moved successfully',
      errorDelete: 'Failed to delete group',
      errorMove: 'Failed to move group',
      directMembersTooltip: 'Direct members of this group',
      totalMembersTooltip: 'Total members including all subgroups'
    }
  },
  fr: {
    hierarchyEditor: {
      title: 'Hiérarchie des Groupes',
      subtitle: 'Visualisez les groupes organisationnels et leur hiérarchie',
      backToGroups: 'Retour aux Groupes',
      refresh: 'Actualiser',
      searchPlaceholder: 'Rechercher des organisations et groupes...',
      expandAll: 'Tout Développer',
      collapseAll: 'Tout Réduire',
      loading: 'Chargement de la hiérarchie...',
      noOrganizations: 'Aucune organisation disponible.',
      noResults: 'Aucun résultat pour "{query}"',
      viewDetails: 'Voir les Détails',
      deleteGroup: 'Supprimer',
      delete: 'Supprimer',
      cancel: 'Annuler',
      deleteConfirmTitle: 'Supprimer le Groupe ?',
      deleteConfirmMessage: 'Voulez-vous vraiment supprimer "{name}" ?',
      deleteWarning: 'Cette action est irréversible. Tous les sous-groupes et membres seront retirés.',
      deleteSuccess: 'Groupe supprimé avec succès',
      moveSuccess: 'Groupe déplacé avec succès',
      errorDelete: 'Échec de la suppression du groupe',
      errorMove: 'Échec du déplacement du groupe',
      directMembersTooltip: 'Membres directs de ce groupe',
      totalMembersTooltip: 'Total des membres incluant tous les sous-groupes'
    }
  }
})

// Type to combine Organization and Group in the tree
type TreeNode = Organization | OrganizationGroup

// State
const isLoading = ref(false)
const searchQuery = ref('')
const showDeleteConfirm = ref(false)
const deletingGroup = ref<OrganizationGroup | null>(null)
const organizationGroups = ref<Map<string, OrganizationGroup[]>>(new Map())

// Tree expansion
const treeExpand = useTreeExpand([], 0) // Auto-expand first level

// Computed
const allOrganizations = computed(() => organizationsStore.organizations)

// Filter organizations based on view mode
const organizations = computed(() => {
  // If not admin OR admin viewing as standard user
  if (!isAdmin.value || shouldFilterAsStandardUser.value) {
    // Show only organizations where the user is a member
    const currentUserId = permissionsStore.currentUser?.id
    if (!currentUserId) return []

    return allOrganizations.value.filter(org => {
      // Show if user is owner
      if (org.owner_user_id === currentUserId) return true

      // Show if user is a member
      const userMemberships = permissionsStore.currentUser?.organization_memberships || []
      return userMemberships.some(membership =>
        membership.organization_id === org.id && membership.is_active
      )
    })
  }

  // Admin in full admin mode: show all organizations
  return allOrganizations.value
})

const allGroups = computed(() => {
  const groups: OrganizationGroup[] = []
  organizationGroups.value.forEach(orgGroups => {
    groups.push(...orgGroups)
  })
  return groups
})

const filteredOrganizations = computed(() => {
  if (!searchQuery.value) return organizations.value

  const query = searchQuery.value.toLowerCase()

  // Filter organizations and groups
  return organizations.value.filter(org => {
    // Check if organization name matches
    const orgMatches = org.display_name?.toLowerCase().includes(query) ||
      org.name?.toLowerCase().includes(query) ||
      org.description?.toLowerCase().includes(query)

    if (orgMatches) return true

    // Check if any of organization's groups match
    const orgGroups = organizationGroups.value.get(org.id) || []
    return orgGroups.some(group =>
      group.display_name?.toLowerCase().includes(query) ||
      group.name?.toLowerCase().includes(query) ||
      group.description?.toLowerCase().includes(query)
    )
  })
})

// Helper to check if a node is an Organization
const isOrganization = (node: TreeNode): node is Organization => {
  return 'is_personal' in node
}

// Methods to get children of a tree node
const getChildren = (node: TreeNode): TreeNode[] => {
  if (isOrganization(node)) {
    // For organizations, return root groups (groups with no parent)
    const groups = organizationGroups.value.get(node.id) || []
    return groups.filter(g => !g.parent_group_id)
  } else {
    // For groups, return subgroups
    const organizationId = (node as OrganizationGroup).organization_id
    const groups = organizationGroups.value.get(organizationId) || []
    return groups.filter(g => g.parent_group_id === node.id)
  }
}

// Calculate total member count including all subgroups recursively
const getTotalMemberCount = (group: OrganizationGroup): number => {
  // Start with direct members
  let total = group.member_count || 0

  // Add members from all subgroups recursively
  const subgroups = getChildren(group) as OrganizationGroup[]
  for (const subgroup of subgroups) {
    total += getTotalMemberCount(subgroup)
  }

  return total
}

const loadOrganizationGroups = async (organizationId: string) => {
  try {
    const response = await axios.get(`/organizations/${organizationId}/groups`, {
      params: { include: 'parent_group' }
    })
    organizationGroups.value.set(organizationId, response.data)
  } catch (err) {
    console.error(`Failed to load groups for organization ${organizationId}:`, err)
    organizationGroups.value.set(organizationId, [])
  }
}

const refreshHierarchy = async () => {
  isLoading.value = true
  try {
    // Load organizations
    await organizationsStore.loadOrganizations()

    // Load groups for each organization
    const loadPromises = organizations.value.map(org => loadOrganizationGroups(org.id))
    await Promise.all(loadPromises)
  } finally {
    isLoading.value = false
  }
}

const expandAll = () => {
  const allIds: string[] = []
  // Add organization IDs
  allIds.push(...organizations.value.map(o => o.id))
  // Add all group IDs
  allIds.push(...allGroups.value.map(g => g.id))
  treeExpand.expandAll(allIds)
}

const collapseAll = () => {
  treeExpand.collapseAll()
}

const handleToggleExpand = (node: TreeNode) => {
  treeExpand.toggle(node.id)
}

const handleViewDetails = (node: TreeNode) => {
  if (isOrganization(node)) {
    // Navigate to organization detail page
    router.push(`/organizations/${node.id}`)
  } else {
    // Navigate to group detail page
    router.push(`/class-groups/${node.id}`)
  }
}

const handleDeleteGroup = (group: OrganizationGroup) => {
  deletingGroup.value = group
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  if (!deletingGroup.value) return

  try {
    const orgId = deletingGroup.value.organization_id
    await axios.delete(`/organizations/${orgId}/groups/${deletingGroup.value.id}`)
    await loadOrganizationGroups(orgId)
    showDeleteConfirm.value = false
    deletingGroup.value = null
  } catch (err) {
    console.error('Failed to delete group:', err)
  }
}

const handleDragStart = (payload: { entity: TreeNode; level: number }) => {
  // Store the dragged item for later
  console.log('Drag start:', payload.entity.display_name || payload.entity.name)
}

const handleDrop = async (payload: { entity: TreeNode; target: TreeNode }) => {
  // Only allow dropping groups onto groups or organizations
  if (isOrganization(payload.entity)) {
    console.warn('Cannot move organizations')
    return
  }

  const group = payload.entity as OrganizationGroup
  const orgId = group.organization_id

  try {
    let newParentId: string | null = null

    if (!isOrganization(payload.target)) {
      // Dropping onto a group - make it a subgroup
      newParentId = payload.target.id
    }
    // If dropping onto organization, parent_id remains null (root group)

    const updatedGroup = {
      ...group,
      parent_group_id: newParentId
    }

    await axios.put(`/organizations/${orgId}/groups/${group.id}`, updatedGroup)
    await loadOrganizationGroups(orgId)

    // Expand the target to show the moved group
    treeExpand.expand(payload.target.id)
  } catch (err) {
    console.error('Failed to move group:', err)
  }
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    refreshHierarchy(),
    permissionsStore.loadCurrentUser()
  ])
})

// Reload when view mode changes
watch(shouldFilterAsStandardUser, () => {
  // The computed property will automatically update
  // No need to reload from backend
})
</script>

<style scoped>
@import '../../styles/tree-common.css';

.group-hierarchy-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-background);
}

/* Header */
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--spacing-lg) var(--spacing-xl);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border-light);
}

.header-left {
  flex: 1;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-sm);
  transition: color 0.15s;
}

.back-link:hover {
  color: var(--color-primary);
}

.editor-header h1 {
  margin: 0 0 var(--spacing-xs) 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
}

.header-subtitle {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-md);
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

/* Toolbar */
.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-xl);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border-light);
}

.toolbar-search {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: var(--spacing-sm);
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.search-input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md) var(--spacing-sm) var(--spacing-xl);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  transition: border-color 0.15s;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-bg);
}

.search-clear {
  position: absolute;
  right: var(--spacing-sm);
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: var(--spacing-xs);
  transition: color 0.15s;
}

.search-clear:hover {
  color: var(--color-text-primary);
}

.toolbar-options {
  display: flex;
  gap: var(--spacing-xs);
}

/* Tree Container */
.tree-container {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md) var(--spacing-xl);
}

.tree-view {
  max-width: 1200px;
}

/* Group Specific Styles */
.group-icon {
  color: var(--color-primary);
  font-size: 1rem;
}

.group-icon.level-0 {
  color: var(--color-primary);
}

.group-icon.level-1 {
  color: var(--color-info);
}

.group-icon.level-2 {
  color: var(--color-success);
}

.group-label {
  font-weight: var(--font-weight-medium);
}

.member-count {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 2px 6px;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  cursor: help;
  transition: all 0.2s ease;
}

.member-count.direct {
  background: var(--color-info-bg);
  color: var(--color-info);
}

.member-count.direct:hover {
  background: var(--color-info);
  color: var(--color-surface);
}

.member-count.total {
  background: var(--color-success-bg);
  color: var(--color-success);
  margin-left: var(--spacing-xs);
}

.member-count.total:hover {
  background: var(--color-success);
  color: var(--color-surface);
}

.tree-action-button.delete {
  color: var(--color-danger);
}

.tree-action-button.delete:hover {
  background: var(--color-danger-bg);
}

/* Empty States */
.tree-loading,
.tree-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-4xl);
  text-align: center;
}

.loading-spinner {
  font-size: 2rem;
  color: var(--color-primary);
  margin-bottom: var(--spacing-md);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

.empty-text {
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-lg) 0;
}

.warning-text {
  color: var(--color-warning);
  font-weight: var(--font-weight-medium);
  margin-top: var(--spacing-md);
}

/* Responsive */
@media (max-width: 768px) {
  .editor-header {
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .header-actions {
    width: 100%;
    justify-content: stretch;
  }

  .header-actions button {
    flex: 1;
  }

  .editor-toolbar {
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .toolbar-search {
    max-width: 100%;
  }
}
</style>
