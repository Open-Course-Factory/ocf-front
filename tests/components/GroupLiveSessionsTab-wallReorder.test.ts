/**
 * Tests for reordering the live-session tiles on the class wall by drag & drop.
 *
 * Trainers can drag the tiles (`.live-sessions-tile`) to arrange the wall to
 * their liking; the order is remembered per group. Contracts pinned here are all
 * on RENDERED DOM ORDER, not internal refs.
 *
 * --- Seam contract the dev must honor (pinned by these tests) ---
 *   - Each `.live-sessions-tile` carries a stable `data-session-id="<session_id>"`
 *     attribute (the only per-tile identifier the wall exposes for assertions).
 *   - The custom order is persisted per group in localStorage under the key
 *     `ocf-live-wall-order-<groupId>` as a JSON array of session_ids.
 *   - On render, sessions appear in the stored order; session_ids absent from the
 *     stored order (new sessions) append at the end in server order; stored ids no
 *     longer present are ignored.
 *   - Native HTML5 drag & drop: dragstart on the source tile, drop on the target
 *     tile reorders the wall and persists the new order. The exact insertion index
 *     is the dev's choice; the pinned invariant is: after a drop the persisted
 *     array equals the rendered DOM order, the id set is preserved, and the order
 *     actually changed. `dragover.prevent` is required for drop to fire in a real
 *     browser (not asserted here). A shared dataTransfer stub is passed to both
 *     events so an impl using either a state ref OR dataTransfer.setData/getData
 *     is honored.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { nextTick } from 'vue'

const getGroupLiveSessions = vi.fn()

vi.mock('../../src/services/domain/terminal/supervisionService', () => ({
  supervisionService: {
    getGroupLiveSessions: (...args: unknown[]) => getGroupLiveSessions(...args)
  },
  buildSuperviseWsUrl: () => 'ws://test/supervise'
}))

import GroupLiveSessionsTab from '../../src/components/Groups/GroupLiveSessionsTab.vue'

const GROUP_ID = 'grp-1'
const ORDER_KEY = `ocf-live-wall-order-${GROUP_ID}`

function sess(id: string) {
  return { session_id: id, user_id: `u-${id}`, user_name: `User ${id}` }
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

function mountTab(groupId: string = GROUP_ID) {
  return mount(GroupLiveSessionsTab, {
    props: { groupId, canSupervise: true },
    // Attached: the keyboard-reorder tests below assert on real focus.
    attachTo: document.body,
    global: {
      plugins: [createTestI18n()],
      stubs: { SupervisionViewer: true }
    }
  })
}

async function flushPromises() {
  await new Promise(resolve => setTimeout(resolve, 0))
  await nextTick()
}

function tileOrder(wrapper: ReturnType<typeof mountTab>): (string | undefined)[] {
  return wrapper.findAll('.live-sessions-tile').map(t => t.attributes('data-session-id'))
}

// Envelope-aware: the wall persists a { v: 1, order } envelope; a legacy bare array
// is still read for back-compat. Returns the order regardless of which shape is on disk.
function storedOrder(): string[] | null {
  const raw = localStorage.getItem(ORDER_KEY)
  if (!raw) return null
  const parsed = JSON.parse(raw)
  if (Array.isArray(parsed)) return parsed as string[]
  if (parsed && typeof parsed === 'object' && Array.isArray(parsed.order)) return parsed.order as string[]
  return null
}

// One shared dataTransfer instance so a setData-in-dragstart / getData-in-drop
// implementation sees a coherent payload across the two dispatched events.
function makeDataTransfer() {
  const store: Record<string, string> = {}
  return {
    setData: (k: string, v: string) => { store[k] = v },
    getData: (k: string) => store[k] || '',
    effectAllowed: '',
    dropEffect: ''
  }
}

describe('GroupLiveSessionsTab — wall drag & drop reorder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    getGroupLiveSessions.mockResolvedValue([sess('s1'), sess('s2'), sess('s3')])
  })

  it('renders tiles in the order stored in localStorage for the group', async () => {
    localStorage.setItem(ORDER_KEY, JSON.stringify(['s3', 's1', 's2']))

    const wrapper = mountTab()
    await flushPromises()

    expect(tileOrder(wrapper)).toEqual(['s3', 's1', 's2'])
  })

  it('appends session_ids absent from the stored order after the ordered ones, in server order', async () => {
    localStorage.setItem(ORDER_KEY, JSON.stringify(['s2']))

    const wrapper = mountTab()
    await flushPromises()

    expect(tileOrder(wrapper)).toEqual(['s2', 's1', 's3'])
  })

  it('renders in server order when localStorage has no stored order', async () => {
    const wrapper = mountTab()
    await flushPromises()

    expect(tileOrder(wrapper)).toEqual(['s1', 's2', 's3'])
  })

  it('reorders the rendered tiles and persists the new order after a drag & drop', async () => {
    const wrapper = mountTab()
    await flushPromises()
    expect(tileOrder(wrapper)).toEqual(['s1', 's2', 's3'])

    const tiles = wrapper.findAll('.live-sessions-tile')
    const source = tiles[0] // s1
    const target = tiles[2] // s3
    const dataTransfer = makeDataTransfer()

    await source.trigger('dragstart', { dataTransfer })
    await target.trigger('dragover', { dataTransfer })
    await target.trigger('drop', { dataTransfer })
    await flushPromises()

    const after = tileOrder(wrapper)
    // Order actually changed: the dragged tile left its original first slot.
    expect(after[0]).not.toBe('s1')
    // No tile lost or duplicated.
    expect([...after].sort()).toEqual(['s1', 's2', 's3'])
    // Persisted order mirrors exactly what is rendered.
    expect(storedOrder()).toEqual(after)
  })

  // GroupDetails keys the tab container on the group id, so moving to another group
  // remounts this tab rather than swapping the prop underneath it. What matters is
  // that the fresh mount reads the new group's roster and its own stored order —
  // never the previous group's.
  it('loads the new group’s roster and stored order when remounted for another group', async () => {
    localStorage.setItem(ORDER_KEY, JSON.stringify(['s3', 's1', 's2']))
    localStorage.setItem('ocf-live-wall-order-g2', JSON.stringify(['s2', 's3', 's1']))

    const first = mountTab()
    await flushPromises()
    expect(tileOrder(first)).toEqual(['s3', 's1', 's2'])
    expect(getGroupLiveSessions).toHaveBeenCalledWith(GROUP_ID)
    first.unmount()

    const second = mountTab('g2')
    await flushPromises()

    expect(getGroupLiveSessions).toHaveBeenCalledWith('g2')
    expect(tileOrder(second)).toEqual(['s2', 's3', 's1'])
  })

  it('preserves the custom order across a subsequent loadSessions returning the same set in server order', async () => {
    localStorage.setItem(ORDER_KEY, JSON.stringify(['s3', 's1', 's2']))

    const wrapper = mountTab()
    await flushPromises()
    expect(tileOrder(wrapper)).toEqual(['s3', 's1', 's2'])

    // Simulate the 30s poll re-fetch (same code path as the Refresh button).
    const refreshBtn = wrapper.findAll('button').find(b => b.text().toLowerCase().includes('refresh'))
    await refreshBtn!.trigger('click')
    await flushPromises()

    expect(tileOrder(wrapper)).toEqual(['s3', 's1', 's2'])
  })
})

/**
 * Keyboard equivalent of the drag & drop above: a trainer who cannot drag must
 * still be able to arrange the wall. Tiles take focus and move with Ctrl + Left /
 * Right; the persisted order is the same one drag & drop writes.
 */
