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

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useClassGroupsStore } from '../../stores/classGroups'
import { useCurrentUserStore } from '../../stores/currentUser'
import { useTranslations } from '../../composables/useTranslations'
import { useFeatureFlags } from '../../composables/useFeatureFlags'
import { useAdminViewMode } from '../../composables/useAdminViewMode'
import { useGroupMembers } from '../../composables/useGroupMembers'
import { useTabList } from '../../composables/useTabList'
import { formatDate } from '../../utils/formatters'
import { userService, type User } from '../../services/domain/user'
import type { ClassGroup } from '../../types'
import type { Organization } from '../../types/organization'
import axios from 'axios'
import { GroupOverviewTab, GroupMembersManager, GroupSettingsTab, GroupCommandHistory, GroupScenariosTab, GroupActivityTab, GroupAnalyticsTab, GroupLiveSessionsTab } from '../Groups'
import AdminBadge from '../Common/AdminBadge.vue'

const route = useRoute()
const router = useRouter()
const groupStore = useClassGroupsStore()
const currentUser = useCurrentUserStore()
const { isEnabled } = useFeatureFlags()
const { isAdmin: isPlatformAdmin } = useAdminViewMode()

// Translations
const { t } = useTranslations({
  en: {
    groupDetails: {
      pageTitle: 'Group Details',
      backToGroups: 'Back to Groups',
      groupNotFound: 'Group not found',
      loading: 'Loading group details...',
      tabsLabel: 'Group sections',
      tabOverview: 'Overview',
      tabMembers: 'Members',
      tabScenarios: 'Scenarios',
      tabLiveSessions: 'Live sessions',
      tabActivity: 'Activity',
      tabAnalytics: 'Analytics',
      tabHistory: 'Command History',
      tabSettings: 'Settings',
      statusActive: 'Active',
      statusInactive: 'Inactive',
      statusExpired: 'EXPIRED',
      statusFull: 'FULL',
      memberCountLabel: '{current} / {max} members',
      memberCapacity: '{percentage}% capacity',
      expiresAt: 'Expires',
      editGroup: 'Edit Group',
      deleteGroup: 'Delete Group',
      groupLoadError: 'Failed to load group details',
      loadingMembers: 'Loading members...',
      viewingAsAdmin: 'Viewing as administrator'
    }
  },
  fr: {
    groupDetails: {
      pageTitle: 'Détails du groupe',
      backToGroups: 'Retour aux groupes',
      groupNotFound: 'Groupe introuvable',
      loading: 'Chargement des détails du groupe...',
      tabsLabel: 'Sections du groupe',
      tabOverview: 'Aperçu',
      tabMembers: 'Membres',
      tabScenarios: 'Scénarios',
      tabLiveSessions: 'Sessions en direct',
      tabActivity: 'Activité',
      tabAnalytics: 'Analyses',
      tabHistory: 'Historique des commandes',
      tabSettings: 'Paramètres',
      statusActive: 'Actif',
      statusInactive: 'Inactif',
      statusExpired: 'EXPIRÉ',
      statusFull: 'COMPLET',
      memberCountLabel: '{current} / {max} membres',
      memberCapacity: '{percentage}% capacité',
      expiresAt: 'Expire',
      editGroup: 'Modifier le groupe',
      deleteGroup: 'Supprimer le groupe',
      groupLoadError: 'Échec du chargement des détails du groupe',
      loadingMembers: 'Chargement des membres...',
      viewingAsAdmin: 'Vue en tant qu\u2019administrateur'
    }
  }
})

// State
const currentGroup = ref<ClassGroup | null>(null)
const ownerUser = ref<User | null>(null)
const groupOrganization = ref<Organization | null>(null)
const isLoading = ref(true)
const isMembersLoading = ref(false)
const error = ref('')
type GroupTab = 'overview' | 'members' | 'scenarios' | 'live' | 'activity' | 'analytics' | 'history' | 'settings'
const activeTab = ref<GroupTab>((route.query.tab as GroupTab) || 'overview')

