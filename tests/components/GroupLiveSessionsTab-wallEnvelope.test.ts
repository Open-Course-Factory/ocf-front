/**
 * RED tests for the versioned + validated wall-order localStorage envelope
 * (review Minor).
 *
 * Today the wall persists `ocf-live-wall-order-<groupId>` as a BARE JSON array and
 * parses it back with no shape check: any non-array garbage under that key (a stale
 * value, a value written by a future/older build, a corrupted entry) flows straight
 * into `applyStoredOrder`, which iterates it — a non-iterable value throws during
 * render and blanks the wall.
 *
 * The new contract pins a self-describing, validated envelope:
 *   - writes persist `{ v: 1, order: string[] }` (not a bare array);
 *   - a legacy BARE array is still read correctly ONCE, then rewritten as v1 on the
 *     next persist (transparent migration);
 *   - any shape that is not a valid envelope / legacy array is IGNORED (fall back to
 *     server order) and never throws.
 *
 * These extend GroupLiveSessionsTab-wallReorder.test.ts (same seam: tiles carry
 * `data-session-id`, order lives under `ocf-live-wall-order-<groupId>`). The
 * decode-agnostic `readOrder()` helper below reads BOTH the legacy bare array and
 * the v1 envelope, so it keeps working across the migration.
 *
 * NOTE for frontend-dev: the existing wallReorder test asserts the persisted value
 * with a bare `JSON.parse` (`storedOrder()` there). When you switch the write format
 * to the envelope, update that helper to be envelope-aware too (read `.order`) — that
 * is part of the green step, not a weakening of the test.
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

function mountTab() {
  return mount(GroupLiveSessionsTab, {
    props: { groupId: GROUP_ID, canSupervise: true },
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

// The raw persisted value, parsed but NOT interpreted.
function rawStored(): unknown {
  const raw = localStorage.getItem(ORDER_KEY)
  return raw === null ? null : JSON.parse(raw)
}

// Decode-agnostic order reader: understands the v1 envelope AND a legacy bare array.
function readOrder(): string[] | null {
  const parsed = rawStored()
  if (parsed === null) return null
  if (Array.isArray(parsed)) return parsed as string[]
  if (parsed && typeof parsed === 'object' && Array.isArray((parsed as any).order)) {
    return (parsed as any).order as string[]
  }
  return null
}

function makeDataTransfer() {
  const store: Record<string, string> = {}
  return {
    setData: (k: string, v: string) => { store[k] = v },
    getData: (k: string) => store[k] || '',
    effectAllowed: '',
    dropEffect: ''
  }
}

async function dragFirstOntoLast(wrapper: ReturnType<typeof mountTab>) {
  const tiles = wrapper.findAll('.live-sessions-tile')
  const dataTransfer = makeDataTransfer()
  await tiles[0].trigger('dragstart', { dataTransfer })
  await tiles[tiles.length - 1].trigger('dragover', { dataTransfer })
  await tiles[tiles.length - 1].trigger('drop', { dataTransfer })
  await flushPromises()
}

describe('GroupLiveSessionsTab — versioned wall-order envelope', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    getGroupLiveSessions.mockResolvedValue([sess('s1'), sess('s2'), sess('s3')])
  })

  it('persists the order as a { v: 1, order } envelope (not a bare array) after a drag & drop', async () => {
    const wrapper = mountTab()
    await flushPromises()

    await dragFirstOntoLast(wrapper)

    const stored = rawStored()
    // Self-describing envelope, not a bare array.
    expect(Array.isArray(stored)).toBe(false)
    expect(stored).toMatchObject({ v: 1 })
    expect(Array.isArray((stored as any).order)).toBe(true)
    // The envelope's order mirrors exactly what is rendered.
    expect((stored as any).order).toEqual(tileOrder(wrapper))
  })

  it('renders in the order carried by a v1 envelope', async () => {
    localStorage.setItem(ORDER_KEY, JSON.stringify({ v: 1, order: ['s3', 's1', 's2'] }))

    const wrapper = mountTab()
    await flushPromises()

    expect(tileOrder(wrapper)).toEqual(['s3', 's1', 's2'])
  })

  it('migrates a legacy bare-array value: honors it on read, then rewrites it as a v1 envelope on the next persist', async () => {
    // Old builds wrote a bare array under this key.
    localStorage.setItem(ORDER_KEY, JSON.stringify(['s3', 's1', 's2']))

    const wrapper = mountTab()
    await flushPromises()
    // Read migration: the legacy value is still honored.
    expect(tileOrder(wrapper)).toEqual(['s3', 's1', 's2'])

    await dragFirstOntoLast(wrapper)

    // Write migration: the next persist upgrades storage to the v1 envelope.
    const stored = rawStored()
    expect(Array.isArray(stored)).toBe(false)
    expect(stored).toMatchObject({ v: 1 })
    expect((stored as any).order).toEqual(tileOrder(wrapper))
  })

  it.each([
    ['a bare number', JSON.stringify(42)],
    ['a foreign object with no order field', JSON.stringify({ foo: 'bar' })],
    ['an envelope whose order is missing', JSON.stringify({ v: 1 })],
    ['an envelope whose order is not an array', JSON.stringify({ v: 1, order: 99 })],
  ])('ignores %s and falls back to server order without throwing', async (_label, rawValue) => {
    localStorage.setItem(ORDER_KEY, rawValue)

    const wrapper = mountTab()
    await flushPromises()

    // Garbage is ignored → server order renders, nothing thrown.
    expect(tileOrder(wrapper)).toEqual(['s1', 's2', 's3'])
  })

  it('leaves malformed garbage in place rather than crashing, but still renders the wall', async () => {
    localStorage.setItem(ORDER_KEY, JSON.stringify({ v: 1, order: { not: 'an array' } }))

    const wrapper = mountTab()
    await flushPromises()

    expect(tileOrder(wrapper)).toEqual(['s1', 's2', 's3'])
    // Re-reading order after render must not throw either.
    expect(() => readOrder()).not.toThrow()
  })
})
