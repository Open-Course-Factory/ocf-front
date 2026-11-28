/**
 * LocalConsoleSocket puts a pty of a machine running in the browser behind the
 * part of the WebSocket surface TerminalViewer uses, so the viewer drives a
 * local machine exactly as it drives an Incus console: same handlers, same
 * resize frames, same close codes as tt-backend sends.
 */
import { describe, it, expect, vi } from 'vitest'
import { LocalConsoleSocket, type ConsolePty, type PtyEnd } from '../../src/services/domain/terminal/localConsoleSocket'

function deferred<T>() {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

const enc = new TextEncoder()

// A pty whose output the test feeds chunk by chunk, counting how often the
// socket pulls, and whose end the test decides.
function fakePty() {
  let controller!: ReadableStreamDefaultController<Uint8Array>
  const ended = deferred<PtyEnd>()
  let pulls = 0
  const pty = {
    output: new ReadableStream<Uint8Array>({
      start(c) { controller = c },
      pull() { pulls++ }
    }, { highWaterMark: 0 }),
    write: vi.fn().mockResolvedValue(undefined),
    resize: vi.fn(),
    close: vi.fn(async () => {
      ended.resolve({ type: 'closed' })
      try { controller.close() } catch { /* already closed */ }
    }),
    ended: ended.promise
  } satisfies ConsolePty
  return {
    pty,
    push: (text: string | Uint8Array) => controller.enqueue(typeof text === 'string' ? enc.encode(text) : text),
    end: (end: PtyEnd) => { controller.close(); ended.resolve(end) },
    get pulls() { return pulls }
  }
}

const settle = () => new Promise(r => setTimeout(r, 0))

function openSocket(f = fakePty(), yieldToPage = () => Promise.resolve()) {
  const socket = new LocalConsoleSocket(() => Promise.resolve(f.pty), yieldToPage)
  const events: { type: string; target: unknown; data?: unknown; code?: number; reason?: string }[] = []
  socket.onopen = (e) => events.push({ type: 'open', target: e.target })
  socket.onmessage = (e) => events.push({ type: 'message', target: e.target, data: e.data })
  socket.onerror = (e) => events.push({ type: 'error', target: e.target })
  socket.onclose = (e) => events.push({ type: 'close', target: e.target, code: e.code, reason: e.reason })
  return { socket, events, f }
}

describe('LocalConsoleSocket', () => {
  it('connects like a WebSocket: CONNECTING, then OPEN with an open event whose target is the socket', async () => {
    const { socket, events } = openSocket()
    expect(socket.readyState).toBe(WebSocket.CONNECTING)
    await settle()
    expect(socket.readyState).toBe(WebSocket.OPEN)
    expect(events).toEqual([{ type: 'open', target: socket }])
  })

  it('delivers the pty output as text messages, UTF-8 split across chunks included', async () => {
    const { events, f } = openSocket()
    await settle()
    const bytes = enc.encode('é\r\n')
    f.push(bytes.slice(0, 1))
    f.push(bytes.slice(1))
    await settle()
    const text = events.filter(e => e.type === 'message').map(e => e.data).join('')
    expect(text).toBe('é\r\n')
    expect(events.every(e => e.type !== 'message' || typeof e.data === 'string')).toBe(true)
  })

  it('reads the next chunk only after the page had its turn (output backpressure)', async () => {
    const turn = deferred<void>()
    const yieldToPage = vi.fn(() => turn.promise)
    const { events, f } = openSocket(fakePty(), yieldToPage)
    await settle()
    f.push('a')
    f.push('b')
    f.push('c')
    await settle()
    expect(events.filter(e => e.type === 'message').map(e => e.data)).toEqual(['a'])
    turn.resolve()
    await settle()
    expect(events.filter(e => e.type === 'message').map(e => e.data)).toEqual(['a', 'b', 'c'])
  })

  it('types text frames into the pty', async () => {
    const { socket, f } = openSocket()
    await settle()
    socket.send('ls\r')
    expect(f.pty.write).toHaveBeenCalledWith('ls\r')
  })

  it('turns the viewer\'s binary resize frame into a pty resize', async () => {
    const { socket, f } = openSocket()
    await settle()
    socket.send(new TextEncoder().encode(JSON.stringify({ type: 'resize', cols: 120, rows: 40 })))
    expect(f.pty.resize).toHaveBeenCalledWith(120, 40)
    expect(f.pty.write).not.toHaveBeenCalled()
  })

  it('ignores binary frames that are not a valid resize', async () => {
    const { socket, f } = openSocket()
    await settle()
    socket.send(new TextEncoder().encode('{"type":"resize","cols":0,"rows":40}'))
    socket.send(new TextEncoder().encode('not json'))
    socket.send(new TextEncoder().encode('{"type":"other"}').buffer)
    expect(f.pty.resize).not.toHaveBeenCalled()
    expect(f.pty.write).not.toHaveBeenCalled()
  })

  it('refuses send() while connecting, as a WebSocket does', () => {
    const { socket } = openSocket()
    expect(() => socket.send('x')).toThrow()
  })

  it.each([
    [{ type: 'exit', code: 0 } as PtyEnd, 1000],
    [{ type: 'exit', code: 1 } as PtyEnd, 4001],
    [{ type: 'exit', code: 127 } as PtyEnd, 4127],
    [{ type: 'signal', signal: 9, coreDumped: false } as PtyEnd, 4137],
    [{ type: 'lost' } as PtyEnd, 1006]
  ])('closes with tt-backend\'s code when the shell ends: %j → %i', async (end, code) => {
    const { socket, events, f } = openSocket()
    await settle()
    f.end(end)
    await settle()
    expect(socket.readyState).toBe(WebSocket.CLOSED)
    expect(events.at(-1)).toMatchObject({ type: 'close', target: socket, code })
  })

  it('delivers the last output before the close event', async () => {
    const { events, f } = openSocket()
    await settle()
    f.push('bye\r\n')
    f.end({ type: 'exit', code: 0 })
    await settle()
    expect(events.map(e => e.type)).toEqual(['open', 'message', 'close'])
  })

  it('close() hangs up the pty and reports the code it was given', async () => {
    const { socket, events, f } = openSocket()
    await settle()
    socket.close(4300, 'session_stopped')
    expect(socket.readyState).toBe(WebSocket.CLOSING)
    await settle()
    expect(f.pty.close).toHaveBeenCalled()
    expect(socket.readyState).toBe(WebSocket.CLOSED)
    expect(events.at(-1)).toMatchObject({ type: 'close', code: 4300, reason: 'session_stopped' })
  })

  it('close() without a code reports 1005, as a WebSocket does', async () => {
    const { socket, events } = openSocket()
    await settle()
    socket.close()
    await settle()
    expect(events.at(-1)).toMatchObject({ type: 'close', code: 1005 })
  })

  it('close() while connecting closes at once and hangs up the pty that arrives later', async () => {
    const f = fakePty()
    const pty = deferred<ConsolePty>()
    const socket = new LocalConsoleSocket(() => pty.promise, () => Promise.resolve())
    const onopen = vi.fn()
    const onclose = vi.fn()
    socket.onopen = onopen
    socket.onclose = onclose
    socket.close()
    await settle()
    expect(socket.readyState).toBe(WebSocket.CLOSED)
    expect(onclose).toHaveBeenCalledTimes(1)
    pty.resolve(f.pty)
    await settle()
    expect(f.pty.close).toHaveBeenCalled()
    expect(onopen).not.toHaveBeenCalled()
    expect(onclose).toHaveBeenCalledTimes(1)
  })

  it('a machine that fails to start gives error, then close 1006 with the reason', async () => {
    const socket = new LocalConsoleSocket(() => Promise.reject(new Error('no JSPI')), () => Promise.resolve())
    const seen: string[] = []
    socket.onerror = (e) => seen.push(`error:${e.target === socket}`)
    socket.onclose = (e) => seen.push(`close:${e.code}:${e.reason}`)
    await settle()
    expect(seen).toEqual(['error:true', 'close:1006:no JSPI'])
    expect(socket.readyState).toBe(WebSocket.CLOSED)
  })

  it('a pty that fails gives error, then close 1006', async () => {
    const failing = fakePty()
    const socket = new LocalConsoleSocket(() => Promise.resolve({
      ...failing.pty,
      ended: Promise.reject(new Error('EPROTO'))
    }), () => Promise.resolve())
    const seen: string[] = []
    socket.onerror = () => seen.push('error')
    socket.onclose = (e) => seen.push(`close:${e.code}`)
    await settle()
    failing.end({ type: 'lost' })
    await settle()
    expect(seen).toEqual(['error', 'close:1006'])
  })
})
