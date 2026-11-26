/**
 * A scenario that offers apps shows unkernel's desktop page: its URL carries
 * the run's apps, the platform's image and Debian mirror, and nothing that
 * would let the machine reach another host.
 */
import { describe, it, expect } from 'vitest'
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
    // The learner's terminal never hides itself, and the kernel leaves the
    // page's thread alone, as a console machine's does.
    expect(q.get('autohide')).toBe('0')
    expect(q.get('worker')).toBe('1')
  })

  it('switches the page\'s network off without our Wisp server, mirror or not', () => {
    const net = { kind: 'net', backend: { kind: 'wisp', routes: { 'deb.debian.org': '/m' } } } as never
    const q = query(desktopPageUrl(['python'], { distroUrl: '/d.erofs', worker: false, net }))
    expect(q.get('net')).toBe('0')
    expect(q.get('wisp')).toBeNull()
    expect(q.get('debmirror')).toBeNull()
    expect(q.get('worker')).toBe('0')
  })

  it('switches the page\'s network off when the machine has none', () => {
    const q = query(desktopPageUrl(['python'], { distroUrl: 'https://cdn.example.org/debian.erofs', worker: true }))
    expect(q.get('net')).toBe('0')
    expect(q.get('image')).toBe('https://cdn.example.org/debian.erofs')
  })
})

describe('the desktop\'s learner terminal', () => {
  it('gets the foreground script in its console, where the learner\'s shell runs', async () => {
    const sent: [number, string][] = []
    await desktopShell({ select: () => true, send: (n, data) => { sent.push([n, data]) } }).write('echo PRET\n')
    expect(sent).toEqual([[0, 'echo PRET\n']])
  })
})
