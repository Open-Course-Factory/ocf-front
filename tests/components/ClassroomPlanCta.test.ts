/**
 * #298: nothing connected "I want to run classrooms" to "I need Formateur".
 *
 * Marc discovered it backwards — bought Formateur, created an org, and the org
 * ignored the plan. With inheritance fixed, the remaining gap is the entry
 * point: a user is invited toward team organizations with no check that their
 * plan grants group management, and no signpost if it does not.
 *
 * The gate must SELL rather than hide. An action that silently disappears reads
 * as a bug and leaves the user with no route to what they wanted.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'

const currentSubscription = { value: null as any }

vi.mock('../../src/stores/subscriptions', () => ({
  useSubscriptionsStore: () => ({
    get currentSubscription() { return currentSubscription.value },
    getCurrentSubscription: vi.fn().mockResolvedValue(undefined),
  }),
}))

import ClassroomPlanCta from '../../src/components/Organizations/ClassroomPlanCta.vue'

function mountCta() {
  setActivePinia(createPinia())
  return mount(ClassroomPlanCta, {
    global: {
      plugins: [createI18n({
        legacy: false, locale: 'en', fallbackLocale: 'en',
        messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false,
      })],
      stubs: { RouterLink: { template: '<a><slot /></a>' } },
    },
  })
}

describe('ClassroomPlanCta', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    currentSubscription.value = null
  })

  it('offers organization creation when the plan grants group management', () => {
    currentSubscription.value = { subscription_plan: { group_management_enabled: true } }

    const wrapper = mountCta()

    expect(wrapper.find('[data-test="classroom-cta-create"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="classroom-cta-upgrade"]').exists()).toBe(false)
  })

  it('emits create so the page owns how an organization is actually made', async () => {
    currentSubscription.value = { subscription_plan: { group_management_enabled: true } }

    const wrapper = mountCta()
    await wrapper.find('[data-test="classroom-cta-create"]').trigger('click')

    expect(wrapper.emitted('create')).toBeTruthy()
  })

  it('points at the plan instead of disappearing when not entitled', () => {
    currentSubscription.value = { subscription_plan: { group_management_enabled: false } }

    const wrapper = mountCta()

    expect(wrapper.find('[data-test="classroom-cta-create"]').exists()).toBe(false)
    // The gate sells: there is always an action, never a dead panel.
    expect(wrapper.find('[data-test="classroom-cta-upgrade"]').exists()).toBe(true)
  })

  it('treats an unresolved subscription as not entitled', () => {
    // The empty-input case. Defaulting to "yes" would invite a user into an
    // organization the backend leaves without classroom features — exactly the
    // failure #298 exists to prevent.
    currentSubscription.value = null

    const wrapper = mountCta()

    expect(wrapper.find('[data-test="classroom-cta-upgrade"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="classroom-cta-create"]').exists()).toBe(false)
  })

  it('treats a plan with no group-management flag as not entitled', () => {
    currentSubscription.value = { subscription_plan: { name: 'Solo' } }

    const wrapper = mountCta()

    expect(wrapper.find('[data-test="classroom-cta-upgrade"]').exists()).toBe(true)
  })
})
