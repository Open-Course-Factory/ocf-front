/**
 * #298: the convert-to-team banner invited users into a team organization
 * without checking whether their plan grants group management.
 *
 * That is the same defect as the org plan modal — offering a route that does not
 * lead where it says. Converting to a team is pointless on Solo or Trial: the
 * org inherits the acting member's plan, and neither of those enables groups.
 *
 * The entitlement is shared with ClassroomPlanCta via useClassroomEntitlement,
 * so this pins that the banner actually consults it.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'

// The verdict comes from the backend now (ocf-core#453): the banner reads
// can_run_classrooms rather than inspecting a plan field, because the answer
// depends on the plan, the organization and the caller's role in it, and every
// screen that worked it out locally got a different one.
const effectiveFeatures = { value: null as any }

vi.mock('../../src/stores/permissions', () => ({
  usePermissionsStore: () => ({
    get effectiveFeatures() { return effectiveFeatures.value },
    loadEffectiveFeatures: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock('../../src/stores/organizations', () => ({
  useOrganizationsStore: () => ({
    isPersonalOrganization: ref(true),
    currentOrganization: ref({ id: 'org-1', name: 'personal' }),
    convertToTeamOrganization: vi.fn(),
    t: (k: string) => k,
  }),
}))

import UpgradeToTeamBanner from '../../src/components/Common/UpgradeToTeamBanner.vue'

function mountBanner() {
  setActivePinia(createPinia())
  return mount(UpgradeToTeamBanner, {
    global: {
      plugins: [createI18n({
        legacy: false, locale: 'en', fallbackLocale: 'en',
        messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false,
      })],
      stubs: { BaseModal: true, RouterLink: { template: '<a><slot /></a>' } },
    },
  })
}

describe('UpgradeToTeamBanner — plan gate', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
    effectiveFeatures.value = null
  })

  it('offers the conversion when the plan grants group management', () => {
    effectiveFeatures.value = { can_run_classrooms: true }

    const wrapper = mountBanner()

    expect(wrapper.find('[data-test="upgrade-to-team-convert"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="upgrade-to-team-plan"]').exists()).toBe(false)
  })

  it('sends the user to the plan rather than into a team that ignores it', () => {
    effectiveFeatures.value = { can_run_classrooms: false, classroom_denied_reason: 'plan_lacks_group_management' }

    const wrapper = mountBanner()

    expect(wrapper.find('[data-test="upgrade-to-team-convert"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="upgrade-to-team-plan"]').exists()).toBe(true)
  })

  it('stays actionable when the verdict has not resolved', () => {
    effectiveFeatures.value = null

    const wrapper = mountBanner()

    // Not entitled by default, but never a banner with no action at all.
    expect(wrapper.find('[data-test="upgrade-to-team-plan"]').exists()).toBe(true)
  })
})
