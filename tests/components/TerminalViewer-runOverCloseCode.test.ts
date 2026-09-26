/**
 * Tests for TerminalViewer's handling of the SIGKILLed-shell close code (4137).
 *
 * A crash-trap payload kills the learner's shell. tt-backend maps a non-zero
 * shell exit N to close code 4000+N, so that arrives as 4137, and ocf-core
 * abandons the scenario session server-side and stops the terminal. The viewer
 * must therefore show a non-recoverable "run over" end state — the ordinary
 * disconnect copy ("your environment is still running, Reconnect to pick up
 * where you left off") would be actively false, and every action behind it is
 * refused.
 *
 * The two guards that matter, both pinned below:
 *   - 4001 (a learner typing `exit 1`) must stay an ordinary exit. Widening the
 *     match to the 4000-4999 band would end a run every time someone exits
 *     their own shell. ocf-core's IsShellKilledCloseCode makes the same narrow
 *     check.
 *   - Only a crash-trap scenario ends. The browser receives 4137 for ANY
 *     SIGKILLed shell, but ocf-core only abandons the session when the
 *     scenario sets crash_traps, so the viewer gates on the same field. A
 *     scenario without traps — and a plain terminal — must keep the ordinary
 *     error, or the UI announces a run over while the session is still alive.
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
vi.mock('../../src/services/domain/terminal/terminalService', () => ({
  terminalService: {
    syncSession: vi.fn().mockResolvedValue({}),
    stopSession: (...args: any[]) => mockStopSession(...args)
  }
}))

vi.mock('@xterm/xterm', () => ({
  Terminal: class {
    open() {}
    loadAddon() {}
    dispose() {}
    onResize() {}
    onData() {}
    focus() {}
    reset() {}
    write() {}
    cols = 80
    rows = 24
    element = null
  }
}))
vi.mock('@xterm/addon-fit', () => ({ FitAddon: class { fit() {} dispose() {} } }))
vi.mock('@xterm/addon-attach', () => ({ AttachAddon: class { dispose() {} } }))

import TerminalViewer from '../../src/components/Terminal/TerminalViewer.vue'

class FakeWebSocket {
  static instances: FakeWebSocket[] = []
  static OPEN = 1

  // Vue makes plain class instances reactive when they are stored in a ref,
  // and the viewer's onclose guard compares `event.target !== socket.value`
  // by identity — a proxy would never match and every close would be ignored.
  // Reporting a non-plain type keeps this object raw, exactly like the real
  // host WebSocket.
  get [Symbol.toStringTag]() {
    return 'WebSocket'
  }
  onopen: (() => void) | null = null
  onclose: ((event: unknown) => void) | null = null
  onmessage: ((event: unknown) => void) | null = null
  onerror: ((event: unknown) => void) | null = null
  readyState = 1
  binaryType = 'arraybuffer'

  constructor(public url: string) {
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
 * Mount a connected viewer, then close its socket with the given code —
 * the shape the browser delivers when tt-backend ends the console.
 */
async function closeSocketWith(code: number, props: Record<string, unknown> = {}) {
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

  socket.onclose?.({ code, reason: '', target: socket })
  await flushPromises()
  await wrapper.vm.$nextTick()

  return wrapper
}

describe('TerminalViewer — SIGKILLed shell (close code 4137)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    FakeWebSocket.instances = []
    vi.stubGlobal('WebSocket', FakeWebSocket)
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)
  })

  it('shows the run-over end state for a crash-trap scenario', async () => {
    const wrapper = await closeSocketWith(4137, { hasScenario: true, scenarioCrashTraps: true })

    const endState = wrapper.find('.end-state')
    expect(endState.exists()).toBe(true)
    expect(endState.attributes('data-reason')).toBe('run_over')
    expect(endState.text()).toContain('Run Over')
  })

  it('offers relaunching rather than reconnecting — there is nothing left to reconnect to', async () => {
    const wrapper = await closeSocketWith(4137, { hasScenario: true, scenarioCrashTraps: true })

    expect(wrapper.find('.end-state').text()).toContain('Relaunch the scenario')
    expect(wrapper.html()).not.toContain('Reconnect')
  })

  it('does NOT end the run on 4001 — that is the learner typing `exit 1`', async () => {
    const wrapper = await closeSocketWith(4001, { hasScenario: true, scenarioCrashTraps: true })

    // 4001 stays an ordinary shell exit: it falls through to the generic exec
    // error, so no end-state overlay is rendered at all — and certainly not
    // the run-over one.
    expect(wrapper.find('.end-state').exists()).toBe(false)
    expect(wrapper.html()).not.toContain('Relaunch the scenario')
  })

  it('does NOT end the run for a scenario without crash traps', async () => {
    // The learner's shell was killed — an OOM kill, a trainer, anything — but
    // ocf-core only abandons crash-trap sessions, so this run is still alive
    // and saying otherwise would be a lie about recoverable state.
    const wrapper = await closeSocketWith(4137, { hasScenario: true, scenarioCrashTraps: false })

    expect(wrapper.find('.end-state').exists()).toBe(false)
    expect(wrapper.html()).not.toContain('Relaunch the scenario')
  })

  it('does NOT show scenario copy on a plain terminal, even on 4137', async () => {
    const wrapper = await closeSocketWith(4137, { hasScenario: false })

    expect(wrapper.find('.end-state').exists()).toBe(false)
    expect(wrapper.html()).not.toContain('Relaunch the scenario')
  })
})

