# Groups Management - Quick Reference Guide

## 📋 Current Status

### ✅ Already Implemented
```
src/stores/
├── classGroups.ts          (175 LOC - Full CRUD, i18n)
└── groupMembers.ts         (129 LOC - Full CRUD, roles, i18n)

src/components/Pages/
├── ClassGroups.vue         (36 LOC - Generic Entity wrapper)
└── GroupMembers.vue        (36 LOC - Generic Entity wrapper)

src/types/
└── entities.ts             (ClassGroup, GroupMember, TerminalShare types)

src/router/
└── index.ts                (Routes with class_groups feature flag)

src/components/Menus/
└── MainNavMenu.vue         (Navigation items for groups)

src/services/features/
└── featureFlags.ts         (class_groups feature flag configured)
```

### 📋 To Be Implemented

```
Step 1: src/components/Pages/GroupDetail.vue         (NEW - 600-800 LOC)
Step 2: src/router/index.ts                          (MODIFY - add route)
Step 3: src/components/Forms/GroupForm.vue           (NEW - 250-350 LOC)
Step 4: src/composables/useGroupMembers.ts           (NEW - 200-300 LOC)
Step 5: src/composables/useTerminalShare.ts          (MODIFY - add group sharing)
        src/components/Modals/TerminalShareModal.vue (MODIFY - add group tab)
Step 6: src/components/Pages/TerminalMySessions.vue (MODIFY - add group filter)
Step 7: src/components/Pages/Entity.vue              (MODIFY - group enhancements)
```

---

## 🎯 Implementation Priority Matrix

```
         COMPLEXITY
            Low    Med    High
PRIORITY  ┌─────┬────┬─────┐
High      │  6  │ 3  │  1  │  (GroupDetail, Entity enhancements)
          ├─────┼────┼─────┤
Medium    │  2  │ 4  │  5  │  (Route, useGroupMembers, Terminal Share)
          ├─────┼────┼─────┤
Low       │  -  │ 7  │  -  │  (TerminalMySessions filtering)
          └─────┴────┴─────┘
```

**Recommended Order**: 1 → 4 → 3 → 2 → 5 → 6 → 7

---

## 📁 File Structure Reference

### Existing Files (Do Not Modify Unless Noted)

```
✅ PRODUCTION READY

src/stores/
├── classGroups.ts
│   ├── Translations: 45 keys each (EN + FR)
│   ├── Fields: 11 fields configured
│   ├── Hooks: beforeCreate, beforeUpdate (slug generation)
│   └── Endpoint: /class-groups
│
└── groupMembers.ts
    ├── Translations: 35 keys each (EN + FR)
    ├── Fields: 10 fields configured
    ├── Roles: owner, admin, assistant, member
    └── Endpoint: /class-group-members

src/types/entities.ts
├── ClassGroup interface (with computed fields: is_expired, is_full)
└── GroupMember interface (with role enum)
└── TerminalShare interface (extended with group support)
```

### New Files to Create

```
📝 TO CREATE

src/components/Pages/GroupDetail.vue
├── Size: 600-800 LOC
├── Purpose: Detail view + member management
├── Tabs: Overview, Members, Terminals, Settings
├── Modals: AddMember, DeleteConfirm
└── Permissions: Owner > Admin > Member

src/components/Forms/GroupForm.vue
├── Size: 250-350 LOC
├── Purpose: Create/Edit group with validation
├── Fields: displayName, description, maxMembers, expiresAt, isActive
├── Features: Auto-slug preview, date validation
└── Reusable: Yes (used by GroupDetail + create flow)

src/composables/useGroupMembers.ts
├── Size: 200-300 LOC
├── Purpose: Member management logic
├── Functions: add, update, remove, validate, permission checks
└── Reusable: Yes (used by GroupDetail + GroupMembers page)

src/composables/useTerminalShare.ts (MODIFY)
├── Size: +100-150 LOC
├── Add Functions: shareWithGroup, getGroupShares
└── Keep Existing: User sharing functions

src/components/Modals/TerminalShareModal.vue (MODIFY)
├── Size: +50-100 LOC
├── Add: Group tab + group selection
└── Keep: Existing user sharing tab
```

### Files to Modify

