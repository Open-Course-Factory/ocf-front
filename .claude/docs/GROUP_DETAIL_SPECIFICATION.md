# GroupDetail.vue Component Specification

## Overview
The `GroupDetail.vue` component provides a comprehensive view and management interface for individual groups, including members, settings, and terminal sharing. It serves as the dedicated detail page accessed via `/class-groups/:id` route.

---

## Component Architecture

### File Location
```
src/components/Pages/GroupDetail.vue
```

### Route Integration
```typescript
// In src/router/index.ts
{
  path: 'class-groups/:id',
  name: 'GroupDetail',
  component: GroupDetail,
  meta: { requiresAuth: true, requiresFeature: 'class_groups' }
}
```

### Imports & Dependencies
```typescript
// Core Vue
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Stores
import { useClassGroupsStore } from '../../stores/classGroups'
import { useGroupMembersStore } from '../../stores/groupMembers'
import { useCurrentUserStore } from '../../stores/currentUser'

// Services & Composables
import { useTranslations } from '../../composables/useTranslations'
import { useFeatureFlags } from '../../composables/useFeatureFlags'
import { asyncWrapper } from '../../utils/asyncWrapper'

// Types
import { ClassGroup, GroupMember } from '../../types'

// Components
import BaseModal from '../Modals/BaseModal.vue'
import ErrorAlert from '../UI/ErrorAlert.vue'  // (if exists)
```

---

## Data Structure & State Management

### Reactive State
```typescript
const {
  // Group Data
  currentGroup: ref<ClassGroup | null>,
  members: ref<GroupMember[]>,
  isLoading: ref<boolean>,
  error: ref<string>,

  // UI State
  activeTab: ref<'overview' | 'members' | 'terminals' | 'settings'>,
  isEditingGroup: ref<boolean>,
  showAddMemberModal: ref<boolean>,
  showDeleteConfirm: ref<boolean>,

  // Form Data
  editFormData: ref<Partial<ClassGroup>>,
  newMemberData: ref<{
    user_id: string
    role: 'owner' | 'admin' | 'assistant' | 'member'
  }>,

  // Pagination (if members list is long)
  memberPage: ref<number>,
  membersPerPage: ref<number>,
  totalMembers: ref<number>
}
```

### Computed Properties
```typescript
const {
  // Permissions
  canEditGroup: computed(() => boolean),
  canManageMembers: computed(() => boolean),
  canDeleteGroup: computed(() => boolean),
  isOwner: computed(() => boolean),
  isAdmin: computed(() => boolean),

  // Status
  groupStatus: computed(() => 'active' | 'expired' | 'full'),
  statusColor: computed(() => 'green' | 'red' | 'orange'),
  memberCountPercentage: computed(() => number),

  // Filters
  paginatedMembers: computed(() => GroupMember[]),
  sortedMembers: computed(() => GroupMember[]),  // Sorted by role hierarchy
  activeMembers: computed(() => GroupMember[]),

  // UI
  pageTitle: computed(() => string),
  breadcrumbs: computed(() => Array)
}
```

---

## Translations (i18n)

