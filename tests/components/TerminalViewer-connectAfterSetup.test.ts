/**
 * The console waits for the scenario's setup (ocf-front #367).
 *
 * tt-backend starts the console shell on the first console WebSocket, and the
 * setup script runs beside it, so a console opened during setup starts a shell
 * that misses what the setup adds to its rc files (aliases, PATH). The page
 * holds the connection with autoConnect=false while the run is provisioning;
 * the viewer connects once it turns true.
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
    loadAddon() {} attachCustomKeyEventHandler() {}
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

function mountViewer(autoConnect: boolean) {
  setActivePinia(createPinia())
  return mount(TerminalViewer, {
    props: {
      sessionInfo: {
        session_id: 'sess-test',
        state: 'running',
        expires_at: new Date(Date.now() + 3_600_000).toISOString()
      },
      autoConnect
    },
    global: {
      plugins: [createI18n({ legacy: false, locale: 'en', fallbackLocale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })],
      stubs: {
        SettingsCard: { template: '<div><slot name="headerActions" /><slot /></div>' },
        Button: true,
        RecordingIndicator: true,
        SessionCountdown: true,
        TerminalEndStateOverlay: true
      }
    }
  })
}

describe('TerminalViewer — connecting once setup is over', () => {
  beforeEach(() => {
    FakeWebSocket.instances = []
    vi.stubGlobal('WebSocket', FakeWebSocket)
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)
  })

  it('opens no console while the connection is held', async () => {
    mountViewer(false)
    await flushPromises()
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(FakeWebSocket.instances).toHaveLength(0)
  })

  it('connects when the hold is lifted', async () => {
    const wrapper = mountViewer(false)
    await flushPromises()

    await wrapper.setProps({ autoConnect: true })

    await vi.waitFor(() => expect(FakeWebSocket.instances).toHaveLength(1), { timeout: 5000 })
  })
})
