/**
 * Tests for the banner every page of a class shares.
 *
 * The eight-tab class page became five real pages, each with its own URL. The
 * banner is what makes them feel like one class: it says which class the teacher
 * is in, how many learners are connected, and links to the sibling pages.
 *
 * Three contracts inherited from the tab bar it replaces are pinned here:
 *
 *   1. The privileged links are RESERVED, not absent, while the caller's role is
 *      still being worked out — nothing appears under the cursor of a teacher
 *      already reaching for a page (the old tab-bar reflow suite).
 *   2. Moving from one class to another rebuilds the page underneath instead of
 *      leaving the previous class's rows on screen (the old group-switch suite).
 *   3. The bar is navigable and says which page is open — now as a nav of real
 *      links carrying aria-current, rather than a WAI-ARIA tablist.
 *
 * The fourth — that the banner turns a caller away from a page their role does
 * not open — is new: the tabs used to be simply absent, but a URL is typeable.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { defineComponent, onMounted, ref } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'

const getOne = vi.fn()
const axiosGet = vi.fn()
const liveSessionCountOf = vi.fn()
const ensureLoaded = vi.fn()

vi.mock('axios', () => ({
  default: {
    get: (...args: unknown[]) => axiosGet(...args),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} })
  }
}))

vi.mock('../../src/stores/classGroups', () => ({
  useClassGroupsStore: () => ({ getOne: (...args: unknown[]) => getOne(...args) })
}))

vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: () => ({ userId: 'u-caller' })
}))

vi.mock('../../src/stores/teacherGroups', () => ({
  useTeacherGroupsStore: () => ({
    ensureLoaded: (...args: unknown[]) => ensureLoaded(...args),
    liveSessionCountOf: (...args: unknown[]) => liveSessionCountOf(...args)
  })
}))

vi.mock('../../src/composables/useFeatureFlags', () => ({
  useFeatureFlags: () => ({ isEnabled: () => true })
}))

vi.mock('../../src/composables/useAdminViewMode', () => ({
  useAdminViewMode: () => ({ isAdmin: ref(false) })
}))

vi.mock('../../src/services/domain/user', () => ({
  userService: { getUserById: vi.fn().mockResolvedValue({ id: 'u-owner', display_name: 'Owner' }) }
}))

import ClassLayout from '../../src/components/Class/ClassLayout.vue'
import { useClassContext } from '../../src/composables/useClassContext'

/** A promise this test resolves on demand, standing in for the roster fetch. */
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(r => { resolve = r })
  return { promise, resolve }
}

function classPayload(overrides: Record<string, unknown> = {}) {
  return {
    id: 'g-1',
    name: 'g-1',
    display_name: 'Promo A',
    // Owned by somebody else by default: the caller's rights can then only come
    // from the roster, which is what makes the reserved slots observable.
    owner_user_id: 'u-owner',
    organization_id: '',
    max_members: 30,
    member_count: 12,
    is_active: true,
    is_expired: false,
    is_full: false,
    sub_groups: [],
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides
  }
}

/**
 * Stands in for a class page, and behaves like the real ones: it reads the
 * context the layout provides ONCE, on mount, the way every page component here
 * loads its rows. A page that is not rebuilt on a class change would therefore
 * still be showing the class the teacher just left.
 */
function pageStub(label: string) {
  return defineComponent({
    setup() {
      const { group, canManageClass } = useClassContext()
      const loadedOnMount = ref('')
      onMounted(() => {
        loadedOnMount.value = `${group.value?.display_name}/${canManageClass.value}`
      })
      return { loadedOnMount, label }
    },
    template: `<div class="page-stub" :data-page="label">{{ loadedOnMount }}</div>`
  })
}

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false
  })
}

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/my-classes', name: 'MyClasses', component: { template: '<div class="console" />' } },
      { path: '/terminal-sessions', component: { template: '<div />' } },
      {
        path: '/classes/:id',
        component: ClassLayout,
        children: [
          { path: 'live', name: 'ClassLive', component: pageStub('live') },
          { path: 'members', name: 'ClassMembers', component: pageStub('members') },
          { path: 'scenarios', name: 'ClassScenarios', component: pageStub('scenarios') },
          { path: 'analytics', name: 'ClassAnalytics', component: pageStub('analytics') },
          { path: 'settings', name: 'ClassSettings', component: pageStub('settings') }
        ]
      }
    ]
  })
}

const Host = { template: '<router-view />' }