### Translation Keys Structure
```typescript
const translations = {
  en: {
    groupDetail: {
      // Page & Titles
      pageTitle: 'Group Details',
      backToGroups: 'Back to Groups',
      groupNotFound: 'Group not found',

      // Tabs
      tabOverview: 'Overview',
      tabMembers: 'Members',
      tabTerminals: 'Terminals',
      tabSettings: 'Settings',

      // Overview Section
      displayName: 'Display Name',
      description: 'Description',
      owner: 'Owner',
      createdAt: 'Created',
      updatedAt: 'Updated',
      expiresAt: 'Expires',

      // Status
      statusActive: 'Active',
      statusInactive: 'Inactive',
      statusExpired: 'Expired',
      statusFull: 'Full',

      // Member Count
      memberCount: 'Members',
      memberCountLabel: '{current} / {max} members',
      memberCapacity: '{percentage}% capacity',

      // Members Section
      memberEmail: 'Email',
      memberRole: 'Role',
      memberJoinedAt: 'Joined',
      memberStatus: 'Status',
      memberActions: 'Actions',

      // Roles
      roleOwner: 'Owner',
      roleAdmin: 'Admin',
      roleAssistant: 'Assistant',
      roleMember: 'Member',

      // Buttons & Actions
      editGroup: 'Edit Group',
      deleteGroup: 'Delete Group',
      addMember: 'Add Member',
      removeFromGroup: 'Remove',
      changeMemberRole: 'Change Role',
      leaveGroup: 'Leave Group',
      saveChanges: 'Save Changes',
      cancel: 'Cancel',

      // Modals
      addMemberTitle: 'Add Member to {groupName}',
      selectUser: 'Select User',
      selectRole: 'Select Role',
      deleteConfirmTitle: 'Delete Group?',
      deleteConfirmMessage: 'This action cannot be undone. All members will be removed.',

      // Forms & Fields
      displayNameHelp: 'Human-readable group name',
      descriptionHelp: 'Brief description of the group purpose',
      maxMembersHelp: 'Maximum members allowed',
      expiresAtHelp: 'Optional expiration date',

      // Messages
      memberAddedSuccess: '{memberName} added as {role}',
      memberRemovedSuccess: '{memberName} removed from group',
      memberRoleUpdatedSuccess: '{memberName} role updated to {role}',
      groupUpdatedSuccess: 'Group updated successfully',
      groupDeletedSuccess: 'Group deleted successfully',
      leftGroupSuccess: 'You have left the group',

      // Errors
      groupLoadError: 'Failed to load group details',
      memberLoadError: 'Failed to load members',
      memberAddError: 'Failed to add member',
      memberRemoveError: 'Failed to remove member',
      memberRoleError: 'Failed to update member role',
      groupUpdateError: 'Failed to update group',
      groupDeleteError: 'Failed to delete group',
      cannotRemoveOwner: 'Cannot remove the group owner',
      cannotDeleteNotOwner: 'Only the owner can delete the group',
      cannotManageNotAdmin: 'You do not have permission to manage members',
      userNotFound: 'User not found',
      userAlreadyMember: 'User is already a member',
      groupFull: 'Group is at maximum capacity',
      groupExpired: 'Group has expired',
      groupInactive: 'Group is inactive',

      // Empty States
      noMembers: 'No members in this group',
      noTerminals: 'No terminals shared with this group',

      // Loading
      loadingGroup: 'Loading group...',
      loadingMembers: 'Loading members...',
      savingChanges: 'Saving changes...'
    }
  },
  fr: {
    groupDetail: {
      // Same structure in French
      pageTitle: 'Détails du groupe',
      backToGroups: 'Retour aux groupes',
      // ... (translate all keys above)
    }
  }
}
```

---

## Component Structure & Layout

### Template Sections

#### 1. Header/Breadcrumb
```vue
<div class="group-detail-header">
  <router-link to="/class-groups" class="btn btn-link">
    <i class="fas fa-arrow-left"></i>
    {{ t('groupDetail.backToGroups') }}
  </router-link>
  <h1>{{ currentGroup?.display_name }}</h1>
  <div class="header-actions">
    <button v-if="canEditGroup" @click="openEditForm" class="btn btn-primary">
      <i class="fas fa-edit"></i>
      {{ t('groupDetail.editGroup') }}
    </button>
    <button v-if="canDeleteGroup" @click="showDeleteConfirm = true" class="btn btn-danger">
      <i class="fas fa-trash"></i>
      {{ t('groupDetail.deleteGroup') }}
    </button>
  </div>
</div>
```

#### 2. Status Bar
```vue
<div class="group-status-bar">
  <div class="status-item">
    <span class="status-badge" :class="statusColor">
      {{ groupStatus }}
    </span>
  </div>
  <div class="status-item">
    <span class="member-count">
      {{ memberCountPercentage }}% {{ t('groupDetail.memberCapacity') }}
    </span>
    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: memberCountPercentage + '%' }"></div>
    </div>
  </div>
  <div class="status-item" v-if="currentGroup?.expires_at">
    {{ t('groupDetail.expiresAt') }}: {{ formatDate(currentGroup.expires_at) }}
  </div>
</div>
```

#### 3. Tabs Navigation
```vue
<div class="group-tabs">
  <button
    v-for="tab in ['overview', 'members', 'terminals', 'settings']"
    :key="tab"
    @click="activeTab = tab"
    :class="['tab-button', { active: activeTab === tab }]"
  >
    <i :class="getTabIcon(tab)"></i>
    {{ t(`groupDetail.tab${capitalize(tab)}`) }}
  </button>
</div>
```

