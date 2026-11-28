/**
 * One machine per run's terminal. The agent names the machine it serves, so
 * ocf-core can tell a reload (a new, empty machine) from a reconnect, and the
 * tab acts on what ocf-core answers: rebuild a lost run, stand aside for
 * another tab, stop the machine of an ended run.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const bootOptions: unknown[] = []
type Exit = { kind: string; reason: string }
const kernels: { stop: ReturnType<typeof vi.fn>; spawn: ReturnType<typeof vi.fn>; exec: ReturnType<typeof vi.fn>; exit(e: Exit): void }[] = []
// What checkSupport says is missing, when the next boot is to fail.
let unsupported: string[] = []
vi.mock('unkernel', () => ({
  checkSupport: async () => ({ ok: unsupported.length === 0, problems: unsupported }),
  createKernel: async (opts: unknown) => {
    bootOptions.push(opts)
    let exit!: (e: Exit) => void
    const exited = new Promise<Exit>(r => { exit = r })
    const kernel = {
      exited,
      exit,
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

import { openLocalConsole, setConsoleUser, startLocalAgent, AGENT_CLOSE, setMachineRun } from '../../src/services/domain/terminal/localMachine'

// These runs are console ones.
for (const terminal of ['local-a', 'local-b1', 'local-b2', 'local-c', 'local-e', 'local-f', 'local-g', 'local-m', 'local-o', 'local-x1', 'local-x2', 'local-x3', 'local-x4']) setMachineRun(terminal, { apps: null })

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
    unsupported = []
  })

  // Plan rule 7: the learner reads the browser's reason at once, instead of
  // a build that times out a minute later.
  it('ends at once with the browser\'s reason when the machine cannot boot', async () => {
    unsupported = ['no JSPI']
    const onEnd = vi.fn()
    startLocalAgent('run-x1', 'local-x1', 'tok', onEnd, opts)
    await settle()
    expect(onEnd).toHaveBeenCalledWith('boot_failed', 'no JSPI')
    expect(FakeWebSocket.instances).toHaveLength(0)
  })

  it('ends when the machine dies, and lets ocf-core know the tab has let go', async () => {
    const onEnd = vi.fn()
    startLocalAgent('run-x2', 'local-x2', 'tok', onEnd, opts)
    await settle()
    FakeWebSocket.instances[0].open()
    kernels[0].exit({ kind: 'fatal', reason: 'out of memory' })
    await settle()
    expect(onEnd).toHaveBeenCalledWith('crashed', 'out of memory')
    expect(FakeWebSocket.instances[0].readyState).toBe(3)
  })

  it('tells a machine the learner shut down from one that died', async () => {
    const onEnd = vi.fn()
    startLocalAgent('run-x3', 'local-x3', 'tok', onEnd, opts)
    await settle()
    kernels[0].exit({ kind: 'halt', reason: 'power off' })
    await settle()
    expect(onEnd).toHaveBeenCalledWith('halted', 'power off')
  })

  it('says nothing when the tab stopped the machine itself', async () => {
    const onEnd = vi.fn()
    const agent = startLocalAgent('run-x4', 'local-x4', 'tok', onEnd, opts)
    await settle()
    agent.stop()
    kernels[0].exit({ kind: 'stopped', reason: 'stop()' })
    await settle()
    expect(onEnd).not.toHaveBeenCalled()
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

  // A reloaded tab may reach ocf-core before it has seen the old tab's
  // connection close: "open in another tab" is believed when it is said again.
  it('tries again when told the run is open in another tab, and believes it the third time', async () => {
    const onEnd = vi.fn()
    startLocalAgent('run-o', 'local-o', 'tok', onEnd, opts)
    await settle()
    FakeWebSocket.instances[0].open()
    FakeWebSocket.instances[0].closeWith(AGENT_CLOSE.otherTab)
    await vi.advanceTimersByTimeAsync(3000)
    FakeWebSocket.instances[1].open()
    FakeWebSocket.instances[1].closeWith(1006)
    await vi.advanceTimersByTimeAsync(3000)
    expect(onEnd).not.toHaveBeenCalled()

    // ocf-core refuses after the upgrade: each refused connection opens first.
    for (const i of [2, 3, 4]) {
      FakeWebSocket.instances[i].open()
      FakeWebSocket.instances[i].closeWith(AGENT_CLOSE.otherTab)
      if (i < 4) await vi.advanceTimersByTimeAsync(3000)
    }
    await vi.advanceTimersByTimeAsync(10_000)
    expect(onEnd).toHaveBeenCalledWith('other_tab')
    expect(FakeWebSocket.instances).toHaveLength(5)
  })

  for (const [code, reason] of [[AGENT_CLOSE.machineLost, 'lost'], [AGENT_CLOSE.ended, 'ended']] as const) {
    it(`stops its machine and stops trying on close ${code} (${reason})`, async () => {
      const onEnd = vi.fn()
      setMachineRun(`local-d-${code}`, { apps: null })
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

  // Plan rule 11: the machine reaches Debian's packages through the
  // platform's mirror, opened to its own terminal, and nothing else.
  it('boots with the platform\'s Debian mirror as its only network', async () => {
    const agent = startLocalAgent('run-m', 'local-m', 'tok', () => {}, opts)
    await settle()
    expect(bootOptions.at(-1)).toMatchObject({
      net: {
        kind: 'net',
        backend: { kind: 'wisp', routes: { 'deb.debian.org': expect.stringMatching(new RegExp(`^${window.location.origin}/local-machine/apt/local-m/[0-9a-f-]{36}$`)) } }
      }
    })
    agent.stop()
  })
})
