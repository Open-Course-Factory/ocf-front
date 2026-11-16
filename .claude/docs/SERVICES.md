# Service Architecture

## Domain-Organized Structure

OCF Front uses a domain-driven service organization to improve discoverability, scalability, and code splitting:

```shell
src/services/
├── core/                  # Core infrastructure (framework-level)
│   ├── http/             # Axios configuration and interceptors
│   ├── error/            # Error handling utilities
│   └── storage/          # LocalStorage wrappers
├── auth/                 # Authentication & JWT tokens
├── features/             # Feature flags system
├── domain/               # Business domain services
│   ├── terminal/         # Terminal operations
│   ├── user/             # User operations
│   └── help/             # Help documentation
└── data/                 # Static data (countries, constants)
```

## Service Import Guidelines

```typescript
// ✅ CORRECT - Import from organized structure
import { setupAxiosInterceptors } from './services/core/http'
import { featureFlagService } from './services/features'
import { terminalService } from './services/domain/terminal'

// ❌ WRONG - Old flat structure (deprecated)
import { setupAxiosInterceptors } from './services/axiosInterceptor'
import { featureFlagService } from './services/featureFlags'
```

## Benefits

- **Clear Separation**: Infrastructure vs business logic
- **Better Discoverability**: Browse by domain instead of guessing filenames
- **Scalability**: Clear place for new services (e.g., `domain/payments/`)
