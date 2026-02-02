# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference

**Development Commands:**

```bash
npm run dev      # Start dev server (http://localhost:4000)
npm run build    # TypeScript compilation + Vite build
npm run preview  # Preview production build
```

**Version Control:**

- **GitLab** (NOT GitHub) - Use `glab` CLI for all Git operations
- Issues: `glab issue list`, `glab issue view <id>`
- MRs: `glab mr create`, `glab mr view <id>`
- Never use `gh` commands - this project uses GitLab

**Tech Stack:**

- Vue 3 (Composition API + TypeScript)
- Pinia (state management)
- Vue Router 4 (routing + auth guards)
- Vue i18n (French default, English fallback)
- Vite (build tool)
- Element Plus + Vuetify (UI components)
- Axios (API client with interceptors)

## Architecture Principles

### Store Architecture

All entity stores extend `useBaseStore()` for consistent CRUD operations, loading states, and demo mode support. See [STORES.md](.claude/docs/STORES.md) for details.

### Service Architecture

Domain-driven organization in `src/services/`:

- `core/` - Infrastructure (http, error, logging, storage)
- `auth/` - Authentication & JWT
- `features/` - Feature flags
- `domain/` - Business logic (terminal, user, help)
- `demo/` - Mock data for development

See [SERVICES.md](.claude/docs/SERVICES.md) for import patterns.

### Component Architecture

- `Entity.vue` - Generic CRUD interface for any entity
- `BaseModal.vue` - Centralized modal system (18 props, 3 slots)
- `EntityModal.vue` - Auto-generated forms based on store `fieldList`
- `SettingsPageWrapper.vue` - Dynamic settings component loader

See [COMPONENTS.md](.claude/docs/COMPONENTS.md) for usage patterns.

## Critical Guidelines

### Internationalization

**All user-facing text MUST be translated (French + English)**

```typescript
// Components - use useTranslations()
import { useTranslations } from '../composables/useTranslations'
const { t } = useTranslations({
  en: { myComponent: { title: 'Title' } },
  fr: { myComponent: { title: 'Titre' } }
})

// Stores - use useStoreTranslations()
import { useStoreTranslations } from '../composables/useTranslations'
const { t } = useStoreTranslations({
  en: { myStore: { error: 'Error' } },
  fr: { myStore: { error: 'Erreur' } }
})
```

See [I18N.md](.claude/docs/I18N.md) for comprehensive i18n patterns.

### CSS Standards

**Never hardcode colors - always use CSS variables for dark mode compatibility**

```vue
<!-- ✅ GOOD -->
<style scoped>
.btn { background: var(--color-primary); color: var(--color-text-primary); }
</style>

<!-- ❌ BAD -->
<style scoped>
.btn { background: #007bff; color: #2c3e50; }
</style>
```

**Shared stylesheets** (auto-imported via `main.css`):

- `variables.css` - Design tokens (colors, spacing, fonts)
- `forms-common.css`, `modals-common.css`, `cards-common.css` - Reusable patterns

See [CSS.md](.claude/docs/CSS.md) for CSS variables and shared classes.

### Error Handling

**Always use translation keys - never hardcode error messages**

```typescript
// ✅ CORRECT
catch (err: any) {
  error.value = err.response?.data?.error_message ||
                err.response?.data?.message ||
                t('myDomain.errorKey')
}

// ❌ WRONG
catch (err: any) {
  error.value = 'Erreur de chargement' // Never hardcode French/English
}
```

See [CODE_QUALITY.md](.claude/docs/CODE_QUALITY.md) for standards.

### Import Paths

**This project does NOT have `@` alias configured - use relative paths**

```typescript
// ✅ CORRECT
import { formatCurrency } from '../utils/formatters'
import { useBaseStore } from './baseStore'

// ❌ WRONG
import { formatCurrency } from '@/utils/formatters'
```

### API Integration

**API version prefix `/api/v1/` is automatically added by axios interceptors**

```typescript
// ✅ CORRECT - Use relative paths without /api/v1/
axios.get('/user-subscriptions/current')
axios.post('/terminals/start-session', data)

// ❌ WRONG - Don't include /api/v1/ prefix
axios.get('/api/v1/user-subscriptions/current')  // Double prefix!
```

