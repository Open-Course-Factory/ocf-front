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

**Version Bumps:**

- Version must be updated in **both** `VERSION` and `package.json` — always update both files in the same commit
- Tag triggers the release pipeline, so everything must be correct before pushing the tag

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

### Admin Badge Pattern

**When a platform administrator sees UI elements that regular users don't, those elements MUST have a visual admin indicator.**

This helps admins distinguish elevated privileges from normal role-based access. See [ADMIN_BADGE_PATTERN.md](.claude/docs/ADMIN_BADGE_PATTERN.md) for the full reference.

Rules:
- Use `AdminBadge` component (from `components/Common/AdminBadge.vue`) next to admin-gated buttons, sections, or actions
- For `<option>` elements in `<select>` dropdowns: prefix with `🛡️` emoji (Vue components can't go inside `<option>`)
- The badge/emoji should ONLY appear when admin privilege is the REASON the element is visible -- not when the user would see it anyway as owner/manager
- Detect admin status via `useAdminViewMode()` composable -> `isAdmin` computed
- Condition pattern: `v-if="isAdmin && !isOwner"` (adapt ownership check to context)

Example:
```vue
<script setup>
import { useAdminViewMode } from '../../composables/useAdminViewMode'
import AdminBadge from '../Common/AdminBadge.vue'
const { isAdmin } = useAdminViewMode()
</script>

<template>
  <!-- Button only visible to owners/managers/admins -->
  <button v-if="canManage" @click="doSomething">
    Action
  </button>
  <!-- Badge shown only when admin is the reason -->
  <AdminBadge v-if="isAdmin && !isOwner" icon-only />

  <!-- Select option admin-only -->
  <option v-if="isAdmin" value="special">🛡️ Special Option</option>
</template>
```

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

#### Composed Session Architecture (added 2025)

Session creation was refactored from a simple instance-type picker to a multi-step "composed session" model. The old `InstanceTypeSelector.vue` and `InstanceCard.vue` components were removed.

**Key components:**

- `src/components/Terminal/SessionComposer.vue` — the primary new component. Handles distribution selection, size pills, and feature toggles in a single unified UI inside a `<fieldset>`. Fetches its own data on mount.
  - Props: `backendId?`, `organizationId?`, `disabled?`, `isAssignedSubscription?`
  - Exposed (via `defineExpose`): `isReady`, `selectedDistribution`, `selectedSize`, `enabledFeatures`, `loadingOptions`, `loadDistributions()`, `saveLastConfig()`
  - Persists last-used config to `localStorage` key `ocf-last-session-config` and auto-restores on next mount
  - Watches `organizationId` prop — re-fetches session options when org context changes (different plan)
  - Plan gating: locked sizes/features show a lock icon; `isAssignedSubscription=true` hides locked sizes entirely (learners can't upgrade); a "Unlock more power" CTA links to `/subscription-plans` for personal plans

- `src/components/Terminal/TerminalStarter.vue` — embeds `SessionComposer` via a template ref (`composerRef`). Reads `composerRef.isReady`, `composerRef.selectedDistribution`, `composerRef.selectedSize`, and `composerRef.enabledFeatures` to build the `StartComposedSessionData` payload. Passes `organization_id` to the composed session request.

- `src/components/Pages/ScenarioLauncher.vue` — org-scoped scenario browser. Lists available scenarios filtered by current org context (`organizationsStore.currentOrganization`). Handles launch, relaunch, and resume flows. Uses `ScenarioProvisioningOverlay` during provisioning with polling via `pollProvisioningStatus`.

- `src/components/Terminal/ScenarioProvisioningOverlay.vue` — full-screen provisioning progress overlay shown while a scenario environment is being prepared. Props: `ready?`, `phase?` (`'terminal_creation' | 'setup_script' | 'step_setup'`), `cancellable?`. Emits `cancel`. Used by both `ScenarioLauncher` and `TerminalSessionView`.

**New types in `src/types/terminal.ts`:**

- `Distribution` — `{ name, prefix, description, os_type?, is_global, min_size_key?, default_size_key?, supported_features? }`
- `SessionOptionSize` — per-size availability with `allowed` flag and `reason` string (`'plan_limit' | 'min_size' | 'plan_disabled' | 'not_supported' | 'size_too_small'`)
- `SessionOptionFeature` — per-feature availability with same `allowed` / `reason` shape
- `SessionOptionsResponse` — response from `GET /terminals/session-options` (`{ distribution, allowed_sizes, allowed_features }`)
- `StartComposedSessionData` — request body for `POST /terminals/start-composed-session` (`{ distribution, size, features, terms, name?, expiry?, backend?, organization_id?, hostname?, packages? }`)

**New service methods in `src/services/domain/terminal/terminalService.ts`:**

```typescript
getDistributions(backendId?: string): Promise<Distribution[]>
// GET /terminals/distributions?backend=<id>

getSessionOptions(distribution: string, backendId?: string, organizationId?: string): Promise<SessionOptionsResponse>
// GET /terminals/session-options?distribution=<name>&backend=<id>&organization_id=<id>

startComposedSession(data: StartComposedSessionData): Promise<{ session_id, console_url, expires_at, status }>
// POST /terminals/start-composed-session
```

**Org context rules:**
- `organization_id` is always passed to `getSessionOptions` so plan limits reflect the org's subscription, not the user's personal plan
- `organization_id` is included in `StartComposedSessionData` when the user has an active org context
- `isAssignedSubscription` is derived in `TerminalStarter` from `subscription_type === 'assigned' || !!subscription_batch_id`; when true, locked sizes are hidden from `SessionComposer` (learners can't choose unavailable sizes, unlike personal-plan users who see them grayed out with an upgrade link)

**Distribution icon mapping (in `SessionComposer`):**
Icons use FontAwesome 6 brand icons (`fab fa-ubuntu`, `fab fa-debian`, etc.) matched by substring of the distribution name. Brand colors (e.g., Ubuntu orange `#E95420`) are applied via inline `style`. Unknown distributions fall back to `fab fa-linux`. Dedicated (non-global) distributions show a server badge and a left blue border.

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
- [ADMIN_BADGE_PATTERN.md](.claude/docs/ADMIN_BADGE_PATTERN.md) - Admin badge UX pattern for elevated-privilege indicators

**Groups System (Recent Implementation):**

- [GROUPS_QUICK_REFERENCE.md](.claude/docs/GROUPS_QUICK_REFERENCE.md) - Quick reference
- [GROUPS_ARCHITECTURE_DIAGRAM.md](.claude/docs/GROUPS_ARCHITECTURE_DIAGRAM.md) - Architecture
- [GROUPS_IMPLEMENTATION_PLAN.md](.claude/docs/GROUPS_IMPLEMENTATION_PLAN.md) - Implementation details
- [GROUP_DETAIL_SPECIFICATION.md](.claude/docs/GROUP_DETAIL_SPECIFICATION.md) - GroupDetails component spec
- [README_GROUPS_IMPLEMENTATION.md](.claude/docs/README_GROUPS_IMPLEMENTATION.md) - Complete implementation summary
