import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const subscribeOrganization = vi.fn()

vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: () => ({ t: (key: string) => key }),
  useStoreTranslations: () => ({ t: (key: string) => key })
}))
vi.mock('../../src/stores/organizationSubscriptions', () => ({
  useOrganizationSubscriptionsStore: () => ({ subscribeOrganization, cancelOrganizationSubscription: vi.fn() })
}))
vi.mock('../../src/stores/subscriptionPlans', () => ({
  useSubscriptionPlansStore: () => ({ ensurePlansLoaded: vi.fn().mockResolvedValue(undefined), entities: [] })
}))
vi.mock('../../src/stores/organizationRolePlans', () => ({
  useOrganizationRolePlansStore: () => ({ loadOrganizationRolePlans: vi.fn().mockResolvedValue([]) })
}))

import AdminOrgPlanModal from '../../src/components/Modals/AdminOrgPlanModal.vue'
import i18n from '../../src/i18n'
import { useUserSettingsStore } from '../../src/stores/userSettings'

const ModalWithSeparateRegions = {
  template: '<div><div class="body"><slot /></div><div class="footer"><slot name="footer" /></div></div>'
}
const PlanSelectStub = { name: 'PlanSelect', props: ['modelValue'], template: '<div />' }

async function openWithPlanChosen() {
  const wrapper = mount(AdminOrgPlanModal, {
    props: { visible: false, organizationId: 'org-1', organizationName: 'Org One' },
    global: { stubs: { BaseModal: ModalWithSeparateRegions, PlanSelect: PlanSelectStub } }
  })
  await wrapper.setProps({ visible: true })
  await flushPromises()
  wrapper.findComponent(PlanSelectStub).vm.$emit('update:modelValue', 'plan-a')
  await flushPromises()
  return wrapper
}

describe('AdminOrgPlanModal — assigning a plan', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('asks for confirmation in the footer, where the admin just clicked', async () => {
    const wrapper = await openWithPlanChosen()

    await wrapper.find('.footer button.btn-primary').trigger('click')

    expect(subscribeOrganization).not.toHaveBeenCalled()
    expect(wrapper.find('.footer .confirm-assign').text()).toContain('Org One')
    expect(wrapper.find('.footer button.btn-primary').text()).toBe('adminOrgPlan.confirmAssign')
    expect(wrapper.find('.body .confirm-assign').exists()).toBe(false)
  })

  it('subscribes when the same button is clicked again', async () => {
    subscribeOrganization.mockResolvedValue({})
    const wrapper = await openWithPlanChosen()

    await wrapper.find('.footer button.btn-primary').trigger('click')
    await wrapper.find('.footer button.btn-primary').trigger('click')
    await flushPromises()

    expect(subscribeOrganization).toHaveBeenCalledWith('org-1', { subscription_plan_id: 'plan-a' })
  })

  it('goes back to the form without subscribing', async () => {
    const wrapper = await openWithPlanChosen()

    await wrapper.find('.footer button.btn-primary').trigger('click')
    await wrapper.find('.footer button.btn-secondary').trigger('click')

    expect(wrapper.find('.confirm-assign').exists()).toBe(false)
    expect(wrapper.find('.footer button.btn-primary').text()).toBe('adminOrgPlan.assignPlan')
    expect(subscribeOrganization).not.toHaveBeenCalled()
  })

  it('shows a failed assignment in the footer, not below the fold', async () => {
    subscribeOrganization.mockRejectedValue(new Error('nope'))
    const wrapper = await openWithPlanChosen()

    await wrapper.find('.footer button.btn-primary').trigger('click')
    await wrapper.find('.footer button.btn-primary').trigger('click')
    await flushPromises()

    expect(wrapper.find('.footer .error-message').exists()).toBe(true)
  })
})

describe('AdminOrgPlanModal — period end in the admin\'s language and time zone', () => {
  // 11:30 UTC is already the next day in Auckland (UTC+13) but still the same
  // day in Los Angeles (UTC-7): whatever the machine's zone, one case differs.
  it.each([
    ['fr', 'Pacific/Auckland', '16/03/2026'],
    ['en', 'America/Los_Angeles', '3/15/2026'],
  ] as const)('shows a %s admin in %s a period ending on %s', async (locale, timezone, expected) => {
    const pinia = createPinia()
    setActivePinia(pinia)
    useUserSettingsStore().settings.timezone = timezone
    i18n.global.locale.value = locale

    const wrapper = mount(AdminOrgPlanModal, {
      props: {
        visible: true,
        organizationId: 'org-1',
        organizationName: 'Org One',
        currentSubscription: { id: 'sub-1', status: 'active', current_period_end: '2026-03-15T11:30:00Z', subscription_plan: { name: 'Team' } } as any,
      },
      global: { plugins: [i18n, pinia], stubs: { BaseModal: ModalWithSeparateRegions, PlanSelect: PlanSelectStub } }
    })
    await flushPromises()

    expect(wrapper.find('.subscription-detail').text()).toBe(`adminOrgPlan.periodEnd: ${expected}`)
  })
})
