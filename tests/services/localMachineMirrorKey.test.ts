/**
 * The machine asks the platform's Debian mirror with a key its tab chose at
 * boot, in the mirror's URL; the tab tells ocf-core that key over the agent,
 * and ocf-core opens the mirror only to it (the terminal id is no secret).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const booted: { net?: { backend: { routes: Record<string, string> } } }[] = []
vi.mock('unkernel', () => ({
  checkSupport: async () => ({ ok: true, problems: [] }),
  createKernel: async (spec: (typeof booted)[number]) => {
    booted.push(spec)
    return { spawn: vi.fn(), exec: vi.fn().mockResolvedValue({ exitCode: 0 }), stop: vi.fn().mockResolvedValue(undefined) }
  }
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

import { startLocalAgent } from '../../src/services/domain/terminal/localMachine'

const opts = { distroUrl: '/x.erofs', worker: false }
const settle = () => new Promise(r => setTimeout(r, 0))

function announcedKey(socket: FakeWebSocket): string | undefined {
  return socket.sent.map(m => JSON.parse(m)).find(m => m.event === 'mirror_key')?.key
}

describe("the Debian mirror's key", () => {
  beforeEach(() => {
    FakeWebSocket.instances = []
    booted.length = 0
    vi.stubGlobal('WebSocket', FakeWebSocket)
  })

  it('is in the machine\'s mirror route, and the agent announces the same', async () => {
    const agent = startLocalAgent('run-k1', 'local-k1', 'tok', () => {}, opts)
    await settle()
    FakeWebSocket.instances[0].open()

    const key = announcedKey(FakeWebSocket.instances[0])
    expect(key).toMatch(/^[0-9a-f-]{36}$/)
    expect(booted[0].net!.backend.routes['deb.debian.org']).toBe(`${window.location.origin}/local-machine/apt/local-k1/${key}`)
    agent.stop()
  })

  it('is new for each machine', async () => {
    const first = startLocalAgent('run-k2', 'local-k2', 'tok', () => {}, opts)
    await settle()
    FakeWebSocket.instances[0].open()
    first.stop()
    const second = startLocalAgent('run-k3', 'local-k3', 'tok', () => {}, opts)
    await settle()
    FakeWebSocket.instances[1].open()

    expect(announcedKey(FakeWebSocket.instances[0])).not.toBe(announcedKey(FakeWebSocket.instances[1]))
    second.stop()
  })
})
