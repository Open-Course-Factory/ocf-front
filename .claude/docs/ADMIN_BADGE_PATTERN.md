# Admin Badge Pattern

## Purpose

When a platform administrator views public pages, they see UI elements (buttons, options, sections) that regular users don't. Without a visual indicator, admins can't distinguish their elevated privileges from normal role-based access. This creates confusion and risk of accidental actions.

The **AdminBadge** pattern solves this by marking admin-granted elements with a subtle shield icon.

## The AdminBadge Component

**Location:** `src/components/Common/AdminBadge.vue`

**Props:**
- `iconOnly: boolean` (default: `false`) — show only the shield icon, no text
- `tooltip: string` — custom tooltip (defaults to "Visible thanks to your administrator role")

**Import:**
```vue
import AdminBadge from '../Common/AdminBadge.vue'
// or from deeper nesting:
import AdminBadge from '../../components/Common/AdminBadge.vue'
```

## When to Use

**Add the badge when ALL of these are true:**
1. The element is on a public page (not under `/admin` routes)
2. The element is conditionally visible based on permissions
3. Platform admin status is the **reason** the element is visible (the user would NOT see it as a regular owner/manager/member)

**For `<option>` elements in `<select>` dropdowns:** Use the 🛡️ emoji prefix instead (Vue components can't go inside `<option>`).

## When NOT to Use

- Dedicated admin pages (`/admin/*` routes) — the whole page is admin-only
- Menu items — handled separately by the navigation system
- Elements the user would see anyway as org owner/group manager
- Login/auth flows

## Detection Pattern

### Simple (no ownership context available)
```vue
const { isAdmin } = useAdminViewMode()
// Badge shows for all admins — acceptable when ownership isn't known
```

### Precise (ownership context available — preferred)
```vue
const { isAdmin } = useAdminViewMode()
const isAdminGranted = computed(() => isAdmin.value && !isOwner.value)
```

### For select options
```html
<!-- Admin-only option with shield emoji -->
<option v-if="isPlatformAdmin && !isOwner" value="owner">🛡️ Owner</option>
<!-- Same option without badge when user has access naturally -->
<option v-else-if="isOwner" value="owner">Owner</option>
```

## Centralized Permission Bypass

The permissions store (`src/stores/permissions.ts`) has admin bypass built into all base functions:
- `canManageOrganization()`, `isOrganizationOwner()`, `isOrganizationManager()`
- `canManageGroup()`, `isGroupOwner()`, `isGroupManager()`

These all check `isSystemAdmin.value` first, so any component using these functions automatically grants admin access. **You don't need to add admin bypass in individual components** — it's handled at the store level.

The badge is a separate concern: it indicates *why* the user has access, not *whether* they have access.

## Examples from the Codebase

### Button with badge (GroupMembersManager.vue)
```vue
<button v-if="canManageMembers" @click="showAddMemberModal = true" class="btn btn-primary">
  <i class="fas fa-plus"></i>
  {{ t('groupMembers.addMember') }}
</button>
<AdminBadge v-if="isPlatformAdmin && !isOwner" icon-only />
```

### Page header badge (GroupDetails.vue)
```vue
<AdminBadge
  v-if="isPlatformAdmin && !isOwner && !isManager"
  :tooltip="t('groupDetails.viewingAsAdmin')"
/>
```

### Dropdown option with emoji (GroupMembersManager.vue)
```html
<option v-if="isPlatformAdmin && !isOwner" value="owner">🛡️ {{ t('roleOwner') }}</option>
<option v-else-if="isOwner" value="owner">{{ t('roleOwner') }}</option>
<option value="manager">{{ t('roleManager') }}</option>
<option value="member">{{ t('roleMember') }}</option>
```

## Checklist for New Features

When building a new feature, run through this:

1. Does this feature show different UI for admins vs regular users on a public page?
2. If yes → import `AdminBadge` and `useAdminViewMode`
3. Compute `isAdminGranted` — is admin the REASON, not just present?
4. Add `<AdminBadge v-if="isAdminGranted" icon-only />` next to admin-gated elements
5. For `<select>` options: use 🛡️ emoji prefix on admin-only options
6. For entire sections: add badge to the section header

## Components Using This Pattern

| Component | What's badged |
|---|---|
| GroupDetails | Header "viewing as admin" |
| GroupMembersManager | Add member button, owner role option |
| OrganizationDetail | Edit, bulk import, tabs |
| OrganizationCard | Import, manage buttons |
| OrganizationMembersManager | Add member button |
| OrganizationGroupsManager | Section title |
| OrganizationScenariosTab | Import buttons |
| OrganizationSubscriptionManager | Subscription action buttons |
| OrganizationSettingsTab | Delete button |
| SubscriptionPlans | Admin controls, inactive plans |
| SubscriptionPlansCustomer | Coming soon, bulk purchase |
| AllSubscriptions | Section header |
| Invoices | Admin stats panel |
| CourseDetails + VersionSelector | Delete version button |
| GroupHierarchyEditor | Page title |
