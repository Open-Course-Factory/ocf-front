/**
 * Issue #372: a learner's popup terminal (TerminalPage, no special props)
 * printed `{"type":"attachment","event":"joined",...}` when a trainer opened the
 * supervision wall. ocf-core, not the client, decides that a console carries
 * control frames, so every TerminalViewer must keep BINARY frames out of the
 * shell and still show the learner that they are being watched.
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
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } }
  }
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { sessionId: 'sess-test' }, query: {} }),
  useRouter: () => ({ push: vi.fn() }),
  createRouter: vi.fn(),
  createWebHistory: vi.fn()
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

vi.mock('../../src/services/domain/terminal/terminalService', () => ({
  terminalService: { syncSession: vi.fn().mockResolvedValue({}) }
}))

const written: string[] = []
vi.mock('@xterm/xterm', () => ({
  Terminal: class {
    open() {}
    loadAddon() {}
    attachCustomKeyEventHandler() {}
    dispose() {}
    onResize() {}
    onData() { return { dispose() {} } }
    focus() {}
    reset() {}
    write(data: string) { written.push(data) }
    cols = 80
    rows = 24
    element = null
  }
}))
vi.mock('@xterm/addon-fit', () => ({ FitAddon: class { fit() {} dispose() {} } }))

import TerminalViewer from '../../src/components/Terminal/TerminalViewer.vue'

class FakeWebSocket {
  static instances: FakeWebSocket[] = []
  static OPEN = 1
  // Keeps Vue from wrapping the socket in a reactive proxy, like a real WebSocket.
  get [Symbol.toStringTag]() {
    return 'WebSocket'
  }
  onopen: (() => void) | null = null
  onclose: ((event: unknown) => void) | null = null
  onmessage: ((event: unknown) => void) | null = null
  onerror: ((event: unknown) => void) | null = null
  readyState = 1
  binaryType = 'blob'
  constructor(public url: string, public protocols: string[] = []) {
    FakeWebSocket.instances.push(this)
  }
  send() {}
  close() { this.readyState = 3 }
}

// initializeTerminal() waits for a ResizeObserver callback that jsdom never delivers.
class FakeResizeObserver {
  constructor(private callback: () => void) {}
  observe() { this.callback() }
  unobserve() {}
  disconnect() {}
}

describe('TerminalViewer control frames (#372)', () => {
  beforeEach(() => {
    written.length = 0
    FakeWebSocket.instances = []
    vi.stubGlobal('WebSocket', FakeWebSocket)
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)
  })

  it('keeps a binary control frame out of the shell and shows the watched indicator', async () => {
    setActivePinia(createPinia())
    // Mounted the way TerminalPage (the popup) mounts it.
    const wrapper = mount(TerminalViewer, {
      props: {
        sessionId: 'sess-test',
        sessionInfo: { session_id: 'sess-test', state: 'running', expires_at: new Date(Date.now() + 3_600_000).toISOString() },
        autoConnect: true
      },
      global: {
        plugins: [createI18n({ legacy: false, locale: 'en', messages: { en: {} }, missingWarn: false, fallbackWarn: false })],
        stubs: { Button: true, RecordingIndicator: true, SessionCountdown: true, TerminalEndStateOverlay: true }
      }
    })
    await vi.waitFor(() => expect(FakeWebSocket.instances.length).toBeGreaterThan(0), { timeout: 5000 })
    const socket = FakeWebSocket.instances[FakeWebSocket.instances.length - 1]
    socket.onopen?.()
    await flushPromises()

    const joined = '{"type":"attachment","event":"joined","observers":1,"writers":1,"attachment_id":"att-3","cols":110,"rows":44}'
    socket.onmessage?.({ data: new TextEncoder().encode(joined).buffer })
    socket.onmessage?.({ data: 'ls\r\n' })
    await flushPromises()

    expect(written.join('')).not.toContain('"type":"attachment"')
    expect(written).toContain('ls\r\n')
    expect(wrapper.find('.supervision-chip').exists()).toBe(true)
  })
})
