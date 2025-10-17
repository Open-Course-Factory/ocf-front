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

### Service Architecture

**Domain-Organized Structure:**

OCF Front uses a domain-driven service organization to improve discoverability, scalability, and code splitting:

```shell
src/services/
├── core/                  # Core infrastructure (framework-level)
│   ├── http/             # Axios configuration and interceptors
│   ├── error/            # Error handling utilities
│   ├── logging/          # Structured logging
│   └── storage/          # LocalStorage wrappers
├── auth/                 # Authentication & JWT tokens
├── features/             # Feature flags system
├── domain/               # Business domain services
│   ├── terminal/         # Terminal operations
│   ├── user/             # User operations
│   └── help/             # Help documentation
├── data/                 # Static data (countries, constants)
└── demo/                 # Demo mode services
```

**Service Import Guidelines:**

```typescript
// ✅ CORRECT - Import from organized structure
import { setupAxiosInterceptors } from './services/core/http'
import { featureFlagService } from './services/features'
import { terminalService } from './services/domain/terminal'
import { isDemoMode } from './services/demo'

// ❌ WRONG - Old flat structure (deprecated)
import { setupAxiosInterceptors } from './services/axiosInterceptor'
import { featureFlagService } from './services/featureFlags'
```

**Benefits:**

- **Clear Separation**: Infrastructure vs business logic vs demo code
- **Better Discoverability**: Browse by domain instead of guessing filenames
- **Code Splitting**: Demo services can be excluded from production bundles
- **Scalability**: Clear place for new services (e.g., `domain/payments/`)

### Component Architecture

**Generic Entity Component:**

- `Entity.vue` provides CRUD interface for any entity store
- Uses dynamic field rendering based on store's `fieldList` configuration
- Integrates with routing for entity-specific pages

**Specialized Components:**

- Domain-specific components override generic behavior when needed
- Example: `SubscriptionPlansCustomer.vue` provides customer-facing UI while `SubscriptionPlans.vue` provides admin CRUD

**BaseModal Component:**

OCF Front uses a centralized modal system to ensure consistency and reduce duplication:

- `BaseModal.vue` (367 lines) - Foundation modal with 18 configurable props and 3 slots
- **18 Props**: `visible`, `title`, `titleIcon`, `size`, `isLoading`, `showClose`, `showDefaultFooter`, `confirmText`, `confirmIcon`, `confirmDisabled`, `cancelText`, `allowOutsideClose`, `noPadding`, `maxHeight`, `fullHeight`, `zIndex`, `trapFocus`, `showOverlay`
- **3 Slots**: `header` (custom title), `default` (content), `footer` (custom buttons)
- **4 Size Variants**: small (400px), medium (600px), large (800px), xlarge (1200px)
- **CSS Safety**: All classes use `base-modal-` prefix to avoid global conflicts

**Usage Pattern - BaseModal:**

```vue
<template>
  <BaseModal
    :visible="isVisible"
    :title="t('myModal.title')"
    title-icon="fas fa-user"
    size="medium"
    :is-loading="isSubmitting"
    :show-default-footer="true"
    :confirm-text="t('myModal.confirm')"
    confirm-icon="fas fa-check"
    :confirm-disabled="!isValid"
    :cancel-text="t('myModal.cancel')"
    @close="handleClose"
    @confirm="handleConfirm"
  >
    <p>{{ t('myModal.description') }}</p>
    <input v-model="formData.name" />
  </BaseModal>
</template>

<script setup lang="ts">
import BaseModal from '../Modals/BaseModal.vue'

// Custom header/footer using slots:
// <template #header>Custom Title</template>
// <template #footer>Custom Buttons</template>
</script>
```

**Guidelines:**

- ✅ **Always use BaseModal** for new modals instead of creating custom modal wrappers
- ✅ **Use `base-modal-` CSS prefix** if you need to override styles (scoped CSS)
- ✅ **Leverage slots** for complex header/footer requirements
- ✅ **Use size variants** instead of custom width styles
- ❌ **Never create new modal base components** - extend BaseModal instead
- ❌ **Never use generic class names** like `.modal-content` (causes conflicts)

**EntityModal Component:**

OCF Front provides a generic CRUD modal that dynamically renders forms based on store field configurations:

- `EntityModal.vue` - Generic create/edit modal for all entities
- Automatically renders fields based on `store.fieldList` configuration
- **Supported Field Types**: `input`, `textarea`, `advanced-textarea`, `select`, `number`, `date`, `checkbox`, `subentity`
- Automatic validation (required fields, min/max for numbers, uniqueness checks)
- Bilingual error messages (French/English)

