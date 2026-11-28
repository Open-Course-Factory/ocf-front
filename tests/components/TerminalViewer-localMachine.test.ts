/**
 * A scenario run on a machine in the learner's browser opens its console on
 * that machine instead of a WebSocket to ocf-core. Everything after the
 * construction (handlers, resize frames, close codes) is the Incus path's, so
 * only the choice of socket is pinned here; LocalConsoleSocket's own tests pin
 * that it behaves like the WebSocket the viewer expects.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  }
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { sessionId: 'sess-test' }, query: {} }),
  useRouter: () => ({ push: vi.fn() }),
  createRouter: vi.fn(),
  createWebHistory: vi.fn(),
  RouterLink: { props: ['to'], template: '<a><slot /></a>' }
}))

vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: () => ({ secretToken: 'tok' })
}))

vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showError: vi.fn(),
    showSuccess: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn(),
    showConfirm: vi.fn().mockResolvedValue(true)
  })
}))

const mockStopSession = vi.fn().mockResolvedValue({})
const mockSyncSession = vi.fn().mockResolvedValue({})
vi.mock('../../src/services/domain/terminal/terminalService', () => ({
  terminalService: {
    syncSession: (...args: any[]) => mockSyncSession(...args),
    stopSession: (...args: any[]) => mockStopSession(...args)
  }
}))

vi.mock('@xterm/xterm', () => ({
  Terminal: class {
    open() {}
    loadAddon() {} attachCustomKeyEventHandler() {}
    dispose() {}
    onResize() {}
    onData() {}
    focus() {}
    reset() {}
    // Calls back at once, as xterm does once it has parsed what it was given.
    write(_data: string, done?: () => void) { done?.() }
    cols = 80
    rows = 24
    element = null
  }
}))
vi.mock('@xterm/addon-fit', () => ({ FitAddon: class { fit() {} dispose() {} } }))

const openLocalConsole = vi.fn()
const openRelayedConsole = vi.fn()
vi.mock('../../src/services/domain/terminal/localMachine', () => ({
  openLocalConsole: (...args: unknown[]) => openLocalConsole(...args),
  openRelayedConsole: (...args: unknown[]) => openRelayedConsole(...args)
}))

import TerminalViewer from '../../src/components/Terminal/TerminalViewer.vue'

class FakeWebSocket {
  static instances: FakeWebSocket[] = []
  static OPEN = 1

  onopen: (() => void) | null = null
  onclose: ((event: unknown) => void) | null = null
  onmessage: ((event: unknown) => void) | null = null
  onerror: ((event: unknown) => void) | null = null
  readyState = 1
  binaryType = 'arraybuffer'

  constructor(public url: string, public protocols: string[] = []) {
    FakeWebSocket.instances.push(this)
  }

  send() {}
  close() {
    this.readyState = 3
  }
}

// initializeTerminal() awaits a ResizeObserver callback before it opens the
// socket; jsdom never delivers one, so fire it as soon as observation starts.
class FakeResizeObserver {
  constructor(private callback: () => void) {}
  observe() {
    this.callback()
  }
  unobserve() {}
  disconnect() {}
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

/**
 * Mount a viewer and open its console socket.
 */
async function openConsole(props: Record<string, unknown> = {}) {
  setActivePinia(createPinia())
  const wrapper = mount(TerminalViewer, {
    props: {
      // `state` (not `status`) is the lifecycle field preConnectError reads;
      // anything else is treated as deleted and the viewer never connects.
      sessionInfo: {
        session_id: 'sess-test',
        state: 'running',
        expires_at: new Date(Date.now() + 3_600_000).toISOString()
      },
      autoConnect: true,
      ...props
    },
    global: {
      plugins: [createTestI18n()],
      stubs: {
        SettingsCard: { template: '<div><slot name="headerActions" /><slot /></div>' },
        Button: true,
        RecordingIndicator: true,
        SessionCountdown: true,
        // Surface the reason so the assertion reads what the learner is shown,
        // not which internal ref was set.
        TerminalEndStateOverlay: {
          props: ['reason', 'config'],
          emits: ['action'],
          // The secondary action carries no text, so the copy assertions above
          // read only title, body and primary label.
          template: '<div class="end-state" :data-reason="reason">{{ config.title }} — {{ config.body }} — {{ config.primary.label }}<button v-if="config.secondary" class="end-state-secondary" @click="$emit(\'action\', config.secondary.actionKey)"></button></div>'
        }
      }
    }
  })

  // The connect path awaits several dynamic imports and a ResizeObserver
  // callback, so the socket appears well after the first flush, and later
  // still on a loaded runner: wait on the socket, not on a number of ticks.
  await vi.waitFor(() => expect(FakeWebSocket.instances.length).toBeGreaterThan(0), { timeout: 5000 })

  const socket = FakeWebSocket.instances[FakeWebSocket.instances.length - 1]

  socket.onopen?.()
  await flushPromises()

  return { wrapper, socket }
}

/**
 * Mount a connected viewer, then close its socket with the given code —
 * the shape the browser delivers when tt-backend ends the console.
 */
