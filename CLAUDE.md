# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Development Server:**

```bash
npm run dev    # Starts Vite dev server on http://localhost:4000
```

**Build:**

```bash
npm run build  # TypeScript compilation followed by Vite build
```

**Preview:**

```bash
npm run preview  # Preview production build on http://localhost:4000
```

## Architecture Overview

### Core Technologies

- **Vue 3** with Composition API and TypeScript
- **Pinia** for state management with persistence plugin
- **Vue Router 4** for routing with authentication guards
- **Vue i18n** for internationalization (French default, English fallback)
- **Vite** as build tool and dev server
- **Element Plus** and **Vuetify** for UI components
- **Axios** with custom interceptors for API communication

### Store Architecture (Pinia-based)

**BaseStore Pattern:**
All entity stores extend `useBaseStore()` which provides:

- Generic CRUD operations (`create`, `update`, `delete`, `getOne`)
- Loading states (`isLoading`, `error`, `lastLoaded`)
- Hook system for entity-specific actions (`afterCreate`, `beforeCreate`, `afterUpdate`, `afterDelete`)
- Demo mode integration with API/mock switching
- Automatic data loading with `loadEntities()` and `ensureLoaded()`

**Entity Stores:**
Each domain has a dedicated store (e.g., `subscriptionPlans`, `subscriptions`, `invoices`, `usageMetrics`) that:

- Extends baseStore functionality
- Defines field configurations for forms (`fieldList` Map)
- Includes domain-specific translations via `useI18n().mergeLocaleMessage()`
- Implements custom business logic and utility methods

**Translation Management:**

- Translations are embedded directly in stores, not separate files
- Each store adds its translations to the global i18n instance using the `useStoreTranslations()` composable
- Pattern: `const { t } = useStoreTranslations({ en: {...}, fr: {...} })`
- Cleaner syntax that combines both languages in a single call
- Supports both English and French translations

### Component Architecture

**Generic Entity Component:**

- `Entity.vue` provides CRUD interface for any entity store
- Uses dynamic field rendering based on store's `fieldList` configuration
- Integrates with routing for entity-specific pages

**Specialized Components:**

- Domain-specific components override generic behavior when needed
- Example: `SubscriptionPlansCustomer.vue` provides customer-facing UI while `SubscriptionPlans.vue` provides admin CRUD

**Layout System:**

- `Layout.vue` wraps authenticated pages with navigation
- Routes can bypass layout with `meta.isIframe: true` (e.g., terminal viewer)
- Authentication guard in router checks `currentUser.isAuthenticated`

### Demo Mode System

**Environment Configuration:**

- Set `VITE_DEMO_MODE="true"` in `.env` to enable demo mode
- Demo mode provides mock data and simulated API responses
- Uses `isDemoMode()`, `simulateDelay()`, and `logDemoAction()` utilities

**Demo Services:**

- `demoConfig.ts` - Configuration and utilities
- `demoData.ts` - Static demo data (subscriptions, invoices, etc.)
- `demoPayments.ts` - Mock Stripe payment processing
- Each store method checks `isDemoMode()` and uses demo services accordingly

### API Integration

**Axios Configuration:**

- Base URL configured via `VITE_API_URL` and `VITE_PROTOCOL` environment variables
- JWT token automatically added to requests via `setupAxiosInterceptors()`
- Token format: `Bearer ${token}` (automatically prefixed if missing)
- Token expiry monitoring in `currentUser` store
- **IMPORTANT**: API version prefix `/api/v1/` is automatically added by axios interceptors

**Backend Integration:**

- Compatible with OCF Core Payment API (Stripe-based subscription system)
- API endpoints follow REST conventions (e.g., `/user-subscriptions/current`, `/invoices/user`)
- Error handling with user-friendly messages via store error states

**API Endpoint Guidelines:**

- ✅ **Correct**: Use relative paths without version prefix

  ```javascript
  axios.get('/user-subscriptions/current')
  axios.post('/terminals/start-session', data)
  ```

- ❌ **Incorrect**: Do NOT include `/api/v1/` prefix

  ```javascript
  axios.get('/api/v1/user-subscriptions/current')  // WRONG - double prefix
  ```

