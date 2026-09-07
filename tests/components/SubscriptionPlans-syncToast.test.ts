/**
 * The Stripe sync result used to be a panel only: an admin who had scrolled
 * away, or a screen reader, missed the outcome of an operation that just
 * wrote to Stripe (#287). The outcome is now also announced: a toast on
 * completion or failure, and the panel is a polite live region.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}))

vi.mock('../../src/composables/useAdminViewMode', () => ({
  useAdminViewMode: () => ({
    isAdmin: { value: true },
    shouldFilterAsStandardUser: { value: false },
    shouldShowAllData: { value: true },
  }),
}))

vi.mock('../../src/stores/subscriptions', () => ({
  useSubscriptionsStore: () => ({
    currentSubscription: null,
    hasActiveSubscription: () => false,
    getCurrentSubscription: vi.fn().mockResolvedValue(undefined),
    upgradePlan: vi.fn(),
  }),
}))

const storeMocks = vi.hoisted(() => ({
  entities: [] as any[],
  formatPrice: (amount: number, currency: string) => `${amount} ${currency}`,
  ensurePlansLoaded: vi.fn(),
  refreshPlans: vi.fn(),
  syncAndLoadPlans: vi.fn(),
  mirrorPlansToStripe: vi.fn(),
  importPlansFromStripe: vi.fn(),
  selectPlan: vi.fn(),
}))
vi.mock('../../src/stores/subscriptionPlans', () => ({
  useSubscriptionPlansStore: () => storeMocks,
}))

vi.mock('../../src/router/index.ts', () => ({ default: { push: vi.fn() } }))

const notification = vi.hoisted(() => ({ showError: vi.fn(), showSuccess: vi.fn() }))
vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => notification,
}))

import SubscriptionPlans from '../../src/components/Pages/SubscriptionPlans.vue'

const SYNC_RESULT = {
  success: true, synced_count: 1, skipped_count: 0, failed_count: 0, total_plans: 1,
  details: { synced: ['Pro (1)'], skipped: [], failed: [], price_migrated: [], archived: [] },
}

function mountAdmin() {
  setActivePinia(createPinia())
  return mount(SubscriptionPlans, {
    global: {
      plugins: [createI18n({ legacy: false, locale: 'en', fallbackLocale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })],
      stubs: {
        Entity: { props: ['entityName', 'entityStore'], template: '<div class="entity-stub" />' },
        AdminAssignOrgPlanModal: true, AdminAssignPlanModal: true, PlanConfigModal: true, AdminBadge: true, BaseModal: true,
      },
    },
  })
}

const syncButton = (wrapper: any) => wrapper.find('.stripe-sync-buttons .btn-primary')

describe('SubscriptionPlans — the Stripe sync outcome is announced', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    storeMocks.ensurePlansLoaded.mockResolvedValue(undefined)
    storeMocks.entities.length = 0
  })

  it('toasts the completion and exposes the panel as a live region', async () => {
    storeMocks.syncAndLoadPlans.mockResolvedValue(SYNC_RESULT)
    const wrapper = mountAdmin()
    await flushPromises()

    await syncButton(wrapper).trigger('click')
    await flushPromises()

    expect(notification.showSuccess).toHaveBeenCalledWith('Sync complete')
    expect(notification.showError).not.toHaveBeenCalled()
    const panel = wrapper.find('.sync-results')
    expect(panel.attributes('role')).toBe('status')
    expect(panel.attributes('aria-live')).toBe('polite')
  })

  it('toasts the failure with the backend message', async () => {
    storeMocks.syncAndLoadPlans.mockRejectedValue({ response: { data: { error_message: 'Stripe key revoked' } } })
    const wrapper = mountAdmin()
    await flushPromises()

    await syncButton(wrapper).trigger('click')
    await flushPromises()

    expect(notification.showError).toHaveBeenCalledWith('Stripe key revoked')
    expect(notification.showSuccess).not.toHaveBeenCalled()
    expect(wrapper.find('.sync-results').text()).toContain('Stripe key revoked')
  })
})
