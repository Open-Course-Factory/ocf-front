# Open Course Factory - Front

Vue.js frontend application for [Open Course Factory](https://usine.solution-libre.fr/open-course-factory/) - a comprehensive course management and practical learning platform.

## 🚀 Features

- **Course Design & Management** - Complete course creation workflow with chapters, sections, and pages
- **Terminal/Lab Management** - Interactive terminal sessions with sharing capabilities
- **Subscription System** - Stripe-integrated billing and subscription management
- **Multi-language Support** - French and English with embedded translations
- **Demo Mode** - Safe testing environment with mock data
- **Feature Flags** - GitLab-style feature toggling for gradual rollouts

## 🛠 Tech Stack

- **Vue 3** with Composition API and TypeScript
- **Pinia** for state management with persistence
- **Vue Router 4** with authentication guards
- **Vue i18n** for internationalization
- **Vite** as build tool and dev server
- **Element Plus** and **Vuetify** for UI components
- **Axios** with custom interceptors

## 📦 Development Setup

```bash
# Install dependencies
npm install

# Start development server (http://localhost:4000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏁 Environment Configuration

Copy `.env.example` to `.env.local` and configure:

```bash
# API Configuration
VITE_API_URL=localhost:8000
VITE_PROTOCOL=http

# Demo Mode
VITE_DEMO_MODE=false

# Feature Flags (see Feature Flags section)
VITE_FEATURE_FLAG_COURSE_CONCEPTION=true
VITE_FEATURE_FLAG_TERMINAL_MANAGEMENT=true
# ... other flags
```

## 🎛 Feature Flags

OCF Front includes a GitLab-style feature flags system for safe feature deployment and A/B testing.

### Available Flags

| Flag | Controls | Impact Level | Default |
|------|----------|--------------|---------|
| `VITE_FEATURE_FLAG_COURSE_CONCEPTION` | Entire Course Design section | HIGH | `true` |
| `VITE_FEATURE_FLAG_TERMINAL_MANAGEMENT` | Entire Practical Work section | HIGH | `true` |
| `VITE_FEATURE_FLAG_HELP_DOCUMENTATION` | Entire Help section | LOW | `true` |
| `VITE_FEATURE_FLAG_THEME_CUSTOMIZATION` | Themes menu item | LOW | `true` |
| `VITE_FEATURE_FLAG_ARCHIVE_GENERATIONS` | Generations menu item | LOW | `true` |
| `VITE_FEATURE_FLAG_SSH_KEY_MANAGEMENT` | SSH Keys menu item | LOW | `true` |

### Usage

**Environment Variables:**

```bash
# Disable course management features
VITE_FEATURE_FLAG_COURSE_CONCEPTION=false

# Disable terminal/lab functionality
VITE_FEATURE_FLAG_TERMINAL_MANAGEMENT=false
```

**Admin Interface:**

- Access via `/debug/feature-flags` or **Administration → Feature Flags**
- Real-time toggling with instant navigation updates
- Admin-only access with role-based restrictions

**In Code:**

```typescript
import { useFeatureFlags } from '@/composables/useFeatureFlags'

const { isEnabled } = useFeatureFlags()
if (isEnabled('course_conception')) {
  // Feature-specific code
}
```

### Use Cases

- **Gradual Rollout**: Deploy features hidden, enable per environment
- **A/B Testing**: Different feature sets for user groups
- **Emergency Disable**: Instantly turn off problematic features
- **Maintenance Mode**: Disable non-essential features during maintenance

## 🎨 Architecture Highlights

### Store Pattern (Pinia)

- **BaseStore**: Generic CRUD operations with hooks
- **Entity Stores**: Domain-specific stores extending BaseStore
- **Embedded Translations**: I18n translations within stores
- **Demo Integration**: Automatic API/mock switching

### Component System

- **Generic Entity Component**: Automatic CRUD interfaces
- **Dynamic Field Rendering**: Based on store configurations
- **Layout System**: Authenticated vs public layouts
- **Feature Flag Integration**: Automatic navigation filtering

### Security & Authentication

- **JWT Token Management**: Automatic token handling
- **Route Protection**: Authentication guards
- **Role-based Access**: Feature restrictions by user role
- **Token Expiry Monitoring**: Automatic logout on expiry

## 🐳 Demo Mode

Enable demo mode for safe development without backend dependencies:

```bash
VITE_DEMO_MODE=true
```

Features:

- Mock API responses with realistic data
- Simulated Stripe payment flows
- Network delay simulation
- Safe testing environment

## 📚 Documentation

All development documentation is located in `.claude/docs/`:

- **[.claude/docs/CLAUDE.md](.claude/docs/CLAUDE.md)** - Comprehensive development guide for Claude Code
- **[.claude/docs/DESIGN_SYSTEM.md](.claude/docs/DESIGN_SYSTEM.md)** - Complete design system documentation with tokens, components, and migration guide
- **FEATURE_FLAGS.md** - Detailed feature flags documentation
- **Component Documentation** - Inline documentation in components

## 🔧 Development Workflow

1. **Feature Development**: Use feature flags to develop features safely
2. **Testing**: Enable demo mode for backend-independent testing
3. **Deployment**: Deploy with flags disabled, enable gradually
4. **Monitoring**: Use admin panel for real-time flag management

## 🌐 Multi-language Support

- **Default**: French with English fallback
- **Translation Pattern**: Embedded in stores via `useI18n().mergeLocaleMessage()`
- **Automatic Detection**: User language preferences
- **Dynamic Loading**: Translations loaded with stores

## 📱 Responsive Design

- **Mobile-first**: Responsive layouts for all screen sizes
- **Terminal Integration**: XTerm.js with guacamole-common-js
- **Modern UI**: Element Plus and Vuetify components
- **Accessibility**: ARIA compliance and keyboard navigation

## License

- OCF - Front is licensed under the AGPL v3.0. You can read the full license [here](LICENSE)
- OCF - Front uses [guac-vue](https://github.com/wwt/guac-vue) licensed under the Apache-2.0 licence.
