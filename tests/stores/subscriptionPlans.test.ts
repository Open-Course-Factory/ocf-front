import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Mocks MUST be defined BEFORE imports
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

vi.mock('../../src/services/core/error', () => ({
  handleStoreError: vi.fn((err: any, fallbackKey: string) => fallbackKey)
}))

vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') }),
  useStoreTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') })
}))

vi.mock('../../src/services/demo', () => ({
  isDemoMode: vi.fn(() => false),
  logDemoAction: vi.fn(),
  simulateDelay: vi.fn(),
  getDemoSubscriptionPlans: vi.fn(() => [])
}))

import { useSubscriptionPlansStore } from '../../src/stores/subscriptionPlans'

describe('subscriptionPlans store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('fieldList exposes the CPU/RAM budget for admin viewing', () => {
    it('includes max_cpu as a visible read-only field', () => {
      const store = useSubscriptionPlansStore()
      const field = store.fieldList.get('max_cpu')

      expect(field).toBeDefined()
      expect(field!.display).toBe(true)
      expect(field!.toBeSet).toBe(false)
      expect(field!.toBeEdited).toBe(false)
    })

    it('includes max_memory_mb as a visible read-only field', () => {
      const store = useSubscriptionPlansStore()
      const field = store.fieldList.get('max_memory_mb')

      expect(field).toBeDefined()
      expect(field!.display).toBe(true)
      expect(field!.toBeSet).toBe(false)
      expect(field!.toBeEdited).toBe(false)
    })

    it('formats max_cpu values (mCPU on wire) as vCPU floats', () => {
      const store = useSubscriptionPlansStore()
      const field = store.fieldList.get('max_cpu')

      expect(field!.displayValue).toBeTypeOf('function')
      // Backend stores integer millicores; UI shows vCPU (drops trailing .0).
      expect(field!.displayValue!(8000)).toBe('8 vCPU')
      expect(field!.displayValue!(500)).toBe('0.5 vCPU')
      expect(field!.displayValue!(2500)).toBe('2.5 vCPU')
    })

    it('formats max_memory_mb values with a GiB/MiB unit (never raw bytes)', () => {
      const store = useSubscriptionPlansStore()
      const field = store.fieldList.get('max_memory_mb')

      expect(field!.displayValue).toBeTypeOf('function')
      // Regression for the original bug: 4096 MiB used to render as "4.00 KB"
      // because EntityCard.formatStorageSize treated the number as bytes.
      expect(field!.displayValue!(4096)).toBe('4.0 GiB')
      expect(field!.displayValue!(16384)).toBe('16 GiB')
    })

    it('shows unlimited capacity for max_cpu = 0', () => {
      const store = useSubscriptionPlansStore()
      const field = store.fieldList.get('max_cpu')

      // The i18n mock returns the key itself; the production string is
      // "Unlimited capacity" / "Capacité illimitée".
      expect(field!.displayValue!(0)).toBe('subscriptionPlans.capacityUnlimited')
    })

    it('shows unlimited capacity for max_memory_mb = 0', () => {
      const store = useSubscriptionPlansStore()
      const field = store.fieldList.get('max_memory_mb')

      expect(field!.displayValue!(0)).toBe('subscriptionPlans.capacityUnlimited')
    })

    it('uses translated labels for created_at and updated_at (no raw key fallback)', () => {
      const store = useSubscriptionPlansStore()
      const createdAt = store.fieldList.get('created_at')
      const updatedAt = store.fieldList.get('updated_at')

      // Label should be the translation key, NOT the english fallback string
      // (proves t() is being called rather than passing the raw label "Created At")
      expect(createdAt!.label).toBe('subscriptionPlans.created_at')
      expect(updatedAt!.label).toBe('subscriptionPlans.updated_at')
    })
  })

  describe('i18n keys for budget fields exist in both en and fr', () => {
    // Smoke-test the source file directly so we can verify both locales
    // without coupling to the i18n mock.
    const storeSource = readFileSync(
      resolve(__dirname, '../../src/stores/subscriptionPlans.ts'),
      'utf-8'
    )

    it.each([
      'max_cpu',
      'max_memory_mb',
      'created_at',
      'updated_at'
    ])('declares key "%s" at least twice (en + fr)', (key) => {
      // Each i18n key should appear at least twice in the store source:
      // once in the en block, once in the fr block.
      const occurrences = storeSource.split(`${key}:`).length - 1
      expect(occurrences).toBeGreaterThanOrEqual(2)
    })
  })
})
