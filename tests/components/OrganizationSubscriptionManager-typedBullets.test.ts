/**
 * Pins that the org subscription view renders plan capabilities as friendly
 * typed-field bullets (via derivePlanBullets), NOT the raw plan.features[]
 * array — which post-projection is a read-only list of snake_case entitlement
 * keys that would otherwise leak onto the page.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}))

vi.mock('../../src/composables/useAdminViewMode', () => ({
  useAdminViewMode: () => ({ isAdmin: { value: false } }),
}))

vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({ showSuccess: vi.fn(), showError: vi.fn(), showConfirm: vi.fn() }),
}))

// A plan carrying a legacy features[] projection the view must NOT render raw.
const SUBSCRIPTION = {
  id: 'sub-1',
  status: 'active',
  subscription_plan: {
    id: 'plan-1',
    name: 'Team',
    max_cpu: 8000,
    max_memory_mb: 4096,
    max_session_duration_minutes: 240,
    network_access_enabled: true,
    data_persistence_enabled: true,
    data_persistence_gb: 10,
    session_supervision_enabled: true,
    // Read-only derived entitlement keys — must never be shown verbatim.
    features: ['group_management', 'network_access'],
  },
}

vi.mock('../../src/stores/organizationSubscriptions', () => ({
  useOrganizationSubscriptionsStore: () => ({
    error: null,
    loadOrganizationSubscription: vi.fn().mockResolvedValue(SUBSCRIPTION),
    subscribeOrganization: vi.fn().mockResolvedValue(undefined),
    cancelOrganizationSubscription: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock('../../src/stores/subscriptionPlans', () => ({
  useSubscriptionPlansStore: () => ({
    entities: [],
    loadPlans: vi.fn().mockResolvedValue(undefined),
  }),
}))

import OrganizationSubscriptionManager from '../../src/components/Organizations/OrganizationSubscriptionManager.vue'

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

async function mountManager() {
  setActivePinia(createPinia())
  const wrapper = mount(OrganizationSubscriptionManager, {
    props: { organizationId: 'org-1', canManage: true },
    global: {
      plugins: [createTestI18n()],
      stubs: { BaseModal: true, AdminBadge: true },
    },
  })
  await flushPromises()
  await wrapper.vm.$nextTick()
  return wrapper
}

describe('OrganizationSubscriptionManager — typed capability bullets', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders friendly typed bullets, not raw features[] snake_case keys', async () => {
    const wrapper = await mountManager()

    const bullets = wrapper.findAll('[data-test="plan-bullet"]')
    expect(bullets.length).toBeGreaterThan(0)

    const text = bullets.map(b => b.text()).join(' | ')
    // Typed capabilities surface as human-readable bullets.
    expect(text).toMatch(/supervis/i)
    expect(text).toMatch(/(GB|Go)/)

    // The raw derived entitlement keys must NOT leak onto the page.
    expect(wrapper.text()).not.toContain('group_management')
    expect(wrapper.text()).not.toContain('network_access')
  })
})
