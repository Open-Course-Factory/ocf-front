/**
 * A pty of a machine running in the learner's browser, behind the part of the
 * WebSocket surface TerminalViewer uses. The viewer then drives a local
 * machine exactly as it drives an Incus console: the same handlers, the same
 * binary resize frames, and the close codes tt-backend sends for the same
 * events (api_session_console.go, execCloseCode).
 */

/** How the shell ended, as unkernel's Pty reports it. */
export type PtyEnd =
  | { type: 'exit'; code: number }
  | { type: 'signal'; signal: number; coreDumped: boolean }
  | { type: 'closed' }
  | { type: 'lost' }

/** The part of unkernel's Pty this socket needs. */
export interface ConsolePty {
  readonly output: ReadableStream<Uint8Array>
  write(data: string | Uint8Array): Promise<void>
  resize(cols: number, rows: number): void
  close(): Promise<void>
  readonly ended: Promise<PtyEnd>
}

const NORMAL_CLOSURE = 1000
const NO_STATUS = 1005
const ABNORMAL_CLOSURE = 1006

// tt-backend closes with 4000 + the shell's exit status, and a shell killed by
// signal N exits 128 + N: a SIGKILLed shell is 4137, which the viewer reads as
// a crash trap.
function closeCodeFor(end: PtyEnd, requested: number | undefined): number {
  switch (end.type) {
    case 'exit': return end.code === 0 ? NORMAL_CLOSURE : Math.min(4000 + end.code, 4999)
    case 'signal': return 4000 + 128 + end.signal
    case 'closed': return requested ?? NO_STATUS
    case 'lost': return ABNORMAL_CLOSURE
  }
}

function parseResize(data: ArrayBuffer | ArrayBufferView): { cols: number; rows: number } | null {
  const bytes = data instanceof ArrayBuffer
    ? new Uint8Array(data)
    : new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
  try {
    const msg = JSON.parse(new TextDecoder().decode(bytes))
    if (msg?.type !== 'resize') return null
    const { cols, rows } = msg
    if (!Number.isInteger(cols) || !Number.isInteger(rows) || cols < 1 || rows < 1) return null
    return { cols, rows }
  } catch {
    return null
  }
}

// A macrotask without setTimeout's 4 ms clamp: lets the page paint and handle
// keys between two chunks of output.
function nextTask(): Promise<void> {
  return new Promise(resolve => {
    const channel = new MessageChannel()
    channel.port1.onmessage = () => { channel.port1.close(); resolve() }
    channel.port2.postMessage(null)
  })
}

type Handler<E extends Event> = ((this: LocalConsoleSocket, ev: E) => unknown) | null

export class LocalConsoleSocket {
  static readonly CONNECTING = 0
  static readonly OPEN = 1
  static readonly CLOSING = 2
  static readonly CLOSED = 3

  readyState: number = LocalConsoleSocket.CONNECTING
  // Output is always delivered as text; kept for the viewer, which sets it.
  binaryType: BinaryType = 'blob'
  onopen: Handler<Event> = null
  onmessage: Handler<MessageEvent> = null
  onclose: Handler<CloseEvent> = null
  onerror: Handler<Event> = null

  private pty: ConsolePty | null = null
  private requestedCode: number | undefined
  private requestedReason = ''

  /**
   * @param openPty starts the shell; its rejection is a connection that failed.
   * @param yieldToPage awaited after each chunk of output before the next is read.
   *   Not reading is what holds the guest back: the pty's output is a pull
   *   stream, so a runaway program blocks instead of flooding the page.
   */
  constructor(openPty: () => Promise<ConsolePty>, private readonly yieldToPage: () => Promise<void> = nextTask) {
    openPty().then(pty => this.start(pty), err => this.fail(err))
  }

  // Vue makes a plain class instance reactive when it is stored in a ref, and
  // the viewer drops events whose target is not `socket.value`: a proxy would
  // never match. A non-plain type keeps the instance raw, like a WebSocket.
  get [Symbol.toStringTag]() {
    return 'WebSocket'
  }

  send(data: string | ArrayBuffer | ArrayBufferView): void {
    if (this.readyState === LocalConsoleSocket.CONNECTING) {
      throw new DOMException('Still in CONNECTING state.', 'InvalidStateError')
    }
    if (this.readyState !== LocalConsoleSocket.OPEN || !this.pty) return
    if (typeof data === 'string') {
      this.pty.write(data).catch(() => { /* `ended` reports a broken pty */ })
      return
    }
    if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
      const size = parseResize(data)
      if (size) this.pty.resize(size.cols, size.rows)
    }
  }

  close(code?: number, reason?: string): void {
    if (this.readyState === LocalConsoleSocket.CLOSING || this.readyState === LocalConsoleSocket.CLOSED) return
    const connecting = this.readyState === LocalConsoleSocket.CONNECTING
    this.readyState = LocalConsoleSocket.CLOSING
    this.requestedCode = code
    this.requestedReason = reason ?? ''
    if (connecting) {
      // The machine may never start (a boot that hangs): close now; start()
      // hangs up a pty that still arrives.
      queueMicrotask(() => this.finish(code ?? NO_STATUS, this.requestedReason))
      return
    }
    this.pty?.close().catch(() => { /* `ended` settles either way */ })
  }

  private start(pty: ConsolePty) {
    if (this.readyState !== LocalConsoleSocket.CONNECTING) {
      pty.close().catch(() => {})
      return
    }
    this.pty = pty
    this.readyState = LocalConsoleSocket.OPEN
    this.fire('open', new Event('open'))
    const reading = this.pump(pty.output)
    pty.ended.then(
      async end => {
        await reading
        this.finish(closeCodeFor(end, this.requestedCode), end.type === 'closed' ? this.requestedReason : '')
      },
      async () => {
        await reading
        this.fire('error', new Event('error'))
        this.finish(ABNORMAL_CLOSURE, '')
      }
    )
  }

  private async pump(output: ReadableStream<Uint8Array>) {
    const reader = output.getReader()
    const decoder = new TextDecoder()
    try {
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        const text = decoder.decode(value, { stream: true })
        if (text && this.readyState === LocalConsoleSocket.OPEN) {
          this.fire('message', new MessageEvent('message', { data: text }))
        }
        await this.yieldToPage()
      }
    } catch {
      // The pty failed: `ended` rejects too and reports it.
    }
  }

  // Events carry the socket as `target`, as a WebSocket's do.
  private fire(type: 'open' | 'message' | 'close' | 'error', ev: Event) {
    Object.defineProperty(ev, 'target', { value: this })
    const handler = this[`on${type}`] as Handler<Event>
    handler?.call(this, ev)
  }

  private fail(err: unknown) {
    // Closed while connecting: the close event is already on its way.
    if (this.readyState !== LocalConsoleSocket.CONNECTING) return
    this.fire('error', new Event('error'))
    this.finish(ABNORMAL_CLOSURE, err instanceof Error ? err.message : String(err))
  }

  private finish(code: number, reason: string) {
    if (this.readyState === LocalConsoleSocket.CLOSED) return
    this.readyState = LocalConsoleSocket.CLOSED
    this.fire('close', new CloseEvent('close', { code, reason, wasClean: code !== ABNORMAL_CLOSURE }))
  }
}
