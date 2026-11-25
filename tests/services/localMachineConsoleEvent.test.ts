/**
 * A foreground script staged while the learner's console was held is typed when
 * their shell opens: the tab reports that opening on the agent socket, as
 * tt-backend reports a container console's.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// A fresh pty per shell, as the machine gives: a stream is read by one console.
const newPty = () => ({
  output: new ReadableStream<Uint8Array>(),
  write: vi.fn().mockResolvedValue(undefined),
  resize: vi.fn(),
  close: vi.fn().mockResolvedValue(undefined),
  ended: new Promise(() => {})
})
vi.mock('unkernel', () => ({
  checkSupport: async () => ({ ok: true, problems: [] }),
  createKernel: async () => ({ spawn: async () => newPty(), exec: vi.fn().mockResolvedValue({ exitCode: 0 }), stop: vi.fn().mockResolvedValue(undefined) })
}))

class FakeWebSocket {
  static OPEN = 1
  static instances: FakeWebSocket[] = []
  readyState = 0
  sent: string[] = []
  onopen: (() => void) | null = null
  onmessage: ((e: { data: string }) => void) | null = null
  onclose: (() => void) | null = null
  constructor(public url: string) { FakeWebSocket.instances.push(this) }
  send(data: string) { this.sent.push(data) }
  close() { this.readyState = 3 }
  open() { this.readyState = 1; this.onopen?.() }
}

import { openLocalConsole, setConsoleUser, startLocalAgent } from '../../src/services/domain/terminal/localMachine'

const opts = { distroUrl: '/x.erofs', worker: false }
const settle = () => new Promise(r => setTimeout(r, 0))

describe('the console opening, reported to the agent', () => {
  beforeEach(() => {
    FakeWebSocket.instances = []
    vi.stubGlobal('WebSocket', FakeWebSocket)
  })

  it('is sent when the shell opens while the agent is connected', async () => {
    const agent = startLocalAgent('run-1', 'local-1', 'tok', () => {}, opts)
    await settle()
    const socket = FakeWebSocket.instances[0]
    socket.open()

    setConsoleUser('local-1', 1000)
    openLocalConsole('local-1', 80, 24, undefined, opts)
    await settle()
    expect(socket.sent).toContain(JSON.stringify({ event: 'console_attached' }))
    agent.stop()
  })

  it('is sent when the agent connects to a shell already open', async () => {
    setConsoleUser('local-2', 1000)
    openLocalConsole('local-2', 80, 24, undefined, opts)
    await settle()
    const agent = startLocalAgent('run-2', 'local-2', 'tok', () => {}, opts)
    await settle()
    const socket = FakeWebSocket.instances[0]
    socket.open()
    expect(socket.sent).toContain(JSON.stringify({ event: 'console_attached' }))
    agent.stop()
  })
})