```
🔧 MODIFICATIONS NEEDED

src/router/index.ts
├── Add: GroupDetail import
└── Add: Route for /class-groups/:id

src/components/Pages/TerminalMySessions.vue
├── Add: Group filter dropdown/buttons
├── Add: getTerminalSharesForGroup() call
└── Add: Group share display badges

src/components/Pages/Entity.vue
├── Add: Group-specific column rendering
├── Add: Status badges (expired, full, inactive)
├── Add: Member count progress bar
└── Add: Detail view link (click row)

src/components/Modals/TerminalShareModal.vue
├── Add: Tab selector (user/group)
├── Add: Group selection dropdown
├── Add: Adapt form for group shares
└── Keep: All existing user share functionality
```

---

## 🔑 Key Constants & Enums

### Role Hierarchy
```typescript
enum MemberRole {
  OWNER = 'owner',      // Level 3 - Full control, can delete group
  ADMIN = 'admin',      // Level 2 - Manage members
  ASSISTANT = 'assistant', // Level 1 - View/moderate
  MEMBER = 'member'     // Level 0 - Basic access
}

const ROLE_HIERARCHY = {
  owner: 3,
  admin: 2,
  assistant: 1,
  member: 0
}

// Rule: Can only manage roles at same level or lower
// Owner can manage all
// Admin can manage: assistant, member
// Assistant can manage: (none)
// Member can manage: (none)
```

### Group Status
```typescript
type GroupStatus = 'active' | 'inactive' | 'expired' | 'full'

// Computed from:
// active: is_active === true && !is_expired && !is_full
// expired: expires_at < now
// full: member_count >= max_members
```

### Share Types
```typescript
type ShareType = 'user' | 'group'

// TerminalShare.share_type
// 'user': shared_with_user_id is populated
// 'group': shared_with_group_id is populated
```

---

## 📝 Translation Keys Structure

### GroupDetail Keys
```typescript
groupDetail: {
  // Sections
  pageTitle: string
  tabOverview: string
  tabMembers: string
  tabTerminals: string
  tabSettings: string

  // Status
  statusActive: string
  statusExpired: string
  statusFull: string

  // Actions
  editGroup: string
  deleteGroup: string
  addMember: string
  removeMember: string
  changeMemberRole: string

  // Fields
  displayName: string
  description: string
  owner: string
  memberCount: string

  // Messages
  memberAddedSuccess: string
  memberRemovedSuccess: string
  groupUpdatedSuccess: string
  groupDeletedSuccess: string

  // Errors
  groupLoadError: string
  memberLoadError: string
  memberAddError: string
  cannotRemoveOwner: string
  cannotManageNotAdmin: string
}
```

---

## 🔗 API Integration Reference

### Endpoints Used
```
GET    /class-groups              (list all groups)
GET    /class-groups/{id}         (get group detail)
POST   /class-groups              (create group)
PATCH  /class-groups/{id}         (update group)
DELETE /class-groups/{id}         (delete group)

GET    /class-group-members       (list members)
POST   /class-group-members       (add member)
PATCH  /class-group-members/{id}  (update member)
DELETE /class-group-members/{id}  (remove member)

GET    /terminal-shares           (list shares)
POST   /terminal-shares           (create share - user or group)
PATCH  /terminal-shares/{id}      (update share)
DELETE /terminal-shares/{id}      (delete share)
```

### Request/Response Examples

```typescript
// CREATE GROUP
POST /class-groups
{
  name: 'my-class-2025',           // auto-generated from display_name
  display_name: 'My Class 2025',
  description: 'Spring semester',
  max_members: 30,
  expires_at: '2025-12-31T23:59:59Z',
  is_active: true
}

// ADD MEMBER
POST /class-group-members
{
  group_id: 'uuid',
  user_id: 'user-id',
  role: 'member'
}

// SHARE TERMINAL WITH GROUP
POST /terminal-shares
{
  terminal_id: 'uuid',
  shared_with_group_id: 'group-uuid',  // NEW
  access_level: 'read'
}
```

---

## 🧩 Component Dependencies

### GroupDetail.vue Requires
```typescript
✅ classGroupsStore         // Load group data
✅ groupMembersStore        // Load members
✅ useGroupMembers()        // Member operations
✅ useCurrentUserStore()    // Permission checks
✅ useTranslations()        // i18n
✅ useFeatureFlags()        // Feature flag check
✅ asyncWrapper()           // Async operations
✅ BaseModal.vue            // Modals
✅ formatDate/formatDateTime // Date formatting
✅ formatCurrency (optional) // If billing info shown
```

