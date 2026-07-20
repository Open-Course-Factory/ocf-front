/**
 * Characterization tests for the two-step "Mirror to Stripe" flow on the admin
 * SubscriptionPlans page (!274 / #285).
 *
 * Mirror is destructive: it archives Stripe products that are missing locally.
 * The component protects the admin with a dry-run → confirm handshake:
 *
 *   startMirror()   -> mirrorPlansToStripe(true)  (dry run, no writes) then opens
 *                      the confirm dialog showing exactly what WOULD be archived.
 *   confirmMirror() -> mirrorPlansToStripe(false) (real archive) then refreshPlans().
 *   cancelMirror()  -> closes the dialog and makes NO further store call.
 *
 * The critical regression this file guards against is "clicked cancel, archived
 * anyway": cancelling must leave the destructive call count at exactly 1 (the
 * dry run). These are characterization tests — the component already works, so
 * they must pass as written.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'

// ---- Mocks (must be before component imports) ----

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}))

// Admin-view-mode composable → admin controls (the Stripe toolbar) are rendered.
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

// Store mocks defined via vi.hoisted so each test can drive / inspect them.
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

vi.mock('../../src/router/index.ts', () => ({
  default: { push: vi.fn() },
}))

vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showError: vi.fn(),
    showSuccess: vi.fn(),
  }),
}))

import SubscriptionPlans from '../../src/components/Pages/SubscriptionPlans.vue'

// Dry-run preview payload — what mirrorPlansToStripe(true) reports as archivable.
const DRY_RUN_PREVIEW = {
  success: true,
  synced_count: 0,
  skipped_count: 1,
  failed_count: 0,
  archived_count: 2,
  total_plans: 1,
  details: {
    synced: [],
    skipped: ['Pro (11111111-1111-1111-1111-111111111111)'],
    failed: [],
    price_migrated: [],
    archived: [
      'Legacy Plan (aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa)',
      'Old Tier (bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb)',
    ],
  },
}

// Real-run result payload — what mirrorPlansToStripe(false) returns.
const REAL_RUN_RESULT = {
  success: true,
  synced_count: 1,
  skipped_count: 0,
  failed_count: 0,
  archived_count: 1,
  total_plans: 1,
  details: {
    synced: ['Pro (11111111-1111-1111-1111-111111111111)'],
    skipped: [],
    failed: [],
    price_migrated: [],
    archived: ['Legacy Plan (aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa)'],
  },
}

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    // The component registers its own mirror strings via useTranslations().
    messages: { en: { ui: { availablePlans: 'Available plans' } }, fr: {} },
    missingWarn: false,
    fallbackWarn: false,
  })
}

/**
 * Mount SubscriptionPlans as an admin. Entity and the assign/config modals are
 * stubbed away; BaseModal gets a real stub that renders its default + footer
 * slots when `visible`, so the mirror confirm dialog and its buttons are
 * driveable.
 */
function mountAdmin() {
  setActivePinia(createPinia())
  return mount(SubscriptionPlans, {
    global: {
      plugins: [createTestI18n()],
      stubs: {
        Entity: { props: ['entityName', 'entityStore'], template: '<div class="entity-stub" />' },
        AdminAssignOrgPlanModal: true,
        AdminAssignPlanModal: true,
        PlanConfigModal: true,
        AdminBadge: true,
        BaseModal: {
          props: ['visible', 'title'],
          template: `
            <div v-if="visible" class="base-modal-stub">
              <div class="modal-body-stub"><slot /></div>
              <div class="modal-footer-stub"><slot name="footer" /></div>
            </div>
          `,
        },
      },
    },
  })
}

const toolbarMirrorButton = (wrapper: any) =>
  wrapper.find('.stripe-sync-buttons .btn-danger')
const modalConfirmButton = (wrapper: any) =>
  wrapper.find('.modal-footer-stub .btn-danger')
const modalCancelButton = (wrapper: any) =>
  wrapper.find('.modal-footer-stub .btn-secondary')

