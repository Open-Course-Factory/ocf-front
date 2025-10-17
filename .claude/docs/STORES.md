# Store Architecture (Pinia)

## BaseStore Pattern

All entity stores extend `useBaseStore()` which provides:

- Generic CRUD operations (`create`, `update`, `delete`, `getOne`)
- Loading states (`isLoading`, `error`, `lastLoaded`)
- Hook system for entity-specific actions (`afterCreate`, `beforeCreate`, `afterUpdate`, `afterDelete`)
- Demo mode integration with API/mock switching
- Automatic data loading with `loadEntities()` and `ensureLoaded()`

## Entity Stores

Each domain has a dedicated store (e.g., `subscriptionPlans`, `subscriptions`, `invoices`, `usageMetrics`) that:

- Extends baseStore functionality
- Defines field configurations for forms (`fieldList` Map)
- Includes domain-specific translations via `useStoreTranslations()`
- Implements custom business logic and utility methods

## Translation Management

- Translations are embedded directly in stores, not separate files
- Each store adds its translations to the global i18n instance using the `useStoreTranslations()` composable
- Pattern: `const { t } = useStoreTranslations({ en: {...}, fr: {...} })`
- Cleaner syntax that combines both languages in a single call
- Supports both English and French translations

## Store Creation Pattern

When creating new entity stores, extend baseStore and define:

- `fieldList` Map with field configurations using FieldBuilder
- Translation messages for both languages using `useStoreTranslations()`
- Domain-specific utility methods wrapped with AsyncWrapper
- Hook implementations for custom business logic

### Example

```typescript
import { defineStore } from "pinia"
import { useStoreTranslations } from '../composables/useTranslations'
import { useBaseStore } from "./baseStore"
import { field, buildFieldList } from '../utils/fieldBuilder'

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

  const fieldList = buildFieldList([
    field('name', t('myStore.name'))
      .input()
      .visible()
      .creatable()
      .editable()
      .required()
  ])

  // ... rest of store implementation
})
```