- **Exception**: Only use full URLs for external services or when bypassing interceptors

### Subscription System

**Multi-tier Architecture:**

- Customer-facing subscription selection (`/subscription-plans`)
- Admin plan management (`/admin/subscription-plans`)
- Subscription dashboard with usage tracking (`/subscription-dashboard`)
- Checkout flow with Stripe integration (`/checkout/:planId`)

**Payment Flow:**

1. Plan selection → checkout session creation
2. Redirect to Stripe (or demo) checkout
3. Success/cancel handling with proper redirects
4. Portal access for subscription management

### Terminal Integration

**Remote Terminal Access:**

- XTerm.js integration with guacamole-common-js
- Terminal sessions with sharing capabilities
- SSH key management for user access
- Iframe-based terminal viewer (bypasses main layout)

## Internationalization (i18n)

**Implementation Status:**

✅ **Complete i18n Coverage** - All user-facing components are fully translated in French (default) and English (fallback).

**Architecture:**

The application uses Vue i18n with an embedded translation pattern where translations are defined directly in components and stores rather than separate locale files. OCF Front provides two composables for cleaner translation registration:

**For Components** - `useTranslations()` (registers in onMounted):

```typescript
import { useTranslations } from '../composables/useTranslations'

const { t } = useTranslations({
  en: {
    myComponent: {
      title: 'My Component',
      description: 'This is my component description',
      parameterized: 'Hello {name}'
    }
  },
  fr: {
    myComponent: {
      title: 'Mon Composant',
      description: 'Ceci est la description de mon composant',
      parameterized: 'Bonjour {name}'
    }
  }
})
```

**For Stores** - `useStoreTranslations()` (registers immediately):

```typescript
import { useStoreTranslations } from '../composables/useTranslations'

const { t } = useStoreTranslations({
  en: {
    myStore: {
      loadError: 'Error loading data',
      saveSuccess: 'Data saved successfully'
    }
  },
  fr: {
    myStore: {
      loadError: 'Erreur lors du chargement des données',
      saveSuccess: 'Données enregistrées avec succès'
    }
  }
})
```

**Translation Patterns:**

1. **Component-Scoped Prefixes**: Each component uses a unique prefix (e.g., `login.*`, `terminalMySessions.*`)
2. **Store Translations**: Common translations centralized in stores to avoid duplication
3. **Help Documentation**: Separate locale files at `/src/locales/help/{en,fr}.ts`
4. **Parameter Interpolation**: Support for dynamic values using `{paramName}` syntax

**Fully Translated Components:**

**Authentication Pages:**

- `/src/components/Pages/Login.vue` (9 strings)
- `/src/components/Pages/Register.vue` (20 strings)
- `/src/components/Pages/PasswordReset.vue` (35 strings)

**Terminal Components:**

- `/src/components/Pages/TerminalCreation.vue` (3 strings)
- `/src/components/Pages/TerminalMySessions.vue` (70+ strings)
- `/src/components/Terminal/TerminalStarter.vue` (62+ strings)
- `/src/components/Terminal/TerminalSharingModal.vue` (already had i18n)

**Modals & Flows:**

- `/src/components/Modals/EntityModal.vue` (8 strings)
- `/src/components/Flows/CheckoutFlow.vue` (7 error strings)

**Settings Components:**

- `/src/components/Settings/SecuritySettings.vue` (6 strings)
- `/src/components/Settings/SSHKeysSettings.vue` (5 strings)
- `/src/components/Settings/LocalizationSettings.vue` (1 string)

**Help System:**

- `/src/components/Pages/Help.vue` (fully translated)
- `/src/locales/help/en.ts` (comprehensive English help documentation)
- `/src/locales/help/fr.ts` (comprehensive French help documentation)

**Demo Components:**

- `/src/components/Demo/DemoPortal.vue` (18 strings)
- `/src/components/Demo/DemoCheckout.vue` (12 strings)

**Utility Components:**

- `/src/components/Buttons/GenerationActions.vue` (5 error strings)

**Store Translations:**

