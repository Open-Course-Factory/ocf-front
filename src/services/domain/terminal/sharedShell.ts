/**
 * The learner's shell on a local machine: one per run, as a container's console
 * reattaches to the same shell. Consoles attach to it (the run page's, a
 * popped-out window's) and detach without ending it, so the working
 * directory, the variables and what runs stay. An attaching console is first
 * shown what the shell printed recently, so its screen comes back.
 *
 * Output is read from the shell only when the attached console asks for
 * more, as a console reads its own pty: a runaway program waits for the
 * screen, and Ctrl-C stops it at once.
 */
import type { ConsolePty, PtyEnd } from './localConsoleSocket'

const KEEP_BYTES = 64 * 1024

interface View {
  pty: ConsolePty
  detach(end: PtyEnd): void
}

export class SharedShell {
  private shell: Promise<ConsolePty> | null = null
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null
  private reading: Promise<boolean> | null = null
  // The latest output, and the stream offset just past it.
  private recent = new Uint8Array(0)
  private printed = 0
  private current: View | null = null
  // How the last shell ended, for its console once it has shown everything.
  private shellEnd: PtyEnd = { type: 'lost' }

  constructor(
    private readonly spawn: (cols: number, rows: number) => Promise<ConsolePty>,
    private readonly keep = KEEP_BYTES
  ) {}

  /** A console on the shell, started at this size if there is none yet. */
  async attach(cols: number, rows: number): Promise<ConsolePty> {
    const shell = await this.shellOf(cols, rows)
    shell.resize(cols, rows)
    this.current?.detach({ type: 'closed' })
    const view = this.viewOf(shell)
    this.current = view
    return view.pty
  }

  private shellOf(cols: number, rows: number): Promise<ConsolePty> {
    if (!this.shell) {
      const starting = this.spawn(cols, rows)
      this.shell = starting
      starting.then(pty => {
        this.recent = new Uint8Array(0)
        this.reader = pty.output.getReader()
        pty.ended.then(end => this.ended(starting, end), () => this.ended(starting, { type: 'lost' }))
      }, () => { if (this.shell === starting) this.shell = null })
    }
    return this.shell
  }

  // The shell is gone (exit, a lost machine): its console shows what is left
  // of its output, then ends the same way. The next console gets a new shell.
  private ended(shell: Promise<ConsolePty>, end: PtyEnd) {
    if (this.shell !== shell) return
    this.shell = null
    this.shellEnd = end
  }

  // Reads the shell's next chunk once, whichever console asked: true when
  // there is more to show, false when the shell's output is over.
  private readMore(): Promise<boolean> {
    const reader = this.reader
    if (!reader) return Promise.resolve(false)
    this.reading ??= reader.read().then(({ value, done }) => {
      this.reading = null
      if (done) return false
      if (value) this.remember(value)
      return true
    }, () => { this.reading = null; return false })
    return this.reading
  }

  private remember(chunk: Uint8Array) {
    const joined = new Uint8Array(this.recent.length + chunk.length)
    joined.set(this.recent)
    joined.set(chunk, this.recent.length)
    this.recent = joined.length > this.keep ? joined.slice(joined.length - this.keep) : joined
    this.printed += chunk.length
  }

  private viewOf(shell: ConsolePty): View {
    let detached = false
    let finish!: (end: PtyEnd) => void
    const ended = new Promise<PtyEnd>(resolve => { finish = resolve })
    // Starts with what is kept, then follows the shell.
    let shown = this.printed - this.recent.length

    const output = new ReadableStream<Uint8Array>({
      pull: async controller => {
        for (;;) {
          if (detached) return controller.close()
          const unseen = this.printed - shown
          if (unseen > 0) {
            controller.enqueue(this.recent.slice(Math.max(0, this.recent.length - unseen)))
            shown = this.printed
            return
          }
          if (!await this.readMore() && this.printed === shown) {
            controller.close()
            return view.detach(this.shellEnd)
          }
        }
      }
    }, { highWaterMark: 0 })

    const view: View = {
      detach: end => {
        if (detached) return
        detached = true
        if (this.current === view) this.current = null
        finish(end)
      },
      pty: {
        output,
        ended,
        write: data => detached ? Promise.resolve() : shell.write(data),
        resize: (cols, rows) => { if (!detached) shell.resize(cols, rows) },
        close: async () => view.detach({ type: 'closed' })
      }
    }
    return view
  }
}
