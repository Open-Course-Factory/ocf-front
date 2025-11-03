# Groups Management - Architecture & Flow Diagrams

## 1. Component Hierarchy

```
App.vue
├── Layout.vue (with sidebar nav)
│   └── router-view
│       ├── ClassGroups.vue (LIST PAGE - existing)
│       │   └── Entity.vue (generic wrapper)
│       │       └── Group list with CRUD
│       │
│       ├── GroupDetails.vue (DETAIL PAGE - NEW)
│       │   ├── Tabs Navigation
│       │   │   ├── Overview Tab
│       │   │   ├── Members Tab
│       │   │   ├── Terminals Tab
│       │   │   └── Settings Tab
│       │   ├── BaseModal (Add Member)
│       │   ├── BaseModal (Delete Confirm)
│       │   ├── GroupForm.vue (Settings)
│       │   └── useGroupMembers (logic)
│       │
│       ├── GroupMembers.vue (LIST PAGE - existing)
│       │   └── Entity.vue (generic wrapper)
│       │       └── Members list with CRUD
│       │
│       └── TerminalMySessions.vue (MODIFIED)
│           ├── Terminal filter (new)
│           │   └── "Shared with My Groups" filter
│           └── Terminal share badge (new)
│               └── Shows which groups terminal is shared with
│
├── TerminalShareModal.vue (MODIFIED)
│   ├── User Share Tab (existing)
│   └── Group Share Tab (NEW)
│       └── Group selection dropdown
│
└── Sidebar Navigation (MainNavMenu.vue - existing)
    ├── Groups
    │   ├── Groups (with feature flag)
    │   └── Group Members (with feature flag)
    └── Practical Work
        └── Terminals (with group share indicators)
```

---

## 2. Data Flow Diagram

### Group Creation Flow
```
User clicks "Create Group"
    ↓
GroupForm.vue opens (modal or page)
    ↓
User fills: displayName, description, maxMembers, expiresAt
    ↓
Frontend validates:
  ✓ displayName: 3-100 chars
  ✓ maxMembers: > 0
  ✓ expiresAt: not in past
    ↓
Auto-generate slug from displayName
    ↓
POST /class-groups
  Request: { name: 'slug', display_name: 'Name', ... }
  Backend: Creates group, adds creator as owner
  Response: { id, name, display_name, member_count: 1, ... }
    ↓
Store updates (classGroupsStore.create())
    ↓
Show success message
    ↓
Navigate to /class-groups/:id (GroupDetails)
```

### Member Addition Flow
```
User is in GroupDetails (Members tab)
    ↓
Clicks "Add Member" button (if admin/owner)
    ↓
AddMemberModal opens
    ↓
User enters:
  - User ID or Email
  - Role (owner/admin/assistant/member)
    ↓
Frontend validates:
  ✓ useGroupMembers.validateAddMember()
  ✓ Group not full: member_count < max_members
  ✓ Group not expired: expires_at > now
  ✓ Group active: is_active === true
  ✓ User not already member
    ↓
POST /class-group-members
  Request: { group_id: 'uuid', user_id: 'id', role: 'member' }
  Backend: Adds member, grants Casbin permissions
  Response: { id, group_id, user_id, role, joined_at, ... }
    ↓
Store updates (groupMembersStore.create())
    ↓
Members list refreshes
    ↓
Show "User added as member"
```

### Terminal Sharing with Group
```
User in TerminalMySessions
    ↓
Clicks "Share" on a terminal
    ↓
TerminalShareModal opens
    ↓
User selects "Share with Group" tab
    ↓
User selects a group from dropdown
  (filtered to groups where user is admin/owner)
    ↓
User selects access level: read/write/admin
    ↓
POST /terminal-shares
  Request: {
    terminal_id: 'uuid',
    shared_with_group_id: 'group-uuid',
    access_level: 'read'
  }
  Backend: Creates share, grants Casbin permissions to all group members
  Response: { id, share_type: 'group', shared_with_group_id, ... }
    ↓
Store updates (terminalSharesStore.create())
    ↓
Show "Terminal shared with Group XYZ"
    ↓
In TerminalMySessions, show group badge on terminal card
```

### Group Member Viewing Flow
```
User (any role) in GroupDetails (Members tab)
    ↓
System loads:
  ├── classGroupsStore.getOne(id)           → Group data
  └── groupMembersStore.loadEntities()      → Filter by group_id
    ↓
Members list displays:
  ├── Avatar / User ID
  ├── Role badge (color-coded)
  ├── Join date
  └── Actions (if current user is admin/owner)
       ├── Change role (select dropdown)
       └── Remove (delete button - not for owner)
    ↓
Permissions check:
  ├── Can user edit? isOwner || isAdmin
  ├── Can user change role? isOwner || isAdmin
  └── Can user delete this member? isOwner || (isAdmin && member.role !== 'owner')
    ↓
UI renders conditionally based on permissions
```

