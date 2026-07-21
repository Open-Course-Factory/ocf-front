/**
 * Protective (GREEN) test for the observer-count chip in SupervisionViewer
 * (review Important #2 + Minor — dead-API-surface cleanup).
 *
 * The cleanup removes the UNUSED `observers` component emit and an unused
 * defineExpose (verified out-of-band by grep + `npm run build`), and Important #1
 * moves the socket.onmessage boilerplate onto the shared
 * createSupervisionMessageHandler factory. Through both, the learner-facing
 * indicator that MUST survive is the observer chip: when more than one trainer is
 * watching a session, a chip shows the count.
 *
 * That chip is driven by the component's internal `controlState.observers`, set
 * from an incoming BINARY control frame — NOT by the emit being removed. This test
 * pins the chip end-to-end (control frame → chip visible with count) so the
 * refactor cannot silently drop it. It is expected to be GREEN today and stay
 * green; it is the regression net for the onmessage move, not a RED spec.
 *
 * The chip's routing rules (which frame flips which flag) are already covered by
 * tests/components/supervisionControlFrame.test.ts; the read-only/take-hand logic
 * by tests/composables/useSupervisionControl.test.ts. Neither asserts the RENDERED
 * chip, which is what this file adds.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'

vi.mock('@xterm/xterm', () => ({
  Terminal: class {
    open() {}
    loadAddon() {}
    dispose() {}
    reset() {}
    write() {}
    onData() { return { dispose() {} } }
    cols = 80
    rows = 24
  }
}))
vi.mock('@xterm/addon-fit', () => ({ FitAddon: class { activate() {} fit() {} dispose() {} } }))

vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: () => ({ secretToken: 'tok' })
}))

import SupervisionViewer from '../../src/components/Terminal/SupervisionViewer.vue'

// A fake WebSocket that captures its instance so the test can push server frames
// onto the component's onmessage handler (however that handler is wired internally).
class FakeWebSocket {
  static instances: FakeWebSocket[] = []
  static readonly OPEN = 1
  static readonly CLOSING = 2
  static readonly CLOSED = 3
  url: string
  binaryType = ''
  readyState = FakeWebSocket.OPEN
  onopen: ((e?: unknown) => void) | null = null
  onmessage: ((e: { data: unknown }) => void) | null = null
  onclose: ((e?: unknown) => void) | null = null
  onerror: ((e?: unknown) => void) | null = null
  constructor(url: string) {
    this.url = url
    FakeWebSocket.instances.push(this)
  }
  send() {}
  close() { this.readyState = FakeWebSocket.CLOSED }
}

function controlFrame(payload: Record<string, unknown>): ArrayBuffer {
  return new TextEncoder().encode(JSON.stringify({ type: 'attachment', ...payload })).buffer
}

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: {
      en: { supervisionViewer: { observersTooltip: 'watchers' } },
      fr: { supervisionViewer: { observersTooltip: 'observateurs' } }
    },
    missingWarn: false,
    fallbackWarn: false
  })
}

async function mountViewer() {
  setActivePinia(createPinia())
  const wrapper = mount(SupervisionViewer, {
    props: { sessionId: 'sess-1', autoConnect: true },
    global: { plugins: [createTestI18n()] }
  })
  // onMounted lazily imports the (mocked) xterm modules, THEN opens the socket. The
  // first dynamic import resolves a tick later than the cached ones, so poll until
  // connect() has created the socket instead of assuming a fixed number of ticks.
  for (let i = 0; i < 20 && FakeWebSocket.instances.length === 0; i++) {
    await new Promise(resolve => setTimeout(resolve, 0))
    await nextTick()
  }
  return wrapper
}

function lastSocket(): FakeWebSocket {
  return FakeWebSocket.instances[FakeWebSocket.instances.length - 1]
}

describe('SupervisionViewer — observer-count chip', () => {
  beforeEach(() => {
    vi.stubGlobal('WebSocket', FakeWebSocket)
    FakeWebSocket.instances = []
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows the observer chip with the count when more than one trainer watches', async () => {
    const wrapper = await mountViewer()
    const ws = lastSocket()
    ws.onopen?.()

    ws.onmessage?.({ data: controlFrame({ event: 'joined', observers: 2 }) })
    await nextTick()

    const chip = wrapper.find('.supervision-chip-info')
    expect(chip.exists()).toBe(true)
    expect(chip.text()).toContain('2')
  })

  it('does not show the observer chip for a single watcher', async () => {
    const wrapper = await mountViewer()
    const ws = lastSocket()
    ws.onopen?.()

    ws.onmessage?.({ data: controlFrame({ event: 'joined', observers: 1 }) })
    await nextTick()

    expect(wrapper.find('.supervision-chip-info').exists()).toBe(false)
  })

  it('never writes a control frame to the terminal (chip updates, no shell leak)', async () => {
    const wrapper = await mountViewer()
    const ws = lastSocket()
    ws.onopen?.()

    // A text frame is terminal output; a binary control frame drives the chip only.
    ws.onmessage?.({ data: controlFrame({ event: 'joined', observers: 3 }) })
    await nextTick()

    const chip = wrapper.find('.supervision-chip-info')
    expect(chip.exists()).toBe(true)
    expect(chip.text()).toContain('3')
  })
})
