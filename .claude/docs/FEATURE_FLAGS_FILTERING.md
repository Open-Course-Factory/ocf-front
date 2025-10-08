# Feature Flags with Entity Filtering

## Overview

The feature flags system has been enhanced to support **automatic filtering of related entities** (like usage metrics, navigation items, etc.) based on feature flag status. This keeps the codebase generic and maintainable.

## Persistence

Feature flags are persisted in **localStorage** for a seamless user experience across page refreshes.

### Loading Priority

1. **Default values** - Hardcoded in `featureFlags.ts`
2. **Environment variables** - Loaded from `.env` (overrides defaults)
3. **LocalStorage** - User toggles in admin panel (overrides environment)

### Storage Key

Flags are stored in localStorage under the key: `ocf_feature_flags`

Example localStorage value:
```json
{
  "course_conception": { "enabled": false },
  "terminal_management": { "enabled": true }
}
```

## Architecture

### 1. Feature Flag Metadata

Each feature flag can now declare which entities it controls via metadata:

```typescript
{
  enabled: true,
  description: 'Enable course conception features',
  controlledMetrics: ['courses'],           // Usage metric types
  controlledFeatures: ['course_creation']   // Generic features
}
```

### 2. Core Service Methods

**`featureFlagService.isMetricVisible(metricType, actor?)`**
- Checks if a specific metric type should be visible
- Returns `false` if any controlling feature flag is disabled
- Returns `true` if no flags control it or all are enabled

**`featureFlagService.isFeatureVisible(featureName, actor?)`**
- Same as above but for generic features

**`featureFlagService.getVisibleMetricTypes(actor?)`**
- Returns a Set of all visible metric types

### 3. Vue Composable

The `useFeatureFlags()` composable provides:

```typescript
const {
  isEnabled,              // Check if a flag is enabled
  isMetricVisible,        // Check if a metric is visible
  isFeatureVisible,       // Check if a feature is visible
  getVisibleMetricTypes,  // Get all visible metric types
  filterByFeatureFlags,   // Generic filter function
  clearLocalStorage       // Clear localStorage overrides
} = useFeatureFlags()
```

## Usage Examples

### Example 1: Filter Usage Metrics in Components

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useFeatureFlags } from '@/services/featureFlags'
import { useCurrentUserStore } from '@/stores/currentUser'

const { filterByFeatureFlags } = useFeatureFlags()
const currentUserStore = useCurrentUserStore()

const props = defineProps<{ metrics: any[] }>()

// Automatically filter metrics based on feature flags
const visibleMetrics = computed(() => {
  const actor = currentUserStore.currentUser ? {
    userId: currentUserStore.currentUser.id,
    role: currentUserStore.currentUser.role
  } : undefined

  return filterByFeatureFlags(props.metrics, 'metric_type', actor)
})
</script>

<template>
  <div v-for="metric in visibleMetrics" :key="metric.id">
    <!-- Only visible metrics are shown -->
  </div>
</template>
```

### Example 2: Filter in Store Methods

```typescript
// In subscriptions.ts
import { featureFlagService } from '@/services/featureFlags'

const getFilteredUsageMetrics = (actor?: { userId?: string, role?: string }) => {
  return usageMetrics.value.filter(metric => {
    return featureFlagService.isMetricVisible(metric.metric_type, actor)
  })
}
```

### Example 3: Check Individual Metrics

```typescript
const { isMetricVisible } = useFeatureFlags()

