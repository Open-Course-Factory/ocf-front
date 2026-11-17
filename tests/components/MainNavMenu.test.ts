/**
 * What the sidebar offers a user, read off the mounted menu.
 *
 * The four inputs that decide it are stubbed — feature flags, the user's
 * permissions, the scenario-editor access and the classroom verdict — and the
 * rest is real: stores, i18n, the category and item components, router links.
 *
 * Route-level facts (a page's required permission, its parent entry) are in
 * tests/router/classRoutes.test.ts, which resolves the real routes.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { computed, ref } from 'vue'

const disabledFlags = ref<string[]>([])
const permissions = ref<string[]>([])
const canAccessScenarioEditor = ref(false)
const canRunClassrooms = ref(false)
const deniedReason = ref<string | null>(null)

vi.mock('../../src/composables/useFeatureFlags', () => ({
  useFeatureFlags: () => ({
    createReactiveFlag: (name: string) => computed(() => !disabledFlags.value.includes(name)),
    waitForInitialization: () => Promise.resolve(),
    getCurrentActor: () => ({ roles: ['member'] }),
  }),
}))
vi.mock('../../src/composables/usePermissions', () => ({
  usePermissions: () => ({ hasPermission: (name: string) => permissions.value.includes(name) }),
}))
vi.mock('../../src/composables/useScenarioEditorAccess', () => ({
  useScenarioEditorAccess: () => ({ canAccessScenarioEditor }),
}))
vi.mock('../../src/composables/useClassroomEntitlement', () => ({
  useClassroomEntitlement: () => ({ canRunClassrooms, deniedReason }),
}))

import i18n from '../../src/i18n'
import MainNavMenu from '../../src/components/Menus/MainNavMenu.vue'
import { usePermissionsStore } from '../../src/stores/permissions'

let pinia: Pinia

async function mountMenu({ at = '/', locale = 'en', collapsed = false } = {}) {
  i18n.global.locale.value = locale as 'en' | 'fr'
  const page = { template: '<div />' }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/classes/:id/live', component: page, meta: { navParent: 'my-classes' } },
      { path: '/:anything(.*)*', component: page },
    ],
  })
  await router.push(at)
  const wrapper = mount(MainNavMenu, {
    props: { isMenuCollapsed: collapsed },
    global: { plugins: [pinia, router, i18n] },
  })
  await flushPromises()
  return wrapper
}

type Menu = Awaited<ReturnType<typeof mountMenu>>
const linkTo = (menu: Menu, path: string) => menu.find(`a[href="${path}"]`)
const groupsCategory = (menu: Menu) => menu.find('[data-category="groups"]')
const groupsHeader = (menu: Menu) => groupsCategory(menu).find('[role="button"]')

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
  disabledFlags.value = []
  permissions.value = ['view_groups']
  canAccessScenarioEditor.value = true
  canRunClassrooms.value = true
  deniedReason.value = null
})

describe('the scenario editor entry', () => {
  it('is offered to a user who may edit scenarios', async () => {
    const menu = await mountMenu()

    expect(linkTo(menu, '/scenario-editor').text()).toBe('Scenario Editor')
  })

  it('is absent for a user who may not, while the scenarios they can play stay', async () => {
    canAccessScenarioEditor.value = false

    const menu = await mountMenu()

    expect(linkTo(menu, '/scenario-editor').exists()).toBe(false)
    expect(linkTo(menu, '/scenarios').exists()).toBe(true)
  })

  it('is absent when scenario authoring is switched off, whoever asks', async () => {
    disabledFlags.value = ['scenario_conception']

    const menu = await mountMenu()

    expect(linkTo(menu, '/scenario-editor').exists()).toBe(false)
    expect(linkTo(menu, '/scenarios').exists()).toBe(true)
  })
})

describe('the classroom entries', () => {
  it.each([
    ['en', 'My classes', 'Your classes'],
    ['fr', 'Mes classes', 'Vos classes'],
  ])('puts "My classes" above the categories, named in %s', async (locale, name, tooltip) => {
    const menu = await mountMenu({ locale, collapsed: true })

    const myClasses = linkTo(menu, '/my-classes')
    expect(myClasses.text()).toBe(name)
    expect(myClasses.attributes('title')).toContain(tooltip)
    expect(menu.find('.menu-top li').find('a').attributes('href')).toBe('/my-classes')
  })

  it('lists the group pages that lead somewhere, not the raw members table', async () => {
    const menu = await mountMenu()

    const groupLinks = groupsCategory(menu).findAll('a').map(link => link.attributes('href'))
    expect(groupLinks).toEqual(['/class-groups', '/class-groups-hierarchy'])
    expect(linkTo(menu, '/group-members').exists()).toBe(false)
  })

  // One rule for one entry (#319): a plan feature held in another organization
  // used to lock Groups a second time, and the two only agreed by accident.
  it('follow the classroom verdict alone, whatever plan features another organization holds', async () => {
    usePermissionsStore().allOrgFeatures = {
      effective_features: { features: ['multiple_groups'] },
    } as never

    const menu = await mountMenu()

    expect(groupsHeader(menu).attributes('aria-disabled')).toBeUndefined()
    expect(linkTo(menu, '/class-groups').exists()).toBe(true)
  })

  it('are both absent for a user who cannot see groups', async () => {
    permissions.value = []

    const menu = await mountMenu()

    expect(groupsCategory(menu).exists()).toBe(false)
    expect(linkTo(menu, '/my-classes').exists()).toBe(false)
  })

  it('lock Groups in a personal organization but keep "My classes" open, the way to a team', async () => {
    canRunClassrooms.value = false
    deniedReason.value = 'personal_organization'

    const menu = await mountMenu()

    expect(groupsHeader(menu).attributes('aria-disabled')).toBe('true')
    expect(groupsHeader(menu).attributes('title')).toBe(
      'Classrooms live in organizations — create one from My classes',
    )
    expect(groupsCategory(menu).findAll('a')).toHaveLength(0)
    expect(linkTo(menu, '/my-classes').exists()).toBe(true)
  })

  it.each([
    ['en', 'switch organization'],
    ['fr', "changez d'organisation"],
  ])('tell a user locked out by the active organization what to do, in %s', async (locale, hint) => {
    canRunClassrooms.value = false
    deniedReason.value = 'plan_lacks_group_management'

    const menu = await mountMenu({ locale })

    expect(i18n.global.te('nav.featureNotInCurrentOrg', locale)).toBe(true)
    expect(groupsHeader(menu).attributes('title')).toBe(i18n.global.t('nav.featureNotInCurrentOrg'))
    expect(groupsHeader(menu).attributes('title')).toContain(hint)
  })

  it('keep "My classes" lit on a page of a class, not only on the console', async () => {
    const onClassPage = await mountMenu({ at: '/classes/g-1/live' })
    const elsewhere = await mountMenu({ at: '/scenarios' })

    expect(linkTo(onClassPage, '/my-classes').classes()).toContain('is-section-active')
    expect(linkTo(elsewhere, '/my-classes').classes()).not.toContain('is-section-active')
  })
})