describe('GroupLiveSessionsTab — wall keyboard reorder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    getGroupLiveSessions.mockResolvedValue([sess('s1'), sess('s2'), sess('s3')])
  })

  it('makes every tile focusable and names its learner and position', async () => {
    const wrapper = mountTab()
    await flushPromises()

    const tiles = wrapper.findAll('.live-sessions-tile')
    expect(tiles.map(t => t.attributes('tabindex'))).toEqual(['0', '0', '0'])

    const label = tiles[1].attributes('aria-label') || ''
    expect(label).toContain('User s2')
    expect(label).toContain('2')
    expect(label).toContain('3')

    wrapper.unmount()
  })

  it('moves the focused tile right with Ctrl + ArrowRight and persists the new order', async () => {
    const wrapper = mountTab()
    await flushPromises()
    expect(tileOrder(wrapper)).toEqual(['s1', 's2', 's3'])

    await wrapper.findAll('.live-sessions-tile')[0]
      .trigger('keydown', { key: 'ArrowRight', ctrlKey: true })
    await flushPromises()

    expect(tileOrder(wrapper)).toEqual(['s2', 's1', 's3'])
    expect(storedOrder()).toEqual(['s2', 's1', 's3'])

    wrapper.unmount()
  })

  it('moves the focused tile left with Ctrl + ArrowLeft', async () => {
    const wrapper = mountTab()
    await flushPromises()

    await wrapper.findAll('.live-sessions-tile')[2]
      .trigger('keydown', { key: 'ArrowLeft', ctrlKey: true })
    await flushPromises()

    expect(tileOrder(wrapper)).toEqual(['s1', 's3', 's2'])

    wrapper.unmount()
  })

  it('keeps focus on the tile it just moved', async () => {
    const wrapper = mountTab()
    await flushPromises()

    const first = wrapper.findAll('.live-sessions-tile')[0]
    ;(first.element as HTMLElement).focus()
    await first.trigger('keydown', { key: 'ArrowRight', ctrlKey: true })
    await flushPromises()

    // s1 is now second; the trainer can keep nudging it without re-finding it.
    const focused = document.activeElement as HTMLElement
    expect(focused.getAttribute('data-session-id')).toBe('s1')
    expect(tileOrder(wrapper)[1]).toBe('s1')

    wrapper.unmount()
  })

  it('does nothing at the ends of the wall, and nothing without the Ctrl modifier', async () => {
    const wrapper = mountTab()
    await flushPromises()

    const tiles = wrapper.findAll('.live-sessions-tile')
    await tiles[0].trigger('keydown', { key: 'ArrowLeft', ctrlKey: true })
    await tiles[2].trigger('keydown', { key: 'ArrowRight', ctrlKey: true })
    await flushPromises()

    expect(tileOrder(wrapper)).toEqual(['s1', 's2', 's3'])
    // Clamped, not wrapped, and nothing was written for a move that did not happen.
    expect(storedOrder()).toBeNull()

    // A bare arrow key belongs to the page (scrolling), not to the wall.
    await wrapper.findAll('.live-sessions-tile')[0].trigger('keydown', { key: 'ArrowRight' })
    await flushPromises()

    expect(tileOrder(wrapper)).toEqual(['s1', 's2', 's3'])
    expect(storedOrder()).toBeNull()

    wrapper.unmount()
  })
})
