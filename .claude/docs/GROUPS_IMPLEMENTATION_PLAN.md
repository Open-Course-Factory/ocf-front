# Groups Management - Complete Frontend Implementation Plan

## Overview
This document details all 7 implementation steps needed to complete the groups management system in the frontend, with fine-tuned requirements for each.

---

## STEP 1: GroupDetail.vue Component ✅ (DETAILED)

**File**: `src/components/Pages/GroupDetail.vue`

See `GROUP_DETAIL_SPECIFICATION.md` for full details.

**Key Features**:
- View group overview with status and capacity
- Manage group members (add, remove, change roles)
- View terminals shared with the group
- Edit group settings (admin/owner only)
- Permission-based UI rendering

**Estimated Lines of Code**: 600-800 LOC
**Complexity**: High
**Dependencies**: BaseModal, classGroupsStore, groupMembersStore

**Deliverables**:
- [ ] Component file with all 4 tabs (overview, members, terminals, settings)
- [ ] Add/remove member modals
- [ ] Delete confirmation modal
- [ ] All translations (EN + FR)
- [ ] Permission checks and error handling
- [ ] Route integration in router/index.ts

---

## STEP 2: GroupDetail Route Addition

**File**: `src/router/index.ts`

**Changes Required**:

```typescript
// Add import
import GroupDetail from '../components/Pages/GroupDetail.vue'

// Add route (after class-groups route)
{
  path: 'class-groups/:id',
  name: 'GroupDetail',
  component: GroupDetail,
  meta: { requiresAuth: true, requiresFeature: 'class_groups' }
}

// Update navigation link in class-groups route to support detail view
```

**Estimated Changes**: 5-10 lines

---

## STEP 3: Enhanced GroupForm Component

**File**: `src/components/Forms/GroupForm.vue`

**Purpose**: Reusable form for creating/editing groups with:
- Display name input (required)
- Description textarea
- Max members number input (with validation)
- Expiration date picker
- Active/inactive toggle
- Auto-slug generation preview

**Key Features**:
```typescript
// Props
interface Props {
  group?: ClassGroup | null
  isLoading?: boolean
  submitText?: string
  onSubmit: (data: Partial<ClassGroup>) => Promise<void>
}

// Validations
const validations = {
  display_name: {
    required: true,
    minLength: 3,
    maxLength: 100
  },
  max_members: {
    required: true,
    min: 1,
    max: 1000
  },
  expires_at: {
    min: today,
    optional: true
  }
}

// Features
- Real-time slug preview from display_name
- Expiry date validation (cannot be in past)
- Max members bounds checking
- Field-level error messages
- Loading state during submission
```

**Estimated Lines of Code**: 250-350 LOC
**Complexity**: Medium
**Reusability**: High (used by GroupDetail, Entity.vue, create flow)

**Deliverables**:
- [ ] Component with form fields and validation
- [ ] Real-time slug generation UI
- [ ] Error display
- [ ] All translations (EN + FR)
- [ ] Export for reuse

---

## STEP 4: useGroupMembers Composable

**File**: `src/composables/useGroupMembers.ts`

**Purpose**: Composable for member management operations with validation and permission checks.

**Functions**:
```typescript
export function useGroupMembers() {
  return {
    // Add member with validation
    addMember: async (
      groupId: string,
      userId: string,
      role: GroupMemberRole
    ) => Promise<GroupMember>

    // Update member role with hierarchy checks
    updateMemberRole: async (
      memberId: string,
      newRole: GroupMemberRole
    ) => Promise<GroupMember>

    // Remove member with owner protection
    removeMember: async (memberId: string) => Promise<void>

    // Validate can manage members (permission check)
    canManageMembers: (
      group: ClassGroup,
      currentUserId: string,
      members: GroupMember[]
    ) => boolean

    // Get member by ID
    getMember: (memberId: string, members: GroupMember[]) => GroupMember | null

    // Check if user is group owner
    isGroupOwner: (
      group: ClassGroup,
      userId: string
    ) => boolean

    // Get role hierarchy level
    getRoleLevel: (role: GroupMemberRole) => number

    // Can user demote this role? (cannot demote higher role)
    canDemoteRole: (
      currentUserRole: GroupMemberRole,
      targetRole: GroupMemberRole
    ) => boolean

    // Validate user can be added to group
    validateAddMember: (
      group: ClassGroup,
      members: GroupMember[]
    ) => { valid: boolean; error?: string }
  }
}
```