**Supported Field Types:**

| Field Type | HTML Element | Features | Example Use Case |
|------------|--------------|----------|------------------|
| `input` | `<input type="text">` | Basic text input | Name, email, slug |
| `textarea` | `<textarea>` | Multi-line text (250px height) | Description, notes |
| `advanced-textarea` | `<textarea>` | Line-based array conversion | List of items (one per line) |
| `select` | `<select>` | Dropdown with options | Status, role, category |
| `number` | `<input type="number">` | Numeric input with min/max/step | Age, count, price |
| `date` | `<input type="date">` | Date picker (250px width) | Expiration date, birth date |
| `checkbox` | `<input type="checkbox">` | Boolean toggle (20px) | Active status, enabled flag |
| `subentity` | `<v-autocomplete>` | Related entity selection | Parent entity, foreign key |

**Usage Pattern - EntityModal:**

```vue
<template>
  <EntityModal
    :visible="showModal"
    :entity="selectedEntity"
    :entity-store="myEntityStore"
    entity-name="my-entities"
    @submit="handleCreate"
    @modify="handleUpdate"
    @close="showModal = false"
  />
</template>

<script setup lang="ts">
import EntityModal from '../Modals/EntityModal.vue'
import { useMyEntityStore } from '../../stores/myEntity'

const myEntityStore = useMyEntityStore()
const showModal = ref(false)
const selectedEntity = ref(null)

const handleCreate = async (data) => {
  await myEntityStore.createEntity('/my-entities', data)
  showModal.value = false
}

const handleUpdate = async (data) => {
  await myEntityStore.updateEntity('/my-entities', data.id, data)
  showModal.value = false
}
</script>
```

**Field Configuration Examples:**

```typescript
import { field, buildFieldList } from '../utils/fieldBuilder'

const fieldList = buildFieldList([
  // Text input
  field('name', t('entity.name'))
    .input()
    .visible()
    .creatable()
    .editable()
    .required(),

  // Number with constraints
  field('max_members', t('entity.maxMembers'))
    .number()
    .visible()
    .editable()
    .withMin(1)
    .withMax(100)
    .withStep(1),

  // Date picker
  field('expires_at', t('entity.expiresAt'))
    .date()
    .visible()
    .editable()
    .withDateFormat(),

  // Checkbox
  field('is_active', t('entity.isActive'))
    .checkbox()
    .visible()
    .editable(),

  // Select dropdown
  field('status', t('entity.status'))
    .select()
    .withOptions([
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' }
    ])
    .visible()
    .editable(),

  // Readonly field (not shown in forms)
  field('created_at', t('entity.createdAt'))
    .input()
    .visible()
    .readonly()
    .withDateTimeFormat()
])
```

**Validation Rules:**

- **Required Fields**: Shows "{field} is required" error if empty
- **Number Constraints**:
  - `min`: "Value must be at least {min}"
  - `max`: "Value must be at most {max}"
  - Invalid number: "Please enter a valid number"
- **Uniqueness**: Checks `name` field against existing entities (optional)
- **Checkbox**: Never considered empty (boolean value)

**Guidelines:**

- ✅ **Always use EntityModal** for entity CRUD operations
- ✅ **Define fieldList** with proper types in your entity store
- ✅ **Use field visibility flags** (`.creatable()`, `.editable()`, `.hidden()`)
- ✅ **Add validation constraints** (`.required()`, `.withMin()`, `.withMax()`)
- ✅ **Leverage existing field types** - don't create custom form components
- ❌ **Never create custom entity forms** - extend EntityModal if needed
- ❌ **Never hardcode form validation** - use fieldBuilder constraints

**SettingsPageWrapper Pattern:**

OCF Front uses a dynamic component loader for settings pages to eliminate duplication:

- `SettingsPageWrapper.vue` (43 lines) - Generic wrapper with `defineAsyncComponent()`
- Replaces 6 duplicate wrapper files with a single reusable component
- Uses router props to specify which settings component to load

**Usage Pattern - Settings Routes:**

```typescript
// In router/index.ts
{
  path: 'settings/navigation',
  name: 'SettingsNavigation',
  component: () => import('../components/UI/SettingsPageWrapper.vue'),
  props: { componentName: 'NavigationSettings' },  // Specify component name
  meta: { requiresAuth: true, isSettings: true }
}
```

**Available Settings Components:**

- `NavigationSettings` - Navigation preferences
- `LocalizationSettings` - Language and locale
- `UISettings` - Theme and appearance
- `NotificationSettings` - Notification preferences
- `SecuritySettings` - Password and security
- `SSHKeysSettings` - SSH key management