async function mountAt(router: ReturnType<typeof createTestRouter>, location: string) {
  await router.push(location)
  await router.isReady()

  const wrapper = mount(Host, { global: { plugins: [createTestI18n(), router] } })
  await flushPromises()
  return wrapper
}

type Wrapper = Awaited<ReturnType<typeof mountAt>>

function pageLinkLabels(wrapper: Wrapper) {
  return wrapper.findAll('.cnav').map(link => link.text().trim())
}

function reservedLinkLabels(wrapper: Wrapper) {
  return wrapper.findAll('.cnav-reserved').map(link => link.text().trim())
}

const ALL_PAGES = ['Live', 'Learners', 'Scenarios', 'Analytics', 'Settings']
const MANAGER_PAGES = ALL_PAGES.filter(label => label !== 'Learners')

describe('the class banner — what it says about the class', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getOne.mockResolvedValue(classPayload({ owner_user_id: 'u-caller' }))
    axiosGet.mockResolvedValue({ data: [] })
    liveSessionCountOf.mockReturnValue(undefined)
  })

  it('names the class and links back to the console', async () => {
    const wrapper = await mountAt(createTestRouter(), '/classes/g-1/live')

    expect(wrapper.find('.crumb-current').text()).toBe('Promo A')
    expect(wrapper.find('.crumb-link').attributes('href')).toBe('/my-classes')
  })

  it('holds the class name’s line while it loads instead of growing one', async () => {
    const pending = deferred<ReturnType<typeof classPayload>>()
    getOne.mockReturnValue(pending.promise)

    const wrapper = await mountAt(createTestRouter(), '/classes/g-1/live')

    expect(wrapper.find('.crumb-skeleton').exists()).toBe(true)

    pending.resolve(classPayload({ owner_user_id: 'u-caller' }))
    await flushPromises()

    expect(wrapper.find('.crumb-skeleton').exists()).toBe(false)
    expect(wrapper.find('.crumb-current').text()).toBe('Promo A')
  })

  it('shows how many learners are connected, out of the roster', async () => {
    liveSessionCountOf.mockReturnValue(7)
    axiosGet.mockResolvedValue({
      data: Array.from({ length: 12 }, (_, i) => ({ id: `m-${i}`, user_id: `u-${i}`, role: 'member' }))
    })

    const wrapper = await mountAt(createTestRouter(), '/classes/g-1/live')

    expect(wrapper.find('.banner-live').text()).toContain('7/12 connected')
    expect(wrapper.find('.banner-live').classes()).not.toContain('is-pending')
  })

  it('reads the live count off the console cache rather than asking per class', async () => {
    liveSessionCountOf.mockReturnValue(3)
    await mountAt(createTestRouter(), '/classes/g-1/live')

    expect(ensureLoaded).toHaveBeenCalledTimes(1)
    expect(liveSessionCountOf).toHaveBeenCalledWith('g-1')
  })

  it('keeps the counter’s slot while the count is unknown, rather than adding it later', async () => {
    const wrapper = await mountAt(createTestRouter(), '/classes/g-1/live')

    const counter = wrapper.find('.banner-live')
    expect(counter.exists()).toBe(true)
    expect(counter.classes()).toContain('is-pending')
  })

  it('says it in French too', async () => {
    liveSessionCountOf.mockReturnValue(7)
    const router = createTestRouter()
    await router.push('/classes/g-1/live')
    await router.isReady()

    const i18n = createTestI18n()
    i18n.global.locale.value = 'fr'
    const wrapper = mount(Host, { global: { plugins: [i18n, router] } })
    await flushPromises()

    expect(wrapper.find('.crumb-link').text()).toBe('Mes classes')
    expect(wrapper.find('.banner-live').text()).toContain('connectés')
    expect(pageLinkLabels(wrapper)).toEqual([
      'En direct', 'Apprenants', 'Scénarios', 'Analytiques', 'Réglages'
    ])
  })
})

