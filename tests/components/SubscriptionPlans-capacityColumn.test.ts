/**
 * Tests for the Capacity row on the admin SubscriptionPlans list view.
 *
 * Contract (closes the gap reported during the first user test —
 * admins had to open each plan in edit mode to read its capacity):
 *   - For budget-mode plans (`quota_model === 'budget'`) with non-zero
 *     budget, the row renders a size-count summary like "1 XL OR 2 L OR 4 M"
 *     so the capacity is visible without opening the modal.
 *   - For budget-mode plans with max_cpu === 0 AND max_memory_mb === 0
 *     (unlimited), the row renders the "Unlimited capacity" string.
 *   - For count-mode plans, the row renders the legacy concurrent-terminals
 *     + allowed-sizes summary that the existing admin-facing fields already
 *     expose.
 *   - When neither budget nor count fields are populated, the capacity row
 *     is hidden entirely.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
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

// Stub the admin-view-mode composable so admin-only rendering is on.
vi.mock('../../src/composables/useAdminViewMode', () => ({
  useAdminViewMode: () => ({
    isAdmin: { value: true },
    shouldFilterAsStandardUser: { value: false },
    shouldShowAllData: { value: true },
  }),
}))

// Stub the subscriptions store — only currentSubscription / hasActiveSubscription
// are touched by SubscriptionPlans.
vi.mock('../../src/stores/subscriptions', () => ({
  useSubscriptionsStore: () => ({
    currentSubscription: null,
    hasActiveSubscription: () => false,
    getCurrentSubscription: vi.fn().mockResolvedValue(undefined),
    upgradePlan: vi.fn(),
  }),
}))

// Stub the plans store — provide formatPrice, entities, and ensurePlansLoaded
// so the page mounts without hitting the network.
const planEntities: any[] = []
vi.mock('../../src/stores/subscriptionPlans', () => ({
  useSubscriptionPlansStore: () => ({
    entities: planEntities,
    formatPrice: (amount: number, currency: string) => `${amount} ${currency}`,
    ensurePlansLoaded: vi.fn().mockResolvedValue(undefined),
    syncAndLoadPlans: vi.fn(),
    selectPlan: vi.fn(),
  }),
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

const messages = {
  en: {
    subscriptionPlans: {
      capacityLabel: 'Capacity',
      capacityOr: 'OR',
      capacityUnlimited: 'Unlimited capacity',
      concurrentTerminals: 'concurrent terminals',
      maxCourses: 'courses max',
      users: 'users',
      currentPlan: 'Current Plan',
      choosePlan: 'Choose Plan',
      upgrade: 'Upgrade',
      downgrade: 'Downgrade',
      freeTrialDays: 'free trial days',
      statusActive: 'Active',
      statusInactive: 'Inactive',
      catalogPlan: 'Catalog',
      unlistedPlan: 'Unlisted',
      catalogPlanDescription: 'Shown on the pricing page',
      unlistedPlanDescription: 'Custom plan, assigned by administrator',
      assignToOrg: 'Assign to Organization',
      assignToUser: 'Assign to User',
      assignOrgSuccess: 'Plan assigned to organization successfully',
      syncWithStripe: 'Sync with Stripe',
      syncing: 'Syncing...',
      syncDescription: 'Sync description',
      syncSuccess: 'Sync successful',
      syncTotalPlans: 'Total',
      syncSynced: 'Synced',
      syncSkipped: 'Skipped',
      syncFailed: 'Failed',
      syncSyncedPlans: 'Synced plans',
      syncSkippedPlans: 'Skipped plans',
      syncFailedPlans: 'Failed plans',
      syncErrorTitle: 'Sync error',
    },
    ui: { availablePlans: 'Available plans' },
  },
  fr: {
    subscriptionPlans: {
      capacityLabel: 'Capacité',
      capacityOr: 'OU',
      capacityUnlimited: 'Capacité illimitée',
      concurrentTerminals: 'terminaux simultanés',
    },
    ui: { availablePlans: 'Plans disponibles' },
  },
}

function createTestI18n(locale: 'en' | 'fr' = 'en') {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    messages,
    missingWarn: false,
    fallbackWarn: false,
  })
}

/**
 * Mount SubscriptionPlans with Entity.vue stubbed so the `#actions` slot is
 * invoked directly for each plan. This keeps the test focused on what the
 * admin sees per row, without needing to render the full generic CRUD table.
 */