**Error Scenarios Handled**:
```typescript
{
  INVALID_ROLE: 'Invalid role specified',
  CANNOT_REMOVE_OWNER: 'Cannot remove group owner',
  CANNOT_MODIFY_OWNER: 'Cannot modify owner permissions',
  GROUP_FULL: 'Group has reached maximum capacity',
  GROUP_EXPIRED: 'Cannot add members to expired group',
  GROUP_INACTIVE: 'Cannot add members to inactive group',
  USER_ALREADY_MEMBER: 'User is already a member',
  PERMISSION_DENIED: 'You do not have permission to manage members',
  ROLE_HIERARCHY_VIOLATION: 'Cannot demote to higher role',
  USER_NOT_FOUND: 'User not found in group'
}
```

**Estimated Lines of Code**: 200-300 LOC
**Complexity**: Medium
**Reusability**: High (used by GroupDetail, GroupMembers entity page)

**Deliverables**:
- [ ] All member management functions
- [ ] Permission validation
- [ ] Error handling with translation keys
- [ ] TypeScript types
- [ ] Unit tests (if testing framework available)

---

## STEP 5: Terminal Sharing Integration

**Files**:
- `src/composables/useTerminalShare.ts` (modifications)
- `src/components/Modals/TerminalShareModal.vue` (modifications)

**Purpose**: Extend terminal sharing to support group sharing.

**Changes to useTerminalShare.ts**:
```typescript
// Add group sharing
export const shareTerminalWithGroup = async (
  terminalId: string,
  groupId: string,
  accessLevel: 'read' | 'write' | 'admin'
): Promise<TerminalShare>

// Get terminals shared with group
export const getTerminalSharesForGroup = async (
  groupId: string
): Promise<TerminalShare[]>

// Update share (user or group)
export const updateShare = async (
  shareId: string,
  updates: Partial<TerminalShare>
): Promise<TerminalShare>

// Remove share
export const removeShare = async (shareId: string): Promise<void>

// List my group shares (for current user's groups)
export const listMyGroupShares = async (): Promise<TerminalShare[]>

// Validate user can share with group
export const canShareWithGroup = (
  group: ClassGroup,
  currentUserId: string
): boolean
```

**Changes to TerminalShareModal.vue**:
```vue
<!-- Add tab or section for group sharing -->
<div class="share-type-selector">
  <input type="radio" value="user" v-model="shareType" /> Share with User
  <input type="radio" value="group" v-model="shareType" /> Share with Group
</div>

<!-- Conditional form -->
<div v-if="shareType === 'user'">
  <!-- Existing user share form -->
</div>
<div v-if="shareType === 'group'">
  <!-- New group share form -->
  <select v-model="selectedGroupId" class="form-control">
    <option value="">Select a group...</option>
    <option v-for="group in myGroups" :value="group.id">
      {{ group.display_name }}
    </option>
  </select>
</div>
```

**Terminal Display Enhancements**:
```vue
<!-- In TerminalMySessions, show group badge -->
<div class="terminal-shares-info">
  <span v-for="share in terminalShares" :key="share.id" class="share-badge">
    <i v-if="share.share_type === 'group'" class="fas fa-users"></i>
    {{ getShareRecipientName(share) }}
  </span>
</div>
```

**Estimated Changes**: 150-250 LOC
**Complexity**: Medium
**Impact**: High (affects terminal sharing UX)

**Deliverables**:
- [ ] useTerminalShare functions for group sharing
- [ ] TerminalShareModal updated with group tab
- [ ] Terminal list shows group shares
- [ ] All translations (EN + FR)
- [ ] Error handling

---

## STEP 6: TerminalMySessions Group Filtering

**File**: `src/components/Pages/TerminalMySessions.vue`

**Purpose**: Add group-based filtering to terminal list view.

**New Features**:
```typescript
// Filter options
const filterOptions = {
  all: 'All Terminals',
  owned: 'My Terminals',
  sharedWithMe: 'Shared with Me',
  sharedWithMyGroups: 'Shared with My Groups'
}

// Computed properties
const myGroupIds = computed(() =>
  myGroups.value.map(g => g.id)
)

const terminalsSharedWithMyGroups = computed(() =>
  terminals.value.filter(terminal =>
    terminalShares.value.some(share =>
      share.terminal_id === terminal.id &&
      share.share_type === 'group' &&
      myGroupIds.value.includes(share.shared_with_group_id!)
    )
  )
)

const filteredTerminals = computed(() => {
  switch (selectedFilter.value) {
    case 'owned':
      return terminals.value.filter(t => t.user_id === currentUser.userId)
    case 'sharedWithMe':
      return terminals.value.filter(t => t.user_id !== currentUser.userId)
    case 'sharedWithMyGroups':
      return terminalsSharedWithMyGroups.value
    default:
      return terminals.value
  }
})
```