describe('the class banner — page links while the caller’s role loads', () => {
  /** One entry per roster fetch the layout issues, each resolvable on demand. */
  let rosterFetches: ReturnType<typeof deferred<{ data: unknown }>>[]

  function asManager() {
    return { data: [{ id: 'm-1', user_id: 'u-caller', role: 'manager' }] }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    getOne.mockResolvedValue(classPayload())
    liveSessionCountOf.mockReturnValue(undefined)
    rosterFetches = []
    axiosGet.mockImplementation((url: string) => {
      if (url !== '/group-members') return Promise.resolve({ data: {} })
      const pending = deferred<{ data: unknown }>()
      rosterFetches.push(pending)
      return pending.promise
    })
  })

  it('reserves every privileged link rather than letting it appear later', async () => {
    const wrapper = await mountAt(createTestRouter(), '/classes/g-1/members')

    expect(pageLinkLabels(wrapper)).toEqual(ALL_PAGES)
    expect(reservedLinkLabels(wrapper)).toEqual(MANAGER_PAGES)
  })

  it('does not let a reserved slot be followed', async () => {
    const wrapper = await mountAt(createTestRouter(), '/classes/g-1/members')

    const reserved = wrapper.findAll('.cnav-reserved')
    expect(reserved).toHaveLength(MANAGER_PAGES.length)
    reserved.forEach(slot => expect(slot.element.tagName).toBe('SPAN'))
  })

  it('turns the reserved slots into links in place when the caller turns out to be a manager', async () => {
    const wrapper = await mountAt(createTestRouter(), '/classes/g-1/members')
    const before = pageLinkLabels(wrapper)

    rosterFetches[0].resolve(asManager())
    await flushPromises()

    expect(pageLinkLabels(wrapper)).toEqual(before)
    expect(reservedLinkLabels(wrapper)).toEqual([])
  })

  it('drops the reserved slots without moving the learners link when the caller is a plain member', async () => {
    const wrapper = await mountAt(createTestRouter(), '/classes/g-1/members')

    rosterFetches[0].resolve({ data: [{ id: 'm-1', user_id: 'u-caller', role: 'member' }] })
    await flushPromises()

    expect(pageLinkLabels(wrapper)).toEqual(['Learners'])
  })

  it('reserves nothing for the class owner, whose rights the class payload already proves', async () => {
    getOne.mockResolvedValue(classPayload({ owner_user_id: 'u-caller' }))

    const wrapper = await mountAt(createTestRouter(), '/classes/g-1/live')

    expect(pageLinkLabels(wrapper)).toEqual(ALL_PAGES)
    expect(reservedLinkLabels(wrapper)).toEqual([])
  })

  it('marks the bar busy while the answer is pending, and settled once it is', async () => {
    const wrapper = await mountAt(createTestRouter(), '/classes/g-1/members')
    expect(wrapper.find('.class-nav').attributes('aria-busy')).toBe('true')

    rosterFetches[0].resolve(asManager())
    await flushPromises()

    expect(wrapper.find('.class-nav').attributes('aria-busy')).toBe('false')
  })
})

describe('the class banner — moving between pages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getOne.mockResolvedValue(classPayload({ owner_user_id: 'u-caller' }))
    axiosGet.mockResolvedValue({ data: [] })
    liveSessionCountOf.mockReturnValue(undefined)
  })

  it('says which page is open, and only that one', async () => {
    const wrapper = await mountAt(createTestRouter(), '/classes/g-1/scenarios')

    const current = wrapper.findAll('.cnav').filter(l => l.attributes('aria-current') === 'page')
    expect(current.map(l => l.text().trim())).toEqual(['Scenarios'])
  })

  it('offers each page as a real link, reachable and followable from the keyboard', async () => {
    const wrapper = await mountAt(createTestRouter(), '/classes/g-1/live')

    const links = wrapper.findAll('.cnav')
    expect(links).toHaveLength(ALL_PAGES.length)
    links.forEach(link => {
      expect(link.element.tagName).toBe('A')
      expect(link.attributes('href')).toMatch(/^\/classes\/g-1\//)
    })
  })

  it('opens the page a link points at', async () => {
    const router = createTestRouter()
    const wrapper = await mountAt(router, '/classes/g-1/live')

    const settings = wrapper.findAll('.cnav').find(l => l.text().trim() === 'Settings')!
    expect(settings.attributes('href')).toBe('/classes/g-1/settings')

    await router.push('/classes/g-1/settings')
    await flushPromises()

    expect(wrapper.find('.page-stub').attributes('data-page')).toBe('settings')
  })

  it('hands the page the class and the caller’s rights, resolved once by the banner', async () => {
    const wrapper = await mountAt(createTestRouter(), '/classes/g-1/live')

    expect(wrapper.find('.page-stub').text()).toBe('Promo A/true')
  })
})

