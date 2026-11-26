/**
 * A scenario that offers apps shows unkernel's desktop page: its URL carries
 * the run's apps, the platform's image and Debian mirror, and nothing that
 * would let the machine reach another host.
 */
import { describe, it, expect, vi } from 'vitest'
import { debianMirrorNet, desktopPageUrl, desktopShell } from '../../src/services/domain/terminal/localMachine'

const query = (url: string) => new URL(url, window.location.origin).searchParams

describe('the desktop page URL', () => {
  it('gives the page the run\'s apps, our image and only our Debian mirror', () => {
    const net = debianMirrorNet('local-t1', 'key-1')
    const q = query(desktopPageUrl(['python', 'nvim'], { distroUrl: '/local-machine/debian.erofs', worker: true, net }))
    expect(q.get('apps')).toBe('python,nvim')
    expect(q.get('image')).toBe(`${window.location.origin}/local-machine/debian.erofs`)
    expect(q.get('debmirror')).toBe(`${window.location.origin}/local-machine/apt/local-t1/key-1`)
    expect(q.get('wisp')).toMatch(/\/local-machine\/no-wisp\/$/)
    expect(q.get('data')).toBe('0')
    expect(q.get('autosuspend')).toBe('0')
  })

  it('switches the page\'s network off when the machine has none', () => {
    const q = query(desktopPageUrl(['python'], { distroUrl: 'https://cdn.example.org/debian.erofs', worker: true }))
    expect(q.get('net')).toBe('0')
    expect(q.get('image')).toBe('https://cdn.example.org/debian.erofs')
  })
})

describe('the desktop\'s learner terminal', () => {
  function terminals(open: number[]) {
    const sent: [number, string][] = []
    return {
      sent,
      api: {
        list: () => [0, ...open].map(n => ({ n })),
        open: vi.fn(async () => { open.push(7); return { n: 7 } }),
        select: vi.fn(() => true),
        send: (n: number, data: string) => { sent.push([n, data]) }
      }
    }
  }

  it('gets the foreground script in the first terminal, never the page\'s boot console', async () => {
    const t = terminals([3, 1])
    await desktopShell(t.api).write('echo PRET\n')
    expect(t.sent).toEqual([[1, 'echo PRET\n']])
    expect(t.api.open).not.toHaveBeenCalled()
  })

  it('is opened again when the learner closed every terminal', async () => {
    const t = terminals([])
    await desktopShell(t.api).write('echo PRET\n')
    expect(t.api.open).toHaveBeenCalledWith({ select: false })
    expect(t.sent).toEqual([[7, 'echo PRET\n']])
  })
})
