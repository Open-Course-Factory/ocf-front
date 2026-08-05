/**
 * Tests for ClassLiveView — the merged "Classe en direct" tab (#310), which
 * replaced the pair of tabs a teacher used to alternate between.
 *
 * The contracts a teacher would notice:
 *   - both representations of the class are one button apart, and only one is
 *     mounted at a time (leaving the wall must stop the tiles streaming);
 *   - the eye on a learner's row lands on THAT learner's tile, which is where
 *     taking the hand lives — the wall's focused viewer owns that control, so
 *     the row does not duplicate it;
 *   - `?view=wall` opens on the tiles, so the classes console can link straight
 *     to them, and the last view used on a class is remembered per class.
 *
 * The wall is stubbed by a stand-in that renders the props it was handed, so
 * the assertions stay on what ends up on screen.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createMemoryHistory, type Router } from 'vue-router'

const getGroupLiveProgress = vi.fn()

vi.mock('../../src/services/domain/scenario', () => ({
  teacherService: {
    getGroupLiveProgress: (...args: unknown[]) => getGroupLiveProgress(...args)
  }
}))

import ClassLiveView from '../../src/components/Groups/ClassLiveView.vue'

/**
 * Stands in for the supervision wall: same props, and it shows which learner it
 * was told to open on, which is the only part of its behaviour this file is
 * about.
 */
const WallStub = {
  props: ['groupId', 'canSupervise', 'initialFocusSessionId'],
  template: '<div class="wall-stub" :data-focus="initialFocusSessionId">wall of {{ groupId }}</div>'
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

function learnerRow() {
  return {
    user_id: 'u-1',
    user_name: 'Léa Simon',
    connected: true,
    idle: false,
    terminal_session_id: 'sess-42',
    assignments: [
      {
        assignment_id: 'a-1',
        scenario_id: 'sc-1',
        scenario_title: 'Docker — the basics',
        status: 'in_progress',
        current_step: 3,
        total_steps: 6,
        hints_used: 0,
        current_step_elapsed_seconds: 120
      }
    ]
  }
}

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/class-groups/:id', component: { template: '<div />' } }]
  })
}

async function mountLiveView(router: Router, location = '/class-groups/g-1?tab=live') {
  await router.push(location)
  await router.isReady()

  const wrapper = mount(ClassLiveView, {
    props: { groupId: 'g-1', canSupervise: true },
    global: {
      plugins: [createTestI18n(), router],
      stubs: { GroupLiveSessionsTab: WallStub }
    }
  })
  await flushPromises()
  return wrapper
}

function viewButtons(wrapper: Awaited<ReturnType<typeof mountLiveView>>) {
  return wrapper.findAll('[role="tab"]')
}

describe('ClassLiveView — two representations, one tab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    getGroupLiveProgress.mockResolvedValue([learnerRow()])
  })

  it('opens on the progression table', async () => {
    const wrapper = await mountLiveView(createTestRouter())

    expect(wrapper.find('.ocf-prog-table').exists()).toBe(true)
    expect(wrapper.find('.wall-stub').exists()).toBe(false)
    expect(viewButtons(wrapper)[0].attributes('aria-selected')).toBe('true')
  })

  it('swaps one representation for the other, never showing both', async () => {
    const wrapper = await mountLiveView(createTestRouter())

    await viewButtons(wrapper)[1].trigger('click')
    await flushPromises()

    // `v-if`, not `v-show`: the table is gone, so the wall's tiles are the only
    // thing connected.
    expect(wrapper.find('.wall-stub').exists()).toBe(true)
    expect(wrapper.find('.ocf-prog-table').exists()).toBe(false)

    await viewButtons(wrapper)[0].trigger('click')
    await flushPromises()

    expect(wrapper.find('.wall-stub').exists()).toBe(false)
    expect(wrapper.find('.ocf-prog-table').exists()).toBe(true)
  })

  it('announces the switch as a tablist with the shown view selected', async () => {
    const wrapper = await mountLiveView(createTestRouter())

    const tablist = wrapper.find('[role="tablist"]')
    expect(tablist.attributes('aria-label')).toBeTruthy()
    expect(viewButtons(wrapper)).toHaveLength(2)

    await viewButtons(wrapper)[1].trigger('click')

    expect(viewButtons(wrapper).map(b => b.attributes('aria-selected'))).toEqual(['false', 'true'])
    expect(wrapper.find('[role="tabpanel"]').exists()).toBe(true)
  })
})

