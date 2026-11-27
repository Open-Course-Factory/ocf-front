/**
 * A scenario that offers apps shows unkernel's desktop page: its URL carries
 * the run's apps, the platform's image and Debian mirror, and nothing that
 * would let the machine reach another host.
 */
import { describe, it, expect, vi } from 'vitest'
import { consoleKernelOptions, debianMirrorNet, desktopFrames, desktopLearnerTerminal, desktopPageUrl, desktopShell, setConsoleUser } from '../../src/services/domain/terminal/localMachine'

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
    // unkernel's own memory without one from the run.
    expect(q.get('mem')).toBeNull()
  })

  it('gives the page the run\'s memory', () => {
    const q = query(desktopPageUrl([], { distroUrl: '/d.erofs', worker: true }, { memoryMiB: 1024 }))
    expect(q.get('mem')).toBe('1024')
  })

  it('gives the page the run\'s CPUs and boot settings', () => {
    const boot = { jit: false, verbose: true, display: true, sound: false, append: 'console=hvc0 quiet', console_hidden: true }
    const q = query(desktopPageUrl([], { distroUrl: '/d.erofs', worker: true }, { cpus: 2, boot }))
    expect(q.get('cpus')).toBe('2')
    expect(q.get('jit')).toBe('0')
    expect(q.get('verbose')).toBe('1')
    expect(q.get('display')).toBe('1')
    expect(q.get('sound')).toBe('0')
    expect(q.get('autohide')).toBe('1')
    expect(q.get('append')).toBe('console=hvc0 quiet')
  })

  it('gives an empty command line, so the page keeps the kernel\'s own over any it saved', () => {
    const boot = { jit: true, verbose: false, display: true, sound: true, append: '', console_hidden: false }
    const q = query(desktopPageUrl([], { distroUrl: '/d.erofs', worker: true }, { boot }))
    expect(q.has('append')).toBe(true)
    expect(q.get('append')).toBe('')
    expect(q.get('autohide')).toBe('0')
    expect(q.get('jit')).toBe('1')
  })

  it('gives unkernel\'s defaults for a run without CPUs or boot settings (an older ocf-core)', () => {
    const q = query(desktopPageUrl([], { distroUrl: '/d.erofs', worker: true }))
    expect(Object.fromEntries(['cpus', 'jit', 'verbose', 'display', 'sound', 'autohide', 'append'].map(n => [n, q.get(n)])))
      .toEqual({ cpus: '1', jit: '1', verbose: '0', display: '1', sound: '1', autohide: '0', append: '' })
  })

  it('boots Debian on the overlay root, whatever this browser saved', () => {
    const q = query(desktopPageUrl([], { distroUrl: '/d.erofs', worker: true }))
    expect(q.get('distro')).toBe('debian')
    expect(q.has('root')).toBe(true)
    expect(q.get('root')).toBe('')
  })

  it('asks for no guest GL or Vulkan, which our page cannot render', () => {
    const q = query(desktopPageUrl([], { distroUrl: '/d.erofs', worker: true }))
    expect(q.get('gl')).toBe('0')
    expect(q.get('vk')).toBe('0')
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

describe('a console machine\'s boot options', () => {
  it('boots as before for a run without CPUs or boot settings (an older ocf-core)', () => {
    expect(consoleKernelOptions({ memoryMiB: 1024 })).toEqual({ memoryMiB: 1024 })
  })

  it('takes the JIT and the command line, and no more CPUs than the host has', () => {
    vi.spyOn(navigator, 'hardwareConcurrency', 'get').mockReturnValue(4)
    const boot = { jit: false, verbose: true, display: true, sound: true, append: 'console=hvc0', console_hidden: true }
    expect(consoleKernelOptions({ cpus: 8, boot })).toEqual({ cpus: 4, jit: false, cmdline: 'console=hvc0' })
    expect(consoleKernelOptions({ cpus: 2, boot: { ...boot, append: '' } })).toEqual({ cpus: 2, jit: false })
    vi.restoreAllMocks()
  })
})

describe('the desktop\'s learner terminal', () => {
  it('gets the foreground script', async () => {
    const sent: [number, string][] = []
    await desktopShell({ send: (n, data) => { sent.push([n, data]) } }, 3).write('echo PRET\n')
    expect(sent).toEqual([[3, 'echo PRET\n']])
  })
})

describe('the learner\'s terminal on a desktop', () => {
  // A desktop page whose KW.windows opens terminals 1, 2… as asked.
  function desktop(terminal: string) {
    const terms: { n: number, state: string }[] = [{ n: 0, state: 'open' }]
    const windows = {
      list: () => terms,
      open: vi.fn(async () => { const t = { n: terms.length, state: 'open' }; terms.push(t); return t }),
      select: () => true,
      send: () => {}
    }
    desktopFrames.set(terminal, { contentWindow: { KW: { windows } } } as unknown as HTMLIFrameElement)
    return { terms, windows }
  }

  it('is a login shell of the run\'s user, opened once', async () => {
    const { windows } = desktop('local-u1')
    setConsoleUser('local-u1', 1000)
    expect(await desktopLearnerTerminal('local-u1')).toBe(1)
    expect(await desktopLearnerTerminal('local-u1')).toBe(1)
    expect(windows.open).toHaveBeenCalledTimes(1)
    expect(windows.open).toHaveBeenCalledWith({ name: 'lab', select: true, file: '/usr/bin/sudo', args: ['-i', '-u', '#1000'] })
  })

  it('is root\'s without a run user, and opened again once the learner closed it', async () => {
    const { terms, windows } = desktop('local-u2')
    setConsoleUser('local-u2', undefined)
    expect(await desktopLearnerTerminal('local-u2')).toBe(1)
    expect(windows.open).toHaveBeenLastCalledWith(expect.objectContaining({ args: ['-i', '-u', 'root'] }))
    terms[1].state = 'ended'
    expect(await desktopLearnerTerminal('local-u2')).toBe(2)
  })
})