**UI Enhancements**:
```vue
<!-- Filter buttons -->
<div class="filter-buttons">
  <button
    v-for="(label, key) in filterOptions"
    :key="key"
    @click="selectedFilter = key"
    :class="['filter-btn', { active: selectedFilter === key }]"
  >
    {{ label }}
    <span v-if="key === 'sharedWithMyGroups'" class="badge">
      {{ terminalsSharedWithMyGroups.length }}
    </span>
  </button>
</div>

<!-- Terminal cards with group badge -->
<div v-for="terminal in filteredTerminals" :key="terminal.id" class="terminal-card">
  <!-- Existing content -->
  <div class="terminal-recipients">
    <span v-for="share in getTerminalShares(terminal.id)" :key="share.id" class="recipient-badge">
      <i v-if="share.share_type === 'group'" class="fas fa-users"></i>
      {{ getShareRecipientName(share) }}
    </span>
  </div>
</div>
```

**Estimated Changes**: 100-150 LOC
**Complexity**: Low-Medium
**Reusability**: Low (specific to TerminalMySessions)

**Deliverables**:
- [ ] Filter dropdown/buttons
- [ ] Computed properties for filtered lists
- [ ] Terminal cards show group sharing info
- [ ] All translations (EN + FR)
- [ ] Group badge styling

---

## STEP 7: Entity.vue Enhancements for Groups

**File**: `src/components/Pages/Entity.vue`

**Purpose**: Add group-specific features to generic entity component.

**New Features**:
```typescript
// Props
interface Props {
  entityName: string
  entityStore: any
  // ... existing props

  // New for groups
  enableGroupDetails?: boolean
  groupDetailRoute?: string
}

// If entity is groups, add detail link
const getRowLink = (entity) => {
  if (entityName === 'class-groups' && enableGroupDetails) {
    return {
      name: 'GroupDetail',
      params: { id: entity.id }
    }
  }
  return null
}

// Show group-specific columns
const getVisibleColumns = computed(() => {
  if (entityName === 'class-groups') {
    return [
      'display_name',
      'member_count', // Show as "12 / 30 members"
      'expires_at',
      'is_active',
      'actions'
    ]
  }
  // ... handle other entities
})
```

**Display Enhancements**:
```vue
<!-- For groups entity, show custom member count -->
<td v-if="field.name === 'member_count'">
  {{ entity.member_count }} / {{ entity.max_members }}
  <div class="capacity-bar">
    <div class="capacity-fill" :style="{ width: getCapacityPercent(entity) + '%' }"></div>
  </div>
</td>

<!-- Show status badges -->
<td v-if="field.name === 'is_active'">
  <span v-if="entity.is_expired" class="badge badge-warning">
    <i class="fas fa-exclamation"></i>
    {{ t('groupDetail.statusExpired') }}
  </span>
  <span v-else-if="entity.is_full" class="badge badge-info">
    <i class="fas fa-users"></i>
    {{ t('groupDetail.statusFull') }}
  </span>
  <span v-else :class="['badge', entity.is_active ? 'badge-success' : 'badge-danger']">
    {{ entity.is_active ? t('groupDetail.statusActive') : t('groupDetail.statusInactive') }}
  </span>
</td>

<!-- Row clickable for detail view -->
<tr
  @click="navigateToDetail(entity)"
  :class="{ 'clickable-row': canViewDetail(entity) }"
>
  <!-- cells -->
</tr>
```

**Estimated Changes**: 100-200 LOC
**Complexity**: Low
**Reusability**: High (improves generic component)

**Deliverables**:
- [ ] Group-specific column rendering
- [ ] Member count progress bar
- [ ] Status badges for full/expired
- [ ] Detail view link (click row to view)
- [ ] All translations (EN + FR)
- [ ] Styling for badges and progress bar

---

## STEP 8: Testing & Validation (Optional but Recommended)

**Test Coverage**:

### Unit Tests (if framework available)
```typescript
// Tests for useGroupMembers composable
- addMember validation
- Permission checks
- Role hierarchy

// Tests for permission computed properties
- isOwner check
- canManageMembers logic
- canDeleteGroup restrictions

// Tests for formatters
- Member capacity percentage
- Date formatting for joins
```

### Component Tests
```typescript
// GroupDetail.vue
- Tab switching works
- Modal opens/closes
- Form submission
- Permission-based UI
- Loading states

// GroupForm.vue
- Slug generation preview
- Date validation
- Field error messages
- Submit handling
```

### Manual Testing Checklist
```
✓ Create group with all fields
✓ Add member with different roles
✓ Remove member (cannot remove owner)
✓ Change member role
✓ Edit group settings (owner/admin only)
✓ Delete group (owner only)
✓ View group details for different roles
✓ Share terminal with group
✓ Filter terminals by group shares
✓ Feature flag enables/disables groups
✓ Responsive on mobile/tablet
✓ All translations display correctly
✓ Error messages appear on failed operations
✓ Success messages appear on successful operations
✓ Group expired status shows correctly
✓ Group full status shows correctly
```

**Estimated Time**: 2-4 hours

---

## Implementation Order Recommendation