/**
 * Close code 4300 ("session_stopped"): tt-backend closes the console this way
 * when the PLATFORM stops the session — the learner's Stop, an idle or TTL
 * auto-stop. It sits in the 4000-4999 band only by allocation; it is not a
 * shell exit status, so rendering it as "the terminal shell encountered an
 * error (code 300)" tells the learner their shell crashed when their run was
 * merely paused. It must read as a stop, and tell the page, which owns the
 * paused banner and its Resume.
 */
describe('TerminalViewer — session stopped by the platform (close code 4300)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    FakeWebSocket.instances = []
    vi.stubGlobal('WebSocket', FakeWebSocket)
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)
  })

  it('shows the stopped end state, not a shell error', async () => {
    const wrapper = await closeSocketWith(4300, { hasScenario: true })

    const endState = wrapper.find('.end-state')
    expect(endState.exists()).toBe(true)
    expect(endState.attributes('data-reason')).toBe('stopped')
    expect(wrapper.html()).not.toContain('encountered an error')
    expect(wrapper.html()).not.toContain('code 300')
  })

  it('tells the page the session was stopped, so it can offer Resume', async () => {
    const wrapper = await closeSocketWith(4300, { hasScenario: true })

    expect(wrapper.emitted('session-stopped')).toBeTruthy()
  })

  it('does the same on a plain terminal', async () => {
    const wrapper = await closeSocketWith(4300, { hasScenario: false })

    expect(wrapper.find('.end-state').attributes('data-reason')).toBe('stopped')
    expect(wrapper.html()).not.toContain('encountered an error')
  })

  it('leaves 4137 as it was: run over on a crash-trap scenario, not a stop', async () => {
    const wrapper = await closeSocketWith(4137, { hasScenario: true, scenarioCrashTraps: true })

    expect(wrapper.find('.end-state').attributes('data-reason')).toBe('run_over')
    expect(wrapper.emitted('session-stopped')).toBeFalsy()
  })

  it('leaves 4137 as it was without crash traps: an ordinary shell error', async () => {
    const wrapper = await closeSocketWith(4137, { hasScenario: true, scenarioCrashTraps: false })

    expect(wrapper.find('.end-state').exists()).toBe(false)
    expect(wrapper.html()).toContain('code 137')
    expect(wrapper.emitted('session-stopped')).toBeFalsy()
  })
})

/**
 * "End session" on the disconnect overlay stops the terminal from the viewer.
 * That is the same event as a platform stop as far as the page is concerned —
 * the run is paused and the page owns its Resume — so the viewer has to tell
 * the page, exactly as it does for close code 4300. Otherwise a scenario page
 * keeps a dead console with no paused banner.
 */
describe('TerminalViewer — ending the session from the disconnect overlay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStopSession.mockResolvedValue({})
    FakeWebSocket.instances = []
    vi.stubGlobal('WebSocket', FakeWebSocket)
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)
  })

  it('tells the page the session was stopped', async () => {
    // An abnormal close after the console was up: the disconnect end state.
    const wrapper = await closeSocketWith(1006, { hasScenario: true })
    expect(wrapper.find('.end-state').attributes('data-reason')).toBe('disconnected')
    expect(wrapper.emitted('session-stopped')).toBeFalsy()

    await wrapper.find('.end-state-secondary').trigger('click')
    await flushPromises()

    expect(mockStopSession).toHaveBeenCalledWith('sess-test')
    expect(wrapper.emitted('session-stopped')).toBeTruthy()
  })
})
