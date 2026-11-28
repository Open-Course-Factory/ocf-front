/**
 * A pty of a machine in the browser whose output a test feeds chunk by
 * chunk, counting how often its reader pulls, and whose end the test decides.
 */
import { vi } from 'vitest'
import type { ConsolePty, PtyEnd } from '../../src/services/domain/terminal/localConsoleSocket'

const enc = new TextEncoder()

export function fakePty() {
  let controller!: ReadableStreamDefaultController<Uint8Array>
  let resolveEnded!: (end: PtyEnd) => void
  const ended = new Promise<PtyEnd>(r => { resolveEnded = r })
  let pulls = 0
  const pty = {
    output: new ReadableStream<Uint8Array>({
      start(c) { controller = c },
      pull() { pulls++ }
    }, { highWaterMark: 0 }),
    write: vi.fn().mockResolvedValue(undefined),
    resize: vi.fn(),
    close: vi.fn(async () => {
      resolveEnded({ type: 'closed' })
      try { controller.close() } catch { /* already closed */ }
    }),
    ended
  } satisfies ConsolePty
  return {
    pty,
    push: (text: string | Uint8Array) => controller.enqueue(typeof text === 'string' ? enc.encode(text) : text),
    end: (end: PtyEnd) => { controller.close(); resolveEnded(end) },
    get pulls() { return pulls }
  }
}