### GroupForm.vue Requires
```typescript
✅ useTranslations()        // i18n
✅ asyncWrapper()           // Async operations
✅ formatters (date)        // Date validation/display
✅ types (ClassGroup)       // Type definitions
```

### useGroupMembers.ts Requires
```typescript
✅ groupMembersStore        // CRUD operations
✅ types (ClassGroup, GroupMember) // Type definitions
✅ formatters (optional)    // Helpers
```

---

## 🧪 Testing Checklist Per Step

### Step 1: GroupDetail.vue
```
✓ Component loads group data correctly
✓ Tabs switch without errors
✓ Members list displays correctly
✓ Add member modal opens/closes
✓ Member can be removed (except owner)
✓ Member role can be changed
✓ Edit group button visible only for admin/owner
✓ Delete group button visible only for owner
✓ Permissions block unauthorized actions
✓ All error messages display with i18n
✓ Success messages appear after operations
✓ Loading states show during async operations
✓ Responsive layout on mobile/tablet
✓ Feature flag controls visibility
```

### Step 2: Route Addition
```
✓ Route /class-groups/:id loads GroupDetail
✓ Invalid ID shows not found error
✓ Back button navigates to /class-groups
✓ URL updates when selecting group
```

### Step 3: GroupForm.vue
```
✓ Display name input accepts text
✓ Slug preview updates in real-time
✓ Max members validation (> 0)
✓ Expiry date cannot be in past
✓ Form submission calls onSubmit
✓ Loading state during submission
✓ Error messages for validation failures
```

### Step 4: useGroupMembers.ts
```
✓ addMember validates user exists
✓ addMember rejects if group full
✓ addMember rejects if user already member
✓ updateMemberRole respects hierarchy
✓ removeMember prevents owner removal
✓ canManageMembers checks permissions
✓ All errors have translation keys
```

### Step 5: Terminal Sharing Integration
```
✓ Share modal shows group tab
✓ Group selection dropdown works
✓ Share with group creates terminal share
✓ Group shares appear in terminal list
✓ Group shares can be updated
✓ Group shares can be deleted
```

### Step 6: Terminal Filtering
```
✓ Filter buttons appear in TerminalMySessions
✓ "Shared with My Groups" filter works
✓ Filtered list shows only group shares
✓ Badge count matches filtered list
✓ Filter persists on page reload
```

### Step 7: Entity.vue Enhancements
```
✓ Group list shows member count progress
✓ Status badges display (expired, full, inactive)
✓ Clicking row navigates to GroupDetail
✓ Column layout works on mobile
```

---

## 🔐 Security Checklist

### Permission Verification
```
✓ Only owner can delete group
✓ Only admin/owner can add members
✓ Only admin/owner can change roles
✓ Cannot demote owner to other role
✓ Cannot remove owner from group
✓ Cannot share terminal without admin access
✓ Group access controlled by membership
✓ Feature flag prevents unauthorized access
```

### Data Validation
```
✓ Display name required and length validated
✓ Max members bounds checked (1-1000)
✓ Expiry date validated (not in past)
✓ Role values validated (enum check)
✓ User IDs validated before adding
✓ Group IDs validated before sharing
```

### Error Handling
```
✓ No stack traces shown to users
✓ All errors translated
✓ 401 Unauthorized handled (redirect to login)
✓ 403 Forbidden handled (permission denied message)
✓ 404 Not found handled (entity not found message)
✓ Network errors handled with retry option
```

---

## 💡 Code Patterns to Follow

### Pattern 1: Async Operations with asyncWrapper
```typescript
const loadMembers = asyncWrapper(
  async () => {
    const response = await memberStore.loadEntities()
    members.value = response
  },
  memberStore,
  'groupDetail.memberLoadError',
  'Loading members'
)
```

### Pattern 2: Computed Permission Checks
```typescript
const canManageMembers = computed(() => {
  if (!currentGroup.value) return false
  const member = members.value.find(m => m.user_id === currentUser.userId)
  return member?.role === 'admin' || member?.role === 'owner'
})
```

### Pattern 3: Watch for Route Changes
```typescript
watch(() => route.params.id, async () => {
  await loadGroup()
  await loadMembers()
})
```

