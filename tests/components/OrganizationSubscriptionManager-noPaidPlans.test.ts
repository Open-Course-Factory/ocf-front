/**
 * #297: the org plan modal offered paid plans it could not sell.
 *
 * Choosing one called `subscribeOrganization` and then immediately showed a
 * "plan changed" success toast — no Stripe redirect, nothing charged. ocf-core
 * recorded an `incomplete` subscription that could never activate, because
 * nothing creates a Stripe checkout carrying organization_id.
 *
 * Marc clicked twice (two orphaned rows, 13 seconds apart), then bought
 * Formateur personally — the only flow that works.
 *
 * ocf-core now refuses paid organization subscriptions outright (#450). The UI
 * must not offer what the API will reject: an org uses the plan of whoever is
 * working in it, and structures get theirs admin-assigned.
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

vi.mock('../../src/stores/organizationSubscriptions', () => ({
  useOrganizationSubscriptionsStore: () => ({
    error: null,
    loadOrganizationSubscription: vi.fn().mockResolvedValue(null),
    subscribeOrganization: vi.fn().mockResolvedValue(undefined),
    cancelOrganizationSubscription: vi.fn().mockResolvedValue(undefined),
  }),
}))

// The real catalog shape: two free, two paid.
const PLANS = [
  { id: 'p-trial', name: 'Trial', price_amount: 0, currency: 'eur', billing_interval: 'month', is_active: true },
  { id: 'p-solo', name: 'Solo', price_amount: 1200, currency: 'eur', billing_interval: 'month', is_active: true },
  { id: 'p-formateur', name: 'Formateur', price_amount: 1990, currency: 'eur', billing_interval: 'month', is_active: true },
  { id: 'p-ecole', name: 'École / OF (sur devis)', price_amount: 0, currency: 'eur', billing_interval: 'month', is_active: true },
]

vi.mock('../../src/stores/subscriptionPlans', () => ({
  useSubscriptionPlansStore: () => ({
    entities: PLANS,
    loadPlans: vi.fn().mockResolvedValue(undefined),
  }),
}))

import OrganizationSubscriptionManager from '../../src/components/Organizations/OrganizationSubscriptionManager.vue'

// Renders its default slot so the modal body is inspectable without driving the
// open/close state, which is not the behaviour under test.
const BaseModalStub = {
  name: 'BaseModal',
  template: '<div class="base-modal-stub"><slot /></div>',
}

async function mountManager() {
  setActivePinia(createPinia())
  const wrapper = mount(OrganizationSubscriptionManager, {
    props: { organizationId: 'org-1', canManage: true },
    global: {
      plugins: [createI18n({
        legacy: false, locale: 'en', fallbackLocale: 'en',
        messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false,
      })],
      stubs: { BaseModal: BaseModalStub, AdminBadge: true },
    },
  })
  await flushPromises()
  await wrapper.vm.$nextTick()
  return wrapper
}

describe('OrganizationSubscriptionManager — no self-service paid plans', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('offers only free plans, because ocf-core refuses paid org subscriptions', async () => {
    const wrapper = await mountManager()

    const names = wrapper.findAll('.plan-option h4').map(h => h.text())

    expect(names).toContain('Trial')
    expect(names).toContain('École / OF (sur devis)')
    expect(names).not.toContain('Solo')
    expect(names).not.toContain('Formateur')
  })

  it('explains where paid plans come from instead of silently hiding them', async () => {
    const wrapper = await mountManager()

    // A gate that just makes options vanish reads as a bug. It has to say why.
    const note = wrapper.find('[data-test="org-paid-plan-note"]')
    expect(note.exists()).toBe(true)
    expect(note.text().length).toBeGreaterThan(0)
  })
})
