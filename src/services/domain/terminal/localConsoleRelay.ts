/**
 * A shell on a local run's machine, for a window other than the tab that runs
 * it: a popped-out terminal. The machine lives in the run page's tab, which
 * serves shells over a same-origin BroadcastChannel named after the terminal;
 * the window gets a ConsolePty backed by that channel, so its console is the
 * same LocalConsoleSocket as the page's.
 *
 * Output travels one chunk per request: the window asks for the next chunk
 * when its screen has shown the last, as the page's console reads its pty.
 */
import type { ConsolePty, PtyEnd } from './localConsoleSocket'

/** The reason a window's console fails when no tab has the run's machine. */
export const RELAY_NO_MACHINE = 'no_machine_in_this_browser'

const OPEN_WAIT_MS = 5000

type ToTab =
  | { t: 'open'; id: string; cols: number; rows: number }
  | { t: 'input'; id: string; data: string | Uint8Array }
  | { t: 'resize'; id: string; cols: number; rows: number }
  | { t: 'pull'; id: string }
  | { t: 'close'; id: string }

type ToWindow =
  | { t: 'opened'; id: string }
  | { t: 'data'; id: string; bytes: Uint8Array }
  | { t: 'end'; id: string; end: PtyEnd }

const channelOf = (terminal: string) => new BroadcastChannel(`ocf-local-console:${terminal}`)

/**
 * Tab side: serves shells of terminal's machine to other windows. open gives
 * a shell, or null when this tab does not run the machine (it stays silent,
 * so another tab may answer). Returns stop, which ends every served shell.
 */
export function serveRelay(terminal: string, open: (cols: number, rows: number) => Promise<ConsolePty> | null): () => void {
  const channel = channelOf(terminal)
  const served = new Map<string, { pty: ConsolePty; reader: ReadableStreamDefaultReader<Uint8Array> }>()
  const send = (msg: ToWindow) => channel.postMessage(msg)

  channel.onmessage = async ({ data: msg }: MessageEvent<ToTab>) => {
    if (msg.t === 'open') {
      const opening = open(msg.cols, msg.rows)
      if (!opening) return
      const pty = await opening
      served.set(msg.id, { pty, reader: pty.output.getReader() })
      pty.ended.then(end => {
        if (served.delete(msg.id)) send({ t: 'end', id: msg.id, end })
      })
      send({ t: 'opened', id: msg.id })
      return
    }
    const shell = served.get(msg.id)
    if (!shell) return
    switch (msg.t) {
      case 'input': shell.pty.write(msg.data).catch(() => {}); break
      case 'resize': shell.pty.resize(msg.cols, msg.rows); break
      case 'close': shell.pty.close().catch(() => {}); break
      case 'pull': {
        const { value, done } = await shell.reader.read().catch(() => ({ value: undefined, done: true }))
        // On done, `ended` sends the end with its reason.
        if (!done && value) send({ t: 'data', id: msg.id, bytes: value })
      }
    }
  }

  const stop = () => {
    for (const [id, shell] of served) {
      send({ t: 'end', id, end: { type: 'lost' } })
      shell.pty.close().catch(() => {})
    }
    served.clear()
    channel.close()
    window.removeEventListener('pagehide', stop)
  }
  // A closed tab takes the machine with it: the windows are told.
  window.addEventListener('pagehide', stop)
  return stop
}

/**
 * Window side: a shell of terminal's machine, from the tab that runs it.
 * Rejects with RELAY_NO_MACHINE when no tab answers within waitMs.
 */
export function relayedPty(terminal: string, cols: number, rows: number, waitMs = OPEN_WAIT_MS): Promise<ConsolePty> {
  const channel = channelOf(terminal)
  const id = crypto.randomUUID()
  const send = (msg: ToTab) => channel.postMessage(msg)

  let finish!: (end: PtyEnd) => void
  const ended = new Promise<PtyEnd>(resolve => { finish = resolve })
  let chunk: ((msg: ToWindow) => void) | null = null
  let opened!: () => void

  const output = new ReadableStream<Uint8Array>({
    pull: controller => new Promise<void>(resolve => {
      chunk = msg => {
        if (msg.t === 'data') controller.enqueue(msg.bytes)
        else controller.close()
        resolve()
      }
      send({ t: 'pull', id })
    })
  }, { highWaterMark: 0 })

  let over = false
  const end = (reason: PtyEnd) => {
    if (over) return
    over = true
    chunk?.({ t: 'end', id, end: reason })
    channel.close()
    finish(reason)
  }

  channel.onmessage = ({ data: msg }: MessageEvent<ToWindow>) => {
    if (msg.id !== id) return
    if (msg.t === 'opened') opened()
    else if (msg.t === 'data') { const take = chunk; chunk = null; take?.(msg) }
    else end(msg.end)
  }

  const pty: ConsolePty = {
    output,
    ended,
    write: async data => { if (!over) send({ t: 'input', id, data }) },
    resize: (c, r) => { if (!over) send({ t: 'resize', id, cols: c, rows: r }) },
    close: async () => {
      if (!over) send({ t: 'close', id })
      end({ type: 'closed' })
    }
  }

  return new Promise<ConsolePty>((resolve, reject) => {
    const timer = setTimeout(() => {
      channel.close()
      reject(new Error(RELAY_NO_MACHINE))
    }, waitMs)
    opened = () => { clearTimeout(timer); resolve(pty) }
    send({ t: 'open', id, cols, rows })
  })
}
