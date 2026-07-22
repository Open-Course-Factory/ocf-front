/**
 * RED tests for the typed-field pricing display on SubscriptionPlansCustomer.
 *
 * features[]-strings removal campaign (front phase). The customer pricing page
 * must stop rendering plan.features[] free-text strings and instead:
 *   (a) render GENERATED bullets derived from typed fields (grid view),
 *   (c) surface session supervision (the marketing gap being closed),
 *   (b) drive the compare table off FIXED typed capability rows (no more
 *       union-of-features[] rows),
 *   (d) drop the planned_features "Coming Soon" block entirely.
 *
 * The page uses the REAL usePlanFormatters composable, so these also exercise
 * derivePlanBullets end-to-end (see tests/composables/usePlanFormatters.test.ts
 * for the unit-level contract).
 *
 * Pinned DOM seams (contract for the dev):
 *   - grid generated bullets:      [data-test="plan-bullet"]
 *   - compare supervision row:     [data-test="compare-row-supervision"]
 *   - compare command-history row: [data-test="compare-row-history"]
 *
 * EXPECTED STATE against current code:
 *   (a) empty features[] plan renders NO generated bullets           → RED
 *       raw features[] strings ("API access") still rendered          → RED
 *   (c) no supervision indicator anywhere                             → RED
 *   (b) compare table renders a per-features[] "API access" row       → RED (we assert its absence)
 *       no supervision / history typed rows                           → RED
 *   (d) planned_features block still renders                          → RED (we assert its absence)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'

// ---- Mocks (must be declared before component imports) ----

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

vi.mock('../../src/composables/useAdminViewMode', () => ({
  useAdminViewMode: () => ({
    isAdmin: { value: false },
    shouldFilterAsStandardUser: { value: true },
    shouldShowAllData: { value: false },
  }),
}))

const { subState, userState, routerPush, showError, showSuccess, showConfirm } =
  vi.hoisted(() => ({
    subState: { current: null as any, hasActive: false, error: null as string | null },
    userState: { emailVerified: true },
    routerPush: vi.fn(),
    showError: vi.fn(),
    showSuccess: vi.fn(),
    showConfirm: vi.fn().mockResolvedValue(true),
  }))

vi.mock('../../src/stores/subscriptions', () => ({
  useSubscriptionsStore: () => ({
    get currentSubscription() {
      return subState.current
    },
    get allSubscriptions() {
      return subState.current ? [subState.current] : []
    },
    get error() {
      return subState.error
    },
    hasActiveSubscription: () => subState.hasActive,
    getCurrentSubscription: vi.fn().mockResolvedValue(undefined),
    getAllSubscriptions: vi.fn().mockResolvedValue(undefined),
    createCheckoutSession: vi.fn().mockResolvedValue({ url: 'https://stripe.test/session' }),
    upgradePlan: vi.fn().mockResolvedValue(undefined),
    cancelSubscription: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: () => ({
    get emailVerified() {
      return userState.emailVerified
    },
  }),
}))

const planEntities: any[] = []
vi.mock('../../src/stores/subscriptionPlans', () => ({
  useSubscriptionPlansStore: () => ({
    entities: planEntities,
    isLoading: false,
    error: null,
    formatPrice: (amount: number, currency: string) => `${amount} ${currency}`,
    canViewPlan: () => true,
    ensurePlansLoaded: vi.fn().mockResolvedValue(undefined),
    selectPlan: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock('../../src/router/index', () => ({ default: { push: routerPush } }))
vi.mock('../../src/router/index.ts', () => ({ default: { push: routerPush } }))

vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({ showError, showSuccess, showConfirm }),
}))

import SubscriptionPlansCustomer from '../../src/components/Pages/SubscriptionPlansCustomer.vue'

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false,
  })
}

function mountPage(plans: any[]) {
  planEntities.length = 0
  planEntities.push(...plans)
  setActivePinia(createPinia())
  return mount(SubscriptionPlansCustomer, {
    global: {
      plugins: [createTestI18n()],
      stubs: {
        AdminBadge: true,
        BaseModal: true,
        'router-link': {
          props: ['to'],
          template: '<a class="router-link-stub"><slot /></a>',
        },
      },
    },
  })
}

async function flushPromises() {
  await new Promise(resolve => setTimeout(resolve, 0))
}

// A typed-fields plan carrying a legacy features[] the page must now ignore.
const TYPED_PLAN = {
  id: 'plan-solo',
  name: 'Solo',
  price_amount: 1200,
  currency: 'eur',
  billing_interval: 'month',
  is_active: true,
  priority: 10,
  max_cpu: 8000,
  max_memory_mb: 4096,
  max_session_duration_minutes: 240,
  network_access_enabled: true,
  data_persistence_enabled: true,
  data_persistence_gb: 1,
  command_history_retention_days: 30,
  session_supervision_enabled: true,
  // Legacy free-text strings — MUST NOT be rendered anymore.
  features: ['api_access', 'custom_themes'],
}

async function mountReady(plans: any[]) {
  const wrapper = mountPage(plans)
  await flushPromises()
  await wrapper.vm.$nextTick()
  return wrapper
}

describe('SubscriptionPlansCustomer — generated bullets (grid)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    subState.current = null
    subState.hasActive = false
    subState.error = null
    userState.emailVerified = true
  })

  it('renders generated bullets for a typed-fields plan with an EMPTY features[]', async () => {
    const wrapper = await mountReady([{ ...TYPED_PLAN, features: [] }])

    const cardBullets = wrapper.findAll('[data-test="plan-bullet"]')
    expect(cardBullets.length).toBeGreaterThan(0)

    const text = cardBullets.map(b => b.text()).join(' | ')
    // Typed capabilities surface as generated bullets.
    expect(text).toMatch(/supervis/i)
    expect(text).toMatch(/(GB|Go)/)
  })

  it('surfaces session supervision in the grid (marketing gap closed)', async () => {
    const wrapper = await mountReady([{ ...TYPED_PLAN, features: [] }])
    expect(wrapper.text()).toMatch(/supervis/i)
  })

  it('does NOT render raw features[] strings — only generated bullets', async () => {
    // Legacy free-text capability strings must no longer leak onto the page.
    const wrapper = await mountReady([TYPED_PLAN])
    expect(wrapper.text()).not.toContain('API access')
    expect(wrapper.text()).not.toContain('Custom themes')
  })

  it('drops the planned_features "Coming Soon" block even when the payload carries it', async () => {
    const wrapper = await mountReady([
      { ...TYPED_PLAN, features: [], planned_features: ['Shiny future thing'] },
    ])
    expect(wrapper.find('.planned-features-section').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Shiny future thing')
  })
})

describe('SubscriptionPlansCustomer — compare table (typed rows)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    subState.current = null
    subState.hasActive = false
    subState.error = null
    userState.emailVerified = true
  })

  async function mountTable(plans: any[]) {
    const wrapper = await mountReady(plans)
    // Flip to the comparison table via the second view-toggle button.
    const toggles = wrapper.findAll('.btn-toggle')
    await toggles[1].trigger('click')
    await wrapper.vm.$nextTick()
    return wrapper
  }

  const SUPERVISED = { ...TYPED_PLAN, id: 'p-sup', name: 'Supervised', session_supervision_enabled: true, features: [] }
  const PLAIN = {
    ...TYPED_PLAN,
    id: 'p-plain',
    name: 'Plain',
    session_supervision_enabled: false,
    command_history_retention_days: 0,
    features: [],
  }

  it('renders a fixed session-supervision row with per-plan check/cross', async () => {
    const wrapper = await mountTable([SUPERVISED, PLAIN])

    const row = wrapper.find('[data-test="compare-row-supervision"]')
    expect(row.exists()).toBe(true)
    // One supervised plan (check) + one plain plan (cross).
    expect(row.findAll('.table-check').length).toBe(1)
    expect(row.findAll('.table-cross').length).toBe(1)
  })

  it('renders a fixed command-history row driven by the typed field', async () => {
    const wrapper = await mountTable([SUPERVISED, PLAIN])

    const row = wrapper.find('[data-test="compare-row-history"]')
    expect(row.exists()).toBe(true)
    // Supervised plan retains history (30 days > 0) → check; Plain (0) → cross.
    expect(row.findAll('.table-check').length).toBe(1)
    expect(row.findAll('.table-cross').length).toBe(1)
  })

  it('no longer renders union-of-features[] rows', async () => {
    // A plan carrying a legacy features[] must not spawn a per-string table row.
    const wrapper = await mountTable([
      { ...TYPED_PLAN, id: 'p-legacy', name: 'Legacy', features: ['api_access'] },
    ])
    expect(wrapper.text()).not.toContain('API access')
  })
})
