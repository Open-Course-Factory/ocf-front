/**
 * Tests for the GroupDetails tab bar as an assistive technology and a keyboard
 * user meet it.
 *
 * The bar renders as plain buttons, which announce as "button, Overview" with no
 * hint that there are several of them, which one is showing, or that arrow keys
 * do anything. This pins the WAI-ARIA tabs pattern on it:
 *
 *   - the bar is a `tablist`, each button a `tab`, the content a `tabpanel`
 *     labelled by the tab that opened it;
 *   - `aria-selected` tracks the shown tab, and only that tab points at the panel
 *     (the others' panels are not in the document);
 *   - roving tabindex: one tab in the page's tab sequence, the rest at -1;
 *   - Left / Right / Home / End move focus, wrapping, and skip the placeholder
 *     tabs reserved while the caller's group role is still loading;
 *   - activation stays manual — arrowing to a tab must not open it, because each
 *     panel fetches its own data on mount.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { ref } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'

const getOne = vi.fn()
const axiosGet = vi.fn()

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
  useCurrentUserStore: () => ({ userId: 'u-owner' })
}))

vi.mock('../../src/composables/useFeatureFlags', () => ({
  useFeatureFlags: () => ({ isEnabled: () => true })
}))

vi.mock('../../src/composables/useAdminViewMode', () => ({
  useAdminViewMode: () => ({ isAdmin: ref(false) })
}))

vi.mock('../../src/services/domain/user', () => ({
  userService: { getUserById: vi.fn().mockResolvedValue({ id: 'u-owner' }) }
}))

import GroupDetails from '../../src/components/Pages/GroupDetails.vue'

/** A promise this test resolves on demand, standing in for the members fetch. */
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(r => { resolve = r })
  return { promise, resolve }
}

function groupPayload(ownerUserId: string) {
  return {
    id: 'g-1',
    name: 'g-1',
    display_name: 'Promo A',
    owner_user_id: ownerUserId,
    organization_id: '',
    max_members: 30,
    member_count: 3,
    is_active: true,
    is_expired: false,
    is_full: false,
    sub_groups: []
  }
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

async function mountGroupDetails() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/class-groups', component: { template: '<div />' } },
      { path: '/class-groups/:id', component: GroupDetails },
      { path: '/terminal-sessions', component: { template: '<div />' } }
    ]
  })
  await router.push('/class-groups/g-1')
  await router.isReady()

  const wrapper = mount(GroupDetails, {
    // Real focus moves are the point of this file, so the tree must be in the document.
    attachTo: document.body,
    global: {
      plugins: [createTestI18n(), router],
      stubs: {
        GroupOverviewTab: true,
        GroupMembersManager: true,
        GroupSettingsTab: true,
        GroupCommandHistory: true,
        GroupScenariosTab: true,
        GroupAnalyticsTab: true,
        ClassLiveView: true,
        AdminBadge: true
      }
    }
  })
  await flushPromises()
  return wrapper
}

function tabs(wrapper: VueWrapper) {
  return wrapper.findAll('[role="tab"]')
}

/** The tab label, minus the Members tab's trailing member-count badge. */
function label(tab: { text(): string }) {
  return tab.text().replace(/\s*\d+$/, '').trim()
}

function focusedLabel(wrapper: VueWrapper) {
  const active = document.activeElement
  const match = tabs(wrapper).find(t => t.element === active)
  return match ? label(match) : null
}