---

## 3. Permission Hierarchy Flowchart

```
User Action: "Change member role from member to admin"
    ↓
System checks: Can CURRENT user make this change?
    ↓
├─ If CURRENT user is OWNER
│   ├─ Can they promote to: owner, admin, assistant, member? ✓ YES (all)
│   └─ Can they demote from: admin? ✓ YES
│
├─ If CURRENT user is ADMIN
│   ├─ Can they promote to: admin, assistant, member? ✓ YES
│   ├─ Can they promote to: owner? ✗ NO (only owner can)
│   └─ Cannot modify: owner or other admins
│
├─ If CURRENT user is ASSISTANT
│   ├─ Can modify: ✗ NO (read-only)
│
└─ If CURRENT user is MEMBER
    └─ Can modify: ✗ NO (read-only)
    ↓
Based on result, enable/disable UI buttons
```

---

## 4. State Management Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Pinia Store Layer (classGroupsStore + groupMembersStore)   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  classGroupsStore (extends baseStore)                       │
│  ├── entities: ClassGroup[]                                 │
│  ├── isLoading: boolean                                     │
│  ├── error: string                                          │
│  ├── fieldList: Map<string, FieldConfig>                   │
│  └── Methods: getOne, create, update, delete, loadEntities │
│                                                              │
│  groupMembersStore (extends baseStore)                      │
│  ├── entities: GroupMember[]                                │
│  ├── isLoading: boolean                                     │
│  ├── error: string                                          │
│  ├── fieldList: Map<string, FieldConfig>                   │
│  └── Methods: getOne, create, update, delete, loadEntities │
│                                                              │
└─────────────────────────────────────────────────────────────┘
           ↑                                    ↑
           │                                    │
           │ (dispatch actions)                 │
           │                                    │
┌──────────┴────────────────────────────────────┴──────────┐
│ useGroupMembers Composable (Business Logic)             │
├────────────────────────────────────────────────────────┤
│                                                          │
│ Pure functions that:                                   │
│ - Validate member operations                           │
│ - Check permission hierarchy                           │
│ - Handle error scenarios                               │
│ - Interact with stores                                 │
│                                                          │
│ Functions:                                              │
│ ├── addMember(groupId, userId, role)                  │
│ ├── updateMemberRole(memberId, newRole)               │
│ ├── removeMember(memberId)                            │
│ ├── canManageMembers(group, userId, members)          │
│ ├── validateAddMember(group, members)                 │
│ └── getRoleLevel(role)                                │
│                                                          │
└────────────────────────────────────────────────────────┘
           ↑
           │ (call functions)
           │
┌──────────┴────────────────────────────────────────────┐
│ Vue Components                                        │
├─────────────────────────────────────────────────────┤
│                                                      │
│ GroupDetails.vue                                     │
│ ├── Computed: canManageMembers, isOwner, etc.     │
│ ├── State: activeTab, showAddMemberModal, etc.    │
│ ├── Methods: loadGroup, loadMembers, addMember()  │
│ └── Bindings: v-if, @click, v-model, etc.        │
│                                                      │
│ GroupForm.vue                                       │
│ ├── Props: group, isLoading, onSubmit              │
│ ├── Computed: isFormValid                          │
│ └── Methods: handleSubmit, generateSlug            │
│                                                      │
│ TerminalMySessions.vue                              │
│ ├── Computed: filteredTerminals, groupShares       │
│ ├── State: selectedFilter, memberPage              │
│ └── Methods: getTerminalShares, navigateDetail    │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 5. API Request/Response Cycle

```
Frontend                          Backend
    │                                │
    │ POST /class-groups             │
    │─────────────────────────────→  │
    │  {                              │
    │    display_name: 'My Class',   │
    │    name: 'my-class',           │
    │    max_members: 30,            │
    │    expires_at: '2025-12-31'    │
    │  }                              │
    │                                │
    │                    Validate    │
    │                    Create group│
    │                    Add creator │
    │                    Grant perms │
    │                                │
    │  ← ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
    │  201 Created                   │
    │  {                              │
    │    id: 'uuid-123',             │
    │    name: 'my-class',           │
    │    display_name: 'My Class',   │
    │    member_count: 1,            │
    │    owner_user_id: 'user-456',  │
    │    created_at: '2025-01-15'    │
    │  }                              │
    │                                │
    │ (Store updates)                │
    │ classGroupsStore.entities[]+=1 │
    │                                │
    │ (UI shows success message)     │
    │ "Group created successfully"   │
    │                                │
    │ (Navigate to detail page)      │
    │ router.push(/class-groups/...) │
    │                                │
```

