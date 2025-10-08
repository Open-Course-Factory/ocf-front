# Backend Feature Flags Integration

## Overview

The frontend feature flags system is now fully integrated with the backend API for centralized feature management. Flags are synced from the backend with local caching for performance.

## Architecture

### Data Flow

```
Backend DB → API → Frontend (with 5min cache) → LocalStorage (backup)
                                                 ↓
                                          User Interface
```

### Loading Priority

1. **Backend API** - **Source of truth** (fetched immediately on app start)
2. **Environment variables** - Initial defaults before backend loads
3. **LocalStorage** - **Emergency fallback only** (if backend fetch fails)

**Important**: LocalStorage is **NOT** loaded by default. It's only used:
- As a fallback when backend is unreachable
- To persist admin toggles (written, not read on startup)

## API Endpoints

### GET `/api/v1/features`

Fetch all feature flags from backend.

**Response:**
```json
[
  {
    "id": "uuid-123",
    "name": "Course Conception",
    "description": "Enable course conception features",
    "enabled": true,
    "module": "Courses",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
]
```

**Frontend mapping:**
- Backend `name: "Course Conception"` → Frontend key: `course_conception`
- Backend `enabled` → Frontend flag state
- Backend `id` → Used for updates via PATCH

### PATCH `/api/v1/features/{id}`

Update a specific feature flag.

**Request:**
```json
{
  "enabled": false
}
```

**Response:**
```json
{
  "id": "uuid-123",
  "name": "Course Conception",
  "enabled": false,
  "updated_at": "2025-01-15T10:30:00Z"
}
```

### POST `/api/v1/subscriptions/sync-usage-limits`

Sync user usage limits after toggling features that affect metrics (courses, terminals, etc.).

**Response:**
```json
{
  "synced_users": 150,
  "updated_metrics": ["courses", "concurrent_terminals"]
}
```

**Auto-triggered when:**
- Toggling `course_conception` (affects `courses` metric)
- Toggling `terminal_management` (affects `concurrent_terminals`, `lab_sessions` metrics)

## Caching Strategy

### TTL (Time-To-Live): 5 minutes

```typescript
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
```

### Cache Behavior

- **Initial load**: Fetch from backend async (non-blocking)
- **Subsequent loads**: Use cache if < 5 min old
- **Force refresh**: Available via admin panel "Refresh from Backend" button
- **Fallback**: LocalStorage values used if backend unavailable

### Cache Invalidation

```typescript
// Manual refresh in admin panel
await fetchFromBackend(true) // Force = true bypasses cache

// Automatic after TTL expires
// Next call to isEnabled() or getAllFlags() will refresh
```

## Deep Link Protection

Routes can require specific feature flags using `requiresFeature` meta:

```typescript
{
  path: 'courses',
  name: 'Courses',
  component: Courses,
  meta: {
    requiresAuth: true,
    requiresFeature: 'course_conception' // ← Requires this flag
  }
}
```

### Router Guard Logic

```typescript
router.beforeEach((to, _from, next) => {
  // 1. Check authentication
  // 2. Check feature flag
  const requiredFeature = to.meta.requiresFeature
  if (requiredFeature && !isFeatureEnabled(requiredFeature, actor)) {
    // Redirect to home with error
    next({ name: 'LandingPage', query: { error: 'feature_disabled' } })
  }
})
```

### Protected Routes

| Route | Required Feature |
|-------|-----------------|
| `/courses` | `course_conception` |
| `/chapters` | `course_conception` |
| `/sections` | `course_conception` |
| `/pages` | `course_conception` |
| `/terminal-creation` | `terminal_management` |

## Admin Interface

### Location

- **Path**: `/debug/feature-flags`
- **Component**: `src/components/Debug/FeatureFlagsDebug.vue`
- **Access**: Administrators only

### Features

1. **Toggle Switches** - Enable/disable features with instant backend sync
2. **Refresh Button** - Force fetch from backend (bypasses cache)
3. **Sync Limits Button** - Manual trigger for usage limits sync
4. **Reset Button** - Set all flags to enabled (with confirmation)
5. **Error Handling** - Shows errors, reverts on failure
6. **Loading States** - Visual feedback during API calls

### Screenshots Flow

```
┌─────────────────────────────────────────┐
│  🏴 Feature Flags Management            │
│  Backend-synced                         │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │ course_conception      [ON]  ✓  │   │
│  │ Enable course features          │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ terminal_management    [OFF] ✗  │   │
│  │ Enable terminal features        │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│ [Refresh] [Sync Limits] [Reset All]    │
└─────────────────────────────────────────┘
```

## Usage in Code

### Check Feature Flags

```typescript
import { useFeatureFlags } from '@/services/featureFlags'

const { isEnabled } = useFeatureFlags()

if (isEnabled('course_conception', { role: 'teacher' })) {
  // Show course features
}
```

### Update Feature Flags (Admin Only)

```typescript
const { updateFlag, syncUsageLimits } = useFeatureFlags()

// Toggle and auto-sync to backend
await updateFlag('course_conception', { enabled: false })
// → Syncs to backend via PATCH /api/v1/features/{id}
// → Auto-triggers syncUsageLimits() if flag affects metrics
```

### Force Refresh from Backend

```typescript
const { fetchFromBackend } = useFeatureFlags()

// Bypass cache and fetch fresh data
await fetchFromBackend(true)
```

## Error Handling

### Backend Unavailable