describe('GroupDetails tab bar — WAI-ARIA tabs pattern', () => {
  let wrapper: VueWrapper | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    // Owner: every tab is live from the first render, no reserved placeholders.
    getOne.mockResolvedValue(groupPayload('u-owner'))
    axiosGet.mockImplementation((url: string) =>
      url === '/group-members'
        ? Promise.resolve({ data: [{ id: 'm-1', user_id: 'u-owner', role: 'owner' }] })
        : Promise.resolve({ data: {} })
    )
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
  })

  it('exposes the bar as a labelled tablist of tabs', async () => {
    wrapper = await mountGroupDetails()

    const tablist = wrapper.find('[role="tablist"]')
    expect(tablist.exists()).toBe(true)
    expect(tablist.attributes('aria-label')).toBeTruthy()
    expect(tabs(wrapper)).toHaveLength(7)
  })

  it('marks only the shown tab as selected', async () => {
    wrapper = await mountGroupDetails()

    const selected = tabs(wrapper).filter(t => t.attributes('aria-selected') === 'true')
    expect(selected.map(label)).toEqual(['Overview'])

    await tabs(wrapper).find(t => label(t) === 'Analytics')!.trigger('click')

    expect(
      tabs(wrapper).filter(t => t.attributes('aria-selected') === 'true').map(label)
    ).toEqual(['Analytics'])
  })

  it('names the panel after the tab that opened it, and points that tab back at it', async () => {
    wrapper = await mountGroupDetails()

    const panel = wrapper.find('[role="tabpanel"]')
    const overview = tabs(wrapper).find(t => label(t) === 'Overview')!

    expect(panel.attributes('aria-labelledby')).toBe(overview.attributes('id'))
    expect(overview.attributes('aria-controls')).toBe(panel.attributes('id'))

    // Unselected tabs have no panel in the document, so they must not claim one.
    const members = tabs(wrapper).find(t => label(t) === 'Members')!
    expect(members.attributes('aria-controls')).toBeUndefined()
  })

  it('keeps exactly one tab in the page tab sequence, on the shown tab', async () => {
    wrapper = await mountGroupDetails()

    const inSequence = tabs(wrapper).filter(t => t.attributes('tabindex') === '0')
    expect(inSequence.map(label)).toEqual(['Overview'])

    await tabs(wrapper).find(t => label(t) === 'Settings')!.trigger('click')

    expect(
      tabs(wrapper).filter(t => t.attributes('tabindex') === '0').map(label)
    ).toEqual(['Settings'])
  })

  it('moves focus along the bar with Left and Right, wrapping at both ends', async () => {
    wrapper = await mountGroupDetails()
    const all = tabs(wrapper)
    const labels = all.map(label)

    ;(all[0].element as HTMLElement).focus()
    await all[0].trigger('keydown', { key: 'ArrowRight' })
    expect(focusedLabel(wrapper)).toBe(labels[1])

    await all[1].trigger('keydown', { key: 'ArrowLeft' })
    expect(focusedLabel(wrapper)).toBe(labels[0])

    // Left from the first tab wraps to the last, and Right from the last comes back.
    await all[0].trigger('keydown', { key: 'ArrowLeft' })
    expect(focusedLabel(wrapper)).toBe(labels[labels.length - 1])

    await all[labels.length - 1].trigger('keydown', { key: 'ArrowRight' })
    expect(focusedLabel(wrapper)).toBe(labels[0])
  })

  it('jumps to the first and last tab with Home and End', async () => {
    wrapper = await mountGroupDetails()
    const all = tabs(wrapper)
    const labels = all.map(label)

    ;(all[3].element as HTMLElement).focus()
    await all[3].trigger('keydown', { key: 'End' })
    expect(focusedLabel(wrapper)).toBe(labels[labels.length - 1])

    await all[labels.length - 1].trigger('keydown', { key: 'Home' })
    expect(focusedLabel(wrapper)).toBe(labels[0])
  })

  it('does not open a tab merely by arrowing onto it', async () => {
    wrapper = await mountGroupDetails()
    const all = tabs(wrapper)

    ;(all[0].element as HTMLElement).focus()
    await all[0].trigger('keydown', { key: 'ArrowRight' })
    await flushPromises()

    // Focus moved, but Overview is still the open panel: each panel loads its own
    // data on mount, so arrowing across the bar must not fire eight fetches.
    expect(focusedLabel(wrapper)).toBe('Members')
    expect(
      tabs(wrapper).filter(t => t.attributes('aria-selected') === 'true').map(label)
    ).toEqual(['Overview'])
  })
})

describe('GroupDetails tab bar — placeholder tabs reserved while the role loads', () => {
  let wrapper: VueWrapper | null = null
  let memberFetch: ReturnType<typeof deferred<{ data: unknown }>>

  beforeEach(() => {
    vi.clearAllMocks()
    // Owned by somebody else: the caller's rights can only come from the roster,
    // so the manager-only tabs render as disabled placeholders meanwhile.
    getOne.mockResolvedValue(groupPayload('u-somebody-else'))
    memberFetch = deferred<{ data: unknown }>()
    axiosGet.mockImplementation((url: string) =>
      url === '/group-members' ? memberFetch.promise : Promise.resolve({ data: {} })
    )
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
  })

  it('marks the reserved tabs aria-disabled and skips them when arrowing', async () => {
    wrapper = await mountGroupDetails()

    const reserved = tabs(wrapper).filter(t => t.attributes('aria-disabled') === 'true')
    expect(reserved.map(label)).toEqual([
      'Scenarios', 'Live class', 'Analytics', 'Command History', 'Settings'
    ])

    const all = tabs(wrapper)
    ;(all[1].element as HTMLElement).focus()   // Members, the last usable tab
    await all[1].trigger('keydown', { key: 'ArrowRight' })

    // Wraps back to Overview rather than landing on a placeholder.
    expect(focusedLabel(wrapper)).toBe('Overview')
  })

  it('brings the reserved tabs into arrow navigation once the role resolves', async () => {
    wrapper = await mountGroupDetails()

    memberFetch.resolve({ data: [{ id: 'm-1', user_id: 'u-owner', role: 'manager' }] })
    await flushPromises()

    expect(tabs(wrapper).filter(t => t.attributes('aria-disabled') === 'true')).toHaveLength(0)

    const all = tabs(wrapper)
    ;(all[1].element as HTMLElement).focus()
    await all[1].trigger('keydown', { key: 'ArrowRight' })

    expect(focusedLabel(wrapper)).toBe('Scenarios')
  })
})
