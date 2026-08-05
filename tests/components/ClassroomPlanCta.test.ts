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
import { ref } from 'vue'

// The verdict comes from the backend now (ocf-core#453): the CTA reads
// can_run_classrooms rather than inspecting a plan field, because the answer
// depends on the plan, the organization and the caller's role in it.
//
// The ORG-LESS one, specifically: `can_create_organization` from
// /auth/permissions, which core #476 computes with the same call its create
// endpoint applies. The org-scoped verdict answers a different question and says
// no inside a personal organization whatever the plan says (core #475) — which is
// where every trainer without a team organization stands, including the one who
// just bought Formateur.
const canCreateOrganization = ref<boolean | null>(null)

vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: () => ({
    get canCreateOrganization() { return canCreateOrganization.value },
    ensurePermissionsLoaded: vi.fn().mockResolvedValue([]),
    loadPermissions: vi.fn().mockResolvedValue([]),
  }),
}))

vi.mock('../../src/stores/permissions', () => ({
  usePermissionsStore: () => ({
    get effectiveFeatures() { return null },
    get allOrgFeatures() { return null },
    ensureEffectiveFeaturesLoaded: vi.fn().mockResolvedValue(undefined),
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
    canCreateOrganization.value = null
  })

  it('offers organization creation when the plan grants group management', () => {
    canCreateOrganization.value = true

    const wrapper = mountCta()

    expect(wrapper.find('[data-test="classroom-cta-create"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="classroom-cta-upgrade"]').exists()).toBe(false)
  })

  it('emits create so the page owns how an organization is actually made', async () => {
    canCreateOrganization.value = true

    const wrapper = mountCta()
    await wrapper.find('[data-test="classroom-cta-create"]').trigger('click')

    expect(wrapper.emitted('create')).toBeTruthy()
  })

  it('points at the plan instead of disappearing when not entitled', () => {
    canCreateOrganization.value = false

    const wrapper = mountCta()

    expect(wrapper.find('[data-test="classroom-cta-create"]').exists()).toBe(false)
    // The gate sells: there is always an action, never a dead panel.
    expect(wrapper.find('[data-test="classroom-cta-upgrade"]').exists()).toBe(true)
  })

  it('does not sell an upgrade before any verdict has arrived', () => {
    // This used to show the locked panel, back when no endpoint refused the
    // creation and a wrong "yes" led somewhere with no way back. Core #476 now
    // refuses it and the page translates the refusal, so the two mistakes are no
    // longer symmetrical: an unresolved verdict costs an entitled teacher a
    // priced-up panel telling them to buy Formateur again, and costs an
    // unentitled one one click.
    canCreateOrganization.value = null

    const wrapper = mountCta()

    expect(wrapper.find('[data-test="classroom-cta-create"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="classroom-cta-upgrade"]').exists()).toBe(false)
  })
})
