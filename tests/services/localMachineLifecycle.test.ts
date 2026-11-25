/**
 * One machine per run's terminal. The agent names the machine it serves, so
 * ocf-core can tell a reload (a new, empty machine) from a reconnect, and the
 * tab acts on what ocf-core answers: rebuild a lost run, stand aside for
 * another tab, stop the machine of an ended run.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const kernels: { stop: ReturnType<typeof vi.fn>; spawn: ReturnType<typeof vi.fn>; exec: ReturnType<typeof vi.fn> }[] = []
vi.mock('unkernel', () => ({
  checkSupport: async () => ({ ok: true, problems: [] }),
  createKernel: async () => {
    const kernel = {
      spawn: vi.fn(async () => ({
        output: new ReadableStream<Uint8Array>(),
        write: vi.fn().mockResolvedValue(undefined),
        resize: vi.fn(),
        close: vi.fn().mockResolvedValue(undefined),
        ended: new Promise(() => {})
      })),
      exec: vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0, signal: null }),
      stop: vi.fn().mockResolvedValue(undefined)
    }
    kernels.push(kernel)
    return kernel
  }
}))

class FakeWebSocket {
  static OPEN = 1
  static instances: FakeWebSocket[] = []
  readyState = 0
  sent: string[] = []
  onopen: (() => void) | null = null
  onmessage: ((e: { data: string }) => void) | null = null
  onclose: ((e: { code: number }) => void) | null = null
  constructor(public url: string) { FakeWebSocket.instances.push(this) }
  send(data: string) { this.sent.push(data) }
  close() { this.readyState = 3 }
  open() { this.readyState = 1; this.onopen?.() }
  closeWith(code: number) { this.readyState = 3; this.onclose?.({ code }) }
}

import { openLocalConsole, setConsoleUser, startLocalAgent, AGENT_CLOSE } from '../../src/services/domain/terminal/localMachine'

const opts = { distroUrl: '/x.erofs', worker: false }
const settle = () => vi.advanceTimersByTimeAsync(0)
const bootOf = (socket: FakeWebSocket) => new URL(socket.url, 'http://x').searchParams.get('boot')

describe('the machine of a local run', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    FakeWebSocket.instances = []
    kernels.length = 0
    vi.stubGlobal('WebSocket', FakeWebSocket)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('is one machine for the console and the agent of a terminal, named to ocf-core', async () => {
    setConsoleUser('local-a', undefined)
    openLocalConsole('local-a', 80, 24, undefined, opts).onopen = () => {}
    const agent = startLocalAgent('run-a', 'local-a', 'tok', () => {}, opts)
    await settle()
    expect(kernels).toHaveLength(1)
    expect(bootOf(FakeWebSocket.instances[0])).toBeTruthy()
    agent.stop()
  })

  it('is a new machine for another terminal, and the old one is stopped', async () => {
    const first = startLocalAgent('run-b', 'local-b1', 'tok', () => {}, opts)
    await settle()
    const firstBoot = bootOf(FakeWebSocket.instances[0])
    first.stop()

    const second = startLocalAgent('run-b', 'local-b2', 'tok', () => {}, opts)
    await settle()
    expect(kernels).toHaveLength(2)
    expect(kernels[0].stop).toHaveBeenCalled()
    expect(bootOf(FakeWebSocket.instances[1])).not.toBe(firstBoot)
    second.stop()
  })

  it('comes back as the same machine after a dropped connection', async () => {
    const onEnd = vi.fn()
    const agent = startLocalAgent('run-c', 'local-c', 'tok', onEnd, opts)
    await settle()
    FakeWebSocket.instances[0].open()
    FakeWebSocket.instances[0].closeWith(1006)
    await vi.advanceTimersByTimeAsync(3000)

    expect(FakeWebSocket.instances).toHaveLength(2)
    expect(bootOf(FakeWebSocket.instances[1])).toBe(bootOf(FakeWebSocket.instances[0]))
    expect(onEnd).not.toHaveBeenCalled()
    agent.stop()
  })

  for (const [code, reason] of [[AGENT_CLOSE.machineLost, 'lost'], [AGENT_CLOSE.otherTab, 'other_tab'], [AGENT_CLOSE.ended, 'ended']] as const) {
    it(`stops its machine and stops trying on close ${code} (${reason})`, async () => {
      const onEnd = vi.fn()
      startLocalAgent('run-d', `local-d-${code}`, 'tok', onEnd, opts)
      await settle()
      FakeWebSocket.instances[0].closeWith(code)
      await vi.advanceTimersByTimeAsync(10_000)

      expect(onEnd).toHaveBeenCalledWith(reason)
      expect(kernels.at(-1)!.stop).toHaveBeenCalled()
      expect(FakeWebSocket.instances).toHaveLength(1)
    })
  }

  // The image's default user has sudo without a password: a learner who is
  // not root could read every root-only file of the lab, or skip its
  // permission missions. Taken away before any console opens.
  it('takes away the passwordless sudo of the image before anything runs', async () => {
    const agent = startLocalAgent('run-e', 'local-e', 'tok', () => {}, opts)
    await settle()
    const [file, args, execOpts] = kernels.at(-1)!.exec.mock.calls[0]
    expect(file).toBe('sh')
    expect(args.join(' ')).toContain('NOPASSWD')
    expect(args.join(' ')).toContain('chmod u-s /usr/bin/sudo')
    expect(execOpts).toMatchObject({ user: 'root' })
    agent.stop()
  })

  it('opens the console as the run\'s user once the page knows it, as root without one', async () => {
    openLocalConsole('local-f', 80, 24, undefined, opts).onopen = () => {}
    await settle()
    expect(kernels.at(-1)!.spawn).not.toHaveBeenCalled()
    setConsoleUser('local-f', 1000)
    await settle()
    expect(kernels.at(-1)!.spawn.mock.calls[0][2]).toMatchObject({ user: 1000 })

    setConsoleUser('local-g', undefined)
    openLocalConsole('local-g', 80, 24, undefined, opts).onopen = () => {}
    await settle()
    expect(kernels.at(-1)!.spawn.mock.calls[0][2]).toMatchObject({ user: 'root' })
  })
})
