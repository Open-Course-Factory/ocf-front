# Component Architecture

## Generic Entity Component

- `Entity.vue` provides CRUD interface for any entity store
- Uses dynamic field rendering based on store's `fieldList` configuration
- Integrates with routing for entity-specific pages

## Specialized Components

- Domain-specific components override generic behavior when needed
- Example: `SubscriptionPlansCustomer.vue` provides customer-facing UI while `SubscriptionPlans.vue` provides admin CRUD

## BaseModal Component

OCF Front uses a centralized modal system to ensure consistency and reduce duplication:

- `BaseModal.vue` (367 lines) - Foundation modal with 18 configurable props and 3 slots
- **18 Props**: `visible`, `title`, `titleIcon`, `size`, `isLoading`, `showClose`, `showDefaultFooter`, `confirmText`, `confirmIcon`, `confirmDisabled`, `cancelText`, `allowOutsideClose`, `noPadding`, `maxHeight`, `fullHeight`, `zIndex`, `trapFocus`, `showOverlay`
- **3 Slots**: `header` (custom title), `default` (content), `footer` (custom buttons)
- **4 Size Variants**: small (400px), medium (600px), large (800px), xlarge (1200px)
- **CSS Safety**: All classes use `base-modal-` prefix to avoid global conflicts

### Usage Pattern - BaseModal

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

### Guidelines

- ✅ **Always use BaseModal** for new modals instead of creating custom modal wrappers
- ✅ **Use `base-modal-` CSS prefix** if you need to override styles (scoped CSS)
- ✅ **Leverage slots** for complex header/footer requirements
- ✅ **Use size variants** instead of custom width styles
- ❌ **Never create new modal base components** - extend BaseModal instead
- ❌ **Never use generic class names** like `.modal-content` (causes conflicts)

## EntityModal Component

OCF Front provides a generic CRUD modal that dynamically renders forms based on store field configurations:

- `EntityModal.vue` - Generic create/edit modal for all entities
- Automatically renders fields based on `store.fieldList` configuration
- **Supported Field Types**: `input`, `textarea`, `advanced-textarea`, `select`, `number`, `date`, `checkbox`, `subentity`
- Automatic validation (required fields, min/max for numbers, uniqueness checks)
- Bilingual error messages (French/English)

### Supported Field Types

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

### Usage Pattern - EntityModal

```vue
<template>
  <EntityModal
    :visible="showModal"
    :entity="selectedEntity"
    :entity-store="myEntityStore"
    entity-name="my-entities"
    @submit="handleCreate"
    @modify="handleUpdate"
    @close="showModal.value = false"
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

### Field Configuration Examples

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

### Validation Rules

- **Required Fields**: Shows "{field} is required" error if empty
- **Number Constraints**:
  - `min`: "Value must be at least {min}"
  - `max`: "Value must be at most {max}"
  - Invalid number: "Please enter a valid number"
- **Uniqueness**: Checks `name` field against existing entities (optional)
- **Checkbox**: Never considered empty (boolean value)

### Guidelines

- ✅ **Always use EntityModal** for entity CRUD operations
- ✅ **Define fieldList** with proper types in your entity store
- ✅ **Use field visibility flags** (`.creatable()`, `.editable()`, `.hidden()`)
- ✅ **Add validation constraints** (`.required()`, `.withMin()`, `.withMax()`)
- ✅ **Leverage existing field types** - don't create custom form components
- ❌ **Never create custom entity forms** - extend EntityModal if needed
- ❌ **Never hardcode form validation** - use fieldBuilder constraints

## SettingsPageWrapper Pattern

OCF Front uses a dynamic component loader for settings pages to eliminate duplication:

- `SettingsPageWrapper.vue` (43 lines) - Generic wrapper with `defineAsyncComponent()`
- Replaces 6 duplicate wrapper files with a single reusable component
- Uses router props to specify which settings component to load

### Usage Pattern - Settings Routes

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

### Available Settings Components

- `NavigationSettings` - Navigation preferences
- `LocalizationSettings` - Language and locale
- `UISettings` - Theme and appearance
- `NotificationSettings` - Notification preferences
- `SecuritySettings` - Password and security
- `SSHKeysSettings` - SSH key management

### Guidelines

- ✅ **Use SettingsPageWrapper** for all settings routes
- ✅ **Pass `componentName` prop** matching the component map in SettingsPageWrapper.vue
- ✅ **Add new settings** to the `componentMap` in SettingsPageWrapper.vue
- ❌ **Never create new settings page wrappers** - use the generic wrapper

## Layout System

- `Layout.vue` wraps authenticated pages with navigation
- Routes can bypass layout with `meta.isIframe: true` (e.g., terminal viewer)
- Authentication guard in router checks `currentUser.isAuthenticated`