---

## 6. Feature Flag Integration Flow

```
App Initialization (main.ts)
    ↓
setupAxiosDefaults()
    ↓
setupAxiosInterceptors() (JWT token setup)
    ↓
create app + pinia
    ↓
featureFlagService.waitForInitialization()
    ↓
    ├─ Check backend /api/v1/features
    │  ├─ If class_groups: enabled=true
    │  │  └─ Store: classGroups.enabled = true
    │  ├─ If class_groups: enabled=false
    │  │  └─ Store: classGroups.enabled = false
    │  └─ If error or timeout
    │      └─ Use env variable VITE_FEATURE_FLAG_CLASS_GROUPS (fallback)
    │
    └─ app.mount('#app')
    ↓
In MainNavMenu.vue
    ├─ if (featureFlag.isEnabled('class_groups'))
    │  ├─ Show "Groups" menu item
    │  └─ Show "Group Members" menu item
    └─ else
       └─ Hide both items
    ↓
In Router Guards
    ├─ if (route.meta.requiresFeature === 'class_groups')
    │  ├─ if (featureFlag.isEnabled('class_groups'))
    │  │  └─ Allow navigation
    │  └─ else
    │      └─ Redirect to /dashboard
    └─ else
       └─ Allow navigation (no feature flag required)
    ↓
In GroupDetails.vue
    ├─ if (!isEnabled('class_groups'))
    │  └─ Show access denied message
    └─ else
       └─ Render component normally
```

---

## 7. Error Handling Flow

```
User Action (e.g., Add Member)
    ↓
try {
    POST /class-group-members
    return response
} catch (error) {
    ├─ error.response?.status === 401
    │  └─ Unauthorized: Redirect to login
    │
    ├─ error.response?.status === 403
    │  └─ Forbidden: "You don't have permission"
    │
    ├─ error.response?.status === 404
    │  └─ Not Found: "Group/Member not found"
    │
    ├─ error.response?.status === 400
    │  │
    │  ├─ error.response.data.code === 'GROUP_FULL'
    │  │  └─ t('groupDetails.groupFull')
    │  │
    │  ├─ error.response.data.code === 'GROUP_EXPIRED'
    │  │  └─ t('groupDetails.groupExpired')
    │  │
    │  ├─ error.response.data.code === 'USER_ALREADY_MEMBER'
    │  │  └─ t('groupDetails.userAlreadyMember')
    │  │
    │  └─ other validation error
    │     └─ Show error from data.error_message or data.message
    │
    ├─ Network error (timeout, no connection)
    │  └─ "Failed to connect. Please try again."
    │
    └─ Unknown error
       └─ t('groupDetails.memberAddError')
}
    ↓
Display error message to user
    ↓
Log to console (dev only): console.error(err)
    ↓
Store error state: base.error.value = message
```

---

## 8. Pagination for Large Member Lists

```
GroupDetails.vue (Members Tab)
    ↓
Load all members:
  groupMembers.loadEntities()
  → Filter by group_id
  → members.value = filtered array
    ↓
Apply sorting (by role hierarchy):
  sortedMembers = computed(() => {
    return members.sort((a, b) => {
      const roleOrder = { owner: 3, admin: 2, assistant: 1, member: 0 }
      return roleOrder[b.role] - roleOrder[a.role]
    })
  })
    ↓
Apply pagination:
  MEMBERS_PER_PAGE = 20

  memberPage = ref(1)

  paginatedMembers = computed(() => {
    const start = (memberPage.value - 1) * MEMBERS_PER_PAGE
    const end = start + MEMBERS_PER_PAGE
    return sortedMembers.value.slice(start, end)
  })

  totalPages = computed(() => {
    return Math.ceil(sortedMembers.value.length / MEMBERS_PER_PAGE)
  })
    ↓
Render pagination controls:
  [< Prev] [1] [2] [3] [Next >]
    ↓
Click page number → memberPage.value = newPage
    ↓
paginatedMembers re-computes
    ↓
Member list updates (reactive)
```

---

## 9. Role-Based UI Rendering Example