- `/src/stores/userSettings.ts` (9 translation keys)
- `/src/stores/sshKeys.ts` (6 translation keys)

**Adding i18n to New Components:**

When creating new components, use the `useTranslations()` composable:

```vue
<template>
  <div>
    <h1>{{ t('myComponent.title') }}</h1>
    <p>{{ t('myComponent.description') }}</p>
  </div>
</template>

<script setup lang="ts">
import { useTranslations } from '../composables/useTranslations'

const { t } = useTranslations({
  en: {
    myComponent: {
      title: 'My Component',
      description: 'This is my component description'
    }
  },
  fr: {
    myComponent: {
      title: 'Mon Composant',
      description: 'Ceci est la description de mon composant'
    }
  }
})
</script>
```

**Adding i18n to New Stores:**

When creating new stores, use the `useStoreTranslations()` composable:

```typescript
import { defineStore } from "pinia"
import { useStoreTranslations } from '../composables/useTranslations'
import { useBaseStore } from "./baseStore"

export const useMyStore = defineStore('myStore', () => {
  const base = useBaseStore()

  const { t } = useStoreTranslations({
    en: {
      myStore: {
        pageTitle: 'My Store',
        loadError: 'Error loading data',
        saveSuccess: 'Data saved successfully'
      }
    },
    fr: {
      myStore: {
        pageTitle: 'Mon Store',
        loadError: 'Erreur lors du chargement des données',
        saveSuccess: 'Données enregistrées avec succès'
      }
    }
  })

  // ... rest of store implementation
})
```

**Important Guidelines:**

- ✅ **Always use `t()` function** for user-facing text
- ✅ **Use `useTranslations()` for components** - handles onMounted registration automatically
- ✅ **Use `useStoreTranslations()` for stores** - registers immediately for use in setup
- ✅ **Use component/store-scoped prefixes** to avoid key collisions
- ✅ **Provide both English and French** translations for all strings in a single object
- ✅ **Group translations by domain** (e.g., `myComponent: {...}` or `myStore: {...}`)
- ❌ **Never hardcode** user-facing text in templates or JavaScript
- ❌ **Never use old pattern** `useI18n().mergeLocaleMessage()` - use new composables instead
- ❌ **Avoid fallback strings** in `t()` calls when possible (register translations instead)

## Key Development Patterns

**Store Creation:**

When creating new entity stores, extend baseStore and define:

- `fieldList` Map with field configurations
- Translation messages for both languages
- Domain-specific utility methods
- Hook implementations for custom business logic

**Component Development:**

- Use generic `Entity.vue` for standard CRUD operations
- Create specialized components for complex user workflows
- Follow the translation pattern: `{{ t('domainName.translationKey') }}`
- Leverage demo mode for development and testing

**Authentication:**

- All protected routes require `meta: { requiresAuth: true }`
- Use `currentUser.isAuthenticated` to check login status
- JWT tokens are automatically managed by axios interceptors

**Demo Mode Usage:**

Enable demo mode for safe development without backend dependencies. All subscription/payment features work with realistic mock data and simulated delays.

## Code Quality & Standards

### Error Handling

**Standard Pattern:**

All error handling in the application must follow a consistent pattern:

```typescript
// ✅ CORRECT - Use translation keys for error messages
try {
  const response = await axios.post('/endpoint', data)
  return response.data
} catch (err: any) {
  error.value = err.response?.data?.error_message ||
                err.response?.data?.message ||
                t('myDomain.errorKey')
  throw err
}
```

**Important Guidelines:**

- ✅ **Always use translation keys** for error messages (never hardcode French or English)
- ✅ **Check both `error_message` and `message`** fields from API responses
- ✅ **Provide fallback translation key** for unknown errors
- ✅ **Use try-catch-finally** for loading state management
- ❌ **Never hardcode** error messages like `'Erreur de chargement'` or `'Error loading'`
- ❌ **Never show** raw error objects to users

**Error Message Priority:**

1. `err.response?.data?.error_message` - Backend-provided user-friendly message
2. `err.response?.data?.message` - Alternative backend message field
3. `t('domain.errorKey')` - Translated fallback message