### Pattern 4: Form Validation
```typescript
const isFormValid = computed(() => {
  return (
    editFormData.value.display_name?.length >= 3 &&
    editFormData.value.max_members > 0 &&
    (!editFormData.value.expires_at ||
      new Date(editFormData.value.expires_at) > new Date())
  )
})
```

### Pattern 5: Translations with Parameters
```typescript
// Define in i18n
memberCountLabel: '{current} / {max} members'

// Use in template
{{ t('groupDetail.memberCountLabel', {
  current: currentGroup?.member_count,
  max: currentGroup?.max_members
}) }}
```

---

## 📊 Code Size Estimates

```
Total LOC to Write: ~1500-2200
Total LOC to Modify: ~300-500
Total New Files: 4
Total Modified Files: 5

Breakdown:
GroupDetail.vue        600-800 LOC  (new)
GroupForm.vue          250-350 LOC  (new)
useGroupMembers        200-300 LOC  (new)
Entity.vue            +100-200 LOC  (modify)
TerminalShare         +100-150 LOC  (modify)
TerminalMySessions    +100-150 LOC  (modify)
TerminalShareModal    + 50-100 LOC  (modify)
Router                 + 10 LOC     (modify)
────────────────────────────────────
TOTAL               ~1500-2200 LOC
```

---

## ⏱️ Time Estimates

```
Minimal Setup (Just GroupDetail):        6-8 hours
Standard Implementation (All Steps):     2-3 days
With Testing:                            3-4 days
With Code Review Iterations:             1 additional day

Per Component Breakdown:
GroupDetail.vue + Route            4-6 hours
GroupForm.vue                      2-3 hours
useGroupMembers                    2-3 hours
Terminal Sharing Integration       3-4 hours
Terminal Filtering                 2-3 hours
Entity.vue Enhancements           2-3 hours
Testing & Validation              2-4 hours
```

---

## 🚀 Getting Started Checklist

Before implementing Step 1 (GroupDetail.vue):

```
✓ Read GROUP_DETAIL_SPECIFICATION.md
✓ Review GROUPS_IMPLEMENTATION_PLAN.md
✓ Understand role hierarchy (owner > admin > member)
✓ Familiar with BaseModal component usage
✓ Familiar with asyncWrapper utility
✓ Familiar with useTranslations() composable
✓ Tested feature flag is working (try /debug/feature-flags)
✓ Tested API endpoints with Swagger or Postman
✓ Local dev environment running (npm run dev)
✓ Browser DevTools open to catch errors
```

---

## 📞 Common Questions

**Q: Can a non-owner edit group settings?**
A: No, only owner or admin can edit. Regular members see read-only view.

**Q: What happens when a group expires?**
A: New members cannot be added, but existing members retain access. Show "EXPIRED" badge.

**Q: Can you share a terminal with multiple groups?**
A: Yes, one terminal can be shared with user1, group2, and user3 independently.

**Q: How do we handle removed members?**
A: Use soft delete (deletedAt timestamp). Can restore if needed. Revoke all permissions.

**Q: Can members see other members' details?**
A: Yes, all group members can see the member list and roles.

**Q: What about role-based filtering?**
A: Show all roles in list. Owners/admins see edit buttons. Members see read-only view.

---

## 📚 Additional Resources

```
✅ Existing Documentation
   - CLAUDE.md (project standards)
   - Feature flags system in CLAUDE.md
   - BaseStore pattern in CLAUDE.md
   - i18n implementation in CLAUDE.md

📋 New Documentation
   - GROUP_DETAIL_SPECIFICATION.md (this step)
   - GROUPS_IMPLEMENTATION_PLAN.md (all steps)
   - GROUPS_QUICK_REFERENCE.md (this file)

🔗 External References
   - Backend API docs: /swagger/
   - Feature Flags API: GET /api/v1/features
   - Vue 3 Docs: https://vuejs.org
   - Pinia Docs: https://pinia.vuejs.org
```

---

## ✨ You're Ready!

This specification provides everything needed to implement groups management on the frontend with:
- ✅ Detailed requirements for each step
- ✅ Code patterns and examples
- ✅ i18n translations structure
- ✅ Permission and security checks
- ✅ Testing checklists
- ✅ Integration diagrams
- ✅ Estimated timelines

**Next Step**: Review the GroupDetail specification and start implementing! 🚀