async function closeSocketWith(code: number, props: Record<string, unknown> = {}) {
  const { wrapper, socket } = await openConsole(props)

  socket.onclose?.({ code, reason: '', target: socket })
  await flushPromises()
  await wrapper.vm.$nextTick()

  return wrapper
}


describe('TerminalViewer — local machine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    FakeWebSocket.instances = []
    vi.stubGlobal('WebSocket', FakeWebSocket)
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)
  })

  it('opens the console on the local machine, with the terminal size, and no WebSocket', async () => {
    const local = new FakeWebSocket('local')
    FakeWebSocket.instances = []
    openLocalConsole.mockReturnValue(local)
    setActivePinia(createPinia())
    const wrapper = mount(TerminalViewer, {
      props: {
        machine: 'local',
        sessionInfo: { session_id: 'sess-test', state: 'running', expires_at: new Date(Date.now() + 3_600_000).toISOString() }
      },
      global: { plugins: [createTestI18n()], stubs: { Button: true, RecordingIndicator: true, SessionCountdown: true } }
    })
    await vi.waitFor(() => expect(openLocalConsole).toHaveBeenCalled(), { timeout: 5000 })
    const [, cols, rows, outputDrained] = openLocalConsole.mock.calls[0]
    expect([cols, rows]).toEqual([80, 24])
    // Output backpressure follows xterm: the next chunk waits for its write callback.
    await expect(outputDrained()).resolves.toBeUndefined()
    expect(FakeWebSocket.instances).toEqual([])

    local.onopen?.()
    await flushPromises()
    expect(wrapper.text()).not.toContain('terminal.websocketError')
  })

  // A popped-out window shows the machine of the run page's tab, and says
  // so plainly when no tab of this browser runs it.
  it('reaches the run page\'s machine when relayed, and says when it is not open', async () => {
    const relayed = new FakeWebSocket('relayed')
    FakeWebSocket.instances = []
    openRelayedConsole.mockReturnValue(relayed)
    setActivePinia(createPinia())
    const wrapper = mount(TerminalViewer, {
      props: {
        machine: 'local',
        relayed: true,
        sessionInfo: { session_id: 'local-pop', state: 'running', expires_at: new Date(Date.now() + 3_600_000).toISOString() }
      },
      global: { plugins: [createTestI18n()], stubs: { Button: true, RecordingIndicator: true, SessionCountdown: true } }
    })
    await vi.waitFor(() => expect(openRelayedConsole).toHaveBeenCalled(), { timeout: 5000 })
    expect(openRelayedConsole.mock.calls[0][0]).toBe('local-pop')
    expect(openLocalConsole).not.toHaveBeenCalled()

    relayed.onclose?.({ code: 1006, reason: 'no_machine_in_this_browser', target: relayed })
    await flushPromises()
    expect(wrapper.text()).toContain('Open that page, then reconnect')
  })

  it('keeps the Incus console by default', async () => {
    const { socket } = await openConsole()
    expect(socket.url).toContain('/terminals/sess-test/console')
    expect(openLocalConsole).not.toHaveBeenCalled()
  })

  it('says plainly when the browser cannot start the machine, and does not retry behind the learner', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const local = new FakeWebSocket('local')
    FakeWebSocket.instances = []
    openLocalConsole.mockReturnValue(local)
    setActivePinia(createPinia())
    const wrapper = mount(TerminalViewer, {
      props: {
        machine: 'local',
        sessionInfo: { session_id: 'local-1', state: 'running', expires_at: new Date(Date.now() + 3_600_000).toISOString() }
      },
      global: { plugins: [createTestI18n()], stubs: { Button: true, RecordingIndicator: true, SessionCountdown: true } }
    })
    await vi.waitFor(() => expect(openLocalConsole).toHaveBeenCalled(), { timeout: 5000 })

    local.onclose?.({ code: 1006, reason: 'JSPI is not available', target: local })
    await flushPromises()
    await vi.advanceTimersByTimeAsync(10_000)

    expect(wrapper.text()).toContain('JSPI is not available')
    expect(openLocalConsole).toHaveBeenCalledTimes(1)
    expect(mockSyncSession).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('does not ask ocf-core to sync a local session after its console closes', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const local = new FakeWebSocket('local')
    FakeWebSocket.instances = []
    openLocalConsole.mockReturnValue(local)
    setActivePinia(createPinia())
    mount(TerminalViewer, {
      props: {
        machine: 'local',
        sessionInfo: { session_id: 'local-1', state: 'running', expires_at: new Date(Date.now() + 3_600_000).toISOString() }
      },
      global: { plugins: [createTestI18n()], stubs: { Button: true, RecordingIndicator: true, SessionCountdown: true } }
    })
    await vi.waitFor(() => expect(openLocalConsole).toHaveBeenCalled(), { timeout: 5000 })
    local.onopen?.()
    await flushPromises()

    local.onclose?.({ code: 1000, reason: '', target: local })
    await vi.advanceTimersByTimeAsync(5_000)
    expect(mockSyncSession).not.toHaveBeenCalled()
    vi.useRealTimers()
  })
})
