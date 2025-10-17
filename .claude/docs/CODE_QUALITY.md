# Code Quality & Standards

## Error Handling

### Standard Pattern

All error handling must follow this consistent pattern:

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

### Important Guidelines

- ✅ **Always use translation keys** for error messages (never hardcode French or English)
- ✅ **Check both `error_message` and `message`** fields from API responses
- ✅ **Provide fallback translation key** for unknown errors
- ✅ **Use try-catch-finally** for loading state management
- ❌ **Never hardcode** error messages like `'Erreur de chargement'` or `'Error loading'`
- ❌ **Never show** raw error objects to users

### Error Message Priority

1. `err.response?.data?.error_message` - Backend-provided user-friendly message
2. `err.response?.data?.message` - Alternative backend message field
3. `t('domain.errorKey')` - Translated fallback message

### Console Logging Standards

- Use `console.error()` for errors with descriptive context
- Use `console.warn()` for warnings (e.g., demo mode fallbacks)
- Use `console.log()` sparingly for important state changes
- Use `console.debug()` (wrapped in `import.meta.env.DEV` check) for development-only logs

## Import Paths

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

### Path Resolution Rules

- Always use **relative paths** (`./`, `../`, `../../`)
- Count directory levels carefully
- From stores → utils: `'../utils/formatters'`
- From components → utils: `'../../utils/formatters'` or `'../../../utils/formatters'`
- From stores → stores: `'./otherStore'`

## Shared Utilities

### Formatters (`/src/utils/formatters.ts`)

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

**Available formatters:**

- `formatCurrency(amount, currency, locale)` - Format money (amount in cents)
- `formatDate(dateString, locale, fallback)` - Format date only
- `formatDateTime(dateString, locale, fallback)` - Format date and time
- `formatStorageSize(bytes, decimals)` - Format bytes to KB/MB/GB
- `formatNumber(value, locale)` - Format with thousand separators
- `formatPercentage(value, decimals, locale)` - Format decimal as percentage
- `formatDuration(seconds)` - Format seconds to "2h 30m" format
- `truncate(text, maxLength, ellipsis)` - Truncate long strings

## Type Definitions

### Centralized Type System

OCF Front uses a centralized type system in `/src/types/`:

```plaintext
src/types/
├── index.ts         # Central export file (import from here)
├── api.ts           # API request/response types
├── entities.ts      # Domain entity types (15+ entities)
├── services.ts      # Service layer types
├── errors.ts        # Error types
└── help.ts          # Help system types
```

### Import Pattern

```typescript
// ✅ CORRECT - Import from central types file
import { User, SubscriptionPlan, ApiResponse, PaginatedResponse } from '../types'

// ❌ WRONG - Don't import from individual files
import { User } from '../types/entities'
import { ApiResponse } from '../types/api'
```

### Type Safety Guidelines

- ✅ **Use types from `/src/types/`** for all API responses and entities
- ✅ **Import from central index file** (`from '../types'`)
- ✅ **Extend `BaseEntity`** for new domain entities
- ✅ **Use generic types** like `ApiResponse<T>` and `PaginatedResponse<T>`
- ✅ **Define new types in appropriate file** (api.ts, entities.ts, or services.ts)
- ❌ **Avoid `any` type** - use proper types from `/src/types/` instead
- ❌ **Don't duplicate types** - add to centralized files

## AsyncWrapper Pattern

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

**Benefits:**
- ✅ Automatic loading state management
- ✅ Consistent error handling with i18n fallback
- ✅ Console logging with descriptive context
- ✅ Reduces 15+ lines to 5 lines per async function

## FieldBuilder Pattern

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
