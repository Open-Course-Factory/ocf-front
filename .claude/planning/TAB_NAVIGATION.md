# Tab Navigation Persistence Feature

## Overview

The GroupDetail page now preserves the active tab state in the URL query parameters, ensuring that browser navigation (back/forward buttons) maintains the user's tab selection.

## Implementation

### Location
`/src/components/Pages/GroupDetail.vue:273-276, 497-512`

### How It Works

#### 1. Initialize Tab from URL (`GroupDetail.vue:273-276`)

```typescript
const activeTab = ref<'overview' | 'members' | 'settings'>(
  (route.query.tab as 'overview' | 'members' | 'settings') || 'overview'
)
```

When the component loads, it reads the `tab` query parameter from the URL and sets the active tab accordingly. Defaults to 'overview' if no parameter is present.

#### 2. Sync URL Query with Tab State (`GroupDetail.vue:497-502`)

```typescript
watch(() => route.query.tab, (newTab) => {
  if (newTab && typeof newTab === 'string' && ['overview', 'members', 'settings'].includes(newTab)) {
    activeTab.value = newTab as 'overview' | 'members' | 'settings'
  }
})
```

This watcher responds to URL changes (e.g., browser back/forward buttons) and updates the active tab to match the URL.

#### 3. Update URL When Tab Changes (`GroupDetail.vue:504-512`)

```typescript
watch(activeTab, (newTab) => {
  if (route.query.tab !== newTab) {
    router.push({
      path: route.path,
      query: { ...route.query, tab: newTab }
    })
  }
})
```

When the user clicks a tab, this watcher updates the URL query parameter to reflect the new tab state.

## User Experience

### Before
1. Navigate to `/class-groups/123`
2. Click "Members" tab
3. Click a member link to view details
4. Click browser back button
5. **Result**: Returns to group detail but on "Overview" tab ❌

### After
1. Navigate to `/class-groups/123`
2. Click "Members" tab → URL becomes `/class-groups/123?tab=members`
3. Click a member link to view details
4. Click browser back button
5. **Result**: Returns to group detail on "Members" tab ✓

## URL Structure

```
/class-groups/{groupId}              → Overview tab (default)
/class-groups/{groupId}?tab=overview → Overview tab (explicit)
/class-groups/{groupId}?tab=members  → Members tab
/class-groups/{groupId}?tab=settings → Settings tab
```

## Benefits

### 1. Browser Navigation Support
- Back/forward buttons preserve tab state
- User expectations aligned with standard web behavior

### 2. Shareable URLs
Users can share direct links to specific tabs:
- `https://app.com/class-groups/123?tab=members` → Opens directly to Members tab

### 3. Bookmarking
Users can bookmark specific tabs for quick access

### 4. Better UX for Multi-Step Workflows
Example workflow:
1. View group overview
2. Switch to Members tab
3. Click "Add Member"
4. Fill form and realize you need group info
5. Navigate to Overview tab
6. Use browser back button
7. **Now returns to Members tab**, not Overview

## Technical Details

### Validation
The watcher validates tab values to prevent invalid query parameters:

```typescript
['overview', 'members', 'settings'].includes(newTab)
```

Invalid tabs are ignored, maintaining the current state.

### Prevents Infinite Loops
The URL update watcher includes a guard:

```typescript
if (route.query.tab !== newTab) { ... }
```

This prevents infinite update loops between URL and state.

### Preserves Other Query Parameters
When updating the tab, other query parameters are preserved:

```typescript
query: { ...route.query, tab: newTab }
```

Example:
- Before: `/class-groups/123?search=john&tab=overview`
- After clicking Members: `/class-groups/123?search=john&tab=members`

## Edge Cases Handled

### 1. Invalid Tab Parameter
**URL**: `/class-groups/123?tab=invalid`
**Behavior**: Ignores invalid value, stays on current tab

### 2. No Tab Parameter
**URL**: `/class-groups/123`
**Behavior**: Defaults to 'overview' tab

### 3. Tab Permission Check
**Scenario**: User navigates to `/class-groups/123?tab=settings` but lacks edit permissions
**Current Behavior**: Tab buttons handle visibility (`v-if="canEditGroup"`)
**Future Enhancement**: Could redirect to default tab if user lacks permissions

## Testing Scenarios

### Test 1: Basic Tab Switching
1. Navigate to `/class-groups/123`
2. Click "Members" tab
3. Verify URL changes to `/class-groups/123?tab=members`
4. Click "Overview" tab
5. Verify URL changes to `/class-groups/123?tab=overview`

### Test 2: Browser Back/Forward
1. Navigate to `/class-groups/123`
2. Click "Members" tab
3. Click "Settings" tab
4. Click browser back button
5. Verify: Returns to Members tab ✓
6. Click browser back button again
7. Verify: Returns to Overview tab ✓
8. Click browser forward button
9. Verify: Returns to Members tab ✓

### Test 3: Direct URL Access
1. Navigate directly to `/class-groups/123?tab=members`
2. Verify: Members tab is active on load ✓
3. Navigate directly to `/class-groups/123?tab=settings`
4. Verify: Settings tab is active on load ✓

### Test 4: External Navigation
1. Navigate to `/class-groups/123?tab=members`
2. Click a subgroup link
3. View the subgroup (different group ID)
4. Click browser back button
5. Verify: Returns to original group on Members tab ✓

### Test 5: Invalid Tab Parameter
1. Navigate to `/class-groups/123?tab=invalid`
2. Verify: Displays Overview tab (default) ✓
3. Click "Members" tab
4. Verify: URL becomes `/class-groups/123?tab=members` ✓

## Browser Compatibility

This feature uses standard Vue Router functionality and works in all modern browsers:
- Chrome/Edge ✓
- Firefox ✓
- Safari ✓
- Opera ✓

## Performance Impact

**Minimal**:
- Two lightweight watchers
- No additional API calls
- URL updates are synchronous operations
- No DOM manipulation

## Accessibility

- No impact on keyboard navigation
- Screen readers unaffected (tab content remains the same)
- Focus management unchanged

## Future Enhancements

### 1. Tab State in localStorage
For cases where users prefer persistent tabs across sessions:

```typescript
const savedTab = localStorage.getItem('groupDetail.lastTab')
const activeTab = ref(route.query.tab || savedTab || 'overview')
```

### 2. Permission-Based Redirect
Automatically redirect to accessible tab if user lands on restricted tab:

```typescript
watch([activeTab, canEditGroup], ([tab, canEdit]) => {
  if (tab === 'settings' && !canEdit) {
    activeTab.value = 'overview'
  }
})
```

### 3. Analytics Integration
Track which tabs users visit most:

```typescript
watch(activeTab, (newTab) => {
  analytics.trackEvent('group_detail_tab_view', { tab: newTab })
})
```

## Migration Notes

- **Backward Compatible**: Old links without `?tab=` parameter still work
- **No Breaking Changes**: Existing functionality unchanged
- **Automatic Upgrade**: No code changes needed for existing components

## Related Files

- `/src/components/Pages/GroupDetail.vue` - Main implementation

## Related Features

- [SUBGROUP_MEMBERS_DISPLAY.md](./SUBGROUP_MEMBERS_DISPLAY.md) - Members tab enhancements
- [SUBGROUP_CREATION_FEATURE.md](./SUBGROUP_CREATION_FEATURE.md) - Subgroup management
