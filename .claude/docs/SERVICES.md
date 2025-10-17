# Service Architecture

## Domain-Organized Structure

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

## Service Import Guidelines

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

## Benefits

- **Clear Separation**: Infrastructure vs business logic vs demo code
- **Better Discoverability**: Browse by domain instead of guessing filenames
- **Code Splitting**: Demo services can be excluded from production bundles
- **Scalability**: Clear place for new services (e.g., `domain/payments/`)