describe('SubscriptionPlans — Mirror to Stripe two-step flow', () => {
  beforeEach(() => {
    storeMocks.ensurePlansLoaded.mockReset().mockResolvedValue(undefined)
    storeMocks.refreshPlans.mockReset().mockResolvedValue(undefined)
    storeMocks.mirrorPlansToStripe.mockReset().mockResolvedValue(DRY_RUN_PREVIEW)
    storeMocks.entities.length = 0
  })

  it('startMirror runs a dry run and opens the confirm dialog listing what would be archived', async () => {
    const wrapper = mountAdmin()
    await flushPromises()

    await toolbarMirrorButton(wrapper).trigger('click')
    await flushPromises()

    // Dry run only — never a destructive call yet.
    expect(storeMocks.mirrorPlansToStripe).toHaveBeenCalledTimes(1)
    expect(storeMocks.mirrorPlansToStripe).toHaveBeenCalledWith(true)

    // Confirm dialog is open and shows the dry-run archived list.
    const modal = wrapper.find('.base-modal-stub')
    expect(modal.exists()).toBe(true)
    const archived = wrapper.find('.mirror-archived-list')
    expect(archived.exists()).toBe(true)
    expect(archived.text()).toContain('Legacy Plan (aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa)')
    expect(archived.text()).toContain('Old Tier (bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb)')
  })

  it('confirm runs the real mirror, refreshes the plan list, and closes the dialog', async () => {
    const wrapper = mountAdmin()
    await flushPromises()

    await toolbarMirrorButton(wrapper).trigger('click')
    await flushPromises()

    // Second call (the real archive) returns the real-run result.
    storeMocks.mirrorPlansToStripe.mockResolvedValueOnce(REAL_RUN_RESULT)

    await modalConfirmButton(wrapper).trigger('click')
    await flushPromises()

    // Exactly two calls: dry run (true) then real run (false).
    expect(storeMocks.mirrorPlansToStripe).toHaveBeenCalledTimes(2)
    expect(storeMocks.mirrorPlansToStripe.mock.calls).toEqual([[true], [false]])

    // Real run refreshes the list.
    expect(storeMocks.refreshPlans).toHaveBeenCalledTimes(1)

    // Dialog closed.
    expect(wrapper.find('.base-modal-stub').exists()).toBe(false)
  })

  it('cancel closes the dialog and makes NO further store call (no archive)', async () => {
    const wrapper = mountAdmin()
    await flushPromises()

    await toolbarMirrorButton(wrapper).trigger('click')
    await flushPromises()

    // Only the dry run has happened so far.
    expect(storeMocks.mirrorPlansToStripe).toHaveBeenCalledTimes(1)

    await modalCancelButton(wrapper).trigger('click')
    await flushPromises()

    // CRITICAL: cancelling must NOT trigger the real (false) archive call.
    expect(storeMocks.mirrorPlansToStripe).toHaveBeenCalledTimes(1)
    expect(storeMocks.mirrorPlansToStripe).not.toHaveBeenCalledWith(false)
    // And it must not have refreshed / mutated anything.
    expect(storeMocks.refreshPlans).not.toHaveBeenCalled()

    // Dialog closed.
    expect(wrapper.find('.base-modal-stub').exists()).toBe(false)
  })

  it('disables all three Stripe toolbar buttons while an operation is in flight', async () => {
    // Never resolve the dry run → isSyncing stays true.
    storeMocks.mirrorPlansToStripe.mockReset().mockReturnValue(new Promise(() => {}))

    const wrapper = mountAdmin()
    await flushPromises()

    const buttons = wrapper.findAll('.stripe-sync-buttons button')
    expect(buttons).toHaveLength(3)

    await toolbarMirrorButton(wrapper).trigger('click')
    await nextTick()

    for (const button of buttons) {
      expect(button.attributes('disabled')).toBeDefined()
    }
  })
})
