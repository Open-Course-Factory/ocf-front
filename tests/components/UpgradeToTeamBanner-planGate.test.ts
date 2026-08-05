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
// can_run_classrooms rather than inspecting a plan field, because every screen
// that worked it out locally got a different answer.
//
// The ORG-LESS one — `can_create_organization` from /auth/permissions, computed
// by the same call ConvertToTeamOrganization makes, which resolves the plan with
// no org context on purpose. This banner only ever appears inside a personal
// organization, where the org-scoped verdict is a flat no whatever the plan says
// (core #475).
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
    canCreateOrganization.value = null
  })

  it('offers the conversion when the plan grants group management', () => {
    canCreateOrganization.value = true

    const wrapper = mountBanner()

    expect(wrapper.find('[data-test="upgrade-to-team-convert"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="upgrade-to-team-plan"]').exists()).toBe(false)
  })

  it('sends the user to the plan rather than into a team that ignores it', () => {
    canCreateOrganization.value = false

    const wrapper = mountBanner()

    expect(wrapper.find('[data-test="upgrade-to-team-convert"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="upgrade-to-team-plan"]').exists()).toBe(true)
  })

  it('stays actionable when the verdict has not resolved', () => {
    // One action or the other, never a banner with nothing to click. Which one:
    // an unresolved verdict keeps the conversion, because the endpoint refuses it
    // anyway if the plan cannot carry a team, whereas quoting Formateur to
    // someone who bought it has no such safety net.
    canCreateOrganization.value = null

    const wrapper = mountBanner()

    expect(wrapper.find('[data-test="upgrade-to-team-convert"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="upgrade-to-team-plan"]').exists()).toBe(false)
  })
})
