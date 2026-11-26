/**
 * A local run has one learner shell, as a container's console reattaches to
 * the same shell: consoles (the page's, a popped-out window's) come and go,
 * the shell and what runs in it stay, and a console that attaches is shown
 * what the shell printed recently.
 */
import { describe, it, expect, vi } from 'vitest'
import { SharedShell } from '../../src/services/domain/terminal/sharedShell'
import type { ConsolePty, PtyEnd } from '../../src/services/domain/terminal/localConsoleSocket'

const text = (b: Uint8Array | undefined) => new TextDecoder().decode(b)

function fakeShell() {
  let push!: ReadableStreamDefaultController<Uint8Array>
  let end!: (e: PtyEnd) => void
  const pty = {
    output: new ReadableStream<Uint8Array>({ start(c) { push = c } }),
    write: vi.fn().mockResolvedValue(undefined),
    resize: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
    ended: new Promise<PtyEnd>(r => { end = r })
  }
  return {
    pty: pty satisfies ConsolePty,
    print: (s: string) => push.enqueue(new TextEncoder().encode(s)),
    exit: (code: number) => { push.close(); end({ type: 'exit', code }) }
  }
}

describe('SharedShell', () => {
  it('keeps one shell across consoles, and shows a new console what it printed', async () => {
    const shell = fakeShell()
    const spawn = vi.fn(async () => shell.pty)
    const shared = new SharedShell(spawn)

    const first = await shared.attach(80, 24)
    shell.print('cd /tmp\r\n/tmp$ ')
    const firstReader = first.output.getReader()
    expect(text((await firstReader.read()).value)).toBe('cd /tmp\r\n/tmp$ ')
    await first.close()
    expect(shell.pty.close).not.toHaveBeenCalled()
    expect(await first.ended).toEqual({ type: 'closed' })

    const second = await shared.attach(100, 30)
    expect(spawn).toHaveBeenCalledTimes(1)
    expect(shell.pty.resize).toHaveBeenCalledWith(100, 30)
    const reader = second.output.getReader()
    expect(text((await reader.read()).value)).toBe('cd /tmp\r\n/tmp$ ')
    shell.print('more')
    expect(text((await reader.read()).value)).toBe('more')

    await second.write('ls\r')
    expect(shell.pty.write).toHaveBeenCalledWith('ls\r')
  })

  it('hands the shell to the console that attaches last', async () => {
    const shell = fakeShell()
    const shared = new SharedShell(async () => shell.pty)
    const first = await shared.attach(80, 24)
    await shared.attach(80, 24)
    expect(await first.ended).toEqual({ type: 'closed' })
  })

  it('ends the console when the shell exits, and starts a new shell for the next', async () => {
    const shells = [fakeShell(), fakeShell()]
    const spawn = vi.fn(async () => shells[spawn.mock.calls.length - 1].pty)
    const shared = new SharedShell(spawn)
    const view = await shared.attach(80, 24)
    shells[0].print('bye')
    shells[0].exit(0)
    const reader = view.output.getReader()
    expect(text((await reader.read()).value)).toBe('bye')
    expect(await reader.read()).toMatchObject({ done: true })
    expect(await view.ended).toEqual({ type: 'exit', code: 0 })

    await shared.attach(80, 24)
    expect(spawn).toHaveBeenCalledTimes(2)
  })

  it('keeps only the latest output to show', async () => {
    const shell = fakeShell()
    const shared = new SharedShell(async () => shell.pty, 8)
    const view = await shared.attach(80, 24)
    shell.print('0123456789ABCDEF')
    await view.output.getReader().read()
    await view.close()
    const next = await shared.attach(80, 24)
    expect(text((await next.output.getReader().read()).value)).toBe('89ABCDEF')
  })
})