**Guidelines:**

- ✅ **Use SettingsPageWrapper** for all settings routes
- ✅ **Pass `componentName` prop** matching the component map in SettingsPageWrapper.vue
- ✅ **Add new settings** to the `componentMap` in SettingsPageWrapper.vue
- ❌ **Never create new settings page wrappers** - use the generic wrapper

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

- `fieldList` Map with field configurations using FieldBuilder
- Translation messages for both languages using `useStoreTranslations()`
- Domain-specific utility methods wrapped with AsyncWrapper
- Hook implementations for custom business logic

**FieldBuilder Pattern:**

OCF Front provides a fluent API for building field configurations:

```typescript
import { fieldBuilder } from '../utils/fieldBuilder'

const fieldList = new Map([
  ['name', fieldBuilder('name')
    .label('Name')
    .required()
    .minLength(3)
    .maxLength(100)
    .build()
  ],
  ['email', fieldBuilder('email')
    .label('Email')
    .type('email')
    .required()
    .build()
  ],
  ['status', fieldBuilder('status')
    .label('Status')
    .type('select')
    .options([
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' }
    ])
    .build()
  ]
])
```

**Available field types**: `text`, `email`, `password`, `number`, `select`, `checkbox`, `textarea`, `date`, `datetime`, `file`

**AsyncWrapper Pattern:**

OCF Front provides a utility to reduce boilerplate in async operations:

```typescript
import { asyncWrapper } from '../utils/asyncWrapper'

// Before (verbose):
const loadData = async () => {
  try {
    base.isLoading.value = true
    base.error.value = ''
    const response = await axios.get('/endpoint')
    return response.data
  } catch (err: any) {
    console.error('Error loading data:', err)
    base.error.value = err.response?.data?.error_message ||
                       err.response?.data?.message ||
                       t('myStore.loadError')
    throw err
  } finally {
    base.isLoading.value = false
  }
}

// After (concise):
const loadData = asyncWrapper(
  async () => {
    const response = await axios.get('/endpoint')
    return response.data
  },
  base,
  'myStore.loadError',
  'Loading data'
)
```

**AsyncWrapper Benefits:**

- ✅ Automatic loading state management
- ✅ Consistent error handling with i18n fallback
- ✅ Console logging with descriptive context
- ✅ Reduces 15+ lines to 5 lines per async function

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

### Type Definitions

**Centralized Type System:**

OCF Front uses a centralized type system in `/src/types/` for consistent type definitions across the application:

```plaintext
src/types/
├── index.ts         # Central export file (import from here)
├── api.ts           # API request/response types
├── entities.ts      # Domain entity types (15+ entities)
├── services.ts      # Service layer types
├── errors.ts        # Error types
└── help.ts          # Help system types
```

**Import Pattern:**

```typescript
// ✅ CORRECT - Import from central types file
import { User, SubscriptionPlan, ApiResponse, PaginatedResponse } from '../types'

// ❌ WRONG - Don't import from individual files
import { User } from '../types/entities'
import { ApiResponse } from '../types/api'
```

**API Types (`/src/types/api.ts`):**

```typescript
// Generic API response wrapper
export interface ApiResponse<T> {
  data: T
  message?: string
  success?: boolean
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  currentPage: number
  lastPage: number
  perPage: number
}

// Usage example:
const response: ApiResponse<User> = await axios.get('/users/current')
const users: PaginatedResponse<User> = await axios.get('/users')
```

**Entity Types (`/src/types/entities.ts`):**

All domain entities extend `BaseEntity` for consistency:

```typescript
export interface BaseEntity {
  id: string
  created_at?: string
  updated_at?: string
}

export interface User extends BaseEntity {
  email: string
  username?: string
  display_name?: string
  roles?: string[]
  is_active?: boolean
  last_login?: string
}

export interface SubscriptionPlan extends BaseEntity {
  name: string
  description?: string
  price: number
  currency: string
  billing_interval: 'month' | 'year'
  features?: Record<string, any>
  is_active?: boolean
  stripe_price_id?: string
}

// ... 15+ more entity types (TerminalSession, SshKey, Course, etc.)
```

**Service Types (`/src/types/services.ts`):**

```typescript
// Async state management
export interface AsyncState<T = any> {
  isLoading: boolean
  error: string
  data?: T
  lastLoaded?: Date
}

// Server metrics
export interface ServerMetrics {
  cpu_percent: number
  ram_total_gb: number
  ram_available_gb: number
  disk_total_gb?: number
  disk_available_gb?: number
  active_terminals?: number
  max_terminals?: number
  timestamp?: string
}

// Instance types
export interface InstanceType {
  prefix: string
  name: string
  description: string
  size: string
  ram_gb?: number
  cpu_cores?: number
  display_order?: number
}
```

