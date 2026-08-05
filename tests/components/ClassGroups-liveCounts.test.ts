/**
 * Group cards show how many learners are connected right now (issue #309).
 *
 * The counts come from the SAME cross-group response the "Mes classes" console
 * renders — one request for the whole page, keyed by group id — because a card
 * that fetched its own count would put one request per card on a page that can
 * list dozens of classes.
 *
 * A card for a group the viewer does not teach is not in that response and must
 * show no counter at all; the slot still occupies its room so the card does not
 * reflow when the counts land.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}))

vi.mock('vue-router', () => {
  const router = {
    push: vi.fn(),
    replace: vi.fn(),
    beforeEach: vi.fn(),
    afterEach: vi.fn(),
    onError: vi.fn(),
    isReady: vi.fn().mockResolvedValue(undefined),
    addRoute: vi.fn(),
    getRoutes: () => [],
    resolve: (to: unknown) => ({ href: '#', ...(to as object) }),
    currentRoute: { value: { query: {}, params: {}, meta: {} } },
  }
  return {
    useRouter: () => router,
    useRoute: () => ({ query: {}, params: {}, meta: {} }),
    createRouter: () => router,
    createWebHistory: () => ({}),
    createWebHashHistory: () => ({}),
  }
})

const groupEntities: any[] = []
vi.mock('../../src/stores/classGroups', () => ({
  useClassGroupsStore: () => ({
    entities: groupEntities,
    fieldList: [],
    loadEntities: vi.fn().mockResolvedValue([]),
  }),
}))

vi.mock('../../src/stores/organizations', () => ({
  useOrganizationsStore: () => ({
    organizations: [],
    getOrganizationById: () => undefined,
  }),
}))

import axios from 'axios'
import ClassGroups from '../../src/components/Pages/ClassGroups.vue'

const mockGet = vi.mocked(axios.get)

const messages = {
  en: {
    classGroups: {
      organization_id: 'Organization',
      parent_group_id: 'Parent group',
      member_count: 'Current members',
      statusActive: 'Active',
      statusInactive: 'Inactive',
      statusFull: 'FULL',
      statusExpired: 'EXPIRED',
      liveSessions: 'Learners connected right now',
    },
  },
  fr: { classGroups: {} },
}

function group(id: string, displayName: string) {
  return {
    id,
    name: id,
    display_name: displayName,
    member_count: 3,
    max_members: 30,
    is_active: true,
  }
}

function managedClass(groupId: string, liveSessionCount: number) {
  return {
    group_id: groupId,
    name: groupId,
    display_name: groupId,
    caller_role: 'owner',
    is_active: true,
    is_expired: false,
    member_count: 3,
    live_session_count: liveSessionCount,
    assignments: [],
  }
}

async function mountGroups(groups: any[], managedClasses: any[]) {
  groupEntities.length = 0
  groupEntities.push(...groups)
  setActivePinia(createPinia())
  mockGet.mockResolvedValue({ data: managedClasses })

  const wrapper = mount(ClassGroups, {
    global: {
      plugins: [createI18n({
        legacy: false,
        locale: 'en',
        fallbackLocale: 'en',
        messages,
        missingWarn: false,
        fallbackWarn: false,
      })],
      stubs: {
        Entity: {
          props: ['entityName', 'entityStore'],
          template: `
            <div class="entity-stub">
              <div
                v-for="entity in entityStore.entities"
                :key="entity.id"
                class="entity-row"
                :data-entity-id="entity.id"
              >
                <slot name="card" :entity="entity" />
              </div>
            </div>
          `,
        },
      },
    },
  })
  await flushPromises()
  return wrapper
}

function cardOf(wrapper: any, groupId: string) {
  return wrapper.find(`[data-entity-id="${groupId}"]`)
}

describe('Groups page — live session counts on the cards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  it('shows the live count on a class the viewer teaches', async () => {
    const wrapper = await mountGroups(
      [group('grp-1', 'Promo 2026')],
      [managedClass('grp-1', 4)],
    )

    expect(cardOf(wrapper, 'grp-1').find('[data-test="live-count"]').text()).toBe('4')
  })

  it('fetches the counts for every card in a single request', async () => {
    await mountGroups(
      [group('grp-1', 'A'), group('grp-2', 'B'), group('grp-3', 'C')],
      [managedClass('grp-1', 1), managedClass('grp-2', 0), managedClass('grp-3', 2)],
    )

    expect(mockGet).toHaveBeenCalledTimes(1)
    expect(mockGet).toHaveBeenCalledWith('/teacher/groups')
  })

  it('shows no counter on a group the viewer does not teach', async () => {
    const wrapper = await mountGroups(
      [group('mine', 'Mine'), group('theirs', 'Theirs')],
      [managedClass('mine', 2)],
    )

    expect(cardOf(wrapper, 'theirs').find('[data-test="live-count"]').exists()).toBe(false)
    expect(cardOf(wrapper, 'mine').find('[data-test="live-count"]').text()).toBe('2')
  })

  it('keeps the counter slot in place on every card so nothing reflows', async () => {
    const wrapper = await mountGroups(
      [group('mine', 'Mine'), group('theirs', 'Theirs')],
      [managedClass('mine', 2)],
    )

    expect(cardOf(wrapper, 'mine').find('[data-test="live-slot"]').exists()).toBe(true)
    expect(cardOf(wrapper, 'theirs').find('[data-test="live-slot"]').exists()).toBe(true)
  })

  it('marks the counter live only above zero', async () => {
    const wrapper = await mountGroups(
      [group('busy', 'Busy'), group('quiet', 'Quiet')],
      [managedClass('busy', 3), managedClass('quiet', 0)],
    )

    expect(cardOf(wrapper, 'busy').find('[data-test="live-slot"]').classes()).toContain('is-live')
    expect(cardOf(wrapper, 'quiet').find('[data-test="live-slot"]').classes()).not.toContain('is-live')
    expect(cardOf(wrapper, 'quiet').find('[data-test="live-count"]').text()).toBe('0')
  })

  it('leaves every card counterless when the teacher manages nothing', async () => {
    const wrapper = await mountGroups([group('grp-1', 'A')], [])

    expect(cardOf(wrapper, 'grp-1').find('[data-test="live-count"]').exists()).toBe(false)
    expect(cardOf(wrapper, 'grp-1').find('[data-test="live-slot"]').exists()).toBe(true)
  })
})
