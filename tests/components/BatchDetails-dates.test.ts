/**
 * BatchDetails — the date a license was assigned is shown in the app language.
 */
import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: 'batch-1' }, query: {} }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))
vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: () => ({ t: (k: string) => k }),
}))
vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({ showSuccess: vi.fn(), showError: vi.fn(), showConfirm: vi.fn() }),
}))
vi.mock('../../src/services/domain/user', () => ({
  userService: { getUsersByIds: vi.fn().mockResolvedValue([]) },
}))
vi.mock('../../src/stores/subscriptionBatches', () => ({
  useSubscriptionBatchesStore: () => ({
    batches: [{
      id: 'batch-1',
      status: 'active',
      subscription_plan: { name: 'Solo' },
      total_quantity: 1,
      assigned_quantity: 0,
      available_quantity: 1,
    }],
    currentBatch: null,
    // Mid-morning UTC: the same calendar day in every zone from UTC-10 to UTC+13.
    currentBatchLicenses: [{ id: 'license-0001', status: 'unassigned', created_at: '2026-03-15T10:00:00Z' }],
    loadBatches: vi.fn(),
    loadBatch: vi.fn(),
    loadBatchLicenses: vi.fn(),
  }),
}))

import BatchDetails from '../../src/components/Pages/BatchDetails.vue'
import i18n from '../../src/i18n'

async function mountDetails(locale: 'en' | 'fr') {
  const pinia = createPinia()
  setActivePinia(pinia)
  i18n.global.locale.value = locale
  const wrapper = mount(BatchDetails, {
    global: { plugins: [i18n, pinia], stubs: { LicenseAssignmentModal: true } },
  })
  await flushPromises()
  return wrapper
}

describe('BatchDetails — license dates follow the app language', () => {
  it.each([
    ['en', '3/15/2026'],
    ['fr', '15/03/2026'],
  ] as const)('shows the date to a %s user as %s', async (locale, expected) => {
    const wrapper = await mountDetails(locale)

    expect(wrapper.find('.date-cell').text()).toBe(expected)
  })
})