interface TabDescriptor {
  id: GroupTab
  icon: string
  labelKey: string
}

const baseTabs: TabDescriptor[] = [
  { id: 'overview', icon: 'fas fa-info-circle', labelKey: 'groupDetails.tabOverview' },
  { id: 'members', icon: 'fas fa-users', labelKey: 'groupDetails.tabMembers' }
]

// The tabs only a manager, owner or platform admin may open. Declared as data so
// the reserved-slot rendering below is expressed once instead of per button.
const managerTabs: TabDescriptor[] = [
  { id: 'scenarios', icon: 'fas fa-clipboard-list', labelKey: 'groupDetails.tabScenarios' },
  { id: 'live', icon: 'fas fa-eye', labelKey: 'groupDetails.tabLiveSessions' },
  { id: 'activity', icon: 'fas fa-desktop', labelKey: 'groupDetails.tabActivity' },
  { id: 'analytics', icon: 'fas fa-chart-bar', labelKey: 'groupDetails.tabAnalytics' },
  { id: 'history', icon: 'fas fa-history', labelKey: 'groupDetails.tabHistory' },
  { id: 'settings', icon: 'fas fa-cog', labelKey: 'groupDetails.tabSettings' }
]

const { tablist, tabProps, panelProps, onKeydown } = useTabList(activeTab, 'group')

// Ref to members manager for member count
const membersManagerRef = ref<InstanceType<typeof GroupMembersManager> | null>(null)

// Group ID
const groupId = computed(() => route.params.id as string | null)

// Use Group Members composable (for member count in status bar & tabs)
const groupMembersComposable = useGroupMembers({
  groupId,
  currentUserId: computed(() => currentUser.userId),
  isOwner: computed(() => isPlatformAdmin.value || currentGroup.value?.owner_user_id === currentUser.userId)
})

// Computed Properties
const isOwner = computed(() => {
  return currentGroup.value?.owner_user_id === currentUser.userId
})

const isManager = computed(() => {
  const member = groupMembersComposable.members.value.find(m => m.user_id === currentUser.userId)
  return member?.role === 'manager' || member?.role === 'owner'
})

const canEditGroup = computed(() => {
  return isPlatformAdmin.value || isOwner.value || isManager.value
})

// Platform admins and the group owner are identified from the group payload itself;
// a manager can only be recognised by finding themselves in the members list, which
// arrives after the page is already on screen. Reading `canEditGroup` rather than the
// ownership flags alone means a later reload (saving the group refetches the members)
// keeps the answer already known, instead of greying a manager's own controls out.
const isRoleUnresolved = computed(() => {
  return isMembersLoading.value && !canEditGroup.value
})

// Reserve the manager-only controls rather than letting five tabs and the edit
// button appear a moment later, under the cursor of a teacher already reaching for
// one. They render disabled in their final position and simply become live.
const showManagerControls = computed(() => {
  return canEditGroup.value || isRoleUnresolved.value
})

// The bar as the teacher sees it. One list, so the ARIA wiring below is written
// once and the reserved placeholders are just tabs that are not usable yet.
const visibleTabs = computed<(TabDescriptor & { disabled: boolean })[]>(() => [
  ...baseTabs.map(tab => ({ ...tab, disabled: false })),
  ...(showManagerControls.value
    ? managerTabs.map(tab => ({ ...tab, disabled: isRoleUnresolved.value }))
    : [])
])

const canDeleteGroup = computed(() => {
  return isPlatformAdmin.value || isOwner.value
})

const canViewHistory = computed(() => {
  return canEditGroup.value
})

const groupStatus = computed(() => {
  if (!currentGroup.value) return 'inactive'
  if (currentGroup.value.is_expired) return 'expired'
  if (currentGroup.value.is_full) return 'full'
  if (!currentGroup.value.is_active) return 'inactive'
  return 'active'
})