// Check if course metrics should be shown
if (isMetricVisible('courses', { role: 'teacher' })) {
  // Show course-related UI
}
```

## Adding New Controlled Metrics

### Step 1: Update Feature Flag Configuration

Edit `src/services/featureFlags.ts`:

```typescript
terminal_management: {
  enabled: true,
  description: 'Enable terminal features',
  controlledMetrics: ['concurrent_terminals', 'lab_sessions'],
  controlledFeatures: ['terminal_access', 'lab_management']
}
```

### Step 2: Use Filtering Where Needed

The system automatically filters metrics based on the configuration. No additional code is needed in most cases if you're using the `filterByFeatureFlags` helper or `visibleMetrics` computed property pattern.

## Current Feature Flag Mappings

| Feature Flag          | Controlled Metrics                       | Controlled Features                    |
|-----------------------|------------------------------------------|----------------------------------------|
| `course_conception`   | `courses`                                | `course_creation`, `course_editing`    |
| `terminal_management` | `concurrent_terminals`, `lab_sessions`   | `terminal_access`, `lab_management`    |

## Benefits of This Approach

1. **Generic & Maintainable**: Add new metrics without modifying component code
2. **Centralized Configuration**: All filtering rules in one place (featureFlags.ts)
3. **Automatic Filtering**: Components using the pattern automatically respect flags
4. **Type-Safe**: TypeScript ensures correct usage
5. **Role-Aware**: Respects role-based access control

## Managing Feature Flags

### Via Admin Panel

Navigate to **Administration → Feature Flags** (or `/debug/feature-flags`) to toggle features in real-time. Changes are automatically persisted to localStorage.

### Via Environment Variables

Set flags in `.env` file:
```bash
VITE_FEATURE_FLAG_COURSE_CONCEPTION=false
VITE_FEATURE_FLAG_TERMINAL_MANAGEMENT=true
```

Note: Environment variables are loaded on app startup but are overridden by localStorage values.

### Clearing LocalStorage Overrides

To reset flags to environment/default values:

```typescript
const { clearLocalStorage } = useFeatureFlags()
clearLocalStorage() // Removes all localStorage overrides
```

Or manually clear in browser DevTools:
```javascript
localStorage.removeItem('ocf_feature_flags')
```

## Testing

### Test Scenario 1: Toggle via Admin Panel

1. **Navigate to** `/debug/feature-flags` (or Administration → Feature Flags)
2. **Toggle** `course_conception` to OFF
3. **Expected behavior**:
   - Course metrics disappear from subscription dashboard
   - Course navigation items hidden
   - Changes persist across page refreshes
4. **Refresh the page**
5. **Expected behavior**:
   - Flag remains OFF (persisted in localStorage)
   - Course metrics still hidden

### Test Scenario 2: Environment Variables

1. **Set in `.env`**:
   ```bash
   VITE_FEATURE_FLAG_COURSE_CONCEPTION=false
   ```
2. **Restart dev server**
3. **Expected behavior**:
   - Course features disabled
4. **Toggle ON in admin panel**
5. **Expected behavior**:
   - Course features enabled (localStorage overrides .env)
6. **Clear localStorage** and refresh
7. **Expected behavior**:
   - Course features disabled again (.env value restored)

## Migration Guide

### Before (Manual Filtering)

```vue
<template>
  <div v-for="metric in props.metrics" :key="metric.id">
    <div v-if="metric.metric_type !== 'courses'">
      <!-- Manual filtering -->
    </div>
  </div>
</template>
```

### After (Automatic Filtering)

```vue
<script setup lang="ts">
const visibleMetrics = computed(() => {
  return filterByFeatureFlags(props.metrics, 'metric_type', actor)
})
</script>

<template>
  <div v-for="metric in visibleMetrics" :key="metric.id">
    <!-- Automatically filtered -->
  </div>
</template>
```

## API Reference

### `filterByFeatureFlags<T>(entities, typeField, actor?)`

Generic filter function for any array of entities.

**Parameters:**
- `entities: T[]` - Array of entities to filter
- `typeField: keyof T` - Field name containing the metric/feature type
- `actor?: { userId?, role?, projectId? }` - User context for role-based filtering

**Returns:** `T[]` - Filtered array with only visible entities

**Example:**
```typescript
const visibleMetrics = filterByFeatureFlags(
  allMetrics,
  'metric_type',
  { role: 'teacher', userId: '123' }
)
```

### Environment Variables

Configure feature flags via environment variables:

```bash
# Format: VITE_FEATURE_FLAG_<FLAG_NAME>=true/false
VITE_FEATURE_FLAG_COURSE_CONCEPTION=false
VITE_FEATURE_FLAG_TERMINAL_MANAGEMENT=true
```

## Future Enhancements

Potential improvements to consider:

1. **Database-backed flags**: Store flag states in backend
2. **User-specific overrides**: Allow per-user flag configuration
3. **A/B testing support**: Percentage-based rollouts
4. **Analytics integration**: Track flag usage and impact
5. **Real-time updates**: WebSocket-based flag updates
