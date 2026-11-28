/**
 * The machine asks the platform's Debian mirror with a key its tab chose at
 * boot, in the mirror's URL; the tab tells ocf-core that key over the agent,
 * and ocf-core opens the mirror only to it (the terminal id is no secret).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const booted: { net?: { backend: { routes: Record<string, string> } }, memoryMiB?: number }[] = []
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

import { startLocalAgent, setMachineRun, hostLocalRun } from '../../src/services/domain/terminal/localMachine'

// These runs are console ones.
for (const terminal of ['local-k1', 'local-k2', 'local-k3']) setMachineRun(terminal, { apps: null })

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

  // Its own hostname in production: a guest's `..` stays on a host that
  // serves the mirror alone, and its requests carry none of the app's cookies.
  it('is asked on the mirror\'s own host when the build names one', async () => {
    vi.stubEnv('VITE_LOCAL_MACHINE_MIRROR_URL', 'https://apt.example.test/')
    setMachineRun('local-k4', { apps: null })
    const agent = startLocalAgent('run-k4', 'local-k4', 'tok', () => {}, opts)
    await settle()
    FakeWebSocket.instances[0].open()

    const key = announcedKey(FakeWebSocket.instances[0])
    expect(booted[0].net!.backend.routes['deb.debian.org']).toBe(`https://apt.example.test/local-machine/apt/local-k4/${key}`)
    agent.stop()
    vi.unstubAllEnvs()
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

  // The scenario editor testing a check on a preview: nobody there reads the
  // run's apps, and its machine must boot all the same.
  it('boots a hosted run\'s machine without being told its apps', async () => {
    const release = hostLocalRun('run-h', 'local-h', 'tok')
    await vi.waitFor(() => expect(FakeWebSocket.instances).toHaveLength(1))
    expect(booted).toHaveLength(1)
    release()
  })

  it('boots a console machine with the memory ocf-core gives the run', async () => {
    setMachineRun('local-k5', { apps: null, memoryMiB: 1024 })
    const agent = startLocalAgent('run-k5', 'local-k5', 'tok', () => {}, opts)
    await vi.waitFor(() => expect(booted).toHaveLength(1))
    expect(booted[0].memoryMiB).toBe(1024)
    agent.stop()
  })

  it('boots a console machine with the run\'s CPUs and boot settings', async () => {
    const boot = { jit: false, verbose: true, display: true, sound: true, append: 'console=hvc0', console_hidden: true }
    setMachineRun('local-k6', { apps: null, cpus: 1, boot })
    const agent = startLocalAgent('run-k6', 'local-k6', 'tok', () => {}, opts)
    await vi.waitFor(() => expect(booted).toHaveLength(1))
    expect(booted[0]).toMatchObject({ cpus: 1, jit: false, cmdline: 'console=hvc0' })
    agent.stop()
  })
})