```
<template>
  <div class="member-card">
    <!-- All users see member info -->
    <div class="member-info">
      <span>{{ member.user_id }}</span>
      <span class="role-badge">{{ member.role }}</span>
    </div>

    <!-- Only admin/owner see action buttons -->
    <div v-if="canManageMembers" class="member-actions">
      <!-- Cannot remove owner -->
      <button
        v-if="member.role !== 'owner'"
        @click="removeMember(member)"
        class="btn btn-sm btn-danger"
      >
        Remove
      </button>

      <!-- Cannot demote if target role is higher than current user's role -->
      <select
        v-if="member.role !== 'owner' && canDemoteRole(myRole, member.role)"
        v-model="member.role"
        @change="updateMemberRole(member)"
      >
        <option value="admin">Admin</option>
        <option value="assistant">Assistant</option>
        <option value="member">Member</option>
      </select>
    </div>

    <!-- Only members see read-only view -->
    <div v-else class="member-readonly">
      <p>View only - you cannot modify members</p>
    </div>
  </div>
</template>

<script setup>
const canManageMembers = computed(() => {
  return isOwner.value || isAdmin.value
})

const canDemoteRole = (currentRole, targetRole) => {
  const ROLE_LEVELS = { owner: 3, admin: 2, assistant: 1, member: 0 }
  // Can only manage roles at same level or lower
  return ROLE_LEVELS[currentRole] >= ROLE_LEVELS[targetRole]
}
</script>
```

---

## 10. Component Interaction Sequence

```
┌─────────────────────────────────────────────────────┐
│ User navigates to /class-groups/:groupId            │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ GroupDetails.vue mounted                             │
│   - Initialize refs and computed properties         │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ onMounted hook triggers                             │
│   - loadGroup() → classGroupsStore.getOne()        │
│   - loadMembers() → groupMembersStore.loadEntities()│
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ API requests in parallel                            │
│   GET /class-groups/:id                             │
│   GET /class-group-members?filter[group_id]=:id    │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Responses received                                  │
│   - currentGroup.value = groupData                  │
│   - members.value = memberData                      │
│   - isLoading.value = false                         │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Template re-renders                                 │
│   - Show group details (Overview tab)              │
│   - Show member list (Members tab)                 │
│   - Compute permission-based UI                   │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ User interacts (e.g., click "Add Member")          │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ showAddMemberModal.value = true                     │
│ → BaseModal appears                                 │
│ → User fills form                                   │
│ → User clicks "Add"                                │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ handleAddMember() called                            │
│ → useGroupMembers.addMember()                      │
│ → groupMembersStore.create()                       │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ API request                                         │
│ POST /class-group-members                          │
│ { group_id, user_id, role }                        │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Backend validates and creates member                │
│ Returns { id, group_id, user_id, role, ... }      │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Frontend updates state                              │
│ - members.value.push(newMember)                    │
│ - showAddMemberModal.value = false                 │
│ - Show success message                             │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Members list re-renders                             │
│ - New member appears in list                       │
│ - All bindings update reactively                   │
└─────────────────────────────────────────────────────┘
```

---

## 11. TypeScript Type Flow

```
Backend Response (JSON)
    ↓
axios.get<ClassGroup>('/class-groups/:id')
    ↓
Type Check: Does response match ClassGroup interface?
    ├─ id: string ✓
    ├─ name: string ✓
    ├─ display_name: string ✓
    ├─ member_count: number ✓
    ├─ owner_user_id: string ✓
    └─ ... (all required fields)
    ↓
Store: currentGroup.value as ClassGroup
    ↓
Component: {{ currentGroup?.display_name }}
    ✓ TypeScript knows it's a string
    ✓ IDE provides autocomplete
    ✓ Compiler catches type errors
```

---

## 12. CSS Class Hierarchy (BEM)

```
.group-detail (block)
├── .group-detail__header (element)
│   ├── .group-detail__title (element)
│   └── .group-detail__actions (element)
│
├── .group-status-bar (block)
│   ├── .group-status-bar__item (element)
│   ├── .status-badge (block)
│   │   ├── .status-badge--active (modifier)
│   │   ├── .status-badge--expired (modifier)
│   │   └── .status-badge--full (modifier)
│   └── .member-count (block)
│       └── .progress-bar (element)
│
├── .group-tabs (block)
│   └── .group-tabs__button (element)
│       └── .group-tabs__button--active (modifier)
│
├── .members-list (block)
│   └── .member-card (block)
│       ├── .member-card__avatar (element)
│       ├── .member-card__info (element)
│       │   ├── .member-email (block)
│       │   └── .member-role (block)
│       │       └── .role-badge (element)
│       │           ├── .role-badge--owner (modifier)
│       │           ├── .role-badge--admin (modifier)
│       │           └── .role-badge--member (modifier)
│       └── .member-card__actions (element)
│
└── .settings-form (block)
    └── .form-group (element)
        ├── .form-control (block)
        └── .invalid-feedback (element)
```

---

These diagrams provide visual representations of:
- ✅ Component structure and hierarchy
- ✅ Data flow and state management
- ✅ API request/response cycles
- ✅ Permission and role hierarchy
- ✅ Error handling flows
- ✅ Feature flag integration
- ✅ TypeScript type safety
- ✅ CSS organization

Use these as reference while implementing!