**Type Safety Guidelines:**

- ✅ **Use types from `/src/types/`** for all API responses and entities
- ✅ **Import from central index file** (`from '../types'`)
- ✅ **Extend `BaseEntity`** for new domain entities
- ✅ **Use generic types** like `ApiResponse<T>` and `PaginatedResponse<T>`
- ✅ **Define new types in appropriate file** (api.ts, entities.ts, or services.ts)
- ❌ **Avoid `any` type** - use proper types from `/src/types/` instead
- ❌ **Don't duplicate types** - add to centralized files

**Adding New Types:**

```typescript
// 1. Add entity to /src/types/entities.ts
export interface MyEntity extends BaseEntity {
  name: string
  status: 'active' | 'inactive'
}

// 2. Types are automatically exported via /src/types/index.ts
// No changes needed - index.ts uses export * from './entities'

// 3. Use in components/stores
import { MyEntity } from '../types'
```

### CSS Architecture & Shared Stylesheets

**Overview:**

OCF Front uses a centralized CSS architecture with shared stylesheets to reduce duplication, ensure consistent styling, and support dark mode across all components.

**Shared Stylesheets:**

```plaintext
src/assets/styles/
├── main.css              # Entry point (imports all stylesheets)
├── variables.css         # Design tokens (colors, spacing, fonts)
├── components.css        # Generic utilities (buttons, alerts, tables)
├── forms-common.css      # Shared form styles
├── modals-common.css     # Shared modal styles
├── cards-common.css      # Shared card/list item styles
└── help-article.css      # Help documentation styles
```

**Import Order (in main.css):**

1. Design tokens (variables.css)
2. Generic components (components.css)
3. Shared patterns (forms, modals, cards)
4. Domain-specific (help articles)

**Shared Form Styles (`forms-common.css`):**

All form-related styles used across 50+ components:

- `.form-group` - Form field container
- `.form-control` - Input/select/textarea base styles
- `.form-select` - Select dropdown with custom arrow
- `.checkbox-label`, `.radio-label` - Checkbox/radio styles
- `.invalid-feedback` - Error message styles
- Focus states, disabled states, invalid states

**Shared Modal Styles (`modals-common.css`):**

All modal-related styles for consistent dialogs:

- `.modal-overlay` - Modal backdrop
- `.modal-container`, `.modal-content` - Modal container
- `.modal-header` - Modal title section
- `.modal-body` - Modal content area
- `.modal-footer` - Modal action buttons
- Size variants (small, medium, large, xlarge)

**Shared Card Styles (`cards-common.css`):**

All card and list item patterns:

- `.card`, `.card-header`, `.card-body`, `.card-footer` - Generic card
- `.entity-card` - Entity display cards (admin pages)
- `.list-item-card`, `.ssh-key-item`, `.terminal-session-item` - List items
- `.instance-card` - Terminal instance cards
- `.subscription-card`, `.plan-card` - Subscription/plan cards
- `.metric-card` - Metric display cards
- `.empty-state` - Empty state messages
- Responsive patterns for mobile

**Dark Mode Support:**

All shared stylesheets use CSS variables for colors:

```css
/* Light mode (default) */
--color-text-primary: #2c3e50;
--color-bg-primary: #ffffff;

/* Dark mode (data-theme="dark") */
--color-text-primary: #f5f5f5;
--color-bg-primary: #1a1a1a;
```

**Key CSS Variables:**