#### 4. Tab Content (Overview)
```vue
<div v-show="activeTab === 'overview'" class="tab-content overview-tab">
  <div class="info-grid">
    <div class="info-item">
      <label>{{ t('groupDetail.displayName') }}</label>
      <p>{{ currentGroup?.display_name }}</p>
    </div>
    <div class="info-item">
      <label>{{ t('groupDetail.owner') }}</label>
      <p>{{ ownerName }}</p>
    </div>
    <div class="info-item">
      <label>{{ t('groupDetail.description') }}</label>
      <p>{{ currentGroup?.description || '-' }}</p>
    </div>
    <div class="info-item">
      <label>{{ t('groupDetail.memberCount') }}</label>
      <p>{{ currentGroup?.member_count }} / {{ currentGroup?.max_members }}</p>
    </div>
    <div class="info-item">
      <label>{{ t('groupDetail.createdAt') }}</label>
      <p>{{ formatDateTime(currentGroup?.created_at) }}</p>
    </div>
    <div class="info-item">
      <label>{{ t('groupDetail.updatedAt') }}</label>
      <p>{{ formatDateTime(currentGroup?.updated_at) }}</p>
    </div>
  </div>
</div>
```

#### 5. Tab Content (Members)
```vue
<div v-show="activeTab === 'members'" class="tab-content members-tab">
  <div class="members-toolbar">
    <input
      v-model="memberSearchQuery"
      type="text"
      :placeholder="t('groupDetail.searchMembers')"
      class="search-input"
    />
    <button v-if="canManageMembers" @click="showAddMemberModal = true" class="btn btn-primary">
      <i class="fas fa-plus"></i>
      {{ t('groupDetail.addMember') }}
    </button>
  </div>

  <div v-if="members.length === 0" class="empty-state">
    <i class="fas fa-users"></i>
    <p>{{ t('groupDetail.noMembers') }}</p>
  </div>

  <div v-else class="members-list">
    <div v-for="member in paginatedMembers" :key="member.id" class="member-card">
      <div class="member-info">
        <div class="member-avatar">{{ member.user_id.charAt(0).toUpperCase() }}</div>
        <div class="member-details">
          <div class="member-email">{{ member.user_id }}</div>
          <div class="member-role">
            <span class="role-badge" :class="'role-' + member.role">
              {{ t(`groupDetail.role${capitalize(member.role)}`) }}
            </span>
          </div>
          <div class="member-joined">
            {{ t('groupDetail.memberJoinedAt') }}: {{ formatDate(member.joined_at) }}
          </div>
        </div>
      </div>
      <div v-if="canManageMembers && member.role !== 'owner'" class="member-actions">
        <select
          v-model="member.role"
          @change="updateMemberRole(member)"
          class="role-select"
        >
          <option value="admin">{{ t('groupDetail.roleAdmin') }}</option>
          <option value="assistant">{{ t('groupDetail.roleAssistant') }}</option>
          <option value="member">{{ t('groupDetail.roleMember') }}</option>
        </select>
        <button @click="removeMember(member)" class="btn btn-sm btn-danger">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  </div>
</div>
```

#### 6. Tab Content (Terminals)
```vue
<div v-show="activeTab === 'terminals'" class="tab-content terminals-tab">
  <div v-if="groupTerminals.length === 0" class="empty-state">
    <i class="fas fa-laptop"></i>
    <p>{{ t('groupDetail.noTerminals') }}</p>
  </div>

  <div v-else class="terminals-list">
    <!-- List of terminals shared with this group -->
    <div v-for="terminal in groupTerminals" :key="terminal.id" class="terminal-share-card">
      <!-- Terminal info -->
    </div>
  </div>
</div>
```

#### 7. Tab Content (Settings)
```vue
<div v-show="activeTab === 'settings'" class="tab-content settings-tab">
  <div v-if="canEditGroup" class="settings-form">
    <!-- Group settings form: display_name, description, max_members, expires_at, is_active -->
  </div>
  <div v-else class="permission-denied">
    <i class="fas fa-lock"></i>
    <p>{{ t('groupDetail.cannotManageNotAdmin') }}</p>
  </div>
</div>
```

