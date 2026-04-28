import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import EntityModal from '../../src/components/Modals/EntityModal.vue'

/**
 * Shared fixtures and helpers for EntityModal test files.
 *
 * NOTE: `vi.mock(...)` calls cannot live in this helper because Vitest
 * hoists them to the top of the file they appear in. Each EntityModal
 * test file must declare its own `vi.mock` block for axios, the i18n
 * module, the error service, and the translation composables.
 */

export function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false
  })
}

/** Factory for a mock entity store with a configurable fieldList. */
export function createMockStore(options: {
  fieldList?: Map<string, any>,
  entities?: any[],
  parentEntitiesStores?: Map<string, any>,
  subEntitiesStores?: Map<string, any>
} = {}) {
  return {
    fieldList: options.fieldList || new Map(),
    entities: options.entities || [],
    parentEntitiesStores: options.parentEntitiesStores || new Map(),
    subEntitiesStores: options.subEntitiesStores || new Map()
  }
}

/** Reusable fieldList covering the four common field types. */
export const basicFieldList = new Map<string, any>([
  ['name', {
    label: 'Name',
    type: 'input',
    display: true,
    toBeSet: true,
    toBeEdited: true,
    required: true
  }],
  ['description', {
    label: 'Description',
    type: 'textarea',
    display: true,
    toBeSet: true,
    toBeEdited: true,
    required: false
  }],
  ['status', {
    label: 'Status',
    type: 'select',
    display: true,
    toBeSet: true,
    toBeEdited: true,
    required: false,
    options: [
      { value: 'active', text: 'Active' },
      { value: 'inactive', text: 'Inactive' }
    ]
  }],
  ['is_active', {
    label: 'Active',
    type: 'checkbox',
    display: true,
    toBeSet: true,
    toBeEdited: true,
    required: false
  }]
])

/** Mounts EntityModal with sensible defaults; props can be overridden. */
export function mountEntityModal(props: Record<string, any> = {}) {
  const i18n = createTestI18n()
  setActivePinia(createPinia())

  const defaultStore = createMockStore({ fieldList: basicFieldList })

  return mount(EntityModal, {
    props: {
      visible: true,
      entityStore: defaultStore,
      entityName: 'TestEntity',
      ...props
    },
    global: {
      plugins: [i18n],
      stubs: {
        'v-autocomplete': true
      }
    }
  })
}
