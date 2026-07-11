/**
 * Characterization pins for AdminAssignPlanModal's plan-<select> behavior.
 *
 * This is the representative modal for the plan-select dedupe (#268, I4):
 * AdminAssignPlanModal, AdminOrgPlanModal and AdminAssignOrgPlanModal all
 * duplicate the same select markup + activePlans / selectedPlanName computeds +
 * confirm-summary block, which the batch extracts into a shared <PlanSelect>.
 * (PlanConfigModal is NOT part of this dedupe — it has no plan-<select>.)
 *
 * These pins fix the behavior <PlanSelect> must preserve for this modal:
 *   - options are rendered from ACTIVE plans only (inactive excluded),
 *     labelled "Name - price/interval"
 *   - opening with no planId preselects the first active plan
 *   - the confirm-summary shows the selected plan's label
 *
 * Assertions target rendered DOM and the confirm summary — no spy-call checks.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: (messages: any) => {
    const flat: Record<string, string> = {}
    function flatten(obj: any, prefix: string) {
      for (const key of Object.keys(obj || {})) {
        const val = obj[key]
        const path = prefix ? `${prefix}.${key}` : key
        if (typeof val === 'string') flat[path] = val
        else if (val && typeof val === 'object') flatten(val, path)
      }
    }
    if (messages?.en) flatten(messages.en, '')
    return { t: (key: string) => flat[key] || key, te: () => true, locale: { value: 'en' } }
  },
}))

const activePlanA = {
  id: 'plan-a',
  name: 'Plan A',
  price_amount: 1200,
  currency: 'EUR',
  billing_interval: 'month',
  is_active: true,
}
const activePlanB = {
  id: 'plan-b',
  name: 'Plan B',
  price_amount: 3900,
  currency: 'EUR',
  billing_interval: 'month',
  is_active: true,
}
const inactivePlan = {
  id: 'plan-x',
  name: 'Retired Plan',
  price_amount: 500,
  currency: 'EUR',
  billing_interval: 'month',
  is_active: false,
}

vi.mock('../../src/stores/subscriptionPlans', () => ({
  useSubscriptionPlansStore: () => ({
    entities: [activePlanA, activePlanB, inactivePlan],
    formatPrice: (amount: number, currency: string = 'EUR') => `${(amount / 100).toFixed(2)} ${currency}`,
    ensurePlansLoaded: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock('../../src/stores/subscriptions', () => ({
  useSubscriptionsStore: () => ({
    adminAssignPlan: vi.fn().mockResolvedValue({ success: true }),
  }),
}))

import AdminAssignPlanModal from '../../src/components/Modals/AdminAssignPlanModal.vue'

const baseModalStub = {
  props: ['visible', 'title', 'titleIcon', 'size'],
  template:
    '<div class="base-modal-stub"><slot /><div class="footer-slot"><slot name="footer" /></div></div>',
}

async function mountModal(planId: string | null = null) {
  const wrapper = mount(AdminAssignPlanModal, {
    props: { visible: false, planId },
    global: { stubs: { BaseModal: baseModalStub } },
  })
  // populateFromProps runs in the visible false->true watcher.
  await wrapper.setProps({ visible: true })
  await flushPromises()
  return wrapper
}

describe('AdminAssignPlanModal — plan <select> (pins for shared PlanSelect)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders one option per ACTIVE plan, excluding inactive plans', async () => {
    const wrapper = await mountModal()

    const options = wrapper.find('#assign-plan').findAll('option')
    // Only the two active plans — no empty placeholder, no inactive plan.
    expect(options).toHaveLength(2)
    const values = options.map((o) => o.attributes('value'))
    expect(values).toEqual(['plan-a', 'plan-b'])
    expect(values).not.toContain('plan-x')
  })

  it('labels each option as "Name - price/interval"', async () => {
    const wrapper = await mountModal()

    const firstOption = wrapper.find('#assign-plan').findAll('option')[0]
    expect(firstOption.text()).toContain('Plan A')
    expect(firstOption.text()).toContain('12.00 EUR')
    expect(firstOption.text()).toContain('month')
  })

  it('preselects the first active plan when opened without a planId', async () => {
    const wrapper = await mountModal()
    expect((wrapper.find('#assign-plan').element as HTMLSelectElement).value).toBe('plan-a')
  })

  it('preselects the provided planId when opened with one', async () => {
    const wrapper = await mountModal('plan-b')
    expect((wrapper.find('#assign-plan').element as HTMLSelectElement).value).toBe('plan-b')
  })

  it('shows the selected plan label in the confirm summary', async () => {
    const wrapper = await mountModal()

    // Choose plan B, provide a user id, then advance to the confirm step.
    await wrapper.find('#assign-plan').setValue('plan-b')
    await wrapper.find('#assign-user-id').setValue('user-123')
    // The footer "Assign Plan" button flips showAssignConfirm on.
    await wrapper.find('.footer-slot .btn-primary').trigger('click')
    await flushPromises()

    const summary = wrapper.find('.confirm-summary')
    expect(summary.exists()).toBe(true)
    expect(summary.text()).toContain('Plan B')
    expect(summary.text()).toContain('39.00 EUR')
  })
})