---

## Modals

### 1. Add Member Modal
```vue
<BaseModal
  :visible="showAddMemberModal"
  :title="t('groupDetail.addMemberTitle', { groupName: currentGroup?.display_name })"
  size="medium"
  :is-loading="isAddingMember"
  :show-default-footer="true"
  :confirm-text="t('groupDetail.addMember')"
  :cancel-text="t('groupDetail.cancel')"
  @confirm="handleAddMember"
  @close="showAddMemberModal = false"
>
  <form @submit.prevent="handleAddMember">
    <div class="form-group">
      <label>{{ t('groupDetail.selectUser') }}</label>
      <input
        v-model="newMemberData.user_id"
        type="text"
        placeholder="Enter user ID or email"
        class="form-control"
      />
    </div>
    <div class="form-group">
      <label>{{ t('groupDetail.selectRole') }}</label>
      <select v-model="newMemberData.role" class="form-select">
        <option value="member">{{ t('groupDetail.roleMember') }}</option>
        <option value="assistant">{{ t('groupDetail.roleAssistant') }}</option>
        <option value="admin">{{ t('groupDetail.roleAdmin') }}</option>
      </select>
    </div>
    <div v-if="addMemberError" class="alert alert-danger">
      {{ addMemberError }}
    </div>
  </form>
</BaseModal>
```

### 2. Delete Confirmation Modal
```vue
<BaseModal
  :visible="showDeleteConfirm"
  :title="t('groupDetail.deleteConfirmTitle')"
  size="small"
  :show-default-footer="true"
  :confirm-text="t('groupDetail.deleteGroup')"
  :cancel-text="t('groupDetail.cancel')"
  @confirm="handleDeleteGroup"
  @close="showDeleteConfirm = false"
>
  <p>{{ t('groupDetail.deleteConfirmMessage') }}</p>
</BaseModal>
```

---

## Methods & Functions

### 1. Data Loading
```typescript
const loadGroup = asyncWrapper(
  async () => {
    if (!route.params.id) return
    const response = await groupStore.getOne(route.params.id)
    currentGroup.value = response
  },
  groupStore,
  'groupDetail.groupLoadError',
  'Loading group details'
)

const loadMembers = asyncWrapper(
  async () => {
    if (!currentGroup.value) return
    const response = await memberStore.loadEntities()
    // Filter by group_id
    members.value = response.filter(m => m.group_id === currentGroup.value!.id)
  },
  memberStore,
  'groupDetail.memberLoadError',
  'Loading members'
)
```

### 2. Member Management
```typescript
const addMember = asyncWrapper(
  async () => {
    if (!currentGroup.value || !newMemberData.value.user_id) return

    const newMember = {
      group_id: currentGroup.value.id,
      user_id: newMemberData.value.user_id,
      role: newMemberData.value.role
    }

    const created = await memberStore.create(newMember)
    members.value.push(created)
    showAddMemberModal.value = false
    newMemberData.value = { user_id: '', role: 'member' }
  },
  memberStore,
  'groupDetail.memberAddError',
  'Adding member'
)

const updateMemberRole = asyncWrapper(
  async (member: GroupMember) => {
    await memberStore.update(member.id, { role: member.role })
    // Success message
  },
  memberStore,
  'groupDetail.memberRoleError',
  'Updating member role'
)

const removeMember = asyncWrapper(
  async (member: GroupMember) => {
    if (member.role === 'owner') {
      error.value = t('groupDetail.cannotRemoveOwner')
      return
    }
    await memberStore.delete(member.id)
    members.value = members.value.filter(m => m.id !== member.id)
  },
  memberStore,
  'groupDetail.memberRemoveError',
  'Removing member'
)
```

### 3. Group Management
```typescript
const updateGroup = asyncWrapper(
  async () => {
    if (!currentGroup.value) return
    await groupStore.update(currentGroup.value.id, editFormData.value)
    isEditingGroup.value = false
  },
  groupStore,
  'groupDetail.groupUpdateError',
  'Updating group'
)

const deleteGroup = asyncWrapper(
  async () => {
    if (!currentGroup.value) return
    await groupStore.delete(currentGroup.value.id)
    router.push('/class-groups')
  },
  groupStore,
  'groupDetail.groupDeleteError',
  'Deleting group'
)

const leaveGroup = asyncWrapper(
  async () => {
    const currentUserMember = members.value.find(m => m.user_id === currentUser.userId)
    if (!currentUserMember) return
    await memberStore.delete(currentUserMember.id)
    router.push('/class-groups')
  },
  memberStore,
  'groupDetail.leftGroupSuccess',
  'Leaving group'
)
```