- `var(--color-text-primary)` - Main text (#f5f5f5 in dark mode)
- `var(--color-text-secondary)` - Labels
- `var(--color-text-muted)` - Secondary info
- `var(--color-bg-primary)` - Main background
- `var(--color-bg-secondary)` - Card/modal backgrounds
- `var(--color-bg-tertiary)` - Hover states
- `var(--color-border-light)` - Border colors
- `var(--color-primary)` - Icons, accents

**Usage Pattern:**

All shared styles are automatically available to all components via `main.css`. No need to import them explicitly:

```vue
<template>
  <!-- Shared classes work automatically -->
  <div class="card">
    <div class="card-header">
      <h3>{{ title }}</h3>
    </div>
    <div class="card-body">
      <form class="form-group">
        <label>Name</label>
        <input class="form-control" v-model="name" />
      </form>
    </div>
  </div>
</template>

<style scoped>
/* Add only component-specific overrides */
.card {
  max-width: 800px; /* Component-specific constraint */
}
</style>
```

**Guidelines:**

- ✅ **Use shared classes** (`.card`, `.form-control`, `.modal-overlay`, etc.)
- ✅ **Use CSS variables** for all colors (never hardcode)
- ✅ **Add component-specific styles only** when needed
- ✅ **Follow responsive patterns** from shared stylesheets
- ❌ **Never duplicate** styles from shared stylesheets
- ❌ **Never hardcode colors** (use CSS variables)
- ❌ **Never create new base modal/form/card components**

**Benefits:**

- Reduced CSS duplication by ~40-50% (~650 lines)
- Consistent styling across all pages
- Unified dark mode support
- Easier maintenance - update one place, changes propagate everywhere
- Better developer experience - clear patterns to follow

### CSS Coding Standards

⚠ CRITICAL: Never Hardcode Colors ⚠

All colors **MUST use CSS variables** for dark mode compatibility:

```vue
<!-- ❌ BAD - Hardcoded colors (breaks dark mode) -->
<style scoped>
.my-button {
  background-color: #007bff;
  color: #ffffff;
  border: 1px solid #ddd;
}
</style>

<!-- ✅ GOOD - CSS variables (works in dark mode) -->
<style scoped>
.my-button {
  background-color: var(--color-primary);
  color: var(--color-white);
  border: var(--border-width-thin) solid var(--color-border-medium);
}
</style>
```

**Available CSS Variables:**

**Colors:**

- Primary: `--color-primary`, `--color-primary-hover`
- Secondary: `--color-secondary`, `--color-secondary-hover`
- Status: `--color-success`, `--color-danger`, `--color-warning`, `--color-info`
- Status backgrounds: `--color-success-bg`, `--color-danger-bg`, `--color-warning-bg`, `--color-info-bg`
- Status text: `--color-success-text`, `--color-danger-text`, `--color-warning-text`, `--color-info-text`
- Status borders: `--color-success-border`, `--color-danger-border`, `--color-warning-border`, `--color-info-border`
- Neutrals: `--color-white`, `--color-black`
- Grays: `--color-gray-50` through `--color-gray-900` (50/100/200/300/400/500/600/700/800/900)
- Text: `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`, `--color-text-disabled`
- Backgrounds: `--color-bg-primary`, `--color-bg-secondary`, `--color-bg-tertiary`, `--color-bg-dark`
- Borders: `--color-border-light`, `--color-border-medium`, `--color-border-dark`

**Spacing:**

- `--spacing-xs`, `--spacing-sm`, `--spacing-md`, `--spacing-lg`, `--spacing-xl`, `--spacing-2xl`

**Typography:**

- Sizes: `--font-size-xs`, `--font-size-sm`, `--font-size-base`, `--font-size-md`, `--font-size-lg`, `--font-size-xl`, `--font-size-2xl`, `--font-size-3xl`, `--font-size-4xl`
- Weights: `--font-weight-normal`, `--font-weight-medium`, `--font-weight-semibold`, `--font-weight-bold`

**Borders:**

- Width: `--border-width-thin`, `--border-width-medium`, `--border-width-thick`
- Radius: `--border-radius-sm`, `--border-radius-md`, `--border-radius-lg`, `--border-radius-xl`, `--border-radius-full`

**Shadows:**

- `--shadow-xs`, `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`
- Focus: `--shadow-focus-primary`, `--shadow-focus-danger`

**Transitions:**

- `--transition-fast`, `--transition-base`, `--transition-slow`

**CSS Guidelines:**

- ✅ **Always use CSS variables** for colors, spacing, typography
- ✅ **Use scoped styles** when possible to avoid conflicts
- ✅ **Leverage shared stylesheets** (cards-common.css, forms-common.css, modals-common.css)
- ✅ **Test in both light and dark modes** before committing
- ❌ **Never hardcode hex colors** (#007bff, #fff, etc.) - use variables
- ❌ **Never hardcode spacing values** (use --spacing-* variables)
- ❌ **Never create duplicate base components** (use BaseModal, shared classes)

**Dark Mode Testing:**

To test dark mode locally:

```javascript
// In browser console or via UI settings
document.documentElement.setAttribute('data-theme', 'dark')

// Switch back to light mode
document.documentElement.setAttribute('data-theme', 'light')
```

**Compact Mode:**

Components automatically support compact mode via CSS variables:

```html
<!-- Compact mode activated via data attribute -->
<html data-compact="true">
```

All `--spacing-*` and `--font-size-*` variables are reduced by ~30% in compact mode.

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

# Disable all terminal features
VITE_FEATURE_FLAG_TERMINAL_MANAGEMENT=false
```
