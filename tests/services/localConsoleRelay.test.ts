/**
 * A local run's machine lives in its run page's tab. A popped-out terminal
 * window gets a shell on that machine through the tab, over a same-origin
 * BroadcastChannel: one chunk of output in flight at a time, so a runaway
 * program waits for the window's screen as it does in the page.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { serveRelay, relayedPty, RELAY_NO_MACHINE } from '../../src/services/domain/terminal/localConsoleRelay'
import { fakePty } from '../helpers/fakePty'

const stops: (() => void)[] = []
afterEach(() => { while (stops.length) stops.pop()!() })

describe('the console relay', () => {
  it('gives the window a shell of the tab\'s machine: input, resize, output and its end', async () => {
    const shell = fakePty()
    const open = vi.fn(async () => shell.pty)
    stops.push(serveRelay('local-r1', open))

    const pty = await relayedPty('local-r1', 100, 30)
    expect(open).toHaveBeenCalledWith(100, 30)

    await pty.write('ls\r')
    pty.resize(120, 40)
    await vi.waitFor(() => expect(shell.pty.write).toHaveBeenCalledWith('ls\r'))
    await vi.waitFor(() => expect(shell.pty.resize).toHaveBeenCalledWith(120, 40))

    shell.push('hello')
    const reader = pty.output.getReader()
    const chunk = await reader.read()
    expect(new TextDecoder().decode(chunk.value)).toBe('hello')

    shell.end({ type: 'exit', code: 0 })
    expect(await reader.read()).toMatchObject({ done: true })
    expect(await pty.ended).toEqual({ type: 'exit', code: 0 })
  })

  it('reads the next chunk only when the window asks for it', async () => {
    let pulls = 0
    const pty = {
      ...fakePty().pty,
      output: new ReadableStream<Uint8Array>({
        pull(c) { pulls++; c.enqueue(new TextEncoder().encode(`chunk${pulls}`)) }
      }, { highWaterMark: 0 })
    }
    stops.push(serveRelay('local-r2', async () => pty))
    const relayed = await relayedPty('local-r2', 80, 24)
    const reader = relayed.output.getReader()

    expect(new TextDecoder().decode((await reader.read()).value)).toBe('chunk1')
    await new Promise(r => setTimeout(r, 20))
    expect(pulls).toBe(1)
    expect(new TextDecoder().decode((await reader.read()).value)).toBe('chunk2')
  })

  it('closes the tab\'s shell when the window closes its console', async () => {
    const shell = fakePty()
    stops.push(serveRelay('local-r3', async () => shell.pty))
    const pty = await relayedPty('local-r3', 80, 24)

    await pty.close()
    await vi.waitFor(() => expect(shell.pty.close).toHaveBeenCalled())
    expect(await pty.ended).toEqual({ type: 'closed' })
  })

  it('ends the window\'s console when the tab stops serving (the run page closed)', async () => {
    const shell = fakePty()
    const stop = serveRelay('local-r4', async () => shell.pty)
    const pty = await relayedPty('local-r4', 80, 24)

    stop()
    expect(await pty.ended).toEqual({ type: 'lost' })
  })

  it('fails when no tab has the machine, or the tab declines', async () => {
    await expect(relayedPty('local-nobody', 80, 24, 50)).rejects.toThrow(RELAY_NO_MACHINE)

    stops.push(serveRelay('local-r5', () => null))
    await expect(relayedPty('local-r5', 80, 24, 50)).rejects.toThrow(RELAY_NO_MACHINE)
  })
})
