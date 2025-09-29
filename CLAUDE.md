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
- Each store adds its translations to the global i18n instance
- Pattern: `useI18n().mergeLocaleMessage('en', { domainName: { key: 'value' } })`
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

**Backend Integration:**
- Compatible with OCF Core Payment API (Stripe-based subscription system)
- API endpoints follow REST conventions (e.g., `/subscriptions/current`, `/invoices/user`)
- Error handling with user-friendly messages via store error states

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