### Phase 1: Core Group Management (Days 1-2)
1. **GroupDetail.vue** - Main component for viewing/managing group
2. **GroupForm.vue** - Reusable form for creating/editing
3. **useGroupMembers** - Member management logic

### Phase 2: Integration (Day 3)
4. **Route addition** - Connect GroupDetail to router
5. **Terminal sharing** - Extend for group support

### Phase 3: Polish & Enhancement (Day 4)
6. **Terminal filtering** - Show group-shared terminals
7. **Entity.vue improvements** - Better group display
8. **Testing** - Validate all features work

---

## Code Quality Checklist

Before submitting each component:

### General
- [ ] No `@` alias imports (use relative paths)
- [ ] All TypeScript types properly defined
- [ ] Error handling with i18n translations
- [ ] Feature flag checks where needed
- [ ] No console.log (use import.meta.env.DEV)

### Styling
- [ ] All colors use CSS variables
- [ ] Responsive breakpoints implemented
- [ ] Dark mode compatible
- [ ] BEM naming convention followed
- [ ] No hardcoded colors/spacing

### Translations
- [ ] Both EN and FR provided
- [ ] No hardcoded user-facing text
- [ ] Translations grouped by domain
- [ ] useTranslations() composable used

### Performance
- [ ] Async operations wrapped in asyncWrapper()
- [ ] No unnecessary re-renders
- [ ] Computed properties for derived state
- [ ] Watch callbacks properly cleaned up

### Accessibility
- [ ] ARIA labels on buttons/inputs
- [ ] Keyboard navigation working
- [ ] Color contrast meets WCAG AA
- [ ] Focus states visible

### Testing
- [ ] Happy path works
- [ ] Error scenarios handled
- [ ] Permission checks working
- [ ] Edge cases covered

---

## Integration Dependencies Map

```
GroupDetail.vue
├── classGroupsStore
├── groupMembersStore
├── useGroupMembers
├── GroupForm.vue
├── BaseModal
├── useFeatureFlags
└── useTranslations

GroupForm.vue
├── useTranslations
├── asyncWrapper
└── formatters

useGroupMembers
├── groupMembersStore
└── types (ClassGroup, GroupMember)

TerminalMySessions.vue (enhanced)
├── useTerminalShare (enhanced)
├── terminalSharesStore (if needed)
└── classGroupsStore (to load groups)

Entity.vue (enhanced)
├── classGroupsStore (for group detection)
└── formatters

TerminalShareModal.vue (enhanced)
├── useTerminalShare (enhanced)
├── classGroupsStore
└── useTranslations
```

---

## Estimated Timeline

| Step | LOC | Days | Status |
|------|-----|------|--------|
| 1. GroupDetail.vue | 600-800 | 1.5-2 | 📋 |
| 2. Route Addition | 10 | 0.25 | 📋 |
| 3. GroupForm.vue | 250-350 | 0.75-1 | 📋 |
| 4. useGroupMembers | 200-300 | 0.75-1 | 📋 |
| 5. Terminal Sharing | 150-250 | 0.75-1 | 📋 |
| 6. Terminal Filtering | 100-150 | 0.5-0.75 | 📋 |
| 7. Entity.vue Enhancements | 100-200 | 0.5-0.75 | 📋 |
| 8. Testing & Validation | - | 2-4 | 📋 |
| **Total** | **1500-2200** | **7-11** | **✅** |

---

## Risk Mitigation

### Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Permission bugs allow unauthorized access | Use permission checks in all functions; test each role |
| Feature flag not working | Verify backend returns flag; test flag enabling/disabling |
| Performance with large member lists | Implement pagination for 50+ members |
| Date timezone issues | Use formatDate/formatDateTime utilities |
| Type errors at runtime | Use strict TypeScript; test with different user roles |
| Responsive layout breaks on mobile | Test on actual devices; use mobile breakpoints |
| Translations missing | Use key exists check; provide EN fallback |
| API errors not handled | Wrap all axios calls; show user-friendly messages |

---

## Questions to Answer During Implementation

1. **Member Search**: Should we search by ID, email, or both?
2. **Bulk Operations**: Should we support bulk add/remove members?
3. **Audit Log**: Should we track all member changes?
4. **Email Notifications**: Should we notify members when added/removed?
5. **Role Inheritance**: Should we support role hierarchies (group admin vs group member)?
6. **Terminal Quota**: Should groups have terminal usage limits?
7. **Password Policy**: Should groups enforce password policies on members?
8. **Session Limits**: Should we limit concurrent sessions per group?

---

## Summary

This comprehensive plan provides:
- ✅ Detailed specifications for each step
- ✅ File locations and estimated LOC
- ✅ Code examples and patterns
- ✅ Testing checklists
- ✅ Integration diagrams
- ✅ Timeline and complexity estimates
- ✅ Risk mitigation strategies

Ready to implement when you approve the plan!