const statusColor = computed(() => {
  switch (groupStatus.value) {
    case 'active': return 'success'
    case 'expired': return 'warning'
    case 'full': return 'info'
    case 'inactive': return 'danger'
    default: return 'secondary'
  }
})

const displayMemberCount = computed(() => {
  if (isMembersLoading.value && currentGroup.value) {
    return currentGroup.value.member_count ?? 0
  }
  return groupMembersComposable.members.value.length
})

const actualMemberPercentage = computed(() => {
  if (!currentGroup.value) return 0
  return Math.round((displayMemberCount.value / currentGroup.value.max_members) * 100)
})

const subgroups = computed(() => {
  return currentGroup.value?.subGroups || currentGroup.value?.sub_groups || []
})

// Methods
const loadGroupData = async () => {
  const id = route.params.id as string
  if (!id) return

  const data = await groupStore.getOne(id, ['ParentGroup', 'SubGroups'])
  currentGroup.value = data

  if (data.owner_user_id) {
    try {
      ownerUser.value = await userService.getUserById(data.owner_user_id)
    } catch (err) {
      console.error('Failed to load owner user:', err)
      ownerUser.value = null
    }
  }

  if (data.organization_id) {
    try {
      const orgResponse = await axios.get(`/organizations/${data.organization_id}`)
      groupOrganization.value = orgResponse.data
    } catch (err) {
      console.error('Failed to load organization:', err)
      groupOrganization.value = null
    }
  }

  return data
}

const loadGroupAndMembers = async () => {
  isLoading.value = true
  error.value = ''

  try {
    await loadGroupData()
  } catch (err: any) {
    error.value = err.response?.data?.error_message || err.message || t('groupDetails.groupLoadError')
    isLoading.value = false
    return
  }

  // Group is loaded — show the page, but members are still loading
  isLoading.value = false
  isMembersLoading.value = true

  try {
    await groupMembersComposable.loadMembers(true, subgroups.value)
  } finally {
    isMembersLoading.value = false
  }
}

const handleMemberCountChanged = (delta: number) => {
  if (currentGroup.value) {
    currentGroup.value.member_count += delta
  }
}

const handleGroupUpdated = async () => {
  await loadGroupData()
  isMembersLoading.value = true
  try {
    await groupMembersComposable.loadMembers(true, subgroups.value)
  } finally {
    isMembersLoading.value = false
  }
}

// Lifecycle
onMounted(async () => {
  if (!isEnabled('class_groups')) {
    router.push('/terminal-sessions')
    return
  }

  await loadGroupAndMembers()
})

watch(() => route.params.id, async () => {
  await loadGroupAndMembers()
})

// Sync activeTab with URL query parameter (for browser back/forward)
watch(() => route.query.tab, (newTab) => {
  if (newTab && typeof newTab === 'string' && ['overview', 'members', 'scenarios', 'live', 'activity', 'analytics', 'history', 'settings'].includes(newTab)) {
    activeTab.value = newTab as 'overview' | 'members' | 'scenarios' | 'live' | 'activity' | 'analytics' | 'history' | 'settings'
  }
})

// Update URL when tab changes. `replace`, not `push`: a tab is a view of the same
// page, so Back must return to wherever the teacher came from instead of walking
// backwards through every tab they looked at.
watch(activeTab, (newTab) => {
  if (route.query.tab !== newTab) {
    router.replace({
      path: route.path,
      query: { ...route.query, tab: newTab }
    })
  }
})
</script>