**Example - Store Error Handling:**

```typescript
const loadUserData = async () => {
  try {
    base.isLoading.value = true
    base.error.value = ''
    const response = await axios.get('/users/current')
    userData.value = response.data
    return response.data
  } catch (err: any) {
    console.error('Error loading user data:', err)
    base.error.value = err.response?.data?.error_message ||
                       err.response?.data?.message ||
                       t('users.loadError')
    throw err
  } finally {
    base.isLoading.value = false
  }
}
```

**Console Logging Standards:**

- Use `console.error()` for errors with descriptive context
- Use `console.warn()` for warnings (e.g., demo mode fallbacks)
- Use `console.log()` sparingly for important state changes
- Use `console.debug()` (wrapped in `import.meta.env.DEV` check) for development-only logs

### Import Paths

**IMPORTANT:** This project does NOT have `@` path alias configured.

```typescript
// ❌ WRONG - @ alias is not configured
import { formatCurrency } from '@/utils/formatters'
import { useBaseStore } from '@/stores/baseStore'

// ✅ CORRECT - Use relative paths
import { formatCurrency } from '../utils/formatters'
import { formatCurrency } from '../../utils/formatters'
import { useBaseStore } from './baseStore'
```

**Path Resolution Rules:**

- Always use **relative paths** (`./`, `../`, `../../`)
- Count directory levels carefully
- From stores → utils: `'../utils/formatters'`
- From components → utils: `'../../utils/formatters'` or `'../../../utils/formatters'`
- From stores → stores: `'./otherStore'`

### Shared Utilities

**Formatters (`/src/utils/formatters.ts`):**

Always use shared formatter functions instead of duplicating formatting logic:

```typescript
import { formatCurrency, formatDate, formatDateTime, formatStorageSize } from '../utils/formatters'

// ✅ CORRECT - Use shared formatters
const displayPrice = formatCurrency(priceInCents, 'EUR')
const displayDate = formatDate(dateString, 'fr-FR')

// ❌ WRONG - Don't duplicate formatting logic
const displayPrice = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR'
}).format(priceInCents / 100)
```

Available formatters:

- `formatCurrency(amount, currency, locale)` - Format money (amount in cents)
- `formatDate(dateString, locale, fallback)` - Format date only
- `formatDateTime(dateString, locale, fallback)` - Format date and time
- `formatStorageSize(bytes, decimals)` - Format bytes to KB/MB/GB
- `formatNumber(value, locale)` - Format with thousand separators
- `formatPercentage(value, decimals, locale)` - Format decimal as percentage
- `formatDuration(seconds)` - Format seconds to "2h 30m" format
- `truncate(text, maxLength, ellipsis)` - Truncate long strings

## Feature Flags System

**GitLab-style Implementation:**

OCF Front includes a comprehensive feature flags system for gradual rollouts, A/B testing, and emergency feature toggling.

**Core Architecture:**

- `services/featureFlags.ts` - Main service with GitLab-style API
- `composables/useFeatureFlags.ts` - Vue 3 composable for easy integration
- Reactive flag checking with real-time navigation updates
- Backend database as primary source of truth (via `/features` endpoint)
- Environment variable fallback via `VITE_FEATURE_FLAG_*` (when backend returns empty)

**Critical Initialization Order:**

The feature flags system has a **strict initialization sequence** to ensure proper functionality:

```typescript
// CORRECT ORDER (in main.ts):
1. setupAxiosDefaults()           // Set axios baseURL FIRST
2. setupAxiosInterceptors()       // Set auth interceptors
3. Create app + use(pinia)        // Initialize Pinia (for token access)
4. Initialize userStore           // Load persisted token
5. featureFlagService.waitForInitialization()  // Fetch flags from backend
6. app.mount('#app')              // Mount app with correct flags
```

**⚠️ Common Pitfall - Timing Issues:**

The feature flag service uses **lazy initialization** to avoid fetching before axios is configured:

```typescript
// ❌ WRONG - Eager initialization (fetches immediately)
private constructor() {
  this.initPromise = this.initialize()  // Axios not ready!
}

// ✅ CORRECT - Lazy initialization (waits for explicit call)
private constructor() {
  this.initPromise = null  // No fetch yet
}

async waitForInitialization() {
  if (!this.initPromise) {
    this.initPromise = this.initialize()  // Start now (axios ready)
  }
  await this.initPromise
}
```

**If feature flags fail on page reload but work after login:**

- Check that axios baseURL is set BEFORE feature flag initialization
- Verify request goes to `http://localhost:8080/api/v1/features` (not `http://localhost:4000/features`)
- Check browser Network tab: should return JSON, not HTML
- Backend should return paginated response: `{data: [{key, enabled, ...}]}`

**Data Flow:**

1. **Backend Primary Source**: GET `/features` returns array of feature flags from database
2. **Paginated Response**: `{data: [...], total: N, currentPage: 1, ...}`
3. **Frontend Mapping**: Backend keys map to frontend flags (e.g., `"terminals"` → `"terminal_management"`)
4. **OR Logic**: Multiple backend features can map to one frontend flag (enabled if ANY are enabled)
5. **Fallback**: If backend returns empty array, falls back to environment variables (if any)
6. **Default Values**: If no backend data and no env vars, uses hardcoded defaults (security-first: disabled)

**Backend-to-Frontend Flag Mapping:**

The backend feature keys map to frontend flags as follows:

| Backend Key | Frontend Flag | OR Logic | Notes |
|-------------|---------------|----------|-------|
| `course_conception` | `course_conception` | No | Direct 1:1 mapping |
| `labs` | `terminal_management` | **Yes** | Multiple backend → one frontend |
| `terminals` | `terminal_management` | **Yes** | Enabled if labs OR terminals enabled |
| *(unmapped)* | `theme_customization` | No | Frontend-only (defaults enabled) |
| *(unmapped)* | `archive_generations` | No | Frontend-only (defaults enabled) |
| *(unmapped)* | `ssh_key_management` | No | Frontend-only (defaults enabled) |
| *(unmapped)* | `help_documentation` | No | Frontend-only (defaults enabled) |

**Environment Variable Fallback (Emergency Use):**

```bash
# Individual Features (item-level)
VITE_FEATURE_FLAG_THEME_CUSTOMIZATION=true    # Themes menu item
VITE_FEATURE_FLAG_ARCHIVE_GENERATIONS=true    # Generations menu item
VITE_FEATURE_FLAG_SSH_KEY_MANAGEMENT=true     # SSH keys menu item

# Major Sections (category-level)
VITE_FEATURE_FLAG_COURSE_CONCEPTION=true      # Entire Course Design section
VITE_FEATURE_FLAG_TERMINAL_MANAGEMENT=true    # Entire Practical Work section
VITE_FEATURE_FLAG_HELP_DOCUMENTATION=true     # Entire Help section
```

**⚠️ Security Note**: Environment variables should ONLY be used as emergency fallback. The backend database is the source of truth for production. Default values are intentionally restrictive (disabled) to prevent unauthorized access.

**Usage Patterns:**

```typescript
// In components
const { isEnabled } = useFeatureFlags()
if (isEnabled('course_conception')) {
  // Feature-specific code
}

// Reactive navigation filtering (automatic)
// Categories/items with featureFlag property are auto-filtered

// Admin interface
// /debug/feature-flags or Administration → Feature Flags
```

**Role-based Restrictions:**

- `course_conception` - Limited to administrators and teachers
- `terminal_management` - Available to all user roles
- `help_documentation` - Available to all user roles
- Individual flags - No role restrictions by default

**Navigation Integration:**

The feature flags system automatically controls navigation menu visibility:

- Category-level flags hide entire menu sections
- Item-level flags hide individual menu items
- Real-time updates when flags are toggled in admin panel
- Graceful degradation with no broken links

**Emergency Controls:**

Feature flags can be disabled instantly via environment variables for emergency situations:

```bash
# Disable core course functionality
VITE_FEATURE_FLAG_COURSE_CONCEPTION=false

# Disable all terminal/lab features
VITE_FEATURE_FLAG_TERMINAL_MANAGEMENT=false
```
