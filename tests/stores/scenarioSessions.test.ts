/**
 * The admin scenario-sessions store.
 *
 * Sessions are created by starting a scenario, never from the admin page: the
 * backend no longer mounts a bare POST /scenario-sessions. Entity.vue gates
 * both Add and Import on `allowCreation`, so the store must turn it off.
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

import { useScenarioSessionsStore } from '../../src/stores/scenarioSessions'

describe('scenarioSessions store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('does not allow creation, which hides Add and Import on the admin page', () => {
    const store: any = useScenarioSessionsStore()
    expect(store.allowCreation).toBe(false)
  })
})