<template>
  <div class="group-detail">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      {{ t('groupDetails.loading') }}
    </div>

    <!-- Error State -->
    <div v-else-if="error && !currentGroup" class="error-state">
      <i class="fas fa-exclamation-triangle"></i>
      <p>{{ error }}</p>
      <router-link to="/class-groups" class="btn btn-primary">
        {{ t('groupDetails.backToGroups') }}
      </router-link>
    </div>

    <!-- Group Details -->
    <div v-else-if="currentGroup" class="group-detail-content">
      <!-- Header -->
      <div class="group-detail-header">
        <router-link to="/class-groups" class="back-link">
          <i class="fas fa-arrow-left"></i>
          {{ t('groupDetails.backToGroups') }}
        </router-link>

        <div class="header-title">
          <h1>{{ currentGroup.display_name }}</h1>
          <span class="status-badge" :class="`badge-${statusColor}`">
            {{ t(`groupDetails.status${groupStatus.charAt(0).toUpperCase() + groupStatus.slice(1)}`) }}
          </span>
          <AdminBadge
            v-if="isPlatformAdmin && !isOwner && !isManager"
            :tooltip="t('groupDetails.viewingAsAdmin')"
          />
        </div>

        <div class="header-actions">
          <button
            v-if="showManagerControls"
            :disabled="isRoleUnresolved"
            @click="activeTab = 'settings'"
            class="btn btn-secondary"
          >
            <i class="fas fa-edit"></i>
            {{ t('groupDetails.editGroup') }}
          </button>
        </div>
      </div>

      <!-- Status Bar -->
      <div class="group-status-bar">
        <div class="status-item">
          <i class="fas fa-users"></i>
          <span>{{ t('groupDetails.memberCountLabel', {
            current: displayMemberCount,
            max: currentGroup.max_members
          }) }}</span>
          <i v-if="isMembersLoading" class="fas fa-spinner fa-spin members-loading-icon"></i>
        </div>
        <div class="status-item">
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: actualMemberPercentage + '%' }"
              :class="{ 'progress-warning': actualMemberPercentage >= 80 }"
            ></div>
          </div>
          <span class="capacity-text">
            {{ t('groupDetails.memberCapacity', { percentage: actualMemberPercentage }) }}
          </span>
        </div>
        <div v-if="currentGroup.expires_at" class="status-item">
          <i class="fas fa-calendar"></i>
          <span>{{ t('groupDetails.expiresAt') }}: {{ formatDate(currentGroup.expires_at) }}</span>
        </div>
      </div>

      <!-- Tabs Navigation -->
      <div
        ref="tablist"
        class="group-tabs"
        role="tablist"
        :aria-label="t('groupDetails.tabsLabel')"
        :aria-busy="isRoleUnresolved"
        @keydown="onKeydown"
      >
        <button
          v-for="tab in visibleTabs"
          :key="tab.id"
          v-bind="tabProps(tab.id, tab.disabled)"
          :disabled="tab.disabled"
          @click="activeTab = tab.id"
          :class="['tab-button', {
            active: activeTab === tab.id,
            'tab-button-reserved': tab.disabled
          }]"
        >
          <i :class="tab.icon"></i>
          {{ t(tab.labelKey) }}
          <span v-if="tab.id === 'members'" class="badge">
            <i v-if="isMembersLoading" class="fas fa-spinner fa-spin"></i>
            <template v-else>{{ displayMemberCount }}</template>
          </span>
        </button>
      </div>

      <!-- Tab Content -->
      <!--
        Keyed by group id so every tab is torn down and rebuilt when the teacher
        moves to another group (subgroup / parent links, browser back/forward).
        Tab components load their data on mount only; without this key they would
        have to each watch `groupId` to avoid showing the previous group's rows.
      -->
      <div class="tab-content" :key="groupId ?? ''" v-bind="panelProps(activeTab)">
        <GroupOverviewTab
          v-if="activeTab === 'overview'"
          :group="currentGroup"
          :subgroups="subgroups"
          :owner-user="ownerUser"
          :group-organization="groupOrganization"
          :can-edit-group="canEditGroup"
          :member-count="displayMemberCount"
          @group-updated="handleGroupUpdated"
        />

        <GroupMembersManager
          v-if="activeTab === 'members'"
          ref="membersManagerRef"
          :group-id="groupId!"
          :group="currentGroup"
          :can-edit-group="canEditGroup"
          :is-owner="isOwner"
          :is-manager="isManager"
          :is-platform-admin="isPlatformAdmin"
          :subgroups="subgroups"
          @member-count-changed="handleMemberCountChanged"
        />

        <GroupScenariosTab
          v-if="activeTab === 'scenarios'"
          :group-id="groupId!"
          :can-edit-group="canEditGroup"
          :organization-id="currentGroup?.organization_id"
        />

        <GroupLiveSessionsTab
          v-if="activeTab === 'live'"
          :group-id="groupId!"
          :can-supervise="canEditGroup"
        />

        <GroupActivityTab
          v-if="activeTab === 'activity'"
          :group-id="groupId!"
          :can-view-history="canViewHistory"
        />

        <GroupAnalyticsTab
          v-if="activeTab === 'analytics'"
          :group-id="groupId!"
          :can-edit-group="canEditGroup"
        />

        <div v-if="activeTab === 'history'" class="history-tab">
          <GroupCommandHistory :group-id="currentGroup.id" />
        </div>

        <GroupSettingsTab
          v-if="activeTab === 'settings'"
          :group="currentGroup"
          :can-edit-group="canEditGroup"
          :can-delete-group="canDeleteGroup"
          @group-updated="handleGroupUpdated"
          @group-deleted="() => {}"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.group-detail {
  padding: var(--spacing-lg);
  max-width: 1200px;
  margin: 0 auto;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  gap: var(--spacing-md);
  color: var(--color-text-secondary);
}