### 4. Permission Checks
```typescript
const canEditGroup = computed(() => {
  return isOwner.value || isAdmin.value
})

const canManageMembers = computed(() => {
  return isOwner.value || isAdmin.value
})

const canDeleteGroup = computed(() => {
  return isOwner.value
})

const isOwner = computed(() => {
  return currentGroup.value?.owner_user_id === currentUser.userId
})

const isAdmin = computed(() => {
  const member = members.value.find(m => m.user_id === currentUser.userId)
  return member?.role === 'admin' || member?.role === 'owner'
})
```

### 5. Lifecycle Hooks
```typescript
onMounted(async () => {
  await loadGroup()
  await loadMembers()
})

watch(() => route.params.id, async () => {
  await loadGroup()
  await loadMembers()
})
```

---

## Styling & CSS Classes

### BEM Structure
```css
/* Main Container */
.group-detail { }
.group-detail__header { }
.group-detail__title { }
.group-detail__actions { }

/* Status Bar */
.group-status-bar { }
.group-status-bar__item { }
.status-badge { }
.status-badge--active { }
.status-badge--expired { }
.status-badge--full { }

/* Tabs */
.group-tabs { }
.group-tabs__button { }
.group-tabs__button--active { }

/* Members */
.members-list { }
.member-card { }
.member-card__avatar { }
.member-card__info { }
.member-card__actions { }
.role-badge { }
.role-badge--owner { }
.role-badge--admin { }
.role-badge--assistant { }
.role-badge--member { }

/* Forms */
.settings-form { }
.form-group { }
```

### CSS Variables Used
```css
--color-primary
--color-danger
--color-success
--color-warning
--color-text-primary
--color-bg-primary
--color-bg-secondary
--color-border
--spacing-*
--font-size-*
--border-radius-*
--shadow-*
--transition-*
```

---

## Feature Flag Integration

### Check Feature Flag
```typescript
const { isEnabled } = useFeatureFlags()

// In component setup
if (!isEnabled('class_groups')) {
  router.push('/dashboard')
}
```

### Conditional Rendering
```vue
<template v-if="isEnabled('class_groups')">
  <!-- Group detail content -->
</template>
```

---

## Error Handling

### HTTP Error Responses
```typescript
// Handle 403 (Permission Denied)
if (error.response?.status === 403) {
  error.value = t('groupDetail.cannotManageNotAdmin')
}

// Handle 404 (Not Found)
if (error.response?.status === 404) {
  error.value = t('groupDetail.groupNotFound')
}

// Handle 400 (Validation)
if (error.response?.status === 400) {
  if (error.response.data.code === 'GROUP_FULL') {
    error.value = t('groupDetail.groupFull')
  } else if (error.response.data.code === 'GROUP_EXPIRED') {
    error.value = t('groupDetail.groupExpired')
  }
}
```

### User-Friendly Messages
- Always translate error messages
- Show context (which user, which field)
- Provide recovery actions (Try again, Go back, etc.)

---

## Performance Considerations

### Lazy Loading
- Load members on tab click (not on page load)
- Paginate members list for large groups (e.g., 50+)

### Pagination
```typescript
const MEMBERS_PER_PAGE = 20

const paginatedMembers = computed(() => {
  const start = (memberPage.value - 1) * membersPerPage.value
  const end = start + membersPerPage.value
  return sortedMembers.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(totalMembers.value / membersPerPage.value)
})
```

### Caching
- Use store's cached data when possible
- Only refetch if explicitly requested (pull-to-refresh)
- Cache group details for 5 minutes

---

## Responsive Design

### Breakpoints
- **Desktop** (> 1200px): Full layout with all tabs visible
- **Tablet** (768px - 1200px): Tabs in dropdown or icon-based
- **Mobile** (< 768px): Stacked layout, single column

