import { describe, it, expect, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: { request: { use: vi.fn(), eject: vi.fn() }, response: { use: vi.fn(), eject: vi.fn() } }
  }
}))

vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: () => ({ t: (key: string) => key, te: () => true, locale: { value: 'en' } }),
  useStoreTranslations: () => ({ t: (key: string) => key, te: () => true, locale: { value: 'en' } })
}))

import { useUsageMetricsStore } from '../../src/stores/usageMetrics'

describe('usageMetrics store - figures and periods for an English user in Auckland', () => {
  it('formats counts in English and the period on the saved zone\'s calendar', () => {
    const pinia = createPinia()
    pinia.state.value.UserSettings = { settings: { timezone: 'Pacific/Auckland' } }
    setActivePinia(pinia)
    const store = useUsageMetricsStore()

    expect(store.formatValue(1234567, 'api_calls')).toBe('1,234,567')
    // 11:30 UTC is already the next day in Auckland (UTC+13).
    expect(store.formatPeriod('2026-03-15T11:30:00Z', '2026-04-14T10:00:00Z')).toBe('16/03/2026 - 14/04/2026')
  })
})