- Fallback to localStorage values
- Console warning logged
- User sees last known state
- No errors thrown (graceful degradation)

### Update Failure

```typescript
try {
  await updateFlag('course_conception', { enabled: false })
} catch (error) {
  // Flag reverted to previous state
  // Error shown in admin UI
  // localStorage rollback
}
```

## Testing Checklist

### Backend Integration

- [ ] Feature flags load from backend on app start
- [ ] Flags are cached for 5 minutes
- [ ] Force refresh bypasses cache
- [ ] Toggle in admin panel syncs to backend
- [ ] Auto-sync usage limits when toggling metrics-related flags
- [ ] Backend errors gracefully fallback to localStorage

### Deep Link Protection

- [ ] Direct URL to `/courses` redirects when `course_conception` disabled
- [ ] Bookmark to `/terminal-creation` blocked when `terminal_management` off
- [ ] Error message shown on redirect
- [ ] Protected routes accessible when flags enabled

### UI/UX

- [ ] Loading spinner shows during fetch
- [ ] Error messages display on sync failures
- [ ] Toggle switches update reactively
- [ ] "Sync Limits" button shows progress
- [ ] Refresh button bypasses cache

### Edge Cases

- [ ] Backend returns 500 → fallback to localStorage
- [ ] Network timeout → uses cached values
- [ ] Invalid backend response → logs error, uses defaults
- [ ] Concurrent updates → last write wins
- [ ] User toggles while fetch in progress → waits for fetch completion

## Performance Considerations

### Caching Benefits

- **Reduced API calls**: Only 1 call per 5 minutes max
- **Instant checks**: `isEnabled()` uses in-memory cache
- **Concurrent requests**: Prevents multiple simultaneous fetches

### Network Efficiency

```typescript
// ✅ Good - Uses cache
const flags1 = getAllFlags() // Fetch from backend
const flags2 = getAllFlags() // Uses cache (< 5min)

// ❌ Bad - Forces refetch
await fetchFromBackend(true) // Force
await fetchFromBackend(true) // Force again (unnecessary)
```

### Bundle Size Impact

- Feature flags service: ~5KB
- Backend integration: +2KB
- Total: ~7KB (minified)

## Migration from Local-Only Flags

### Before (Local Only)

```typescript
// Flags only in localStorage, no backend
updateFlag('course_conception', { enabled: false })
// → Only updates localStorage
```

### After (Backend-Synced)

```typescript
// Flags synced to backend
await updateFlag('course_conception', { enabled: false })
// → Updates localStorage
// → PATCH /api/v1/features/{id}
// → Auto-syncs usage limits
```

## Security Considerations

### Admin-Only Updates

- Only administrators can toggle flags in UI
- Backend should validate user permissions
- Non-admin API calls should return 403

### Feature Flag Validation

```python
# Backend example
@require_admin
def update_feature(feature_id, data):
    if not is_valid_feature(feature_id):
        raise ValueError("Invalid feature")
    # Update in DB
```

## Troubleshooting

### Backend Values Not Applied

**Symptom**: Backend says flag is `true` but frontend shows it as `false`

**Solution**:
1. Clear localStorage: `localStorage.removeItem('ocf_feature_flags')`
2. Refresh the page
3. Check console logs for mapping:
   ```
   🏴 Mapping backend "Course Conception" → frontend "course_conception" (enabled: true)
   ```
4. Verify backend feature name matches expected format

**Common name mapping issues**:
- Backend: `"Course Conception"` → Frontend: `course_conception` ✅
- Backend: `"course_conception"` → Frontend: `course_conception` ✅
- Backend: `"CourseConception"` → Frontend: `courseconception` ⚠️ (may not match)

### Flags Not Loading

1. Check browser console for errors
2. Verify `/api/v1/features` endpoint responds
3. Check network tab for 401/403/500 errors
4. Look for these console messages:
   - `🏴 Backend returned N features:` (success)
   - `⚠️ Failed to fetch feature flags from backend` (error)
5. Check if localStorage fallback was used:
   - `🏴 Feature flag "X" loaded from localStorage (fallback)`

### Sync Not Working

1. Verify feature has backend `id` property
2. Check console for "Cannot sync flag" warnings
3. Test PATCH endpoint manually
4. Ensure admin permissions

### Usage Limits Not Updating

1. Check if flag has `controlledMetrics` defined
2. Verify `POST /subscriptions/sync-usage-limits` succeeds
3. Look for auto-sync console logs
4. Manually trigger via admin panel "Sync Limits" button

## Future Enhancements

### Real-Time Updates (Optional)

```typescript
// SSE/WebSocket integration
const eventSource = new EventSource('/api/v1/features/stream')
eventSource.onmessage = (event) => {
  const updatedFlag = JSON.parse(event.data)
  featureFlagService.updateFlag(updatedFlag.name, { enabled: updatedFlag.enabled })
}
```

### Audit Logging

Track who changed what and when:

```json
{
  "event": "feature_toggle",
  "feature": "course_conception",
  "old_value": true,
  "new_value": false,
  "user_id": "admin-123",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### A/B Testing

```typescript
// Percentage-based rollouts
{
  rolloutPercentage: 50, // 50% of users
  enabled: true
}
```

## Support

For issues or questions:
- GitHub: https://github.com/your-org/ocf-front/issues
- Docs: `/docs/feature-flags`
- Backend docs: `/api/v1/docs`