.loading-state i {
  font-size: var(--font-size-2xl);
  color: var(--color-primary);
}

.error-state i {
  font-size: var(--font-size-2xl);
  color: var(--color-danger);
}

/* Header */
.group-detail-header {
  margin-bottom: var(--spacing-lg);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-primary);
  text-decoration: none;
  margin-bottom: var(--spacing-md);
  transition: var(--transition-base);
}

.back-link:hover {
  color: var(--color-primary-hover);
}

.header-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.header-title h1 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-2xl);
}

.status-badge {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.badge-success {
  background-color: var(--color-success-bg);
  color: var(--color-success-text);
}

.badge-warning {
  background-color: var(--color-warning-bg);
  color: var(--color-warning-text);
}

.badge-info {
  background-color: var(--color-info-bg);
  color: var(--color-info-text);
}

.badge-danger {
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

/* Status Bar */
.group-status-bar {
  display: flex;
  gap: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
}

.status-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-text-secondary);
}

.progress-bar {
  width: 200px;
  height: 8px;
  background-color: var(--color-bg-tertiary);
  border-radius: var(--border-radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--color-success);
  transition: width var(--transition-base);
}

.progress-fill.progress-warning {
  background-color: var(--color-warning);
}

.capacity-text {
  font-size: var(--font-size-sm);
}

.members-loading-icon {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
}

/* Tabs */
.group-tabs {
  display: flex;
  gap: var(--spacing-sm);
  border-bottom: 2px solid var(--color-border-light);
  margin-bottom: var(--spacing-lg);
}

.tab-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: var(--transition-base);
  margin-bottom: -2px;
}

.tab-button:hover {
  color: var(--color-text-primary);
}

.tab-button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}

/* Slot held for a tab whose availability is still being determined: it occupies its
   final position but must not read or behave as usable yet. */
.tab-button-reserved,
.tab-button-reserved:hover {
  color: var(--color-text-muted);
  opacity: 0.55;
  cursor: default;
}

.tab-button.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.tab-button .badge {
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  padding: 2px 8px;
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
}

/* Tab Content */
.tab-content {
  padding: var(--spacing-md) 0;
}

/* Responsive */
@media (max-width: 768px) {
  .group-detail {
    padding: var(--spacing-md);
  }

  .header-actions {
    flex-direction: column;
    width: 100%;
  }

  .header-actions .btn {
    width: 100%;
  }

  .group-status-bar {
    flex-direction: column;
  }
}
</style>
