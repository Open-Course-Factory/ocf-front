/**
 * The platform-settings store.
 *
 * This is the admin surface for the settings modules register at startup. Most
 * rows are plain module toggles where `enabled` is the whole answer, but a few
 * carry configuration in `value` — the terminal launcher's hidden-distribution
 * list is one, and it is why this page exists.
 *
 * The contract worth pinning is which columns an administrator may edit.
 * `key` and `module` are seeded by the backend and read by name from Go code;
 * making them editable would let someone orphan a setting from the code reading
 * it while looking like a rename.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() }
    }
  }
}))

vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') }),
  useStoreTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') })
}))

vi.mock('../../src/services/demo', () => ({
  isDemoMode: vi.fn(() => false),
  logDemoAction: vi.fn(),
  simulateDelay: vi.fn()
}))

import { useFeaturesStore } from '../../src/stores/features'

/**
 * FieldConfig names its flags `display` / `toBeSet` / `toBeEdited`, which the
 * builder's .visible() / .creatable() / .updatable() set.
 */
function fields(): Record<string, any> {
  return Object.fromEntries(useFeaturesStore().fieldList as unknown as Map<string, any>)
}

describe('features store — the platform settings admin surface', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('lets an administrator edit the value that carries the configuration', () => {
    const value = fields()['value']
    expect(value, 'the value column must exist — it is what this page is for').toBeTruthy()
    expect(value.toBeEdited).toBe(true)
    expect(value.display).toBe(true)
  })

  it('lets an administrator flip a plain module toggle', () => {
    const enabled = fields()['enabled']
    expect(enabled.toBeEdited).toBe(true)
    expect(enabled.type).toBe('checkbox')
  })

  it('refuses to make the key editable', () => {
    // Go reads these by name (services.UnlistedDistributionsKey and friends).
    // An edit here would orphan the setting, not rename it.
    const key = fields()['key']
    expect(key.display).toBe(true)
    expect(key.toBeEdited).toBeFalsy()
    expect(key.toBeSet).toBeFalsy()
  })

  it('refuses to make the owning module editable', () => {
    const module = fields()['module']
    expect(module.display).toBe(true)
    expect(module.toBeEdited).toBeFalsy()
  })

  it('shows every column an administrator needs to tell settings apart', () => {
    const shown = Object.entries(fields())
      .filter(([, config]: [string, any]) => config.display)
      .map(([name]) => name)

    for (const column of ['key', 'name', 'description', 'enabled', 'value', 'category', 'module']) {
      expect(shown, `${column} should be listed`).toContain(column)
    }
  })

  it('withdraws create and delete, which are meaningless or harmful here', () => {
    // Settings are registered by modules at startup, so creating a row nothing
    // reads does nothing. Deleting one is worse: IsFeatureEnabled treats a
    // missing row as ENABLED, so removing a disabled setting turns the thing
    // back on, and the next boot re-seeds it at its code default. Production
    // has disabled settings today, so this is a live hazard, not a theoretical
    // one.
    const store: any = useFeaturesStore()
    expect(store.allowCreation).toBe(false)
    expect(store.allowDeletion).toBe(false)
  })
})