describe('ClassLiveView — from a row to that learner’s terminal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    getGroupLiveProgress.mockResolvedValue([learnerRow()])
  })

  it('opens the wall on the learner whose terminal the teacher asked to watch', async () => {
    const wrapper = await mountLiveView(createTestRouter())

    await wrapper.find('.ocf-prog-icon-btn').trigger('click')
    await flushPromises()

    const wall = wrapper.find('.wall-stub')
    expect(wall.exists()).toBe(true)
    expect(wall.attributes('data-focus')).toBe('sess-42')
  })

  it('forgets the watched learner once the teacher is back on the table', async () => {
    const wrapper = await mountLiveView(createTestRouter())

    await wrapper.find('.ocf-prog-icon-btn').trigger('click')
    await flushPromises()
    await viewButtons(wrapper)[0].trigger('click')
    await flushPromises()
    await viewButtons(wrapper)[1].trigger('click')
    await flushPromises()

    // Going to the wall on purpose shows the wall, not whoever was watched last.
    expect(wrapper.find('.wall-stub').attributes('data-focus')).toBeUndefined()
  })
})

describe('ClassLiveView — landing on the right view', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    getGroupLiveProgress.mockResolvedValue([learnerRow()])
  })

  it('opens straight on the tiles when the link asked for the wall', async () => {
    const wrapper = await mountLiveView(createTestRouter(), '/class-groups/g-1?tab=live&view=wall')

    expect(wrapper.find('.wall-stub').exists()).toBe(true)
    expect(wrapper.find('.ocf-prog-table').exists()).toBe(false)
  })

  it('puts the chosen view in the URL without stacking history entries', async () => {
    const router = createTestRouter()
    const wrapper = await mountLiveView(router)
    const before = router.currentRoute.value.fullPath

    await viewButtons(wrapper)[1].trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.query.view).toBe('wall')

    router.back()
    await flushPromises()

    // `replace`, so Back leaves the class instead of walking back through the
    // representations that were looked at.
    expect(router.currentRoute.value.fullPath).not.toBe(before)
  })

  it('follows the URL when the teacher uses browser back and forward', async () => {
    const router = createTestRouter()
    const wrapper = await mountLiveView(router)

    await router.push('/class-groups/g-1?tab=live&view=wall')
    await flushPromises()

    expect(wrapper.find('.wall-stub').exists()).toBe(true)
  })

  it('remembers the last view used on this class', async () => {
    const first = await mountLiveView(createTestRouter())
    await viewButtons(first)[1].trigger('click')
    await flushPromises()
    first.unmount()

    const second = await mountLiveView(createTestRouter())

    expect(second.find('.wall-stub').exists()).toBe(true)
  })

  it('remembers a view arrived at through a link, not only one clicked', async () => {
    const first = await mountLiveView(createTestRouter(), '/class-groups/g-1?tab=live&view=wall')
    first.unmount()

    const second = await mountLiveView(createTestRouter())

    expect(second.find('.wall-stub').exists()).toBe(true)
  })

  it('remembers per class, not once for all of them', async () => {
    const first = await mountLiveView(createTestRouter())
    await viewButtons(first)[1].trigger('click')
    await flushPromises()
    first.unmount()

    const router = createTestRouter()
    await router.push('/class-groups/g-2?tab=live')
    await router.isReady()
    const other = mount(ClassLiveView, {
      props: { groupId: 'g-2', canSupervise: true },
      global: { plugins: [createTestI18n(), router], stubs: { GroupLiveSessionsTab: WallStub } }
    })
    await flushPromises()

    expect(other.find('.ocf-prog-table').exists()).toBe(true)
  })

  it('ignores a corrupted stored preference instead of showing neither view', async () => {
    localStorage.setItem('ocf-class-live-view-g-1', '{not json')

    const wrapper = await mountLiveView(createTestRouter())

    expect(wrapper.find('.ocf-prog-table').exists()).toBe(true)
  })
})
