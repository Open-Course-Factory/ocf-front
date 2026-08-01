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

// The verdict comes from the backend now (ocf-core#453): the CTA reads
// can_run_classrooms rather than inspecting a plan field, because the answer
// depends on the plan, the organization and the caller's role in it.
const effectiveFeatures = { value: null as any }

vi.mock('../../src/stores/permissions', () => ({
  usePermissionsStore: () => ({
    get effectiveFeatures() { return effectiveFeatures.value },
    loadEffectiveFeatures: vi.fn().mockResolvedValue(undefined),
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
    effectiveFeatures.value = null
  })

  it('offers organization creation when the plan grants group management', () => {
    effectiveFeatures.value = { can_run_classrooms: true }

    const wrapper = mountCta()

    expect(wrapper.find('[data-test="classroom-cta-create"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="classroom-cta-upgrade"]').exists()).toBe(false)
  })

  it('emits create so the page owns how an organization is actually made', async () => {
    effectiveFeatures.value = { can_run_classrooms: true }

    const wrapper = mountCta()
    await wrapper.find('[data-test="classroom-cta-create"]').trigger('click')

    expect(wrapper.emitted('create')).toBeTruthy()
  })

  it('points at the plan instead of disappearing when not entitled', () => {
    effectiveFeatures.value = { can_run_classrooms: false, classroom_denied_reason: 'plan_lacks_group_management' }

    const wrapper = mountCta()

    expect(wrapper.find('[data-test="classroom-cta-create"]').exists()).toBe(false)
    // The gate sells: there is always an action, never a dead panel.
    expect(wrapper.find('[data-test="classroom-cta-upgrade"]').exists()).toBe(true)
  })

  it('treats an unresolved subscription as not entitled', () => {
    // The empty-input case. Defaulting to "yes" would invite a user into an
    // organization the backend leaves without classroom features — exactly the
    // failure #298 exists to prevent.
    effectiveFeatures.value = null

    const wrapper = mountCta()

    expect(wrapper.find('[data-test="classroom-cta-upgrade"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="classroom-cta-create"]').exists()).toBe(false)
  })

  // A response that carries no verdict at all must read as "not entitled". Absent
  // is not permission: inviting someone into an organization the backend will then
  // refuse is the failure this gate exists to prevent.
  it('treats a response without a verdict as not entitled', () => {
    effectiveFeatures.value = { user_id: 'u-1' }

    const wrapper = mountCta()

    expect(wrapper.find('[data-test="classroom-cta-upgrade"]').exists()).toBe(true)
  })
})