### Mobile-Specific
```css
@media (max-width: 768px) {
  .group-detail__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .group-tabs {
    flex-wrap: wrap;
  }

  .member-card {
    flex-direction: column;
  }

  .member-card__actions {
    margin-top: var(--spacing-md);
    justify-content: flex-start;
  }
}
```

---

## Testing Requirements

### Unit Tests
```typescript
// Test permission checks
// Test computed properties (capacity %, status)
// Test member sorting/filtering
// Test form validation

// Test asyncWrapper integration
// Test error handling
// Test i18n translations
```

### Component Tests
```typescript
// Test tab switching
// Test modal open/close
// Test form submission
// Test member addition/removal
// Test permission-based UI rendering
```

### E2E Tests
```gherkin
Scenario: User views their group details
  Given user is on group detail page
  When group data loads
  Then display name and description are visible
  And member count progress bar shows capacity

Scenario: Owner can add members
  Given user is group owner
  When they click "Add Member"
  And fill in user ID and role
  And confirm
  Then member appears in list
  And success message displayed

Scenario: Permission denied for non-admin
  Given user is regular member
  Then "Edit Group" button not visible
  And "Add Member" button not visible
  When they try to access settings tab
  Then permission denied message shown
```

---

## Accessibility (a11y)

### ARIA Labels
```vue
<button
  aria-label="Edit group settings"
  @click="editGroup"
>
  <i class="fas fa-edit" aria-hidden="true"></i>
</button>
```

### Keyboard Navigation
- Tab through all interactive elements
- Enter/Space to activate buttons
- Escape to close modals
- Arrow keys to navigate tabs

### Color Contrast
- Ensure all text meets WCAG AA standards
- Use CSS variables with sufficient contrast
- Don't rely on color alone for status

---

## Integration Points

### 1. With TerminalMySessions
- Show "Shared with" groups in terminal list
- Allow sharing terminals with groups from terminal actions

### 2. With Entity Store
- Use baseStore CRUD operations
- Respect loading states and error handling
- Follow beforeCreate/beforeUpdate/afterDelete hooks if needed

### 3. With Feature Flags
- Route meta includes `requiresFeature: 'class_groups'`
- Check feature flag at component level
- Graceful degradation if flag disabled

---

## Future Enhancements

1. **Email Invitations**: Send invitation links to new members
2. **Bulk Member Import**: CSV upload for adding multiple members
3. **Group Policies**: Password requirements, session limits per group
4. **Activity Audit Log**: Track all group changes and member actions
5. **Group Templates**: Pre-configured groups for quick setup
6. **Nested Groups**: Support for subgroups and hierarchy
7. **Analytics**: Usage statistics and member engagement metrics
8. **Casdoor Sync**: Sync with external auth provider groups

---

## Code Quality Standards

### Follow CLAUDE.md Guidelines
- ✅ Use relative imports (no `@` alias)
- ✅ Use shared formatters from `/src/utils/formatters`
- ✅ Use centralized types from `/src/types/`
- ✅ Use CSS variables (never hardcode colors)
- ✅ Use `useTranslations()` composable for i18n
- ✅ Use `asyncWrapper()` for async operations
- ✅ Implement proper error handling
- ✅ Add proper TypeScript types

### Code Style
```typescript
// Good: Descriptive variable names
const isUserGroupOwner = computed(() =>
  currentGroup.value?.owner_user_id === currentUser.userId
)

// Good: Consistent naming for stores
const groupStore = useClassGroupsStore()
const memberStore = useGroupMembersStore()

// Good: Proper error handling with translations
catch (err: any) {
  error.value = err.response?.data?.error_message ||
                err.response?.data?.message ||
                t('groupDetail.groupLoadError')
}
```

---

## Summary

**GroupDetail.vue** is a comprehensive component that:

1. ✅ Displays group overview with status and capacity
2. ✅ Manages group members with role-based access
3. ✅ Shows shared terminals with the group
4. ✅ Allows editing group settings (for admin/owner)
5. ✅ Respects permission hierarchy (owner > admin > member)
6. ✅ Provides intuitive member management UI
7. ✅ Integrates with feature flags
8. ✅ Follows all CLAUDE.md patterns and guidelines
9. ✅ Fully internationalized (English + French)
10. ✅ Mobile-responsive and accessible

This component enhances the groups system by providing a detailed view that users need to effectively manage their groups and collaborate with team members.