See [API.md](.claude/docs/API.md) for backend integration and demo mode.

## Development Patterns

### Component Development

- Use generic `Entity.vue` for standard CRUD
- Use `BaseModal.vue` for all modals (never create custom modal wrappers)
- Use `EntityModal.vue` for entity forms (auto-renders from `fieldList`)
- Follow translation pattern: `{{ t('domainName.translationKey') }}`

### Store Creation

When creating new stores:

1. Extend `useBaseStore()`
2. Define `fieldList` using FieldBuilder
3. Add translations with `useStoreTranslations()`
4. Wrap async methods with AsyncWrapper (reduces boilerplate)

```typescript
import { asyncWrapper } from '../utils/asyncWrapper'

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

### Shared Utilities

- **Formatters**: `formatCurrency()`, `formatDate()`, `formatDateTime()`, etc.
- **Types**: Import from `/src/types/` (centralized type system)
- **FieldBuilder**: Fluent API for form field configurations

See [CODE_QUALITY.md](.claude/docs/CODE_QUALITY.md) for utilities.

## Authentication & Routing

- All protected routes require `meta: { requiresAuth: true }`
- JWT tokens automatically managed by axios interceptors
- `Layout.vue` wraps authenticated pages
- Routes can bypass layout with `meta.isIframe: true`

## Feature Flags

GitLab-style feature flag system for gradual rollouts:

- Backend database is primary source (via `/features` endpoint)
- Environment variable fallback: `VITE_FEATURE_FLAG_*`
- Real-time navigation filtering

See [BACKEND_FEATURE_FLAGS_INTEGRATION.md](.claude/docs/BACKEND_FEATURE_FLAGS_INTEGRATION.md) for initialization order and troubleshooting.

## Domain-Specific Features

### Subscription System

Multi-tier architecture with Stripe integration:

- Customer-facing: `/subscription-plans`, `/subscription-dashboard`
- Admin: `/admin/subscription-plans`
- Checkout flow: `/checkout/:planId`
- Portal access for subscription management

### Terminal Integration

Remote terminal access with XTerm.js + guacamole-common-js:

- Terminal sessions with sharing capabilities
- SSH key management
- Iframe-based terminal viewer (bypasses layout)

## Documentation Index

For detailed information, see:

- [COMPONENTS.md](.claude/docs/COMPONENTS.md) - Component architecture & patterns
- [STORES.md](.claude/docs/STORES.md) - Pinia store architecture
- [SERVICES.md](.claude/docs/SERVICES.md) - Service layer organization
- [I18N.md](.claude/docs/I18N.md) - Internationalization patterns
- [CSS.md](.claude/docs/CSS.md) - CSS architecture & variables
- [CODE_QUALITY.md](.claude/docs/CODE_QUALITY.md) - Error handling, types, utilities
- [API.md](.claude/docs/API.md) - API integration & demo mode
- [DESIGN_SYSTEM.md](.claude/docs/DESIGN_SYSTEM.md) - Design tokens & CSS framework
- [BACKEND_FEATURE_FLAGS_INTEGRATION.md](.claude/docs/BACKEND_FEATURE_FLAGS_INTEGRATION.md) - Feature flags system

**Groups System (Recent Implementation):**

- [GROUPS_QUICK_REFERENCE.md](.claude/docs/GROUPS_QUICK_REFERENCE.md) - Quick reference
- [GROUPS_ARCHITECTURE_DIAGRAM.md](.claude/docs/GROUPS_ARCHITECTURE_DIAGRAM.md) - Architecture
- [GROUPS_IMPLEMENTATION_PLAN.md](.claude/docs/GROUPS_IMPLEMENTATION_PLAN.md) - Implementation details
- [GROUP_DETAIL_SPECIFICATION.md](.claude/docs/GROUP_DETAIL_SPECIFICATION.md) - GroupDetails component spec
- [README_GROUPS_IMPLEMENTATION.md](.claude/docs/README_GROUPS_IMPLEMENTATION.md) - Complete implementation summary