function mountWithPlans(plans: any[]) {
  planEntities.length = 0
  planEntities.push(...plans)
  setActivePinia(createPinia())
  return mount(SubscriptionPlans, {
    global: {
      plugins: [createTestI18n()],
      stubs: {
        Entity: {
          props: ['entityName', 'entityStore'],
          template: `
            <div class="entity-stub">
              <div
                v-for="entity in entityStore.entities"
                :key="entity.id"
                class="entity-row"
                :data-entity-id="entity.id"
              >
                <slot name="actions" :entity="entity" />
              </div>
            </div>
          `,
        },
        AdminAssignOrgPlanModal: true,
        AdminAssignPlanModal: true,
        PlanConfigModal: true,
        AdminBadge: true,
      },
    },
  })
}

describe('SubscriptionPlans (admin list) — Capacity row', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the size-count summary for a budget-mode plan with non-zero budget', () => {
    const wrapper = mountWithPlans([
      {
        id: 'plan-1',
        name: 'Solo',
        price_amount: 1200,
        currency: 'eur',
        billing_interval: 'month',
        is_active: true,
        is_catalog: true,
        quota_model: 'budget',
        max_cpu: 8,
        max_memory_mb: 4096,
      },
    ])

    const capacity = wrapper.find('[data-test="plan-capacity"]')
    expect(capacity.exists()).toBe(true)
    expect(capacity.text()).toContain('Capacity')
    // Budget 8 cpu / 4096 MB fits exactly 1 XL OR 2 L OR 4 M.
    expect(capacity.text()).toContain('1 XL')
    expect(capacity.text()).toContain('2 L')
    expect(capacity.text()).toContain('4 M')
    expect(capacity.text()).toContain('OR')
  })

  it('renders the unlimited string when both max_cpu and max_memory_mb are 0', () => {
    const wrapper = mountWithPlans([
      {
        id: 'plan-2',
        name: 'Enterprise',
        price_amount: 0,
        currency: 'eur',
        billing_interval: 'month',
        is_active: true,
        is_catalog: false,
        quota_model: 'budget',
        max_cpu: 0,
        max_memory_mb: 0,
      },
    ])

    const capacity = wrapper.find('[data-test="plan-capacity"]')
    expect(capacity.exists()).toBe(true)
    expect(capacity.text()).toContain('Unlimited capacity')
  })

  it('renders the legacy concurrent-terminals + sizes summary for count-mode plans', () => {
    const wrapper = mountWithPlans([
      {
        id: 'plan-3',
        name: 'Starter (legacy)',
        price_amount: 500,
        currency: 'eur',
        billing_interval: 'month',
        is_active: true,
        is_catalog: true,
        quota_model: 'count',
        max_concurrent_terminals: 3,
        allowed_machine_sizes: ['S', 'M'],
      },
    ])

    const capacity = wrapper.find('[data-test="plan-capacity"]')
    expect(capacity.exists()).toBe(true)
    expect(capacity.text()).toContain('3')
    expect(capacity.text()).toContain('concurrent terminals')
    expect(capacity.text()).toContain('S')
    expect(capacity.text()).toContain('M')
    // Budget-mode "OR" joiner must not leak into count plans.
    expect(capacity.text()).not.toContain('Unlimited capacity')
  })

  it('hides the row entirely when neither budget nor count fields are populated', () => {
    const wrapper = mountWithPlans([
      {
        id: 'plan-4',
        name: 'Bare plan',
        price_amount: 0,
        currency: 'eur',
        billing_interval: 'month',
        is_active: true,
        is_catalog: false,
        // No quota_model, no max_concurrent_terminals, no allowed sizes.
      },
    ])

    expect(wrapper.find('[data-test="plan-capacity"]').exists()).toBe(false)
  })

  it('renders one capacity row per plan when the list contains a mix of plans', () => {
    const wrapper = mountWithPlans([
      {
        id: 'budget-plan',
        name: 'Budget',
        price_amount: 1200,
        currency: 'eur',
        billing_interval: 'month',
        is_active: true,
        is_catalog: true,
        quota_model: 'budget',
        max_cpu: 4,
        max_memory_mb: 2048,
      },
      {
        id: 'count-plan',
        name: 'Count',
        price_amount: 500,
        currency: 'eur',
        billing_interval: 'month',
        is_active: true,
        is_catalog: true,
        quota_model: 'count',
        max_concurrent_terminals: 2,
        allowed_machine_sizes: ['S'],
      },
    ])

    const capacities = wrapper.findAll('[data-test="plan-capacity"]')
    expect(capacities.length).toBe(2)
    // First row is the budget plan: 4 cpu / 2048 MB = 1 L max.
    expect(capacities[0].text()).toContain('1 L')
    // Second row is the count plan.
    expect(capacities[1].text()).toContain('concurrent terminals')
  })
})