describe('the class banner — a page the caller may not open', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getOne.mockResolvedValue(classPayload())
    liveSessionCountOf.mockReturnValue(undefined)
  })

  it('sends a plain member from the live page to the roster, the first page they can open', async () => {
    axiosGet.mockResolvedValue({ data: [{ id: 'm-1', user_id: 'u-caller', role: 'member' }] })

    const router = createTestRouter()
    await mountAt(router, '/classes/g-1/live')

    expect(router.currentRoute.value.path).toBe('/classes/g-1/members')
  })

  it('leaves a manager where they asked to be', async () => {
    axiosGet.mockResolvedValue({ data: [{ id: 'm-1', user_id: 'u-caller', role: 'manager' }] })

    const router = createTestRouter()
    await mountAt(router, '/classes/g-1/analytics')

    expect(router.currentRoute.value.path).toBe('/classes/g-1/analytics')
  })

  it('waits for the answer instead of bouncing a manager off their own page', async () => {
    const pending = deferred<{ data: unknown }>()
    axiosGet.mockImplementation((url: string) =>
      url === '/group-members' ? pending.promise : Promise.resolve({ data: {} })
    )

    const router = createTestRouter()
    await mountAt(router, '/classes/g-1/live')

    // Still unresolved: nothing may move yet.
    expect(router.currentRoute.value.path).toBe('/classes/g-1/live')

    pending.resolve({ data: [{ id: 'm-1', user_id: 'u-caller', role: 'manager' }] })
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/classes/g-1/live')
  })

  it('sends a caller back to the console when the class itself is not theirs to see', async () => {
    getOne.mockRejectedValue({ response: { status: 403 } })

    const router = createTestRouter()
    await mountAt(router, '/classes/g-1/live')

    expect(router.currentRoute.value.path).toBe('/my-classes')
  })

  it('keeps a failure that is not about access on screen, with a way back', async () => {
    getOne.mockRejectedValue({ response: { status: 500 }, message: 'Server exploded' })

    const router = createTestRouter()
    const wrapper = await mountAt(router, '/classes/g-1/live')

    expect(router.currentRoute.value.path).toBe('/classes/g-1/live')
    expect(wrapper.find('.class-state-error').text()).toContain('Server exploded')
    expect(wrapper.find('.class-state-error a').attributes('href')).toBe('/my-classes')
  })
})

describe('the class banner — moving to another class', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    axiosGet.mockResolvedValue({ data: [] })
    liveSessionCountOf.mockReturnValue(undefined)
    getOne.mockImplementation(async (id: string) =>
      classPayload({ id, owner_user_id: 'u-caller', display_name: id === 'g-1' ? 'Promo A' : 'Promo B' })
    )
  })

  it('rebuilds the page on the new class instead of leaving the previous one on screen', async () => {
    const router = createTestRouter()
    const wrapper = await mountAt(router, '/classes/g-1/live')
    expect(wrapper.find('.page-stub').text()).toBe('Promo A/true')

    await router.push('/classes/g-2/live')
    await flushPromises()

    expect(wrapper.find('.crumb-current').text()).toBe('Promo B')
    expect(wrapper.find('.page-stub').text()).toBe('Promo B/true')
  })

  it('holds the banner rather than naming the class being left while the next one loads', async () => {
    const pending = deferred<ReturnType<typeof classPayload>>()
    const router = createTestRouter()
    const wrapper = await mountAt(router, '/classes/g-1/live')

    getOne.mockReturnValue(pending.promise)
    await router.push('/classes/g-2/live')
    await flushPromises()

    expect(wrapper.find('.crumb-current').exists()).toBe(false)
    expect(wrapper.find('.crumb-skeleton').exists()).toBe(true)

    pending.resolve(classPayload({ id: 'g-2', owner_user_id: 'u-caller', display_name: 'Promo B' }))
    await flushPromises()

    expect(wrapper.find('.crumb-current').text()).toBe('Promo B')
  })

  it('re-reads the caller’s role in the class they moved to', async () => {
    // Owner of the first class, plain member of the second: the rights must not
    // carry over, and the banner must fall back to what the caller can open.
    getOne.mockImplementation(async (id: string) =>
      classPayload({ id, owner_user_id: id === 'g-1' ? 'u-caller' : 'u-somebody-else' })
    )

    const router = createTestRouter()
    const wrapper = await mountAt(router, '/classes/g-1/live')
    expect(reservedLinkLabels(wrapper)).toEqual([])

    await router.push('/classes/g-2/live')
    await flushPromises()

    expect(pageLinkLabels(wrapper)).toEqual(['Learners'])
    expect(router.currentRoute.value.path).toBe('/classes/g-2/members')
  })
})
